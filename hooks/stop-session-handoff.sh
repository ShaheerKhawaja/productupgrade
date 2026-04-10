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
# C-1 fix: Use jq for safe JSON construction
if command -v jq >/dev/null 2>&1; then
  jq -cn --arg event "session_end" --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --argjson pid $$ --arg project "$ACTIVE_PROJECT_NAME" \
    '{event: $event, ts: $ts, pid: $pid, project: $project}' >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
else
  SAFE_PROJ=$(printf '%s' "$ACTIVE_PROJECT_NAME" | tr -cd '[:alnum:]._/-')
  printf '{"event":"session_end","ts":"%s","pid":%d,"project":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" $$ "$SAFE_PROJ" >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
fi

# 3. Generate project-scoped session summary
ANALYTICS="$STATE_DIR/analytics/skill-usage.jsonl"
if [ -f "$ANALYTICS" ]; then
  # C-2 fix: Pass all paths via sys.argv to prevent Python code injection
  python3 -c "
import json, collections, os, sys
from datetime import datetime

analytics_path = sys.argv[1]
active_project = sys.argv[2]
state_dir = sys.argv[3]

today = datetime.utcnow().strftime('%Y-%m-%d')
events = []
for line in open(analytics_path):
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

handoff_dir = os.path.join(state_dir, 'sessions')
os.makedirs(handoff_dir, exist_ok=True)
with open(os.path.join(handoff_dir, f'handoff-{today}.md'), 'w') as f:
    f.write(handoff)
" "$ANALYTICS" "$ACTIVE_PROJECT" "$STATE_DIR" 2>/dev/null || true
fi

# 3.5. Mini-retro: append session summary to retro sessions log
if [ -n "$ACTIVE_PROJECT" ]; then
  mkdir -p "$STATE_DIR/retro"
  # C-2 fix: Pass all paths via sys.argv to prevent Python code injection
  python3 -c "
import json, os, subprocess, sys
from datetime import datetime

state_dir = sys.argv[1]
active_project = sys.argv[2]
pid = sys.argv[3]
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
            # Match session_start by project+date, not PID (start and stop hooks have different PIDs)
            if e.get('event') == 'session_start' and e.get('ts', '').startswith(today):
                proj = e.get('project', '')
                if not proj or proj == os.path.basename(active_project):
                    session_start = e['ts']
            if e.get('event') == 'edit' and e.get('ts', '').startswith(today):
                f = e.get('file', '')
                if f.startswith(active_project) or f.startswith(os.path.basename(active_project)):
                    edit_count += 1
        except:
            pass

# Count commits since session start
commits = 0
try:
    if session_start:
        result = subprocess.run(['git', '-C', active_project, 'log', '--oneline', f'--since={session_start}'], capture_output=True, text=True, timeout=5)
        commits = len([l for l in result.stdout.strip().split(chr(10)) if l])
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
" "$STATE_DIR" "$ACTIVE_PROJECT" "$$" 2>/dev/null || true
fi

# Mark onboarding complete after first session
if [ ! -f "$STATE_DIR/.onboarded" ]; then
  touch "$STATE_DIR/.onboarded"
fi

# 4. Obsidian session logging — write structured note to SecondBrain vault
OBSIDIAN_VAULT="${OBSIDIAN_VAULT:-$HOME/SecondBrain}"
if [ -d "$OBSIDIAN_VAULT/Sessions" ]; then
  SESSION_DATE=$(date +%Y-%m-%d)
  SESSION_TIME=$(date +%H-%M)
  SESSION_NOTE="$OBSIDIAN_VAULT/Sessions/$SESSION_DATE-$SESSION_TIME.md"

  # Build session note with frontmatter
  {
    echo "---"
    echo "date: $SESSION_DATE"
    echo "time: $(date +%H:%M)"
    echo "project: ${ACTIVE_PROJECT_NAME:-unknown}"
    echo "type: session-log"
    echo "tags: [session, productionos, ${ACTIVE_PROJECT_NAME:-unknown}]"
    echo "---"
    echo ""
    echo "# Session: $SESSION_DATE $(date +%H:%M)"
    echo ""
    echo "**Project:** ${ACTIVE_PROJECT_NAME:-unknown}"
    echo "**Branch:** $(git branch --show-current 2>/dev/null || echo 'unknown')"
    echo ""
    echo "## Recent Commits"
    git log --oneline --since="4 hours ago" 2>/dev/null | head -10 | sed 's/^/- /' || echo "- (no commits)"
    echo ""
    echo "## Files Modified"
    git diff --name-only HEAD~5 2>/dev/null | head -15 | sed 's/^/- /' || echo "- (no changes)"
    echo ""
    echo "## Handoff"
    if [ -f "$STATE_DIR/sessions/handoff-$SESSION_DATE.md" ]; then
      tail -20 "$STATE_DIR/sessions/handoff-$SESSION_DATE.md" 2>/dev/null || true
    else
      echo "No handoff generated."
    fi
  } > "$SESSION_NOTE" 2>/dev/null || true
fi

# 5. Extract instincts
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
if [ -f "$PLUGIN_ROOT/hooks/stop-extract-instincts.sh" ]; then
  bash "$PLUGIN_ROOT/hooks/stop-extract-instincts.sh" 2>/dev/null || true
fi
