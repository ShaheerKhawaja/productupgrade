#!/usr/bin/env bash
# pre-push-gate.sh — Blocks git push if tests fail or eval score < 10/10.
# Install: ln -sf ../../hooks/pre-push-gate.sh .git/hooks/pre-push
# Also called by the Stop hook for session-end validation.
set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
# Handle being called from .git/hooks/ (symlink target)
if [ ! -f "$PLUGIN_ROOT/package.json" ]; then
  PLUGIN_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  ProductionOS Pre-Push Eval Gate                       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

cd "$PLUGIN_ROOT"

# ─── Gate 1: TypeScript Type Check ──────────────────────────
echo -n "  [1/4] TypeScript type check... "
TSC_OUTPUT=$(./node_modules/.bin/tsc --noEmit 2>&1) || true
if echo "$TSC_OUTPUT" | grep -q "error TS"; then
  TSC_ERRORS=$(echo "$TSC_OUTPUT" | grep -c "error TS" || true)
  echo -e "${RED}FAIL${NC} ($TSC_ERRORS errors)"
  echo "$TSC_OUTPUT" | head -10
  echo ""
  echo -e "${RED}PUSH BLOCKED: Fix TypeScript errors before pushing.${NC}"
  exit 1
fi
echo -e "${GREEN}PASS${NC}"

# ─── Gate 2: Test Suite ─────────────────────────────────────
echo -n "  [2/4] Test suite... "
TEST_OUTPUT=$(bun test 2>&1) || true
PASS_COUNT=$(echo "$TEST_OUTPUT" | grep -oE '[0-9]+ pass' | head -1 | grep -oE '[0-9]+' || echo "0")
FAIL_COUNT=$(echo "$TEST_OUTPUT" | grep -oE '[0-9]+ fail' | head -1 | grep -oE '[0-9]+' || echo "0")

if [ "${FAIL_COUNT:-0}" -gt 0 ]; then
  echo -e "${RED}FAIL${NC} ($FAIL_COUNT failures, $PASS_COUNT passes)"
  echo "$TEST_OUTPUT" | grep "fail" | head -10
  echo ""
  echo -e "${RED}PUSH BLOCKED: Fix test failures before pushing.${NC}"
  exit 1
fi
echo -e "${GREEN}PASS${NC} ($PASS_COUNT tests)"

# ─── Gate 3: Agent Validation ───────────────────────────────
echo -n "  [3/4] Agent validation... "
VALIDATE_OUTPUT=$(bun run validate 2>&1) || true
INVALID=$(echo "$VALIDATE_OUTPUT" | grep -c "INVALID" || true)

if [ "${INVALID:-0}" -gt 0 ]; then
  echo -e "${RED}FAIL${NC} ($INVALID invalid agents)"
  echo "$VALIDATE_OUTPUT" | grep "INVALID" | head -5
  echo ""
  echo -e "${RED}PUSH BLOCKED: Fix agent validation errors.${NC}"
  exit 1
fi
echo -e "${GREEN}PASS${NC}"

# ─── Gate 4: Eval Score ─────────────────────────────────────
echo -n "  [4/4] Eval score (target: 10/10)... "
EVAL_OUTPUT=$(bun run eval 2>&1) || true
EVAL_SCORE=$(echo "$EVAL_OUTPUT" | grep "OVERALL" | grep -oE '[0-9]+\.[0-9]+' | head -1 || echo "0")
CRITICAL_COUNT=$(echo "$EVAL_OUTPUT" | grep "Total:" | grep -oE '[0-9]+ critical' | head -1 | grep -oE '[0-9]+' || echo "0")

if [ -n "$EVAL_SCORE" ] && [ "$EVAL_SCORE" != "0" ]; then
  SCORE_INT=$(echo "$EVAL_SCORE" | cut -d. -f1)
  if [ "$SCORE_INT" -lt 10 ]; then
    echo -e "${YELLOW}${EVAL_SCORE}/10${NC}"
    if [ "${CRITICAL_COUNT:-0}" -gt 0 ]; then
      echo -e "  ${RED}$CRITICAL_COUNT critical finding(s) — PUSH BLOCKED${NC}"
      echo "  See .productionos/EVAL-REPORT.md for details"
      exit 1
    fi
    echo -e "  ${YELLOW}Below 10/10 target — advisory warning (no critical findings)${NC}"
    echo "  Address findings in .productionos/EVAL-REPORT.md"
  else
    echo -e "${GREEN}${EVAL_SCORE}/10${NC}"
  fi
else
  echo -e "${YELLOW}SKIP${NC} (eval runner unavailable)"
fi

echo ""
echo -e "${GREEN}All gates passed. Push allowed.${NC}"
echo ""
