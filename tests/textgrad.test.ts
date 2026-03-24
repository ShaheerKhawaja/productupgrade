/**
 * Tests for the TextGrad prompt optimization library.
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  initSession,
  computeWeightedScore,
  identifyWeakDimensions,
  recordIteration,
  logEdit,
  shouldContinue,
  getRollbackContent,
  generateReport,
  writeReport,
  DEFAULT_DIMENSIONS,
} from "../scripts/lib/textgrad";
import type { TextGradDimension, TextGradGradient, TextGradEdit, TextGradState } from "../scripts/lib/textgrad";

// ─── Helpers ──────────────────────────────────────────

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "pos-textgrad-test-"));
}

function makeAgent(root: string, name: string): string {
  const path = join(root, `${name}.md`);
  writeFileSync(path, `---\nname: ${name}\n---\n\n<role>\nYou are a test agent.\n</role>\n\n<instructions>\nDo things.\n</instructions>\n`);
  return path;
}

function makeDimensions(scores: number[]): TextGradDimension[] {
  return DEFAULT_DIMENSIONS.map((d, i) => ({ ...d, score: scores[i] ?? 5.0 }));
}

// ─── computeWeightedScore ─────────────────────────────

describe("TextGrad: computeWeightedScore", () => {
  test("perfect scores return 10.0", () => {
    const dims = makeDimensions([10, 10, 10, 10, 10, 10, 10]);
    expect(computeWeightedScore(dims)).toBe(10.0);
  });

  test("all zeros return 0", () => {
    const dims = makeDimensions([0, 0, 0, 0, 0, 0, 0]);
    expect(computeWeightedScore(dims)).toBe(0);
  });

  test("weighted average is correct", () => {
    // clarity=8 (0.20), completeness=6 (0.20), specificity=7 (0.15),
    // constraint=9 (0.15), efficiency=5 (0.10), grounding=4 (0.10), safety=10 (0.10)
    const dims = makeDimensions([8, 6, 7, 9, 5, 4, 10]);
    const expected = (8*0.20 + 6*0.20 + 7*0.15 + 9*0.15 + 5*0.10 + 4*0.10 + 10*0.10) / 1.0;
    expect(computeWeightedScore(dims)).toBeCloseTo(expected, 1);
  });

  test("empty dimensions return 0", () => {
    expect(computeWeightedScore([])).toBe(0);
  });
});

// ─── identifyWeakDimensions ───────────────────────────

describe("TextGrad: identifyWeakDimensions", () => {
  test("returns dimensions below threshold", () => {
    const dims = makeDimensions([9, 5, 8, 7, 6, 3, 10]);
    const weak = identifyWeakDimensions(dims, 8.0);
    expect(weak.length).toBe(4); // 5, 7, 6, 3 are below 8
    // Should be sorted by score ascending
    expect(weak[0].score).toBe(3);
    expect(weak[1].score).toBe(5);
  });

  test("returns empty when all above threshold", () => {
    const dims = makeDimensions([9, 9, 9, 9, 9, 9, 9]);
    const weak = identifyWeakDimensions(dims, 8.0);
    expect(weak.length).toBe(0);
  });

  test("custom threshold works", () => {
    const dims = makeDimensions([9, 9, 9, 9, 9, 9, 9]);
    const weak = identifyWeakDimensions(dims, 9.5);
    expect(weak.length).toBe(7);
  });
});

// ─── Session Management ───────────────────────────────

describe("TextGrad: Session Management", () => {
  let root: string;
  let stateDir: string;

  beforeEach(() => {
    root = makeTempDir();
    stateDir = join(root, ".productionos");
    mkdirSync(stateDir, { recursive: true });
  });

  afterEach(() => {
    try { rmSync(root, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  test("initSession saves original content for rollback", () => {
    const agentPath = makeAgent(root, "test-agent");
    const state = initSession("test-agent", agentPath, stateDir);

    expect(state.target).toBe("test-agent");
    expect(state.status).toBe("running");
    expect(state.originalContent).toContain("You are a test agent");

    // Backup file should exist
    const backupPath = join(stateDir, "textgrad", "test-agent-before.md");
    expect(existsSync(backupPath)).toBe(true);
  });

  test("getRollbackContent returns original", () => {
    const agentPath = makeAgent(root, "test-agent");
    initSession("test-agent", agentPath, stateDir);

    const original = getRollbackContent(stateDir, "test-agent");
    expect(original).not.toBeNull();
    expect(original).toContain("You are a test agent");
  });

  test("getRollbackContent returns null if no backup", () => {
    const content = getRollbackContent(stateDir, "nonexistent");
    expect(content).toBeNull();
  });
});

// ─── Iteration Tracking ───────────────────────────────

describe("TextGrad: Iteration Tracking", () => {
  let state: TextGradState;

  beforeEach(() => {
    state = {
      target: "test-agent",
      targetPath: "/tmp/test.md",
      startedAt: new Date().toISOString(),
      iterations: [],
      currentScore: 0,
      bestScore: 0,
      status: "running",
      originalContent: "# Test",
    };
  });

  test("recordIteration tracks score progression", () => {
    const gradients: TextGradGradient[] = [
      { dimension: "clarity", currentScore: 5, weakness: "Vague", improvement: "Be specific", evidence: "Line 10" },
    ];

    state = recordIteration(state, 6.5, gradients, 2);
    expect(state.iterations.length).toBe(1);
    expect(state.currentScore).toBe(6.5);
    expect(state.bestScore).toBe(6.5);
    expect(state.status).toBe("running");
  });

  test("convergence at 9.0+", () => {
    state = recordIteration(state, 7.0, [], 1);
    expect(state.status).toBe("running");

    state = recordIteration(state, 8.5, [], 1);
    expect(state.status).toBe("running");

    state = recordIteration(state, 9.2, [], 1);
    expect(state.status).toBe("converged");
  });

  test("max iterations stops at 5", () => {
    for (let i = 0; i < 5; i++) {
      state = recordIteration(state, 7.0 + i * 0.3, [], 1);
    }
    expect(state.iterations.length).toBe(5);
    expect(state.status).toBe("max_iterations");
  });

  test("stall detection: no_improvement after 3 consecutive flat iterations", () => {
    // First iteration shows progress (large jump)
    state = recordIteration(state, 5.0, [], 1);
    expect(state.status).toBe("running");

    // Iterations 2-4: all within MIN_IMPROVEMENT (0.1) of each other
    // Stall is detected when last 3 iterations are flat
    state = recordIteration(state, 7.0, [], 1);   // it2: jump — not flat vs it1
    expect(state.status).toBe("running");

    state = recordIteration(state, 7.02, [], 1);   // it3: flat vs it2 (delta=0.02)
    expect(state.status).toBe("running"); // Only 1 flat pair, need 3 consecutive in slice

    state = recordIteration(state, 7.03, [], 1);   // it4: slice=[it2,it3,it4]=[7.0,7.02,7.03]
    // All consecutive deltas < 0.1: |7.02-7.0|=0.02, |7.03-7.02|=0.01
    expect(state.status).toBe("no_improvement");
  });

  test("shouldContinue returns false when not running", () => {
    expect(shouldContinue(state)).toBe(true);
    state.status = "converged";
    expect(shouldContinue(state)).toBe(false);
  });
});

// ─── Edit Logging ─────────────────────────────────────

describe("TextGrad: Edit Logging", () => {
  let stateDir: string;

  beforeEach(() => {
    stateDir = makeTempDir();
  });

  afterEach(() => {
    try { rmSync(stateDir, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  test("logEdit appends to JSONL file", () => {
    const edit1: TextGradEdit = {
      dimension: "clarity", before: "Do things", after: "Execute code review",
      gradient: "Replace vague instruction", iteration: 1, timestamp: new Date().toISOString(),
    };
    const edit2: TextGradEdit = {
      dimension: "specificity", before: "Output results", after: "Write JSON report to .productionos/",
      gradient: "Specify output path", iteration: 1, timestamp: new Date().toISOString(),
    };

    logEdit(stateDir, "test-agent", edit1);
    logEdit(stateDir, "test-agent", edit2);

    const logPath = join(stateDir, "textgrad", "test-agent-edits.jsonl");
    expect(existsSync(logPath)).toBe(true);

    const lines = readFileSync(logPath, "utf-8").trim().split("\n");
    expect(lines.length).toBe(2);

    const parsed1 = JSON.parse(lines[0]);
    expect(parsed1.dimension).toBe("clarity");
    expect(parsed1.iteration).toBe(1);
  });
});

// ─── Report Generation ────────────────────────────────

describe("TextGrad: Report Generation", () => {
  let stateDir: string;

  beforeEach(() => {
    stateDir = makeTempDir();
  });

  afterEach(() => {
    try { rmSync(stateDir, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  test("generateReport produces correct summary", () => {
    const state: TextGradState = {
      target: "code-reviewer",
      targetPath: "/tmp/test.md",
      startedAt: new Date(Date.now() - 30000).toISOString(), // 30s ago
      iterations: [
        { iteration: 1, score: 7.0, previousScore: 5.0, gradients: [
          { dimension: "clarity", currentScore: 5, weakness: "Vague role", improvement: "Add specifics", evidence: "Line 3" },
        ], editsApplied: 2, converged: false, rolledBack: false },
        { iteration: 2, score: 9.1, previousScore: 7.0, gradients: [], editsApplied: 1, converged: true, rolledBack: false },
      ],
      currentScore: 9.1,
      bestScore: 9.1,
      status: "converged",
      originalContent: "# Test",
    };

    const report = generateReport(state);
    expect(report.target).toBe("code-reviewer");
    expect(report.iterations).toBe(2);
    expect(report.startScore).toBe(5.0);
    expect(report.finalScore).toBe(9.1);
    expect(report.delta).toBeCloseTo(4.1, 1);
    expect(report.status).toBe("converged");
    expect(report.editsApplied).toBe(3);
    expect(report.gradients.length).toBe(1);
  });

  test("writeReport creates markdown file", () => {
    const report = {
      target: "test-agent",
      iterations: 2,
      startScore: 5.0,
      finalScore: 9.0,
      delta: 4.0,
      status: "converged",
      dimensions: [],
      gradients: [
        { dimension: "clarity", currentScore: 5, weakness: "Vague", improvement: "Be specific", evidence: "Line 10" },
      ],
      editsApplied: 3,
      duration: "30.0s",
    };

    writeReport(stateDir, "test-agent", report);

    const reportPath = join(stateDir, "textgrad", "test-agent-report.md");
    expect(existsSync(reportPath)).toBe(true);

    const content = readFileSync(reportPath, "utf-8");
    expect(content).toContain("# TextGrad Report: test-agent");
    expect(content).toContain("converged");
    expect(content).toContain("clarity");
  });
});
