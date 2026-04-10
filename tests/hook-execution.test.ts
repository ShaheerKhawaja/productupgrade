import { describe, test, expect } from "bun:test";
import { execSync } from "child_process";
import { join } from "path";

const ROOT = join(import.meta.dir, "..");
const HOOKS = join(ROOT, "hooks");

function runHook(hook: string, input: string): string {
  try {
    return execSync(`echo '${input}' | bash "${join(HOOKS, hook)}"`, {
      cwd: ROOT,
      env: { ...process.env, PRODUCTIONOS_HOME: "/tmp/pos-hook-test" },
      timeout: 5000,
    }).toString();
  } catch (e: any) {
    return e.stdout?.toString() || e.stderr?.toString() || "";
  }
}

describe("Hook Infrastructure", () => {
  test("protected-file-guard.sh exists and is executable", () => {
    const stat = execSync(`test -x "${join(HOOKS, "protected-file-guard.sh")}" && echo "OK"`).toString().trim();
    expect(stat).toBe("OK");
  });

  test("scope-enforcement.sh exists and is executable", () => {
    const stat = execSync(`test -x "${join(HOOKS, "scope-enforcement.sh")}" && echo "OK"`).toString().trim();
    expect(stat).toBe("OK");
  });

  test("self-learn.sh exists and is executable", () => {
    const stat = execSync(`test -x "${join(HOOKS, "self-learn.sh")}" && echo "OK"`).toString().trim();
    expect(stat).toBe("OK");
  });

  test("all hook scripts have proper shebang", () => {
    const hooks = execSync(`ls "${HOOKS}"/*.sh`).toString().trim().split("\n");
    for (const hook of hooks) {
      const first = execSync(`head -1 "${hook}"`).toString().trim();
      expect(first).toMatch(/^#!\/usr\/bin\/env bash|^#!\/bin\/bash/);
    }
  });

  test("hooks.json is valid JSON with required keys", () => {
    const content = execSync(`cat "${join(HOOKS, "hooks.json")}"`).toString();
    const parsed = JSON.parse(content);
    expect(parsed).toHaveProperty("hooks");
    expect(Array.isArray(parsed.hooks)).toBe(false);
    expect(parsed.hooks).toHaveProperty("SessionStart");
    expect(parsed.hooks).toHaveProperty("PreToolUse");
    expect(parsed.hooks).toHaveProperty("PostToolUse");
    expect(parsed.hooks).toHaveProperty("Stop");
  });
});
