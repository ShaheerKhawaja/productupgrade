#!/usr/bin/env bash
# self-learn.sh — Silent self-learning context capture hook
# Triggered on PostToolUse to silently record context patterns
# Similar to claude-mem but auto-enabled and silent

set -euo pipefail

LEARN_DIR="${HOME}/.productupgrade/learned"
SESSION_FILE="${LEARN_DIR}/session-$(date +%Y%m%d).jsonl"

mkdir -p "$LEARN_DIR"

# Read hook input from stdin
INPUT=$(cat)

# Extract tool name and result summary
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // "unknown"' 2>/dev/null || echo "unknown")
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Only capture meaningful events (not every read/grep)
case "$TOOL_NAME" in
  Edit|Write)
    # Capture file modifications for pattern learning
    FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // "unknown"' 2>/dev/null || echo "unknown")
    echo "{\"ts\":\"${TIMESTAMP}\",\"event\":\"file_modified\",\"tool\":\"${TOOL_NAME}\",\"file\":\"${FILE_PATH}\"}" >> "$SESSION_FILE"
    ;;
  Bash)
    # Capture command patterns (not output — too large)
    COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // "unknown"' 2>/dev/null | head -c 200 || echo "unknown")
    # Only capture test/lint/build commands
    if echo "$COMMAND" | grep -qE "test|lint|build|pytest|tsc|ruff|eslint|vitest|jest"; then
      EXIT_CODE=$(echo "$INPUT" | jq -r '.tool_result.exit_code // 0' 2>/dev/null || echo "0")
      echo "{\"ts\":\"${TIMESTAMP}\",\"event\":\"validation\",\"command\":\"${COMMAND}\",\"exit_code\":${EXIT_CODE}}" >> "$SESSION_FILE"
    fi
    ;;
  Agent)
    # Capture agent dispatch patterns
    DESC=$(echo "$INPUT" | jq -r '.tool_input.description // "unknown"' 2>/dev/null | head -c 100 || echo "unknown")
    echo "{\"ts\":\"${TIMESTAMP}\",\"event\":\"agent_dispatch\",\"description\":\"${DESC}\"}" >> "$SESSION_FILE"
    ;;
esac

# Periodic pattern extraction (every 50 entries)
ENTRY_COUNT=$(wc -l < "$SESSION_FILE" 2>/dev/null || echo "0")
if [ "$ENTRY_COUNT" -ge 50 ] && [ $((ENTRY_COUNT % 50)) -eq 0 ]; then
  # Extract patterns from accumulated data
  PATTERNS_FILE="${LEARN_DIR}/patterns-$(date +%Y%m%d).md"
  if [ ! -f "$PATTERNS_FILE" ]; then
    echo "# Learned Patterns — $(date +%Y-%m-%d)" > "$PATTERNS_FILE"
    echo "" >> "$PATTERNS_FILE"
    echo "## File Modification Frequency" >> "$PATTERNS_FILE"
    jq -r 'select(.event == "file_modified") | .file' "$SESSION_FILE" 2>/dev/null | sort | uniq -c | sort -rn | head -10 >> "$PATTERNS_FILE" 2>/dev/null || true
    echo "" >> "$PATTERNS_FILE"
    echo "## Validation Failures" >> "$PATTERNS_FILE"
    jq -r 'select(.event == "validation" and .exit_code != 0) | .command' "$SESSION_FILE" 2>/dev/null | head -10 >> "$PATTERNS_FILE" 2>/dev/null || true
    echo "" >> "$PATTERNS_FILE"
    echo "## Agent Dispatch Patterns" >> "$PATTERNS_FILE"
    jq -r 'select(.event == "agent_dispatch") | .description' "$SESSION_FILE" 2>/dev/null | head -10 >> "$PATTERNS_FILE" 2>/dev/null || true
  fi
fi
