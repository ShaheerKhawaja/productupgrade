#!/usr/bin/env bash
# ProductionOS Stop hook — session cleanup, project-scoped handoff, mini-retro, instinct extraction
set -euo pipefail
STATE_DIR="${PRODUCTIONOS_HOME:-$HOME/.productionos}"

# Read active project before cleanup
ACTIVE_PROJECT=""
ACTIVE_PROJECT_NAME=""
if [ -f "$STATE_DIR/sessions/active-project" ]; then
  ACTIVE_PROJECT=$(cat "$STATE_DIR/sessions/active-project" 2>/dev/null || echo "")
  ACTIVE_PROJECT_NAME=$(basename "$ACTIVE_PROJECT" 2>/dev/null || echo "")
fi

# 1. Clean session files
rm -f "$STATE_DIR/sessions/$$" 2>/dev/null || true
rm -f "$STATE_DIR/sessions/active-project" 2>/dev/null || true
rm -f "$STATE_DIR/sessions/project-meta" 2>/dev/null || true

# 2. Log session end
echo "{\"event\":\"session_end\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"pid\":$$,\"project\":\"$ACTIVE_PROJECT\"}" >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true

# 3. Generate project-scoped session summary
ANALYTICS="$STATE_DIR/analytics/skill-usage.jsonl"
if [ -f "$ANALYTICS" ]; then
  python3 -c "
import json, collections, os
from datetime import datetime

today = datetime.utcnow().strftime('%Y-%m-%d')
active_project = '$ACTIVE_PROJECT'
events = []
for line in open('$ANALYTICS'):
    try:
        e = json.loads(line)
        if e.get('ts', '').startswith(today):
            events.append(e)
    except:
        pass

if len(events) < 3:
    exit(0)

# Filter to active project if set
if active_project:
    project_events = [e for e in events if
        not e.get('file') or
        e['file'].startswith(active_project) or
        e.get('event') in ('session_start', 'session_end')]
    cross_repo = [e for e in events if e.get('event') == 'cross_repo_edit']
else:
    project_events = events
    cross_repo = []

types = collections.Counter(e.get('event', '') for e in project_events)
files = collections.Counter(e.get('file', '') for e in project_events if e.get('file'))
security = [e for e in project_events if e.get('event') == 'security_edit']

project_label = os.path.basename(active_project) if active_project else 'all'

# Write handoff summary
handoff = f'''# ProductionOS Session Summary — {today} ({project_label})

## Events: {len(project_events)}
{chr(10).join(f'- {k}: {v}' for k, v in types.most_common(10))}

## Top Files Edited
{chr(10).join(f'- {k}: {v}' for k, v in files.most_common(5)) if files else '- None'}

## Security-Sensitive Edits: {len(security)}
{chr(10).join(f'- {e.get(\"file\", \"\")} ({e.get(\"pattern\", \"\")})' for e in security) if security else '- None'}

## Cross-Repo Edits: {len(cross_repo)}
{chr(10).join(f'- {e.get(\"file\", \"\")} (target: {e.get(\"target_repo\", \"\")})' for e in cross_repo[:5]) if cross_repo else '- None'}
'''

handoff_dir = os.path.join('$STATE_DIR', 'sessions')
os.makedirs(handoff_dir, exist_ok=True)
with open(os.path.join(handoff_dir, f'handoff-{today}.md'), 'w') as f:
    f.write(handoff)
" 2>/dev/null || true
fi

# 3.5. Mini-retro: append session summary to retro sessions log
if [ -n "$ACTIVE_PROJECT" ]; then
  mkdir -p "$STATE_DIR/retro"
  python3 -c "
import json, os, subprocess
from datetime import datetime

state_dir = '$STATE_DIR'
active_project = '$ACTIVE_PROJECT'
now = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
today = datetime.utcnow().strftime('%Y-%m-%d')

# Find session start time from analytics
session_start = None
analytics_file = os.path.join(state_dir, 'analytics', 'skill-usage.jsonl')
edit_count = 0
if os.path.exists(analytics_file):
    for line in open(analytics_file):
        try:
            e = json.loads(line)
            if e.get('event') == 'session_start' and e.get('ts', '').startswith(today) and str(e.get('pid', '')) == '$$':
                session_start = e['ts']
            if e.get('event') == 'edit' and e.get('ts', '').startswith(today):
                if e.get('file', '').startswith(active_project):
                    edit_count += 1
        except:
            pass

# Count commits since session start
commits = 0
loc_added = 0
loc_removed = 0
try:
    if session_start:
        result = subprocess.run(['git', '-C', active_project, 'log', '--oneline', f'--since={session_start}'], capture_output=True, text=True, timeout=5)
        commits = len([l for l in result.stdout.strip().split(chr(10)) if l])
        stat = subprocess.run(['git', '-C', active_project, 'diff', '--shortstat', f'--since={session_start}', 'HEAD'], capture_output=True, text=True, timeout=5)
except:
    pass

# Top 3 files from analytics
files = {}
if os.path.exists(analytics_file):
    for line in open(analytics_file):
        try:
            e = json.loads(line)
            if e.get('event') == 'edit' and e.get('ts', '').startswith(today) and e.get('file', '').startswith(active_project):
                f = e['file'].replace(active_project + '/', '')
                files[f] = files.get(f, 0) + 1
        except:
            pass
top_files = sorted(files.items(), key=lambda x: -x[1])[:3]

# Write mini-retro to sessions.jsonl
retro = {
    'ts': now,
    'project': os.path.basename(active_project),
    'commits': commits,
    'edits': edit_count,
    'top_files': [f[0] for f in top_files],
}
retro_file = os.path.join(state_dir, 'retro', 'sessions.jsonl')
with open(retro_file, 'a') as f:
    f.write(json.dumps(retro) + chr(10))
" 2>/dev/null || true
fi

# 4. Extract instincts
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(dirname "$(dirname "$0")")}"
if [ -f "$PLUGIN_ROOT/hooks/stop-extract-instincts.sh" ]; then
  bash "$PLUGIN_ROOT/hooks/stop-extract-instincts.sh" 2>/dev/null || true
fi
