#!/usr/bin/env bash
# ProductionOS PostToolUse — auto code review hint after edits
# Tracks edit count per session. After 10+ edits, suggests running review.
set -euo pipefail
# Resolve plugin root — works for both marketplace install and git clone
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
STATE_DIR="${PRODUCTIONOS_HOME:-$HOME/.productionos}"

# Check if auto_review is enabled
# C-2 fix: Pass paths via sys.argv to prevent injection
AUTO_REVIEW=$(python3 -c "
import json, sys
try:
    c = json.load(open(sys.argv[1]))
    print(str(c.get('auto_review', True)).lower())
except:
    print('true')
" "$STATE_DIR/config/settings.json" 2>/dev/null || echo "true")

if [ "$AUTO_REVIEW" != "true" ]; then exit 0; fi

# Count edits this session
COUNTER_FILE="$STATE_DIR/sessions/edit-count-$$"
COUNT=0
if [ -f "$COUNTER_FILE" ]; then
  COUNT=$(cat "$COUNTER_FILE" 2>/dev/null || echo "0")
fi
COUNT=$((COUNT + 1))
echo "$COUNT" > "$COUNTER_FILE"

# At edit 10 and every 20 after, emit review suggestion
if [ "$COUNT" -eq 10 ] || [ $((COUNT % 20)) -eq 0 ]; then
  echo "{\"additionalContext\":\"ProductionOS Review: $COUNT edits this session. Consider running /review or /code-review before committing.\"}"
else
  echo '{}'
fi
