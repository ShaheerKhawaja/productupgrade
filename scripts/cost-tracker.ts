#!/usr/bin/env bun
/**
 * cost-tracker.ts — Run lifecycle tracking for ProductionOS.
 *
 * Tracks every command invocation: timing, agents dispatched, files modified,
 * tests run, convergence state, and estimated token/cost data.
 * Append-only JSON storage in ~/.productionos/runs/.
 *
 * Zero external dependencies. TypeScript strict mode.
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// ─── Interfaces ────────────────────────────────────────────────

export interface AgentRecord {
  name: string;
  startTime: string;
  endTime: string | null;
  durationMs: number | null;
  estimatedTokens: number;
  estimatedCostUSD: number;
  retries: number;
  status: "running" | "completed" | "failed" | "timeout";
  filesModified: number;
}

export interface RunRecord {
  id: string;
  command: string;
  startTime: string;
  endTime: string | null;
  durationMs: number | null;
  agentsDispatched: number;
  filesModified: number;
  testsRun: number;
  testsPassed: number;
  convergenceState?: string;
  estimatedTokens: number;
  estimatedCostUSD: number;
  agents?: AgentRecord[];
}

// ─── Constants ─────────────────────────────────────────────────

const RUNS_DIR = join(
  process.env["HOME"] ?? process.env["USERPROFILE"] ?? homedir(),
  ".productionos",
  "runs"
);

// ─── Helpers ───────────────────────────────────────────────────

function ensureRunsDir(): void {
  if (!existsSync(RUNS_DIR)) {
    mkdirSync(RUNS_DIR, { recursive: true });
  }
}

function runFilePath(id: string): string {
  return join(RUNS_DIR, `${id}.json`);
}

function generateId(command: string): string {
  const now = new Date();
  const pad = (n: number, w: number = 2): string => String(n).padStart(w, "0");
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${date}T${time}-${command}`;
}

function writeRun(run: RunRecord): void {
  ensureRunsDir();
  writeFileSync(runFilePath(run.id), JSON.stringify(run, null, 2), "utf-8");
}

function readRun(filePath: string): RunRecord | null {
  try {
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as RunRecord;
  } catch {
    return null;
  }
}

// ─── Core Functions ────────────────────────────────────────────

/** Start a new tracked run. Creates a JSON file immediately with null endTime. */
export function startRun(command: string): RunRecord {
  const run: RunRecord = {
    id: generateId(command),
    command,
    startTime: new Date().toISOString(),
    endTime: null,
    durationMs: null,
    agentsDispatched: 0,
    filesModified: 0,
    testsRun: 0,
    testsPassed: 0,
    estimatedTokens: 0,
    estimatedCostUSD: 0,
  };
  writeRun(run);
  return run;
}

/** End a run. Merges partial results, computes duration, writes final state. */
export function endRun(run: RunRecord, results: Partial<RunRecord>): void {
  const now = new Date();
  const startMs = new Date(run.startTime).getTime();
  const merged: RunRecord = {
    ...run,
    ...results,
    id: run.id,
    command: run.command,
    startTime: run.startTime,
    endTime: now.toISOString(),
    durationMs: now.getTime() - startMs,
  };
  writeRun(merged);
}

/** Record an agent start within an active run. */
export function recordAgentStart(run: RunRecord, agentName: string): RunRecord {
  const agent: AgentRecord = {
    name: agentName,
    startTime: new Date().toISOString(),
    endTime: null,
    durationMs: null,
    estimatedTokens: 0,
    estimatedCostUSD: 0,
    retries: 0,
    status: "running",
    filesModified: 0,
  };
  run.agents = run.agents ?? [];
  run.agents.push(agent);
  run.agentsDispatched = run.agents.length;
  writeRun(run);
  return run;
}

/** Record an agent completion within an active run. */
export function recordAgentEnd(
  run: RunRecord,
  agentName: string,
  results: Partial<AgentRecord>
): RunRecord {
  run.agents = run.agents ?? [];
  const agent = run.agents.find((a) => a.name === agentName && a.status === "running");
  if (agent) {
    const now = new Date();
    agent.endTime = now.toISOString();
    agent.durationMs = now.getTime() - new Date(agent.startTime).getTime();
    agent.status = results.status ?? "completed";
    agent.estimatedTokens = results.estimatedTokens ?? 0;
    agent.estimatedCostUSD = results.estimatedCostUSD ?? 0;
    agent.retries = results.retries ?? 0;
    agent.filesModified = results.filesModified ?? 0;
  }
  // Roll up agent costs to run level
  run.estimatedTokens = run.agents.reduce((s, a) => s + a.estimatedTokens, 0);
  run.estimatedCostUSD = run.agents.reduce((s, a) => s + a.estimatedCostUSD, 0);
  writeRun(run);
  return run;
}

/** Format per-agent breakdown for a run. */
export function formatAgentBreakdown(run: RunRecord): string {
  if (!run.agents || run.agents.length === 0) return "No agent data recorded.";

  const header = [
    "Agent".padEnd(30),
    "Status".padEnd(10),
    "Duration".padStart(10),
    "Tokens".padStart(10),
    "Cost".padStart(8),
    "Retries".padStart(8),
  ].join(" | ");

  const sep = "-".repeat(header.length);

  const rows = run.agents.map((a) => {
    const dur = a.durationMs != null ? `${(a.durationMs / 1000).toFixed(1)}s` : "running";
    const tokens = a.estimatedTokens > 0 ? a.estimatedTokens.toLocaleString() : "-";
    const cost = a.estimatedCostUSD > 0 ? `$${a.estimatedCostUSD.toFixed(2)}` : "-";
    return [
      a.name.padEnd(30),
      a.status.padEnd(10),
      dur.padStart(10),
      tokens.padStart(10),
      cost.padStart(8),
      String(a.retries).padStart(8),
    ].join(" | ");
  });

  return [sep, header, sep, ...rows, sep].join("\n");
}

/** Read all run files, optionally filtered to the last N days. */
export function getRunHistory(days?: number): RunRecord[] {
  ensureRunsDir();
  const files = readdirSync(RUNS_DIR).filter((f) => f.endsWith(".json")).sort();
  const runs: RunRecord[] = [];

  const cutoff = days != null ? Date.now() - days * 86_400_000 : 0;

  for (const file of files) {
    const run = readRun(join(RUNS_DIR, file));
    if (!run) continue;
    if (cutoff > 0 && new Date(run.startTime).getTime() < cutoff) continue;
    runs.push(run);
  }

  return runs;
}

/** Format an array of RunRecords as an ASCII table summary. */
export function formatRunSummary(runs: RunRecord[]): string {
  if (runs.length === 0) return "No runs recorded yet.";

  const header = [
    "ID".padEnd(32),
    "Command".padEnd(20),
    "Duration".padStart(10),
    "Agents".padStart(7),
    "Files".padStart(6),
    "Tests".padStart(10),
    "Tokens".padStart(10),
    "Cost".padStart(8),
  ].join(" | ");

  const separator = "-".repeat(header.length);

  const rows = runs.map((r) => {
    const dur = r.durationMs != null ? `${(r.durationMs / 1000).toFixed(1)}s` : "running";
    const tests = r.testsRun > 0 ? `${r.testsPassed}/${r.testsRun}` : "-";
    const tokens = r.estimatedTokens > 0 ? r.estimatedTokens.toLocaleString() : "-";
    const cost = r.estimatedCostUSD > 0 ? `$${r.estimatedCostUSD.toFixed(2)}` : "-";

    return [
      r.id.padEnd(32),
      r.command.padEnd(20),
      dur.padStart(10),
      String(r.agentsDispatched).padStart(7),
      String(r.filesModified).padStart(6),
      tests.padStart(10),
      tokens.padStart(10),
      cost.padStart(8),
    ].join(" | ");
  });

  const totalCost = runs.reduce((s, r) => s + r.estimatedCostUSD, 0);
  const totalTokens = runs.reduce((s, r) => s + r.estimatedTokens, 0);
  const footer = `Totals: ${runs.length} runs | ${totalTokens.toLocaleString()} tokens | $${totalCost.toFixed(2)}`;

  return [separator, header, separator, ...rows, separator, footer, separator].join("\n");
}

/** Find the most recent run that has no endTime (still running). */
export function findActiveRun(): RunRecord | null {
  ensureRunsDir();
  const files = readdirSync(RUNS_DIR).filter((f) => f.endsWith(".json")).sort().reverse();
  for (const file of files) {
    const run = readRun(join(RUNS_DIR, file));
    if (run && run.endTime === null) return run;
  }
  return null;
}

/** Write TOKEN-BUDGET.md with accumulated cost for cost ceiling enforcement. */
export function writeTokenBudget(run: RunRecord, targetDir: string): void {
  const budgetPath = join(targetDir, ".productionos", "TOKEN-BUDGET.md");
  const dir = join(targetDir, ".productionos");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const content = [
    "---",
    `producer: cost-tracker`,
    `timestamp: ${new Date().toISOString()}`,
    `status: complete`,
    "---",
    "",
    `# Token Budget`,
    "",
    `accumulated_cost: ${run.estimatedCostUSD.toFixed(2)}`,
    `accumulated_tokens: ${run.estimatedTokens}`,
    `agents_dispatched: ${run.agentsDispatched}`,
    `run_id: ${run.id}`,
    `command: ${run.command}`,
    "",
  ].join("\n");
  writeFileSync(budgetPath, content, "utf-8");
}

// ─── CLI Entry Point ───────────────────────────────────────────

if (import.meta.main) {
  const args = process.argv.slice(2);
  const subcmd = args[0];

  if (subcmd === "start" && args[1]) {
    const run = startRun(args[1]);
    process.stdout.write(`Run started: ${run.id}\n`);
  } else if (subcmd === "end") {
    const active = findActiveRun();
    if (active) {
      endRun(active, {});
      // Write TOKEN-BUDGET.md to CWD's .productionos/ for cost ceiling enforcement
      writeTokenBudget(active, process.cwd());
      process.stdout.write(`Run ended: ${active.id} (${active.estimatedCostUSD.toFixed(2)} USD)\n`);
    } else {
      process.stdout.write("No active run found.\n");
    }
  } else if (subcmd === "list") {
    const days = args[1] ? parseInt(args[1], 10) : undefined;
    const runs = getRunHistory(days);
    process.stdout.write(formatRunSummary(runs) + "\n");
  } else {
    process.stdout.write("Usage: cost-tracker.ts <start COMMAND | end | list [DAYS]>\n");
  }
}
