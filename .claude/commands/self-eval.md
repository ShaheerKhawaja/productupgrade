---
name: self-eval
description: "Run self-evaluation on recent work — questions quality, necessity, correctness, dependencies, completeness, learning, and honesty. Enabled by default in all flows. Standalone invocation for on-demand evaluation."
arguments:
  - name: target
    description: "What to evaluate: 'last' (last agent output), 'session' (all session work), 'diff' (git diff), or a specific .productionos/ artifact path"
    required: false
    default: "last"
  - name: depth
    description: "Evaluation depth: quick (Q1-Q3 only) | standard (all 7 questions) | deep (7 questions + adversarial challenge)"
    required: false
    default: "standard"
  - name: heal
    description: "Enable self-heal loop: on | off (default: on)"
    required: false
    default: "on"
---

# /self-eval — Self-Evaluation Command

You are the self-evaluation orchestrator. You evaluate the quality, necessity, and correctness of recent work using the ProductionOS Self-Eval Protocol.

## Step 0: Preamble

Before executing, run the shared ProductionOS preamble (`templates/PREAMBLE.md`).

## Step 1: Determine Evaluation Target

Based on `$ARGUMENTS.target`:

### target = "last"
```bash
# Find the most recent agent output
ls -t .productionos/*.md .productionos/**/*.md 2>/dev/null | head -5
```
Read the most recent artifact. This is your evaluation target.

### target = "session"
```bash
# Find all work done this session
ls -t .productionos/self-eval/ 2>/dev/null | head -20
git log --oneline --since="4 hours ago" 2>/dev/null | head -20
git diff --stat HEAD~10 2>/dev/null | tail -5
```
Evaluate ALL work produced this session. Produce a session-level summary.

### target = "diff"
```bash
# Evaluate the current git diff
git diff --stat 2>/dev/null
git diff --name-only 2>/dev/null
```
Evaluate all uncommitted changes against the self-eval protocol.

### target = specific path
Read the specified file and evaluate it.

## Step 2: Dispatch Self-Evaluator Agent

Read `agents/self-evaluator.md` and dispatch:

```
Agent tool:
  description: "self-evaluator: Evaluate {target description}"
  prompt: "{self-evaluator role + instructions}\n\nTASK: Evaluate {target}\nDEPTH: $ARGUMENTS.depth\nOUTPUT: .productionos/self-eval/{timestamp}-eval.md"
```

## Step 3: Process Results

Read the evaluation output. Based on score:

### Score >= 8.0 — PASS
```
✅ Self-Eval PASS (X.X/10)
{summary of findings}
Logged to .productionos/self-eval/{file}
```

### Score 6.0-7.9 — CONDITIONAL (self-heal if enabled)
If `$ARGUMENTS.heal` is "on":
1. Read the lowest-scoring questions
2. Generate targeted fix instructions
3. Dispatch the original agent (or self-healer) to address issues
4. Re-run self-eval (max 3 loops)
5. Report final result

If `$ARGUMENTS.heal` is "off":
```
⚠️ Self-Eval CONDITIONAL (X.X/10)
{issues that need attention}
Run /self-eval --heal on to attempt self-fix
```

### Score < 6.0 — FAIL
```
❌ Self-Eval FAIL (X.X/10)
BLOCKED: The following issues must be resolved before proceeding:
{critical issues list}
```

## Step 4: Deep Mode (if depth = "deep")

After standard evaluation, dispatch the `adversarial-reviewer` agent:

```
Agent tool:
  description: "adversarial-reviewer: Challenge self-eval findings"
  prompt: "Review this self-evaluation and argue AGAINST the scores.
  Find where the evaluator was too generous.
  Find issues the evaluator missed.
  Target: .productionos/self-eval/{latest}
  OUTPUT: .productionos/self-eval/{timestamp}-adversarial.md"
```

Merge adversarial findings. Adjust scores if adversarial review finds valid issues.

## Step 5: Session Summary (if target = "session")

If evaluating the full session, produce:

```markdown
# Session Self-Evaluation Summary

**Date:** {date}
**Duration:** ~{hours}h
**Agents evaluated:** {count}
**Average score:** X.X/10
**Lowest score:** X.X/10 ({agent-name})

## Score Distribution
| Score Range | Count | Agents |
|-------------|-------|--------|
| 9-10 | N | {names} |
| 8-8.9 | N | {names} |
| 6-7.9 | N | {names} |
| < 6 | N | {names} |

## Top Issues Across Session
1. {most common issue}
2. {second most common}
3. {third most common}

## Lessons Extracted
{aggregated lessons from all evaluations}

## Recommendations for Next Session
{what to focus on, what to avoid}
```

Save to `.productionos/self-eval/SESSION-{date}.md`.

## Guardrails

- Self-eval NEVER modifies the work it evaluates (read-only analysis)
- Self-heal dispatches SEPARATE agents to make fixes
- Max 3 self-heal iterations before escalating to human
- All evaluations are logged for cross-session learning
- Self-eval of self-eval is NOT allowed (infinite loop prevention)
