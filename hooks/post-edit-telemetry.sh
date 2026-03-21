#!/usr/bin/env bash
# ProductionOS PostToolUse — log edit telemetry
set -euo pipefail
# Resolve plugin root — works for both marketplace install and git clone
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
STATE_DIR="${PRODUCTIONOS_HOME:-$HOME/.productionos}"
mkdir -p "$STATE_DIR/analytics"

INPUT=$(cat)
FILE_PATH=$(printf '%s' "$INPUT" | python3 -c "
import sys, json
try:
    data = json.loads(sys.stdin.read())
    ti = data.get('tool_input', {})
    print(ti.get('file_path', ''))
except:
    print('')
" 2>/dev/null || true)

echo "{\"event\":\"edit\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"file\":\"$FILE_PATH\"}" >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
