# Convergence Detection Algorithms for Recursive LLM Agent Systems

**Version:** 1.0
**Date:** 2026-03-18
**Author:** ProductionOS Contributors
**Research Foundation:** Self-Refine (Madaan et al. 2023), Reflexion (Shinn et al. 2023), Geometric Dynamics of Agentic Loops (arxiv 2512.10350), CUSUM (Page 1954), EMA Optimization (FAME 2024), LLM-as-Judge Calibration (Zheng et al. 2023)

---

## Table of Contents

1. [Core Data Model](#1-core-data-model)
2. [Algorithm 1: Score-Based Convergence](#2-algorithm-1-score-based-convergence)
3. [Algorithm 2: Semantic Convergence](#3-algorithm-2-semantic-convergence)
4. [Algorithm 3: Diminishing Returns Detection](#4-algorithm-3-diminishing-returns-detection)
5. [Algorithm 4: Oscillation Detection](#5-algorithm-4-oscillation-detection)
6. [Algorithm 5: Plateau Detection with Strategy Pivot](#6-algorithm-5-plateau-detection-with-strategy-pivot)
7. [Algorithm 6: EMA Improvement Velocity Model](#7-algorithm-6-ema-improvement-velocity-model)
8. [Unified Convergence Engine](#8-unified-convergence-engine)
9. [Integration with CONVERGENCE-LOG.md](#9-integration-with-convergence-logmd)
10. [Calibration and Tuning Guide](#10-calibration-and-tuning-guide)

---

## 1. Core Data Model

Every convergence algorithm operates on a shared data structure tracking iteration history.

### 1.1 Iteration Record

```
IterationRecord {
    iteration:       int                    # 0 = baseline, 1..N = iterations
    timestamp:       ISO-8601
    overall_grade:   float [1.0, 10.0]      # weighted average of dimensions
    dimensions: {
        code_quality:       float [1.0, 10.0]
        security:           float [1.0, 10.0]
        performance:        float [1.0, 10.0]
        ux_ui:              float [1.0, 10.0]
        test_coverage:      float [1.0, 10.0]
        accessibility:      float [1.0, 10.0]
        documentation:      float [1.0, 10.0]
        error_handling:     float [1.0, 10.0]
        observability:      float [1.0, 10.0]
        deployment_safety:  float [1.0, 10.0]
    }
    output_hash:     string                 # SHA-256 of key output artifacts
    output_embedding: float[768]            # semantic embedding of output summary
    fixes_applied:   int
    agents_used:     string[]
    strategy:        string                 # description of approach used
    cost_tokens:     int
}
```

### 1.2 Convergence State

```
ConvergenceState {
    history:             IterationRecord[]   # all iterations so far
    target_grade:        float               # exit condition (default: 10.0)
    max_iterations:      int                 # hard cap (default: 20)
    current_verdict:     Verdict             # latest decision
    pivot_count:         int                 # strategy pivots executed
    max_pivots:          int                 # pivot budget
    ema_velocity:        float               # current EMA of improvement velocity
    regime:              DynamicalRegime      # CONTRACTIVE | OSCILLATORY | EXPLORATORY
}

Verdict = SUCCESS | CONTINUE | CONVERGED | DEGRADED | MAX_REACHED | PIVOT
DynamicalRegime = CONTRACTIVE | OSCILLATORY | EXPLORATORY | INDETERMINATE
```

### 1.3 Dimension Constants

```
D = 10                              # number of scoring dimensions
DIMENSION_NAMES = [
    "code_quality", "security", "performance", "ux_ui", "test_coverage",
    "accessibility", "documentation", "error_handling", "observability",
    "deployment_safety"
]
```

---

## 2. Algorithm 1: Score-Based Convergence

**Purpose:** Detect when the overall grade stops improving by tracking the delta between consecutive iterations against a threshold.

### 2.1 Mathematical Definition

```
delta(i) = grade(i) - grade(i-1)       for i >= 1

CONVERGED when:
    delta(i) < EPSILON  AND  delta(i-1) < EPSILON
    for PATIENCE consecutive iterations

SUCCESS when:
    grade(i) >= TARGET_GRADE

DEGRADED when:
    delta(i) < -REGRESSION_THRESHOLD
    OR any dimension(i) < dimension(i-1) - DIMENSION_REGRESSION_THRESHOLD
```

### 2.2 Thresholds

```
EPSILON                         = 0.1    # minimum meaningful improvement
PATIENCE                        = 2      # consecutive stall iterations before CONVERGED
TARGET_GRADE                    = 10.0   # perfection target
REGRESSION_THRESHOLD            = 0.3    # overall grade regression trigger
DIMENSION_REGRESSION_THRESHOLD  = 0.5    # per-dimension regression trigger
```

### 2.3 Pseudocode

```python
def score_convergence(state: ConvergenceState) -> Verdict:
    history = state.history
    i = len(history) - 1  # current iteration index

    if i < 1:
        return CONTINUE  # need at least 2 data points

    current = history[i]
    previous = history[i - 1]

    # --- SUCCESS CHECK ---
    if current.overall_grade >= state.target_grade:
        return SUCCESS

    # --- DEGRADATION CHECK (per-dimension) ---
    for dim in DIMENSION_NAMES:
        dim_current = current.dimensions[dim]
        dim_previous = previous.dimensions[dim]
        if dim_current < dim_previous - DIMENSION_REGRESSION_THRESHOLD:
            return DEGRADED  # triggers rollback + investigation

    # --- OVERALL REGRESSION CHECK ---
    delta = current.overall_grade - previous.overall_grade
    if delta < -REGRESSION_THRESHOLD:
        return DEGRADED

    # --- MAX ITERATION CHECK ---
    if i >= state.max_iterations:
        return MAX_REACHED

    # --- STALL / CONVERGENCE CHECK ---
    if i >= 2:
        delta_prev = previous.overall_grade - history[i - 2].overall_grade
        stall_count = 0
        for j in range(i, max(0, i - PATIENCE), -1):
            d = history[j].overall_grade - history[j - 1].overall_grade
            if abs(d) < EPSILON:
                stall_count += 1
            else:
                break
        if stall_count >= PATIENCE:
            return CONVERGED

    return CONTINUE
```

### 2.4 Properties

- **Time complexity:** O(PATIENCE) per check -- effectively O(1)
- **False positive risk:** Low with PATIENCE=2. Can miss slow-but-real improvement.
- **Tuning:** Lower EPSILON (e.g., 0.05) for longer pipelines with cheap iterations. Raise PATIENCE to 3 for noisy judges.

---

## 3. Algorithm 2: Semantic Convergence

**Purpose:** Detect when the *content* of outputs stabilizes, independent of scores. Prevents the case where scores stay flat but the agent is producing genuinely different (potentially better) outputs.

**Research basis:** Geometric Dynamics of Agentic Loops (arxiv 2512.10350) -- calibrated similarity functions, attractor detection in semantic space.

### 3.1 Mathematical Definition

Given output embeddings `e_0, e_1, ..., e_N` (768-dimensional vectors from an embedding model):

```
# Local similarity: how much did output change between consecutive iterations
local_sim(i) = cosine_similarity(e_i, e_{i-1})

# Global drift: how far has output moved from initial state
global_drift(i) = 1 - cosine_similarity(e_i, e_0)

# Dispersion: maximum deviation from centroid within a window
centroid(W) = normalize(mean(e_{i-W+1}, ..., e_i))
dispersion(i, W) = max_{j in [i-W+1, i]}(1 - cosine_similarity(e_j, centroid(W)))

# Calibrated similarity (optional, requires calibration data)
calibrated_sim(e_a, e_b) = f_isotonic(dot(e_a, e_b))
```

### 3.2 Convergence Criteria

```
SEMANTIC_CONVERGED when:
    local_sim(i) > LAMBDA            for PATIENCE consecutive iterations
    AND dispersion(i, W) < RHO

    where:
        LAMBDA = 0.92    # high similarity = outputs barely changing
        RHO    = 0.08    # tight dispersion = stable attractor
        W      = 3       # window size for dispersion
```

### 3.3 Attractor Detection (from arxiv 2512.10350)

```
# A cluster is a maximal contiguous window where embeddings
# maintain semantic coherence

Cluster C = {e_t | t in [t_a, t_b]}

Validity constraints:
    1. Similarity:  cosine_sim(e_{t-1}, e_t) >= LAMBDA  for all t in C
    2. Dispersion:  dispersion(C) < RHO
    3. Patience:    max consecutive violations <= KAPPA (noise tolerance)

Attractor = centroid(C)

Thresholds:
    LAMBDA = 0.80    # local coherence (relaxed for score-based systems)
    RHO    = 0.20    # global coherence
    KAPPA  = 2       # violation patience
```

### 3.4 Pseudocode

```python
def semantic_convergence(state: ConvergenceState) -> tuple[bool, DynamicalRegime]:
    """
    Returns (is_converged, detected_regime).
    Requires output_embedding on each IterationRecord.
    """
    history = state.history
    N = len(history)

    if N < 3:
        return (False, INDETERMINATE)

    # --- Compute local similarities ---
    local_sims = []
    for i in range(1, N):
        sim = cosine_similarity(history[i].output_embedding,
                                history[i-1].output_embedding)
        local_sims.append(sim)

    # --- Check semantic convergence ---
    LAMBDA = 0.92
    RHO = 0.08
    W = min(3, N - 1)
    PATIENCE = 2

    # Are recent outputs highly similar?
    recent_sims = local_sims[-(PATIENCE):]
    all_above_lambda = all(s > LAMBDA for s in recent_sims)

    # Is the window tightly clustered?
    recent_embeddings = [h.output_embedding for h in history[-W:]]
    cent = normalize(mean(recent_embeddings))
    disp = max(1 - cosine_similarity(e, cent) for e in recent_embeddings)

    is_converged = all_above_lambda and disp < RHO

    # --- Regime classification ---
    regime = classify_regime(local_sims, history)

    return (is_converged, regime)


def classify_regime(local_sims: list[float],
                    history: list[IterationRecord]) -> DynamicalRegime:
    """
    Classify trajectory dynamics following arxiv 2512.10350.

    CONTRACTIVE:  settling into single attractor
    OSCILLATORY:  cycling between distinct states
    EXPLORATORY:  unbounded drift, no stability
    """
    N = len(local_sims)
    if N < 3:
        return INDETERMINATE

    mean_local = mean(local_sims)
    recent_local = mean(local_sims[-3:])

    # Detect clusters using incremental algorithm
    clusters = detect_clusters(history, lambda_=0.80, rho=0.20, kappa=2)

    if len(clusters) == 0:
        return EXPLORATORY

    last_cluster = clusters[-1]

    if len(clusters) == 1 and last_cluster.size >= 3:
        # Single cluster, trajectory settling
        return CONTRACTIVE

    if len(clusters) >= 2:
        # Check for re-visitation (oscillation)
        centroids = [c.centroid for c in clusters]
        revisits = 0
        for i in range(len(centroids)):
            for j in range(i + 2, len(centroids)):
                if cosine_similarity(centroids[i], centroids[j]) > 0.85:
                    revisits += 1
        if revisits > 0:
            return OSCILLATORY

    # Fallback: high local similarity = contractive
    if mean_local > 0.75:
        return CONTRACTIVE

    return EXPLORATORY
```

### 3.5 Embedding Generation

For ProductionOS, generate embeddings from the iteration's key output:

```python
def generate_iteration_embedding(iteration: IterationRecord) -> float[768]:
    """
    Create a semantic fingerprint of what this iteration produced.
    Concatenate key signals and embed.
    """
    summary = f"""
    Iteration {iteration.iteration}
    Grade: {iteration.overall_grade}/10
    Dimensions: {iteration.dimensions}
    Fixes: {iteration.fixes_applied}
    Strategy: {iteration.strategy}
    Agents: {', '.join(iteration.agents_used)}
    """
    # Use any sentence-transformer model (e.g., all-MiniLM-L6-v2)
    return embedding_model.encode(summary)
```

---

## 4. Algorithm 3: Diminishing Returns Detection

**Purpose:** Detect when the *rate* of improvement is declining, predicting that future iterations will yield marginal gains relative to cost. This triggers early exit or strategy pivot before reaching full plateau.

### 4.1 Mathematical Definition

```
# Improvement deltas
delta(i) = grade(i) - grade(i-1)

# Improvement rate (first derivative of grade trajectory)
rate(i) = delta(i) / 1   # per iteration

# Acceleration (second derivative -- is the rate itself declining?)
accel(i) = rate(i) - rate(i-1) = delta(i) - delta(i-1)

# Moving average of acceleration over window W
avg_accel(i, W) = (1/W) * sum(accel(j) for j in range(i-W+1, i+1))

# Diminishing returns ratio: current delta vs best delta
DR_ratio(i) = delta(i) / max(delta(1), ..., delta(i))

# Efficiency: improvement per token spent
efficiency(i) = delta(i) / cost_tokens(i)
```

### 4.2 Detection Criteria

```
DIMINISHING_RETURNS when ANY of:
    1. avg_accel(i, W=3) < -DECEL_THRESHOLD    (acceleration is negative)
    2. DR_ratio(i) < DR_FLOOR                   (current gain < X% of best gain)
    3. efficiency(i) < MIN_EFFICIENCY            (too expensive per point gained)

Thresholds:
    DECEL_THRESHOLD = 0.05    # negative acceleration magnitude
    DR_FLOOR        = 0.15    # current delta < 15% of peak delta
    MIN_EFFICIENCY  = 0.0001  # points per token (adjustable)
    WINDOW          = 3       # smoothing window
```

### 4.3 Pseudocode

```python
def diminishing_returns(state: ConvergenceState) -> tuple[bool, dict]:
    """
    Returns (is_diminishing, metrics).
    """
    history = state.history
    N = len(history)

    if N < 4:
        return (False, {})

    # --- Compute deltas ---
    deltas = [history[i].overall_grade - history[i-1].overall_grade
              for i in range(1, N)]

    # --- Compute accelerations ---
    accels = [deltas[i] - deltas[i-1] for i in range(1, len(deltas))]

    # --- Test 1: Average acceleration ---
    W = min(3, len(accels))
    avg_accel = mean(accels[-W:])
    test_accel = avg_accel < -DECEL_THRESHOLD

    # --- Test 2: Diminishing returns ratio ---
    peak_delta = max(d for d in deltas if d > 0) if any(d > 0 for d in deltas) else 1.0
    current_delta = deltas[-1]
    dr_ratio = current_delta / peak_delta if peak_delta > 0 else 0
    test_dr = dr_ratio < DR_FLOOR and current_delta > 0  # only if still improving

    # --- Test 3: Cost efficiency ---
    current_efficiency = current_delta / max(history[-1].cost_tokens, 1)
    test_efficiency = current_efficiency < MIN_EFFICIENCY and current_delta > 0

    # --- Prediction: Extrapolate when grade will plateau ---
    # Fit exponential decay: delta(i) ~ A * exp(-k * i)
    # If we have enough data, predict future trajectory
    predicted_ceiling = None
    if len(deltas) >= 3 and all(d > 0 for d in deltas[-3:]):
        # Simple exponential extrapolation
        k = -log(deltas[-1] / deltas[-2]) if deltas[-2] > 0 else 0
        if k > 0:
            remaining_improvement = deltas[-1] / (1 - exp(-k))
            predicted_ceiling = history[-1].overall_grade + remaining_improvement

    is_diminishing = test_accel or test_dr or test_efficiency

    metrics = {
        "avg_acceleration": avg_accel,
        "dr_ratio": dr_ratio,
        "current_delta": current_delta,
        "peak_delta": peak_delta,
        "efficiency": current_efficiency,
        "predicted_ceiling": predicted_ceiling,
        "tests_triggered": {
            "deceleration": test_accel,
            "diminishing_ratio": test_dr,
            "cost_inefficiency": test_efficiency,
        }
    }

    return (is_diminishing, metrics)
```

### 4.4 Ceiling Prediction Formula

```
# Exponential decay model for improvement trajectory:
#   delta(i) = A * exp(-k * i) + C
#
# where:
#   A = initial improvement amplitude
#   k = decay constant (higher = faster diminishing)
#   C = asymptotic improvement rate (usually ~0)
#
# Estimated ceiling:
#   ceiling = current_grade + integral(A * exp(-k * t) dt, t=i..infinity)
#           = current_grade + A * exp(-k * i) / k
#
# Simplified (from last two deltas):
#   k_hat = -ln(delta(i) / delta(i-1))
#   ceiling_hat = grade(i) + delta(i) / (1 - exp(-k_hat))
```

---

## 5. Algorithm 4: Oscillation Detection

**Purpose:** Detect when scores alternate up and down, indicating that fixes in one dimension cause regressions in another. This is a sign of systemic coupling that requires architectural intervention, not incremental fixes.

### 5.1 Mathematical Definition

```
# Sign sequence of deltas
sign_seq(i) = sign(delta(i))    where sign(x) = +1 if x > 0, -1 if x < 0, 0 if |x| < EPSILON

# Run length: consecutive same-sign deltas
# Oscillation = short runs (alternating signs)

# Overall oscillation (grade-level)
oscillation_score = count_sign_changes(sign_seq) / (N - 2)
    where N = number of iterations

# Per-dimension oscillation
dim_oscillation(d) = count_sign_changes(sign_seq_d) / (N - 2)
    where sign_seq_d uses dimension d's deltas

# CUSUM-based oscillation detection
# Detect if the grade trajectory has zero-crossing changepoints
S_plus(i) = max(0, S_plus(i-1) + delta(i) - K)
S_minus(i) = max(0, S_minus(i-1) - delta(i) - K)

    where K = EPSILON / 2    (reference value, half the threshold)

# Oscillation detected when both S_plus and S_minus exceed H
# within a window of W iterations
```

### 5.2 Detection Criteria

```
OSCILLATING when ANY of:
    1. oscillation_score > OSC_THRESHOLD         (overall grade oscillates)
    2. any dim_oscillation(d) > DIM_OSC_THRESHOLD (dimension oscillates)
    3. sign_changes >= 3 in last 5 iterations     (recent oscillation)
    4. CUSUM: S_plus > H AND S_minus > H within W (detected via CUSUM)

Thresholds:
    OSC_THRESHOLD     = 0.60    # 60%+ of transitions are sign changes
    DIM_OSC_THRESHOLD = 0.75    # dimension is flip-flopping
    H                 = 0.5     # CUSUM alarm threshold
    K                 = 0.05    # CUSUM reference value
    W                 = 5       # observation window
```

### 5.3 Pseudocode

```python
def oscillation_detection(state: ConvergenceState) -> tuple[bool, dict]:
    """
    Returns (is_oscillating, details).
    """
    history = state.history
    N = len(history)

    if N < 4:
        return (False, {})

    # --- Overall grade oscillation ---
    deltas = [history[i].overall_grade - history[i-1].overall_grade
              for i in range(1, N)]
    signs = [sign(d, EPSILON) for d in deltas]
    sign_changes = sum(1 for i in range(1, len(signs))
                       if signs[i] != signs[i-1] and signs[i] != 0 and signs[i-1] != 0)
    osc_score = sign_changes / max(len(signs) - 1, 1)

    # --- Per-dimension oscillation ---
    dim_oscillations = {}
    oscillating_dims = []
    for dim in DIMENSION_NAMES:
        dim_deltas = [history[i].dimensions[dim] - history[i-1].dimensions[dim]
                      for i in range(1, N)]
        dim_signs = [sign(d, EPSILON) for d in dim_deltas]
        dim_changes = sum(1 for i in range(1, len(dim_signs))
                         if dim_signs[i] != dim_signs[i-1]
                         and dim_signs[i] != 0 and dim_signs[i-1] != 0)
        dim_osc = dim_changes / max(len(dim_signs) - 1, 1)
        dim_oscillations[dim] = dim_osc
        if dim_osc > DIM_OSC_THRESHOLD:
            oscillating_dims.append(dim)

    # --- CUSUM-based detection ---
    S_plus = 0
    S_minus = 0
    cusum_alarm = False
    for delta in deltas[-W:]:
        S_plus = max(0, S_plus + delta - K)
        S_minus = max(0, S_minus - delta - K)
        if S_plus > H and S_minus > H:
            cusum_alarm = True
            break

    # --- Recent oscillation (last 5 iterations) ---
    recent_signs = signs[-min(5, len(signs)):]
    recent_changes = sum(1 for i in range(1, len(recent_signs))
                        if recent_signs[i] != recent_signs[i-1]
                        and recent_signs[i] != 0 and recent_signs[i-1] != 0)

    is_oscillating = (
        osc_score > OSC_THRESHOLD or
        len(oscillating_dims) > 0 or
        recent_changes >= 3 or
        cusum_alarm
    )

    details = {
        "overall_oscillation_score": osc_score,
        "dimension_oscillations": dim_oscillations,
        "oscillating_dimensions": oscillating_dims,
        "recent_sign_changes": recent_changes,
        "cusum_alarm": cusum_alarm,
        "cusum_s_plus": S_plus,
        "cusum_s_minus": S_minus,
        "recommendation": _oscillation_recommendation(oscillating_dims, osc_score)
    }

    return (is_oscillating, details)


def _oscillation_recommendation(oscillating_dims: list, osc_score: float) -> str:
    if len(oscillating_dims) >= 2:
        return (f"ARCHITECTURAL: dimensions {oscillating_dims} are coupled. "
                f"Fixes to one regress the other. Decouple before continuing.")
    elif len(oscillating_dims) == 1:
        return (f"ISOLATION: {oscillating_dims[0]} is oscillating. "
                f"Add regression tests for this dimension before next fix batch.")
    elif osc_score > OSC_THRESHOLD:
        return ("BATCH SIZE: overall oscillation suggests fix batches are too large. "
                "Reduce to 3-5 fixes per batch and validate between batches.")
    return "No oscillation detected."


def sign(x: float, epsilon: float = 0.1) -> int:
    if x > epsilon:
        return 1
    elif x < -epsilon:
        return -1
    return 0
```

### 5.4 Coupled Dimension Detection

```python
def detect_coupled_dimensions(history: list[IterationRecord]) -> list[tuple]:
    """
    Find pairs of dimensions where improving one reliably degrades the other.
    Uses correlation of deltas.
    """
    N = len(history)
    if N < 5:
        return []

    coupled = []
    for dim_a in DIMENSION_NAMES:
        for dim_b in DIMENSION_NAMES:
            if dim_a >= dim_b:
                continue
            deltas_a = [history[i].dimensions[dim_a] - history[i-1].dimensions[dim_a]
                        for i in range(1, N)]
            deltas_b = [history[i].dimensions[dim_b] - history[i-1].dimensions[dim_b]
                        for i in range(1, N)]
            corr = pearson_correlation(deltas_a, deltas_b)
            if corr < -0.6:  # strong negative correlation
                coupled.append((dim_a, dim_b, corr))

    return sorted(coupled, key=lambda x: x[2])
```

---

## 6. Algorithm 5: Plateau Detection with Automatic Strategy Pivot

**Purpose:** Detect when the system has reached a local optimum and automatically select a new strategy to break through the plateau. This goes beyond simple convergence detection -- it actively changes the optimization trajectory.

### 6.1 Mathematical Definition

```
# Plateau: grade improvement has stalled for PLATEAU_PATIENCE iterations
# but target has NOT been reached

plateau_detected when:
    max(delta(j) for j in [i-PLATEAU_PATIENCE+1, i]) < PLATEAU_EPSILON
    AND grade(i) < TARGET_GRADE
    AND NOT is_oscillating  # oscillation has its own handler

# Severity levels:
    MILD:     stalled 2 iterations, delta < 0.1
    MODERATE: stalled 3 iterations, delta < 0.05
    SEVERE:   stalled 4+ iterations, delta < 0.02
```

### 6.2 Strategy Pivot Selection

```
# Pivot strategies ordered by escalation:

PIVOT_STRATEGIES = [
    {
        "name": "FOCUS_NARROW",
        "description": "Concentrate 80% of agents on the 1-2 weakest dimensions",
        "trigger": "MILD plateau",
        "expected_break": "0.3-0.5 point improvement",
        "cost_multiplier": 1.0
    },
    {
        "name": "APPROACH_CHANGE",
        "description": "Switch from incremental fixes to refactoring",
        "trigger": "MODERATE plateau",
        "expected_break": "0.5-1.0 point improvement",
        "cost_multiplier": 1.5
    },
    {
        "name": "FRESH_EYES",
        "description": "Re-read the codebase from scratch, ignore prior analysis",
        "trigger": "MODERATE plateau after FOCUS_NARROW failed",
        "expected_break": "0.3-0.8 point improvement",
        "cost_multiplier": 2.0
    },
    {
        "name": "ARCHITECTURAL",
        "description": "Address structural issues blocking improvement",
        "trigger": "SEVERE plateau",
        "expected_break": "1.0-2.0 point improvement",
        "cost_multiplier": 3.0
    },
    {
        "name": "SCOPE_REDUCTION",
        "description": "Accept ceiling on hard dimensions, maximize others",
        "trigger": "SEVERE plateau after ARCHITECTURAL failed",
        "expected_break": "0.2-0.5 via reallocation",
        "cost_multiplier": 0.5
    }
]
```

### 6.3 Pseudocode

```python
def plateau_detection_and_pivot(state: ConvergenceState) -> tuple[Verdict, dict]:
    """
    Detect plateau and select appropriate pivot strategy.
    Returns (verdict, pivot_plan).
    """
    history = state.history
    N = len(history)

    if N < 3:
        return (CONTINUE, {})

    # --- Compute recent deltas ---
    deltas = [history[i].overall_grade - history[i-1].overall_grade
              for i in range(1, N)]

    # --- Plateau detection ---
    PLATEAU_PATIENCE = 2
    PLATEAU_EPSILON = 0.1
    recent_deltas = deltas[-PLATEAU_PATIENCE:]

    if not all(abs(d) < PLATEAU_EPSILON for d in recent_deltas):
        return (CONTINUE, {})

    # We have a plateau. Classify severity.
    extended_stall = 0
    for d in reversed(deltas):
        if abs(d) < PLATEAU_EPSILON:
            extended_stall += 1
        else:
            break

    if extended_stall >= 4:
        severity = "SEVERE"
    elif extended_stall >= 3:
        severity = "MODERATE"
    else:
        severity = "MILD"

    # --- Identify blocking dimensions ---
    current = history[-1]
    dimension_gaps = {}
    for dim in DIMENSION_NAMES:
        gap = state.target_grade - current.dimensions[dim]
        if gap > 0:
            dimension_gaps[dim] = gap
    blocking_dims = sorted(dimension_gaps.items(), key=lambda x: -x[1])[:3]

    # --- Select pivot strategy ---
    strategies_tried = [h.strategy for h in history]
    available_pivots = [p for p in PIVOT_STRATEGIES if p["name"] not in strategies_tried]

    if state.pivot_count >= state.max_pivots:
        # Exhausted pivot budget
        return (CONVERGED, {
            "reason": f"Plateau at {current.overall_grade}/10 after {state.pivot_count} pivots",
            "severity": severity,
            "blocking_dimensions": blocking_dims,
            "recommendation": "Accept current grade or increase pivot budget"
        })

    # Select strategy based on severity
    selected = None
    for pivot in available_pivots:
        if severity == "MILD" and pivot["name"] in ["FOCUS_NARROW"]:
            selected = pivot
            break
        elif severity == "MODERATE" and pivot["name"] in ["APPROACH_CHANGE", "FRESH_EYES"]:
            selected = pivot
            break
        elif severity == "SEVERE" and pivot["name"] in ["ARCHITECTURAL", "SCOPE_REDUCTION"]:
            selected = pivot
            break

    if selected is None:
        selected = available_pivots[0] if available_pivots else None

    if selected is None:
        return (CONVERGED, {
            "reason": "All pivot strategies exhausted",
            "final_grade": current.overall_grade
        })

    pivot_plan = {
        "strategy": selected,
        "severity": severity,
        "stall_iterations": extended_stall,
        "blocking_dimensions": blocking_dims,
        "current_grade": current.overall_grade,
        "target_grade": state.target_grade,
        "gap": state.target_grade - current.overall_grade,
        "pivots_remaining": state.max_pivots - state.pivot_count - 1,
        # Dimension-specific actions
        "focus_allocation": _compute_focus_allocation(blocking_dims, selected)
    }

    return (PIVOT, pivot_plan)


def _compute_focus_allocation(blocking_dims: list, strategy: dict) -> dict:
    """
    Compute agent allocation percentages for each dimension
    based on the pivot strategy.
    """
    allocation = {}
    total_gap = sum(gap for _, gap in blocking_dims)

    if strategy["name"] == "FOCUS_NARROW":
        # 80% on top 2, 20% distributed
        for i, (dim, gap) in enumerate(blocking_dims[:2]):
            allocation[dim] = 0.40  # 40% each for top 2
        remaining = [d for d, _ in blocking_dims[2:]]
        for dim in remaining:
            allocation[dim] = 0.20 / max(len(remaining), 1)

    elif strategy["name"] == "APPROACH_CHANGE":
        # Weight by gap size
        for dim, gap in blocking_dims:
            allocation[dim] = gap / total_gap if total_gap > 0 else 1 / len(blocking_dims)

    elif strategy["name"] == "ARCHITECTURAL":
        # All resources on the single most blocked dimension
        allocation[blocking_dims[0][0]] = 0.70
        for dim, _ in blocking_dims[1:]:
            allocation[dim] = 0.30 / max(len(blocking_dims) - 1, 1)

    else:
        # Equal distribution
        for dim, _ in blocking_dims:
            allocation[dim] = 1.0 / len(blocking_dims)

    return allocation
```

---

## 7. Algorithm 6: EMA Improvement Velocity Model

**Purpose:** Compute a smoothed, noise-resistant measure of improvement speed using an Exponential Moving Average. This is the core mathematical signal that all other algorithms can reference. The EMA naturally discounts old observations and resists noise from judge scoring variance.

### 7.1 Mathematical Definition

```
# Raw velocity (improvement per iteration)
v(i) = delta(i) = grade(i) - grade(i-1)

# EMA of velocity with smoothing factor alpha
EMA_v(0) = v(1)                                    # initialize with first delta
EMA_v(i) = alpha * v(i) + (1 - alpha) * EMA_v(i-1) # recursive update

# Alpha selection:
#   alpha = 2 / (span + 1)
#   span = number of iterations to consider "relevant"
#   Default span = 3 --> alpha = 0.5
#   Longer span = smoother signal, slower response
#   Shorter span = noisier signal, faster response

# EMA of acceleration (second derivative)
a(i) = v(i) - v(i-1)
EMA_a(i) = alpha_a * a(i) + (1 - alpha_a) * EMA_a(i-1)
    where alpha_a = 2 / (span_a + 1),  span_a = 4

# Velocity confidence band (using EMA of squared residuals)
residual(i) = v(i) - EMA_v(i)
EMA_var(i) = alpha * residual(i)^2 + (1 - alpha) * EMA_var(i-1)
sigma(i) = sqrt(EMA_var(i))

# Upper/lower bands:
EMA_upper(i) = EMA_v(i) + 2 * sigma(i)
EMA_lower(i) = EMA_v(i) - 2 * sigma(i)
```

### 7.2 Derived Signals

```
# 1. Momentum indicator
momentum(i) = EMA_v(i) / sigma(i)   # signal-to-noise ratio
    # > 2.0: strong improvement (high confidence)
    # 0.5 - 2.0: moderate improvement
    # -0.5 - 0.5: stalled (within noise)
    # < -0.5: regressing

# 2. Time-to-target estimate
if EMA_v(i) > 0:
    TTT(i) = (TARGET - grade(i)) / EMA_v(i)   # iterations remaining
else:
    TTT(i) = INFINITY

# 3. Cost-to-target estimate
if EMA_v(i) > 0:
    avg_cost = mean(cost_tokens(j) for j in recent iterations)
    CTT(i) = TTT(i) * avg_cost                # tokens remaining
else:
    CTT(i) = INFINITY

# 4. Velocity trend (is EMA itself rising or falling?)
velocity_trend(i) = EMA_v(i) - EMA_v(i-1)
    # > 0: accelerating improvement
    # < 0: decelerating (diminishing returns approaching)
    # = 0: steady state improvement
```

### 7.3 Pseudocode

```python
class EMAVelocityTracker:
    """
    Exponential Moving Average tracker for improvement velocity.
    Core mathematical signal for convergence detection.
    """

    def __init__(self, span: int = 3, accel_span: int = 4):
        self.alpha = 2.0 / (span + 1)           # velocity smoothing
        self.alpha_a = 2.0 / (accel_span + 1)   # acceleration smoothing

        self.ema_velocity = None     # smoothed velocity
        self.ema_accel = None        # smoothed acceleration
        self.ema_variance = None     # smoothed variance (for confidence bands)
        self.prev_velocity = None    # for acceleration computation

        self.history = []            # all computed values

    def update(self, grade: float, prev_grade: float, cost_tokens: int) -> dict:
        """
        Call after each iteration with the new grade.
        Returns comprehensive velocity metrics.
        """
        v = grade - prev_grade  # raw velocity

        if self.ema_velocity is None:
            # First observation: initialize
            self.ema_velocity = v
            self.ema_variance = 0.0
            self.ema_accel = 0.0
        else:
            # EMA update
            self.ema_velocity = self.alpha * v + (1 - self.alpha) * self.ema_velocity

            # Variance update (for confidence bands)
            residual = v - self.ema_velocity
            self.ema_variance = (self.alpha * residual ** 2 +
                                 (1 - self.alpha) * self.ema_variance)

            # Acceleration update
            if self.prev_velocity is not None:
                a = v - self.prev_velocity
                self.ema_accel = (self.alpha_a * a +
                                  (1 - self.alpha_a) * self.ema_accel)

        self.prev_velocity = v

        # Compute derived signals
        sigma = sqrt(max(self.ema_variance, 1e-10))
        momentum = self.ema_velocity / sigma if sigma > 1e-10 else 0

        target_gap = TARGET_GRADE - grade
        ttt = target_gap / self.ema_velocity if self.ema_velocity > 0.01 else float('inf')
        avg_cost = cost_tokens  # simplified; use running average in production
        ctt = ttt * avg_cost if ttt != float('inf') else float('inf')

        result = {
            "raw_velocity": v,
            "ema_velocity": self.ema_velocity,
            "ema_acceleration": self.ema_accel,
            "sigma": sigma,
            "momentum": momentum,
            "confidence_band": (self.ema_velocity - 2 * sigma,
                                self.ema_velocity + 2 * sigma),
            "time_to_target": ttt,
            "cost_to_target": ctt,
            "velocity_trend": "accelerating" if self.ema_accel > 0.01
                             else "decelerating" if self.ema_accel < -0.01
                             else "steady",
            "signal_strength": (
                "strong" if momentum > 2.0 else
                "moderate" if momentum > 0.5 else
                "stalled" if momentum > -0.5 else
                "regressing"
            )
        }

        self.history.append(result)
        return result

    def predict_trajectory(self, current_grade: float, horizon: int = 5) -> list:
        """
        Predict future grades assuming current EMA velocity and acceleration.

        Uses the model:
            grade(t+k) = grade(t) + sum_{j=1}^{k} (EMA_v + j * EMA_a)
            clamped to [1.0, 10.0]
        """
        predictions = []
        g = current_grade
        v = self.ema_velocity or 0
        a = self.ema_accel or 0

        for k in range(1, horizon + 1):
            v_predicted = v + k * a
            g = min(10.0, max(1.0, g + v_predicted))
            predictions.append({
                "iteration": f"+{k}",
                "predicted_grade": round(g, 2),
                "predicted_velocity": round(v_predicted, 3)
            })

        return predictions
```

### 7.4 Threshold Summary Table

```
Signal            | Value Range | Interpretation
------------------+-------------+---------------------------------------------
momentum > 2.0   | [2, inf)    | Strong improvement, high confidence continue
momentum 0.5-2.0 | [0.5, 2)    | Moderate improvement, continue
momentum -0.5-0.5| [-0.5, 0.5) | Stalled / within noise, consider pivot
momentum < -0.5  | (-inf, -0.5)| Regressing, halt and investigate
                  |             |
EMA_accel > 0.01  |             | Improvement is accelerating (rare, early iters)
EMA_accel < -0.01 |             | Improvement is decelerating (diminishing returns)
                  |             |
TTT > 10          |             | Unlikely to reach target, consider accepting
TTT 3-10          |             | Reachable with sustained effort
TTT < 3           |             | Close to target, push through
                  |             |
sigma > 0.5       |             | High scoring variance, judge may need calibration
sigma < 0.1       |             | Very stable scores, high confidence in trend
```

---

## 8. Unified Convergence Engine

**Purpose:** Combine all six algorithms into a single decision function that produces the final verdict for each iteration. The engine runs all detectors, weights their signals, and produces a single actionable decision.

### 8.1 Decision Priority (highest to lowest)

```
1. DEGRADED    — any regression > threshold          [HALT immediately]
2. SUCCESS     — all dimensions >= target             [EXIT with success]
3. MAX_REACHED — iteration count exceeded             [FORCED EXIT]
4. OSCILLATING — score thrashing detected             [PIVOT to decouple]
5. PLATEAU     — stalled with pivot available         [EXECUTE pivot]
6. CONVERGED   — stalled with no pivots remaining     [EXIT, accept grade]
7. DIMINISHING — returns declining but not zero        [WARN, continue or pivot]
8. CONTINUE    — healthy improvement                  [PROCEED to next iteration]
```

### 8.2 Unified Pseudocode

```python
class ConvergenceEngine:
    """
    Unified convergence detection engine for ProductionOS.
    Combines 6 algorithms into a single decision function.
    """

    def __init__(self, config: dict = None):
        self.config = config or DEFAULT_CONFIG
        self.ema_tracker = EMAVelocityTracker(
            span=self.config.get("ema_span", 3)
        )
        self.state = ConvergenceState(
            history=[],
            target_grade=self.config.get("target_grade", 10.0),
            max_iterations=self.config.get("max_iterations", 20),
            current_verdict=CONTINUE,
            pivot_count=0,
            max_pivots=self.config.get("max_pivots", 3),
            ema_velocity=0.0,
            regime=INDETERMINATE,
        )

    def evaluate(self, iteration: IterationRecord) -> ConvergenceDecision:
        """
        Main entry point. Call after each iteration with the new scores.
        Returns a ConvergenceDecision with verdict and supporting data.
        """
        self.state.history.append(iteration)
        N = len(self.state.history)

        # --- Run all detectors ---

        # 1. Score-based convergence
        score_verdict = score_convergence(self.state)

        # 2. Semantic convergence (if embeddings available)
        semantic_converged = False
        regime = INDETERMINATE
        if iteration.output_embedding is not None:
            semantic_converged, regime = semantic_convergence(self.state)
            self.state.regime = regime

        # 3. Diminishing returns
        is_diminishing, dr_metrics = diminishing_returns(self.state)

        # 4. Oscillation detection
        is_oscillating, osc_details = oscillation_detection(self.state)

        # 5. Plateau detection with pivot
        plateau_verdict, pivot_plan = plateau_detection_and_pivot(self.state)

        # 6. EMA velocity update
        ema_metrics = {}
        if N >= 2:
            prev = self.state.history[-2]
            ema_metrics = self.ema_tracker.update(
                iteration.overall_grade,
                prev.overall_grade,
                iteration.cost_tokens
            )
            self.state.ema_velocity = ema_metrics.get("ema_velocity", 0)

        # --- Priority-based decision ---
        # Priority 1: DEGRADED (from score-based)
        if score_verdict == DEGRADED:
            return ConvergenceDecision(
                verdict=DEGRADED,
                reason=self._identify_regression(),
                action="ROLLBACK last batch, investigate regression",
                metrics=self._compile_metrics(ema_metrics, dr_metrics, osc_details)
            )

        # Priority 2: SUCCESS
        if score_verdict == SUCCESS:
            return ConvergenceDecision(
                verdict=SUCCESS,
                reason=f"All dimensions at or above {self.state.target_grade}/10",
                action="Proceed to delivery protocol",
                metrics=self._compile_metrics(ema_metrics, dr_metrics, osc_details)
            )

        # Priority 3: MAX_REACHED
        if score_verdict == MAX_REACHED:
            return ConvergenceDecision(
                verdict=MAX_REACHED,
                reason=f"Reached {self.state.max_iterations} iterations",
                action="Force exit, document remaining gaps",
                metrics=self._compile_metrics(ema_metrics, dr_metrics, osc_details)
            )

        # Priority 4: OSCILLATING
        if is_oscillating and not score_verdict == SUCCESS:
            coupled = detect_coupled_dimensions(self.state.history)
            return ConvergenceDecision(
                verdict=PIVOT,
                reason=f"Oscillation detected: {osc_details.get('recommendation', '')}",
                action="Decouple dimensions, add regression tests, reduce batch size",
                pivot_strategy="DECOUPLE",
                oscillation_details=osc_details,
                coupled_dimensions=coupled,
                metrics=self._compile_metrics(ema_metrics, dr_metrics, osc_details)
            )

        # Priority 5: PLATEAU with pivot available
        if plateau_verdict == PIVOT:
            self.state.pivot_count += 1
            return ConvergenceDecision(
                verdict=PIVOT,
                reason=f"Plateau detected (severity: {pivot_plan.get('severity', 'unknown')})",
                action=f"Execute pivot: {pivot_plan['strategy']['name']}",
                pivot_strategy=pivot_plan["strategy"]["name"],
                pivot_plan=pivot_plan,
                metrics=self._compile_metrics(ema_metrics, dr_metrics, osc_details)
            )

        # Priority 6: CONVERGED (plateau with no pivots)
        if plateau_verdict == CONVERGED or score_verdict == CONVERGED:
            # Also check semantic convergence for confirmation
            combined_converged = (score_verdict == CONVERGED or
                                  plateau_verdict == CONVERGED or
                                  semantic_converged)
            if combined_converged:
                return ConvergenceDecision(
                    verdict=CONVERGED,
                    reason=self._convergence_reason(score_verdict, semantic_converged,
                                                    plateau_verdict),
                    action="Accept current grade, proceed to delivery",
                    final_grade=iteration.overall_grade,
                    metrics=self._compile_metrics(ema_metrics, dr_metrics, osc_details)
                )

        # Priority 7: DIMINISHING returns warning
        if is_diminishing:
            # Not a hard stop -- warn and continue, or pivot if severe
            if dr_metrics.get("dr_ratio", 1) < 0.05:
                # Extremely diminished, recommend exit
                return ConvergenceDecision(
                    verdict=CONVERGED,
                    reason=f"Severe diminishing returns (ratio: {dr_metrics['dr_ratio']:.3f})",
                    action="Near-zero improvement rate. Accept or pivot.",
                    metrics=self._compile_metrics(ema_metrics, dr_metrics, osc_details)
                )
            # else continue with warning

        # Priority 8: CONTINUE (healthy improvement)
        prediction = self.ema_tracker.predict_trajectory(
            iteration.overall_grade, horizon=5
        ) if ema_metrics else []

        return ConvergenceDecision(
            verdict=CONTINUE,
            reason=self._continue_reason(ema_metrics, is_diminishing),
            action="Proceed to next iteration",
            focus_dimensions=self._identify_focus_dims(),
            prediction=prediction,
            diminishing_warning=is_diminishing,
            metrics=self._compile_metrics(ema_metrics, dr_metrics, osc_details)
        )

    def _identify_regression(self) -> str:
        if len(self.state.history) < 2:
            return "Unknown regression"
        current = self.state.history[-1]
        previous = self.state.history[-2]
        regressions = []
        for dim in DIMENSION_NAMES:
            delta = current.dimensions[dim] - previous.dimensions[dim]
            if delta < -DIMENSION_REGRESSION_THRESHOLD:
                regressions.append(f"{dim}: {previous.dimensions[dim]} -> {current.dimensions[dim]} ({delta:+.1f})")
        return "; ".join(regressions) if regressions else "Overall grade regression"

    def _identify_focus_dims(self) -> list:
        """Return the 2-3 lowest-scoring dimensions for next iteration focus."""
        current = self.state.history[-1]
        scored = [(dim, current.dimensions[dim]) for dim in DIMENSION_NAMES]
        scored.sort(key=lambda x: x[1])
        return [dim for dim, _ in scored[:3]]

    def _convergence_reason(self, score_v, semantic_v, plateau_v) -> str:
        reasons = []
        if score_v == CONVERGED:
            reasons.append("score delta < threshold for consecutive iterations")
        if semantic_v:
            reasons.append("output embeddings stabilized (semantic convergence)")
        if plateau_v == CONVERGED:
            reasons.append("all pivot strategies exhausted")
        return " AND ".join(reasons) if reasons else "Convergence detected"

    def _continue_reason(self, ema_metrics, is_diminishing) -> str:
        if not ema_metrics:
            return "Insufficient data, continue"
        v = ema_metrics.get("ema_velocity", 0)
        strength = ema_metrics.get("signal_strength", "unknown")
        warn = " (diminishing returns warning)" if is_diminishing else ""
        return f"Improvement velocity: {v:.3f}/iter ({strength}){warn}"

    def _compile_metrics(self, ema, dr, osc) -> dict:
        return {
            "ema": ema,
            "diminishing_returns": dr,
            "oscillation": osc,
            "iteration": len(self.state.history) - 1,
            "regime": self.state.regime,
            "pivots_used": self.state.pivot_count,
            "pivots_remaining": self.state.max_pivots - self.state.pivot_count,
        }


# --- Decision output structure ---

class ConvergenceDecision:
    verdict:              Verdict
    reason:               str
    action:               str
    metrics:              dict
    focus_dimensions:     list[str]         = []
    prediction:           list[dict]        = []
    pivot_strategy:       str               = None
    pivot_plan:           dict              = None
    oscillation_details:  dict              = None
    coupled_dimensions:   list[tuple]       = None
    final_grade:          float             = None
    diminishing_warning:  bool              = False
```

### 8.3 Configuration Defaults

```python
DEFAULT_CONFIG = {
    # Score-based convergence
    "epsilon": 0.1,                        # minimum meaningful improvement
    "patience": 2,                         # stall iterations before CONVERGED
    "target_grade": 10.0,                  # perfection target
    "regression_threshold": 0.3,           # overall regression trigger
    "dimension_regression_threshold": 0.5, # per-dimension regression trigger

    # Semantic convergence
    "semantic_lambda": 0.92,               # local similarity threshold
    "semantic_rho": 0.08,                  # dispersion threshold
    "semantic_window": 3,                  # window size

    # Diminishing returns
    "decel_threshold": 0.05,               # acceleration floor
    "dr_floor": 0.15,                      # ratio floor
    "min_efficiency": 0.0001,              # points per token

    # Oscillation
    "osc_threshold": 0.60,                 # overall oscillation threshold
    "dim_osc_threshold": 0.75,             # per-dimension threshold
    "cusum_h": 0.5,                        # CUSUM alarm threshold
    "cusum_k": 0.05,                       # CUSUM reference value

    # Plateau / pivot
    "plateau_patience": 2,                 # stall window
    "plateau_epsilon": 0.1,                # minimum improvement
    "max_pivots": 3,                       # pivot budget

    # EMA
    "ema_span": 3,                         # velocity EMA span
    "ema_accel_span": 4,                   # acceleration EMA span

    # System limits
    "max_iterations": 20,                  # hard cap

    # Per-command overrides
    "command_overrides": {
        "production-upgrade": {
            "max_iterations": 7,
            "max_pivots": 1,
            "patience": 2,
        },
        "omni-plan": {
            "max_iterations": 7,
            "max_pivots": 2,
            "patience": 2,
        },
        "omni-plan-nth": {
            "max_iterations": 20,
            "max_pivots": 3,
            "patience": 2,
        },
        "auto-swarm": {
            "max_iterations": 11,
            "max_pivots": 2,
            "epsilon": 0.02,  # uses coverage delta, not grade
            "target_grade": 1.0,  # 100% coverage
        }
    }
}
```

---

## 9. Integration with CONVERGENCE-LOG.md

The convergence engine writes its output in a format compatible with the existing `templates/CONVERGENCE-LOG.md` template, extended with algorithm-specific fields.

### 9.1 Extended Log Format

```markdown
# Convergence Log -- {{PROJECT_NAME}}

## Configuration
- Target grade: {{TARGET_GRADE}}/10
- Convergence threshold (epsilon): {{EPSILON}}
- Max iterations: {{MAX_ITERATIONS}}
- Max pivots: {{MAX_PIVOTS}}
- EMA span: {{EMA_SPAN}}
- Mode: {{production-upgrade|omni-plan|omni-plan-nth}}

## Progression

| Iter | Grade | Delta | EMA_v | Momentum | Regime | Focus Dims | Fixes | Verdict |
|------|-------|-------|-------|----------|--------|------------|-------|---------|
| 0    | 4.2/10| --    | --    | --       | --     | All 10     | --    | START   |
| 1    | 5.1/10| +0.9  | 0.900 | strong   | INDET  | SEC, TEST  | 12    | CONTINUE|
| 2    | 5.8/10| +0.7  | 0.800 | strong   | CONTR  | TEST, A11Y | 8     | CONTINUE|
| 3    | 6.2/10| +0.4  | 0.600 | moderate | CONTR  | A11Y, OBS  | 6     | CONTINUE|
| 4    | 6.3/10| +0.1  | 0.350 | stalled  | CONTR  | OBS, DEP   | 4     | PLATEAU |
| 5    | 7.0/10| +0.7  | 0.525 | moderate | CONTR  | DEP, ERR   | 9     | CONTINUE|

## Per-Dimension History

| Dimension   | I0  | I1  | I2  | I3  | I4  | I5  | Trend | Velocity | Status   |
|-------------|-----|-----|-----|-----|-----|-----|-------|----------|----------|
| Code Quality| 5   | 6   | 7   | 7   | 7   | 8   | up    | +0.50    | Healthy  |
| Security    | 3   | 5   | 6   | 6   | 6   | 7   | up    | +0.67    | Healthy  |
| Performance | 5   | 5   | 6   | 7   | 7   | 7   | flat  | +0.33    | Slowing  |
| UX/UI       | 4   | 5   | 5   | 6   | 6   | 7   | up    | +0.50    | Healthy  |
| Test Cov.   | 2   | 3   | 4   | 5   | 5   | 6   | up    | +0.67    | Healthy  |
| A11y        | 3   | 3   | 4   | 5   | 5   | 6   | up    | +0.50    | Healthy  |
| Docs        | 4   | 5   | 6   | 6   | 6   | 7   | up    | +0.50    | Healthy  |
| Err Handle  | 3   | 4   | 5   | 5   | 6   | 6   | up    | +0.50    | Healthy  |
| Observ.     | 2   | 3   | 4   | 5   | 5   | 6   | up    | +0.67    | Healthy  |
| Deploy      | 3   | 4   | 4   | 5   | 5   | 7   | up    | +0.67    | Healthy  |

## EMA Velocity Tracker

| Iter | Raw_v | EMA_v | EMA_a  | Sigma | Momentum | Band_Lo | Band_Hi | TTT  |
|------|-------|-------|--------|-------|----------|---------|---------|------|
| 1    | 0.900 | 0.900 | 0.000  | 0.000 | --       | 0.900   | 0.900   | 5.4  |
| 2    | 0.700 | 0.800 | -0.200 | 0.100 | 8.00     | 0.600   | 1.000   | 5.3  |
| 3    | 0.400 | 0.600 | -0.250 | 0.141 | 4.25     | 0.318   | 0.882   | 6.3  |
| 4    | 0.100 | 0.350 | -0.225 | 0.200 | 1.75     | -0.050  | 0.750   | 10.6 |
| 5    | 0.700 | 0.525 | -0.044 | 0.224 | 2.34     | 0.077   | 0.973   | 5.7  |

## Convergence Analysis

### Trajectory
- Start: 4.2/10 -> Current: 7.0/10 (+2.8 over 5 iterations)
- Mean velocity: +0.56/iteration
- EMA velocity: +0.525/iteration
- Predicted convergence: iteration 8 at ~8.6/10

### Detected Patterns
- **Regime:** CONTRACTIVE (single attractor, settling)
- **Diminishing returns:** Mild (DR ratio: 0.78, not critical)
- **Oscillation:** None detected (score: 0.12)
- **Plateau:** Detected at iteration 4, broke through with FOCUS_NARROW pivot

### Pivot History
| Pivot # | Iteration | Severity | Strategy      | Result         |
|---------|-----------|----------|---------------|----------------|
| 1       | 4         | MILD     | FOCUS_NARROW  | +0.7 (success) |

## Prediction

| Iteration | Predicted Grade | Predicted Velocity | Confidence |
|-----------|----------------|--------------------|------------|
| +1 (I6)   | 7.5            | 0.481              | Medium     |
| +2 (I7)   | 7.9            | 0.437              | Medium     |
| +3 (I8)   | 8.2            | 0.393              | Low        |

## Final Verdict
- Status: {{SUCCESS|CONVERGED|MAX_REACHED|DEGRADED}}
- Iterations completed: {{N}}
- Total fixes applied: {{N}}
- Total agents used: {{N}}
- Total pivots: {{N}}/{{MAX_PIVOTS}}
- Total tokens consumed: {{N}}
- Ceiling prediction: {{grade}}/10
```

### 9.2 Log Writer Pseudocode

```python
def write_convergence_log(state: ConvergenceState, decision: ConvergenceDecision,
                          output_path: str):
    """
    Write or update the CONVERGENCE-LOG.md file after each iteration.
    """
    current = state.history[-1]
    ema = decision.metrics.get("ema", {})

    # Build progression row
    row = (
        f"| {current.iteration} "
        f"| {current.overall_grade:.1f}/10 "
        f"| {'+' if ema.get('raw_velocity', 0) >= 0 else ''}"
        f"{ema.get('raw_velocity', 0):.1f} "
        f"| {ema.get('ema_velocity', 0):.3f} "
        f"| {ema.get('signal_strength', '--')} "
        f"| {state.regime.name if state.regime else '--'} "
        f"| {', '.join(decision.focus_dimensions[:2]) if decision.focus_dimensions else '--'} "
        f"| {current.fixes_applied} "
        f"| {decision.verdict.name} |"
    )

    # Read existing log, append row to progression table
    log = read_file(output_path) if file_exists(output_path) else template()
    log = append_to_table(log, "Progression", row)

    # Update per-dimension history
    for dim in DIMENSION_NAMES:
        score = current.dimensions[dim]
        log = update_dimension_cell(log, dim, current.iteration, score)

    # Update EMA tracker table
    if ema:
        ema_row = (
            f"| {current.iteration} "
            f"| {ema.get('raw_velocity', 0):.3f} "
            f"| {ema.get('ema_velocity', 0):.3f} "
            f"| {ema.get('ema_acceleration', 0):.3f} "
            f"| {ema.get('sigma', 0):.3f} "
            f"| {ema.get('momentum', 0):.2f} "
            f"| {ema.get('confidence_band', (0,0))[0]:.3f} "
            f"| {ema.get('confidence_band', (0,0))[1]:.3f} "
            f"| {ema.get('time_to_target', 0):.1f} |"
        )
        log = append_to_table(log, "EMA Velocity Tracker", ema_row)

    # Write final verdict if terminal
    if decision.verdict in [SUCCESS, CONVERGED, MAX_REACHED, DEGRADED]:
        log = update_final_verdict(log, state, decision)

    write_file(output_path, log)
```

---

## 10. Calibration and Tuning Guide

### 10.1 When to Adjust Thresholds

| Symptom | Root Cause | Adjustment |
|---------|------------|------------|
| Pipeline exits too early | EPSILON too high | Lower EPSILON to 0.05 |
| Pipeline runs too long | EPSILON too low | Raise EPSILON to 0.15 |
| False plateau detections | Judge scoring noise | Raise PATIENCE to 3, lower EPSILON |
| Missed oscillations | Threshold too high | Lower OSC_THRESHOLD to 0.50 |
| Too many pivots | Pivot triggers too sensitive | Raise PLATEAU_PATIENCE to 3 |
| Semantic convergence too early | LAMBDA too low | Raise to 0.95 |
| Never detects semantic conv. | LAMBDA too high | Lower to 0.88 |
| EMA too noisy | Span too short | Raise ema_span to 5 |
| EMA too slow to react | Span too long | Lower ema_span to 2 |

### 10.2 Judge Calibration Impact

LLM judges exhibit known biases that affect convergence detection:

```
# Score compression: judges avoid extreme scores (1-2, 9-10)
# This creates artificial plateaus around 7-8/10
# Mitigation: use calibrated scoring (compare against reference projects)

# Score drift: judge may score differently across iterations even for same code
# This creates false oscillation signals
# Mitigation: increase EMA span, raise oscillation threshold

# Self-consistency: same code should get same score
# Re-evaluate unchanged dimensions to detect judge drift
# If re-scored dimension differs by > 0.5 from previous: flag calibration issue
```

### 10.3 Per-Command Tuning Rationale

```
/production-upgrade (7 max, 1 pivot):
    - Short pipeline, aggressive convergence detection
    - EPSILON=0.1 catches plateaus within 2 iterations
    - Single pivot allowed (FOCUS_NARROW only)

/omni-plan (7 max, 2 pivots):
    - Medium pipeline with tri-tiered judging
    - More pivot room for complex codebases
    - Same EPSILON but judge consensus reduces noise

/omni-plan-nth (20 max, 3 pivots):
    - Long pipeline targeting perfection
    - Needs more patience (higher EMA span=4)
    - Full pivot escalation ladder available
    - Semantic convergence as secondary signal

/auto-swarm (11 max, 2 pivots):
    - Uses coverage metric, not grade
    - EPSILON=0.02 (2% coverage change)
    - Different convergence math (coverage_delta < 0.02)
```

### 10.4 Mathematical Properties

```
Property                 | Guarantee
-------------------------+--------------------------------------------
Monotonic exit           | Pipeline always terminates (MAX_REACHED cap)
Regression protection    | Any dimension drop > 0.5 triggers HALT
No infinite loops        | max_iterations + max_pivots bounds total runs
Budget bounded           | guardrails-controller enforces token limits
Strategy diversity       | Pivot ladder ensures different approaches tried
False positive resilience| PATIENCE > 1 requires sustained signal
Noise tolerance          | EMA smoothing filters judge variance
```

---

## Appendix A: Full Threshold Reference

```
CONSTANT                          | DEFAULT | TYPE    | UNIT
----------------------------------+---------+---------+------------------
EPSILON                           | 0.10    | float   | grade points
PATIENCE                          | 2       | int     | iterations
TARGET_GRADE                      | 10.0    | float   | grade points
REGRESSION_THRESHOLD              | 0.30    | float   | grade points
DIMENSION_REGRESSION_THRESHOLD    | 0.50    | float   | grade points
LAMBDA (semantic local sim)       | 0.92    | float   | cosine similarity
RHO (semantic dispersion)         | 0.08    | float   | 1 - cosine similarity
KAPPA (semantic patience)         | 2       | int     | violations
W (semantic window)               | 3       | int     | iterations
DECEL_THRESHOLD                   | 0.05    | float   | grade pts / iter^2
DR_FLOOR                          | 0.15    | float   | ratio (unitless)
MIN_EFFICIENCY                    | 0.0001  | float   | grade pts / token
OSC_THRESHOLD                     | 0.60    | float   | ratio (unitless)
DIM_OSC_THRESHOLD                 | 0.75    | float   | ratio (unitless)
CUSUM_H                           | 0.50    | float   | grade points
CUSUM_K                           | 0.05    | float   | grade points
PLATEAU_PATIENCE                  | 2       | int     | iterations
PLATEAU_EPSILON                   | 0.10    | float   | grade points
MAX_PIVOTS                        | 3       | int     | pivots
EMA_SPAN                          | 3       | int     | iterations
EMA_ACCEL_SPAN                    | 4       | int     | iterations
MAX_ITERATIONS                    | 20      | int     | iterations
COUPLING_CORRELATION_THRESHOLD    | -0.60   | float   | Pearson r
```

## Appendix B: Research References

1. Madaan et al. 2023 -- "Self-Refine: Iterative Refinement with Self-Feedback" (NeurIPS 2023)
2. Shinn et al. 2023 -- "Reflexion: Language Agents with Verbal Reinforcement Learning"
3. arxiv 2512.10350 -- "Geometric Dynamics of Agentic Loops in LLMs: Trajectories, Attractors, and Dynamical Regimes in Semantic Space"
4. Zheng et al. 2023 -- "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena"
5. Page 1954 -- "Continuous Inspection Schemes" (Biometrika) -- CUSUM algorithm
6. Killick et al. 2012 -- "Optimal Detection of Changepoints with a Linear Computational Cost" (PELT)
7. Li et al. 2023 -- "Large Language Models Understand and Can Be Enhanced by Emotional Stimuli" (EmotionPrompt)
8. Adams et al. 2023 -- "From Sparse to Dense: Chain of Density Prompting"
