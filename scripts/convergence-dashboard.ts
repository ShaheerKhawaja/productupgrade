#!/usr/bin/env bun
/**
 * convergence-dashboard.ts — Terminal ASCII dashboard for ProductionOS.
 *
 * Two display modes:
 *   Mode 1: Single-run convergence trajectory (iteration table + dimension bars)
 *   Mode 2: Multi-run history summary
 *
 * Zero external dependencies. Box-drawing characters throughout.
 *
 * Usage:
 *   bun run scripts/convergence-dashboard.ts --demo
 */

import type {
  IterationResult,
  DimensionScore,
  VelocityMetrics,
  ConvergenceDecision,
} from "./convergence";
import { analyzeConvergence, EMAVelocityTracker, overallGrade } from "./convergence";

// ─── Types ────────────────────────────────────────────────────

export interface RunSummary {
  date: string;
  command: string;
  grade: number;
  costUsd: number;
  durationMin: number;
  status: "OK" | "FAIL" | "ABORT";
}

interface TrajectoryRow {
  iteration: number;
  grade: number;
  delta: number | null;
  velocity: number | null;
  eta: number | null;
  decision: ConvergenceDecision;
}

// ─── Helpers ──────────────────────────────────────────────────

function pad(s: string, w: number, align: "l" | "r" | "c" = "l"): string {
  if (s.length >= w) return s.slice(0, w);
  const gap = w - s.length;
  if (align === "r") return " ".repeat(gap) + s;
  if (align === "c") return " ".repeat(Math.floor(gap / 2)) + s + " ".repeat(Math.ceil(gap / 2));
  return s + " ".repeat(gap);
}

function fmtNum(n: number | null, decimals: number = 1): string {
  if (n === null) return "---";
  if (!Number.isFinite(n)) return "---";
  return n.toFixed(decimals);
}

function fmtDelta(n: number | null): string {
  if (n === null) return "---";
  if (!Number.isFinite(n)) return "---";
  return (n >= 0 ? "+" : "") + n.toFixed(1);
}

function fmtEta(n: number | null): string {
  if (n === null || !Number.isFinite(n) || n > 99) return "---";
  return `~${Math.ceil(n)} its`;
}

function progressBar(score: number, width: number = 12): string {
  const filled = Math.round((score / 10) * width);
  return "\u2588".repeat(filled) + "\u2591".repeat(width - filled);
}

// ─── Mode 1: Single-Run Trajectory ───────────────────────────

export function renderTrajectory(history: IterationResult[]): string {
  const lines: string[] = [];
  const W = 60;

  // Build trajectory rows
  const tracker = new EMAVelocityTracker();
  const rows: TrajectoryRow[] = [];

  for (let i = 0; i < history.length; i++) {
    const grade = overallGrade(history[i].dimensions);
    const slice = history.slice(0, i + 1);
    const { convergence } = analyzeConvergence(slice);

    let velocity: number | null = null;
    let eta: number | null = null;

    if (i > 0) {
      const prevGrade = overallGrade(history[i - 1].dimensions);
      const m = tracker.update(grade, prevGrade);
      velocity = m.emaVelocity;
      eta = m.timeToTarget;
    }

    rows.push({
      iteration: history[i].iteration,
      grade,
      delta: i > 0 ? grade - overallGrade(history[i - 1].dimensions) : null,
      velocity,
      eta,
      decision: convergence.decision,
    });
  }

  // Header
  lines.push(`\u2554\u2550\u2550 ProductionOS Convergence Dashboard ${"".padEnd(W - 37, "\u2550")}\u2557`);
  lines.push(
    `\u2551 ${pad("Iter", 4, "c")} \u2502 ${pad("Grade", 5, "c")} \u2502 ${pad("Delta", 5, "c")} \u2502 ${pad("Velocity", 8, "c")} \u2502 ${pad("ETA", 6, "c")} \u2502 ${pad("Decision", 11, "c")} \u2551`,
  );
  lines.push(
    `\u2560${"".padEnd(6, "\u2550")}\u256A${"".padEnd(7, "\u2550")}\u256A${"".padEnd(7, "\u2550")}\u256A${"".padEnd(10, "\u2550")}\u256A${"".padEnd(8, "\u2550")}\u256A${"".padEnd(13, "\u2550")}\u2563`,
  );

  // Data rows
  for (const r of rows) {
    const iter = pad(String(r.iteration), 4, "c");
    const grade = pad(fmtNum(r.grade), 5, "r");
    const delta = pad(fmtDelta(r.delta), 5, "r");
    const vel = pad(r.velocity !== null ? `${fmtNum(r.velocity)}/i` : "---", 8, "r");
    const eta = pad(fmtEta(r.eta), 6, "r");
    const dec = pad(r.decision, 11);
    lines.push(`\u2551 ${iter} \u2502 ${grade} \u2502 ${delta} \u2502 ${vel} \u2502 ${eta} \u2502 ${dec} \u2551`);
  }

  lines.push(
    `\u255A${"".padEnd(6, "\u2550")}\u2567${"".padEnd(7, "\u2550")}\u2567${"".padEnd(7, "\u2550")}\u2567${"".padEnd(10, "\u2550")}\u2567${"".padEnd(8, "\u2550")}\u2567${"".padEnd(13, "\u2550")}\u255D`,
  );

  // Dimension breakdown (latest iteration)
  if (history.length >= 1) {
    const latest = history[history.length - 1];
    const prev = history.length >= 2 ? history[history.length - 2] : null;

    lines.push("");
    lines.push("Dimension Breakdown:");

    for (const dim of latest.dimensions) {
      const prevDim = prev?.dimensions.find((d) => d.name === dim.name);
      const delta = prevDim ? dim.score - prevDim.score : 0;
      const deltaStr =
        delta > 0 ? `(+${delta.toFixed(1)})` : delta < 0 ? `(${delta.toFixed(1)})` : "(\u2014)";
      const label = dim.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      lines.push(
        `  ${pad(label + ":", 22)}${progressBar(dim.score)} ${pad(fmtNum(dim.score), 4, "r")}  ${deltaStr}`,
      );
    }
  }

  return lines.join("\n");
}

// ─── Mode 2: Multi-Run Summary ───────────────────────────────

export function renderRunHistory(runs: RunSummary[]): string {
  const lines: string[] = [];

  lines.push(
    `\u2554\u2550\u2550 Run History ${"".padEnd(48, "\u2550")}\u2557`,
  );
  lines.push(
    `\u2551 ${pad("Date", 10)} \u2502 ${pad("Command", 20)} \u2502 ${pad("Grade", 5, "c")} \u2502 ${pad("Cost", 6, "c")} \u2502 ${pad("Time", 5, "c")} \u2551`,
  );
  lines.push(
    `\u2560${"".padEnd(12, "\u2550")}\u256A${"".padEnd(22, "\u2550")}\u256A${"".padEnd(7, "\u2550")}\u256A${"".padEnd(8, "\u2550")}\u256A${"".padEnd(7, "\u2550")}\u2563`,
  );

  for (const r of runs) {
    const date = pad(r.date, 10);
    const cmd = pad(r.command, 20);
    const grade = pad(fmtNum(r.grade), 5, "r");
    const cost = pad(`$${r.costUsd.toFixed(2)}`, 6, "r");
    const time = pad(`${r.durationMin}m`, 5, "r");
    lines.push(`\u2551 ${date} \u2502 ${cmd} \u2502 ${grade} \u2502 ${cost} \u2502 ${time} \u2551`);
  }

  lines.push(
    `\u255A${"".padEnd(12, "\u2550")}\u2567${"".padEnd(22, "\u2550")}\u2567${"".padEnd(7, "\u2550")}\u2567${"".padEnd(8, "\u2550")}\u2567${"".padEnd(7, "\u2550")}\u255D`,
  );

  // Totals
  if (runs.length > 0) {
    const avgGrade = runs.reduce((s, r) => s + r.grade, 0) / runs.length;
    const totalCost = runs.reduce((s, r) => s + r.costUsd, 0);
    lines.push(
      `  Runs: ${runs.length} | Avg grade: ${avgGrade.toFixed(1)} | Total cost: $${totalCost.toFixed(2)}`,
    );
  }

  return lines.join("\n");
}

// ─── Demo Data ────────────────────────────────────────────────

function buildDemoHistory(): IterationResult[] {
  const dims = ["code_quality", "security", "performance", "ux_ui", "test_coverage", "observability"];
  const progression = [
    [3.5, 3.0, 4.0, 3.0, 2.5, 2.0],
    [5.5, 4.5, 5.0, 4.5, 4.0, 3.5],
    [6.5, 6.0, 5.5, 5.5, 5.5, 5.0],
    [7.5, 7.0, 6.5, 6.5, 6.0, 5.5],
    [8.0, 7.5, 7.0, 7.0, 6.5, 6.5],
    [8.2, 7.8, 7.2, 7.2, 6.8, 7.0],
  ];

  return progression.map((scores, i) => ({
    iteration: i,
    dimensions: scores.map((score, j) => ({ name: dims[j], score })),
    timestamp: new Date(Date.now() - (progression.length - i) * 60_000).toISOString(),
  }));
}

function buildDemoRuns(): RunSummary[] {
  return [
    { date: "2026-03-19", command: "/production-upgrade", grade: 7.5, costUsd: 1.40, durationMin: 12, status: "OK" },
    { date: "2026-03-19", command: "/auto-swarm", grade: 7.8, costUsd: 2.10, durationMin: 18, status: "OK" },
    { date: "2026-03-18", command: "/omni-plan", grade: 8.1, costUsd: 3.20, durationMin: 45, status: "OK" },
    { date: "2026-03-17", command: "/production-upgrade", grade: 6.2, costUsd: 0.90, durationMin: 8, status: "OK" },
    { date: "2026-03-17", command: "/security-audit", grade: 8.5, costUsd: 0.60, durationMin: 4, status: "OK" },
  ];
}

// ─── CLI Runner ───────────────────────────────────────────────

if (process.argv.includes("--demo")) {
  console.log(renderTrajectory(buildDemoHistory()));
  console.log("");
  console.log(renderRunHistory(buildDemoRuns()));
}
