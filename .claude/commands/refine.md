---
name: refine
description: "Review and refine flagged RLM outputs — reads pending signals, dispatches L17 SelfRefine (generate critique, refine, converge), updates signals with human verdicts"
arguments:
  - name: mode
    description: "Mode: interactive (default, asks for input) | auto (auto-approve PASS, auto-refine FLAG) | review-only (just show signals, no refinement)"
    required: false
    default: "interactive"
  - name: max_signals
    description: "Maximum number of pending signals to process (default: 10)"
    required: false
    default: "10"
---

# /refine -- RLM SelfRefine Pipeline

## Step 0: Preamble
Before executing, run the shared ProductionOS preamble (`templates/PREAMBLE.md`).

You are the RLM Refine orchestrator. You process pending signals from the RLM classifier, showing the user flagged outputs and applying L17 SelfRefine to improve them.

## Input
- Mode: $ARGUMENTS.mode (default: interactive)
- Max signals: $ARGUMENTS.max_signals (default: 10)

## Step 1: Load Pending Signals

Read pending signals from `~/.productionos/rlm/pending/`:

```bash
python3 -c "
import json, os
from pathlib import Path
pending_dir = Path(os.path.expanduser('~/.productionos/rlm/pending'))
if not pending_dir.exists():
    print(json.dumps({'signals': [], 'count': 0}))
else:
    signals = []
    for f in sorted(pending_dir.glob('*.json')):
        try:
            data = json.loads(f.read_text())
            if not data.get('reviewed', False):
                data['_path'] = str(f)
                signals.append(data)
        except: pass
    print(json.dumps({'signals': signals, 'count': len(signals)}, indent=2, default=str))
"
```

If no unreviewed signals exist, report: "No pending signals to review. All outputs have been reviewed." and exit.

## Step 2: Display Signal Summary

For each pending signal, display:

```
SIGNAL {id} [{verdict}] — Tool: {tool_name} — Score: {score:.2f}
  Agent: {agent_id or "session"}
  Time: {formatted_timestamp}
  Dimensions:
    - {dimension_name}: {score} — {reason}
    - ...
```

Group signals by verdict: show BLOCKs first (highest priority), then FLAGs.

## Step 3: Process Each Signal

### For BLOCK signals:

BLOCKed outputs indicate serious quality issues. In interactive mode:

1. Display the full signal details including all dimension scores
2. Ask the user: "This output was BLOCKED. Options: [A]ccept anyway, [R]eject, [S]kip"
3. Based on response:
   - **Accept**: Mark as `reviewed: true, human_verdict: "accept"`, log to metrics
   - **Reject**: Mark as `reviewed: true, human_verdict: "reject"`, log to metrics
   - **Skip**: Leave unreviewed for next session

In auto mode: Skip BLOCKs (they require human judgment).

### For FLAG signals:

FLAGged outputs may benefit from refinement. Apply L17 SelfRefine:

#### Phase 1: Generate Critique

Analyze the flagged output's dimension scores and generate a structured critique:

```
CRITIQUE of Signal {id}:
  Correctness: {score}/10 — {weakness description}
  Completeness: {score}/10 — {weakness description}
  Clarity: {score}/10 — {weakness description}
  Actionability: {score}/10 — {weakness description}
  Conciseness: {score}/10 — {weakness description}

  MUST identify at least 1 weakness per dimension.
  Map each RLM dimension to critique dimensions:
    - length_ratio → Conciseness
    - structural → Completeness
    - pattern_scan → Correctness
    - readability → Clarity
    - keyword_density → Actionability
```

#### Phase 2: Refine Using Critique

For each weakness identified in Phase 1:
- Propose a specific improvement
- Every change MUST trace to a specific critique point
- **Regression guard**: no dimension may drop by more than 1 point from its current score

The refinement produces an "improvement plan" — what should change if the original output were regenerated.

#### Phase 3: Convergence Check

Run the monotonic quality gate:

```bash
python3 -c "
import sys
sys.path.insert(0, os.path.expanduser('~/.claude/skills/rlm/scripts'))
from quality_gate import QualityGate
gate = QualityGate(max_iterations=3)
# Record iteration scores...
decision = gate.check()
print(json.dumps(decision.to_dict(), indent=2))
"
```

Convergence rules:
- If avg improvement across dimensions < 0.5: **STOP** (diminishing returns)
- If any dimension dropped by > 1 point: **STOP** (regression)
- Maximum 3 SelfRefine passes per signal
- If cosine similarity between consecutive refinements > 0.95: **STOP** (converged)

After convergence, mark the signal:
```json
{
  "reviewed": true,
  "human_verdict": "refined",
  "refinement_iterations": N,
  "convergence_reason": "converged|max_iter|regression|diminishing_returns",
  "improvement_plan": "..."
}
```

## Step 4: Update Pending Signals

For each processed signal, update its JSON file:

```bash
python3 -c "
import json
from pathlib import Path
signal_path = Path('{signal_path}')
signal = json.loads(signal_path.read_text())
signal['reviewed'] = True
signal['human_verdict'] = '{verdict}'
signal['refinement_notes'] = '{notes}'
signal_path.write_text(json.dumps(signal, indent=2, default=str))
"
```

## Step 5: Log Refinement Results to Metrics

Append refinement events to the metrics file:

```bash
python3 -c "
import json, time, os
from pathlib import Path
metrics_dir = Path(os.path.expanduser('~/.productionos/rlm/metrics'))
metrics_dir.mkdir(parents=True, exist_ok=True)
event = {
    'event': 'refinement',
    'timestamp': time.time(),
    'signal_id': '{signal_id}',
    'original_verdict': '{original_verdict}',
    'human_verdict': '{human_verdict}',
    'refinement_iterations': {iterations},
    'convergence_reason': '{reason}',
}
with open(str(metrics_dir / 'refinements.jsonl'), 'a') as f:
    f.write(json.dumps(event, default=str) + '\n')
"
```

## Step 6: Summary Report

After processing all signals, display:

```
RLM REFINE SUMMARY
---
Total signals processed: N
  BLOCKs: X (Y accepted, Z rejected)
  FLAGs: A (B refined, C skipped)

Refinement stats:
  Average iterations: N.N
  Converged: X
  Max iterations hit: Y
  Regressions caught: Z

Remaining unreviewed: M signals
```

## Mode Behaviors

### Interactive (default)
- Shows each signal and asks for user input
- BLOCKs: asks Accept/Reject/Skip
- FLAGs: shows critique, asks to proceed with refinement
- Reports results after each signal

### Auto
- Skips BLOCKs (requires human judgment)
- Auto-applies SelfRefine to all FLAGs
- Uses quality gate to determine when to stop
- Reports aggregate results at the end

### Review-Only
- Shows all pending signals with their scores
- Does NOT process or modify any signals
- Useful for getting an overview before deciding what to do

## Integration with Instinct Scorer

Before scoring, load instinct-adjusted weights:

```bash
python3 -c "
import sys, os
sys.path.insert(0, os.path.expanduser('~/.claude/skills/rlm/scripts'))
from instinct_scorer import compute_adjusted_weights
profile = compute_adjusted_weights()
print(json.dumps(profile.to_dict(), indent=2))
"
```

Use the adjusted weights when re-scoring refined outputs to ensure instinct-based calibration is applied.

## Guardrails

1. **Never auto-accept BLOCKs** — they always need human review
2. **Max 3 SelfRefine iterations** per signal — prevent runaway refinement
3. **Regression guard** — if any dimension drops > 1 point, stop immediately
4. **Convergence detection** — stop when similarity > 0.95 (no meaningful change)
5. **Metrics logging** — every refinement action is logged for learning
6. **Non-destructive** — original signals are updated in-place, never deleted
