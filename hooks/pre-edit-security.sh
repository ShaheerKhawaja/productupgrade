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
  # C-1 fix: Use jq for safe JSON construction (prevents injection via file paths)
  if command -v jq >/dev/null 2>&1; then
    jq -n --arg event "security_edit" --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg file "$BASENAME" --arg pattern "$MATCHED" --arg proj "$ACTIVE_PROJECT_NAME" \
      '{event: $event, ts: $ts, file: $file, pattern: $pattern, project: $proj}' >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
    jq -n --arg ctx "ProductionOS Security [$ACTIVE_PROJECT_NAME]: Editing security-sensitive file ($MATCHED pattern in $BASENAME). Review before committing." \
      '{additionalContext: $ctx}'
  else
    SAFE_BASE=$(printf '%s' "$BASENAME" | tr -cd '[:alnum:]._/-')
    printf '{"event":"security_edit","ts":"%s","file":"%s","pattern":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$SAFE_BASE" "$MATCHED" >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
    printf '{"additionalContext":"ProductionOS Security: Editing security-sensitive file (%s pattern in %s). Review before committing."}\n' "$MATCHED" "$SAFE_BASE"
  fi
else
  echo '{}'
fi
