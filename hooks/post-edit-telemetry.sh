#!/usr/bin/env bash
# ProductionOS PostToolUse — log edit telemetry (project-scoped)
set -euo pipefail
# Resolve plugin root — works for both marketplace install and git clone
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
STATE_DIR="${PRODUCTIONOS_HOME:-$HOME/.productionos}"
mkdir -p "$STATE_DIR/analytics"

INPUT=$(cat)
FILE_PATH=$(printf '%s' "$INPUT" | python3 -c "
import sys, json
try:
    data = json.loads(sys.stdin.read())
    ti = data.get('tool_input', {})
    print(ti.get('file_path', ''))
except:
    print('')
" 2>/dev/null || true)

# Scope check: only log telemetry for active project edits
ACTIVE_PROJECT=""
if [ -f "$STATE_DIR/sessions/active-project" ]; then
  ACTIVE_PROJECT=$(cat "$STATE_DIR/sessions/active-project" 2>/dev/null || echo "")
fi

if [ -n "$ACTIVE_PROJECT" ] && [ -n "$FILE_PATH" ]; then
  case "$FILE_PATH" in
    "$ACTIVE_PROJECT"/*)
      # Within active project — log normally
      echo "{\"event\":\"edit\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"file\":\"$FILE_PATH\"}" >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
      ;;
    *)
      # Outside active project — log as cross-repo, skip normal telemetry
      echo "{\"event\":\"cross_repo_edit\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"file\":\"$FILE_PATH\",\"active_project\":\"$(basename "$ACTIVE_PROJECT")\"}" >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
      ;;
  esac
else
  # No active project — log everything (backwards compatible)
  echo "{\"event\":\"edit\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"file\":\"$FILE_PATH\"}" >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
fi
