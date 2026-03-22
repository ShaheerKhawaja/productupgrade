# Convergence Log -- {{PROJECT_NAME}}

## Configuration
- Target grade: {{TARGET_GRADE}}/10
- Convergence threshold (epsilon): {{EPSILON}}
- Max iterations: {{MAX_ITERATIONS}}
- Max pivots: {{MAX_PIVOTS}}
- EMA span: {{EMA_SPAN}}
- Mode: {{production-upgrade|omni-plan|omni-plan-nth|auto-swarm}}
- Algorithm reference: `algorithms/convergence-detection.md`

## Progression

| Iter | Grade | Delta | EMA_v | Momentum | Regime | Focus Dims | Fixes | Verdict |
|------|-------|-------|-------|----------|--------|------------|-------|---------|
| 0 (baseline) | /10 | -- | -- | -- | -- | All 10 | -- | START |
| 1 | /10 | | | | | | | |
| 2 | /10 | | | | | | | |
| 3 | /10 | | | | | | | |

## Per-Dimension History

| Dimension | I0 | I1 | I2 | I3 | I4 | I5 | I6 | I7 | Trend | Velocity | Status |
|-----------|-----|-----|-----|-----|-----|-----|-----|-----|-------|----------|--------|
| Code Quality | | | | | | | | | | | |
| Security | | | | | | | | | | | |
| Performance | | | | | | | | | | | |
| UX/UI | | | | | | | | | | | |
| Test Coverage | | | | | | | | | | | |
| Accessibility | | | | | | | | | | | |
| Documentation | | | | | | | | | | | |
| Error Handling | | | | | | | | | | | |
| Observability | | | | | | | | | | | |
| Deploy Safety | | | | | | | | | | | |

## EMA Velocity Tracker

| Iter | Raw_v | EMA_v | EMA_a | Sigma | Momentum | Band_Lo | Band_Hi | TTT |
|------|-------|-------|-------|-------|----------|---------|---------|-----|
| 1 | | | | | | | | |
| 2 | | | | | | | | |
| 3 | | | | | | | | |

## Convergence Analysis

### Trajectory
- Start: {{BASELINE}}/10 -> Current: {{CURRENT}}/10 (+{{DELTA}} over {{N}} iterations)
- Mean velocity: {{MEAN_V}}/iteration
- EMA velocity: {{EMA_V}}/iteration
- Predicted ceiling: iteration {{N+X}} at ~{{CEILING}}/10

### Algorithm Results
| Algorithm | Signal | Value | Threshold | Triggered |
|-----------|--------|-------|-----------|-----------|
| Score-based | delta | | < 0.1 x2 | |
| Semantic | local_sim | | > 0.92 | |
| Diminishing | DR_ratio | | < 0.15 | |
| Oscillation | osc_score | | > 0.60 | |
| Plateau | stall_count | | >= 2 | |
| EMA Velocity | momentum | | in [-0.5, 0.5] | |

### Detected Patterns
- **Regime:** {{CONTRACTIVE|OSCILLATORY|EXPLORATORY|INDETERMINATE}}
- **Diminishing returns:** {{None|Mild|Moderate|Severe}} (DR ratio: {{RATIO}})
- **Oscillation:** {{None|Detected}} (score: {{SCORE}})
- **Coupled dimensions:** {{None|list}}

### Pivot History
| Pivot # | Iteration | Severity | Strategy | Result |
|---------|-----------|----------|----------|--------|

### Prediction
| Iteration | Predicted Grade | Predicted Velocity | Confidence |
|-----------|----------------|--------------------|------------|

## Final Verdict
- Status: {{SUCCESS|CONVERGED|MAX_REACHED|DEGRADED|PIVOT}}
- Iterations completed: {{N}}
- Total fixes applied: {{N}}
- Total agents used: {{N}}
- Total pivots: {{N}}/{{MAX_PIVOTS}}
- Total tokens consumed: {{N}}
- Final grade: {{GRADE}}/10
- Ceiling prediction: {{CEILING}}/10
