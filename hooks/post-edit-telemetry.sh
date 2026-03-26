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
      # C-1 fix: Use jq for safe JSON construction; M-1 fix: log basename only
      FILE_BASE=$(basename "$FILE_PATH" 2>/dev/null || echo "unknown")
      if command -v jq >/dev/null 2>&1; then
        jq -n --arg event "edit" --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg file "$FILE_BASE" \
          '{event: $event, ts: $ts, file: $file}' >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
      else
        SAFE_FILE=$(printf '%s' "$FILE_BASE" | tr -cd '[:alnum:]._/-')
        printf '{"event":"edit","ts":"%s","file":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$SAFE_FILE" >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
      fi
      ;;
    *)
      # Outside active project — log as cross-repo
      FILE_BASE=$(basename "$FILE_PATH" 2>/dev/null || echo "unknown")
      PROJ_BASE=$(basename "$ACTIVE_PROJECT" 2>/dev/null || echo "unknown")
      if command -v jq >/dev/null 2>&1; then
        jq -n --arg event "cross_repo_edit" --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg file "$FILE_BASE" --arg proj "$PROJ_BASE" \
          '{event: $event, ts: $ts, file: $file, active_project: $proj}' >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
      else
        SAFE_FILE=$(printf '%s' "$FILE_BASE" | tr -cd '[:alnum:]._/-')
        SAFE_PROJ=$(printf '%s' "$PROJ_BASE" | tr -cd '[:alnum:]._/-')
        printf '{"event":"cross_repo_edit","ts":"%s","file":"%s","active_project":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$SAFE_FILE" "$SAFE_PROJ" >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
      fi
      ;;
  esac
else
  # No active project — log everything (backwards compatible)
  FILE_BASE=$(basename "$FILE_PATH" 2>/dev/null || echo "unknown")
  if command -v jq >/dev/null 2>&1; then
    jq -n --arg event "edit" --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg file "$FILE_BASE" \
      '{event: $event, ts: $ts, file: $file}' >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
  else
    SAFE_FILE=$(printf '%s' "$FILE_BASE" | tr -cd '[:alnum:]._/-')
    printf '{"event":"edit","ts":"%s","file":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$SAFE_FILE" >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
  fi
fi

# Churn warning: check if this file is a hot file from cross-session patterns
HOT_FILES_CACHE="$STATE_DIR/instincts/learned/hot-files-cache.json"
if [ -n "$FILE_PATH" ] && [ -f "$HOT_FILES_CACHE" ] && command -v python3 >/dev/null 2>&1; then
  CHURN_WARNING=$(python3 -c "
import json, sys, os
try:
    cache = json.load(open(sys.argv[1]))
    hot = cache.get('hot_files', {})
    fp = sys.argv[2]
    count = hot.get(fp, 0)
    if count >= 5:
        name = os.path.basename(fp)
        print(f'High-churn file: {name} ({count} modifications across sessions). Consider refactoring.')
except:
    pass
" "$HOT_FILES_CACHE" "$FILE_PATH" 2>/dev/null || true)
  if [ -n "$CHURN_WARNING" ]; then
    echo "{\"additionalContext\":\"$CHURN_WARNING\"}"
  fi
fi
