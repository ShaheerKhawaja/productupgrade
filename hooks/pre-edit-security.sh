#!/usr/bin/env bash
# ProductionOS PreToolUse — security advisory on sensitive file edits
set -euo pipefail
# Resolve plugin root — works for both marketplace install and git clone
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"

INPUT=$(cat)
STATE_DIR="${PRODUCTIONOS_HOME:-$HOME/.productionos}"

FILE_PATH=$(printf '%s' "$INPUT" | python3 -c "
import sys, json
try:
    data = json.loads(sys.stdin.read())
    ti = data.get('tool_input', {})
    print(ti.get('file_path', ''))
except:
    print('')
" 2>/dev/null || true)

if [ -z "$FILE_PATH" ]; then
  echo '{}'
  exit 0
fi

BASENAME=$(basename "$FILE_PATH" 2>/dev/null || echo "")
LOWERNAME=$(echo "$BASENAME" | tr '[:upper:]' '[:lower:]')

SECURITY_PATTERNS=("auth" "payment" "admin" "secret" "credential" "password" "token" ".env" "key" "cert")

MATCHED=""
for pattern in "${SECURITY_PATTERNS[@]}"; do
  if echo "$LOWERNAME" | grep -qi "$pattern" 2>/dev/null; then
    MATCHED="$pattern"
    break
  fi
done

if [ -n "$MATCHED" ]; then
  mkdir -p "$STATE_DIR/analytics"
  # Include active project context for better observability
  ACTIVE_PROJECT_NAME=""
  if [ -f "$STATE_DIR/sessions/active-project" ]; then
    ACTIVE_PROJECT_NAME=$(basename "$(cat "$STATE_DIR/sessions/active-project" 2>/dev/null)" 2>/dev/null || echo "unknown")
  fi
  echo "{\"event\":\"security_edit\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"file\":\"$FILE_PATH\",\"pattern\":\"$MATCHED\",\"project\":\"$ACTIVE_PROJECT_NAME\"}" >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
  echo "{\"additionalContext\":\"ProductionOS Security [$ACTIVE_PROJECT_NAME]: Editing security-sensitive file ($MATCHED pattern in $BASENAME). Review before committing.\"}"
else
  echo '{}'
fi
