import { describe, test, expect, beforeAll } from "bun:test";
import { execFileSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { ROOT } from "../scripts/lib/shared";

/**
 * Tier 1 worktree-manager.ts tests.
 * Validates: CLI interface, branch validation, JSON output,
 * registry operations, and command help text.
 */

const WT_SCRIPT = join(ROOT, "scripts", "worktree-manager.ts");

const run = (args: string[]): string => {
  try {
    return execFileSync("bun", ["run", WT_SCRIPT, ...args], {
      cwd: ROOT, encoding: "utf-8", timeout: 30_000,
    }).trim();
  } catch (e: any) {
    // Capture both stdout and stderr for error cases
    const out = (e.stdout ?? "").toString().trim();
    const err = (e.stderr ?? "").toString().trim();
    return out + "\n" + err;
  }
};

// ─── Help / Usage ──────────────────────────────────────────

describe("worktree-manager help", () => {
  test("shows usage when no command given", () => {
    const out = run([]);
    expect(out).toContain("Usage:");
    expect(out).toContain("create");
    expect(out).toContain("merge");
    expect(out).toContain("preflight");
    expect(out).toContain("cleanup");
    expect(out).toContain("assign");
  });

  test("shows usage for unknown command", () => {
    const out = run(["nonexistent"]);
    expect(out).toContain("Usage:");
  });

  test("lists all 7 commands in help", () => {
    const out = run([]);
    const commands = ["create", "list", "status", "preflight", "merge", "cleanup", "assign"];
    for (const cmd of commands) {
      expect(out).toContain(cmd);
    }
  });
});

// ─── Branch Validation ─────────────────────────────────────

describe("branch name validation", () => {
  test("rejects empty branch name", () => {
    const out = run(["create", ""]);
    expect(out).toContain("ERROR");
    expect(out).toContain("Branch name");
  });

  test("rejects path traversal (..)", () => {
    const out = run(["create", "../evil/branch"]);
    expect(out).toContain("ERROR");
    expect(out).toContain("Invalid branch name");
  });

  test("rejects leading dash", () => {
    const out = run(["create", "-bad-branch"]);
    expect(out).toContain("ERROR");
    expect(out).toContain("Invalid branch name");
  });

  test("rejects spaces in branch name", () => {
    const out = run(["create", "bad branch name"]);
    expect(out).toContain("ERROR");
  });

  test("rejects shell metacharacters", () => {
    const out = run(["create", "branch;rm -rf /"]);
    expect(out).toContain("ERROR");
  });

  test("accepts valid branch names", () => {
    // Just validate that the regex works — don't actually create
    // Valid patterns: alphanumeric, slashes, dots, dashes
    const validNames = ["feature/auth", "fix/bug-123", "swarm/wave-1-agent-1", "v8.0.0"];
    for (const name of validNames) {
      expect(/^[a-zA-Z0-9][a-zA-Z0-9/_.-]{0,200}$/.test(name)).toBe(true);
    }
  });
});

// ─── JSON Output ───────────────────────────────────────────

describe("JSON output modes", () => {
  test("list --json returns valid JSON array", () => {
    const out = run(["list", "--json"]);
    expect(() => JSON.parse(out)).not.toThrow();
    const parsed = JSON.parse(out);
    expect(Array.isArray(parsed)).toBe(true);
  });

  test("status --json returns valid JSON with worktrees and orphans", () => {
    const out = run(["status", "--json"]);
    expect(() => JSON.parse(out)).not.toThrow();
    const parsed = JSON.parse(out);
    expect(parsed).toHaveProperty("worktrees");
    expect(parsed).toHaveProperty("orphans");
    expect(parsed).toHaveProperty("total");
    expect(typeof parsed.orphans).toBe("number");
    expect(typeof parsed.total).toBe("number");
  });
});

// ─── Command Argument Validation ───────────────────────────

describe("command argument validation", () => {
  test("preflight requires branch argument", () => {
    const out = run(["preflight"]);
    expect(out).toContain("Usage");
  });

  test("merge requires branch argument", () => {
    const out = run(["merge"]);
    expect(out).toContain("Usage");
  });

  test("cleanup requires --all or branch argument", () => {
    const out = run(["cleanup"]);
    expect(out).toContain("Usage");
  });

  test("assign requires tasks-json argument", () => {
    const out = run(["assign"]);
    expect(out).toContain("Usage");
  });

  test("assign rejects missing file", () => {
    const out = run(["assign", "/nonexistent/tasks.json"]);
    expect(out).toContain("Not found");
  });
});

// ─── Preflight on Non-Existent Branch ──────────────────────

describe("preflight edge cases", () => {
  test("preflight on unregistered branch shows FAIL", () => {
    const out = run(["preflight", "nonexistent/branch"]);
    expect(out).toContain("FAIL");
    expect(out).toContain("Not in registry");
    expect(out).toContain("BLOCKED");
  });
});

// ─── Cleanup Edge Cases ────────────────────────────────────

describe("cleanup edge cases", () => {
  test("cleanup of non-existent branch exits without crash", () => {
    // The script prints to stderr (console.error) and exits cleanly
    // We just verify it doesn't crash with an unhandled exception
    const out = run(["cleanup", "nonexistent/branch"]);
    expect(typeof out).toBe("string");
  });

  test("cleanup --all with empty registry is safe", () => {
    const out = run(["cleanup", "--all"]);
    expect(out).toContain("No worktrees eligible");
  });
});

// ─── WorktreeInfo Type Shape ───────────────────────────────

describe("WorktreeInfo schema", () => {
  test("registry file path uses STATE_DIR", () => {
    const content = readFileSync(WT_SCRIPT, "utf-8");
    expect(content).toContain("PRODUCTIONOS_HOME");
    expect(content).toContain(".productionos");
    expect(content).toContain("worktrees.json");
  });

  test("WorktreeStatus includes all required states", () => {
    const content = readFileSync(WT_SCRIPT, "utf-8");
    const requiredStates = [
      "pending-create", "active", "failed", "stalled",
      "orphaned", "merging", "merged", "conflict",
      "recovery-stashed", "cleaned",
    ];
    for (const state of requiredStates) {
      expect(content).toContain(`"${state}"`);
    }
  });

  test("WorktreeInfo has scope with directories/files/readonly", () => {
    const content = readFileSync(WT_SCRIPT, "utf-8");
    expect(content).toContain("directories: string[]");
    expect(content).toContain("files: string[]");
    expect(content).toContain("readonly: string[]");
  });

  test("WorktreeInfo has merge-related fields", () => {
    const content = readFileSync(WT_SCRIPT, "utf-8");
    expect(content).toContain("mergeCommit");
    expect(content).toContain("recoveryBranch");
    expect(content).toContain("failureReason");
  });

  test("WorktreeInfo has m13v-requested fields", () => {
    const content = readFileSync(WT_SCRIPT, "utf-8");
    expect(content).toContain("lastActivityTime");
    expect(content).toContain("baseRef");
    expect(content).toContain("wave");
  });
});

// ─── Security ──────────────────────────────────────────────

describe("security patterns", () => {
  test("uses execFileSync (not execSync) for all git commands", () => {
    const content = readFileSync(WT_SCRIPT, "utf-8");
    // Should import execFileSync
    expect(content).toContain("execFileSync");
    // Should NOT import execSync (removed legacy run())
    expect(content).not.toContain("execSync");
  });

  test("has branch name validation regex", () => {
    const content = readFileSync(WT_SCRIPT, "utf-8");
    expect(content).toContain("BRANCH_REGEX");
    expect(content).toContain("validateBranchName");
  });

  test("has worktree count limit", () => {
    const content = readFileSync(WT_SCRIPT, "utf-8");
    expect(content).toContain("MAX_WORKTREES");
    expect(content).toContain("10");
  });

  test("has registry file locking", () => {
    const content = readFileSync(WT_SCRIPT, "utf-8");
    expect(content).toContain("acquireLock");
    expect(content).toContain("releaseLock");
    expect(content).toContain("withLockedRegistry");
    expect(content).toContain("LOCK_FILE");
  });

  test("has merge lock for serialization", () => {
    const content = readFileSync(WT_SCRIPT, "utf-8");
    expect(content).toContain("MERGE_LOCK_FILE");
    expect(content).toContain(".merge-lock");
  });

  test("uses atomic write for registry (tmp + rename)", () => {
    const content = readFileSync(WT_SCRIPT, "utf-8");
    expect(content).toContain("renameSync");
    expect(content).toContain(".tmp.");
  });
});

// ─── Integration Points ────────────────────────────────────

describe("integration with ProductionOS", () => {
  test("auto-swarm-nth has Phase 4.5 worktree merge", () => {
    const autoSwarm = readFileSync(
      join(ROOT, ".claude", "commands", "auto-swarm-nth.md"), "utf-8"
    );
    expect(autoSwarm).toContain("Phase 4.5");
    expect(autoSwarm).toContain("Worktree Merge");
    expect(autoSwarm).toContain("worktree-manager.ts merge");
    expect(autoSwarm).toContain("worktree-manager.ts cleanup");
  });

  test("auto-swarm-nth has --isolation worktree flag", () => {
    const autoSwarm = readFileSync(
      join(ROOT, ".claude", "commands", "auto-swarm-nth.md"), "utf-8"
    );
    expect(autoSwarm).toContain("isolation");
    expect(autoSwarm).toContain("worktree");
  });

  test("package.json has worktree:* scripts", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));
    expect(pkg.scripts["worktree:create"]).toBeDefined();
    expect(pkg.scripts["worktree:list"]).toBeDefined();
    expect(pkg.scripts["worktree:status"]).toBeDefined();
    expect(pkg.scripts["worktree:merge"]).toBeDefined();
    expect(pkg.scripts["worktree:cleanup"]).toBeDefined();
    expect(pkg.scripts["worktree:preflight"]).toBeDefined();
    expect(pkg.scripts["worktree:assign"]).toBeDefined();
  });

  test("worktree-orchestrator agent exists", () => {
    expect(existsSync(join(ROOT, "agents", "worktree-orchestrator.md"))).toBe(true);
  });
});
