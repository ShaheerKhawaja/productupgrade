---
name: self-eval
description: "Run self-evaluation on recent work — questions quality, necessity, correctness, dependencies, completeness, learning, and honesty. Enabled by default in all flows. Standalone invocation for on-demand evaluation."
argument-hint: "[repo path, target, or task context]"
---

# self-eval

Self-evaluation orchestrator for ProductionOS. Evaluates the quality, necessity, and correctness of recent work using the 7-question protocol. Enabled by default in every ProductionOS flow. Can also be invoked standalone for on-demand evaluation of any artifact, session, or diff.

This skill is SELF-CONTAINED. All protocol details, questions, scoring, and output formats are embedded below.

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `target` | `last`, `session`, `diff`, or a file path | `last` | What to evaluate |
| `depth` | `quick`, `standard`, `deep` | `standard` | Quick = Q1-Q3 only. Standard = all 7. Deep = 7 + adversarial challenge. |
| `heal` | `on`, `off` | `on` | Enable self-heal loop for scores < 8.0 |

---

## Step 1: Determine Evaluation Target

### target = "last"
Find the most recent agent output artifact:
```bash
ls -t .productionos/*.md .productionos/**/*.md 2>/dev/null | head -5
```
Read the most recent file. This is the evaluation target.

### target = "session"
Gather all work from the current session:
```bash
ls -t .productionos/self-eval/ 2>/dev/null | head -20
git log --oneline --since="4 hours ago" 2>/dev/null | head -20
git diff --stat HEAD~10 2>/dev/null | tail -5
```
Evaluate ALL work produced this session. Produce a session-level summary.

### target = "diff"
Evaluate all uncommitted changes:
```bash
git diff --stat 2>/dev/null
git diff --name-only 2>/dev/null
```

### target = specific path
Read the specified file and evaluate it.

---

## Step 2: The 7-Question Protocol

Every evaluation MUST answer these questions. For `depth=quick`, answer Q1-Q3 only. For `standard` and `deep`, answer all 7.

### Q1: Quality -- Was my work actually good?
- Score the output 1-10 with specific evidence
- Would a senior engineer accept this without changes?
- Does the output cite file:line evidence for every claim?
- Is there anything hand-waved or assumed without verification?
- Check: are there obvious shortcuts that reduce quality?

### Q2: Necessity -- Was this work actually needed?
- Did it solve the problem that was actually asked for?
- Was anything added that was not requested (scope creep)?
- Were changes made "while in there" that were not needed?
- Could the problem have been solved with LESS work?
- Check: count files modified vs files that strictly needed changing

### Q3: Correctness -- Did I make mistakes?
- Re-read the output. Are there logical errors?
- Were new bugs, regressions, or inconsistencies introduced?
- Are code changes syntactically and semantically correct?
- Were claims tested or verified, not just assumed?
- Check: run lint + type check if code was changed

### Q4: Dependencies -- Did I map what this touches?
- What files depend on what was changed?
- Were downstream consumers of modified interfaces checked?
- Are there tests that need updating because of these changes?
- Could the changes break something in a different part of the system?
- Check: grep for imports of any modified module

### Q5: Completeness -- Did I finish the job?
- Are there edge cases not handled?
- Were any TODOs or FIXMEs left that should have been resolved?
- Are empty states, error states, and loading states covered?
- Would someone else need to "clean up after me"?
- Check: search for TODO/FIXME in changed files

### Q6: Learning -- What should I remember?
- Was a pattern discovered that other agents should know?
- Was a gotcha encountered that should be documented?
- Is there a lesson from this task that applies to future work?
- Should a pattern be extracted to a reusable template?
- Check: if yes, format as a lesson for cross-session instinct extraction

### Q7: Honesty -- Am I being honest with myself?
- Am I inflating my score because I want to be done?
- Am I hiding doubts about my solution?
- Is there something that should be flagged for human review?
- Would I bet $1000 that this solution is correct?
- Anti-pattern check: if all scores are 10/10, automatically flag as suspicious

---

## Step 3: Scoring and Output

After answering all questions, produce this structured output:

```markdown
## Self-Evaluation

| Question | Score | Evidence |
|----------|-------|----------|
| Quality | X/10 | {one-line evidence with file:line if applicable} |
| Necessity | X/10 | {one-line evidence} |
| Correctness | X/10 | {one-line evidence} |
| Dependencies | X/10 | {one-line evidence} |
| Completeness | X/10 | {one-line evidence} |
| Learning | X/10 | {one-line evidence} |
| Honesty | X/10 | {one-line evidence} |

**Overall: X.X/10**
**Confidence: X%**

### Issues Found During Self-Eval
- {issue 1 -- what to fix}
- {issue 2 -- what to fix}

### Lessons Learned
- {lesson 1}

### Flag for Human Review
- {item -- or "None"}
```

Save to `.productionos/self-eval/{timestamp}-eval.md`.

---

## Step 4: Score Threshold Actions

### Score >= 8.0 -- PASS
```
PASS (X.X/10)
{summary of findings}
Logged to .productionos/self-eval/{file}
```
Production-ready quality. Proceed with confidence.

### Score 6.0 - 7.9 -- CONDITIONAL (self-heal if enabled)

If `heal=on`:
1. Identify the lowest-scoring questions
2. Generate targeted fix instructions for those specific issues
3. Dispatch a SEPARATE agent (self-healer) to make the fixes -- self-eval NEVER modifies work itself
4. Re-run self-eval on the fixed output
5. Maximum 3 heal loops -- diminishing returns after 3
6. If still < 8.0 after 3 loops: escalate to human with full eval report

If `heal=off`:
```
CONDITIONAL (X.X/10)
{issues that need attention}
Run /self-eval --heal on to attempt self-fix
```

### Score < 6.0 -- FAIL
```
FAIL (X.X/10)
BLOCKED: The following issues must be resolved before proceeding:
{critical issues list}
```
Do NOT commit. Do NOT declare success. Escalate to human immediately.

---

## Step 5: Deep Mode (depth = "deep" only)

After standard evaluation, dispatch the adversarial reviewer:

**Adversarial Review Prompt:**
> Review this self-evaluation and argue AGAINST the scores.
> Find where the evaluator was too generous.
> Find issues the evaluator missed entirely.
> Challenge every score >= 8 with a counter-argument.
> Target: .productionos/self-eval/{latest}
> Output: .productionos/self-eval/{timestamp}-adversarial.md

Merge adversarial findings. Adjust scores downward if the adversarial review finds valid issues. The adversarial score is authoritative when it conflicts with the original.

---

## Step 6: Session Summary (target = "session" only)

When evaluating the full session, produce:

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

---

## When Self-Eval Triggers (cross-cutting)

Self-eval is embedded in ALL ProductionOS commands, not just standalone invocation:

| Context | Trigger Point |
|---------|---------------|
| `/production-upgrade` | After each agent completes, gates commit |
| `/auto-swarm` | Per agent per wave, low scores trigger re-spawn |
| `/omni-plan-nth` | After each iteration, score feeds convergence |
| `/frontend-upgrade` | Per fix wave, gates convergence |
| `/designer-upgrade` | After mockup generation and design system creation |
| `/ux-genie` | After user story creation and agent orchestration |
| All other commands | At pipeline completion before declaring success |
| Standalone | Via `/self-eval` command on demand |

---

## Anti-Patterns Detected by Self-Eval

| Anti-Pattern | Detection | Score Impact |
|-------------|-----------|-------------|
| Rubber-stamp eval | All scores 10/10 | Auto-flag as suspicious |
| Scope creep | Changed 50 files when asked to fix 1 | Necessity drops |
| Untested claims | "This should work" without verification | Correctness drops |
| Orphaned changes | Modified interface without updating consumers | Dependencies drops |
| Premature completion | TODOs left in committed code | Completeness drops |
| Zero learning | No extractable insight (acceptable for trivial tasks) | Learning drops |
| Score inflation | Hiding doubts to avoid re-work | Honesty drops |

---

## Guardrails (Non-Negotiable)

1. Self-eval NEVER modifies the work it evaluates -- read-only analysis only
2. Self-heal dispatches SEPARATE agents to make fixes
3. Maximum 3 self-heal iterations before escalating to human
4. All evaluations are logged to `.productionos/self-eval/` for cross-session learning
5. Self-eval of self-eval is NOT allowed -- infinite loop prevention
6. Scores feed into convergence tracking via `scripts/convergence.ts`

## Output Files

```
.productionos/self-eval/
  {timestamp}-eval.md           # Individual evaluation
  {timestamp}-adversarial.md    # Deep mode adversarial challenge
  SESSION-{date}.md             # Session-level summary
```
