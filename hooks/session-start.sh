#!/usr/bin/env bash
# ProductionOS session start — init state, track session, show status
set -euo pipefail
# Resolve plugin root — works for both marketplace install and git clone
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
STATE_DIR="${PRODUCTIONOS_HOME:-$HOME/.productionos}"

mkdir -p "$STATE_DIR"/{config,analytics,sessions,instincts/{project,global},review-log,cache}

# Track session
touch "$STATE_DIR/sessions/$$"
find "$STATE_DIR/sessions" -mmin +120 -type f -delete 2>/dev/null || true
SESSIONS=$(find "$STATE_DIR/sessions" -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')

# Load config
PROACTIVE="true"
AUTO_REVIEW="true"
if [ -f "$STATE_DIR/config/settings.json" ]; then
  PROACTIVE=$(python3 -c "import json; print(json.load(open('$STATE_DIR/config/settings.json')).get('proactive', True))" 2>/dev/null || echo "true")
  AUTO_REVIEW=$(python3 -c "import json; print(json.load(open('$STATE_DIR/config/settings.json')).get('auto_review', True))" 2>/dev/null || echo "true")
fi

# Log session start
echo "{\"event\":\"session_start\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"pid\":$$,\"sessions\":$SESSIONS}" >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true

cat << 'BANNER'

  ╔═══════════════════════════════════════════════════╗
  ║  ProductionOS v6.0 — The Nervous System           ║
  ║  56 agents | 18 commands | 15+ hooks              ║
  ╠═══════════════════════════════════════════════════╣
BANNER
printf "  ║  Sessions: %-3s | Auto-Review: %-5s | Learn: %-4s ║\n" "$SESSIONS" "$AUTO_REVIEW" "$PROACTIVE"
echo "  ╚═══════════════════════════════════════════════════╝"
echo ""
