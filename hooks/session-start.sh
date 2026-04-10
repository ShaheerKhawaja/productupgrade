#!/usr/bin/env bash
# ProductionOS session start — init state, track session, detect project, show status
set -euo pipefail
# Resolve plugin root — works for both marketplace install and git clone
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
STATE_DIR="${PRODUCTIONOS_HOME:-$HOME/.productionos}"

mkdir -p "$STATE_DIR"/{config,analytics,sessions,instincts/{project,global},review-log,cache,retro}

# Track session
touch "$STATE_DIR/sessions/$$"
find "$STATE_DIR/sessions" -mmin +120 -type f ! -name "active-project" ! -name "project-meta" -delete 2>/dev/null || true
SESSIONS=$(find "$STATE_DIR/sessions" -mmin -120 -type f ! -name "active-project" ! -name "project-meta" 2>/dev/null | wc -l | tr -d ' ')

# Detect and persist active project root
PROJECT_ROOT=""
PROJECT_NAME=""
if command -v git >/dev/null 2>&1; then
  PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
fi
if [ -n "$PROJECT_ROOT" ]; then
  PROJECT_NAME=$(basename "$PROJECT_ROOT")
  echo "$PROJECT_ROOT" > "$STATE_DIR/sessions/active-project"
  # Detect monorepo (3+ manifest files at depth 1-2)
  SUBPROJECT_COUNT=$(find "$PROJECT_ROOT" -maxdepth 2 \( -name "package.json" -o -name "go.mod" -o -name "pyproject.toml" -o -name "Cargo.toml" \) ! -path "*/node_modules/*" ! -path "*/.worktrees/*" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$SUBPROJECT_COUNT" -gt 3 ]; then
    echo "{\"monorepo\":true,\"subprojects\":$SUBPROJECT_COUNT}" > "$STATE_DIR/sessions/project-meta"
  fi
fi

# Detect orphaned worktrees from crashed sessions
ORPHAN_MSG=""
if [ -f "$STATE_DIR/worktrees.json" ]; then
  # C-2 fix: Pass path via sys.argv; M-2 fix: Use os.kill for cross-platform PID check
  ORPHAN_COUNT=$(python3 -c "
import json, os, sys
def is_running(pid):
    try:
        os.kill(pid, 0)
        return True
    except (OSError, ProcessLookupError, PermissionError):
        return False
try:
    wt = json.load(open(sys.argv[1]))
    orphans = [w for w in wt if w.get('status') == 'active' and not is_running(w.get('pid', 0))]
    print(len(orphans))
except:
    print(0)
" "$STATE_DIR/worktrees.json" 2>/dev/null || echo "0")
  if [ "$ORPHAN_COUNT" -gt 0 ] 2>/dev/null; then
    ORPHAN_MSG="$ORPHAN_COUNT orphaned worktree(s)"
  fi
fi

# Load config
PROACTIVE="true"
AUTO_REVIEW="true"
if [ -f "$STATE_DIR/config/settings.json" ]; then
  # C-2 fix: Pass file path via sys.argv to prevent injection
  PROACTIVE=$(python3 -c "import json, sys; print(json.load(open(sys.argv[1])).get('proactive', True))" "$STATE_DIR/config/settings.json" 2>/dev/null || echo "true")
  AUTO_REVIEW=$(python3 -c "import json, sys; print(json.load(open(sys.argv[1])).get('auto_review', True))" "$STATE_DIR/config/settings.json" 2>/dev/null || echo "true")
fi

# Log session start with project context
# C-1 fix: Use jq for safe JSON construction
if command -v jq >/dev/null 2>&1; then
  jq -n --arg event "session_start" --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --argjson pid $$ --argjson sessions "$SESSIONS" --arg project "$PROJECT_NAME" \
    '{event: $event, ts: $ts, pid: $pid, sessions: $sessions, project: $project}' >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
else
  SAFE_PROJ=$(printf '%s' "$PROJECT_NAME" | tr -cd '[:alnum:]._/-')
  printf '{"event":"session_start","ts":"%s","pid":%d,"sessions":%d,"project":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" $$ "$SESSIONS" "$SAFE_PROJ" >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
fi

# DevTools auto-launch + status
DEVTOOLS_STATUS="off"
DEVTOOLS_APP="/Applications/claude-devtools.app"
if [ -d "$DEVTOOLS_APP" ]; then
  # Check if autolaunch is enabled (default: true)
  DEVTOOLS_AUTOLAUNCH="true"
  if [ -f "$STATE_DIR/config/settings.json" ]; then
    DEVTOOLS_AUTOLAUNCH=$(python3 -c "import json, sys; print(json.load(open(sys.argv[1])).get('devtools_autolaunch', True))" "$STATE_DIR/config/settings.json" 2>/dev/null || echo "true")
  fi

  if pgrep -f "claude-devtools" >/dev/null 2>&1; then
    DEVTOOLS_STATUS="live"
  else
    DEVTOOLS_STATUS="ready"
    # Auto-launch if enabled
    if [ "$DEVTOOLS_AUTOLAUNCH" = "true" ] || [ "$DEVTOOLS_AUTOLAUNCH" = "True" ]; then
      open "$DEVTOOLS_APP" 2>/dev/null &
      DEVTOOLS_STATUS="live"
    fi
  fi
fi

# Snapshot cost baseline for session delta tracking
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
python3 "$PLUGIN_ROOT/hooks/devtools-dashboard.py" --snapshot 2>/dev/null || true

# Get dashboard metrics for banner
DASHBOARD_METRICS=$(python3 "$PLUGIN_ROOT/hooks/devtools-dashboard.py" --banner 2>/dev/null || echo "")

# First-run detection — triggers onboarding flow in ONBOARDING.md
if [ ! -f "$STATE_DIR/.onboarded" ]; then
  echo "FIRST_RUN: true"
fi

cat << 'BANNER'

  ╔═══════════════════════════════════════════════════╗
  ║  ProductionOS v1.0.0-beta.1 — Production House   ║
  ║  78 agents | 41 commands | 17 hooks               ║
  ╠═══════════════════════════════════════════════════╣
BANNER
printf "  ║  Sessions: %-3s | Auto-Review: %-5s | Learn: %-4s ║\n" "$SESSIONS" "$AUTO_REVIEW" "$PROACTIVE"
if [ -n "$PROJECT_NAME" ]; then
  printf "  ║  Project: %-40s ║\n" "$PROJECT_NAME"
fi
printf "  ║  DevTools: %-39s ║\n" "$DEVTOOLS_STATUS"
if [ -n "$DASHBOARD_METRICS" ]; then
  printf "  ║  Metrics: %-39s ║\n" "$DASHBOARD_METRICS"
fi
echo "  ╚═══════════════════════════════════════════════════╝"

# Show last retro action item if available
if [ -d "$STATE_DIR/retro" ]; then
  LAST_RETRO=$(ls -1 "$STATE_DIR/retro"/*.json 2>/dev/null | sort | tail -1 || true)
  if [ -n "$LAST_RETRO" ] && [ -f "$LAST_RETRO" ] 2>/dev/null; then
    # C-2 fix: Pass file path via sys.argv
    LAST_RETRO_ACTION=$(python3 -c "
import json, sys
try:
    data = json.load(open(sys.argv[1]))
    action = data.get('top_action_item', '')
    if action:
        print(action[:70])
except:
    pass
" "$LAST_RETRO" 2>/dev/null || true)
    if [ -n "${LAST_RETRO_ACTION:-}" ]; then
      echo "  Retro action: $LAST_RETRO_ACTION"
    fi
  fi
fi

# Show orphan warning
if [ -n "${ORPHAN_MSG:-}" ]; then
  echo "  WARNING: $ORPHAN_MSG — run: bun run scripts/worktree-manager.ts status"
fi

# Context recovery — surface recent work for session continuity
CONTEXT_PATHS=""
CONTEXT_FLAGS=""

# Check for recent handoff files from previous sessions
LAST_HANDOFF=$(ls -t "$STATE_DIR/sessions"/handoff-*.md 2>/dev/null | head -1 || true)
if [ -n "$LAST_HANDOFF" ]; then
  CONTEXT_PATHS="\"handoff\": \"$LAST_HANDOFF\""
  CONTEXT_FLAGS="handoff"
fi

# Check for recent instincts (learned patterns within last 2 hours)
RECENT_INSTINCTS=$(find "$STATE_DIR/instincts" -name "*.json" -mmin -120 2>/dev/null | wc -l | tr -d ' ')
if [ "$RECENT_INSTINCTS" -gt 0 ] 2>/dev/null; then
  if [ -n "$CONTEXT_PATHS" ]; then
    CONTEXT_PATHS="$CONTEXT_PATHS, \"instincts_count\": $RECENT_INSTINCTS, \"instincts_dir\": \"$STATE_DIR/instincts\""
  else
    CONTEXT_PATHS="\"instincts_count\": $RECENT_INSTINCTS, \"instincts_dir\": \"$STATE_DIR/instincts\""
  fi
  CONTEXT_FLAGS="${CONTEXT_FLAGS:+$CONTEXT_FLAGS,}instincts"
fi

# Check git log for recent work (last 12 hours)
RECENT_COMMITS=""
if command -v git >/dev/null 2>&1 && [ -n "$PROJECT_ROOT" ]; then
  RECENT_COMMITS=$(git -C "$PROJECT_ROOT" log --oneline --since="12 hours ago" 2>/dev/null | head -5)
fi
if [ -n "$RECENT_COMMITS" ]; then
  # Count recent commits
  COMMIT_COUNT=$(echo "$RECENT_COMMITS" | wc -l | tr -d ' ')
  FIRST_COMMIT=$(echo "$RECENT_COMMITS" | tail -1 | cut -d' ' -f2-)
  LAST_COMMIT=$(echo "$RECENT_COMMITS" | head -1 | cut -d' ' -f2-)
  if [ -n "$CONTEXT_PATHS" ]; then
    CONTEXT_PATHS="$CONTEXT_PATHS, \"recent_commits\": $COMMIT_COUNT, \"latest\": \"$LAST_COMMIT\""
  else
    CONTEXT_PATHS="\"recent_commits\": $COMMIT_COUNT, \"latest\": \"$LAST_COMMIT\""
  fi
  CONTEXT_FLAGS="${CONTEXT_FLAGS:+$CONTEXT_FLAGS,}git"
fi

# Emit context recovery block if any signals found
if [ -n "$CONTEXT_FLAGS" ]; then
  echo "  CONTEXT_RECOVERY: {$CONTEXT_PATHS}"
fi

echo ""
