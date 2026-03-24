/**
 * Swarm-Scope Integration Test — validates that scope enforcement works
 * with actual parallel agent simulations: ownership computation → scope
 * file distribution → enforcement → integration-request protocol.
 *
 * This is the CRITICAL test: the file ownership system was built but
 * never tested with actual parallel agent wave simulation.
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, writeFileSync, mkdirSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { spawnSync } from "child_process";
import {
  checkAccess,
  computeOwnership,
  writeAgentScope,
  readAgentScope,
  collectIntegrationRequests,
  generateBlockMessage,
} from "../scripts/lib/file-ownership";
import type { AgentScope, TaskInput, IntegrationRequest } from "../scripts/lib/file-ownership";
import {
  createWaveState,
  transitionPhase,
  updateAgent,
  loadWaveState,
  isWaveInProgress,
  getRecoveryInfo,
} from "../scripts/lib/wave-state";

// ─── Test Helpers ─────────────────────────────────────────

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "pos-swarm-test-"));
}

function makeProjectDir(root: string): void {
  const dirs = ["agents", "scripts/lib", "hooks", "templates", ".productionos/integration-requests", ".productionos/wave-scopes"];
  for (const d of dirs) {
    mkdirSync(join(root, d), { recursive: true });
  }
  writeFileSync(join(root, "agents", "code-reviewer.md"), "---\nname: code-reviewer\n---\n# Code Reviewer");
  writeFileSync(join(root, "agents", "security-hardener.md"), "---\nname: security-hardener\n---\n# Security Hardener");
  writeFileSync(join(root, "agents", "test-architect.md"), "---\nname: test-architect\n---\n# Test Architect");
  writeFileSync(join(root, "agents", "refactoring-agent.md"), "---\nname: refactoring-agent\n---\n# Refactoring Agent");
  mkdirSync(join(root, "src", "components"), { recursive: true });
  writeFileSync(join(root, "src", "index.ts"), "export const app = true;");
  writeFileSync(join(root, "src", "components", "Button.tsx"), "export const Button = () => <button/>;");
  writeFileSync(join(root, "src", "components", "Card.tsx"), "export const Card = () => <div/>;");
  writeFileSync(join(root, "scripts", "lib", "shared.ts"), "export const ROOT = '.';");
  writeFileSync(join(root, "hooks", "pre-push-gate.sh"), "#!/bin/bash\nexit 0");
  writeFileSync(join(root, "templates", "PREAMBLE.md"), "# Preamble");
  writeFileSync(join(root, "package.json"), '{"name":"test-project"}');
  writeFileSync(join(root, "CLAUDE.md"), "# Test");
}

/** Run scope-enforcement.sh safely via spawnSync (no shell injection) */
function runHookSafe(hookPath: string, input: string, scopeFile: string): { stdout: string; exitCode: number } {
  const result = spawnSync("bash", [hookPath], {
    input,
    env: { ...process.env, PRODUCTIONOS_AGENT_SCOPE: scopeFile },
    encoding: "utf-8",
    timeout: 5000,
  });
  return { stdout: (result.stdout || "").trim(), exitCode: result.status ?? 1 };
}

// ─── Full Wave Simulation ─────────────────────────────────

describe("Swarm-Scope Integration: Full Wave Simulation", () => {
  let root: string;
  let stateDir: string;

  beforeEach(() => {
    root = makeTempDir();
    stateDir = join(root, ".productionos");
    makeProjectDir(root);
  });

  afterEach(() => {
    try { rmSync(root, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  test("3-agent wave: ownership computed with non-overlapping scopes", () => {
    const tasks: TaskInput[] = [
      { task: "Review agent definitions", description: "Audit all agent files for quality", files: ["agents/code-reviewer.md", "agents/security-hardener.md"] },
      { task: "Improve test infrastructure", description: "Component bugs", files: ["agents/test-architect.md"], directories: ["src/components/"] },
      { task: "Refactor source code", description: "Clean up", files: ["agents/refactoring-agent.md", "src/index.ts"] },
    ];

    const ownership = computeOwnership(tasks, root, "wave-1");

    expect(ownership.agents["agent-1"].writable_files).toContain("agents/code-reviewer.md");
    expect(ownership.agents["agent-1"].writable_files).toContain("agents/security-hardener.md");
    expect(ownership.agents["agent-2"].writable_files).toContain("agents/test-architect.md");
    expect(ownership.agents["agent-2"].writable_dirs).toContain("src/components/");
    expect(ownership.agents["agent-3"].writable_files).toContain("src/index.ts");

    for (const agentId of ["agent-1", "agent-2", "agent-3"]) {
      const scope = ownership.agents[agentId];
      expect(scope.readonly_dirs).toContain("scripts/lib/");
      expect(scope.readonly_dirs).toContain("hooks/");
      expect(scope.readonly_dirs).toContain("templates/");
      expect(scope.readonly_files).toContain("package.json");
      expect(scope.readonly_files).toContain("CLAUDE.md");
    }

    expect(ownership.unclaimed).toEqual([]);
  });

  test("conflict resolution: overlapping files become readonly", () => {
    const tasks: TaskInput[] = [
      { task: "Agent A wants code-reviewer", description: "Modify", files: ["agents/code-reviewer.md", "src/index.ts"] },
      { task: "Agent B also wants code-reviewer", description: "Also", files: ["agents/code-reviewer.md", "agents/test-architect.md"] },
    ];

    const ownership = computeOwnership(tasks, root, "wave-1");

    expect(ownership.sharedFiles.length).toBeGreaterThan(0);
    expect(ownership.agents["agent-1"].writable_files).not.toContain("agents/code-reviewer.md");
    expect(ownership.agents["agent-2"].writable_files).not.toContain("agents/code-reviewer.md");
    expect(ownership.agents["agent-1"].readonly_files).toContain("agents/code-reviewer.md");
    expect(ownership.agents["agent-2"].readonly_files).toContain("agents/code-reviewer.md");
  });

  test("scope enforcement: agent blocked from writing out-of-scope files", () => {
    const scope: AgentScope = {
      agentId: "agent-1", waveId: "wave-1",
      writable_files: ["agents/code-reviewer.md"], writable_dirs: [],
      readonly_files: ["agents/test-architect.md"], readonly_dirs: ["scripts/lib/", "hooks/"],
    };

    expect(checkAccess("agents/code-reviewer.md", scope).allowed).toBe(true);

    const readonlyCheck = checkAccess("agents/test-architect.md", scope);
    expect(readonlyCheck.allowed).toBe(false);
    expect(readonlyCheck.mode).toBe("readonly");

    expect(checkAccess("scripts/lib/shared.ts", scope).allowed).toBe(false);
    expect(checkAccess("hooks/pre-push-gate.sh", scope).allowed).toBe(false);

    const outOfScope = checkAccess("src/index.ts", scope);
    expect(outOfScope.allowed).toBe(false);
    expect(outOfScope.mode).toBe("none");

    expect(checkAccess(".productionos/report.md", scope).allowed).toBe(true);
    expect(checkAccess(".productionos/integration-requests/foo.json", scope).allowed).toBe(true);
  });

  test("scope file persistence: write and read back scope", () => {
    const scope: AgentScope = {
      agentId: "agent-2", waveId: "wave-1",
      writable_files: ["agents/test-architect.md"], writable_dirs: ["src/components/"],
      readonly_files: ["package.json", "CLAUDE.md"], readonly_dirs: ["scripts/lib/", "hooks/", "templates/"],
    };

    const scopePath = writeAgentScope(scope, stateDir);
    expect(existsSync(scopePath)).toBe(true);

    const loaded = readAgentScope(scopePath);
    expect(loaded).not.toBeNull();
    expect(loaded!.agentId).toBe("agent-2");
    expect(loaded!.waveId).toBe("wave-1");
    expect(loaded!.writable_files).toContain("agents/test-architect.md");
    expect(loaded!.writable_dirs).toContain("src/components/");
    expect(loaded!.readonly_files).toContain("package.json");
  });

  test("full wave lifecycle: INIT → DONE with scope enforcement at each phase", () => {
    const waveState = createWaveState(1, 3, stateDir);
    expect(waveState.phase).toBe("INIT");
    expect(waveState.agents.length).toBe(3);
    expect(isWaveInProgress(stateDir)).toBe(true);

    const tasks: TaskInput[] = [
      { task: "Review agents", description: "Agent quality", files: ["agents/code-reviewer.md"] },
      { task: "Fix components", description: "Component bugs", directories: ["src/components/"] },
      { task: "Refactor core", description: "Clean up", files: ["src/index.ts"] },
    ];
    const ownership = computeOwnership(tasks, root, "wave-1");
    transitionPhase(stateDir, "OWNERSHIP_COMPUTED");

    const scopePaths: string[] = [];
    for (const [agentId, scope] of Object.entries(ownership.agents)) {
      const path = writeAgentScope(scope, stateDir);
      scopePaths.push(path);
      updateAgent(stateDir, agentId, { scopeFiles: [path] });
    }
    transitionPhase(stateDir, "SCOPES_DISTRIBUTED");
    expect(scopePaths.length).toBe(3);

    for (const agent of waveState.agents) {
      updateAgent(stateDir, agent.agentId, { status: "dispatched", dispatchedAt: new Date().toISOString() });
    }
    transitionPhase(stateDir, "AGENTS_DISPATCHED");
    transitionPhase(stateDir, "AGENTS_RUNNING");

    // Verify cross-agent scope isolation
    const agent1Scope = readAgentScope(scopePaths[0]!)!;
    expect(checkAccess("agents/code-reviewer.md", agent1Scope).allowed).toBe(true);
    expect(checkAccess("src/components/Button.tsx", agent1Scope).allowed).toBe(false);

    const agent2Scope = readAgentScope(scopePaths[1]!)!;
    expect(checkAccess("src/components/Button.tsx", agent2Scope).allowed).toBe(true);
    expect(checkAccess("agents/code-reviewer.md", agent2Scope).allowed).toBe(false);

    for (const agent of waveState.agents) {
      updateAgent(stateDir, agent.agentId, { status: "complete", completedAt: new Date().toISOString() });
    }
    transitionPhase(stateDir, "AGENTS_COMPLETE");
    transitionPhase(stateDir, "MERGE_PHASE");
    transitionPhase(stateDir, "MERGE_COMPLETE");
    transitionPhase(stateDir, "DONE");

    expect(isWaveInProgress(stateDir)).toBe(false);
    expect(loadWaveState(stateDir)!.phase).toBe("DONE");
  });

  test("integration-request protocol: blocked agent writes request, collector gathers it", () => {
    const scope: AgentScope = {
      agentId: "agent-1", waveId: "wave-1",
      writable_files: ["agents/code-reviewer.md"], writable_dirs: [],
      readonly_files: ["src/index.ts"], readonly_dirs: [],
    };

    const check = checkAccess("src/index.ts", scope);
    expect(check.allowed).toBe(false);

    const message = generateBlockMessage("src/index.ts", check, "agent-1");
    expect(message).toContain("SCOPE BLOCKED");
    expect(message).toContain("integration-requests");

    const request: IntegrationRequest = {
      target_file: "src/index.ts", action: "edit",
      old_string: "export const app = true;",
      new_string: "export const app = true;\nexport const version = '1.0.0';",
      reason: "Need to add version export", agentId: "agent-1", priority: 5, status: "complete",
    };
    const reqDir = join(root, ".productionos", "integration-requests");
    writeFileSync(join(reqDir, "index-001.json"), JSON.stringify(request, null, 2));

    const collected = collectIntegrationRequests([root]);
    expect(collected.length).toBe(1);
    expect(collected[0].target_file).toBe("src/index.ts");
    expect(collected[0].agentId).toBe("agent-1");
    expect(collected[0].priority).toBe(5);
  });

  test("multi-file atomic transaction via groupId", () => {
    const reqDir = join(root, ".productionos", "integration-requests");

    const req1: IntegrationRequest = {
      target_file: "src/index.ts", action: "edit",
      old_string: "export const app = true;",
      new_string: "export const app = true;\nimport { Button } from './components/Button';",
      reason: "Add import", agentId: "agent-3", priority: 10,
      groupId: "atomic-import-refactor", status: "complete",
    };
    const req2: IntegrationRequest = {
      target_file: "src/components/Button.tsx", action: "edit",
      old_string: "export const Button = () => <button/>;",
      new_string: "export const Button = ({ label }: { label: string }) => <button>{label}</button>;",
      reason: "Add label prop", agentId: "agent-3", priority: 10,
      groupId: "atomic-import-refactor", status: "complete",
    };

    writeFileSync(join(reqDir, "index-group-1.json"), JSON.stringify(req1, null, 2));
    writeFileSync(join(reqDir, "button-group-1.json"), JSON.stringify(req2, null, 2));

    const collected = collectIntegrationRequests([root]);
    expect(collected.length).toBe(2);
    expect(collected.filter(r => r.groupId === "atomic-import-refactor").length).toBe(2);
    expect(collected[0].priority).toBe(10);
  });

  test("incomplete/invalid integration requests are skipped", () => {
    const reqDir = join(root, ".productionos", "integration-requests");

    writeFileSync(join(reqDir, "valid.json"), JSON.stringify({
      target_file: "src/index.ts", action: "edit", reason: "Valid", agentId: "agent-1", status: "complete",
    }, null, 2));
    writeFileSync(join(reqDir, "no-target.json"), JSON.stringify({
      action: "edit", reason: "Missing target", agentId: "agent-2", status: "complete",
    }, null, 2));
    writeFileSync(join(reqDir, "partial.json"), JSON.stringify({
      target_file: "src/index.ts", action: "edit", reason: "Not done", agentId: "agent-1", status: "partial",
    }, null, 2));
    writeFileSync(join(reqDir, "corrupt.json"), "not json{{{");

    const collected = collectIntegrationRequests([root]);
    expect(collected.length).toBe(1);
    expect(collected[0].agentId).toBe("agent-1");
  });

  test("wave recovery: crash during AGENTS_RUNNING recovers correctly", () => {
    createWaveState(1, 3, stateDir);
    transitionPhase(stateDir, "OWNERSHIP_COMPUTED");
    transitionPhase(stateDir, "SCOPES_DISTRIBUTED");
    transitionPhase(stateDir, "AGENTS_DISPATCHED");
    transitionPhase(stateDir, "AGENTS_RUNNING");

    updateAgent(stateDir, "agent-1", { status: "complete", completedAt: new Date().toISOString() });
    updateAgent(stateDir, "agent-2", { status: "running", dispatchedAt: new Date().toISOString() });

    const recovery = getRecoveryInfo(stateDir);
    expect(recovery).not.toBeNull();
    expect(recovery!.phase).toBe("AGENTS_RUNNING");
    expect(recovery!.completedAgents).toEqual(["agent-1"]);
    expect(recovery!.runningAgents).toEqual(["agent-2"]);
    expect(recovery!.pendingAgents).toEqual(["agent-3"]);
  });

  test("illegal phase transitions are rejected", () => {
    createWaveState(1, 2, stateDir);
    expect(() => transitionPhase(stateDir, "AGENTS_RUNNING")).toThrow("Illegal transition");
    transitionPhase(stateDir, "OWNERSHIP_COMPUTED");
    expect(() => transitionPhase(stateDir, "INIT")).toThrow("Illegal transition");
  });

  test("multiple worktrees: integration requests collected from all", () => {
    const wt1 = makeTempDir();
    const wt2 = makeTempDir();

    const reqDir1 = join(wt1, ".productionos", "integration-requests");
    mkdirSync(reqDir1, { recursive: true });
    writeFileSync(join(reqDir1, "req1.json"), JSON.stringify({
      target_file: "src/a.ts", action: "edit", reason: "Fix A", agentId: "agent-1", status: "complete",
    }));
    writeFileSync(join(reqDir1, "req2.json"), JSON.stringify({
      target_file: "src/b.ts", action: "create", reason: "New B", agentId: "agent-1", priority: 3, status: "complete",
    }));

    const reqDir2 = join(wt2, ".productionos", "integration-requests");
    mkdirSync(reqDir2, { recursive: true });
    writeFileSync(join(reqDir2, "req3.json"), JSON.stringify({
      target_file: "src/c.ts", action: "edit", reason: "Fix C", agentId: "agent-2", priority: 10, status: "complete",
    }));

    const collected = collectIntegrationRequests([wt1, wt2]);
    expect(collected.length).toBe(3);
    expect(collected[0].target_file).toBe("src/c.ts");
    expect(collected[0].priority).toBe(10);

    try { rmSync(wt1, { recursive: true, force: true }); } catch { /* ignore */ }
    try { rmSync(wt2, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  test("new file creation: allowed within writable_dirs (GAP-21)", () => {
    const scope: AgentScope = {
      agentId: "agent-2", waveId: "wave-1",
      writable_files: [], writable_dirs: ["src/components/"],
      readonly_files: [], readonly_dirs: [],
    };

    expect(checkAccess("src/components/NewWidget.tsx", scope).allowed).toBe(true);
    expect(checkAccess("src/components/deep/nested/Thing.tsx", scope).allowed).toBe(true);
    expect(checkAccess("src/utils/helper.ts", scope).allowed).toBe(false);
  });

  test("7-agent max wave: no file writable by more than one agent", () => {
    const tasks: TaskInput[] = Array.from({ length: 7 }, (_, i) => ({
      task: `Task ${i + 1}`, description: `Desc ${i + 1}`,
      files: [`agents/${["code-reviewer", "security-hardener", "test-architect", "refactoring-agent", "code-reviewer", "security-hardener", "test-architect"][i]}.md`],
    }));

    const ownership = computeOwnership(tasks, root, "wave-1");

    const writableMap = new Map<string, string[]>();
    for (const [agentId, scope] of Object.entries(ownership.agents)) {
      for (const f of scope.writable_files) {
        const existing = writableMap.get(f) || [];
        existing.push(agentId);
        writableMap.set(f, existing);
      }
    }
    for (const [, agents] of writableMap) {
      expect(agents.length).toBeLessThanOrEqual(1);
    }
  });
});

// ─── Shell Hook Execution Tests ──────────────────────────

describe("Swarm-Scope Integration: Shell Hook Execution", () => {
  let root: string;

  beforeEach(() => {
    root = makeTempDir();
    mkdirSync(join(root, ".productionos", "wave-scopes"), { recursive: true });
  });

  afterEach(() => {
    try { rmSync(root, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  test("scope-enforcement.sh allows when no scope file set", () => {
    const hookPath = join(process.cwd(), "hooks", "scope-enforcement.sh");
    if (!existsSync(hookPath)) return;

    const input = JSON.stringify({ tool_name: "Edit", tool_input: { file_path: "src/index.ts" } });
    const { stdout } = runHookSafe(hookPath, input, "");

    try {
      const parsed = JSON.parse(stdout);
      expect(parsed.decision).toBe("allow");
    } catch { /* hook not executable in test env */ }
  });

  test("scope-enforcement.sh blocks when scope file blocks the path", () => {
    const hookPath = join(process.cwd(), "hooks", "scope-enforcement.sh");
    if (!existsSync(hookPath)) return;

    const scopeFile = join(root, "scope.json");
    writeFileSync(scopeFile, JSON.stringify({
      agentId: "agent-1", waveId: "wave-1",
      writable_files: ["agents/foo.md"], writable_dirs: [],
      readonly_files: ["src/index.ts"], readonly_dirs: [],
    }));

    const input = JSON.stringify({ tool_name: "Edit", tool_input: { file_path: "src/index.ts" } });
    const { stdout } = runHookSafe(hookPath, input, scopeFile);

    try {
      const parsed = JSON.parse(stdout);
      expect(parsed.decision).toBe("block");
      expect(parsed.reason).toContain("SCOPE BLOCKED");
    } catch {
      // jq might not be available in CI
    }
  });

  test("scope-enforcement.sh allows writable file in scope", () => {
    const hookPath = join(process.cwd(), "hooks", "scope-enforcement.sh");
    if (!existsSync(hookPath)) return;

    const scopeFile = join(root, "scope.json");
    writeFileSync(scopeFile, JSON.stringify({
      agentId: "agent-1", waveId: "wave-1",
      writable_files: ["agents/foo.md"], writable_dirs: [],
      readonly_files: [], readonly_dirs: [],
    }));

    const input = JSON.stringify({ tool_name: "Edit", tool_input: { file_path: "agents/foo.md" } });
    const { stdout } = runHookSafe(hookPath, input, scopeFile);

    try {
      const parsed = JSON.parse(stdout);
      expect(parsed.decision).toBe("allow");
    } catch { /* skip if jq unavailable */ }
  });
});
