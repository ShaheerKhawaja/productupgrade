/**
 * Schema Validation Tests — Prevents regression of marketplace/plugin/hooks schema issues.
 *
 * Background: PR #81 fixed 3 critical schema bugs that blocked installation:
 * 1. marketplace.json source "." → "./" (validator requires trailing slash)
 * 2. plugin.json missing agents/commands/skills arrays
 * 3. hooks.json flat root-level → wrapped under "hooks" key
 *
 * These tests ensure the schemas never break again across future commits.
 *
 * Also tests bash scripts for the grep -c + || echo "0" anti-pattern
 * that produces "0\n0" under set -euo pipefail, breaking integer comparisons.
 */
import { describe, test, expect } from "bun:test";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { ROOT } from "../scripts/lib/shared";

const PLUGIN_DIR = join(ROOT, ".claude-plugin");
const CODEX_PLUGIN_DIR = join(ROOT, ".codex-plugin");
const HOOKS_DIR = join(ROOT, "hooks");
const AGENTS_DIR = join(ROOT, "agents");

// ─── Marketplace Schema ──────────────────────────────────────

describe("marketplace.json schema compliance", () => {
  const raw = JSON.parse(readFileSync(join(PLUGIN_DIR, "marketplace.json"), "utf-8"));

  test("has required root keys: name, owner, plugins", () => {
    expect(raw.name).toBeDefined();
    expect(raw.owner).toBeDefined();
    expect(raw.plugins).toBeDefined();
    expect(Array.isArray(raw.plugins)).toBe(true);
  });

  test("does NOT have $schema at root (validator rejects it)", () => {
    expect(raw.$schema).toBeUndefined();
  });

  test("does NOT have description at root (validator rejects it)", () => {
    expect(raw.description).toBeUndefined();
  });

  test("has metadata section", () => {
    expect(raw.metadata).toBeDefined();
    expect(raw.metadata.description).toBeDefined();
  });

  test("plugin source is './' not '.'", () => {
    for (const plugin of raw.plugins) {
      expect(plugin.source).toBe("./");
    }
  });

  test("plugin has required fields", () => {
    for (const plugin of raw.plugins) {
      expect(plugin.name).toBeDefined();
      expect(plugin.source).toBeDefined();
      expect(plugin.description).toBeDefined();
      expect(plugin.version).toBeDefined();
    }
  });

  test("owner has name", () => {
    expect(raw.owner.name).toBeDefined();
    expect(raw.owner.name.length).toBeGreaterThan(0);
  });
});

// ─── Plugin Schema ───────────────────────────────────────────

describe("plugin.json schema compliance", () => {
  const raw = JSON.parse(readFileSync(join(PLUGIN_DIR, "plugin.json"), "utf-8"));

  test("has required fields: name, version, description", () => {
    expect(raw.name).toBeDefined();
    expect(raw.version).toBeDefined();
    expect(raw.description).toBeDefined();
  });

  test("agents is an array of explicit file paths (not directories)", () => {
    expect(Array.isArray(raw.agents)).toBe(true);
    expect(raw.agents.length).toBeGreaterThan(0);
    for (const agent of raw.agents) {
      expect(agent).toMatch(/^\.\/agents\/[a-z0-9-]+\.md$/);
    }
  });

  test("every agent file listed in plugin.json exists on disk", () => {
    const missing: string[] = [];
    for (const agentPath of raw.agents) {
      const fullPath = join(ROOT, agentPath);
      if (!existsSync(fullPath)) {
        missing.push(agentPath);
      }
    }
    expect(missing).toEqual([]);
  });

  test("every agent on disk is listed in plugin.json", () => {
    const agentFiles = readdirSync(AGENTS_DIR).filter(f => f.endsWith(".md")).sort();
    const listedAgents = raw.agents.map((p: string) => p.replace("./agents/", "")).sort();
    const unlisted = agentFiles.filter(f => !listedAgents.includes(f));
    expect(unlisted).toEqual([]);
  });

  test("commands is an array", () => {
    expect(Array.isArray(raw.commands)).toBe(true);
    expect(raw.commands.length).toBeGreaterThan(0);
  });

  test("skills is an array", () => {
    expect(Array.isArray(raw.skills)).toBe(true);
    expect(raw.skills.length).toBeGreaterThan(0);
  });

  test("does NOT have explicit hooks field (auto-loaded by convention)", () => {
    // See PLUGIN_SCHEMA_NOTES.md — adding hooks causes duplicate error in Claude Code v2.1+
    expect(raw.hooks).toBeUndefined();
  });
});

// ─── Codex Plugin Schema ────────────────────────────────────

describe(".codex-plugin/plugin.json schema compliance", () => {
  const raw = JSON.parse(readFileSync(join(CODEX_PLUGIN_DIR, "plugin.json"), "utf-8"));

  test("has required fields: name, version, description, interface", () => {
    expect(raw.name).toBeDefined();
    expect(raw.version).toBeDefined();
    expect(raw.description).toBeDefined();
    expect(raw.interface).toBeDefined();
  });

  test("points skills at the repo skills directory", () => {
    expect(raw.skills).toBe("./skills/");
  });

  test("interface has required Codex presentation fields", () => {
    expect(raw.interface.displayName).toBeDefined();
    expect(raw.interface.shortDescription).toBeDefined();
    expect(raw.interface.longDescription).toBeDefined();
    expect(Array.isArray(raw.interface.defaultPrompt)).toBe(true);
    expect(raw.interface.defaultPrompt.length).toBeGreaterThan(0);
  });
});

// ─── Hooks Schema ────────────────────────────────────────────

describe("hooks.json schema compliance", () => {
  const raw = JSON.parse(readFileSync(join(HOOKS_DIR, "hooks.json"), "utf-8"));

  test("hooks are wrapped under 'hooks' key (not flat root-level)", () => {
    expect(raw.hooks).toBeDefined();
    expect(typeof raw.hooks).toBe("object");
  });

  test("does NOT have _meta field (non-standard)", () => {
    expect(raw._meta).toBeUndefined();
  });

  test("does NOT have lifecycle phases at root level", () => {
    // These should be under raw.hooks, not at root
    expect(raw.SessionStart).toBeUndefined();
    expect(raw.PreToolUse).toBeUndefined();
    expect(raw.PostToolUse).toBeUndefined();
    expect(raw.Stop).toBeUndefined();
  });

  test("all 4 lifecycle phases exist under hooks key", () => {
    expect(raw.hooks.SessionStart).toBeDefined();
    expect(raw.hooks.PreToolUse).toBeDefined();
    expect(raw.hooks.PostToolUse).toBeDefined();
    expect(raw.hooks.Stop).toBeDefined();
  });

  test("each phase is an array of entries with matcher and hooks", () => {
    for (const phase of ["SessionStart", "PreToolUse", "PostToolUse", "Stop"]) {
      const entries = raw.hooks[phase];
      expect(Array.isArray(entries)).toBe(true);
      for (const entry of entries) {
        expect(entry).toHaveProperty("matcher");
        expect(entry).toHaveProperty("hooks");
        expect(Array.isArray(entry.hooks)).toBe(true);
      }
    }
  });
});

// ─── Bash Anti-Pattern Guard ─────────────────────────────────

describe("bash scripts do not use grep -c with || echo (anti-pattern)", () => {
  // grep -c outputs "0" with exit code 1 on no matches.
  // Under set -euo pipefail, || echo "0" fires AND grep's "0" is kept,
  // producing "0\n0" which fails bash integer comparison.
  // Correct pattern: grep -c "PATTERN" || true

  const bashFiles = readdirSync(HOOKS_DIR)
    .filter(f => f.endsWith(".sh"))
    .map(f => join(HOOKS_DIR, f));

  // Also check CI workflow
  const ciPath = join(ROOT, ".github", "workflows", "ci.yml");
  if (existsSync(ciPath)) {
    bashFiles.push(ciPath);
  }

  for (const file of bashFiles) {
    const name = file.replace(ROOT + "/", "");
    test(`${name}: no grep -c with || echo "0" anti-pattern`, () => {
      const content = readFileSync(file, "utf-8");
      // Match: grep -c "..." || echo "0"  or  grep -c '...' || echo "0"
      const antiPattern = /grep\s+-c\s+.*\|\|\s*echo\s+["']0["']/;
      expect(content).not.toMatch(antiPattern);
    });
  }
});

// ─── Version Consistency Across Schemas ──────────────────────

describe("version consistency across schema files", () => {
  const version = readFileSync(join(ROOT, "VERSION"), "utf-8").trim();
  const plugin = JSON.parse(readFileSync(join(PLUGIN_DIR, "plugin.json"), "utf-8"));
  const marketplace = JSON.parse(readFileSync(join(PLUGIN_DIR, "marketplace.json"), "utf-8"));
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));

  test("plugin.json version matches VERSION file", () => {
    expect(plugin.version).toBe(version);
  });

  test("marketplace.json plugin version matches VERSION file", () => {
    expect(marketplace.plugins[0].version).toBe(version);
  });

  test("package.json version matches VERSION file", () => {
    expect(pkg.version).toBe(version);
  });
});
