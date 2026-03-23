/**
 * Wave State Machine — durable state tracking for parallel agent waves.
 * Survives context compaction, session boundaries, and crashes.
 *
 * Addresses: State GAP-01 (no formal state machine), GAP-05 (context compaction
 * loses agent handles), GAP-17 (no WAL — can't distinguish clean exit from crash).
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync, unlinkSync } from "fs";
import { join, dirname } from "path";

// ─── Types ─────────────────────────────────────────────────

export type WavePhase =
  | "INIT"
  | "OWNERSHIP_COMPUTED"
  | "SCOPES_DISTRIBUTED"
  | "AGENTS_DISPATCHED"
  | "AGENTS_RUNNING"
  | "AGENTS_COMPLETE"
  | "INTEGRATION_RUNNING"
  | "INTEGRATION_COMPLETE"
  | "MERGE_PHASE"
  | "MERGE_COMPLETE"
  | "DONE"
  | "FAILED"
  | "ABORTED";

export type AgentStatus = "pending" | "dispatched" | "running" | "complete" | "failed" | "timeout";

export interface AgentRecord {
  agentId: string;
  branch: string;
  status: AgentStatus;
  dispatchedAt?: string;
  completedAt?: string;
  error?: string;
  scopeFiles?: string[];
}

export interface MergeCheckpoint {
  branch: string;
  sha: string;
  status: "merged" | "failed" | "pending";
}

export interface IntegrationResult {
  file: string;
  status: "applied" | "rejected";
  reason?: string;
}

export interface WaveState {
  waveNumber: number;
  waveId: string;
  phase: WavePhase;
  phaseStartedAt: string;
  agents: AgentRecord[];
  lastCheckpoint: string;
  preWaveCheckpoint?: string;
  mergeCheckpoints: MergeCheckpoint[];
  integrationResults?: IntegrationResult[];
  error?: string;
  createdAt: string;
}

// ─── Constants ─────────────────────────────────────────────

const STATE_FILE = "wave-state.json";

const TERMINAL_PHASES: WavePhase[] = ["DONE", "FAILED", "ABORTED"];

/** Legal phase transitions (from → to[]) */
const LEGAL_TRANSITIONS: Record<WavePhase, WavePhase[]> = {
  INIT: ["OWNERSHIP_COMPUTED", "FAILED", "ABORTED"],
  OWNERSHIP_COMPUTED: ["SCOPES_DISTRIBUTED", "FAILED", "ABORTED"],
  SCOPES_DISTRIBUTED: ["AGENTS_DISPATCHED", "FAILED", "ABORTED"],
  AGENTS_DISPATCHED: ["AGENTS_RUNNING", "FAILED", "ABORTED"],
  AGENTS_RUNNING: ["AGENTS_COMPLETE", "FAILED", "ABORTED"],
  AGENTS_COMPLETE: ["INTEGRATION_RUNNING", "MERGE_PHASE", "FAILED", "ABORTED"],
  INTEGRATION_RUNNING: ["INTEGRATION_COMPLETE", "FAILED", "ABORTED"],
  INTEGRATION_COMPLETE: ["MERGE_PHASE", "FAILED", "ABORTED"],
  MERGE_PHASE: ["MERGE_COMPLETE", "FAILED", "ABORTED"],
  MERGE_COMPLETE: ["DONE", "FAILED", "ABORTED"],
  DONE: [],
  FAILED: [],
  ABORTED: [],
};

// ─── Atomic Write ──────────────────────────────────────────

function atomicWrite(filePath: string, data: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  const tmp = filePath + ".tmp." + process.pid;
  writeFileSync(tmp, data);
  try {
    renameSync(tmp, filePath);
  } catch {
    writeFileSync(filePath, data);
    try { unlinkSync(tmp); } catch { /* ignore */ }
  }
}

function statePath(stateDir: string): string {
  return join(stateDir, STATE_FILE);
}

// ─── Core Functions ────────────────────────────────────────

/**
 * Create a new wave state in INIT phase.
 */
export function createWaveState(waveNumber: number, agentCount: number, stateDir: string): WaveState {
  const now = new Date().toISOString();
  const state: WaveState = {
    waveNumber,
    waveId: `wave-${waveNumber}`,
    phase: "INIT",
    phaseStartedAt: now,
    agents: Array.from({ length: agentCount }, (_, i) => ({
      agentId: `agent-${i + 1}`,
      branch: `swarm/${`wave-${waveNumber}`}-agent-${i + 1}`,
      status: "pending" as AgentStatus,
    })),
    lastCheckpoint: now,
    mergeCheckpoints: [],
    createdAt: now,
  };

  atomicWrite(statePath(stateDir), JSON.stringify(state, null, 2));
  return state;
}

/**
 * Transition to a new phase. Validates the transition is legal.
 * Throws if the transition is invalid.
 */
export function transitionPhase(stateDir: string, newPhase: WavePhase, updates?: Partial<WaveState>): WaveState {
  const state = loadWaveState(stateDir);
  if (!state) throw new Error("No wave state found");

  const allowed = LEGAL_TRANSITIONS[state.phase];
  if (!allowed || !allowed.includes(newPhase)) {
    throw new Error(`Illegal transition: ${state.phase} → ${newPhase}. Allowed: ${(allowed || []).join(", ")}`);
  }

  const now = new Date().toISOString();
  state.phase = newPhase;
  state.phaseStartedAt = now;
  state.lastCheckpoint = now;

  if (updates) {
    if (updates.preWaveCheckpoint !== undefined) state.preWaveCheckpoint = updates.preWaveCheckpoint;
    if (updates.error !== undefined) state.error = updates.error;
    if (updates.integrationResults !== undefined) state.integrationResults = updates.integrationResults;
  }

  atomicWrite(statePath(stateDir), JSON.stringify(state, null, 2));
  return state;
}

/**
 * Update an agent's record within the wave state.
 */
export function updateAgent(stateDir: string, agentId: string, update: Partial<AgentRecord>): WaveState {
  const state = loadWaveState(stateDir);
  if (!state) throw new Error("No wave state found");

  const agent = state.agents.find(a => a.agentId === agentId);
  if (!agent) throw new Error(`Agent not found: ${agentId}`);

  if (update.status !== undefined) agent.status = update.status;
  if (update.dispatchedAt !== undefined) agent.dispatchedAt = update.dispatchedAt;
  if (update.completedAt !== undefined) agent.completedAt = update.completedAt;
  if (update.error !== undefined) agent.error = update.error;
  if (update.scopeFiles !== undefined) agent.scopeFiles = update.scopeFiles;
  if (update.branch !== undefined) agent.branch = update.branch;

  state.lastCheckpoint = new Date().toISOString();
  atomicWrite(statePath(stateDir), JSON.stringify(state, null, 2));
  return state;
}

/**
 * Load wave state from disk. Returns null if missing or corrupt.
 */
export function loadWaveState(stateDir: string): WaveState | null {
  const path = statePath(stateDir);
  if (!existsSync(path)) return null;
  try {
    const content = readFileSync(path, "utf-8");
    const parsed = JSON.parse(content);
    if (!parsed.waveId || !parsed.phase) return null;
    return parsed as WaveState;
  } catch {
    return null;
  }
}

/**
 * Check if there's an active (non-terminal) wave.
 */
export function isWaveInProgress(stateDir: string): boolean {
  const state = loadWaveState(stateDir);
  if (!state) return false;
  return !TERMINAL_PHASES.includes(state.phase);
}

/**
 * Add a merge checkpoint for cumulative rollback tracking.
 */
export function addMergeCheckpoint(stateDir: string, branch: string, sha: string, status: MergeCheckpoint["status"]): void {
  const state = loadWaveState(stateDir);
  if (!state) throw new Error("No wave state found");

  state.mergeCheckpoints.push({ branch, sha, status });
  state.lastCheckpoint = new Date().toISOString();
  atomicWrite(statePath(stateDir), JSON.stringify(state, null, 2));
}

/**
 * Get recovery info — summarizes what's left to do after a crash/compaction.
 */
export function getRecoveryInfo(stateDir: string): {
  phase: WavePhase;
  waveId: string;
  pendingAgents: string[];
  failedAgents: string[];
  completedAgents: string[];
  runningAgents: string[];
} | null {
  const state = loadWaveState(stateDir);
  if (!state) return null;
  if (TERMINAL_PHASES.includes(state.phase)) return null;

  return {
    phase: state.phase,
    waveId: state.waveId,
    pendingAgents: state.agents.filter(a => a.status === "pending").map(a => a.agentId),
    failedAgents: state.agents.filter(a => a.status === "failed" || a.status === "timeout").map(a => a.agentId),
    completedAgents: state.agents.filter(a => a.status === "complete").map(a => a.agentId),
    runningAgents: state.agents.filter(a => a.status === "dispatched" || a.status === "running").map(a => a.agentId),
  };
}
