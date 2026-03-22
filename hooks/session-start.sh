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
  ORPHAN_COUNT=$(python3 -c "
import json, os
try:
    wt = json.load(open('$STATE_DIR/worktrees.json'))
    orphans = [w for w in wt if w.get('status') == 'active' and not os.path.exists(os.path.join('/proc', str(w.get('pid', 0))))]
    print(len(orphans))
except:
    print(0)
" 2>/dev/null || echo "0")
  if [ "$ORPHAN_COUNT" -gt 0 ] 2>/dev/null; then
    ORPHAN_MSG="$ORPHAN_COUNT orphaned worktree(s)"
  fi
fi

# Load config
PROACTIVE="true"
AUTO_REVIEW="true"
if [ -f "$STATE_DIR/config/settings.json" ]; then
  PROACTIVE=$(python3 -c "import json; print(json.load(open('$STATE_DIR/config/settings.json')).get('proactive', True))" 2>/dev/null || echo "true")
  AUTO_REVIEW=$(python3 -c "import json; print(json.load(open('$STATE_DIR/config/settings.json')).get('auto_review', True))" 2>/dev/null || echo "true")
fi

# Log session start with project context
echo "{\"event\":\"session_start\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"pid\":$$,\"sessions\":$SESSIONS,\"project\":\"$PROJECT_ROOT\"}" >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true

cat << 'BANNER'

  ╔═══════════════════════════════════════════════════╗
  ║  ProductionOS v8.0 — The Nervous System           ║
  ║  66 agents | 35 commands | 11 hooks               ║
  ╠═══════════════════════════════════════════════════╣
BANNER
printf "  ║  Sessions: %-3s | Auto-Review: %-5s | Learn: %-4s ║\n" "$SESSIONS" "$AUTO_REVIEW" "$PROACTIVE"
if [ -n "$PROJECT_NAME" ]; then
  printf "  ║  Project: %-40s ║\n" "$PROJECT_NAME"
fi
echo "  ╚═══════════════════════════════════════════════════╝"

# Show last retro action item if available
if [ -d "$STATE_DIR/retro" ]; then
  LAST_RETRO=$(ls -1 "$STATE_DIR/retro"/*.json 2>/dev/null | sort | tail -1 || true)
  if [ -n "$LAST_RETRO" ] && [ -f "$LAST_RETRO" ] 2>/dev/null; then
    LAST_RETRO_ACTION=$(python3 -c "
import json
try:
    data = json.load(open('$LAST_RETRO'))
    action = data.get('top_action_item', '')
    if action:
        print(action[:70])
except:
    pass
" 2>/dev/null || true)
    if [ -n "${LAST_RETRO_ACTION:-}" ]; then
      echo "  Retro action: $LAST_RETRO_ACTION"
    fi
  fi
fi

# Show orphan warning
if [ -n "${ORPHAN_MSG:-}" ]; then
  echo "  WARNING: $ORPHAN_MSG — run: bun run scripts/worktree-manager.ts status"
fi
echo ""
