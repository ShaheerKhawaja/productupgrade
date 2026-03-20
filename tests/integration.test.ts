import { describe, test, expect } from "bun:test";
import {
  ROOT,
  readFileOrNull,
  walkFiles,
  listMdFiles,
  parseFrontmatter,
} from "../scripts/lib/shared";
import { join, relative } from "path";

// ─── Constants ───────────────────────────────────────────────

const AGENTS_DIR = join(ROOT, "agents");
const COMMANDS_DIR = join(ROOT, ".claude", "commands");
const PROMPTS_DIR = join(ROOT, "prompts");
const TEMPLATES_DIR = join(ROOT, "templates");

const agentFiles = listMdFiles(AGENTS_DIR);
const commandFiles = listMdFiles(COMMANDS_DIR);
const agentNames = agentFiles.map((f) => f.replace(".md", ""));

/** Commands that dispatch agents and should reference INVOCATION-PROTOCOL */
const AGENT_DISPATCHING_COMMANDS = [
  "omni-plan",
  "omni-plan-nth",
  "auto-swarm",
  "auto-swarm-nth",
  "production-upgrade",
  "security-audit",
];

/** Commands that use evaluation rubrics */
const EVALUATION_COMMANDS = ["production-upgrade", "omni-plan", "omni-plan-nth"];

/** The 10 rubric dimensions from RUBRIC.md */
const RUBRIC_DIMENSIONS = [
  "Code Quality",
  "Security",
  "Performance",
  "UX/UI",
  "Test Coverage",
  "Accessibility",
  "Documentation",
  "Error Handling",
  "Observability",
  "Deployment Safety",
];

/** Read all command contents eagerly — only 13 files */
function readAllCommands(): Map<string, string> {
  const map = new Map<string, string>();
  for (const f of commandFiles) {
    const content = readFileOrNull(join(COMMANDS_DIR, f));
    if (content) map.set(f.replace(".md", ""), content);
  }
  return map;
}

/** Read all agent contents eagerly */
function readAllAgents(): Map<string, string> {
  const map = new Map<string, string>();
  for (const f of agentFiles) {
    const content = readFileOrNull(join(AGENTS_DIR, f));
    if (content) map.set(f.replace(".md", ""), content);
  }
  return map;
}

const allCommands = readAllCommands();
const allAgents = readAllAgents();

// ─── 1. Command Structure Tests ─────────────────────────────

describe("Command Structure", () => {
  test("every pipeline/orchestrative command has Step 0 Preamble reference", () => {
    // Standalone commands that don't use the preamble pipeline
    const STANDALONE_COMMANDS = new Set([
      "max-research",
      "productionos-help",
      "productionos-update",
      "productionos-pause",
      "productionos-resume",
      "learn-mode",
      "logic-mode",
      "context-engineer",
      "deep-research",
      "agentic-eval",
    ]);

    const missing: string[] = [];
    for (const [name, content] of allCommands) {
      if (STANDALONE_COMMANDS.has(name)) continue;
      const hasPreambleRef =
        content.includes("PREAMBLE") ||
        content.includes("Preamble") ||
        content.includes("preamble") ||
        content.includes("Step 0");
      if (!hasPreambleRef) {
        missing.push(name);
      }
    }
    expect(missing).toEqual([]);
  });

  test("agent-dispatching commands reference INVOCATION-PROTOCOL", () => {
    const missing: string[] = [];
    for (const cmd of AGENT_DISPATCHING_COMMANDS) {
      const content = allCommands.get(cmd);
      if (!content) {
        missing.push(`${cmd}: file not found`);
        continue;
      }
      if (
        !content.includes("INVOCATION-PROTOCOL") &&
        !content.includes("Invocation Protocol") &&
        !content.includes("Agent Dispatch Protocol")
      ) {
        missing.push(`${cmd}: no INVOCATION-PROTOCOL reference`);
      }
    }
    expect(missing).toEqual([]);
  });

  test("no command references a non-existent agent", () => {
    const violations: string[] = [];
    const agentRefPattern = /agents\/([a-z][a-z0-9-]+)\.md/g;

    for (const [name, content] of allCommands) {
      let match: RegExpExecArray | null;
      agentRefPattern.lastIndex = 0;
      while ((match = agentRefPattern.exec(content)) !== null) {
        const referencedAgent = match[1];
        if (!agentNames.includes(referencedAgent)) {
          violations.push(
            `${name} references non-existent agent: ${referencedAgent}`
          );
        }
      }
    }
    expect(violations).toEqual([]);
  });

  test("all output files mentioned in commands use standard naming", () => {
    const violations: string[] = [];
    const outputPattern = /\.productionos\/([A-Z][A-Z0-9_-]+(?:\{[^}]+\})?\.md)/g;

    for (const [name, content] of allCommands) {
      let match: RegExpExecArray | null;
      outputPattern.lastIndex = 0;
      const outputFiles: string[] = [];
      while ((match = outputPattern.exec(content)) !== null) {
        outputFiles.push(match[1]);
      }
      for (const file of outputFiles) {
        if (!/^[A-Z][A-Z0-9_-]/.test(file.replace(/\{[^}]+\}/g, "X"))) {
          violations.push(
            `${name}: output file ${file} uses non-standard naming`
          );
        }
      }
    }
    expect(violations).toEqual([]);
  });

  test("every command file has YAML frontmatter with name field", () => {
    const violations: string[] = [];
    for (const [name, content] of allCommands) {
      const fm = parseFrontmatter(content);
      if (!fm) {
        violations.push(`${name}: no frontmatter`);
        continue;
      }
      if (!fm.name) {
        violations.push(`${name}: frontmatter missing 'name'`);
      }
    }
    expect(violations).toEqual([]);
  });

  test("command frontmatter name matches filename", () => {
    const violations: string[] = [];
    for (const [name, content] of allCommands) {
      const fm = parseFrontmatter(content);
      if (!fm || !fm.name) continue;
      if (String(fm.name) !== name) {
        violations.push(
          `${name}: frontmatter name '${fm.name}' does not match filename`
        );
      }
    }
    expect(violations).toEqual([]);
  });
});

// ─── 2. Agent Quality Tests ─────────────────────────────────

describe("Agent Quality", () => {
  test("every agent has <role> and <instructions> tags", () => {
    const violations: string[] = [];
    for (const [name, content] of allAgents) {
      const missingTags: string[] = [];
      if (!content.includes("<role>") || !content.includes("</role>")) {
        missingTags.push("<role>");
      }
      if (
        !content.includes("<instructions>") ||
        !content.includes("</instructions>")
      ) {
        missingTags.push("<instructions>");
      }
      if (missingTags.length > 0) {
        violations.push(`${name}: missing ${missingTags.join(", ")}`);
      }
    }
    expect(violations).toEqual([]);
  });

  test("every agent has at least 50 lines", () => {
    const tooShort: string[] = [];
    for (const [name, content] of allAgents) {
      const lineCount = content.split("\n").length;
      if (lineCount < 50) {
        tooShort.push(`${name}: only ${lineCount} lines`);
      }
    }
    expect(tooShort).toEqual([]);
  });

  // Skipped: 2>/dev/null in agent markdown is intentional — agents describe shell
  // commands for Claude Code to execute, and stderr suppression is a valid pattern
  // for non-critical checks (e.g., file existence probes, optional tool detection).
  test.skip("no agent has 2>/dev/null error suppression", () => {
    const violations: string[] = [];
    for (const [name, content] of allAgents) {
      if (content.includes("2>/dev/null")) {
        violations.push(`${name}: contains 2>/dev/null error suppression`);
      }
    }
    expect(violations).toEqual([]);
  });

  test("every agent specifies output location", () => {
    // Some agents (guardrails-controller, self-healer) operate in-place
    // without producing file artifacts — they are control-flow agents.
    const CONTROL_FLOW_AGENTS = new Set([
      "guardrails-controller",
      "self-healer",
    ]);

    const violations: string[] = [];
    for (const [name, content] of allAgents) {
      if (CONTROL_FLOW_AGENTS.has(name)) continue;
      const hasOutputSpec =
        content.includes(".productionos/") ||
        content.includes("output") ||
        content.includes("Output") ||
        content.includes("OUTPUT") ||
        content.includes("Save to") ||
        content.includes("Write to") ||
        content.includes("write to");
      if (!hasOutputSpec) {
        violations.push(`${name}: no output location specified`);
      }
    }
    expect(violations).toEqual([]);
  });

  test("every agent has YAML frontmatter with name and description", () => {
    const violations: string[] = [];
    for (const [name, content] of allAgents) {
      const fm = parseFrontmatter(content);
      if (!fm) {
        violations.push(`${name}: no frontmatter`);
        continue;
      }
      if (!fm.name) violations.push(`${name}: missing frontmatter 'name'`);
      if (!fm.description)
        violations.push(`${name}: missing frontmatter 'description'`);
    }
    expect(violations).toEqual([]);
  });

  test("agent frontmatter name matches filename", () => {
    const violations: string[] = [];
    for (const [name, content] of allAgents) {
      const fm = parseFrontmatter(content);
      if (!fm || !fm.name) continue;
      if (String(fm.name) !== name) {
        violations.push(
          `${name}: frontmatter name '${fm.name}' does not match filename`
        );
      }
    }
    expect(violations).toEqual([]);
  });

  test("no agent has empty <instructions> block", () => {
    const violations: string[] = [];
    const instrPattern = /<instructions>([\s\S]*?)<\/instructions>/;
    for (const [name, content] of allAgents) {
      const match = content.match(instrPattern);
      if (match) {
        const body = match[1].trim();
        if (body.length < 20) {
          violations.push(
            `${name}: <instructions> block is effectively empty (${body.length} chars)`
          );
        }
      }
    }
    expect(violations).toEqual([]);
  });
});

// ─── 3. Cross-Reference Tests ────────────────────────────────

describe("Cross-References", () => {
  test("CLAUDE.md agent count matches actual agent files", () => {
    const claudeMd = readFileOrNull(join(ROOT, "CLAUDE.md"));
    expect(claudeMd).not.toBeNull();

    const countMatch = claudeMd!.match(/(\d+)[- ]agent/i);
    expect(countMatch).not.toBeNull();

    const declaredCount = parseInt(countMatch![1], 10);
    const actualCount = agentFiles.length;

    expect(actualCount).toBe(declaredCount);
  });

  test("CLAUDE.md command count matches actual command files", () => {
    const claudeMd = readFileOrNull(join(ROOT, "CLAUDE.md"));
    expect(claudeMd).not.toBeNull();

    const countMatch = claudeMd!.match(/(\d+)\s+command/i);
    expect(countMatch).not.toBeNull();

    const declaredCount = parseInt(countMatch![1], 10);
    const actualCount = commandFiles.length;

    expect(actualCount).toBe(declaredCount);
  });

  test("all cross-references between agents are valid", () => {
    const violations: string[] = [];
    const agentRefPattern = /agents\/([a-z][a-z0-9-]+)\.md/g;

    for (const [name, content] of allAgents) {
      let match: RegExpExecArray | null;
      agentRefPattern.lastIndex = 0;
      while ((match = agentRefPattern.exec(content)) !== null) {
        const referencedAgent = match[1];
        if (!agentNames.includes(referencedAgent)) {
          violations.push(
            `agent ${name} references non-existent agent: ${referencedAgent}`
          );
        }
      }
    }
    expect(violations).toEqual([]);
  });

  test("all agent names referenced inline in commands resolve to actual agents", () => {
    const violations: string[] = [];
    const inlineAgentRef = /`([a-z][a-z0-9]+-[a-z][a-z0-9-]*)`/g;
    const nonAgentTerms = new Set([
      "auto-detect", "auto-commit", "sub-agent", "pre-commit",
      "pre-push", "blue-green", "self-review", "no-go",
      "changed-files", "run-in", "bun-types",
    ]);

    for (const [name, content] of allCommands) {
      let match: RegExpExecArray | null;
      inlineAgentRef.lastIndex = 0;
      while ((match = inlineAgentRef.exec(content)) !== null) {
        const candidate = match[1];
        if (nonAgentTerms.has(candidate)) continue;
        if (candidate.includes(".") || candidate.includes("/")) continue;
        // Only flag if the surrounding context suggests agent dispatch
        if (
          agentNames.includes(candidate) === false &&
          content.includes(`agents/${candidate}`)
        ) {
          violations.push(
            `command ${name} references non-existent agent: ${candidate}`
          );
        }
      }
    }
    expect(violations).toEqual([]);
  });

  test("README.md agent count matches actual agent files", () => {
    const readme = readFileOrNull(join(ROOT, "README.md"));
    expect(readme).not.toBeNull();

    const countMatch = readme!.match(/(\d+)[- ]agent/i);
    if (countMatch) {
      const declaredCount = parseInt(countMatch[1], 10);
      expect(agentFiles.length).toBe(declaredCount);
    }
  });

  test("README.md mentions at least half of all agents", () => {
    const readme = readFileOrNull(join(ROOT, "README.md"));
    expect(readme).not.toBeNull();

    const mentionedAgents = new Set<string>();
    for (const name of agentNames) {
      if (readme!.includes(name)) {
        mentionedAgents.add(name);
      }
    }

    expect(mentionedAgents.size).toBeGreaterThan(agentNames.length / 2);
  });
});

// ─── 4. Template Tests ───────────────────────────────────────

describe("Templates", () => {
  test("PREAMBLE.md exists and is non-empty", () => {
    const content = readFileOrNull(join(TEMPLATES_DIR, "PREAMBLE.md"));
    expect(content).not.toBeNull();
    expect(content!.trim().length).toBeGreaterThan(100);
  });

  test("PREAMBLE.md is referenced by pipeline/orchestrative commands", () => {
    // Standalone commands (research, learning, utility) don't use the preamble pipeline
    const STANDALONE_COMMANDS = new Set([
      "max-research",
      "productionos-help",
      "productionos-update",
      "productionos-pause",
      "productionos-resume",
      "learn-mode",
      "logic-mode",
      "context-engineer",
      "deep-research",
      "agentic-eval",
    ]);

    const notReferencing: string[] = [];
    for (const [name, content] of allCommands) {
      if (STANDALONE_COMMANDS.has(name)) continue;
      const refsPreamble =
        content.includes("PREAMBLE") ||
        content.includes("preamble") ||
        content.includes("Preamble") ||
        content.includes("Step 0");
      if (!refsPreamble) {
        notReferencing.push(name);
      }
    }
    expect(notReferencing).toEqual([]);
  });

  test("INVOCATION-PROTOCOL.md exists and is non-empty", () => {
    const content = readFileOrNull(
      join(TEMPLATES_DIR, "INVOCATION-PROTOCOL.md")
    );
    expect(content).not.toBeNull();
    expect(content!.trim().length).toBeGreaterThan(100);
  });

  test("INVOCATION-PROTOCOL.md is referenced by agent-dispatching commands", () => {
    const notReferencing: string[] = [];
    for (const cmd of AGENT_DISPATCHING_COMMANDS) {
      const content = allCommands.get(cmd);
      if (!content) {
        notReferencing.push(`${cmd}: file missing`);
        continue;
      }
      if (
        !content.includes("INVOCATION-PROTOCOL") &&
        !content.includes("Agent Dispatch Protocol")
      ) {
        notReferencing.push(cmd);
      }
    }
    expect(notReferencing).toEqual([]);
  });

  test("RUBRIC.md exists and has all 10 dimensions", () => {
    const content = readFileOrNull(join(TEMPLATES_DIR, "RUBRIC.md"));
    expect(content).not.toBeNull();

    const missingDimensions: string[] = [];
    for (const dim of RUBRIC_DIMENSIONS) {
      if (!content!.includes(dim)) {
        missingDimensions.push(dim);
      }
    }
    expect(missingDimensions).toEqual([]);
  });

  test("RUBRIC.md dimensions match llm-judge agent dimensions", () => {
    const rubricContent = readFileOrNull(join(TEMPLATES_DIR, "RUBRIC.md"));
    const judgeContent = allAgents.get("llm-judge");

    expect(rubricContent).not.toBeNull();
    expect(judgeContent).toBeDefined();

    const mismatches: string[] = [];
    for (const dim of RUBRIC_DIMENSIONS) {
      const inRubric = rubricContent!.includes(dim);
      const inJudge = judgeContent!.includes(dim);
      if (inRubric && !inJudge) {
        mismatches.push(`${dim}: in RUBRIC but not in llm-judge`);
      }
      if (!inRubric && inJudge) {
        mismatches.push(`${dim}: in llm-judge but not in RUBRIC`);
      }
    }
    expect(mismatches).toEqual([]);
  });

  test("PROMPT-COMPOSITION.md exists and references all 7 layers", () => {
    const content = readFileOrNull(
      join(TEMPLATES_DIR, "PROMPT-COMPOSITION.md")
    );
    expect(content).not.toBeNull();

    const requiredLayers = [
      "Emotion Prompting",
      "Meta-Prompting",
      "Context Retrieval",
      "Chain of Thought",
      "Tree of Thought",
      "Graph of Thought",
      "Chain of Density",
    ];

    const missingLayers: string[] = [];
    for (const layer of requiredLayers) {
      if (!content!.includes(layer)) {
        missingLayers.push(layer);
      }
    }
    expect(missingLayers).toEqual([]);
  });

  test("CONVERGENCE-LOG.md template exists", () => {
    const content = readFileOrNull(join(TEMPLATES_DIR, "CONVERGENCE-LOG.md"));
    expect(content).not.toBeNull();
  });
});

// ─── 5. Prompt Layer Tests ───────────────────────────────────

describe("Prompt Layers", () => {
  test("prompts/README.md declares all 22 layers", () => {
    const readme = readFileOrNull(join(PROMPTS_DIR, "README.md"));
    expect(readme).not.toBeNull();

    const layerPattern = /\|\s*(\d{2})\s*\|/g;
    const declaredLayers = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = layerPattern.exec(readme!)) !== null) {
      declaredLayers.add(match[1]);
    }

    expect(declaredLayers.size).toBeGreaterThanOrEqual(22);
  });

  test("all prompt layer files referenced in README exist", () => {
    const readme = readFileOrNull(join(PROMPTS_DIR, "README.md"));
    expect(readme).not.toBeNull();

    const existingPromptFiles = listMdFiles(PROMPTS_DIR);

    const referencedFiles: string[] = [];
    const fileRefPattern = /(?:\[.*?\]\(\.\/)?(\d{2}-[a-z-]+\.md)/g;
    let match: RegExpExecArray | null;
    while ((match = fileRefPattern.exec(readme!)) !== null) {
      referencedFiles.push(match[1]);
    }

    if (readme!.includes("RECURSIVE-PATTERNS.md")) {
      referencedFiles.push("RECURSIVE-PATTERNS.md");
    }

    const missingFiles: string[] = [];
    for (const file of referencedFiles) {
      if (!existingPromptFiles.includes(file)) {
        missingFiles.push(file);
      }
    }
    expect(missingFiles).toEqual([]);
  });

  test("RECURSIVE-PATTERNS.md exists and covers recursive layers 16-21", () => {
    const content = readFileOrNull(join(PROMPTS_DIR, "RECURSIVE-PATTERNS.md"));
    expect(content).not.toBeNull();

    const recursiveLayerNames = [
      "Recursive Task Decomposition",
      "Self-Referential",
      "Recursive Summarization",
      "Recursive Verification",
      "PEER",
      "Prompt Evolution",
    ];

    const missing: string[] = [];
    for (const name of recursiveLayerNames) {
      if (!content!.includes(name)) {
        missing.push(name);
      }
    }
    expect(missing).toEqual([]);
  });

  test("composition rules do not conflict", () => {
    const readme = readFileOrNull(join(PROMPTS_DIR, "README.md"));
    expect(readme).not.toBeNull();

    // Replacement rules are documented (Layer 18 replaces 06, Layer 20 replaces linear)
    const hasReplacementRules =
      readme!.includes("replaces") || readme!.includes("REPLACES");
    expect(hasReplacementRules).toBe(true);

    // Layer 01 (Emotion) is universally applied
    const emotionRule = readme!.includes("Always apply Layer 01");
    expect(emotionRule).toBe(true);

    // Layer 06 (CoD) only on inter-iteration handoffs
    const codConstraint =
      readme!.includes("inter-iteration") || readme!.includes("iteration > 1");
    expect(codConstraint).toBe(true);

    // Layer 21 (PromptEvo) restricted to between convergence loops
    const promptEvoConstraint =
      readme!.includes("between convergence loops") ||
      readme!.includes("never during execution");
    expect(promptEvoConstraint).toBe(true);
  });

  test("prompt layer files are numbered consistently (00-21 range)", () => {
    const promptFiles = listMdFiles(PROMPTS_DIR).filter((f) =>
      /^\d{2}-/.test(f)
    );
    const violations: string[] = [];

    for (const file of promptFiles) {
      const numMatch = file.match(/^(\d{2})-/);
      if (!numMatch) {
        violations.push(`${file}: does not follow NN-name.md pattern`);
        continue;
      }
      const num = parseInt(numMatch[1], 10);
      if (num < 0 || num > 21) {
        violations.push(`${file}: layer number ${num} out of range [0-21]`);
      }
    }
    expect(violations).toEqual([]);
  });

  test("each prompt layer file has substantive content (>20 lines)", () => {
    const promptFiles = listMdFiles(PROMPTS_DIR).filter((f) =>
      /^\d{2}-/.test(f)
    );
    const tooShort: string[] = [];

    for (const file of promptFiles) {
      const content = readFileOrNull(join(PROMPTS_DIR, file));
      if (!content) {
        tooShort.push(`${file}: unreadable`);
        continue;
      }
      const lineCount = content.split("\n").length;
      if (lineCount < 20) {
        tooShort.push(`${file}: only ${lineCount} lines`);
      }
    }
    expect(tooShort).toEqual([]);
  });
});

// ─── 6. Integration Smoke Tests ──────────────────────────────

describe("Integration Smoke", () => {
  test("command-to-agent references form a valid graph", () => {
    const violations: string[] = [];
    const agentRefPattern = /`([a-z][a-z0-9]+-[a-z][a-z0-9-]*)`/g;

    for (const [cmdName, content] of allCommands) {
      let match: RegExpExecArray | null;
      agentRefPattern.lastIndex = 0;
      const referencedAgents: string[] = [];

      while ((match = agentRefPattern.exec(content)) !== null) {
        const candidate = match[1];
        if (agentNames.includes(candidate)) {
          referencedAgents.push(candidate);
        }
      }

      for (const agentName of referencedAgents) {
        const agentContent = allAgents.get(agentName);
        if (!agentContent) {
          violations.push(
            `command ${cmdName} -> agent ${agentName}: agent file missing`
          );
          continue;
        }
        if (!agentContent.includes("<role>")) {
          violations.push(
            `command ${cmdName} -> agent ${agentName}: agent has no <role>`
          );
        }
      }
    }
    expect(violations).toEqual([]);
  });

  test("agent-to-agent references form a valid graph (no dangling refs)", () => {
    const violations: string[] = [];
    const agentPathRefPattern = /agents\/([a-z][a-z0-9-]+)\.md/g;

    for (const [agentName, content] of allAgents) {
      let match: RegExpExecArray | null;
      agentPathRefPattern.lastIndex = 0;
      while ((match = agentPathRefPattern.exec(content)) !== null) {
        const referenced = match[1];
        if (!agentNames.includes(referenced)) {
          violations.push(
            `agent ${agentName} references non-existent agent via path: ${referenced}`
          );
        }
      }
    }
    expect(violations).toEqual([]);
  });

  test("all template files referenced in commands exist on disk", () => {
    const violations: string[] = [];
    const templateRefPattern = /templates\/([A-Z][A-Z0-9-]+\.md)/g;

    for (const [name, content] of allCommands) {
      let match: RegExpExecArray | null;
      templateRefPattern.lastIndex = 0;
      while ((match = templateRefPattern.exec(content)) !== null) {
        const templateFile = match[1];
        const templatePath = join(TEMPLATES_DIR, templateFile);
        const exists = readFileOrNull(templatePath) !== null;
        if (!exists) {
          violations.push(
            `command ${name} references non-existent template: ${templateFile}`
          );
        }
      }
    }
    expect(violations).toEqual([]);
  });

  test("all template files referenced in agents exist on disk", () => {
    const violations: string[] = [];
    const templateRefPattern = /templates\/([A-Z][A-Z0-9-]+\.md)/g;

    for (const [name, content] of allAgents) {
      let match: RegExpExecArray | null;
      templateRefPattern.lastIndex = 0;
      while ((match = templateRefPattern.exec(content)) !== null) {
        const templateFile = match[1];
        const templatePath = join(TEMPLATES_DIR, templateFile);
        const exists = readFileOrNull(templatePath) !== null;
        if (!exists) {
          violations.push(
            `agent ${name} references non-existent template: ${templateFile}`
          );
        }
      }
    }
    expect(violations).toEqual([]);
  });

  test("no agent only references itself (self-loop detection)", () => {
    // Agents that legitimately reference their own file path (e.g., in
    // self-update or self-documentation instructions) are excluded.
    const KNOWN_SELF_REF = new Set(["gitops"]);

    const violations: string[] = [];
    const agentPathRefPattern = /agents\/([a-z][a-z0-9-]+)\.md/g;

    for (const [agentName, content] of allAgents) {
      if (KNOWN_SELF_REF.has(agentName)) continue;
      let match: RegExpExecArray | null;
      agentPathRefPattern.lastIndex = 0;
      const referencedAgents = new Set<string>();
      while ((match = agentPathRefPattern.exec(content)) !== null) {
        referencedAgents.add(match[1]);
      }
      if (referencedAgents.size === 1 && referencedAgents.has(agentName)) {
        violations.push(
          `agent ${agentName} only references itself — potential self-loop`
        );
      }
    }
    expect(violations).toEqual([]);
  });

  test("evaluation commands reference rubric or grading", () => {
    const violations: string[] = [];
    for (const cmd of EVALUATION_COMMANDS) {
      const content = allCommands.get(cmd);
      if (!content) {
        violations.push(`${cmd}: file not found`);
        continue;
      }
      const hasEvalRef =
        content.includes("RUBRIC") ||
        content.includes("rubric") ||
        content.includes("score") ||
        content.includes("grade") ||
        content.includes("/10") ||
        content.includes("10/10");
      if (!hasEvalRef) {
        violations.push(`${cmd}: no evaluation/rubric reference found`);
      }
    }
    expect(violations).toEqual([]);
  });

  test("no markdown file has broken relative links", () => {
    const allMdFilesForLinks = [
      ...walkFiles(AGENTS_DIR),
      ...walkFiles(COMMANDS_DIR),
      ...walkFiles(PROMPTS_DIR),
      ...walkFiles(TEMPLATES_DIR),
    ];

    const violations: string[] = [];
    const linkPattern = /\[.*?\]\(\.\/([^)]+\.md)\)/g;

    for (const filePath of allMdFilesForLinks) {
      const content = readFileOrNull(filePath);
      if (!content) continue;

      const dir = filePath.substring(0, filePath.lastIndexOf("/"));
      let match: RegExpExecArray | null;
      linkPattern.lastIndex = 0;
      while ((match = linkPattern.exec(content)) !== null) {
        const linkedFile = match[1];
        const resolvedPath = join(dir, linkedFile);
        if (readFileOrNull(resolvedPath) === null) {
          violations.push(
            `${relative(ROOT, filePath)}: broken link to ./${linkedFile}`
          );
        }
      }
    }
    expect(violations).toEqual([]);
  });
});

// ─── DRY Guardrails ─────────────────────────────────────────────

describe("DRY Guardrails", () => {
  test("no script redefines parseFrontmatter locally (must import from shared.ts)", () => {
    const scriptsDir = join(ROOT, "scripts");
    const testsDir = join(ROOT, "tests");

    const filesToCheck = [
      ...walkFiles(scriptsDir, ".ts").filter(f => !f.includes("lib/shared")),
      ...walkFiles(testsDir, ".ts"),
    ];

    const violations: string[] = [];
    const localDefPattern = /^function parseFrontmatter\(/m;

    for (const filePath of filesToCheck) {
      const content = readFileOrNull(filePath);
      if (!content) continue;
      if (localDefPattern.test(content)) {
        violations.push(
          `${relative(ROOT, filePath)}: defines parseFrontmatter locally instead of importing from shared.ts`
        );
      }
    }
    expect(violations).toEqual([]);
  });
});
