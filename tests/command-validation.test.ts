/**
 * Tier 1 command validation — static analysis of all 35 commands.
 * Validates frontmatter, step references, agent references, and structural integrity.
 * Free to run, < 1s.
 */
import { describe, test, expect } from "bun:test";
import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { ROOT, parseFrontmatter } from "../scripts/lib/shared";

const COMMANDS_DIR = join(ROOT, ".claude", "commands");
const AGENTS_DIR = join(ROOT, "agents");
const TEMPLATES_DIR = join(ROOT, "templates");

const commandFiles = readdirSync(COMMANDS_DIR).filter(f => f.endsWith(".md"));
const agentFiles = new Set(
  readdirSync(AGENTS_DIR).filter(f => f.endsWith(".md")).map(f => f.replace(".md", ""))
);

describe("Command Frontmatter Validation", () => {
  test(`found ${commandFiles.length} commands`, () => {
    expect(commandFiles.length).toBeGreaterThanOrEqual(35);
  });

  for (const file of commandFiles) {
    describe(file, () => {
      const content = readFileSync(join(COMMANDS_DIR, file), "utf-8");
      const fm = parseFrontmatter(content);

      test("has valid frontmatter", () => {
        expect(fm).not.toBeNull();
      });

      test("has name field", () => {
        expect(fm?.name).toBeTruthy();
      });

      test("has description field", () => {
        expect(fm?.description).toBeTruthy();
      });

      test("name matches filename", () => {
        const expected = file.replace(".md", "");
        expect(fm?.name).toBe(expected);
      });

      test("has at least 30 lines of content", () => {
        const lines = content.split("\n").length;
        expect(lines).toBeGreaterThanOrEqual(30);
      });

      test("has step structure or is a lifecycle command", () => {
        const lifecycleCommands = ["productionos-help", "productionos-pause", "productionos-resume", "productionos-update"];
        const cmdName = file.replace(".md", "");
        const hasSteps = /## (Step|Phase|Preliminary|Wave|Output|Self-Eval|Instructions|Protocol|Usage)/i.test(content);
        expect(hasSteps || lifecycleCommands.includes(cmdName)).toBe(true);
      });
    });
  }
});

describe("Command-Agent Cross References", () => {
  for (const file of commandFiles) {
    const content = readFileSync(join(COMMANDS_DIR, file), "utf-8");

    // Extract agent references from command content
    const agentRefs = content.match(/agents\/([a-z0-9-]+)\.md/g) ?? [];
    for (const ref of agentRefs) {
      const agentName = ref.replace("agents/", "").replace(".md", "");
      test(`${file} → ${agentName} agent exists`, () => {
        expect(agentFiles.has(agentName)).toBe(true);
      });
    }
  }
});

describe("Template References", () => {
  for (const file of commandFiles) {
    const content = readFileSync(join(COMMANDS_DIR, file), "utf-8");

    // Extract template references
    const templateRefs = content.match(/templates\/([A-Z0-9_-]+\.md)/g) ?? [];
    for (const ref of templateRefs) {
      const templateFile = ref.replace("templates/", "");
      test(`${file} → ${templateFile} template exists`, () => {
        expect(existsSync(join(TEMPLATES_DIR, templateFile))).toBe(true);
      });
    }
  }

  // Most commands should reference PREAMBLE (lifecycle commands exempt)
  const preambleExempt = new Set(["productionos-help", "productionos-pause", "productionos-resume", "productionos-update", "build-productionos", "learn-mode", "agentic-eval", "context-engineer", "deep-research"]);
  for (const file of commandFiles) {
    const cmdName = file.replace(".md", "");
    if (preambleExempt.has(cmdName)) continue;
    const content = readFileSync(join(COMMANDS_DIR, file), "utf-8");
    test(`${file} references PREAMBLE`, () => {
      const hasPreamble = content.includes("PREAMBLE") || content.includes("preamble") || content.includes("Step 0") || content.includes("Preamble");
      expect(hasPreamble).toBe(true);
    });
  }
});

describe("Command Arguments", () => {
  for (const file of commandFiles) {
    const content = readFileSync(join(COMMANDS_DIR, file), "utf-8");

    // Check that arguments section exists in frontmatter if it has user-facing params
    test(`${file} has arguments section or is argument-free`, () => {
      const hasArgSection = content.includes("arguments:");
      const hasNoArgs = !content.match(/\$ARGUMENTS/); // no argument references
      expect(hasArgSection || hasNoArgs).toBe(true);
    });
  }
});
