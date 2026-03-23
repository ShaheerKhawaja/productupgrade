import { describe, test, expect } from "bun:test";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  computeOwnership,
  checkAccess,
  generateBlockMessage,
  writeAgentScope,
  readAgentScope,
  collectIntegrationRequests,
} from "../scripts/lib/file-ownership";
import { createWaveState, transitionPhase, updateAgent, getRecoveryInfo } from "../scripts/lib/wave-state";
import type { TaskInput } from "../scripts/lib/file-ownership";

// ─── Helpers ───────────────────────────────────────────────

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "pos-integ-"));
}

function createProjectDir(): string {
  const tmp = makeTempDir();
  mkdirSync(join(tmp, "agents"), { recursive: true });
  mkdirSync(join(tmp, "scripts", "lib"), { recursive: true });
  mkdirSync(join(tmp, "tests"), { recursive: true });
  mkdirSync(join(tmp, "templates"), { recursive: true });
  mkdirSync(join(tmp, "hooks"), { recursive: true });
  writeFileSync(join(tmp, "agents", "code-reviewer.md"), "# Code Reviewer");
  writeFileSync(join(tmp, "agents", "code-reviewer.test.ts"), "// tests");
  writeFileSync(join(tmp, "agents", "gap-analyzer.md"), "# Gap Analyzer");
  writeFileSync(join(tmp, "scripts", "lib", "shared.ts"), "export const ROOT = '.'");
  writeFileSync(join(tmp, "templates", "PREAMBLE.md"), "# Preamble");
  writeFileSync(join(tmp, "package.json"), "{}");
  return tmp;
}

// ─── Ownership → Scope → Check Round-Trip ──────────────────

describe("ownership → scope → check round-trip", () => {
  test("3 tasks with explicit files get non-overlapping scopes", () => {
    const tmp = createProjectDir();
    const stateDir = makeTempDir();
    const tasks: TaskInput[] = [
      { task: "Fix reviewer", description: "Fix", files: ["agents/code-reviewer.md"] },
      { task: "Fix analyzer", description: "Fix", files: ["agents/gap-analyzer.md"] },
      { task: "Fix scripts", description: "Fix", directories: ["tests/"] },
    ];

    const map = computeOwnership(tasks, tmp, "wave-1");

    // Write scopes and read them back
    for (const [agentId, scope] of Object.entries(map.agents)) {
      const path = writeAgentScope(scope, stateDir);
      const read = readAgentScope(path);
      expect(read).not.toBeNull();
      expect(read!.agentId).toBe(agentId);
    }

    // Agent 1 can access code-reviewer.md (write) but not gap-analyzer.md
    const scope1 = map.agents["agent-1"]!;
    expect(checkAccess("agents/code-reviewer.md", scope1).allowed).toBe(true);
    expect(checkAccess("agents/gap-analyzer.md", scope1).allowed).toBe(false);

    // Agent 2 can access gap-analyzer.md but not code-reviewer.md
    const scope2 = map.agents["agent-2"]!;
    expect(checkAccess("agents/gap-analyzer.md", scope2).allowed).toBe(true);
    expect(checkAccess("agents/code-reviewer.md", scope2).allowed).toBe(false);

    // Agent 3 can access tests/
    const scope3 = map.agents["agent-3"]!;
    expect(checkAccess("tests/new-test.ts", scope3).allowed).toBe(true);
    expect(checkAccess("agents/code-reviewer.md", scope3).allowed).toBe(false);

    rmSync(tmp, { recursive: true, force: true });
    rmSync(stateDir, { recursive: true, force: true });
  });
});

// ─── Conflict Detection ────────────────────────────────────

describe("conflict detection", () => {
  test("3 tasks claiming same file all get readonly", () => {
    const tmp = createProjectDir();
    const tasks: TaskInput[] = [
      { task: "A", description: "Fix shared", files: ["scripts/lib/shared.ts"] },
      { task: "B", description: "Fix shared", files: ["scripts/lib/shared.ts"] },
      { task: "C", description: "Fix shared", files: ["scripts/lib/shared.ts"] },
    ];

    const map = computeOwnership(tasks, tmp, "wave-1");
    expect(map.sharedFiles).toContain("scripts/lib/shared.ts");

    for (const scope of Object.values(map.agents)) {
      expect(scope.writable_files).not.toContain("scripts/lib/shared.ts");
      // shared.ts is in readonly via shared infra pattern (scripts/lib/)
      expect(scope.readonly_dirs).toContain("scripts/lib/");
    }

    rmSync(tmp, { recursive: true, force: true });
  });
});

// ─── Scope Enforcement Simulation ──────────────────────────

describe("scope enforcement simulation", () => {
  test("agent scoped to agents/ — correct access patterns", () => {
    const scope = {
      agentId: "agent-1", waveId: "wave-1",
      writable_files: [], writable_dirs: ["agents/"],
      readonly_files: ["package.json"], readonly_dirs: ["templates/", "scripts/lib/", "hooks/"],
    };

    expect(checkAccess("agents/new-agent.md", scope).allowed).toBe(true);
    expect(checkAccess("agents/code-reviewer.md", scope).allowed).toBe(true);
    expect(checkAccess("scripts/worktree-manager.ts", scope).allowed).toBe(false);
    expect(checkAccess("templates/PREAMBLE.md", scope).allowed).toBe(false);
    expect(checkAccess("package.json", scope).allowed).toBe(false);
    expect(checkAccess(".productionos/output.json", scope).allowed).toBe(true);
  });
});

// ─── Integration Request Pipeline ──────────────────────────

describe("integration request pipeline", () => {
  test("compute → check → block → request → collect", () => {
    const tmp = createProjectDir();
    const tasks: TaskInput[] = [
      { task: "Fix agents", description: "Fix", directories: ["agents/"] },
      { task: "Fix scripts", description: "Fix", directories: ["tests/"] },
    ];

    const map = computeOwnership(tasks, tmp, "wave-1");
    const scope1 = map.agents["agent-1"]!;

    // Agent 1 tries to access agent 2's file → blocked
    const check = checkAccess("tests/integration.test.ts", scope1);
    expect(check.allowed).toBe(false);

    // Generate block message
    const msg = generateBlockMessage("tests/integration.test.ts", check, "agent-1");
    expect(msg).toContain("integration-requests");
    expect(msg).toContain("agent-1");

    // Simulate agent writing integration request
    const wt1 = makeTempDir();
    const reqDir = join(wt1, ".productionos", "integration-requests");
    mkdirSync(reqDir, { recursive: true });
    writeFileSync(join(reqDir, "integration-1.json"), JSON.stringify({
      target_file: "tests/integration.test.ts",
      action: "edit",
      old_string: "old code",
      new_string: "new code",
      reason: "Agent 1 needs to update this test",
      agentId: "agent-1",
      status: "complete",
    }));

    // Collect requests
    const reqs = collectIntegrationRequests([wt1]);
    expect(reqs).toHaveLength(1);
    expect(reqs[0]!.target_file).toBe("tests/integration.test.ts");
    expect(reqs[0]!.agentId).toBe("agent-1");

    rmSync(tmp, { recursive: true, force: true });
    rmSync(wt1, { recursive: true, force: true });
  });
});

// ─── Wave State + Ownership Integration ────────────────────

describe("wave state + ownership integration", () => {
  test("full wave lifecycle: init → compute → dispatch → complete → done", () => {
    const stateDir = makeTempDir();
    const projectDir = createProjectDir();

    // Phase 1: Init
    const state = createWaveState(1, 2, stateDir);
    expect(state.phase).toBe("INIT");

    // Phase 2: Compute ownership
    const tasks: TaskInput[] = [
      { task: "Fix agents", description: "Fix", directories: ["agents/"] },
      { task: "Fix tests", description: "Fix", directories: ["tests/"] },
    ];
    const map = computeOwnership(tasks, projectDir, state.waveId);
    transitionPhase(stateDir, "OWNERSHIP_COMPUTED");

    // Phase 3: Distribute scopes
    for (const [agentId, scope] of Object.entries(map.agents)) {
      writeAgentScope(scope, stateDir);
      updateAgent(stateDir, agentId, { scopeFiles: scope.writable_files });
    }
    transitionPhase(stateDir, "SCOPES_DISTRIBUTED");

    // Phase 4: Dispatch
    transitionPhase(stateDir, "AGENTS_DISPATCHED");
    updateAgent(stateDir, "agent-1", { status: "dispatched", dispatchedAt: new Date().toISOString() });
    updateAgent(stateDir, "agent-2", { status: "dispatched", dispatchedAt: new Date().toISOString() });

    // Phase 5: Running
    transitionPhase(stateDir, "AGENTS_RUNNING");
    updateAgent(stateDir, "agent-1", { status: "running" });
    updateAgent(stateDir, "agent-2", { status: "running" });

    // Phase 6: Complete
    updateAgent(stateDir, "agent-1", { status: "complete", completedAt: new Date().toISOString() });
    updateAgent(stateDir, "agent-2", { status: "complete", completedAt: new Date().toISOString() });
    transitionPhase(stateDir, "AGENTS_COMPLETE");

    // Phase 7-8: Skip integration (no shared file changes)
    // Phase 9: Merge
    transitionPhase(stateDir, "MERGE_PHASE");
    transitionPhase(stateDir, "MERGE_COMPLETE");

    // Phase 10: Done
    const final = transitionPhase(stateDir, "DONE");
    expect(final.phase).toBe("DONE");

    // Recovery should return null for completed waves
    expect(getRecoveryInfo(stateDir)).toBeNull();

    rmSync(stateDir, { recursive: true, force: true });
    rmSync(projectDir, { recursive: true, force: true });
  });

  test("crash recovery — wave interrupted during AGENTS_RUNNING", () => {
    const stateDir = makeTempDir();

    createWaveState(2, 3, stateDir);
    transitionPhase(stateDir, "OWNERSHIP_COMPUTED");
    transitionPhase(stateDir, "SCOPES_DISTRIBUTED");
    transitionPhase(stateDir, "AGENTS_DISPATCHED");
    transitionPhase(stateDir, "AGENTS_RUNNING");

    updateAgent(stateDir, "agent-1", { status: "complete" });
    updateAgent(stateDir, "agent-2", { status: "running" });
    // agent-3 still pending — simulates crash before dispatch

    // Simulate recovery
    const info = getRecoveryInfo(stateDir)!;
    expect(info.phase).toBe("AGENTS_RUNNING");
    expect(info.completedAgents).toContain("agent-1");
    expect(info.runningAgents).toContain("agent-2");
    expect(info.pendingAgents).toContain("agent-3");

    rmSync(stateDir, { recursive: true, force: true });
  });
});

// ─── Wave Scope Isolation ──────────────────────────────────

describe("wave scope isolation", () => {
  test("wave-1 and wave-2 scopes have different filenames", () => {
    const stateDir = makeTempDir();
    const scope1 = {
      agentId: "agent-1", waveId: "wave-1",
      writable_files: ["agents/foo.md"], writable_dirs: [],
      readonly_files: [], readonly_dirs: [],
    };
    const scope2 = {
      agentId: "agent-1", waveId: "wave-2",
      writable_files: ["agents/bar.md"], writable_dirs: [],
      readonly_files: [], readonly_dirs: [],
    };

    const path1 = writeAgentScope(scope1, stateDir);
    const path2 = writeAgentScope(scope2, stateDir);
    expect(path1).not.toBe(path2);
    expect(path1).toContain("wave-1");
    expect(path2).toContain("wave-2");

    // Both readable independently
    expect(readAgentScope(path1)!.waveId).toBe("wave-1");
    expect(readAgentScope(path2)!.waveId).toBe("wave-2");

    rmSync(stateDir, { recursive: true, force: true });
  });
});

// ─── Co-location Correctness ───────────────────────────────

describe("co-location correctness", () => {
  test("owning foo.md claims foo.test.ts and foo.yml but not bar.md", () => {
    const tmp = createProjectDir();
    // Project dir already has code-reviewer.md and code-reviewer.test.ts
    const tasks: TaskInput[] = [
      { task: "Fix reviewer", description: "Fix", files: ["agents/code-reviewer.md"] },
    ];
    const map = computeOwnership(tasks, tmp, "wave-1");
    const writable = map.agents["agent-1"]!.writable_files;
    expect(writable).toContain("agents/code-reviewer.md");
    expect(writable).toContain("agents/code-reviewer.test.ts");
    expect(writable).not.toContain("agents/gap-analyzer.md");
    rmSync(tmp, { recursive: true, force: true });
  });
});

// ─── Shared Infrastructure Always Readonly ─────────────────

describe("shared infrastructure always readonly", () => {
  test("even when explicitly requested", () => {
    const tmp = createProjectDir();
    const tasks: TaskInput[] = [
      { task: "Fix templates", description: "Fix", directories: ["templates/"] },
    ];
    const map = computeOwnership(tasks, tmp, "wave-1");
    const scope = map.agents["agent-1"]!;
    expect(scope.writable_dirs).not.toContain("templates/");
    expect(scope.readonly_dirs).toContain("templates/");
    rmSync(tmp, { recursive: true, force: true });
  });
});
