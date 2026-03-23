#!/usr/bin/env bash
# scope-enforcement.sh — PreToolUse hook that enforces file ownership during parallel agent waves
# Returns JSON: {"decision":"block","reason":"..."} or {"decision":"allow"}
#
# Addresses: GAP-01 (no enforcement), GAP-02 (Bash bypass), GAP-07 (git checkout),
# GAP-08 (git mv), GAP-10 (case sensitivity), GAP-11 (symlinks), GAP-20 (/tmp staging),
# GAP-22 (git apply/am)
set -euo pipefail

# ─── Fast Exit: No scope enforcement active ─────────────────
SCOPE_FILE="${PRODUCTIONOS_AGENT_SCOPE:-}"
if [ -z "$SCOPE_FILE" ] || [ ! -f "$SCOPE_FILE" ]; then
  echo '{"decision":"allow"}'
  exit 0
fi

# ─── Dependencies ───────────────────────────────────────────
if ! command -v jq >/dev/null 2>&1; then
  echo '{"decision":"block","reason":"Scope enforcement requires jq. Install: brew install jq"}'
  exit 0
fi

# ─── Parse Input ────────────────────────────────────────────
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null || echo "")
AGENT_ID=$(echo "$SCOPE_FILE" | grep -oE 'agent-[0-9]+' || echo "unknown")

# ─── Read Scope (cached in variable, not re-read per check) ─
SCOPE_DATA=$(cat "$SCOPE_FILE" 2>/dev/null || echo '{}')

# ─── Extract File Path Based on Tool ────────────────────────

check_file_access() {
  local FILE_PATH="$1"
  [ -z "$FILE_PATH" ] && return 0  # No path = allow

  # Resolve symlinks to prevent escape (GAP-11) — pure bash, no python3 dependency
  if [ -e "$FILE_PATH" ]; then
    local _resolved="$FILE_PATH"
    while [ -L "$_resolved" ]; do
      local _dir
      _dir=$(dirname "$_resolved")
      _resolved=$(readlink "$_resolved")
      # Handle relative symlink targets
      [[ "$_resolved" != /* ]] && _resolved="$_dir/$_resolved"
    done
    # Canonicalize remaining path components (.. etc)
    _resolved=$(cd "$(dirname "$_resolved")" 2>/dev/null && echo "$(pwd -P)/$(basename "$_resolved")")
    [ -n "$_resolved" ] && FILE_PATH="$_resolved"
  fi

  # Get relative path from project root
  local GIT_ROOT
  GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
  local REL_PATH="$FILE_PATH"
  if [ -n "$GIT_ROOT" ]; then
    REL_PATH="${FILE_PATH#"$GIT_ROOT/"}"
  fi

  # Case-insensitive comparison on macOS (GAP-10)
  local COMPARE_PATH="$REL_PATH"
  if [ "$(uname -s)" = "Darwin" ]; then
    COMPARE_PATH=$(echo "$REL_PATH" | tr '[:upper:]' '[:lower:]')
  fi

  # .productionos/ is always writable (output directory)
  if echo "$COMPARE_PATH" | grep -q '^\.productionos/'; then
    return 0
  fi

  # Check access using jq against scope data
  local RESULT
  RESULT=$(echo "$SCOPE_DATA" | jq -r --arg fp "$COMPARE_PATH" --arg rp "$REL_PATH" '
    # Check writable_files (exact match)
    if (.writable_files // [] | map(ascii_downcase) | index($fp | ascii_downcase)) then
      "allow"
    # Check readonly_files (exact match)
    elif (.readonly_files // [] | map(ascii_downcase) | index($fp | ascii_downcase)) then
      "readonly"
    # Check writable_dirs (prefix match)
    elif (.writable_dirs // [] | any(. as $d | ($fp | ascii_downcase) | startswith($d | ascii_downcase | if endswith("/") then . else . + "/" end))) then
      "allow"
    # Check readonly_dirs (prefix match)
    elif (.readonly_dirs // [] | any(. as $d | ($fp | ascii_downcase) | startswith($d | ascii_downcase | if endswith("/") then . else . + "/" end))) then
      "readonly"
    else
      "none"
    end
  ' 2>/dev/null || echo "block")

  if [ "$RESULT" = "allow" ]; then
    return 0
  fi

  # Build block message with integration-request instructions
  local BASENAME
  BASENAME=$(basename "$REL_PATH" | sed 's/\.[^.]*$//')
  local TS
  TS=$(date +%s)
  local REQ_PATH=".productionos/integration-requests/${BASENAME}-${TS}.json"
  local MODE_DESC="out of scope"
  [ "$RESULT" = "readonly" ] && MODE_DESC="readonly in this wave"

  local REASON
  REASON=$(cat <<ENDMSG
SCOPE BLOCKED: '${REL_PATH}' is ${MODE_DESC} for agent '${AGENT_ID}'.

To request this change during the integration phase, write a JSON file to:
  ${REQ_PATH}

With this exact format:
{
  "target_file": "${REL_PATH}",
  "action": "edit",
  "old_string": "the exact text you want to replace",
  "new_string": "the replacement text",
  "reason": "why this change is needed",
  "agentId": "${AGENT_ID}",
  "priority": 0,
  "groupId": null,
  "status": "complete"
}

Do NOT attempt to bypass via Bash, git checkout, mv, cp, or symlinks.
ENDMSG
)

  # Escape for JSON output
  local JSON_REASON
  JSON_REASON=$(echo "$REASON" | jq -Rs '.')
  echo "{\"decision\":\"block\",\"reason\":${JSON_REASON}}"
  exit 0
}

# ─── Tool-Specific Handling ─────────────────────────────────

case "$TOOL_NAME" in
  Edit|Write)
    FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""' 2>/dev/null || echo "")
    check_file_access "$FILE_PATH"
    ;;

  Bash)
    COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null || echo "")

    # Detect ALL write patterns in bash commands (GAP-02)
    # Pattern groups: redirects, file ops, git write ops

    # 1. Redirect writes: > file, >> file
    TARGET=""
    if echo "$COMMAND" | grep -qE '(>>?)\s+\S'; then
      TARGET=$(echo "$COMMAND" | grep -oE '(>>?)\s+\S+' | tail -1 | sed 's/^>>\?\s*//')
    fi

    # 2. tee writes
    if [ -z "$TARGET" ] && echo "$COMMAND" | grep -qE '\btee\b'; then
      TARGET=$(echo "$COMMAND" | grep -oE 'tee\s+(-a\s+)?\S+' | head -1 | awk '{print $NF}')
    fi

    # 3. sed -i (in-place edit) (GAP-02)
    if [ -z "$TARGET" ] && echo "$COMMAND" | grep -qE '\bsed\s+-i'; then
      TARGET=$(echo "$COMMAND" | grep -oE "sed\s+-i[^ ]*\s+'[^']*'\s+\S+" | head -1 | awk '{print $NF}')
      [ -z "$TARGET" ] && TARGET=$(echo "$COMMAND" | grep -oE 'sed\s+-i[^ ]*\s+"[^"]*"\s+\S+' | head -1 | awk '{print $NF}')
    fi

    # 4. cp/mv/rsync/install targeting files (GAP-20)
    if [ -z "$TARGET" ] && echo "$COMMAND" | grep -qE '\b(cp|mv|rsync|install)\b'; then
      TARGET=$(echo "$COMMAND" | grep -oE '\b(cp|mv|rsync|install)\s+(-[a-zA-Z]*\s+)*\S+\s+\S+' | head -1 | awk '{print $NF}')
    fi

    # 5. git checkout -- file / git restore file (GAP-07)
    if [ -z "$TARGET" ] && echo "$COMMAND" | grep -qE '\bgit\s+(checkout\s+--\s+|restore\s+)'; then
      TARGET=$(echo "$COMMAND" | grep -oE 'git\s+(checkout\s+--\s+|restore\s+)\S+' | head -1 | awk '{print $NF}')
    fi

    # 6. git mv (GAP-08)
    if [ -z "$TARGET" ] && echo "$COMMAND" | grep -qE '\bgit\s+mv\b'; then
      TARGET=$(echo "$COMMAND" | grep -oE 'git\s+mv\s+\S+\s+\S+' | head -1 | awk '{print $NF}')
    fi

    # 7. git apply / git am (GAP-22)
    if [ -z "$TARGET" ] && echo "$COMMAND" | grep -qE '\bgit\s+(apply|am)\b'; then
      # Can't determine target file — block entirely
      echo '{"decision":"block","reason":"SCOPE BLOCKED: git apply/am can modify arbitrary files. Use Edit tool for scoped changes."}'
      exit 0
    fi

    # 8. python/node/ruby write commands
    if [ -z "$TARGET" ] && echo "$COMMAND" | grep -qE "(python3?|node|ruby)\s+-[ce]\s.*open\(|write\(|writeFile"; then
      echo '{"decision":"block","reason":"SCOPE BLOCKED: Scripted file writes detected. Use Edit/Write tools for scoped changes."}'
      exit 0
    fi

    # 9. ln -s (symlink creation — GAP-11)
    if [ -z "$TARGET" ] && echo "$COMMAND" | grep -qE '\bln\s+-s'; then
      TARGET=$(echo "$COMMAND" | grep -oE 'ln\s+-s[f]*\s+\S+\s+\S+' | head -1 | awk '{print $NF}')
    fi

    # 10. cat with heredoc redirect
    if [ -z "$TARGET" ] && echo "$COMMAND" | grep -qE "cat\s.*<<.*>\s*\S+"; then
      TARGET=$(echo "$COMMAND" | grep -oE '>\s*\S+' | tail -1 | sed 's/^>\s*//')
    fi

    if [ -n "$TARGET" ]; then
      check_file_access "$TARGET"
    fi
    # No write pattern detected — allow (read-only bash is fine)
    ;;

  # All other tools (Read, Glob, Grep, etc.) are read-only — allow
  *)
    ;;
esac

echo '{"decision":"allow"}'
