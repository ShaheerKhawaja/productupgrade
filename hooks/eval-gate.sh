#!/usr/bin/env bash
# eval-gate.sh — Autonomous eval gate that runs after significant actions.
# Called by PostToolUse (after every 10+ edits) and Stop hooks.
# Enforces 8/10 quality standard — blocks session completion if below threshold.
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
STATE_DIR="${PRODUCTIONOS_HOME:-$HOME/.productionos}"
EDIT_COUNT_FILE="$STATE_DIR/sessions/edit-count-$$"
EVAL_THRESHOLD=8
EVAL_INTERVAL=10  # Run eval every N edits

# ─── Check if we should run ─────────────────────────────────
# Only run after every EVAL_INTERVAL edits (not every single edit)
CURRENT_COUNT=0
if [ -f "$EDIT_COUNT_FILE" ]; then
  CURRENT_COUNT=$(cat "$EDIT_COUNT_FILE" 2>/dev/null || echo "0")
fi

# Only run at multiples of EVAL_INTERVAL
if [ "$CURRENT_COUNT" -gt 0 ] && [ $((CURRENT_COUNT % EVAL_INTERVAL)) -eq 0 ]; then
  # Run tests first (fast gate)
  cd "$PLUGIN_ROOT"
  TEST_RESULT=$(bun test 2>&1 | tail -5)
  FAIL_COUNT=$(echo "$TEST_RESULT" | grep -oE '[0-9]+ fail' | grep -oE '[0-9]+' || echo "0")

  if [ "$FAIL_COUNT" -gt 0 ]; then
    echo "{\"additionalContext\":\"EVAL GATE WARNING: $FAIL_COUNT test(s) failing after $CURRENT_COUNT edits. Run 'bun test' to see failures. Fix before pushing.\"}"
    exit 0
  fi

  # Run tsc type check (fast gate)
  TSC_RESULT=$(./node_modules/.bin/tsc --noEmit 2>&1)
  if [ $? -ne 0 ]; then
    TSC_ERRORS=$(echo "$TSC_RESULT" | grep "error TS" | wc -l | tr -d ' ')
    echo "{\"additionalContext\":\"EVAL GATE WARNING: $TSC_ERRORS TypeScript error(s) after $CURRENT_COUNT edits. Run 'tsc --noEmit' to see errors. Fix before pushing.\"}"
    exit 0
  fi

  # Run full eval (slower, only at 20+ edits)
  if [ "$CURRENT_COUNT" -ge 20 ] && [ "$_HAS_BUN" = "1" ]; then
    # Verify eval script exists before running
    if [ ! -f "$PLUGIN_ROOT/scripts/eval-runner.ts" ] && [ ! -f "$PLUGIN_ROOT/package.json" ]; then
      _log_error "eval-runner.ts not found, skipping full eval"
      exit 0
    fi
    EVAL_SCORE=$(bun run eval 2>&1 | grep "OVERALL" | grep -oE '[0-9]+\.[0-9]+' || echo "0")
    # Validate EVAL_SCORE is a plain decimal number before use
    if [[ "$EVAL_SCORE" =~ ^[0-9]+\.[0-9]+$ ]]; then
      # Persist score to convergence log for DevTools dashboard
      CONVERGENCE_FILE="$STATE_DIR/analytics/eval-convergence.jsonl"
      mkdir -p "$(dirname "$CONVERGENCE_FILE")"
      if command -v jq >/dev/null 2>&1; then
        jq -cn --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --argjson score "$EVAL_SCORE" --argjson edits "$CURRENT_COUNT" \
          '{ts: $ts, score: $score, edits: $edits}' >> "$CONVERGENCE_FILE" 2>/dev/null || true
      else
        printf '{"ts":"%s","score":%s,"edits":%d}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$EVAL_SCORE" "$CURRENT_COUNT" >> "$CONVERGENCE_FILE" 2>/dev/null || true
      fi

      SCORE_INT=$(echo "$EVAL_SCORE" | cut -d. -f1)
      if [ "$SCORE_INT" -lt "$EVAL_THRESHOLD" ]; then
        echo "{\"additionalContext\":\"EVAL GATE: Score $EVAL_SCORE/10 (threshold: $EVAL_THRESHOLD/10) after $CURRENT_COUNT edits. Address findings in .productionos/EVAL-REPORT.md before pushing.\"}"
      fi
    fi
  fi
fi

# Always allow (advisory, not blocking — blocking is handled by pre-push)
echo '{"decision":"allow"}'
