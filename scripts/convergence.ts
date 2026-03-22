#!/usr/bin/env bun
/**
 * convergence.ts — Convergence Detection Engine for ProductionOS.
 *
 * Implements two algorithms from the convergence-detection spec:
 *   Algorithm 1: Score-Based Convergence (delta/patience/regression)
 *   Algorithm 6: EMA Improvement Velocity (smoothed velocity, confidence, momentum)
 *
 * Usage:
 *   bun run scripts/convergence.ts --test
 */

// ─── Interfaces ────────────────────────────────────────────────

export interface DimensionScore {
  name: string;
  score: number;
  evidence?: string;
}

export interface IterationResult {
  iteration: number;
  dimensions: DimensionScore[];
  timestamp: string;
}

export type ConvergenceDecision = "CONTINUE" | "SUCCESS" | "CONVERGED" | "DEGRADED" | "MAX_REACHED";

export interface ConvergenceResult {
  decision: ConvergenceDecision;
  delta: number;
  velocity: number;
  focusDimensions: string[];
}

export interface VelocityMetrics {
  rawVelocity: number;
  emaVelocity: number;
  emaAcceleration: number;
  sigma: number;
  momentum: number;
  confidenceBand: [lower: number, upper: number];
  timeToTarget: number;
  velocityTrend: "accelerating" | "decelerating" | "steady";
  signalStrength: "strong" | "moderate" | "stalled" | "regressing";
}

// ─── Constants (from spec Section 2.2 and 7.1) ────────────────

const EPSILON = 0.1;
const PATIENCE = 2;
const TARGET_GRADE = 10.0;
const REGRESSION_THRESHOLD = 0.3;
const DIMENSION_REGRESSION_THRESHOLD = 0.5;
const DEFAULT_MAX_ITERATIONS = 20;

const DEFAULT_EMA_SPAN = 3;
const DEFAULT_ACCEL_SPAN = 4;

// ─── Helpers ───────────────────────────────────────────────────

export function overallGrade(dims: DimensionScore[]): number {
  if (dims.length === 0) return 0;
  return dims.reduce((sum, d) => sum + d.score, 0) / dims.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ─── Algorithm 1: Score-Based Convergence ──────────────────────

/**
 * Detect convergence by tracking the delta between consecutive overall grades.
 *
 * Decision logic (evaluated in order):
 *   1. SUCCESS  → grade >= target (mapped to CONVERGED since we use 4-state enum)
 *   2. DEGRADED → any dimension dropped > 0.5, or overall dropped > 0.3
 *   3. MAX_REACHED → iteration index >= maxIterations
 *   4. CONVERGED → abs(delta) < EPSILON for PATIENCE consecutive iterations
 *   5. CONTINUE → none of the above
 */
export function scoreConvergence(
  history: IterationResult[],
  maxIterations: number = DEFAULT_MAX_ITERATIONS,
): ConvergenceResult {
  const n = history.length;

  if (n < 2) {
    return { decision: "CONTINUE", delta: 0, velocity: 0, focusDimensions: [] };
  }

  const current = history[n - 1];
  const previous = history[n - 2];
  const currentGrade = overallGrade(current.dimensions);
  const prevGrade = overallGrade(previous.dimensions);
  const delta = currentGrade - prevGrade;
  const focusDimensions: string[] = [];

  // --- SUCCESS CHECK (target reached) ---
  if (currentGrade >= TARGET_GRADE) {
    return { decision: "SUCCESS", delta, velocity: delta, focusDimensions: [] };
  }

  // --- DEGRADATION CHECK (per-dimension) ---
  for (const dimCurrent of current.dimensions) {
    const dimPrevious = previous.dimensions.find((d) => d.name === dimCurrent.name);
    if (!dimPrevious) continue;
    if (dimCurrent.score < dimPrevious.score - DIMENSION_REGRESSION_THRESHOLD) {
      focusDimensions.push(dimCurrent.name);
    }
  }
  if (focusDimensions.length > 0) {
    return { decision: "DEGRADED", delta, velocity: delta, focusDimensions };
  }

  // --- OVERALL REGRESSION CHECK ---
  if (delta < -REGRESSION_THRESHOLD) {
    // Identify the worst-performing dimensions as focus
    const sorted = [...current.dimensions].sort((a, b) => a.score - b.score);
    const worstNames = sorted.slice(0, 3).map((d) => d.name);
    return { decision: "DEGRADED", delta, velocity: delta, focusDimensions: worstNames };
  }

  // --- MAX ITERATION CHECK ---
  if (current.iteration >= maxIterations) {
    return { decision: "MAX_REACHED", delta, velocity: delta, focusDimensions: [] };
  }

  // --- STALL / CONVERGENCE CHECK ---
  if (n >= 3) {
    let stallCount = 0;
    for (let j = n - 1; j >= 1 && stallCount < PATIENCE; j--) {
      const d = overallGrade(history[j].dimensions) - overallGrade(history[j - 1].dimensions);
      if (Math.abs(d) < EPSILON) {
        stallCount++;
      } else {
        break;
      }
    }
    if (stallCount >= PATIENCE) {
      // Focus on lowest-scoring dimensions that need work
      const sorted = [...current.dimensions].sort((a, b) => a.score - b.score);
      const lowestNames = sorted.slice(0, 3).map((d) => d.name);
      return { decision: "CONVERGED", delta, velocity: delta, focusDimensions: lowestNames };
    }
  }

  return { decision: "CONTINUE", delta, velocity: delta, focusDimensions: [] };
}

// ─── Algorithm 6: EMA Improvement Velocity ─────────────────────

/**
 * Exponential Moving Average tracker for improvement velocity.
 *
 * Computes smoothed velocity, acceleration, confidence bands,
 * momentum (signal-to-noise), and time-to-target prediction.
 */
export class EMAVelocityTracker {
  private readonly alpha: number;
  private readonly alphaAccel: number;

  private emaVelocity: number | null = null;
  private emaAccel: number = 0;
  private emaVariance: number = 0;
  private prevRawVelocity: number | null = null;

  readonly metricsHistory: VelocityMetrics[] = [];

  constructor(span: number = DEFAULT_EMA_SPAN, accelSpan: number = DEFAULT_ACCEL_SPAN) {
    this.alpha = 2.0 / (span + 1);
    this.alphaAccel = 2.0 / (accelSpan + 1);
  }

  /**
   * Feed a new iteration's grade. Returns comprehensive velocity metrics.
   */
  update(currentGrade: number, previousGrade: number): VelocityMetrics {
    const v = currentGrade - previousGrade;

    if (this.emaVelocity === null) {
      // First observation: initialize EMA to raw value
      this.emaVelocity = v;
      this.emaVariance = 0;
      this.emaAccel = 0;
    } else {
      // Standard EMA update
      this.emaVelocity = this.alpha * v + (1 - this.alpha) * this.emaVelocity;

      // Variance update for confidence bands
      const residual = v - this.emaVelocity;
      this.emaVariance = this.alpha * residual ** 2 + (1 - this.alpha) * this.emaVariance;

      // Acceleration update (requires two raw velocities)
      if (this.prevRawVelocity !== null) {
        const a = v - this.prevRawVelocity;
        this.emaAccel = this.alphaAccel * a + (1 - this.alphaAccel) * this.emaAccel;
      }
    }

    this.prevRawVelocity = v;

    // Derived signals
    const sigma = Math.sqrt(Math.max(this.emaVariance, 1e-10));
    const momentum = sigma > 1e-6 ? this.emaVelocity / sigma : 0;
    const targetGap = TARGET_GRADE - currentGrade;
    const timeToTarget =
      this.emaVelocity > 0.01 ? targetGap / this.emaVelocity : Infinity;

    const velocityTrend: VelocityMetrics["velocityTrend"] =
      this.emaAccel > 0.01 ? "accelerating" : this.emaAccel < -0.01 ? "decelerating" : "steady";

    const signalStrength: VelocityMetrics["signalStrength"] =
      momentum > 2.0
        ? "strong"
        : momentum > 0.5
          ? "moderate"
          : momentum > -0.5
            ? "stalled"
            : "regressing";

    const metrics: VelocityMetrics = {
      rawVelocity: v,
      emaVelocity: this.emaVelocity,
      emaAcceleration: this.emaAccel,
      sigma,
      momentum,
      confidenceBand: [this.emaVelocity - 2 * sigma, this.emaVelocity + 2 * sigma],
      timeToTarget: clamp(timeToTarget, 0, 999),
      velocityTrend,
      signalStrength,
    };

    this.metricsHistory.push(metrics);
    return metrics;
  }

  /**
   * Predict future grades over a horizon, using current EMA velocity and acceleration.
   * Model: grade(t+k) = grade(t) + sum_{j=1}^{k} (EMA_v + j * EMA_a), clamped to [1, 10].
   */
  predictTrajectory(
    currentGrade: number,
    horizon: number = 5,
  ): { step: number; predictedGrade: number; predictedVelocity: number }[] {
    const predictions: { step: number; predictedGrade: number; predictedVelocity: number }[] = [];
    let g = currentGrade;
    const v = this.emaVelocity ?? 0;
    const a = this.emaAccel;

    for (let k = 1; k <= horizon; k++) {
      const vPredicted = v + k * a;
      g = clamp(g + vPredicted, 1.0, 10.0);
      predictions.push({
        step: k,
        predictedGrade: Math.round(g * 100) / 100,
        predictedVelocity: Math.round(vPredicted * 1000) / 1000,
      });
    }

    return predictions;
  }

  /** Current EMA velocity (or 0 if no data yet). */
  get currentVelocity(): number {
    return this.emaVelocity ?? 0;
  }
}

// ─── Combined Engine ───────────────────────────────────────────

/**
 * Run both algorithms on a full iteration history.
 * Returns the convergence decision plus the latest velocity metrics.
 */
export function analyzeConvergence(
  history: IterationResult[],
  maxIterations: number = DEFAULT_MAX_ITERATIONS,
): { convergence: ConvergenceResult; velocity: VelocityMetrics | null } {
  const convergence = scoreConvergence(history, maxIterations);

  let velocity: VelocityMetrics | null = null;
  if (history.length >= 2) {
    const tracker = new EMAVelocityTracker();
    for (let i = 1; i < history.length; i++) {
      const prev = overallGrade(history[i - 1].dimensions);
      const curr = overallGrade(history[i].dimensions);
      velocity = tracker.update(curr, prev);
    }
    // Enrich convergence result with EMA velocity
    convergence.velocity = tracker.currentVelocity;
  }

  return { convergence, velocity };
}

// ─── CLI Test Runner ───────────────────────────────────────────

function buildSampleHistory(): IterationResult[] {
  const dims = [
    "code_quality",
    "security",
    "performance",
    "ux_ui",
    "test_coverage",
  ];

  // Simulated trajectory: rapid improvement, then plateau leading to convergence
  const gradeProgression = [
    [3.0, 2.5, 4.0, 2.0, 1.5], // iter 0: baseline (avg 2.60)
    [5.0, 4.5, 5.5, 4.0, 3.5], // iter 1: big jump  (avg 4.50, delta +1.90)
    [6.5, 6.0, 6.5, 5.5, 5.0], // iter 2: solid     (avg 5.90, delta +1.40)
    [7.0, 6.8, 7.0, 6.0, 5.8], // iter 3: slowing   (avg 6.52, delta +0.62)
    [7.1, 6.8, 7.0, 6.1, 5.9], // iter 4: stall 1   (avg 6.58, delta +0.06)
    [7.1, 6.9, 7.0, 6.1, 5.9], // iter 5: stall 2   (avg 6.60, delta +0.02) → CONVERGED
  ];

  return gradeProgression.map((scores, i) => ({
    iteration: i,
    dimensions: scores.map((score, j) => ({
      name: dims[j],
      score,
      evidence: `Auto-evaluated at iteration ${i}`,
    })),
    timestamp: new Date(Date.now() - (gradeProgression.length - i) * 60_000).toISOString(),
  }));
}

function fmt(n: number, decimals: number = 3): string {
  return Number.isFinite(n) ? n.toFixed(decimals) : "Inf";
}

function runTests(): void {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  ProductionOS — Convergence Detection Engine (test)     ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  const history = buildSampleHistory();

  // ── Test Algorithm 1 at each step ──
  console.log("── Algorithm 1: Score-Based Convergence ──\n");
  console.log("  Iter  Grade   Delta   Decision        Focus");
  console.log("  ────  ─────   ─────   ──────────────  ─────────────────");

  for (let end = 1; end <= history.length; end++) {
    const slice = history.slice(0, end);
    const result = scoreConvergence(slice);
    const grade = overallGrade(slice[slice.length - 1].dimensions);
    const focus = result.focusDimensions.length > 0 ? result.focusDimensions.join(", ") : "—";
    console.log(
      `  ${(end - 1).toString().padStart(4)}  ${fmt(grade, 2).padStart(5)}  ` +
        `${(result.delta >= 0 ? "+" : "") + fmt(result.delta, 2)}   ` +
        `${result.decision.padEnd(14)}  ${focus}`,
    );
  }

  // ── Test Algorithm 6: EMA Velocity ──
  console.log("\n── Algorithm 6: EMA Improvement Velocity ──\n");
  console.log(
    "  Iter  EMA_v   Sigma   Momentum  Band              TTT     Trend         Signal",
  );
  console.log(
    "  ────  ─────   ─────   ────────  ────────────────  ──────  ────────────  ──────────",
  );

  const tracker = new EMAVelocityTracker();
  for (let i = 1; i < history.length; i++) {
    const prev = overallGrade(history[i - 1].dimensions);
    const curr = overallGrade(history[i].dimensions);
    const m = tracker.update(curr, prev);
    const band = `[${fmt(m.confidenceBand[0], 2)}, ${fmt(m.confidenceBand[1], 2)}]`;
    console.log(
      `  ${i.toString().padStart(4)}  ${fmt(m.emaVelocity, 3).padStart(5)}  ` +
        `${fmt(m.sigma, 3).padStart(5)}   ${fmt(m.momentum, 2).padStart(8)}  ` +
        `${band.padEnd(16)}  ${fmt(m.timeToTarget, 1).padStart(6)}  ` +
        `${m.velocityTrend.padEnd(12)}  ${m.signalStrength}`,
    );
  }

  // ── Trajectory Prediction ──
  const lastGrade = overallGrade(history[history.length - 1].dimensions);
  const predictions = tracker.predictTrajectory(lastGrade, 5);

  console.log("\n── Trajectory Prediction (from current state) ──\n");
  console.log("  Step   Predicted Grade   Predicted Velocity");
  console.log("  ─────  ──────────────    ──────────────────");
  for (const p of predictions) {
    console.log(
      `  +${p.step.toString().padEnd(4)}  ${fmt(p.predictedGrade, 2).padStart(14)}    ${fmt(p.predictedVelocity, 3).padStart(18)}`,
    );
  }

  // ── Combined Analysis ──
  console.log("\n── Combined Analysis (full history) ──\n");
  const { convergence, velocity } = analyzeConvergence(history);
  console.log(`  Decision:        ${convergence.decision}`);
  console.log(`  Delta:           ${fmt(convergence.delta, 3)}`);
  console.log(`  Velocity (EMA):  ${fmt(convergence.velocity, 3)}`);
  console.log(
    `  Focus:           ${convergence.focusDimensions.length > 0 ? convergence.focusDimensions.join(", ") : "none"}`,
  );
  if (velocity) {
    console.log(`  Momentum:        ${fmt(velocity.momentum, 2)} (${velocity.signalStrength})`);
    console.log(`  Confidence:      [${fmt(velocity.confidenceBand[0], 3)}, ${fmt(velocity.confidenceBand[1], 3)}]`);
    console.log(`  TTT:             ${fmt(velocity.timeToTarget, 1)} iterations`);
    console.log(`  Trend:           ${velocity.velocityTrend}`);
  }

  // ── Edge Case: Regression ──
  console.log("\n── Edge Case: Dimension Regression ──\n");
  const regressionHistory: IterationResult[] = [
    {
      iteration: 0,
      dimensions: [
        { name: "security", score: 7.0 },
        { name: "performance", score: 8.0 },
      ],
      timestamp: new Date().toISOString(),
    },
    {
      iteration: 1,
      dimensions: [
        { name: "security", score: 6.2 }, // dropped 0.8 > 0.5 threshold
        { name: "performance", score: 8.5 },
      ],
      timestamp: new Date().toISOString(),
    },
  ];
  const regResult = scoreConvergence(regressionHistory);
  console.log(`  Decision:  ${regResult.decision} (expected: DEGRADED)`);
  console.log(`  Focus:     ${regResult.focusDimensions.join(", ")} (expected: security)`);
  console.log(`  Pass:      ${regResult.decision === "DEGRADED" && regResult.focusDimensions.includes("security") ? "YES" : "FAIL"}`);

  // ── Edge Case: Max Iterations ──
  console.log("\n── Edge Case: Max Iterations ──\n");
  const maxHistory: IterationResult[] = [
    {
      iteration: 0,
      dimensions: [{ name: "code_quality", score: 5.0 }],
      timestamp: new Date().toISOString(),
    },
    {
      iteration: 20, // at the max
      dimensions: [{ name: "code_quality", score: 6.0 }],
      timestamp: new Date().toISOString(),
    },
  ];
  const maxResult = scoreConvergence(maxHistory, 20);
  console.log(`  Decision:  ${maxResult.decision} (expected: MAX_REACHED)`);
  console.log(`  Pass:      ${maxResult.decision === "MAX_REACHED" ? "YES" : "FAIL"}`);

  // ── Edge Case: Single Iteration ──
  console.log("\n── Edge Case: Single Iteration (no prior) ──\n");
  const singleResult = scoreConvergence([history[0]]);
  console.log(`  Decision:  ${singleResult.decision} (expected: CONTINUE)`);
  console.log(`  Pass:      ${singleResult.decision === "CONTINUE" ? "YES" : "FAIL"}`);

  console.log("\n✓ All tests complete.\n");
}

// ─── Entrypoint ────────────────────────────────────────────────

if (process.argv.includes("--test")) {
  runTests();
}
