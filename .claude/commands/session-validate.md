---
name: session-validate
description: "End-of-session self-training — captures session metrics, extracts patterns via metaclaw-learner, updates instincts, and generates optimization hypotheses for the next run."
arguments:
  - name: mode
    description: "Validation mode: quick (metrics only) | standard (metrics + lessons) | deep (metrics + lessons + hypothesis generation)"
    required: false
    default: "standard"
---

# Session Validate — End-of-Session Self-Training

You are the Session Validator. After every ProductionOS session, you capture what happened, extract what was learned, and prepare the system to be better next time.

**This is the feedback loop that makes ProductionOS compound.** Without session validation, each run starts from zero. With it, run #N inherits all the wisdom of runs #1 through #N-1.

## Step 0: Preamble

Before executing, run the shared ProductionOS preamble (`templates/PREAMBLE.md`).

## Step 1: Capture Session Metrics

Read the session artifacts:
```bash
# Session analytics
cat ~/.productionos/analytics/skill-usage.jsonl | tail -50

# Active session markers
ls ~/.productionos/sessions/

# Git commits this session
git log --oneline --since="$(date -v-2H +%Y-%m-%dT%H:%M:%S)" 2>/dev/null || git log --oneline -20

# Self-eval results (if any)
ls .productionos/SELF-EVAL-*.md 2>/dev/null
cat .productionos/SELF-EVAL-*.md 2>/dev/null | tail -30

# Convergence data
cat .productionos/CONVERGENCE-LOG.md 2>/dev/null | tail -20
```

Compute:
```
SESSION METRICS:
  duration: {estimated from first/last analytics entries}
  commits: {count}
  files_changed: {count from git diff --stat}
  agents_dispatched: {count from skill-usage.jsonl}
  self_eval_score: {average from SELF-EVAL results}
  convergence_trajectory: {improving|stalled|declining}
  test_pass_rate: {from last bun test}
  cost_estimate: {from TOKEN-BUDGET.md or agent count * $0.75}
```

## Step 2: Extract Lessons (standard + deep modes)

Dispatch the `metaclaw-learner` agent to analyze session artifacts:
```
Read agents/metaclaw-learner.md, extract its <role> and <instructions>.
Dispatch via Agent tool:
  prompt: "Analyze the session artifacts in .productionos/ and extract lessons. Focus on: what worked well, what failed, what patterns emerged, what should be done differently next time."
  run_in_background: false (wait for results)
```

The metaclaw-learner will:
1. Read all `.productionos/` artifacts from this session
2. Extract structured lessons (trigger → lesson → rule)
3. Write to `~/.productionos/instincts/project/{hash}/lessons.json`
4. Promote high-confidence patterns (>0.8) to global instincts

## Step 3: Generate Optimization Hypotheses (deep mode only)

If mode is `deep`, analyze which agents/commands performed below expectations and generate optimization hypotheses:

```
FOR each agent dispatched this session:
  IF self_eval_score < 8.0:
    Generate 1-2 optimization hypotheses
    Write to .productionos/SESSION-VALIDATE-HYPOTHESES.md
    These become inputs for the next /auto-optimize run
```

## Step 4: Write Session Report

Write `.productionos/SESSION-VALIDATE-REPORT.md`:

```markdown
# Session Validation Report

## Metrics
| Metric | Value |
|--------|-------|
| Duration | {X}min |
| Commits | {N} |
| Files changed | {N} |
| Agents dispatched | {N} |
| Self-eval score | {X.X}/10 |
| Test pass rate | {N}% |
| Cost estimate | ${X.XX} |

## Lessons Extracted: {N}
{List key lessons}

## Instincts Updated: {N}
{List instinct changes}

## Optimization Hypotheses: {N}
{List for next /auto-optimize run}

## Session Quality: {EXCELLENT|GOOD|ACCEPTABLE|NEEDS_IMPROVEMENT}
```

## Step 5: Update Convergence

If the convergence engine is tracking this project, append session results:
```bash
bun run scripts/convergence.ts record --score {session_score} --session {session_id}
```

## Guardrails

- Session-validate NEVER modifies source code
- It ONLY reads artifacts, extracts lessons, and writes reports
- Instinct updates are additive (never delete existing instincts)
- Cost: minimal (~$0.50 per validation, uses sonnet for extraction)
