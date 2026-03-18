/**
 * Tier 1: Static validation tests (free, <1s)
 *
 * Validates structural integrity of all ProductionOS artifacts:
 * - Agent definitions have content
 * - Commands have valid YAML frontmatter
 * - Version is consistent across all files
 * - No stale path references
 * - Hook files exist
 */

import { test, expect, describe } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

const ROOT = join(import.meta.dir, "..");

describe("version consistency", () => {
  test("VERSION, plugin.json, and marketplace.json agree", async () => {
    const version = (await readFile(join(ROOT, "VERSION"), "utf-8")).trim();

    const plugin = JSON.parse(
      await readFile(join(ROOT, ".claude-plugin", "plugin.json"), "utf-8")
    );
    expect(plugin.version).toBe(version);

    const market = JSON.parse(
      await readFile(join(ROOT, ".claude-plugin", "marketplace.json"), "utf-8")
    );
    expect(market.plugins[0].version).toBe(version);
  });

  test("SKILL.md references correct major.minor version", async () => {
    const version = (await readFile(join(ROOT, "VERSION"), "utf-8")).trim();
    const majorMinor = version.split(".").slice(0, 2).join(".");

    const skill = await readFile(
      join(ROOT, ".claude", "skills", "productionos", "SKILL.md"),
      "utf-8"
    );
    expect(skill).toContain(`V${majorMinor}`);
  });
});

describe("agent definitions", () => {
  test("agents/ directory exists", () => {
    expect(existsSync(join(ROOT, "agents"))).toBe(true);
  });

  test("all agent files have content (> 50 chars)", async () => {
    const files = await readdir(join(ROOT, "agents"));
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    expect(mdFiles.length).toBeGreaterThan(0);

    for (const f of mdFiles) {
      const content = await readFile(join(ROOT, "agents", f), "utf-8");
      expect(content.trim().length).toBeGreaterThan(50);
    }
  });

  test("all agent files have a markdown heading", async () => {
    const files = await readdir(join(ROOT, "agents"));
    for (const f of files.filter((f) => f.endsWith(".md"))) {
      const content = await readFile(join(ROOT, "agents", f), "utf-8");
      expect(content).toContain("# ");
    }
  });
});

describe("command definitions", () => {
  test("commands/ directory exists", () => {
    expect(existsSync(join(ROOT, ".claude", "commands"))).toBe(true);
  });

  test("all commands have YAML frontmatter", async () => {
    const files = await readdir(join(ROOT, ".claude", "commands"));
    for (const f of files.filter((f) => f.endsWith(".md"))) {
      const content = await readFile(
        join(ROOT, ".claude", "commands", f),
        "utf-8"
      );
      expect(content.startsWith("---")).toBe(true);
      expect(content.indexOf("---", 4)).toBeGreaterThan(4);
    }
  });

  test("all commands have name and description in frontmatter", async () => {
    const files = await readdir(join(ROOT, ".claude", "commands"));
    for (const f of files.filter((f) => f.endsWith(".md"))) {
      const content = await readFile(
        join(ROOT, ".claude", "commands", f),
        "utf-8"
      );
      const fmEnd = content.indexOf("---", 4);
      const fm = content.slice(4, fmEnd);
      expect(fm).toContain("name:");
      expect(fm).toContain("description:");
    }
  });
});

describe("path consistency", () => {
  test("no commands reference stale .productupgrade/ paths", async () => {
    const files = await readdir(join(ROOT, ".claude", "commands"));
    for (const f of files.filter((f) => f.endsWith(".md"))) {
      const content = await readFile(
        join(ROOT, ".claude", "commands", f),
        "utf-8"
      );
      expect(content).not.toContain(".productupgrade/");
    }
  });
});

describe("hooks", () => {
  test("hooks.json is valid JSON", async () => {
    const raw = await readFile(join(ROOT, "hooks", "hooks.json"), "utf-8");
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  test("all referenced hook files exist", async () => {
    const raw = await readFile(join(ROOT, "hooks", "hooks.json"), "utf-8");
    const hooks = JSON.parse(raw);
    const hookObj = hooks.hooks || hooks;

    for (const event of Object.keys(hookObj)) {
      for (const entry of hookObj[event]) {
        for (const hook of entry.hooks || []) {
          if (hook.command) {
            const match = hook.command.match(
              /\$\{CLAUDE_PLUGIN_ROOT\}\/hooks\/([^\s"]+)/
            );
            if (match) {
              expect(existsSync(join(ROOT, "hooks", match[1]))).toBe(true);
            }
          }
        }
      }
    }
  });
});
