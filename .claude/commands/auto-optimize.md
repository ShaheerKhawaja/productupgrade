---
name: auto-optimize
description: "Self-improving agent optimization — generates challenger variants of any agent/command, benchmarks against baseline, promotes winners, logs learnings to instincts. Inspired by Karpathy's autoresearch pattern."
arguments:
  - name: target
    description: "Agent or command to optimize (e.g., 'code-reviewer', 'security-hardener', '/production-upgrade')"
    required: true
  - name: challengers
    description: "Number of challenger variants to generate (default: 3)"
    required: false
    default: "3"
  - name: benchmark
    description: "Benchmark to evaluate against: 'self-eval' (default) | 'test-suite' | 'llm-judge' | path to custom benchmark"
    required: false
    default: "self-eval"
  - name: hypothesis
    description: "Specific hypothesis to test (e.g., 'add chain-of-thought to security-hardener'). If omitted, auto-generates hypotheses."
    required: false
  - name: max_cost
    description: "Maximum cost in USD for the optimization run (default: 5)"
    required: false
    default: "5"
  - name: mode
    description: "Optimization mode: prompt (modify agent instructions) | model (test different models) | layers (test prompt composition layers) | params (test convergence parameters)"
    required: false
    default: "prompt"
---

# Auto-Optimize — Self-Improving Agent Loop

You are the Auto-Optimize orchestrator. You implement Karpathy's autoresearch pattern for ProductionOS: generate challenger variants, benchmark against baseline, promote winners, harvest learnings.

**The compound moat:** Every optimization run makes ProductionOS measurably better. Run #10 benefits from all learnings of runs #1-9.

## Step 0: Preamble

Before executing, run the shared ProductionOS preamble (`templates/PREAMBLE.md`).

## Phase 1: Baseline Capture

### 1.1: Read Target Definition
```bash
# For agents:
cat agents/$ARGUMENTS.target.md

# For commands:
cat .claude/commands/$ARGUMENTS.target.md
```

### 1.2: Extract Current Metrics
Read existing performance data if available:
```bash
cat ~/.productionos/analytics/skill-usage.jsonl | grep "$ARGUMENTS.target" | tail -20
cat ~/.productionos/instincts/project/*/lessons.json 2>/dev/null | grep "$ARGUMENTS.target"
```

### 1.3: Record Baseline
Run the target against the benchmark to establish baseline:

```
BASELINE:
  target: $ARGUMENTS.target
  benchmark: $ARGUMENTS.benchmark
  timestamp: {ISO8601}
  metrics:
    score: {0-10 from self-eval or test pass rate or LLM-judge}
    tokens: {token count for the run}
    duration: {seconds}
    issues_found: {count, for auditors}
    false_positives: {count}
  prompt_length: {word count of instructions}
  model: {current model assignment}
  layers: {which prompt composition layers are active}
```

Write baseline to `.productionos/AUTO-OPTIMIZE-BASELINE.md`.

## Phase 2: Hypothesis Generation

### If $ARGUMENTS.hypothesis is provided:
Use the user's hypothesis directly. Create $ARGUMENTS.challengers variants that test this hypothesis.

### If no hypothesis:
Read the `prompt-optimizer` agent definition from `agents/prompt-optimizer.md` and dispatch it to generate hypotheses.

The prompt-optimizer should analyze:
1. The target's current instructions (strengths, weaknesses)
2. Recent metaclaw-learner lessons about this target
3. The benchmark it will be evaluated against
4. Prompt engineering research patterns (from `templates/PROMPT-COMPOSITION.md`)

Generate $ARGUMENTS.challengers distinct hypotheses, each with:
```json
{
  "id": "challenger-{N}",
  "hypothesis": "{what change we're testing}",
  "change_type": "prompt|model|layers|params",
  "expected_improvement": "{what metric should improve and by how much}",
  "risk": "{what could get worse}",
  "modification": "{specific text changes to apply}"
}
```

Write hypotheses to `.productionos/AUTO-OPTIMIZE-HYPOTHESES.md`.

## Phase 3: Challenger Generation

For each hypothesis, create a modified version of the target:

### Mode: prompt (default)
- Copy the target agent/command definition
- Apply the hypothesis modification to the instructions
- Keep all other fields (model, tools, stakes) identical
- Write to `.productionos/challengers/challenger-{N}.md`

### Mode: model
- Same instructions, different model assignment
- Test combinations: opus (planning), sonnet (execution), haiku (validation)

### Mode: layers
- Same agent, different prompt composition layers
- Test with/without: Emotion, Meta, ToT, GoT, CoD, Distractor, Generated Knowledge

### Mode: params
- Same agent, different convergence parameters
- Test: EMA alpha (0.1-0.5), convergence threshold (0.01-0.1), max iterations (3-10)

## Phase 4: Benchmark Execution

Run baseline and all challengers against the same benchmark. The benchmark MUST be identical for fair comparison.

### Benchmark: self-eval
For each variant:
1. Dispatch the agent with a fixed test task
2. Run `/self-eval` on the output
3. Record the 7-question scores + overall grade

### Benchmark: test-suite
For each variant:
1. Dispatch the agent against the codebase
2. Run `bun test` after the agent completes
3. Record pass rate, new test failures, coverage delta

### Benchmark: llm-judge
For each variant:
1. Dispatch the agent with a fixed test task
2. Submit output to `llm-judge` agent for blind evaluation
3. Record dimension scores, confidence intervals

### Execution Protocol
```
FOR variant IN [baseline, challenger-1, ..., challenger-N]:
  1. Reset to clean state (git stash or worktree isolation)
  2. Apply variant's modifications (if challenger)
  3. Run the target against the benchmark task
  4. Collect metrics: score, tokens, duration, output quality
  5. Revert changes
  6. Record results in .productionos/AUTO-OPTIMIZE-RESULTS.md
```

**Cost tracking:** Before each variant run, check accumulated cost against $ARGUMENTS.max_cost. Halt if exceeded.

## Phase 5: Harvest

### 5.1: Compare Results
```
RESULTS TABLE:
| Variant | Score | Tokens | Duration | Delta vs Baseline | p-value |
|---------|-------|--------|----------|-------------------|---------|
| baseline | 7.2 | 4500 | 45s | — | — |
| challenger-1 | 8.1 | 4200 | 42s | +0.9 | 0.02* |
| challenger-2 | 6.8 | 3800 | 38s | -0.4 | 0.15 |
| challenger-3 | 7.5 | 5100 | 51s | +0.3 | 0.28 |
```

### 5.2: Select Winner
- Winner = variant with highest primary metric that is statistically significant (p < 0.05 or delta > 0.5)
- If no variant beats baseline: baseline wins (no change)
- Prefer simpler (shorter) prompts at equal metrics

### 5.3: Promote Winner
If a challenger wins:
1. Copy the winning variant's modifications back to the target file
2. Log the change with a descriptive commit message
3. Update `~/.productionos/instincts/` with the learned pattern

### 5.4: Log Learnings
Write `.productionos/AUTO-OPTIMIZE-HARVEST.md`:
```markdown
# Auto-Optimize Harvest — {target}

## Winner: {challenger-N or baseline}
## Hypothesis: {what was tested}
## Delta: {+X.X improvement}
## Modification Applied: {yes/no}

## Learnings for Instincts:
- {Pattern 1: what worked and why}
- {Pattern 2: what didn't work and why}
- {Pattern 3: what to try next}

## Next Run Suggestions:
- {Follow-up hypothesis based on what was learned}
```

Dispatch `metaclaw-learner` agent to extract cross-run lessons and update the instinct system.

## Phase 6: Report

Write the final report to `.productionos/AUTO-OPTIMIZE-REPORT.md`:
```markdown
# Auto-Optimize Report

Target: {agent/command name}
Mode: {prompt|model|layers|params}
Challengers: {N}
Benchmark: {self-eval|test-suite|llm-judge}
Cost: ${X.XX}
Duration: {minutes}

## Result: {IMPROVED|NO_CHANGE|REGRESSED}
## Score: {baseline} → {winner} (Δ{delta})
## Winner: {variant name}

## What Changed:
{specific modifications applied}

## What Was Learned:
{key insights for future runs}
```

## Guardrails

- **Cost ceiling:** $ARGUMENTS.max_cost (default $5). Hard halt when exceeded.
- **No regression allowed:** If ALL challengers score lower than baseline, keep baseline.
- **Prompt length limit:** Challenger prompts cannot exceed 2x the baseline length.
- **Model safety:** Model changes require human approval before promotion.
- **Idempotent:** Running auto-optimize twice with the same inputs produces the same baseline measurement.
- **Rollback:** If promoted winner causes test failures in subsequent runs, revert automatically.

## Cron Mode

For continuous improvement via `claude -p` or GitHub Actions:
```bash
# Run nightly optimization on a different agent each night
claude -p "Run /auto-optimize on code-reviewer with 3 challengers using llm-judge benchmark"
```

Schedule in `.github/workflows/auto-optimize.yml` or via `/loop 24h /auto-optimize code-reviewer`.

## Integration Points

- **Convergence engine** (`scripts/convergence.ts`): tracks score trajectory across optimization runs
- **Self-eval** (`/self-eval`): primary benchmark for prompt optimization
- **MetaClaw learner** (`agents/metaclaw-learner.md`): cross-run pattern extraction
- **Instincts** (`~/.productionos/instincts/`): persistent storage for learned patterns
- **Worktree isolation** (`scripts/worktree-manager.ts`): isolate challenger runs from each other
