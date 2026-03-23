import { describe, test, expect } from "bun:test";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  createWaveState,
  transitionPhase,
  updateAgent,
  loadWaveState,
  isWaveInProgress,
  addMergeCheckpoint,
  getRecoveryInfo,
} from "../scripts/lib/wave-state";

// ─── Helpers ───────────────────────────────────────────────

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "pos-wave-"));
}

// ─── createWaveState ───────────────────────────────────────

describe("createWaveState", () => {
  test("produces valid initial state", () => {
    const tmp = makeTempDir();
    const state = createWaveState(1, 3, tmp);
    expect(state.waveNumber).toBe(1);
    expect(state.waveId).toBe("wave-1");
    expect(state.phase).toBe("INIT");
    expect(state.agents).toHaveLength(3);
    expect(state.agents[0]!.agentId).toBe("agent-1");
    expect(state.agents[0]!.status).toBe("pending");
    expect(state.mergeCheckpoints).toHaveLength(0);
    expect(state.createdAt).toBeTruthy();
    rmSync(tmp, { recursive: true, force: true });
  });

  test("persists to disk", () => {
    const tmp = makeTempDir();
    createWaveState(2, 5, tmp);
    const loaded = loadWaveState(tmp);
    expect(loaded).not.toBeNull();
    expect(loaded!.waveNumber).toBe(2);
    expect(loaded!.agents).toHaveLength(5);
    rmSync(tmp, { recursive: true, force: true });
  });

  test("generates correct branch names", () => {
    const tmp = makeTempDir();
    const state = createWaveState(3, 2, tmp);
    expect(state.agents[0]!.branch).toBe("swarm/wave-3-agent-1");
    expect(state.agents[1]!.branch).toBe("swarm/wave-3-agent-2");
    rmSync(tmp, { recursive: true, force: true });
  });
});

// ─── transitionPhase ───────────────────────────────────────

describe("transitionPhase", () => {
  test("updates phase correctly", () => {
    const tmp = makeTempDir();
    createWaveState(1, 1, tmp);
    const state = transitionPhase(tmp, "OWNERSHIP_COMPUTED");
    expect(state.phase).toBe("OWNERSHIP_COMPUTED");
    rmSync(tmp, { recursive: true, force: true });
  });

  test("rejects illegal transitions", () => {
    const tmp = makeTempDir();
    createWaveState(1, 1, tmp);
    expect(() => transitionPhase(tmp, "MERGE_PHASE")).toThrow("Illegal transition");
    rmSync(tmp, { recursive: true, force: true });
  });

  test("FAILED transition works from any active phase", () => {
    const tmp = makeTempDir();
    createWaveState(1, 1, tmp);
    transitionPhase(tmp, "OWNERSHIP_COMPUTED");
    transitionPhase(tmp, "SCOPES_DISTRIBUTED");
    const state = transitionPhase(tmp, "FAILED", { error: "test failure" });
    expect(state.phase).toBe("FAILED");
    expect(state.error).toBe("test failure");
    rmSync(tmp, { recursive: true, force: true });
  });

  test("ABORTED works from any active phase", () => {
    const tmp = makeTempDir();
    createWaveState(1, 1, tmp);
    const state = transitionPhase(tmp, "ABORTED");
    expect(state.phase).toBe("ABORTED");
    rmSync(tmp, { recursive: true, force: true });
  });

  test("terminal phases cannot transition further", () => {
    const tmp = makeTempDir();
    createWaveState(1, 1, tmp);
    transitionPhase(tmp, "FAILED");
    expect(() => transitionPhase(tmp, "INIT")).toThrow("Illegal transition");
    rmSync(tmp, { recursive: true, force: true });
  });

  test("multiple transitions in sequence work", () => {
    const tmp = makeTempDir();
    createWaveState(1, 1, tmp);
    transitionPhase(tmp, "OWNERSHIP_COMPUTED");
    transitionPhase(tmp, "SCOPES_DISTRIBUTED");
    transitionPhase(tmp, "AGENTS_DISPATCHED");
    transitionPhase(tmp, "AGENTS_RUNNING");
    transitionPhase(tmp, "AGENTS_COMPLETE");
    transitionPhase(tmp, "MERGE_PHASE");
    transitionPhase(tmp, "MERGE_COMPLETE");
    const state = transitionPhase(tmp, "DONE");
    expect(state.phase).toBe("DONE");
    rmSync(tmp, { recursive: true, force: true });
  });

  test("updates preWaveCheckpoint when provided", () => {
    const tmp = makeTempDir();
    createWaveState(1, 1, tmp);
    const state = transitionPhase(tmp, "OWNERSHIP_COMPUTED", { preWaveCheckpoint: "abc123" });
    expect(state.preWaveCheckpoint).toBe("abc123");
    rmSync(tmp, { recursive: true, force: true });
  });

  test("throws when no wave state exists", () => {
    const tmp = makeTempDir();
    expect(() => transitionPhase(tmp, "OWNERSHIP_COMPUTED")).toThrow("No wave state found");
    rmSync(tmp, { recursive: true, force: true });
  });
});

// ─── updateAgent ───────────────────────────────────────────

describe("updateAgent", () => {
  test("changes agent status", () => {
    const tmp = makeTempDir();
    createWaveState(1, 2, tmp);
    const state = updateAgent(tmp, "agent-1", { status: "dispatched", dispatchedAt: "2025-01-01" });
    expect(state.agents[0]!.status).toBe("dispatched");
    expect(state.agents[0]!.dispatchedAt).toBe("2025-01-01");
    rmSync(tmp, { recursive: true, force: true });
  });

  test("preserves other agents", () => {
    const tmp = makeTempDir();
    createWaveState(1, 3, tmp);
    updateAgent(tmp, "agent-2", { status: "running" });
    const state = loadWaveState(tmp)!;
    expect(state.agents[0]!.status).toBe("pending");
    expect(state.agents[1]!.status).toBe("running");
    expect(state.agents[2]!.status).toBe("pending");
    rmSync(tmp, { recursive: true, force: true });
  });

  test("throws for unknown agent", () => {
    const tmp = makeTempDir();
    createWaveState(1, 1, tmp);
    expect(() => updateAgent(tmp, "agent-99", { status: "failed" })).toThrow("Agent not found");
    rmSync(tmp, { recursive: true, force: true });
  });
});

// ─── loadWaveState ─────────────────────────────────────────

describe("loadWaveState", () => {
  test("returns null for missing file", () => {
    const tmp = makeTempDir();
    expect(loadWaveState(tmp)).toBeNull();
    rmSync(tmp, { recursive: true, force: true });
  });

  test("returns null for corrupt JSON", () => {
    const tmp = makeTempDir();
    const { writeFileSync, mkdirSync } = require("fs");
    mkdirSync(tmp, { recursive: true });
    writeFileSync(join(tmp, "wave-state.json"), "not json {{{");
    expect(loadWaveState(tmp)).toBeNull();
    rmSync(tmp, { recursive: true, force: true });
  });

  test("returns null for missing required fields", () => {
    const tmp = makeTempDir();
    const { writeFileSync } = require("fs");
    writeFileSync(join(tmp, "wave-state.json"), JSON.stringify({ foo: "bar" }));
    expect(loadWaveState(tmp)).toBeNull();
    rmSync(tmp, { recursive: true, force: true });
  });
});

// ─── isWaveInProgress ──────────────────────────────────────

describe("isWaveInProgress", () => {
  test("returns true for active phases", () => {
    const tmp = makeTempDir();
    createWaveState(1, 1, tmp);
    expect(isWaveInProgress(tmp)).toBe(true);
    rmSync(tmp, { recursive: true, force: true });
  });

  test("returns false for DONE", () => {
    const tmp = makeTempDir();
    createWaveState(1, 1, tmp);
    transitionPhase(tmp, "OWNERSHIP_COMPUTED");
    transitionPhase(tmp, "SCOPES_DISTRIBUTED");
    transitionPhase(tmp, "AGENTS_DISPATCHED");
    transitionPhase(tmp, "AGENTS_RUNNING");
    transitionPhase(tmp, "AGENTS_COMPLETE");
    transitionPhase(tmp, "MERGE_PHASE");
    transitionPhase(tmp, "MERGE_COMPLETE");
    transitionPhase(tmp, "DONE");
    expect(isWaveInProgress(tmp)).toBe(false);
    rmSync(tmp, { recursive: true, force: true });
  });

  test("returns false for FAILED", () => {
    const tmp = makeTempDir();
    createWaveState(1, 1, tmp);
    transitionPhase(tmp, "FAILED");
    expect(isWaveInProgress(tmp)).toBe(false);
    rmSync(tmp, { recursive: true, force: true });
  });

  test("returns false when no state exists", () => {
    const tmp = makeTempDir();
    expect(isWaveInProgress(tmp)).toBe(false);
    rmSync(tmp, { recursive: true, force: true });
  });
});

// ─── addMergeCheckpoint ────────────────────────────────────

describe("addMergeCheckpoint", () => {
  test("adds entries", () => {
    const tmp = makeTempDir();
    createWaveState(1, 1, tmp);
    addMergeCheckpoint(tmp, "swarm/wave-1-agent-1", "abc123", "merged");
    const state = loadWaveState(tmp)!;
    expect(state.mergeCheckpoints).toHaveLength(1);
    expect(state.mergeCheckpoints[0]!.branch).toBe("swarm/wave-1-agent-1");
    expect(state.mergeCheckpoints[0]!.sha).toBe("abc123");
    expect(state.mergeCheckpoints[0]!.status).toBe("merged");
    rmSync(tmp, { recursive: true, force: true });
  });

  test("accumulates multiple checkpoints", () => {
    const tmp = makeTempDir();
    createWaveState(1, 3, tmp);
    addMergeCheckpoint(tmp, "branch-1", "aaa", "merged");
    addMergeCheckpoint(tmp, "branch-2", "bbb", "merged");
    addMergeCheckpoint(tmp, "branch-3", "ccc", "failed");
    const state = loadWaveState(tmp)!;
    expect(state.mergeCheckpoints).toHaveLength(3);
    expect(state.mergeCheckpoints[2]!.status).toBe("failed");
    rmSync(tmp, { recursive: true, force: true });
  });
});

// ─── getRecoveryInfo ───────────────────────────────────────

describe("getRecoveryInfo", () => {
  test("returns null when no state", () => {
    const tmp = makeTempDir();
    expect(getRecoveryInfo(tmp)).toBeNull();
    rmSync(tmp, { recursive: true, force: true });
  });

  test("returns null for terminal phases", () => {
    const tmp = makeTempDir();
    createWaveState(1, 1, tmp);
    transitionPhase(tmp, "FAILED");
    expect(getRecoveryInfo(tmp)).toBeNull();
    rmSync(tmp, { recursive: true, force: true });
  });

  test("summarizes pending/running/complete/failed agents", () => {
    const tmp = makeTempDir();
    createWaveState(1, 4, tmp);
    updateAgent(tmp, "agent-1", { status: "complete" });
    updateAgent(tmp, "agent-2", { status: "running" });
    updateAgent(tmp, "agent-3", { status: "failed", error: "timeout" });
    // agent-4 stays pending
    const info = getRecoveryInfo(tmp)!;
    expect(info.completedAgents).toContain("agent-1");
    expect(info.runningAgents).toContain("agent-2");
    expect(info.failedAgents).toContain("agent-3");
    expect(info.pendingAgents).toContain("agent-4");
    rmSync(tmp, { recursive: true, force: true });
  });

  test("includes wave phase and ID", () => {
    const tmp = makeTempDir();
    createWaveState(5, 1, tmp);
    transitionPhase(tmp, "OWNERSHIP_COMPUTED");
    const info = getRecoveryInfo(tmp)!;
    expect(info.phase).toBe("OWNERSHIP_COMPUTED");
    expect(info.waveId).toBe("wave-5");
    rmSync(tmp, { recursive: true, force: true });
  });
});
