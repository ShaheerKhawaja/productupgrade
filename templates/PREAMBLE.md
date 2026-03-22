## Preamble (runs before every ProductionOS skill)

```bash
# ProductionOS Preamble — universal initialization
STATE_DIR="${PRODUCTIONOS_HOME:-$HOME/.productionos}"

# 1. Initialize state
bash "${CLAUDE_PLUGIN_ROOT}/bin/pos-init" 2>/dev/null || true

# 2. Track session
mkdir -p "$STATE_DIR/sessions"
touch "$STATE_DIR/sessions/$$"
find "$STATE_DIR/sessions" -mmin +120 -type f -delete 2>/dev/null || true
_SESSIONS=$(find "$STATE_DIR/sessions" -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')

# 3. Load config
_PROACTIVE=$(bash "${CLAUDE_PLUGIN_ROOT}/bin/pos-config" get proactive 2>/dev/null || echo "true")
_AUTO_REVIEW=$(bash "${CLAUDE_PLUGIN_ROOT}/bin/pos-config" get auto_review 2>/dev/null || echo "true")
_AUTO_LEARN=$(bash "${CLAUDE_PLUGIN_ROOT}/bin/pos-config" get auto_learn 2>/dev/null || echo "true")

# 4. Detect environment
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
_REPO=$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo "unknown")

# 5. Log skill invocation
_TEL_START=$(date +%s)
bash "${CLAUDE_PLUGIN_ROOT}/bin/pos-telemetry" "${_POS_SKILL_NAME:-unknown}" 2>/dev/null || true

# 6. Print status
echo "ProductionOS | Branch: $_BRANCH | Sessions: $_SESSIONS | Review: $_AUTO_REVIEW"
```

If `_PROACTIVE` is `"false"`, do not proactively suggest ProductionOS skills.
If `_AUTO_REVIEW` is `"true"`, run lightweight code review after major edits.
If `_AUTO_LEARN` is `"true"`, extract patterns at session end.
If `_SELF_EVAL` is `"true"` (default), run Self-Eval Protocol after every agent action.

## Postamble (runs after every ProductionOS agent action)

After every agent completes its work, run the Self-Eval Protocol (`templates/SELF-EVAL-PROTOCOL.md`):

```bash
_SELF_EVAL=$(bash "${CLAUDE_PLUGIN_ROOT}/bin/pos-config" get self_eval 2>/dev/null || echo "true")
```

If `_SELF_EVAL` is `"true"`:
1. Apply the 7 Questions from SELF-EVAL-PROTOCOL.md to the agent's output
2. If score = 10.0: PASS — log and proceed. The ONLY acceptable outcome.
3. If score 9.0-9.9: SELF-HEAL — apply CEO+Eng review logic, fix gaps (max 5 iterations)
4. If score 8.0-8.9: SIGNIFICANT HEAL — re-do lowest dimensions with /plan-ceo-review rigor
5. If score < 8.0: BLOCK — do NOT commit, escalate to human with /retro analysis
6. Log all evaluations to `.productionos/self-eval/`
7. Feed scores into convergence tracking — convergence target is always 10.0

This is enabled by default. Disable with `pos-config set self_eval false`.

## Context Management

At session start, the `session-context-manager` agent protocol applies:
- L0 context (< 2K tokens) is always loaded: project identity, branch, goals, constraints
- L1 context (2K-10K per item) is loaded on demand based on task type
- L2 context (10K+) is loaded only when explicitly referenced
- Context checkpoints every 30 minutes or 5 agent dispatches
- Context compression triggers at 60% window usage
- Context rot detection monitors for repeated work, contradictions, and score regression
