import { describe, test, expect } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { ROOT } from "../scripts/lib/shared";

const HOOKS_DIR = join(ROOT, "hooks");
const BIN_DIR = join(ROOT, "bin");
const SKILLS_DIR = join(ROOT, ".claude", "skills");
const AGENTS_DIR = join(ROOT, "agents");

// ─── Hook Infrastructure ──────────────────────────────────

describe("Hook Infrastructure", () => {
  test("hooks.json exists and has all 4 hook types", () => {
    const path = join(HOOKS_DIR, "hooks.json");
    expect(existsSync(path)).toBe(true);
    const content = JSON.parse(readFileSync(path, "utf-8"));
    expect(content).toHaveProperty("SessionStart");
    expect(content).toHaveProperty("PreToolUse");
    expect(content).toHaveProperty("PostToolUse");
    expect(content).toHaveProperty("Stop");
  });

  test("all hook scripts referenced in hooks.json exist", () => {
    const hooksJson = JSON.parse(
      readFileSync(join(HOOKS_DIR, "hooks.json"), "utf-8")
    );
    const scriptRefs: string[] = [];

    for (const entries of Object.values(hooksJson) as any[]) {
      if (Array.isArray(entries)) {
        for (const entry of entries) {
          for (const hook of entry.hooks || []) {
            const match = (hook.command || "").match(
              /hooks\/([^\s"]+\.sh)/
            );
            if (match) scriptRefs.push(match[1]);
          }
        }
      }
    }

    for (const script of scriptRefs) {
      expect(existsSync(join(HOOKS_DIR, script))).toBe(true);
    }
    expect(scriptRefs.length).toBeGreaterThanOrEqual(5);
  });

  const REQUIRED_SCRIPTS = [
    "session-start.sh",
    "pre-edit-security.sh",
    "post-edit-telemetry.sh",
    "post-bash-telemetry.sh",
    "post-edit-review-hint.sh",
    "stop-session-handoff.sh",
    "stop-extract-instincts.sh",
    "protected-file-guard.sh",
    "self-learn.sh",
  ];

  test("all required hook scripts exist", () => {
    for (const script of REQUIRED_SCRIPTS) {
      expect(existsSync(join(HOOKS_DIR, script))).toBe(true);
    }
  });

  test("hook scripts use CLAUDE_PLUGIN_ROOT not hardcoded paths", () => {
    const hooksJson = readFileSync(join(HOOKS_DIR, "hooks.json"), "utf-8");
    expect(hooksJson).toContain("CLAUDE_PLUGIN_ROOT");
    expect(hooksJson).not.toContain("~/.claude/plugins/marketplaces");
  });
});

// ─── CLI Tools ────────────────────────────────────────────

describe("CLI Tools", () => {
  const REQUIRED_TOOLS = [
    "pos-init",
    "pos-config",
    "pos-analytics",
    "pos-update-check",
    "pos-review-log",
    "pos-telemetry",
  ];

  test("all CLI tools exist in bin/", () => {
    for (const tool of REQUIRED_TOOLS) {
      expect(existsSync(join(BIN_DIR, tool))).toBe(true);
    }
  });

  test("CLI tools are bash scripts with shebang", () => {
    for (const tool of REQUIRED_TOOLS) {
      const content = readFileSync(join(BIN_DIR, tool), "utf-8");
      expect(content.startsWith("#!/usr/bin/env bash")).toBe(true);
    }
  });
});

// ─── Auto-Activating Skills ──────────────────────────────

describe("Auto-Activating Skills", () => {
  const REQUIRED_SKILLS = [
    "productionos",
    "security-scan",
    "frontend-audit",
    "continuous-learning",
  ];

  for (const skill of REQUIRED_SKILLS) {
    test(`${skill} skill exists with file patterns`, () => {
      const path = join(SKILLS_DIR, skill, "SKILL.md");
      expect(existsSync(path)).toBe(true);
      const content = readFileSync(path, "utf-8");
      expect(content).toContain("filePattern");
      expect(content).toContain("priority");
    });
  }

  test("security-scan has highest priority", () => {
    const content = readFileSync(
      join(SKILLS_DIR, "security-scan", "SKILL.md"),
      "utf-8"
    );
    expect(content).toContain("priority: 95");
  });
});

// ─── Agent Enrichment ─────────────────────────────────────

describe("Agent Declarative Frontmatter", () => {
  const agentFiles = readdirSync(AGENTS_DIR).filter((f) =>
    f.endsWith(".md")
  );

  test("all agents have subagent_type", () => {
    const missing: string[] = [];
    for (const file of agentFiles) {
      const content = readFileSync(join(AGENTS_DIR, file), "utf-8");
      if (!content.includes("subagent_type:")) {
        missing.push(file);
      }
    }
    expect(missing).toEqual([]);
  });

  test("all agents have stakes classification", () => {
    const missing: string[] = [];
    for (const file of agentFiles) {
      const content = readFileSync(join(AGENTS_DIR, file), "utf-8");
      if (!content.includes("stakes:")) {
        missing.push(file);
      }
    }
    expect(missing).toEqual([]);
  });

  test("all agents have model specified", () => {
    const missing: string[] = [];
    for (const file of agentFiles) {
      const content = readFileSync(join(AGENTS_DIR, file), "utf-8");
      if (!content.includes("model:")) {
        missing.push(file);
      }
    }
    expect(missing).toEqual([]);
  });

  test("all agents have Red Flags section", () => {
    const missing: string[] = [];
    for (const file of agentFiles) {
      const content = readFileSync(join(AGENTS_DIR, file), "utf-8");
      if (!content.includes("Red Flags")) {
        missing.push(file);
      }
    }
    expect(missing).toEqual([]);
  });

  test("stakes values are valid (low/medium/high)", () => {
    for (const file of agentFiles) {
      const content = readFileSync(join(AGENTS_DIR, file), "utf-8");
      const match = content.match(/stakes:\s*(\w+)/);
      if (match) {
        expect(["low", "medium", "high"]).toContain(match[1]);
      }
    }
  });

  test("model values are valid (haiku/sonnet/opus)", () => {
    for (const file of agentFiles) {
      const content = readFileSync(join(AGENTS_DIR, file), "utf-8");
      const match = content.match(/model:\s*(\w+)/);
      if (match) {
        expect(["haiku", "sonnet", "opus"]).toContain(match[1]);
      }
    }
  });
});

// ─── Version Consistency ──────────────────────────────────

describe("v6.0 version consistency", () => {
  test("VERSION file says 6.0.0", () => {
    const v = readFileSync(join(ROOT, "VERSION"), "utf-8").trim();
    expect(v).toBe("6.0.0");
  });

  test("CLAUDE.md references v6.0", () => {
    const c = readFileSync(join(ROOT, "CLAUDE.md"), "utf-8");
    expect(c).toContain("6.0");
  });
});
