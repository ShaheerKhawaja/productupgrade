import { describe, test, expect } from "bun:test";
import {
  ROOT,
  readFileOrNull,
  listMdFiles,
  parseFrontmatter,
} from "../scripts/lib/shared";
import { join } from "path";
import { statSync } from "fs";

// ─── Constants ───────────────────────────────────────────────

const AGENTS_DIR = join(ROOT, "agents");
const agentFiles = listMdFiles(AGENTS_DIR);

/** Claude Code's built-in tool set + deferred tools available in the environment */
const VALID_TOOLS = new Set([
  "Read",
  "Write",
  "Edit",
  "Bash",
  "Glob",
  "Grep",
  "Agent",
  "WebSearch",
  "WebFetch",
]);

/** Read-only agents that must NOT have Write or Edit tools */
const READ_ONLY_AGENTS = new Set(["llm-judge", "adversarial-reviewer"]);

/** Maximum description length in characters (350 allows verbose but bounded descriptions) */
const MAX_DESCRIPTION_LENGTH = 350;

/** Maximum agent file size in bytes (50KB context budget check) */
const MAX_FILE_SIZE_BYTES = 50 * 1024;

// ─── Helpers ─────────────────────────────────────────────────

/** Read all agent contents eagerly */
function readAllAgents(): Map<string, string> {
  const map = new Map<string, string>();
  for (const f of agentFiles) {
    const content = readFileOrNull(join(AGENTS_DIR, f));
    if (content) map.set(f.replace(".md", ""), content);
  }
  return map;
}

const allAgents = readAllAgents();

// ─── Tests ───────────────────────────────────────────────────

describe("Agent Frontmatter Validation", () => {
  test("every agent file has valid frontmatter with name, description, and tools fields", () => {
    const violations: string[] = [];

    for (const [name, content] of allAgents) {
      const fm = parseFrontmatter(content);
      if (!fm) {
        violations.push(`${name}: no frontmatter found`);
        continue;
      }
      if (!fm.name) {
        violations.push(`${name}: missing 'name' field`);
      }
      if (!fm.description) {
        violations.push(`${name}: missing 'description' field`);
      }
      if (!fm.tools) {
        violations.push(`${name}: missing 'tools' field`);
      }
    }

    expect(violations).toEqual([]);
  });

  test("every agent with model: opus or model: sonnet has the model field", () => {
    const violations: string[] = [];

    for (const [name, content] of allAgents) {
      const fm = parseFrontmatter(content);
      if (!fm) continue;

      // Check that if model is present in frontmatter, it is opus or sonnet
      if (fm.model) {
        const model = String(fm.model).trim();
        if (model !== "opus" && model !== "sonnet" && model !== "haiku") {
          violations.push(
            `${name}: model field is '${model}', expected 'opus' or 'sonnet'`
          );
        }
      }

      // Also verify via raw frontmatter block to catch parsing edge cases
      const fmBlock = content.match(/^---\n([\s\S]*?)\n---/);
      if (fmBlock) {
        const rawModelMatch = fmBlock[1].match(/^model:\s*(.+)$/m);
        if (rawModelMatch) {
          const rawModel = rawModelMatch[1].trim();
          if (rawModel !== "opus" && rawModel !== "sonnet" && rawModel !== "haiku") {
            violations.push(
              `${name}: raw model value '${rawModel}' is not opus or sonnet`
            );
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

describe("Agent Structure Validation", () => {
  test("every agent has a <role> section", () => {
    const missing: string[] = [];

    for (const [name, content] of allAgents) {
      if (!content.includes("<role>")) {
        missing.push(name);
      }
    }

    expect(missing).toEqual([]);
  });

  test("every agent has an <instructions> section", () => {
    const missing: string[] = [];

    for (const [name, content] of allAgents) {
      if (!content.includes("<instructions>")) {
        missing.push(name);
      }
    }

    expect(missing).toEqual([]);
  });
});

describe("Agent Tool Safety", () => {
  test("no agent references a tool not in Claude Code's tool set", () => {
    const violations: string[] = [];

    for (const [name, content] of allAgents) {
      const fm = parseFrontmatter(content);
      if (!fm || !fm.tools) continue;

      const tools = fm.tools as string[];
      for (const tool of tools) {
        if (!VALID_TOOLS.has(tool)) {
          violations.push(`${name}: references unknown tool '${tool}'`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  test("read-only agents (llm-judge, adversarial-reviewer) do NOT have Write or Edit in their tools", () => {
    const violations: string[] = [];

    for (const agentName of READ_ONLY_AGENTS) {
      const content = allAgents.get(agentName);
      if (!content) {
        violations.push(`${agentName}: agent file not found`);
        continue;
      }

      const fm = parseFrontmatter(content);
      if (!fm || !fm.tools) {
        violations.push(`${agentName}: no tools found in frontmatter`);
        continue;
      }

      const tools = fm.tools as string[];
      if (tools.includes("Write")) {
        violations.push(`${agentName}: READ-ONLY agent has 'Write' tool`);
      }
      if (tools.includes("Edit")) {
        violations.push(`${agentName}: READ-ONLY agent has 'Edit' tool`);
      }
    }

    expect(violations).toEqual([]);
  });
});

describe("Agent Budget Constraints", () => {
  test("all agent descriptions are under 350 characters", () => {
    const violations: string[] = [];

    for (const [name, content] of allAgents) {
      const fm = parseFrontmatter(content);
      if (!fm || !fm.description) continue;

      const description = String(fm.description);
      if (description.length > MAX_DESCRIPTION_LENGTH) {
        violations.push(
          `${name}: description is ${description.length} chars (max ${MAX_DESCRIPTION_LENGTH})`
        );
      }
    }

    expect(violations).toEqual([]);
  });

  test("no agent file exceeds 50KB (context budget check)", () => {
    const violations: string[] = [];

    for (const f of agentFiles) {
      const filePath = join(AGENTS_DIR, f);
      try {
        const stat = statSync(filePath);
        if (stat.size > MAX_FILE_SIZE_BYTES) {
          const sizeKB = (stat.size / 1024).toFixed(1);
          violations.push(
            `${f}: ${sizeKB}KB exceeds ${MAX_FILE_SIZE_BYTES / 1024}KB limit`
          );
        }
      } catch {
        violations.push(`${f}: unable to stat file`);
      }
    }

    expect(violations).toEqual([]);
  });
});
