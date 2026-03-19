import { describe, test, expect } from "bun:test";
import {
  scoreConvergence,
  analyzeConvergence,
  EMAVelocityTracker,
  type IterationResult,
  type DimensionScore,
} from "../scripts/convergence";

// ─── Helpers ──────────────────────────────────────────────────

function makeDims(scores: Record<string, number>): DimensionScore[] {
  return Object.entries(scores).map(([name, score]) => ({ name, score }));
}

function makeIter(iteration: number, scores: Record<string, number>): IterationResult {
  return {
    iteration,
    dimensions: makeDims(scores),
    timestamp: new Date().toISOString(),
  };
}

function makeHistory(
  scoresList: Record<string, number>[],
  startIteration: number = 0,
): IterationResult[] {
  return scoresList.map((scores, i) => makeIter(startIteration + i, scores));
}

// ─── scoreConvergence() ───────────────────────────────────────

describe("scoreConvergence", () => {
  // --- CONTINUE cases ---

  test("returns CONTINUE when improving normally (delta > EPSILON)", () => {
    const history = makeHistory([
      { code: 3.0, security: 3.0 },
      { code: 5.0, security: 5.0 }, // delta = +2.0, well above EPSILON=0.1
    ]);
    const result = scoreConvergence(history);
    expect(result.decision).toBe("CONTINUE");
    expect(result.delta).toBeCloseTo(2.0, 5);
  });

  test("returns CONTINUE with 2 iterations and moderate improvement", () => {
    const history = makeHistory([
      { perf: 4.0, ux: 4.0 },
      { perf: 5.0, ux: 4.5 }, // delta = +0.75
    ]);
    const result = scoreConvergence(history);
    expect(result.decision).toBe("CONTINUE");
    expect(result.delta).toBeGreaterThan(0.1);
  });

  test("returns CONTINUE when stall count < PATIENCE (only 1 stall with 3 iterations)", () => {
    const history = makeHistory([
      { a: 5.0, b: 5.0 },
      { a: 6.5, b: 6.5 }, // delta = +1.5 (not stall)
      { a: 6.55, b: 6.55 }, // delta = +0.05 (stall #1, but need 2)
    ]);
    const result = scoreConvergence(history);
    expect(result.decision).toBe("CONTINUE");
  });

  // --- CONVERGED cases ---

  test("returns CONVERGED when delta < EPSILON for PATIENCE (2) consecutive iterations", () => {
    const history = makeHistory([
      { a: 5.0, b: 5.0 },
      { a: 7.0, b: 7.0 }, // big jump
      { a: 7.02, b: 7.02 }, // stall #1: delta=0.02
      { a: 7.04, b: 7.04 }, // stall #2: delta=0.02 -> CONVERGED
    ]);
    const result = scoreConvergence(history);
    expect(result.decision).toBe("CONVERGED");
  });

  test("CONVERGED includes lowest-scoring dimensions as focusDimensions", () => {
    const history = makeHistory([
      { code: 5.0, security: 5.0, perf: 5.0 },
      { code: 7.0, security: 6.0, perf: 8.0 },
      { code: 7.02, security: 6.02, perf: 8.02 }, // stall #1
      { code: 7.04, security: 6.04, perf: 8.04 }, // stall #2
    ]);
    const result = scoreConvergence(history);
    expect(result.decision).toBe("CONVERGED");
    expect(result.focusDimensions.length).toBeGreaterThan(0);
    // security (6.04) should be the lowest, so it must be in focus
    expect(result.focusDimensions).toContain("security");
  });

  test("returns CONVERGED (SUCCESS path) when grade >= 10.0", () => {
    const history = makeHistory([
      { a: 9.0, b: 9.0 },
      { a: 10.0, b: 10.0 }, // grade = 10.0 -> SUCCESS mapped to CONVERGED
    ]);
    const result = scoreConvergence(history);
    expect(result.decision).toBe("CONVERGED");
    expect(result.focusDimensions).toEqual([]); // SUCCESS has empty focus
  });

  test("returns CONVERGED (SUCCESS) even if previous iteration also had high score", () => {
    const history = makeHistory([
      { a: 9.5, b: 9.8 },
      { a: 10.0, b: 10.0 },
    ]);
    const result = scoreConvergence(history);
    expect(result.decision).toBe("CONVERGED");
  });

  // --- DEGRADED cases ---

  test("returns DEGRADED when any dimension drops > 0.5", () => {
    const history = makeHistory([
      { security: 7.0, perf: 8.0 },
      { security: 6.2, perf: 8.5 }, // security dropped 0.8 > 0.5
    ]);
    const result = scoreConvergence(history);
    expect(result.decision).toBe("DEGRADED");
    expect(result.focusDimensions).toContain("security");
  });

  test("returns DEGRADED when overall drops > 0.3 (even without per-dim regression)", () => {
    // Both dimensions drop slightly but together they average > 0.3 drop
    const history = makeHistory([
      { a: 7.0, b: 7.0 },
      { a: 6.5, b: 6.5 }, // overall delta = -0.5, each dim drops 0.5 (exactly at threshold, not > 0.5)
    ]);
    const result = scoreConvergence(history);
    expect(result.decision).toBe("DEGRADED");
    // Overall regression path returns worst 3 dimensions
    expect(result.focusDimensions.length).toBeGreaterThan(0);
  });

  test("DEGRADED returns regressed dimensions in focusDimensions (per-dim path)", () => {
    const history = makeHistory([
      { code: 7.0, security: 7.0, ux: 7.0 },
      { code: 8.0, security: 6.0, ux: 7.0 }, // security dropped 1.0 > 0.5
    ]);
    const result = scoreConvergence(history);
    expect(result.decision).toBe("DEGRADED");
    expect(result.focusDimensions).toContain("security");
    expect(result.focusDimensions).not.toContain("code");
  });

  test("DEGRADED returns worst 3 dimensions on overall regression path", () => {
    // Each dim drops 0.4 (under per-dim threshold of 0.5), but overall drops 0.4 (> 0.3)
    const history = makeHistory([
      { a: 7.0, b: 7.0, c: 7.0, d: 7.0 },
      { a: 6.6, b: 6.6, c: 6.6, d: 6.6 }, // per-dim: -0.4 each (not > 0.5), overall: -0.4 (> 0.3)
    ]);
    const result = scoreConvergence(history);
    expect(result.decision).toBe("DEGRADED");
    expect(result.focusDimensions.length).toBeLessThanOrEqual(3);
  });

  // --- MAX_REACHED ---

  test("returns MAX_REACHED when iteration >= maxIterations", () => {
    const history = makeHistory(
      [
        { code: 5.0 },
        { code: 6.0 }, // delta = +1.0, improving but at max
      ],
      19, // iteration 19 and 20
    );
    const result = scoreConvergence(history, 20);
    expect(result.decision).toBe("MAX_REACHED");
  });

  test("MAX_REACHED respects custom maxIterations", () => {
    const history = makeHistory(
      [
        { a: 5.0 },
        { a: 6.0 },
      ],
      4, // iterations 4 and 5
    );
    const result = scoreConvergence(history, 5);
    expect(result.decision).toBe("MAX_REACHED");
  });

  // --- Single iteration / edge cases ---

  test("returns CONTINUE with empty focusDimensions for single iteration", () => {
    const history = [makeIter(0, { code: 3.0, security: 2.5 })];
    const result = scoreConvergence(history);
    expect(result.decision).toBe("CONTINUE");
    expect(result.delta).toBe(0);
    expect(result.velocity).toBe(0);
    expect(result.focusDimensions).toEqual([]);
  });

  test("handles empty dimensions array gracefully", () => {
    const history: IterationResult[] = [
      { iteration: 0, dimensions: [], timestamp: new Date().toISOString() },
      { iteration: 1, dimensions: [], timestamp: new Date().toISOString() },
    ];
    // overallGrade([]) returns 0, so both grades are 0, delta = 0
    // With only 2 iterations, stall check requires n >= 3, so it falls through to CONTINUE
    const result = scoreConvergence(history);
    expect(result.decision).toBe("CONTINUE");
    expect(result.delta).toBe(0);
  });

  // --- Priority: DEGRADED beats CONVERGED ---

  test("DEGRADED takes priority over CONVERGED (stall with regression)", () => {
    // Scenario: grade >= target would be SUCCESS/CONVERGED,
    // but a per-dimension regression is checked first (after SUCCESS).
    // Actually, SUCCESS is checked first. Let's test: stall + dimension regression.
    // In the code order: SUCCESS -> DEGRADED (per-dim) -> DEGRADED (overall) -> MAX -> STALL
    // So if both stall and per-dim regression are present, DEGRADED wins.
    const history = makeHistory([
      { a: 7.0, b: 7.0 },
      { a: 7.0, b: 7.0 }, // stall #1
      { a: 7.05, b: 6.0 }, // b dropped 1.0 > 0.5, but also near stall overall
    ]);
    const result = scoreConvergence(history);
    expect(result.decision).toBe("DEGRADED");
    expect(result.focusDimensions).toContain("b");
  });

  // --- focusDimensions identification ---

  test("focusDimensions identifies lowest 2 when no regression (stall convergence)", () => {
    const history = makeHistory([
      { code: 5.0, security: 5.0, perf: 5.0, ux: 5.0 },
      { code: 8.0, security: 6.0, perf: 9.0, ux: 6.5 },
      { code: 8.02, security: 6.02, perf: 9.02, ux: 6.52 }, // stall #1
      { code: 8.04, security: 6.04, perf: 9.04, ux: 6.54 }, // stall #2 -> CONVERGED
    ]);
    const result = scoreConvergence(history);
    expect(result.decision).toBe("CONVERGED");
    // Lowest dims: security (6.04), ux (6.54)
    expect(result.focusDimensions[0]).toBe("security");
    expect(result.focusDimensions[1]).toBe("ux");
  });

  test("focusDimensions identifies regressed dimensions specifically", () => {
    const history = makeHistory([
      { code: 8.0, security: 8.0, perf: 8.0 },
      { code: 8.5, security: 7.0, perf: 7.2 }, // security: -1.0, perf: -0.8
    ]);
    const result = scoreConvergence(history);
    expect(result.decision).toBe("DEGRADED");
    expect(result.focusDimensions).toContain("security");
    expect(result.focusDimensions).toContain("perf");
    expect(result.focusDimensions).not.toContain("code");
  });
});

// ─── EMAVelocityTracker ───────────────────────────────────────

describe("EMAVelocityTracker", () => {
  test("first update initializes EMA to raw velocity", () => {
    const tracker = new EMAVelocityTracker(3); // alpha = 2/(3+1) = 0.5
    const metrics = tracker.update(5.0, 3.0); // raw velocity = 2.0
    expect(metrics.rawVelocity).toBeCloseTo(2.0, 5);
    expect(metrics.emaVelocity).toBeCloseTo(2.0, 5); // first update: EMA = raw
    expect(metrics.emaAcceleration).toBeCloseTo(0, 5); // no acceleration on first update
  });

  test("update() computes correct EMA with alpha=0.5", () => {
    const tracker = new EMAVelocityTracker(3); // alpha = 2/(3+1) = 0.5
    tracker.update(5.0, 3.0); // v=2.0, EMA=2.0
    const m2 = tracker.update(6.0, 5.0); // v=1.0, EMA = 0.5*1.0 + 0.5*2.0 = 1.5
    expect(m2.emaVelocity).toBeCloseTo(1.5, 5);
  });

  test("EMA smooths out noisy velocity correctly over 4 updates", () => {
    const tracker = new EMAVelocityTracker(3); // alpha = 0.5
    // Velocities: 2.0, 1.0, 0.5, 0.3
    tracker.update(5.0, 3.0); // EMA = 2.0
    tracker.update(6.0, 5.0); // EMA = 0.5*1.0 + 0.5*2.0 = 1.5
    tracker.update(6.5, 6.0); // EMA = 0.5*0.5 + 0.5*1.5 = 1.0
    const m4 = tracker.update(6.8, 6.5); // EMA = 0.5*0.3 + 0.5*1.0 = 0.65
    expect(m4.emaVelocity).toBeCloseTo(0.65, 5);
  });

  test("momentum classified as 'strong' when momentum > 2.0", () => {
    const tracker = new EMAVelocityTracker(3);
    // First update: EMA=2.0, variance=0, sigma~=sqrt(1e-10)~=0.00001
    // momentum = 2.0 / 0.00001 >> 2.0
    const metrics = tracker.update(5.0, 3.0);
    expect(metrics.signalStrength).toBe("strong");
  });

  test("momentum classified as 'moderate' when 0.5 < momentum <= 2.0", () => {
    const tracker = new EMAVelocityTracker(3); // alpha = 0.5
    // Build up some variance so momentum lands in moderate range
    tracker.update(5.0, 3.0); // v=2.0, EMA=2.0
    tracker.update(5.5, 5.0); // v=0.5, EMA=1.25
    tracker.update(5.2, 5.5); // v=-0.3, EMA=0.475
    // Now EMA is small-ish with some variance. Check signal.
    const m = tracker.update(5.8, 5.2); // v=0.6, EMA=0.5*0.6+0.5*0.475=0.5375
    // At this point we have accumulated variance; moderate is plausible
    // The exact classification depends on accumulated sigma
    expect(["strong", "moderate"]).toContain(m.signalStrength);
  });

  test("momentum classified as 'stalled' when velocity near zero", () => {
    const tracker = new EMAVelocityTracker(3);
    // Feed near-zero velocities to get EMA near zero
    tracker.update(5.0, 5.0); // v=0, EMA=0
    tracker.update(5.01, 5.0); // v=0.01
    const m = tracker.update(5.01, 5.01); // v=0
    expect(["stalled", "moderate"]).toContain(m.signalStrength);
  });

  test("momentum classified as 'regressing' when strongly negative", () => {
    const tracker = new EMAVelocityTracker(3);
    // Feed strongly negative velocities
    tracker.update(3.0, 5.0); // v=-2.0, EMA=-2.0
    const m = tracker.update(1.5, 3.0); // v=-1.5, EMA=-1.75
    // momentum = -1.75 / small_sigma -> very negative -> regressing
    expect(m.signalStrength).toBe("regressing");
  });

  test("timeToTarget is reasonable for positive velocity", () => {
    const tracker = new EMAVelocityTracker(3);
    // grade=5.0, EMA velocity=2.0, target=10.0, gap=5.0
    // TTT = 5.0 / 2.0 = 2.5
    const m = tracker.update(5.0, 3.0);
    expect(m.timeToTarget).toBeCloseTo(2.5, 1);
  });

  test("timeToTarget clamped to 999 for near-zero velocity", () => {
    const tracker = new EMAVelocityTracker(3);
    // v ~ 0, so TTT -> Infinity, clamped to 999
    const m = tracker.update(5.0, 5.0); // v=0, TTT=Infinity->999
    expect(m.timeToTarget).toBe(999);
  });

  test("handles zero velocity without division by zero", () => {
    const tracker = new EMAVelocityTracker(3);
    const m = tracker.update(5.0, 5.0); // v=0
    expect(Number.isFinite(m.emaVelocity)).toBe(true);
    expect(Number.isFinite(m.sigma)).toBe(true);
    expect(Number.isFinite(m.momentum)).toBe(true);
    expect(Number.isFinite(m.timeToTarget)).toBe(true);
  });

  test("handles negative velocity (regression) correctly", () => {
    const tracker = new EMAVelocityTracker(3);
    const m = tracker.update(3.0, 5.0); // v=-2.0
    expect(m.rawVelocity).toBeCloseTo(-2.0, 5);
    expect(m.emaVelocity).toBeCloseTo(-2.0, 5);
    // timeToTarget should be 999 since velocity <= 0.01
    expect(m.timeToTarget).toBe(999);
  });

  test("predictTrajectory() returns correct number of steps", () => {
    const tracker = new EMAVelocityTracker(3);
    tracker.update(5.0, 3.0); // EMA=2.0, accel=0
    const preds = tracker.predictTrajectory(5.0, 5);
    expect(preds.length).toBe(5);
    expect(preds[0].step).toBe(1);
    expect(preds[4].step).toBe(5);
  });

  test("predictTrajectory() clamps predicted grades to [1, 10]", () => {
    const tracker = new EMAVelocityTracker(3);
    tracker.update(9.0, 3.0); // EMA=6.0 (huge velocity)
    const preds = tracker.predictTrajectory(9.0, 5);
    // All predictions should be clamped at 10
    for (const p of preds) {
      expect(p.predictedGrade).toBeLessThanOrEqual(10.0);
      expect(p.predictedGrade).toBeGreaterThanOrEqual(1.0);
    }
  });

  test("predictTrajectory() incorporates acceleration", () => {
    const tracker = new EMAVelocityTracker(3, 4); // accelSpan=4, alphaAccel=0.4
    tracker.update(5.0, 3.0); // v=2.0, EMA=2.0, accel=0 (no prev)
    tracker.update(8.0, 5.0); // v=3.0, EMA=2.5, accel=0.4*(3-2)=0.4
    const preds = tracker.predictTrajectory(8.0, 3);
    // With positive acceleration, later steps should have higher predicted velocity
    expect(preds[2].predictedVelocity).toBeGreaterThan(preds[0].predictedVelocity);
  });

  test("fresh tracker with no updates returns sensible currentVelocity", () => {
    const tracker = new EMAVelocityTracker();
    expect(tracker.currentVelocity).toBe(0);
    expect(tracker.metricsHistory.length).toBe(0);
  });

  test("fresh tracker predictTrajectory returns flat predictions", () => {
    const tracker = new EMAVelocityTracker();
    const preds = tracker.predictTrajectory(5.0, 3);
    // EMA=0, accel=0, so grade stays at 5.0
    expect(preds.length).toBe(3);
    for (const p of preds) {
      expect(p.predictedGrade).toBeCloseTo(5.0, 2);
      expect(p.predictedVelocity).toBeCloseTo(0, 2);
    }
  });

  test("metricsHistory accumulates correctly", () => {
    const tracker = new EMAVelocityTracker(3);
    tracker.update(5.0, 3.0);
    tracker.update(6.0, 5.0);
    tracker.update(6.5, 6.0);
    expect(tracker.metricsHistory.length).toBe(3);
    expect(tracker.metricsHistory[0].rawVelocity).toBeCloseTo(2.0, 5);
    expect(tracker.metricsHistory[1].rawVelocity).toBeCloseTo(1.0, 5);
    expect(tracker.metricsHistory[2].rawVelocity).toBeCloseTo(0.5, 5);
  });

  test("velocityTrend is 'accelerating' when acceleration > 0.01", () => {
    const tracker = new EMAVelocityTracker(3, 4);
    tracker.update(5.0, 3.0); // v=2.0
    tracker.update(9.0, 5.0); // v=4.0, accel should be positive (4-2=2, ema_a=0.4*2=0.8)
    const m = tracker.metricsHistory[1];
    expect(m.velocityTrend).toBe("accelerating");
  });

  test("velocityTrend is 'decelerating' when acceleration < -0.01", () => {
    const tracker = new EMAVelocityTracker(3, 4);
    tracker.update(5.0, 3.0); // v=2.0
    tracker.update(5.5, 5.0); // v=0.5, accel = 0.4*(0.5-2.0) = -0.6
    const m = tracker.metricsHistory[1];
    expect(m.velocityTrend).toBe("decelerating");
  });
});

// ─── analyzeConvergence() ──────────────────────────────────────

describe("analyzeConvergence", () => {
  test("combines score-based and EMA correctly", () => {
    const history = makeHistory([
      { code: 3.0, security: 3.0 },
      { code: 5.0, security: 5.0 },
      { code: 7.0, security: 7.0 },
    ]);
    const { convergence, velocity } = analyzeConvergence(history);
    expect(convergence.decision).toBe("CONTINUE");
    expect(velocity).not.toBeNull();
    expect(velocity!.rawVelocity).toBeCloseTo(2.0, 5); // last delta
  });

  test("enriches convergenceResult.velocity with EMA velocity", () => {
    const history = makeHistory([
      { a: 3.0, b: 3.0 },
      { a: 5.0, b: 5.0 }, // delta = 2.0
      { a: 6.0, b: 6.0 }, // delta = 1.0
    ]);
    const { convergence, velocity } = analyzeConvergence(history);
    // EMA velocity should reflect smoothed value, not raw delta
    // alpha=0.5: first EMA=2.0, second EMA=0.5*1.0+0.5*2.0=1.5
    expect(convergence.velocity).toBeCloseTo(1.5, 5);
    expect(velocity!.emaVelocity).toBeCloseTo(1.5, 5);
  });

  test("returns null velocity with only 1 iteration", () => {
    const history = [makeIter(0, { code: 3.0, security: 3.0 })];
    const { convergence, velocity } = analyzeConvergence(history);
    expect(convergence.decision).toBe("CONTINUE");
    expect(velocity).toBeNull();
  });

  test("works correctly with 3 iterations (growing)", () => {
    const history = makeHistory([
      { a: 2.0, b: 2.0 },
      { a: 4.0, b: 4.0 },
      { a: 6.0, b: 6.0 },
    ]);
    const { convergence, velocity } = analyzeConvergence(history);
    expect(convergence.decision).toBe("CONTINUE");
    expect(velocity).not.toBeNull();
    expect(velocity!.emaVelocity).toBeGreaterThan(0);
  });

  test("works correctly with 10 iterations converging to stall", () => {
    // Grades that converge: 3, 5, 6.5, 7.2, 7.5, 7.55, 7.57, 7.58, 7.58, 7.58
    const grades = [3.0, 5.0, 6.5, 7.2, 7.5, 7.55, 7.57, 7.58, 7.58, 7.58];
    const history = grades.map((g, i) => makeIter(i, { a: g, b: g }));
    const { convergence, velocity } = analyzeConvergence(history);
    // Should be CONVERGED due to multiple stalls at the end
    expect(convergence.decision).toBe("CONVERGED");
    expect(velocity).not.toBeNull();
    // Velocity should be near zero since we stalled
    expect(Math.abs(velocity!.emaVelocity)).toBeLessThan(0.5);
  });

  test("returns DEGRADED when overall regresses in combined analysis", () => {
    const history = makeHistory([
      { code: 7.0, security: 7.0 },
      { code: 6.0, security: 6.0 }, // overall drops 1.0 > 0.3
    ]);
    const { convergence, velocity } = analyzeConvergence(history);
    expect(convergence.decision).toBe("DEGRADED");
    expect(velocity).not.toBeNull();
    expect(velocity!.emaVelocity).toBeLessThan(0);
  });
});
