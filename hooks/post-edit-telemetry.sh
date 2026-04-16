#!/usr/bin/env bash
# ProductionOS PostToolUse — log edit telemetry (project-scoped)
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
      # C-1 fix: Use jq for safe JSON construction; M-1 fix: log basename + full path
      FILE_BASE=$(basename "$FILE_PATH" 2>/dev/null || echo "unknown")
      if command -v jq >/dev/null 2>&1; then
        jq -cn --arg event "edit" --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg file "$FILE_BASE" --arg path "$FILE_PATH" \
          '{event: $event, ts: $ts, file: $file, path: $path}' >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
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
        jq -cn --arg event "cross_repo_edit" --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg file "$FILE_BASE" --arg proj "$PROJ_BASE" \
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
    jq -cn --arg event "edit" --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg file "$FILE_BASE" \
      '{event: $event, ts: $ts, file: $file}' >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
  else
    SAFE_FILE=$(printf '%s' "$FILE_BASE" | tr -cd '[:alnum:]._/-')
    printf '{"event":"edit","ts":"%s","file":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$SAFE_FILE" >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
  fi
fi

# Churn warning: check if this file is a hot file from cross-session patterns
# Only for files within the active project (scope guard)
HOT_FILES_CACHE="$STATE_DIR/instincts/learned/hot-files-cache.json"
if [ -n "$FILE_PATH" ] && [ -n "$ACTIVE_PROJECT" ] && \
   [[ "$FILE_PATH" == "$ACTIVE_PROJECT"/* ]] && \
   [ -f "$HOT_FILES_CACHE" ] && command -v python3 >/dev/null 2>&1; then
  # Emit JSON via json.dumps from Python to prevent shell injection
  python3 -c "
import json, sys, os
try:
    with open(sys.argv[1]) as f:
        cache = json.load(f)
    hot = cache.get('hot_files', {})
    if not isinstance(hot, dict):
        sys.exit(0)
    fp = sys.argv[2]
    count = hot.get(fp, 0)
    if isinstance(count, (int, float)) and count >= 5:
        name = os.path.basename(fp)
        msg = f'High-churn file: {name} ({int(count)} modifications across sessions). Consider refactoring.'
        print(json.dumps({'additionalContext': msg}))
except Exception:
    pass
" "$HOT_FILES_CACHE" "$FILE_PATH" 2>/dev/null || true
fi
