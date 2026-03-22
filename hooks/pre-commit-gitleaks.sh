#!/usr/bin/env bash
# pre-commit-gitleaks.sh — PreToolUse hook that blocks git commits containing secrets
# Runs gitleaks on staged files if available, falls back to regex pattern matching
# Only triggers on Bash tool invocations containing 'git commit'
set -euo pipefail

STATE_DIR="${PRODUCTIONOS_HOME:-$HOME/.productionos}"
INPUT=$(cat)

# Only care about Bash tool
TOOL_NAME=""
COMMAND=""
if command -v jq >/dev/null 2>&1; then
  TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null || echo "")
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null || echo "")
else
  case "$INPUT" in
    *\"Bash\"*) TOOL_NAME="Bash" ;;
    *) echo '{"decision":"allow"}'; exit 0 ;;
  esac
  COMMAND=$(printf '%s' "$INPUT" | python3 -c "
import sys, json
try:
    data = json.loads(sys.stdin.read())
    print(data.get('tool_input', {}).get('command', ''))
except:
    print('')
" 2>/dev/null || echo "")
fi

# Only trigger on git commit commands
if [ "$TOOL_NAME" != "Bash" ]; then
  echo '{"decision":"allow"}'
  exit 0
fi

if ! echo "$COMMAND" | grep -qE '^\s*git\s+commit'; then
  echo '{"decision":"allow"}'
  exit 0
fi

# Method 1: Use gitleaks if available
if command -v gitleaks >/dev/null 2>&1; then
  GITLEAKS_OUTPUT=$(gitleaks detect --staged --no-banner --report-format json 2>/dev/null || true)
  FINDING_COUNT=$(echo "$GITLEAKS_OUTPUT" | python3 -c "
import sys, json
try:
    findings = json.loads(sys.stdin.read())
    if isinstance(findings, list):
        print(len(findings))
    else:
        print(0)
except:
    print(0)
" 2>/dev/null || echo "0")

  if [ "$FINDING_COUNT" -gt 0 ] 2>/dev/null; then
    # Extract first finding for the block message
    FIRST_FINDING=$(echo "$GITLEAKS_OUTPUT" | python3 -c "
import sys, json
try:
    findings = json.loads(sys.stdin.read())
    if findings:
        f = findings[0]
        print(f'{f.get(\"RuleID\", \"unknown\")} in {f.get(\"File\", \"unknown\")}:{f.get(\"StartLine\", \"?\")}')
except:
    print('unknown finding')
" 2>/dev/null || echo "secret detected")

    mkdir -p "$STATE_DIR/analytics"
    echo "{\"event\":\"secret_blocked\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"count\":$FINDING_COUNT,\"tool\":\"gitleaks\"}" >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
    echo "{\"decision\":\"block\",\"reason\":\"SECRET DETECTED: gitleaks found $FINDING_COUNT secret(s) in staged files. First: $FIRST_FINDING. Remove secrets before committing. Run 'gitleaks detect --staged' for details.\"}"
    exit 0
  fi

  echo '{"decision":"allow"}'
  exit 0
fi

# Method 2: Fallback regex pattern matching on staged diff
STAGED_DIFF=$(git diff --cached --diff-filter=ACMR 2>/dev/null || echo "")

if [ -z "$STAGED_DIFF" ]; then
  echo '{"decision":"allow"}'
  exit 0
fi

# Check for common secret patterns in staged changes
SECRET_MATCH=$(echo "$STAGED_DIFF" | grep -nE \
  '(AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36}|glpat-[a-zA-Z0-9_-]{20}|xoxb-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}|-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----|password\s*=\s*["\x27][^"\x27]{8,}|secret\s*=\s*["\x27][^"\x27]{8,}|token\s*=\s*["\x27][^"\x27]{20,})' \
  2>/dev/null | head -3 || true)

if [ -n "$SECRET_MATCH" ]; then
  MATCH_COUNT=$(echo "$SECRET_MATCH" | wc -l | tr -d ' ')
  FIRST_LINE=$(echo "$SECRET_MATCH" | head -1 | head -c 100)
  mkdir -p "$STATE_DIR/analytics"
  echo "{\"event\":\"secret_blocked\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"count\":$MATCH_COUNT,\"tool\":\"regex\"}" >> "$STATE_DIR/analytics/skill-usage.jsonl" 2>/dev/null || true
  echo "{\"decision\":\"block\",\"reason\":\"POTENTIAL SECRET: Regex detected $MATCH_COUNT possible secret(s) in staged files. First match: ${FIRST_LINE}... Install gitleaks for more accurate detection: brew install gitleaks\"}"
  exit 0
fi

echo '{"decision":"allow"}'
