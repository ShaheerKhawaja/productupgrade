# Calibration Set Format

Calibration sets are used by the `rubric-evolver` agent to evaluate rubric quality via OPRO (Optimization by PROmpting).

## Structure

Place calibration samples in `.productionos/calibration/{rubric-name}/`:

```
.productionos/calibration/code-review/
  sample-01.json
  sample-02.json
  sample-03.json    # Minimum 3 samples required
```

## Sample Format

```json
{
  "input": "Review the authentication middleware refactor",
  "output": "Found 3 issues: missing CSRF token validation, session timeout not configurable, password comparison uses == instead of constant-time compare",
  "ground_truth_score": 8.5,
  "label": "good",
  "rationale": "Caught critical security issues with specific file:line citations. Missed one minor formatting issue."
}
```

## Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `input` | string | Yes | What was evaluated (task description) |
| `output` | string | Yes | The actual output that was produced |
| `ground_truth_score` | number | Yes | Human-rated quality, 1-10 |
| `label` | string | Yes | Categorical: "excellent" / "good" / "acceptable" / "poor" / "fail" |
| `rationale` | string | No | Why this score was assigned (for debugging) |

## Creating Calibration Samples

1. Run the agent you want to calibrate on a real task
2. Rate the output yourself (1-10)
3. Save as a calibration sample
4. Repeat for at least 3 diverse tasks (mix of good and bad outputs)

## Label Guide

| Score | Label | Description |
|-------|-------|-------------|
| 9-10 | excellent | Production-ready, catches everything, no false positives |
| 7-8 | good | Catches most issues, minor misses, few false positives |
| 5-6 | acceptable | Catches obvious issues, misses nuance |
| 3-4 | poor | Misses critical issues or has many false positives |
| 1-2 | fail | Wrong analysis, dangerous advice, or completely off-topic |
