#!/usr/bin/env bash
# ProductionOS PostToolUse — log bash command telemetry
set -euo pipefail

# === Binary availability (degrade gracefully if missing) ===
_HAS_BUN=$(command -v bun >/dev/null 2>&1 && echo "1" || echo "0")
_HAS_PYTHON=$(command -v python3 >/dev/null 2>&1 && echo "1" || echo "0")
_HAS_JQ=$(command -v jq >/dev/null 2>&1 && echo "1" || echo "0")
_LOG_DIR="${PRODUCTIONOS_HOME:-$HOME/.productionos}/logs"
mkdir -p "$_LOG_DIR" 2>/dev/null || true

_log_error() {
  local msg="$1"
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ERROR $(basename "$0"): $msg" >> "$_LOG_DIR/hook-errors.log" 2>/dev/null || true
}
# Resolve plugin root — works for both marketplace install and git clone
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
STATE_DIR="${PRODUCTIONOS_HOME:-$HOME/.productionos}"
mkdir -p "$STATE_DIR/analytics"

INPUT=$(cat)
COMMAND=$(printf '%s' "$INPUT" | python3 -c "
import sys, json
try:
    data = json.loads(sys.stdin.read())
    ti = data.get('tool_input', {})
    print(ti.get('command', '')[:200])
except:
    print('')
" 2>/dev/null || true)

# C-1 fix: Use jq to safely construct JSON (prevents injection via command content)
# H-1 fix: Log only the command name, not arguments (prevents secret leakage)
CMD_NAME=$(printf '%s' "$COMMAND" | head -1 | awk '{print $1}')
if command -v jq >/dev/null 2>&1; then
  jq -cn --arg event "bash" --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg cmd "$CMD_NAME" \
    '{event: $event, ts: $ts, cmd: $cmd}' >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
else
  # Fallback: sanitize by stripping quotes and special chars
  SAFE_CMD=$(printf '%s' "$CMD_NAME" | tr -cd '[:alnum:]._/-')
  printf '{"event":"bash","ts":"%s","cmd":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$SAFE_CMD" >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
fi
