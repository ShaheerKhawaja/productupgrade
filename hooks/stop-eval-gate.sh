#!/usr/bin/env bash
# stop-eval-gate.sh — Runs full eval at session end, logs results.
# Enforces 10/10 standard by writing warnings to handoff document.
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

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
STATE_DIR="${HOME}/.productionos"

# Only run if we're in the ProductionOS repo
if [ ! -f "$PLUGIN_ROOT/package.json" ]; then
  exit 0
fi

cd "$PLUGIN_ROOT"

# Run tests silently
TEST_OUTPUT=$(bun test 2>&1 || true)
PASS_COUNT=$(echo "$TEST_OUTPUT" | grep -oE '[0-9]+ pass' | grep -oE '[0-9]+' 2>/dev/null || echo "0")
FAIL_COUNT=$(echo "$TEST_OUTPUT" | grep -oE '[0-9]+ fail' | grep -oE '[0-9]+' 2>/dev/null || echo "0")

# Run eval silently
EVAL_OUTPUT=$(bun run eval 2>&1 || true)
EVAL_SCORE=$(echo "$EVAL_OUTPUT" | grep "OVERALL" | grep -oE '[0-9]+\.[0-9]+' 2>/dev/null || echo "N/A")

# Log to session eval history
mkdir -p "$STATE_DIR/eval-history"
DATE=$(date +%Y-%m-%d-%H%M%S)
cat > "$STATE_DIR/eval-history/eval-$DATE.json" << EOFJSON
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "tests": { "pass": $PASS_COUNT, "fail": $FAIL_COUNT },
  "eval_score": "$EVAL_SCORE",
  "session_pid": $$
}
EOFJSON

# Output summary
if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "SESSION END EVAL: $PASS_COUNT pass, $FAIL_COUNT FAIL | Score: $EVAL_SCORE/10 | ACTION REQUIRED"
else
  echo "SESSION END EVAL: $PASS_COUNT pass, 0 fail | Score: $EVAL_SCORE/10"
fi
