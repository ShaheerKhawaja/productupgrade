/**
 * TextGrad Core — textual gradient descent for prompt optimization.
 *
 * Implements the TextGrad concept: evaluate prompt → compute textual gradient
 * → apply gradient → re-evaluate → converge.
 *
 * This module provides the data structures and pure functions.
 * The actual LLM-based evaluation and gradient computation happens in the
 * textgrad-optimizer agent — this library handles state management.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } from "fs";
import { join } from "path";

// ─── Types ─────────────────────────────────────────────

export interface TextGradDimension {
  name: string;
  weight: number;
  score: number;
  maxScore: number;
}

export interface TextGradGradient {
  dimension: string;
  currentScore: number;
  weakness: string;
  improvement: string;
  evidence: string;
}

export interface TextGradEdit {
  dimension: string;
  before: string;
  after: string;
  gradient: string;
  iteration: number;
  timestamp: string;
}

export interface TextGradIteration {
  iteration: number;
  score: number;
  previousScore: number;
  gradients: TextGradGradient[];
  editsApplied: number;
  converged: boolean;
  rolledBack: boolean;
}

export interface TextGradState {
  target: string;
  targetPath: string;
  startedAt: string;
  iterations: TextGradIteration[];
  currentScore: number;
  bestScore: number;
  status: "running" | "converged" | "rolled_back" | "max_iterations" | "no_improvement";
  originalContent: string;
}

export interface TextGradReport {
  target: string;
  iterations: number;
  startScore: number;
  finalScore: number;
  delta: number;
  status: string;
  dimensions: TextGradDimension[];
  gradients: TextGradGradient[];
  editsApplied: number;
  duration: string;
}

// ─── Constants ─────────────────────────────────────────

const MAX_ITERATIONS = 5;
const CONVERGENCE_THRESHOLD = 9.0;
const MIN_IMPROVEMENT = 0.1;

export const DEFAULT_DIMENSIONS: Omit<TextGradDimension, "score">[] = [
  { name: "clarity", weight: 0.20, maxScore: 10 },
  { name: "completeness", weight: 0.20, maxScore: 10 },
  { name: "specificity", weight: 0.15, maxScore: 10 },
  { name: "constraint_quality", weight: 0.15, maxScore: 10 },
  { name: "efficiency", weight: 0.10, maxScore: 10 },
  { name: "grounding", weight: 0.10, maxScore: 10 },
  { name: "safety", weight: 0.10, maxScore: 10 },
];

// ─── State Management ──────────────────────────────────

/**
 * Initialize a TextGrad optimization session.
 * Saves the original content for rollback.
 */
export function initSession(target: string, targetPath: string, stateDir: string): TextGradState {
  const content = readFileSync(targetPath, "utf-8");
  const state: TextGradState = {
    target,
    targetPath,
    startedAt: new Date().toISOString(),
    iterations: [],
    currentScore: 0,
    bestScore: 0,
    status: "running",
    originalContent: content,
  };

  // Save original for rollback
  const tgDir = join(stateDir, "textgrad");
  mkdirSync(tgDir, { recursive: true });
  writeFileSync(join(tgDir, `${target}-before.md`), content);

  return state;
}

/**
 * Compute weighted score from dimension scores.
 */
export function computeWeightedScore(dimensions: TextGradDimension[]): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const dim of dimensions) {
    weightedSum += dim.score * dim.weight;
    totalWeight += dim.weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Identify dimensions that need gradients (score below threshold).
 */
export function identifyWeakDimensions(dimensions: TextGradDimension[], threshold: number = 8.0): TextGradDimension[] {
  return dimensions.filter(d => d.score < threshold).sort((a, b) => a.score - b.score);
}

/**
 * Record an iteration result.
 */
export function recordIteration(
  state: TextGradState,
  score: number,
  gradients: TextGradGradient[],
  editsApplied: number,
): TextGradState {
  const iteration: TextGradIteration = {
    iteration: state.iterations.length + 1,
    score,
    previousScore: state.currentScore,
    gradients,
    editsApplied,
    converged: score >= CONVERGENCE_THRESHOLD,
    rolledBack: false,
  };

  state.iterations.push(iteration);
  state.currentScore = score;

  if (score > state.bestScore) {
    state.bestScore = score;
  }

  // Determine status
  if (score >= CONVERGENCE_THRESHOLD) {
    state.status = "converged";
  } else if (state.iterations.length >= MAX_ITERATIONS) {
    state.status = "max_iterations";
  } else if (score < state.currentScore - MIN_IMPROVEMENT) {
    state.status = "rolled_back";
    iteration.rolledBack = true;
  } else if (state.iterations.length >= 3) {
    // Check for stall: 3 consecutive iterations with < MIN_IMPROVEMENT gain
    const recent = state.iterations.slice(-3);
    const allStalled = recent.every((it, i) => {
      if (i === 0) return true;
      return Math.abs(it.score - recent[i - 1].score) < MIN_IMPROVEMENT;
    });
    if (allStalled) {
      state.status = "no_improvement";
    }
  }

  return state;
}

/**
 * Log an edit to the JSONL edit log.
 */
export function logEdit(stateDir: string, target: string, edit: TextGradEdit): void {
  const tgDir = join(stateDir, "textgrad");
  mkdirSync(tgDir, { recursive: true });
  const logPath = join(tgDir, `${target}-edits.jsonl`);
  appendFileSync(logPath, JSON.stringify(edit) + "\n");
}

/**
 * Check if optimization should continue.
 */
export function shouldContinue(state: TextGradState): boolean {
  return state.status === "running";
}

/**
 * Get rollback content (original prompt before optimization).
 */
export function getRollbackContent(stateDir: string, target: string): string | null {
  const backupPath = join(stateDir, "textgrad", `${target}-before.md`);
  if (!existsSync(backupPath)) return null;
  return readFileSync(backupPath, "utf-8");
}

/**
 * Generate a convergence report.
 */
export function generateReport(state: TextGradState): TextGradReport {
  const startScore = state.iterations.length > 0
    ? state.iterations[0].previousScore
    : 0;

  const totalEdits = state.iterations.reduce((sum, it) => sum + it.editsApplied, 0);
  const allGradients = state.iterations.flatMap(it => it.gradients);

  const endTime = new Date();
  const startTime = new Date(state.startedAt);
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationStr = durationMs < 60000
    ? `${(durationMs / 1000).toFixed(1)}s`
    : `${Math.floor(durationMs / 60000)}m ${((durationMs % 60000) / 1000).toFixed(0)}s`;

  return {
    target: state.target,
    iterations: state.iterations.length,
    startScore,
    finalScore: state.currentScore,
    delta: state.currentScore - startScore,
    status: state.status,
    dimensions: [], // Filled by the agent with current scores
    gradients: allGradients,
    editsApplied: totalEdits,
    duration: durationStr,
  };
}

/**
 * Write report to disk.
 */
export function writeReport(stateDir: string, target: string, report: TextGradReport): void {
  const tgDir = join(stateDir, "textgrad");
  mkdirSync(tgDir, { recursive: true });

  const lines = [
    `# TextGrad Report: ${report.target}`,
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Iterations | ${report.iterations} |`,
    `| Start Score | ${report.startScore.toFixed(1)} |`,
    `| Final Score | ${report.finalScore.toFixed(1)} |`,
    `| Delta | ${report.delta >= 0 ? "+" : ""}${report.delta.toFixed(1)} |`,
    `| Status | ${report.status} |`,
    `| Edits Applied | ${report.editsApplied} |`,
    `| Duration | ${report.duration} |`,
    "",
    "## Gradients Applied",
    "",
  ];

  for (const g of report.gradients) {
    lines.push(`### ${g.dimension} (${g.currentScore}/10)`);
    lines.push(`- **Weakness:** ${g.weakness}`);
    lines.push(`- **Improvement:** ${g.improvement}`);
    lines.push("");
  }

  writeFileSync(join(tgDir, `${target}-report.md`), lines.join("\n"));
}
