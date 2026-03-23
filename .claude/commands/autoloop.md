---
name: autoloop
description: "Autonomous recursive improvement loop for a single target. Runs gap analysis, recursive refinement, evaluation, and convergence checks until the target reaches quality threshold or converges."
---

# /autoloop — Autonomous Recursive Improvement

## Step 0: Preamble
Before executing, run the shared ProductionOS preamble (`templates/PREAMBLE.md`).

You are running the `/autoloop` command. This is an autonomous recursive improvement loop that takes a target and iteratively improves it until convergence.

## Input

The user provides:
- **Target**: A file path, directory, or description of what to improve
- **Goal**: What "good" looks like (optional -- defaults to "maximize quality score")

## Execution Protocol

### Step 1: Understand the Target
1. If target is a file path: Read it and assess current state
2. If target is a directory: Scan for key files and assess overall quality
3. If target is a description: Identify what needs to be created or improved

### Step 2: Gap Analysis
1. Score current state using `python3 ~/.claude/skills/rlm/scripts/confidence_scorer.py`
2. Scan `~/repos/` for reference implementations (per CLAUDE.md Auto-Enrichment Protocol)
3. Check `~/.productionos/rlm/reference-corpus/` for similar high-quality outputs
4. Identify specific gaps between current state and goal

### Step 3: Initialize Recursion
1. Create session state at `~/.productionos/rlm/recursion-state.json`:
   ```json
   {
     "session_id": "<generated>",
     "target": "<target>",
     "goal": "<goal>",
     "layer": "L17",
     "current_iteration": 0,
     "max_iterations": 10,
     "best_iteration": 0,
     "best_score": 0.0,
     "scores": [],
     "convergence_verdict": "CONTINUE",
     "status": "running"
   }
   ```
2. Select the appropriate layer:
   - Complex decomposable task -> L16 RecDecomp
   - Quality improvement (default) -> L17 SelfRefine
   - Context too large -> L18 RecSumm
   - Security/factual claims -> L19 RecVerify
   - Plan execution -> L20 PEER

### Step 4: Iteration Loop (max 10)

For each iteration:

1. **Score**: Run confidence scorer on current output
2. **Record**: Add score to convergence monitor
3. **Check Convergence**: Run all 5 algorithms from `convergence.py`:
   - Score delta tracking (stalled if < 0.1 for 2+ iterations)
   - Spectral contraction (converged if cosine > 0.95)
   - Diminishing returns (stalled if DR ratio < 0.15)
   - Oscillation detection (oscillating if sign changes > 60%)
   - EMA velocity (plateau if |EMA delta| < 0.05)
4. **If STOP**: Return best iteration output
5. **If CONTINUE**: Apply refinement via the selected layer
6. **Quality Gate**: Check monotonic improvement via `quality_gate.py`
7. **Log**: Write metrics to `~/.productionos/rlm/metrics/`

### Step 5: Completion
1. Return the output from the best-scoring iteration
2. Show convergence trajectory (ASCII visualization)
3. Report: iterations completed, final score, convergence reason
4. Save final state to recursion-state.json

## Output Format

```
AUTOLOOP COMPLETE
Target: <target>
Goal: <goal>
Iterations: <n> / <max>
Best Score: <score> (iteration <i>)
Convergence: <verdict> — <reason>

Trajectory:
  i=0  |***           | 4.20
  i=1  |*********     | 6.50 (+2.30)
  i=2  |***********   | 7.20 (+0.70)
  i=3  |************  | 7.30 (+0.10) <- converged

Applied: <output from best iteration>
```

## Constraints

- Max 10 iterations per autoloop invocation
- Configurable depth per iteration (default: 1)
- Always check token budget before each iteration
- Never modify Phase 1 or Phase 2 RLM scripts
- Log everything to metrics for PromptEvo batch analysis
- Use `rlm-recursive-orchestrator` agent for depth management when needed

## Integration

This command integrates all Phase 1-3 RLM components:
- `confidence_scorer.py` — scoring each iteration
- `quality_gate.py` — monotonic improvement enforcement
- `convergence.py` — 5-algorithm convergence detection
- `instinct_scorer.py` — weight adjustment from learned patterns
- `embedding_corpus.py` — reference comparison
- `prompt_evolution.py` — active prompt selection per layer
- `tier2_live_eval.py` — evaluation framework
- `rlm_classifier.py` — budget circuit breaker
