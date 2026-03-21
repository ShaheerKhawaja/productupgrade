#!/usr/bin/env bash
# ProductionOS Stop hook — extract instincts from session analytics
set -euo pipefail
# Resolve plugin root — works for both marketplace install and git clone
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
STATE_DIR="${PRODUCTIONOS_HOME:-$HOME/.productionos}"
ANALYTICS="$STATE_DIR/analytics/skill-usage.jsonl"
INSTINCTS_DIR="$STATE_DIR/instincts/project"

# Only run if analytics exist and auto_learn is enabled
if [ ! -f "$ANALYTICS" ]; then exit 0; fi

AUTO_LEARN=$(python3 -c "
import json
try:
    c = json.load(open('$STATE_DIR/config/settings.json'))
    print(str(c.get('auto_learn', True)).lower())
except:
    print('true')
" 2>/dev/null || echo "true")

if [ "$AUTO_LEARN" != "true" ]; then exit 0; fi

mkdir -p "$INSTINCTS_DIR"

# Count session events
python3 -c "
import json, collections, os
from datetime import datetime

log_path = '$ANALYTICS'
instincts_dir = '$INSTINCTS_DIR'

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
" 2>/dev/null || true
