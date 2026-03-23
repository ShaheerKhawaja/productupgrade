import { describe, test, expect } from "bun:test";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  checkAccess,
  computeOwnership,
  generateBlockMessage,
  writeAgentScope,
  readAgentScope,
  collectIntegrationRequests,
  normalizePath,
} from "../scripts/lib/file-ownership";
import type { AgentScope, TaskInput } from "../scripts/lib/file-ownership";

// ─── Helpers ───────────────────────────────────────────────

function makeScope(overrides: Partial<AgentScope> = {}): AgentScope {
  return {
    agentId: "agent-1",
    waveId: "wave-1",
    writable_files: [],
    writable_dirs: [],
    readonly_files: [],
    readonly_dirs: [],
    ...overrides,
  };
}

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "pos-test-"));
}

// ─── checkAccess — Pure Logic Tests ────────────────────────

describe("checkAccess", () => {
  test("writable file is allowed", () => {
    const scope = makeScope({ writable_files: ["agents/foo.md"] });
    const result = checkAccess("agents/foo.md", scope);
    expect(result.allowed).toBe(true);
    expect(result.mode).toBe("write");
  });

  test("writable file returns owner", () => {
    const scope = makeScope({ agentId: "agent-3", writable_files: ["src/index.ts"] });
    const result = checkAccess("src/index.ts", scope);
    expect(result.owner).toBe("agent-3");
  });

  test("file under writable_dirs is allowed", () => {
    const scope = makeScope({ writable_dirs: ["agents/"] });
    const result = checkAccess("agents/code-reviewer.md", scope);
    expect(result.allowed).toBe(true);
    expect(result.mode).toBe("write");
  });

  test("file deeply nested under writable_dirs is allowed", () => {
    const scope = makeScope({ writable_dirs: ["src/"] });
    const result = checkAccess("src/components/deep/nested/file.ts", scope);
    expect(result.allowed).toBe(true);
  });

  test("readonly file is blocked", () => {
    const scope = makeScope({ readonly_files: ["templates/PREAMBLE.md"] });
    const result = checkAccess("templates/PREAMBLE.md", scope);
    expect(result.allowed).toBe(false);
    expect(result.mode).toBe("readonly");
  });

  test("file under readonly_dirs is blocked", () => {
    const scope = makeScope({ readonly_dirs: ["templates/"] });
    const result = checkAccess("templates/RUBRIC.md", scope);
    expect(result.allowed).toBe(false);
    expect(result.mode).toBe("readonly");
  });

  test("file not in any scope is blocked with mode none", () => {
    const scope = makeScope();
    const result = checkAccess("hooks/evil.sh", scope);
    expect(result.allowed).toBe(false);
    expect(result.mode).toBe("none");
  });

  test("new file in writable dir is allowed", () => {
    const scope = makeScope({ writable_dirs: ["agents/"] });
    const result = checkAccess("agents/brand-new-agent.md", scope);
    expect(result.allowed).toBe(true);
  });

  test("new file in readonly dir is blocked", () => {
    const scope = makeScope({ readonly_dirs: ["hooks/"] });
    const result = checkAccess("hooks/new-hook.sh", scope);
    expect(result.allowed).toBe(false);
  });

  test("new file in unscoped dir is blocked", () => {
    const scope = makeScope({ writable_dirs: ["agents/"] });
    const result = checkAccess("scripts/new-script.ts", scope);
    expect(result.allowed).toBe(false);
    expect(result.mode).toBe("none");
  });

  test("empty scope blocks everything", () => {
    const scope = makeScope();
    expect(checkAccess("anything.ts", scope).allowed).toBe(false);
    expect(checkAccess("agents/foo.md", scope).allowed).toBe(false);
  });

  test("writable_files overrides readonly_dirs (specific wins)", () => {
    const scope = makeScope({
      writable_files: ["templates/PREAMBLE.md"],
      readonly_dirs: ["templates/"],
    });
    const result = checkAccess("templates/PREAMBLE.md", scope);
    expect(result.allowed).toBe(true);
    expect(result.mode).toBe("write");
  });

  test("readonly_files overrides writable_dirs (specific wins)", () => {
    const scope = makeScope({
      writable_dirs: ["agents/"],
      readonly_files: ["agents/code-reviewer.md"],
    });
    const result = checkAccess("agents/code-reviewer.md", scope);
    expect(result.allowed).toBe(false);
    expect(result.mode).toBe("readonly");
  });

  test("empty filePath returns blocked", () => {
    const scope = makeScope({ writable_files: ["agents/foo.md"] });
    const result = checkAccess("", scope);
    expect(result.allowed).toBe(false);
  });

  test(".productionos/ is always writable", () => {
    const scope = makeScope(); // empty scope
    const result = checkAccess(".productionos/integration-requests/foo.json", scope);
    expect(result.allowed).toBe(true);
  });

  test("prefix dir does not match — agents-backup/ is not under agents/", () => {
    const scope = makeScope({ writable_dirs: ["agents/"] });
    const result = checkAccess("agents-backup/foo.md", scope);
    expect(result.allowed).toBe(false);
  });
});

// ─── normalizePath ─────────────────────────────────────────

describe("normalizePath", () => {
  test("removes double slashes", () => {
    const result = normalizePath("agents//foo.md");
    expect(result).not.toContain("//");
  });

  test("removes trailing slash", () => {
    const result = normalizePath("agents/");
    expect(result).not.toMatch(/\/$/);
  });
});

// ─── computeOwnership — Ownership Computation ──────────────

describe("computeOwnership", () => {
  test("single task with explicit files gets write access", () => {
    const tmp = makeTempDir();
    mkdirSync(join(tmp, "agents"), { recursive: true });
    writeFileSync(join(tmp, "agents", "foo.md"), "test");
    const tasks: TaskInput[] = [{ task: "Fix agent", description: "Fix foo", files: ["agents/foo.md"] }];
    const map = computeOwnership(tasks, tmp, "wave-1");
    expect(map.agents["agent-1"].writable_files).toContain("agents/foo.md");
    rmSync(tmp, { recursive: true, force: true });
  });

  test("single task with directories gets writable_dirs", () => {
    const tmp = makeTempDir();
    mkdirSync(join(tmp, "agents"), { recursive: true });
    const tasks: TaskInput[] = [{ task: "Fix agents", description: "Fix", directories: ["agents/"] }];
    const map = computeOwnership(tasks, tmp, "wave-1");
    expect(map.agents["agent-1"].writable_dirs).toContain("agents/");
    rmSync(tmp, { recursive: true, force: true });
  });

  test("conflict: two tasks claiming same file → both get readonly", () => {
    const tmp = makeTempDir();
    mkdirSync(join(tmp, "agents"), { recursive: true });
    writeFileSync(join(tmp, "agents", "shared.md"), "test");
    const tasks: TaskInput[] = [
      { task: "Task A", description: "Edit shared", files: ["agents/shared.md"] },
      { task: "Task B", description: "Also edit shared", files: ["agents/shared.md"] },
    ];
    const map = computeOwnership(tasks, tmp, "wave-1");
    expect(map.sharedFiles).toContain("agents/shared.md");
    expect(map.agents["agent-1"].writable_files).not.toContain("agents/shared.md");
    expect(map.agents["agent-2"].writable_files).not.toContain("agents/shared.md");
    expect(map.agents["agent-1"].readonly_files).toContain("agents/shared.md");
    rmSync(tmp, { recursive: true, force: true });
  });

  test("shared infrastructure dirs are always readonly", () => {
    const tmp = makeTempDir();
    mkdirSync(join(tmp, "scripts/lib"), { recursive: true });
    const tasks: TaskInput[] = [{ task: "Fix scripts", description: "Fix", directories: ["scripts/lib/"] }];
    const map = computeOwnership(tasks, tmp, "wave-1");
    // scripts/lib/ should be in readonly_dirs, not writable_dirs
    expect(map.agents["agent-1"].writable_dirs).not.toContain("scripts/lib/");
    expect(map.agents["agent-1"].readonly_dirs).toContain("scripts/lib/");
    rmSync(tmp, { recursive: true, force: true });
  });

  test("shared infrastructure files are always readonly", () => {
    const tmp = makeTempDir();
    mkdirSync(join(tmp, "agents"), { recursive: true });
    writeFileSync(join(tmp, "agents", "foo.md"), "test");
    writeFileSync(join(tmp, "package.json"), "{}");
    const tasks: TaskInput[] = [{ task: "Fix", description: "Fix", files: ["agents/foo.md", "package.json"] }];
    const map = computeOwnership(tasks, tmp, "wave-1");
    expect(map.agents["agent-1"].writable_files).toContain("agents/foo.md");
    expect(map.agents["agent-1"].writable_files).not.toContain("package.json");
    expect(map.agents["agent-1"].readonly_files).toContain("package.json");
    rmSync(tmp, { recursive: true, force: true });
  });

  test("unclaimed agents are listed", () => {
    const tmp = makeTempDir();
    const tasks: TaskInput[] = [{ task: "Vague task", description: "Do something" }];
    const map = computeOwnership(tasks, tmp, "wave-1");
    expect(map.unclaimed).toContain("agent-1");
    rmSync(tmp, { recursive: true, force: true });
  });

  test("empty tasks array produces empty ownership map", () => {
    const tmp = makeTempDir();
    const map = computeOwnership([], tmp, "wave-1");
    expect(Object.keys(map.agents)).toHaveLength(0);
    expect(map.sharedFiles).toHaveLength(0);
    rmSync(tmp, { recursive: true, force: true });
  });

  test("waveId and computedAt are set", () => {
    const tmp = makeTempDir();
    const map = computeOwnership([], tmp, "wave-42");
    expect(map.waveId).toBe("wave-42");
    expect(map.computedAt).toBeTruthy();
    rmSync(tmp, { recursive: true, force: true });
  });

  test("co-location: owning agents/foo.md also claims agents/foo.test.ts", () => {
    const tmp = makeTempDir();
    mkdirSync(join(tmp, "agents"), { recursive: true });
    writeFileSync(join(tmp, "agents", "foo.md"), "test");
    writeFileSync(join(tmp, "agents", "foo.test.ts"), "test");
    writeFileSync(join(tmp, "agents", "foo.yml"), "test");
    const tasks: TaskInput[] = [{ task: "Fix foo", description: "Fix", files: ["agents/foo.md"] }];
    const map = computeOwnership(tasks, tmp, "wave-1");
    const writable = map.agents["agent-1"].writable_files;
    expect(writable).toContain("agents/foo.md");
    expect(writable).toContain("agents/foo.test.ts");
    expect(writable).toContain("agents/foo.yml");
    rmSync(tmp, { recursive: true, force: true });
  });
});

// ─── generateBlockMessage — Message Quality ────────────────

describe("generateBlockMessage", () => {
  test("readonly block includes integration-request instructions", () => {
    const check = { allowed: false, mode: "readonly" as const, reason: "readonly" };
    const msg = generateBlockMessage("templates/PREAMBLE.md", check, "agent-1");
    expect(msg).toContain("integration");
    expect(msg).toContain("PREAMBLE");
    expect(msg).toContain(".productionos/integration-requests/");
  });

  test("out-of-scope block includes instructions", () => {
    const check = { allowed: false, mode: "none" as const, reason: "not in scope" };
    const msg = generateBlockMessage("hooks/evil.sh", check, "agent-2");
    expect(msg).toContain("out of scope");
    expect(msg).toContain("agent-2");
  });

  test("message includes JSON schema for integration-request", () => {
    const check = { allowed: false, mode: "readonly" as const, reason: "readonly" };
    const msg = generateBlockMessage("shared.ts", check, "agent-1");
    expect(msg).toContain('"target_file"');
    expect(msg).toContain('"action"');
    expect(msg).toContain('"old_string"');
    expect(msg).toContain('"new_string"');
    expect(msg).toContain('"status": "complete"');
  });

  test("message warns against bypass attempts", () => {
    const check = { allowed: false, mode: "none" as const, reason: "out of scope" };
    const msg = generateBlockMessage("file.ts", check, "agent-1");
    expect(msg).toContain("Do NOT attempt to bypass");
    expect(msg).toContain("symlinks");
  });
});

// ─── writeAgentScope / readAgentScope — Serialization ──────

describe("scope serialization", () => {
  test("writeAgentScope creates file at correct path", () => {
    const tmp = makeTempDir();
    const scope = makeScope({ waveId: "wave-5", agentId: "agent-3" });
    const path = writeAgentScope(scope, tmp);
    expect(path).toContain("wave-5-agent-3.json");
    expect(Bun.file(path).size).toBeGreaterThan(0);
    rmSync(tmp, { recursive: true, force: true });
  });

  test("readAgentScope reads back what was written (round-trip)", () => {
    const tmp = makeTempDir();
    const scope = makeScope({
      waveId: "wave-1", agentId: "agent-1",
      writable_files: ["agents/foo.md"],
      writable_dirs: ["agents/"],
      readonly_files: ["package.json"],
    });
    const path = writeAgentScope(scope, tmp);
    const read = readAgentScope(path);
    expect(read).not.toBeNull();
    expect(read!.agentId).toBe("agent-1");
    expect(read!.writable_files).toContain("agents/foo.md");
    expect(read!.readonly_files).toContain("package.json");
    rmSync(tmp, { recursive: true, force: true });
  });

  test("readAgentScope returns null for missing file", () => {
    expect(readAgentScope("/nonexistent/path.json")).toBeNull();
  });

  test("readAgentScope returns null for corrupt JSON", () => {
    const tmp = makeTempDir();
    const badFile = join(tmp, "bad.json");
    writeFileSync(badFile, "not json {{{");
    expect(readAgentScope(badFile)).toBeNull();
    rmSync(tmp, { recursive: true, force: true });
  });

  test("readAgentScope returns null for missing required fields", () => {
    const tmp = makeTempDir();
    const badFile = join(tmp, "incomplete.json");
    writeFileSync(badFile, JSON.stringify({ waveId: "w1" }));
    expect(readAgentScope(badFile)).toBeNull();
    rmSync(tmp, { recursive: true, force: true });
  });

  test("writeAgentScope creates parent directories", () => {
    const tmp = makeTempDir();
    const scope = makeScope();
    const path = writeAgentScope(scope, join(tmp, "deep", "nested"));
    expect(Bun.file(path).size).toBeGreaterThan(0);
    rmSync(tmp, { recursive: true, force: true });
  });
});

// ─── collectIntegrationRequests — Request Collection ───────

describe("collectIntegrationRequests", () => {
  test("collects requests from single worktree", () => {
    const tmp = makeTempDir();
    const reqDir = join(tmp, ".productionos", "integration-requests");
    mkdirSync(reqDir, { recursive: true });
    writeFileSync(join(reqDir, "fix-1.json"), JSON.stringify({
      target_file: "shared.ts", action: "edit",
      old_string: "old", new_string: "new",
      reason: "fix import", agentId: "agent-1", status: "complete",
    }));
    const reqs = collectIntegrationRequests([tmp]);
    expect(reqs).toHaveLength(1);
    expect(reqs[0].target_file).toBe("shared.ts");
    rmSync(tmp, { recursive: true, force: true });
  });

  test("collects from multiple worktrees", () => {
    const tmp1 = makeTempDir();
    const tmp2 = makeTempDir();
    const dir1 = join(tmp1, ".productionos", "integration-requests");
    const dir2 = join(tmp2, ".productionos", "integration-requests");
    mkdirSync(dir1, { recursive: true });
    mkdirSync(dir2, { recursive: true });
    writeFileSync(join(dir1, "a.json"), JSON.stringify({
      target_file: "a.ts", action: "edit", reason: "fix", agentId: "agent-1", status: "complete",
    }));
    writeFileSync(join(dir2, "b.json"), JSON.stringify({
      target_file: "b.ts", action: "create", reason: "add", agentId: "agent-2", status: "complete",
    }));
    const reqs = collectIntegrationRequests([tmp1, tmp2]);
    expect(reqs).toHaveLength(2);
    rmSync(tmp1, { recursive: true, force: true });
    rmSync(tmp2, { recursive: true, force: true });
  });

  test("sorts by priority (higher first), then alphabetical", () => {
    const tmp = makeTempDir();
    const reqDir = join(tmp, ".productionos", "integration-requests");
    mkdirSync(reqDir, { recursive: true });
    writeFileSync(join(reqDir, "low.json"), JSON.stringify({
      target_file: "z.ts", action: "edit", reason: "low", agentId: "a1", priority: 0, status: "complete",
    }));
    writeFileSync(join(reqDir, "high.json"), JSON.stringify({
      target_file: "a.ts", action: "edit", reason: "high", agentId: "a2", priority: 10, status: "complete",
    }));
    const reqs = collectIntegrationRequests([tmp]);
    expect(reqs[0].priority).toBe(10);
    expect(reqs[1].priority).toBe(0);
    rmSync(tmp, { recursive: true, force: true });
  });

  test("skips invalid JSON files gracefully", () => {
    const tmp = makeTempDir();
    const reqDir = join(tmp, ".productionos", "integration-requests");
    mkdirSync(reqDir, { recursive: true });
    writeFileSync(join(reqDir, "bad.json"), "not json");
    writeFileSync(join(reqDir, "good.json"), JSON.stringify({
      target_file: "a.ts", action: "edit", reason: "fix", agentId: "a1", status: "complete",
    }));
    const reqs = collectIntegrationRequests([tmp]);
    expect(reqs).toHaveLength(1);
    rmSync(tmp, { recursive: true, force: true });
  });

  test("returns empty array when no requests exist", () => {
    const tmp = makeTempDir();
    expect(collectIntegrationRequests([tmp])).toHaveLength(0);
    rmSync(tmp, { recursive: true, force: true });
  });

  test("skips incomplete requests (no status: complete)", () => {
    const tmp = makeTempDir();
    const reqDir = join(tmp, ".productionos", "integration-requests");
    mkdirSync(reqDir, { recursive: true });
    writeFileSync(join(reqDir, "partial.json"), JSON.stringify({
      target_file: "a.ts", action: "edit", reason: "fix", agentId: "a1",
      // no status field — should be skipped
    }));
    const reqs = collectIntegrationRequests([tmp]);
    expect(reqs).toHaveLength(0);
    rmSync(tmp, { recursive: true, force: true });
  });

  test("skips requests missing required fields", () => {
    const tmp = makeTempDir();
    const reqDir = join(tmp, ".productionos", "integration-requests");
    mkdirSync(reqDir, { recursive: true });
    writeFileSync(join(reqDir, "missing.json"), JSON.stringify({
      action: "edit", status: "complete",
      // missing target_file, reason, agentId
    }));
    const reqs = collectIntegrationRequests([tmp]);
    expect(reqs).toHaveLength(0);
    rmSync(tmp, { recursive: true, force: true });
  });
});

// ─── Edge Cases ────────────────────────────────────────────

describe("edge cases", () => {
  test("agent scope with only writable_dirs, no writable_files", () => {
    const scope = makeScope({ writable_dirs: ["agents/", "tests/"] });
    expect(checkAccess("agents/new.md", scope).allowed).toBe(true);
    expect(checkAccess("tests/new.test.ts", scope).allowed).toBe(true);
    expect(checkAccess("scripts/foo.ts", scope).allowed).toBe(false);
  });

  test("path prefix that is not a subdirectory is blocked", () => {
    // "agents/" should not match "agents-backup/"
    const scope = makeScope({ writable_dirs: ["agents/"] });
    expect(checkAccess("agents-backup/foo.md", scope).allowed).toBe(false);
    expect(checkAccess("agents/foo.md", scope).allowed).toBe(true);
  });

  test("ownership map with 0 tasks produces valid empty map", () => {
    const tmp = makeTempDir();
    const map = computeOwnership([], tmp, "wave-0");
    expect(map.waveId).toBe("wave-0");
    expect(Object.keys(map.agents)).toHaveLength(0);
    expect(map.sharedFiles).toHaveLength(0);
    expect(map.unclaimed).toHaveLength(0);
    rmSync(tmp, { recursive: true, force: true });
  });
});

// ─── Case Sensitivity (GAP-10) ─────────────────────────────

describe("case-insensitive matching (macOS/Windows)", () => {
  test("checkAccess matches mixed-case file paths against writable_files", () => {
    const scope = makeScope({ writable_files: ["agents/foo.md"] });
    // On macOS, Agents/FOO.md and agents/foo.md are the same file
    const result = checkAccess("Agents/FOO.md", scope);
    if (process.platform === "darwin" || process.platform === "win32") {
      expect(result.allowed).toBe(true);
      expect(result.mode).toBe("write");
    } else {
      // On Linux, case matters — different file
      expect(result.allowed).toBe(false);
    }
  });

  test("checkAccess matches mixed-case paths against writable_dirs", () => {
    const scope = makeScope({ writable_dirs: ["agents/"] });
    const result = checkAccess("AGENTS/new-file.md", scope);
    if (process.platform === "darwin" || process.platform === "win32") {
      expect(result.allowed).toBe(true);
    } else {
      expect(result.allowed).toBe(false);
    }
  });
});
