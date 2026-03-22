#!/usr/bin/env bash
# repo-boundary-guard.sh — PreToolUse hook that warns/blocks cross-repo edits
# Returns: {"decision":"allow"}, {"decision":"block","reason":"..."}, or {"additionalContext":"..."}
# - File edits to wrong repo → WARN (additionalContext)
# - Git commit/push/reset in wrong repo → BLOCK
# - Monorepo cross-subproject edits → ALLOW silently
# - No active project detected → ALLOW everything
set -euo pipefail

STATE_DIR="${PRODUCTIONOS_HOME:-$HOME/.productionos}"
INPUT=$(cat)

# 1. Read active project root
ACTIVE_PROJECT=""
if [ -f "$STATE_DIR/sessions/active-project" ]; then
  ACTIVE_PROJECT=$(cat "$STATE_DIR/sessions/active-project" 2>/dev/null || echo "")
fi

# If no active project detected (not in a git repo), allow everything
if [ -z "$ACTIVE_PROJECT" ]; then
  echo '{"decision":"allow"}'
  exit 0
fi

# 2. Extract tool name
TOOL_NAME=""
FILE_PATH=""

if command -v jq >/dev/null 2>&1; then
  TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null || echo "")
else
  # Fallback: detect tool name from JSON without jq
  case "$INPUT" in
    *\"Edit\"*|*\"Write\"*) TOOL_NAME="Edit" ;;
    *\"Bash\"*) TOOL_NAME="Bash" ;;
    *) echo '{"decision":"allow"}'; exit 0 ;;
  esac
fi

# 3. Extract file path based on tool type
if [ "$TOOL_NAME" = "Bash" ]; then
  # For Bash tool: check if it's a git operation in the wrong repo
  COMMAND=""
  if command -v jq >/dev/null 2>&1; then
    COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null || echo "")
  else
    COMMAND=$(printf '%s' "$INPUT" | python3 -c "
import sys, json
try:
    data = json.loads(sys.stdin.read())
    print(data.get('tool_input', {}).get('command', ''))
except:
    print('')
" 2>/dev/null || echo "")
  fi

  # Only care about git write operations
  if echo "$COMMAND" | grep -qE '^\s*(git\s+(commit|push|tag|reset|rebase|merge|stash\s+drop)|cd\s+)'; then
    # Check if command explicitly targets a different directory
    TARGET_DIR=""
    if echo "$COMMAND" | grep -qE '^\s*cd\s+'; then
      TARGET_DIR=$(echo "$COMMAND" | grep -oE 'cd\s+[^ ;|&]+' | head -1 | sed 's/^cd\s*//')
      # Expand ~ to home dir
      TARGET_DIR=$(echo "$TARGET_DIR" | sed "s|^~|$HOME|")
    fi

    # For git operations: check CWD or explicit -C path
    GIT_DIR=""
    if echo "$COMMAND" | grep -qE 'git\s+-C\s+'; then
      GIT_DIR=$(echo "$COMMAND" | grep -oE 'git\s+-C\s+[^ ]+' | head -1 | sed 's/git\s*-C\s*//')
    fi

    # Determine the repo this git command targets
    CHECK_DIR="${GIT_DIR:-${TARGET_DIR:-}}"
    if [ -n "$CHECK_DIR" ] && [ -d "$CHECK_DIR" ]; then
      CMD_GIT_ROOT=$(cd "$CHECK_DIR" && git rev-parse --show-toplevel 2>/dev/null || echo "")
      if [ -n "$CMD_GIT_ROOT" ] && [ "$CMD_GIT_ROOT" != "$ACTIVE_PROJECT" ]; then
        ACTIVE_NAME=$(basename "$ACTIVE_PROJECT")
        TARGET_NAME=$(basename "$CMD_GIT_ROOT")
        echo "{\"decision\":\"block\",\"reason\":\"REPO BOUNDARY: Git operation targets '$TARGET_NAME' but active project is '$ACTIVE_NAME'. This prevents accidental commits to the wrong repository. If intentional, explicitly switch projects first.\"}"
        exit 0
      fi
    fi
  fi

  # For non-git bash commands, allow
  echo '{"decision":"allow"}'
  exit 0
fi

# 4. For Edit/Write tools: extract file_path
if command -v jq >/dev/null 2>&1; then
  FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""' 2>/dev/null || echo "")
else
  FILE_PATH=$(printf '%s' "$INPUT" | python3 -c "
import sys, json
try:
    data = json.loads(sys.stdin.read())
    print(data.get('tool_input', {}).get('file_path', ''))
except:
    print('')
" 2>/dev/null || echo "")
fi

# No file path — allow (non-file operations)
if [ -z "$FILE_PATH" ]; then
  echo '{"decision":"allow"}'
  exit 0
fi

# 5. Resolve the file's git root
FILE_GIT_ROOT=""
if [ -e "$FILE_PATH" ]; then
  FILE_DIR=$(dirname "$FILE_PATH")
  FILE_GIT_ROOT=$(cd "$FILE_DIR" && git rev-parse --show-toplevel 2>/dev/null || echo "")
elif [ -d "$(dirname "$FILE_PATH")" ]; then
  # File doesn't exist yet (Write tool creating new file) — check parent dir
  FILE_GIT_ROOT=$(cd "$(dirname "$FILE_PATH")" && git rev-parse --show-toplevel 2>/dev/null || echo "")
fi

# 6. If file is not in any git repo (e.g., /tmp/), allow without warning
if [ -z "$FILE_GIT_ROOT" ]; then
  echo '{"decision":"allow"}'
  exit 0
fi

# 7. Compare git roots
if [ "$FILE_GIT_ROOT" != "$ACTIVE_PROJECT" ]; then
  # Check if this is a monorepo (cross-subproject edits are OK within same git root)
  IS_MONOREPO="false"
  if [ -f "$STATE_DIR/sessions/project-meta" ]; then
    # C-2 fix: Pass file path via sys.argv
    IS_MONOREPO=$(python3 -c "
import json, sys
try:
    print(str(json.load(open(sys.argv[1])).get('monorepo', False)).lower())
except:
    print('false')
" "$STATE_DIR/sessions/project-meta" 2>/dev/null || echo "false")
  fi

  # Monorepo: same git root is fine
  if [ "$IS_MONOREPO" = "true" ] && [ "$FILE_GIT_ROOT" = "$ACTIVE_PROJECT" ]; then
    echo '{"decision":"allow"}'
    exit 0
  fi

  ACTIVE_NAME=$(basename "$ACTIVE_PROJECT")
  TARGET_NAME=$(basename "$FILE_GIT_ROOT")
  # Log cross-repo edit event
  # C-1 fix: Use jq for safe JSON construction (prevents injection via repo names)
  if command -v jq >/dev/null 2>&1; then
    jq -n --arg event "cross_repo_edit" --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg file "$(basename "$FILE_PATH")" --arg target "$TARGET_NAME" --arg active "$ACTIVE_NAME" \
      '{event: $event, ts: $ts, file: $file, target_repo: $target, active_project: $active}' >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
    jq -n --arg ctx "REPO BOUNDARY WARNING: Editing file in '$TARGET_NAME' but active project is '$ACTIVE_NAME'. This edit will not be tracked in session telemetry. If intentional, continue." \
      '{additionalContext: $ctx}'
  else
    SAFE_TARGET=$(printf '%s' "$TARGET_NAME" | tr -cd '[:alnum:]._/-')
    SAFE_ACTIVE=$(printf '%s' "$ACTIVE_NAME" | tr -cd '[:alnum:]._/-')
    printf '{"event":"cross_repo_edit","ts":"%s","target_repo":"%s","active_project":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$SAFE_TARGET" "$SAFE_ACTIVE" >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
    printf '{"additionalContext":"REPO BOUNDARY WARNING: Editing file in %s but active project is %s. If intentional, continue."}\n' "$SAFE_TARGET" "$SAFE_ACTIVE"
  fi
  exit 0
fi

echo '{"decision":"allow"}'
