#!/usr/bin/env bash
# self-learn.sh — Silent self-learning context capture hook
# Triggered on PostToolUse to silently record context patterns
# Similar to claude-mem but auto-enabled and silent
# v2: Cross-session pattern aggregation

set -euo pipefail
# Resolve plugin root — works for both marketplace install and git clone
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"

LEARN_DIR="${HOME}/.productionos/instincts/learned"
SESSION_FILE="${LEARN_DIR}/session-$(date +%Y%m%d).jsonl"
CROSS_SESSION_FILE="${LEARN_DIR}/CROSS-SESSION-PATTERNS.md"

mkdir -p "$LEARN_DIR"

# Read hook input from stdin
INPUT=$(cat)

# Scope check: only learn from active project
STATE_DIR="${PRODUCTIONOS_HOME:-$HOME/.productionos}"
ACTIVE_PROJECT=""
if [ -f "$STATE_DIR/sessions/active-project" ]; then
  ACTIVE_PROJECT=$(cat "$STATE_DIR/sessions/active-project" 2>/dev/null || echo "")
fi

# Graceful degradation without jq
if ! command -v jq >/dev/null 2>&1; then
  # Minimal capture without jq — just log the event type
  TOOL_NAME="unknown"
  case "$INPUT" in
    *Edit*|*Write*) TOOL_NAME="Edit" ;;
    *Bash*) TOOL_NAME="Bash" ;;
    *Agent*) TOOL_NAME="Agent" ;;
  esac
  echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"event\":\"tool_use\",\"tool\":\"${TOOL_NAME}\"}" >> "$SESSION_FILE"
  exit 0
fi

# Extract tool name and result summary
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // "unknown"' 2>/dev/null || echo "unknown")
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Only capture meaningful events (not every read/grep)
case "$TOOL_NAME" in
  Edit|Write)
    # Capture file modifications — use jq -n to prevent JSON injection from file paths
    FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // "unknown"' 2>/dev/null || echo "unknown")
    # Skip learning for files outside active project
    if [ -n "$ACTIVE_PROJECT" ] && [ "$FILE_PATH" != "unknown" ]; then
      case "$FILE_PATH" in
        "$ACTIVE_PROJECT"/*) ;; # Within active project, proceed
        *) exit 0 ;; # Outside active project, skip learning
      esac
    fi
    # Use flock for atomic JSONL appends (concurrent session safety)
    jq -cn --arg ts "$TIMESTAMP" --arg tool "$TOOL_NAME" --arg file "$FILE_PATH" \
      '{ts: $ts, event: "file_modified", tool: $tool, file: $file}' | \
      (flock -n 9 && cat >> "$SESSION_FILE") 9>"$SESSION_FILE.lock" 2>/dev/null || \
      jq -cn --arg ts "$TIMESTAMP" --arg tool "$TOOL_NAME" --arg file "$FILE_PATH" \
      '{ts: $ts, event: "file_modified", tool: $tool, file: $file}' >> "$SESSION_FILE" 2>/dev/null || true
    ;;
  Bash)
    # Capture command patterns — use jq -n for safe JSON construction
    COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // "unknown"' 2>/dev/null | head -c 200 || echo "unknown")
    # Only capture test/lint/build commands
    if echo "$COMMAND" | grep -qE "test|lint|build|pytest|tsc|ruff|eslint|vitest|jest"; then
      EXIT_CODE=$(echo "$INPUT" | jq -r '.tool_result.exit_code // 0' 2>/dev/null || echo "0")
      jq -cn --arg ts "$TIMESTAMP" --arg cmd "$COMMAND" --argjson ec "${EXIT_CODE:-0}" \
        '{ts: $ts, event: "validation", command: $cmd, exit_code: $ec}' >> "$SESSION_FILE" 2>/dev/null || true
    fi
    ;;
  Agent)
    # Capture agent dispatch — use jq -n for safe JSON construction
    DESC=$(echo "$INPUT" | jq -r '.tool_input.description // "unknown"' 2>/dev/null | head -c 100 || echo "unknown")
    AGENT_TYPE=$(echo "$INPUT" | jq -r '.tool_input.subagent_type // "general"' 2>/dev/null | head -c 50 || echo "general")
    jq -cn --arg ts "$TIMESTAMP" --arg desc "$DESC" --arg agent "$AGENT_TYPE" \
      '{ts: $ts, event: "agent_dispatch", description: $desc, agent_type: $agent}' >> "$SESSION_FILE" 2>/dev/null || true

    # Log to dispatch-log.jsonl for Production House adaptive routing (Layer 3)
    DISPATCH_LOG="$STATE_DIR/dispatch-log.jsonl"
    jq -cn --arg ts "$TIMESTAMP" --arg goal "$DESC" --arg agent "$AGENT_TYPE" --arg outcome "pending" \
      '{ts: $ts, goal: $goal, agents: [$agent], outcome: $outcome}' >> "$DISPATCH_LOG" 2>/dev/null || true

    # Update pending dispatch outcomes
    # When an Agent tool completes, check for pending entries and update
    if echo "$INPUT" | jq -r '.tool_result // empty' 2>/dev/null | grep -q . 2>/dev/null; then
      if [ -f "$DISPATCH_LOG" ]; then
        python3 -c "
import json, sys
dispatch_file = sys.argv[1]
lines = open(dispatch_file).readlines()
updated = False
for i in range(len(lines)-1, -1, -1):
    try:
        d = json.loads(lines[i])
        if d.get('outcome') == 'pending':
            d['outcome'] = 'completed'
            lines[i] = json.dumps(d) + '\n'
            updated = True
            break
    except:
        pass
if updated:
    with open(dispatch_file, 'w') as f:
        f.writelines(lines)
" "$DISPATCH_LOG" 2>/dev/null || true
      fi
    fi
    ;;
esac

# Periodic pattern extraction
ENTRY_COUNT=$([ -f "$SESSION_FILE" ] && wc -l < "$SESSION_FILE" 2>/dev/null || echo "0")
ENTRY_COUNT=$(echo "$ENTRY_COUNT" | tr -d ' ')

# Single-session patterns (every 50 entries)
if [ "$ENTRY_COUNT" -ge 50 ] && [ $((ENTRY_COUNT % 50)) -eq 0 ]; then
  PATTERNS_FILE="${LEARN_DIR}/patterns-$(date +%Y%m%d).md"
  if [ ! -f "$PATTERNS_FILE" ]; then
    {
      echo "# Learned Patterns — $(date +%Y-%m-%d)"
      echo ""
      echo "## File Modification Frequency"
      jq -r 'select(.event == "file_modified") | .file' "$SESSION_FILE" 2>/dev/null | sort | uniq -c | sort -rn | head -10 || true
      echo ""
      echo "## Validation Failures"
      jq -r 'select(.event == "validation" and .exit_code != 0) | .command' "$SESSION_FILE" 2>/dev/null | head -10 || true
      echo ""
      echo "## Agent Dispatch Patterns"
      jq -r 'select(.event == "agent_dispatch") | .description' "$SESSION_FILE" 2>/dev/null | head -10 || true
    } > "$PATTERNS_FILE" 2>/dev/null
  fi
fi

# Cross-session aggregation (every 100 entries — heavier operation)
if [ "$ENTRY_COUNT" -ge 100 ] && [ $((ENTRY_COUNT % 100)) -eq 0 ]; then
  {
    echo "# Cross-Session Learned Patterns"
    echo ""
    echo "_Auto-generated by self-learn.sh. Updated: $(date -u +%Y-%m-%dT%H:%M:%SZ)_"
    echo ""

    echo "## Hot Files (modified 5+ times across sessions)"
    echo ""
    echo "Files that get touched repeatedly are likely integration points or high-churn areas."
    echo ""
    cat "${LEARN_DIR}"/session-*.jsonl 2>/dev/null \
      | jq -r 'select(.event == "file_modified") | .file' 2>/dev/null \
      | sort | uniq -c | sort -rn \
      | awk '$1 >= 5 {printf "- **%s** (%d modifications)\n", $2, $1}' \
      | head -15 || echo "- No hot files yet (need more sessions)"

    echo ""
    echo "## Common Failure Patterns"
    echo ""
    echo "Commands that fail consistently across sessions."
    echo ""
    cat "${LEARN_DIR}"/session-*.jsonl 2>/dev/null \
      | jq -r 'select(.event == "validation" and .exit_code != 0) | .command' 2>/dev/null \
      | sort | uniq -c | sort -rn \
      | head -10 \
      | awk '{count=$1; $1=""; printf "- `%s` (failed %d times)\n", $0, count}' \
      || echo "- No repeated failures yet"

    echo ""
    echo "## Agent Dispatch Frequency"
    echo ""
    echo "Most commonly dispatched agent tasks."
    echo ""
    cat "${LEARN_DIR}"/session-*.jsonl 2>/dev/null \
      | jq -r 'select(.event == "agent_dispatch") | .description' 2>/dev/null \
      | sort | uniq -c | sort -rn \
      | head -10 \
      | awk '{count=$1; $1=""; printf "- %s (%d dispatches)\n", $0, count}' \
      || echo "- No agent dispatches yet"

    echo ""
    echo "## Session Summary"
    echo ""
    SESSION_COUNT=$(ls "${LEARN_DIR}"/session-*.jsonl 2>/dev/null | wc -l | tr -d ' ')
    TOTAL_EVENTS=$(cat "${LEARN_DIR}"/session-*.jsonl 2>/dev/null | wc -l | tr -d ' ')
    echo "- Sessions recorded: ${SESSION_COUNT}"
    echo "- Total events: ${TOTAL_EVENTS}"

  } > "$CROSS_SESSION_FILE" 2>/dev/null || true

  # Write hot-files-cache.json for churn warnings (O(1) lookup by post-edit-telemetry.sh)
  HOT_FILES_CACHE="${LEARN_DIR}/hot-files-cache.json"
  cat "${LEARN_DIR}"/session-*.jsonl 2>/dev/null \
    | jq -r 'select(.event == "file_modified") | .file' 2>/dev/null \
    | sort | uniq -c | sort -rn \
    | awk '$1 >= 5 {printf "%s\t%d\n", $2, $1}' \
    | head -20 \
    | jq -Rn '[inputs | split("\t") | {(.[0]): (.[1] | tonumber)}] | add // {}' \
    | jq '{hot_files: ., updated: now | todate}' > "$HOT_FILES_CACHE" 2>/dev/null || true
fi
