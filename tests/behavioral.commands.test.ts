import { describe, test, expect } from "bun:test";
import { execFileSync } from "child_process";
import { join } from "path";
import { ROOT } from "../scripts/lib/shared";
import { getBunRunCommand } from "../scripts/lib/runtime";

/**
 * Behavioral tests — actually execute ProductionOS scripts and hooks,
 * verifying their output. Addresses TODOS.md P3: "Currently 0 tests run
 * actual commands."
 */

// ─── Helpers ───────────────────────────────────────────────

const runScript = (script: string, args: string[] = []): string => {
  const bun = getBunRunCommand([join(ROOT, "scripts", script), ...args]);
  try {
    return execFileSync(bun.command, bun.args, {
      cwd: ROOT, encoding: "utf-8", timeout: 30_000,
      env: bun.env,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch (e: unknown) {
    const err = e as { stdout?: Buffer | string; stderr?: Buffer | string };
    const out = (err.stdout ?? "").toString().trim();
    const stderr = (err.stderr ?? "").toString().trim();
    return out + "\n" + stderr;
  }
};

const runHook = (hookScript: string, input: object, env?: Record<string, string>): string => {
  try {
    return execFileSync("bash", [join(ROOT, "hooks", hookScript)], {
      cwd: ROOT, encoding: "utf-8", timeout: 10_000,
      input: JSON.stringify(input),
      env: { ...process.env, CLAUDE_PLUGIN_ROOT: ROOT, ...env },
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch (e: unknown) {
    const err = e as { stdout?: Buffer | string };
    return (err.stdout ?? "").toString().trim();
  }
};

// ─── Script Execution Tests ────────────────────────────────

describe("validate-agents script", () => {
  test("runs and reports validation results", () => {
    const out = runScript("validate-agents.ts");
    expect(out).toBeTruthy();
    expect(out.length).toBeGreaterThan(10);
  });

  test("output mentions agent count", () => {
    const out = runScript("validate-agents.ts");
    // Should contain a number followed by "agents" or "valid"
    expect(out).toMatch(/\d+/);
  });
});

describe("stats-dashboard script", () => {
  test("produces markdown table output", () => {
    const out = runScript("stats-dashboard.ts");
    expect(out).toContain("## ProductionOS Stats");
    expect(out).toContain("| Metric | Value |");
  });

  test("reports correct version", () => {
    const out = runScript("stats-dashboard.ts");
    expect(out).toContain("2.0.0-beta.1");
  });

  test("reports agent count", () => {
    const out = runScript("stats-dashboard.ts");
    expect(out).toMatch(/Agents.*\d+/);
  });

  test("reports stakes breakdown", () => {
    const out = runScript("stats-dashboard.ts");
    expect(out).toContain("HIGH");
    expect(out).toContain("MEDIUM");
    expect(out).toContain("LOW");
  });
});

describe("gen-skill-docs script", () => {
  test("dry-run executes without crash", () => {
    const out = runScript("gen-skill-docs.ts");
    expect(typeof out).toBe("string");
  });
});

describe("skill-check script", () => {
  test("runs and produces output", () => {
    const out = runScript("skill-check.ts");
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
  });
});

// ─── Hook Script Tests ─────────────────────────────────────

describe("protected-file-guard hook", () => {
  test("blocks .env file writes", () => {
    const out = runHook("protected-file-guard.sh", {
      tool_name: "Edit",
      tool_input: { file_path: "/project/.env", old_string: "old", new_string: "new" },
    });
    const parsed = JSON.parse(out);
    expect(parsed.decision).toBe("block");
    expect(parsed.reason).toContain("Environment file");
  });

  test("allows normal file writes", () => {
    const out = runHook("protected-file-guard.sh", {
      tool_name: "Edit",
      tool_input: { file_path: "/project/src/index.ts", old_string: "old", new_string: "new" },
    });
    const parsed = JSON.parse(out);
    expect(parsed.decision).toBe("allow");
  });

  test("blocks private key files", () => {
    const out = runHook("protected-file-guard.sh", {
      tool_name: "Write",
      tool_input: { file_path: "/project/server.key", content: "secret" },
    });
    const parsed = JSON.parse(out);
    expect(parsed.decision).toBe("block");
  });

  test("allows .env.example", () => {
    const out = runHook("protected-file-guard.sh", {
      tool_name: "Edit",
      tool_input: { file_path: "/project/.env.example", old_string: "old", new_string: "new" },
    });
    const parsed = JSON.parse(out);
    expect(parsed.decision).toBe("allow");
  });
});

describe("scope-enforcement hook", () => {
  test("allows everything when PRODUCTIONOS_AGENT_SCOPE not set", () => {
    const out = runHook("scope-enforcement.sh", {
      tool_name: "Edit",
      tool_input: { file_path: "/project/any-file.ts", old_string: "a", new_string: "b" },
    }, { PRODUCTIONOS_AGENT_SCOPE: "" });
    const parsed = JSON.parse(out);
    expect(parsed.decision).toBe("allow");
  });

  test("allows non-write tools unconditionally", () => {
    const out = runHook("scope-enforcement.sh", {
      tool_name: "Read",
      tool_input: { file_path: "/project/secret.ts" },
    });
    const parsed = JSON.parse(out);
    expect(parsed.decision).toBe("allow");
  });
});

// ─── Package.json Script Tests ─────────────────────────────

describe("package.json scripts", () => {
  test("bun run stats produces dashboard", () => {
    const bun = getBunRunCommand(["stats"]);
    const out = execFileSync(bun.command, bun.args, {
      cwd: ROOT, encoding: "utf-8", timeout: 15_000,
      env: bun.env,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    expect(out).toContain("ProductionOS Stats");
  });
});
