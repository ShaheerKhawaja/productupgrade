import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { execFileSync } from "child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { ROOT } from "../scripts/lib/shared";

const INSTALLER = join(ROOT, "bin", "install.cjs");
const HOME_TMP = join(homedir(), "tmp");

let tempRoot = "";

function runInstaller(args: string[], env: Record<string, string>): string {
  return execFileSync("node", [INSTALLER, ...args], {
    cwd: ROOT,
    encoding: "utf-8",
    env: { ...process.env, ...env },
    stdio: ["pipe", "pipe", "pipe"],
  });
}

describe("native installer", () => {
  beforeAll(() => {
    mkdirSync(HOME_TMP, { recursive: true });
    tempRoot = mkdtempSync(join(HOME_TMP, "productionos-installer-"));
  });

  afterAll(() => {
    if (tempRoot) {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  test("--help documents Codex install flags", () => {
    const out = runInstaller(["--help"], {});
    expect(out).toContain("--codex");
    expect(out).toContain("--all-targets");
    expect(out).toContain("CODEX_HOME");
  });

  test("--codex installs skill and plugin to CODEX_HOME", () => {
    const codexHome = join(tempRoot, "codex-home");
    const out = runInstaller(["--codex"], { CODEX_HOME: codexHome });

    expect(out).toContain("installed for Codex");
    expect(existsSync(join(codexHome, "plugins", "productionos", ".codex-plugin", "plugin.json"))).toBe(true);
    expect(existsSync(join(codexHome, "skills", "productionos", "SKILL.md"))).toBe(true);
    expect(existsSync(join(codexHome, "skills", "productionos-review", "SKILL.md"))).toBe(true);
  });

  test("--all-targets installs Claude and Codex payloads together", () => {
    const claudeHome = join(tempRoot, "claude-home");
    const codexHome = join(tempRoot, "codex-home-all");
    const out = runInstaller(["--all-targets"], {
      CLAUDE_CONFIG_DIR: claudeHome,
      CODEX_HOME: codexHome,
    });

    expect(out).toContain("Target (Claude Code)");
    expect(out).toContain("Target (Codex)");
    expect(existsSync(join(claudeHome, "commands", "productionos", "production-upgrade.md"))).toBe(true);
    expect(existsSync(join(codexHome, "plugins", "productionos", ".codex-plugin", "plugin.json"))).toBe(true);
    expect(existsSync(join(codexHome, "skills", "productionos", "SKILL.md"))).toBe(true);
  });
});
