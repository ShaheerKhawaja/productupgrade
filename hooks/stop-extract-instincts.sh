#!/usr/bin/env bash
# ProductionOS Stop hook — extract instincts from session analytics
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
ANALYTICS="$STATE_DIR/analytics/skill-usage.jsonl"
INSTINCTS_DIR="$STATE_DIR/instincts/project"

# Only run if analytics exist and auto_learn is enabled
if [ ! -f "$ANALYTICS" ]; then exit 0; fi

# C-2 fix: Pass paths via sys.argv to prevent injection
AUTO_LEARN=$(python3 -c "
import json, sys
try:
    c = json.load(open(sys.argv[1]))
    print(str(c.get('auto_learn', True)).lower())
except:
    print('true')
" "$STATE_DIR/config/settings.json" 2>/dev/null || echo "true")

if [ "$AUTO_LEARN" != "true" ]; then exit 0; fi

mkdir -p "$INSTINCTS_DIR"

# Count session events
# C-2 fix: Pass paths via sys.argv to prevent injection
python3 -c "
import json, collections, os, sys
from datetime import datetime

log_path = sys.argv[1]
instincts_dir = sys.argv[2]

# Read today's events
events = []
today = datetime.utcnow().strftime('%Y-%m-%d')
for line in open(log_path):
    try:
        e = json.loads(line)
        if e.get('ts', '').startswith(today):
            events.append(e)
    except:
        pass

if len(events) < 5:
    exit(0)  # Not enough data

# Count file extension edits
ext_counts = collections.Counter()
for e in events:
    f = e.get('file', '')
    if f:
        ext = os.path.splitext(f)[1]
        if ext:
            ext_counts[ext] += 1

# Count command patterns
cmd_counts = collections.Counter()
for e in events:
    cmd = e.get('cmd', '')
    if cmd:
        # Extract first word as command type
        first = cmd.split()[0] if cmd.split() else ''
        cmd_counts[first] += 1

# Write summary (simple instinct seed)
summary = {
    'session_date': today,
    'total_events': len(events),
    'top_file_types': dict(ext_counts.most_common(5)),
    'top_commands': dict(cmd_counts.most_common(5)),
}

summary_path = os.path.join(instincts_dir, f'session-{today}.json')
with open(summary_path, 'w') as f:
    json.dump(summary, f, indent=2)
" "$ANALYTICS" "$INSTINCTS_DIR" 2>/dev/null || true
