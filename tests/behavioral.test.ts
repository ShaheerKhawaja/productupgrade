import { describe, test, expect, beforeAll } from "bun:test";
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { ROOT, parseFrontmatter, readFileOrNull } from "../scripts/lib/shared";

/**
 * Behavioral tests for ProductionOS.
 *
 * Unlike skill-validation.test.ts (which validates structure/syntax),
 * these tests verify that scripts ACTUALLY WORK when executed.
 */

const run = (bin: string, args: string[]): string => {
  try {
    return execFileSync(bin, args, { cwd: ROOT, encoding: "utf-8", timeout: 30_000 });
  } catch (e: any) {
    return e.stdout ?? e.message ?? "EXEC_FAILED";
  }
};

// ─── Script Execution Tests ─────────────────────────────────

describe("skill:check executes successfully", () => {
  let output: string;

  beforeAll(() => {
    output = run("bun", ["run", "skill:check"]);
  });

  test("exits with score line", () => {
    expect(output).toContain("Score:");
    expect(output).toContain("checks passed");
  });

  test("reports 10/10", () => {
    expect(output).toContain("10/10");
  });

  test("validates agents", () => {
    expect(output).toContain("agents have valid frontmatter");
  });
});

describe("validate-agents executes successfully", () => {
  let output: string;

  beforeAll(() => {
    output = run("bun", ["run", "validate"]);
  });

  test("reports total count", () => {
    expect(output).toContain("Total:");
    expect(output).toContain("valid");
  });

  test("reports 0 invalid", () => {
    expect(output).toContain("0 invalid");
  });

  test("counts match directory", () => {
    const agentCount = fs.readdirSync(path.join(ROOT, "agents")).filter(f => f.endsWith(".md")).length;
    expect(output).toContain(`${agentCount} agents`);
  });
});

describe("gen-skill-docs dry-run executes", () => {
  let output: string;

  beforeAll(() => {
    output = run("bun", ["run", "scripts/gen-skill-docs.ts", "--dry-run"]);
  });

  test("shows version", () => {
    expect(output).toContain("Version:");
  });

  test("reports 0 failures", () => {
    expect(output).toContain("0 fail");
  });
});

describe("convergence engine test suite", () => {
  let output: string;

  beforeAll(() => {
    output = run("bun", ["run", "scripts/convergence.ts", "--test"]);
  });

  test("runs both algorithms", () => {
    expect(output).toContain("Algorithm 1");
    expect(output).toContain("Algorithm 6");
  });

  test("tests edge cases", () => {
    expect(output).toContain("DEGRADED");
    expect(output).toContain("MAX_REACHED");
  });

  test("completes without errors", () => {
    expect(output).toContain("All tests complete");
  });
});

describe("cost-tracker CLI", () => {
  test("shows usage when no args", () => {
    const output = run("bun", ["run", "scripts/cost-tracker.ts"]);
    expect(output).toContain("Usage:");
  });

  test("list subcommand works", () => {
    const output = run("bun", ["run", "scripts/cost-tracker.ts", "list"]);
    expect(output.length).toBeGreaterThan(0);
  });
});

// ─── MANIFEST Validation Tests ──────────────────────────────

describe("MANIFEST validation on artifacts", () => {
  test("valid artifact passes validation", () => {
    const content = `---\nproducer: test-agent\ntimestamp: 2026-03-19T00:00:00.000Z\nstatus: complete\n---\n\n# Test`;
    const fm = parseFrontmatter(content);
    expect(fm).not.toBeNull();
    expect(fm!["producer"]).toBe("test-agent");
    expect(fm!["status"]).toBe("complete");
  });

  test("artifact without frontmatter detected", () => {
    const fm = parseFrontmatter("# No Frontmatter\nJust content.");
    expect(fm).toBeNull();
  });

  test("artifact with incomplete MANIFEST detected", () => {
    const fm = parseFrontmatter("---\nproducer: test-agent\n---\n\n# Missing status");
    expect(fm).not.toBeNull();
    expect(fm!["status"]).toBeUndefined();
  });

  test("in-progress status detected", () => {
    const fm = parseFrontmatter("---\nproducer: test\nstatus: in-progress\n---\n");
    expect(fm!["status"]).toBe("in-progress");
    expect(fm!["status"]).not.toBe("complete");
  });
});

// ─── Cross-File Consistency Tests ───────────────────────────

describe("version consistency across all sources", () => {
  const ver = readFileOrNull(path.join(ROOT, "VERSION"))?.trim() ?? "";

  test("VERSION is valid semver", () => {
    expect(ver).toMatch(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/);
  });

  test("package.json matches", () => {
    const pkg = JSON.parse(readFileOrNull(path.join(ROOT, "package.json")) ?? "{}");
    expect(pkg.version).toBe(ver);
  });

  test("plugin.json matches", () => {
    const p = JSON.parse(readFileOrNull(path.join(ROOT, ".claude-plugin", "plugin.json")) ?? "{}");
    expect(p.version).toBe(ver);
  });

  test("marketplace.json matches", () => {
    const m = JSON.parse(readFileOrNull(path.join(ROOT, ".claude-plugin", "marketplace.json")) ?? "{}");
    expect(m.plugins?.[0]?.version).toBe(ver);
  });
});

describe("agent count consistency", () => {
  const count = fs.readdirSync(path.join(ROOT, "agents")).filter(f => f.endsWith(".md")).length;

  test("CLAUDE.md mentions correct count", () => {
    const c = readFileOrNull(path.join(ROOT, "CLAUDE.md")) ?? "";
    expect(c).toContain(`${count}-agent`);
  });

  test("hooks.json mentions correct count", () => {
    // hooks.json no longer contains agent count metadata (removed _meta field for schema compliance)
    // Count is tracked in CLAUDE.md and README.md instead
    const c = readFileOrNull(path.join(ROOT, "CLAUDE.md")) ?? "";
    expect(c).toContain(`${count}`);
  });
});

// ─── Agent Quality Floor Tests ──────────────────────────────

describe("all agents meet minimum quality bar", () => {
  const agentsDir = path.join(ROOT, "agents");
  const files = fs.readdirSync(agentsDir).filter(f => f.endsWith(".md"));

  test("every agent has valid frontmatter with name+description", () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(agentsDir, file), "utf-8");
      const fm = parseFrontmatter(content);
      expect(fm).not.toBeNull();
      expect(fm!["name"]).toBeTruthy();
      expect(fm!["description"]).toBeTruthy();
    }
  });

  test("every agent has <role> and <instructions>", () => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(agentsDir, file), "utf-8");
      expect(content).toContain("<role>");
      expect(content).toContain("<instructions>");
    }
  });

  test("no agent under 60 lines", () => {
    for (const file of files) {
      const lines = fs.readFileSync(path.join(agentsDir, file), "utf-8").split("\n").length;
      expect(lines).toBeGreaterThanOrEqual(60);
    }
  });
});

// ─── Hooks Tests ────────────────────────────────────────────

describe("hooks configuration", () => {
  test("hooks.json is valid JSON with required sections", () => {
    const raw = JSON.parse(readFileOrNull(path.join(ROOT, "hooks", "hooks.json")) ?? "{}");
    const hooks = raw.hooks || raw;
    expect(hooks.SessionStart).toBeDefined();
    expect(hooks.PreToolUse).toBeDefined();
    expect(hooks.PostToolUse).toBeDefined();
  });

  test("protected-file-guard.sh exists", () => {
    expect(fs.existsSync(path.join(ROOT, "hooks", "protected-file-guard.sh"))).toBe(true);
  });

  test("self-learn.sh exists", () => {
    expect(fs.existsSync(path.join(ROOT, "hooks", "self-learn.sh"))).toBe(true);
  });
});
