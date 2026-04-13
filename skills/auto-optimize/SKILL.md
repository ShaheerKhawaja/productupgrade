---
name: auto-optimize
description: "Self-improving agent optimization — generates challenger variants of any agent/command, benchmarks against baseline, promotes winners, logs learnings to instincts. Inspired by Karpathy's autoresearch pattern."
argument-hint: "[repo path, target, or task context]"
---

# auto-optimize

Self-improving agent optimization — generates challenger variants of any agent/command, benchmarks against baseline, promotes winners, logs learnings to instincts. Inspired by Karpathy's autoresearch pattern.

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `target` | string | required | Agent or command to optimize (e.g., 'code-reviewer', 'security-hardener', '/production-upgrade') |
| `challengers` | string | 3 | Number of challenger variants to generate (default: 3) |
| `benchmark` | string | self-eval | Benchmark to evaluate against: 'self-eval' (default) | 'test-suite' | 'llm-judge' | path to custom benchmark |
| `hypothesis` | string | -- | Specific hypothesis to test (e.g., 'add chain-of-thought to security-hardener'). If omitted, auto-generates hypotheses. |
| `max_cost` | string | 5 | Maximum cost in USD for the optimization run (default: 5) |
| `mode` | string | prompt | Optimization mode: prompt (modify agent instructions) | model (test different models) | layers (test prompt composition layers) | params (test convergence parameters) |

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
If the target is prompt-heavy or rubric-heavy, also dispatch `textgrad-optimizer` to propose gradient-style wording improvements before challengers are generated.

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

### Mode: rubric
- Same evaluation dimensions, different scoring rubric
- Dispatch `rubric-evolver` agent (OPRO pattern)
- Generate 5 rubric variants with different anchor points, weights, and criteria
- Score each variant against calibration set in `.productionos/calibration/`
- Promote the variant with highest ground-truth correlation
- See `templates/calibration-set.md` for calibration sample format

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
|

## Error Handling

| Scenario | Action |
|----------|--------|
| No target provided | Ask for clarification with examples |
| Target not found | Search for alternatives, suggest closest match |
| Agent dispatch fails | Fall back to manual execution, report the error |
| Ambiguous input | Present options, ask user to pick |
| Execution timeout | Save partial results, report what completed |

## Guardrails

1. Do not silently change scope or expand beyond the user request.
2. Prefer concrete outputs and verification over abstract descriptions.
3. Keep scope faithful to the user intent.
4. Preserve existing workflow guardrails and stop conditions.
5. Verify results before concluding. Run self-eval on output quality.
