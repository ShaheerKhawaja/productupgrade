/**
 * Tier 1 hook contract validation — validates hook scripts exist,
 * are executable, and hooks.json references are consistent.
 */
import { describe, test, expect } from "bun:test";
import { readdirSync, readFileSync, existsSync, statSync } from "fs";
import { join } from "path";
import { ROOT } from "../scripts/lib/shared";

const HOOKS_DIR = join(ROOT, "hooks");
const HOOKS_JSON = join(HOOKS_DIR, "hooks.json");

describe("hooks.json structural validation", () => {
  test("hooks.json exists and is valid JSON", () => {
    const content = readFileSync(HOOKS_JSON, "utf-8");
    expect(() => JSON.parse(content)).not.toThrow();
  });

  test("has all required lifecycle phases", () => {
    const config = JSON.parse(readFileSync(HOOKS_JSON, "utf-8"));
    expect(config.SessionStart).toBeDefined();
    expect(config.PreToolUse).toBeDefined();
    expect(config.PostToolUse).toBeDefined();
    expect(config.Stop).toBeDefined();
  });

  test("every hook references an existing script", () => {
    const config = JSON.parse(readFileSync(HOOKS_JSON, "utf-8"));
    const allHooks: string[] = [];

    for (const phase of ["SessionStart", "PreToolUse", "PostToolUse", "Stop"]) {
      const entries = config[phase];
      if (!Array.isArray(entries)) continue;
      for (const entry of entries) {
        if (!entry.hooks) continue;
        for (const hook of entry.hooks) {
          // Extract script name from command string
          const match = hook.command?.match(/hooks\/([a-z0-9-]+\.sh)/);
          if (match) allHooks.push(match[1]);
        }
      }
    }

    for (const script of allHooks) {
      expect(existsSync(join(HOOKS_DIR, script))).toBe(true);
    }
  });

  test("PreToolUse hooks have matchers", () => {
    const config = JSON.parse(readFileSync(HOOKS_JSON, "utf-8"));
    for (const entry of config.PreToolUse) {
      expect(entry.matcher).toBeTruthy();
    }
  });
});

describe("Hook script validation", () => {
  const hookScripts = readdirSync(HOOKS_DIR).filter(f => f.endsWith(".sh"));

  test("all hook scripts are executable", () => {
    for (const script of hookScripts) {
      const stats = statSync(join(HOOKS_DIR, script));
      const isExecutable = (stats.mode & 0o111) !== 0;
      expect(isExecutable).toBe(true);
    }
  });

  test("all hook scripts have bash shebang", () => {
    for (const script of hookScripts) {
      const content = readFileSync(join(HOOKS_DIR, script), "utf-8");
      expect(content.startsWith("#!/usr/bin/env bash")).toBe(true);
    }
  });

  test("all hook scripts use set -euo pipefail", () => {
    for (const script of hookScripts) {
      const content = readFileSync(join(HOOKS_DIR, script), "utf-8");
      expect(content).toContain("set -euo pipefail");
    }
  });

  test("PreToolUse hooks return valid JSON", () => {
    // PreToolUse hooks must output JSON with decision or additionalContext
    const preToolHooks = ["repo-boundary-guard.sh", "protected-file-guard.sh", "pre-edit-security.sh", "pre-commit-gitleaks.sh"];
    for (const script of preToolHooks) {
      if (!existsSync(join(HOOKS_DIR, script))) continue;
      const content = readFileSync(join(HOOKS_DIR, script), "utf-8");
      // Must contain at least one JSON output pattern
      const hasJsonOutput = content.includes('"decision"') || content.includes('"additionalContext"') || content.includes("echo '{}'");
      expect(hasJsonOutput).toBe(true);
    }
  });
});
