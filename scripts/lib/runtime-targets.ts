import { mkdirSync, readdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { listMdFiles, parseFrontmatter, readFileOrNull, readVersion, ROOT, walkFiles } from "./shared";

export type RuntimeTargetId = "claude-plugin" | "codex-cli" | "codex-app";

export interface WorkflowParitySpec {
  id: string;
  sourceCommand: string;
  summary: string;
  codexBehavior: string;
  validation: string[];
  targets: RuntimeTargetId[];
}

export interface RepoCounts {
  agents: number;
  commands: number;
  hooks: number;
  templates: number;
  tests: number;
  scripts: number;
  skills: number;
}

export interface GeneratedTargetFile {
  path: string;
  content: string;
}

interface CommandSkillSpec {
  name: string;
  aliasName: string;
  description: string;
  sourcePath: string;
  arguments: Array<{
    name: string;
    description: string;
    required: boolean;
    defaultValue?: string;
  }>;
  steps: string[];
  agents: string[];
  templates: string[];
  artifacts: string[];
  guardrails: string[];
}

export const PRODUCT_NAME = "ProductionOS";
export const PRODUCT_SLUG = "productionos";
export const PRODUCT_REPOSITORY = "https://github.com/ShaheerKhawaja/ProductionOS";
export const PRODUCT_AUTHOR = {
  name: "Shaheer Khawaja",
  url: "https://github.com/ShaheerKhawaja",
};

export const WORKFLOW_PARITY: WorkflowParitySpec[] = [
  {
    id: "production-upgrade",
    sourceCommand: ".claude/commands/production-upgrade.md",
    summary: "Repo-wide audit, planning, fix batching, and validation loop.",
    codexBehavior:
      "Run a repo audit, prioritize high-leverage defects, implement bounded fixes, then validate before reporting.",
    validation: ["tests/runtime-targets.test.ts", "tests/behavioral.test.ts"],
    targets: ["claude-plugin", "codex-cli", "codex-app"],
  },
  {
    id: "review",
    sourceCommand: ".claude/commands/review.md",
    summary: "Findings-first review focused on bugs, risk, and regressions.",
    codexBehavior: "Use Codex in review mode and report concrete findings before summaries.",
    validation: ["tests/runtime-targets.test.ts"],
    targets: ["claude-plugin", "codex-cli", "codex-app"],
  },
  {
    id: "plan-ceo-review",
    sourceCommand: ".claude/commands/plan-ceo-review.md",
    summary: "Strategic scope review, user value challenge, and product ambition check.",
    codexBehavior: "Challenge scope, tighten user value, and surface expansion opportunities explicitly.",
    validation: ["tests/runtime-targets.test.ts"],
    targets: ["claude-plugin", "codex-cli", "codex-app"],
  },
  {
    id: "plan-eng-review",
    sourceCommand: ".claude/commands/plan-eng-review.md",
    summary: "Architecture, edge-case, test, and delivery review.",
    codexBehavior: "Lock architecture, trust boundaries, error paths, and test coverage before implementation.",
    validation: ["tests/runtime-targets.test.ts"],
    targets: ["claude-plugin", "codex-cli", "codex-app"],
  },
  {
    id: "security-audit",
    sourceCommand: ".claude/commands/security-audit.md",
    summary: "OWASP/MITRE/NIST-oriented security sweep across the codebase.",
    codexBehavior: "Inspect auth, secrets, input handling, and deployment risk with findings-first output.",
    validation: ["tests/runtime-targets.test.ts"],
    targets: ["claude-plugin", "codex-cli", "codex-app"],
  },
  {
    id: "designer-upgrade",
    sourceCommand: ".claude/commands/designer-upgrade.md",
    summary: "Design audit, system creation, mockups, and implementation plan.",
    codexBehavior: "Build a UX audit and redesign plan, then route into interface work when needed.",
    validation: ["tests/runtime-targets.test.ts"],
    targets: ["claude-plugin", "codex-cli", "codex-app"],
  },
  {
    id: "ux-genie",
    sourceCommand: ".claude/commands/ux-genie.md",
    summary: "User-story, journey, and friction mapping workflow.",
    codexBehavior: "Map user flows, identify friction, and translate findings into concrete improvements.",
    validation: ["tests/runtime-targets.test.ts"],
    targets: ["claude-plugin", "codex-cli", "codex-app"],
  },
  {
    id: "auto-swarm",
    sourceCommand: ".claude/commands/auto-swarm.md",
    summary: "Parallel task distribution and wave-based execution protocol.",
    codexBehavior:
      "Run the workflow serially by default in Codex, or delegate only when the user explicitly wants parallel work.",
    validation: ["tests/runtime-targets.test.ts"],
    targets: ["claude-plugin", "codex-cli", "codex-app"],
  },
  {
    id: "auto-swarm-nth",
    sourceCommand: ".claude/commands/auto-swarm-nth.md",
    summary: "Recursive swarm orchestration until coverage and quality thresholds are met.",
    codexBehavior:
      "Repeat swarm-style execution until gaps close, while translating agent waves into Codex-native orchestration.",
    validation: ["tests/runtime-targets.test.ts"],
    targets: ["claude-plugin", "codex-cli", "codex-app"],
  },
  {
    id: "omni-plan",
    sourceCommand: ".claude/commands/omni-plan.md",
    summary: "Full multi-step orchestration pipeline for planning and execution.",
    codexBehavior: "Chain the major review and execution patterns in a Codex-native sequence without Claude-only assumptions.",
    validation: ["tests/runtime-targets.test.ts"],
    targets: ["claude-plugin", "codex-cli", "codex-app"],
  },
  {
    id: "omni-plan-nth",
    sourceCommand: ".claude/commands/omni-plan-nth.md",
    summary: "Recursive top-level orchestrator aiming for production-ready convergence.",
    codexBehavior: "Iterate the full orchestration loop until quality targets are met or clearly plateau.",
    validation: ["tests/runtime-targets.test.ts"],
    targets: ["claude-plugin", "codex-cli", "codex-app"],
  },
];

export function collectRepoCounts(): RepoCounts {
  const hookFiles = readdirSync(join(ROOT, "hooks")).filter((entry) => !entry.startsWith("."));
  const templateFiles = readdirSync(join(ROOT, "templates")).filter((entry) => !entry.startsWith("."));
  const skillFiles = [
    ...walkFiles(join(ROOT, ".claude", "skills"), ".md"),
    ...walkFiles(join(ROOT, "skills"), ".md"),
  ].filter((file) => file.endsWith("SKILL.md"));

  return {
    agents: listMdFiles(join(ROOT, "agents")).length,
    commands: listMdFiles(join(ROOT, ".claude", "commands")).length,
    hooks: hookFiles.length,
    templates: templateFiles.length,
    tests: readdirSync(join(ROOT, "tests")).filter((entry) => entry.endsWith(".ts")).length,
    scripts: readdirSync(join(ROOT, "scripts")).filter((entry) => entry.endsWith(".ts")).length,
    skills: skillFiles.length,
  };
}

function renderWorkflowBullets(): string {
  return WORKFLOW_PARITY.map(
    (workflow) =>
      `- \`${workflow.id}\` — ${workflow.codexBehavior}`,
  ).join("\n");
}

function docLinkFromDocs(pathFromRepoRoot: string): string {
  return `../${pathFromRepoRoot}`;
}

function docLinkFromSkill(skillPath: string, repoPath: string): string {
  const depth = skillPath.split("/").length - 1;
  const prefix = "../".repeat(depth);
  return `${prefix}${repoPath}`;
}

function extractCommandArguments(content: string): CommandSkillSpec["arguments"] {
  const args = [...content.matchAll(
    /-\s+name:\s*([^\n]+)\n\s+description:\s*"([^"]+)"\n\s+required:\s*(true|false)(?:\n\s+default:\s*"([^"]*)")?/g,
  )].map((match) => ({
    name: match[1].trim(),
    description: match[2].trim(),
    required: match[3] === "true",
    defaultValue: match[4]?.trim() || undefined,
  }));

  return args;
}

function extractSection(content: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = content.match(new RegExp(`^## ${escaped}\\n([\\s\\S]*?)(?=^## |\\Z)`, "m"));
  return match?.[1]?.trim() || "";
}

function extractStepHeadings(content: string): string[] {
  const steps = [...content.matchAll(/^##\s+Step\s+\d+(?::|\s+)?\s*(.+)$/gm)]
    .map((match) => match[1].trim())
    .filter(Boolean);

  return steps.length > 0 ? steps : ["Follow the source command sections in order and preserve its exit criteria."];
}

function extractAgents(content: string): string[] {
  const matches = [
    ...content.matchAll(/agents\/([a-z0-9-]+)\.md/g),
    ...content.matchAll(/Dispatch\s+`([a-z0-9-]+)`/g),
    ...content.matchAll(/-+\s+Dispatch\s+`([a-z0-9-]+)`/g),
    ...content.matchAll(/-+\s+`([a-z0-9-]+)`:\s/g),
  ].map((match) => match[1]);

  return [...new Set(matches)].sort();
}

function extractTemplates(content: string): string[] {
  const matches = [...content.matchAll(/templates\/([A-Z0-9-]+)\.md/g)].map((match) => `${match[1]}.md`);
  return [...new Set(matches)].sort();
}

function extractArtifacts(content: string): string[] {
  const matches = [...content.matchAll(/\.productionos\/[A-Za-z0-9._\-{}\/]+/g)].map((match) => match[0]);
  return [...new Set(matches)].sort();
}

function extractGuardrails(content: string): string[] {
  const section = extractSection(content, "Guardrails");
  if (!section) return [];

  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-") || /^\d+\./.test(line))
    .map((line) => line.replace(/^-\s+/, "").replace(/^\d+\.\s+/, "").trim());
}

function renderSharedSkillBody(): string {
  const counts = collectRepoCounts();
  return [
    "# ProductionOS",
    "",
    `ProductionOS is a dual-target AI engineering operating system with ${counts.agents} agents, ${counts.commands} commands, and ${counts.hooks} hooks.`,
    "",
    "Use this skill to translate the Claude-oriented workflow specs in this repo into Codex-native execution.",
    "",
    "## Start Here",
    "",
    "1. Read `README.md` for the product overview and `CLAUDE.md` for the current command catalog.",
    "2. Treat `.claude/commands/*.md` as workflow specs, not literal Codex slash commands.",
    "3. Use `docs/CODEX-PARITY-HANDOFF.md` as the source of truth for target support and parity coverage.",
    "4. Load only the agent files in `agents/` that matter for the chosen workflow.",
    "5. Use `templates/` and `prompts/` only when the selected command or agent points to them.",
    "",
    "## Codex Workflow Mapping",
    "",
    renderWorkflowBullets(),
    "",
    "## Guardrails",
    "",
    "- Do not claim Claude-only hooks, slash commands, or marketplace flows can run directly in Codex.",
    "- Keep work scoped; do not emulate large multi-agent swarms unless the user explicitly wants that overhead.",
    "- Respect the repo's guardrails in `hooks/`, `.claude-plugin/`, `.codex-plugin/`, and `templates/`.",
    "- For packaging or install questions, inspect `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.codex-plugin/plugin.json`, `package.json`, and `README.md`.",
    "",
    "## Output Expectations",
    "",
    "- Explain which ProductionOS workflow you are mapping.",
    "- Use Codex-native tools for implementation, review, planning, or validation.",
    "- Verify with the smallest relevant tests or checks before concluding.",
    "- Summarize what changed, what was verified, and what still needs human approval.",
    "",
  ].join("\n");
}

export function renderRootSkill(): string {
  return [
    "---",
    `name: ${PRODUCT_SLUG}`,
    'description: "ProductionOS — dual-target AI engineering operating system for repo-wide audits, upgrade plans, code reviews, strategic product reviews, security sweeps, UX audits, and recursive quality improvement."',
    'argument-hint: "[goal, command name, or repo path]"',
    "---",
    "",
    renderSharedSkillBody(),
  ].join("\n");
}

export function renderCodexPluginSkill(): string {
  return renderRootSkill();
}

function getCommandSkillSpecs(): CommandSkillSpec[] {
  return listMdFiles(join(ROOT, ".claude", "commands"))
    .sort()
    .map((file) => {
      const sourcePath = `.claude/commands/${file}`;
      const content = readFileOrNull(join(ROOT, sourcePath)) ?? "";
      const fm = parseFrontmatter(content);
      const descriptionLine = content.match(/^description:\s*"?(.*?)"?$/m);
      const description =
        descriptionLine?.[1] ||
        (typeof fm?.description === "string" && fm.description.length > 0
          ? fm.description
          : `Codex-native wrapper for ${file.replace(/\.md$/, "")}.`);
      return {
        name: file.replace(/\.md$/, ""),
        aliasName: `${PRODUCT_SLUG}-${file.replace(/\.md$/, "")}`,
        description,
        sourcePath,
        arguments: extractCommandArguments(content),
        steps: extractStepHeadings(content),
        agents: extractAgents(content),
        templates: extractTemplates(content),
        artifacts: extractArtifacts(content),
        guardrails: extractGuardrails(content),
      };
    });
}

function renderCommandSkill(spec: CommandSkillSpec): string {
  const override = readFileOrNull(join(ROOT, "codex-overrides", `${spec.name}.md`));
  if (override) return override;

  const parity = WORKFLOW_PARITY.find((workflow) => workflow.id === spec.name);
  const skillPath = `skills/${spec.name}/SKILL.md`;
  const sourceLink = docLinkFromSkill(skillPath, spec.sourcePath);
  const handoffLink = docLinkFromSkill(skillPath, "docs/CODEX-PARITY-HANDOFF.md");
  const behavior = parity
    ? [
        "## Codex Behavior",
        "",
        `- Summary: ${parity.summary}`,
        `- Expected behavior: ${parity.codexBehavior}`,
        `- Validation: ${parity.validation.join(", ")}`,
        "",
      ]
    : [
        "## Codex Behavior",
        "",
        `- Summary: ${spec.description}`,
        "- Use the source command as the behavioral spec, then execute the same intent with Codex-native tools and constraints.",
        "",
      ];

  const inputLines = spec.arguments.length > 0
    ? spec.arguments.map((arg) => {
        const parts = [`- \`${arg.name}\` — ${arg.description}`];
        if (arg.defaultValue) parts.push(`Default: \`${arg.defaultValue}\``);
        parts.push(arg.required ? "Required." : "Optional.");
        return parts.join(" ");
      })
    : ["- No explicit arguments. Use repo path, target, or task context as needed."];

  const stepLines = spec.steps.map((step, index) => `${index + 1}. ${step}`);
  const agentLines = spec.agents.length > 0
    ? [`- Agents: ${spec.agents.map((agent) => `\`${agent}\``).join(", ")}`]
    : ["- Agents: no explicit agent references in the source command."];
  const templateLines = spec.templates.length > 0
    ? [`- Templates: ${spec.templates.map((template) => `\`${template}\``).join(", ")}`]
    : ["- Templates: no explicit shared templates beyond general repo conventions."];
  const artifactLines = spec.artifacts.length > 0
    ? [`- Artifacts: ${spec.artifacts.map((artifact) => `\`${artifact}\``).join(", ")}`]
    : ["- Artifacts: no explicit `.productionos/` artifacts called out in the source command."];
  const guardrailLines = spec.guardrails.length > 0
    ? spec.guardrails.slice(0, 8).map((item) => `- ${item}`)
    : ["- Preserve the scope and stop conditions from the source command rather than broadening into a generic repo audit."];

  return [
    "---",
    `name: ${spec.name}`,
    `description: "${spec.description.replace(/"/g, '\\"')}"`,
    'argument-hint: "[repo path, target, or task context]"',
    "---",
    "",
    `# ${spec.name}`,
    "",
    "## Overview",
    "",
    `This is the Codex-native workflow wrapper for [${spec.sourcePath}](${sourceLink}).`,
    "",
    "Use it when the user wants this exact ProductionOS workflow, not just the umbrella `productionos` router.",
    "",
    "## Source of Truth",
    "",
    `1. Read the source command spec at [${spec.sourcePath}](${sourceLink}).`,
    `2. Use [CODEX-PARITY-HANDOFF.md](${handoffLink}) to confirm runtime support and parity expectations.`,
    "3. Preserve the source workflow's guardrails, scope, artifacts, and verification intent.",
    "4. Translate Claude-only slash-command and hook semantics into Codex-native execution instead of copying them literally.",
    "",
    ...behavior,
    "## Inputs",
    "",
    ...inputLines,
    "",
    "## Execution Outline",
    "",
    ...stepLines,
    "",
    "## Agents And Assets",
    "",
    ...agentLines,
    ...templateLines,
    ...artifactLines,
    "",
    "## Workflow",
    "",
    "1. Load only the agents, templates, prompts, and docs referenced by the source command.",
    "2. Execute the workflow intent with Codex-native tools.",
    "3. If the source command implies parallel agent work, only delegate when the user explicitly wants that overhead.",
    "4. Verify with the smallest relevant checks before concluding.",
    "5. Summarize what changed, what was verified, and what still needs human approval.",
    "",
    "## Guardrails",
    "",
    "- Do not claim that Claude-only marketplace, hook, or slash-command behavior runs directly in Codex.",
    "- Keep the scope faithful to the source command rather than broadening into a generic repo audit.",
    "- Prefer concrete outputs and validation over describing the workflow abstractly.",
    ...guardrailLines,
    "",
  ].join("\n");
}

function renderCommandAliasSkill(spec: CommandSkillSpec): string {
  const baseSkill = renderCommandSkill(spec);
  const lines = baseSkill.split("\n");

  return lines
    .map((line, index) => {
      if (line === `name: ${spec.name}`) return `name: ${spec.aliasName}`;
      if (line === `# ${spec.name}`) return `# ${spec.aliasName}`;
      if (index === 7) {
        return `${line}\n\nUse this alias when you want the same workflow through a top-level Codex-safe name without the \`productionos:\` namespace.`;
      }
      return line;
    })
    .join("\n");
}

export function renderClaudeSkill(): string {
  return [
    "---",
    `name: ${PRODUCT_SLUG}`,
    'description: "ProductionOS — dual-target AI engineering operating system for repo-wide audits, upgrade plans, code reviews, strategic product reviews, security sweeps, UX audits, and recursive quality improvement."',
    "metadata:",
    "  filePattern:",
    '    - "**/package.json"',
    '    - "**/pyproject.toml"',
    '    - "**/CLAUDE.md"',
    '    - "**/.productionos/**"',
    '    - "**/.codex-plugin/**"',
    '    - "**/.claude-plugin/**"',
    '    - "**/docker-compose*.yml"',
    '    - "**/.github/workflows/**"',
    "  bashPattern:",
    `    - "${PRODUCT_SLUG}"`,
    '    - "pos-config"',
    '    - "pos-analytics"',
    '    - "production-upgrade"',
    '    - "auto-swarm"',
    '    - "omni-plan"',
    "  priority: 90",
    "---",
    "",
    renderSharedSkillBody(),
  ].join("\n");
}

export function renderOpenAIInterfaceYaml(): string {
  return [
    "interface:",
    '  display_name: "ProductionOS"',
    '  short_description: "Repo audits and upgrade workflows"',
    '  default_prompt: "Use $productionos to audit this repo, prioritize the highest-leverage fixes, and execute a validated upgrade plan with Claude/Codex parity."',
    "",
  ].join("\n");
}

function getAgentManifestEntries(): string[] {
  return listMdFiles(join(ROOT, "agents"))
    .sort()
    .map((file) => `./agents/${file}`);
}

export function renderClaudePluginManifest(): string {
  const counts = collectRepoCounts();
  const version = readVersion() ?? "0.0.0";
  return `${JSON.stringify(
    {
      name: PRODUCT_SLUG,
      description: `AI engineering OS for Claude Code and Codex — ${counts.agents} agents, ${counts.commands} commands, ${counts.hooks} hooks.`,
      version,
      author: PRODUCT_AUTHOR,
      license: "MIT",
      homepage: PRODUCT_REPOSITORY,
      repository: PRODUCT_REPOSITORY,
      keywords: [
        PRODUCT_SLUG,
        "claude-code-plugin",
        "codex-plugin",
        "agentic-dev",
        "multi-agent",
        "recursive-improvement",
      ],
      agents: getAgentManifestEntries(),
      commands: ["./.claude/commands/"],
      skills: ["./.claude/skills/"],
    },
    null,
    2,
  )}\n`;
}

export function renderClaudeMarketplaceManifest(): string {
  const counts = collectRepoCounts();
  const version = readVersion() ?? "0.0.0";
  return `${JSON.stringify(
    {
      name: PRODUCT_SLUG,
      owner: PRODUCT_AUTHOR,
      metadata: {
        description: `${PRODUCT_NAME} — AI engineering OS for Claude Code and Codex. ${counts.agents} agents, ${counts.commands} commands, ${counts.hooks} hooks.`,
        version,
        homepage: PRODUCT_REPOSITORY,
        repository: PRODUCT_REPOSITORY,
        license: "MIT",
      },
      plugins: [
        {
          name: PRODUCT_SLUG,
          source: "./",
          description: `Dual-target AI engineering OS — ${counts.agents} agents, ${counts.commands} commands, ${counts.hooks} hooks, one shared workflow registry.`,
          version,
          author: PRODUCT_AUTHOR,
          homepage: PRODUCT_REPOSITORY,
          repository: PRODUCT_REPOSITORY,
          license: "MIT",
          keywords: [
            PRODUCT_SLUG,
            "production-upgrade",
            "omni-plan",
            "auto-swarm",
            "code-review",
            "security-audit",
            "codex",
            "claude-code",
          ],
          category: "workflow",
          tags: [
            PRODUCT_SLUG,
            "claude-code-plugin",
            "codex-plugin",
            "multi-agent",
            "recursive-improvement",
            "self-evaluation",
          ],
          strict: false,
        },
      ],
    },
    null,
    2,
  )}\n`;
}

export function renderCodexPluginManifest(): string {
  const version = readVersion() ?? "0.0.0";
  return `${JSON.stringify(
    {
      name: PRODUCT_SLUG,
      version,
      description: "Dual-target AI engineering operating system for Codex and Claude parity workflows.",
      author: {
        ...PRODUCT_AUTHOR,
        email: "ShaheerKhawaja@users.noreply.github.com",
      },
      homepage: PRODUCT_REPOSITORY,
      repository: PRODUCT_REPOSITORY,
      license: "MIT",
      keywords: [
        PRODUCT_SLUG,
        "codex-plugin",
        "agentic-dev",
        "code-review",
        "upgrade-plan",
        "security-audit",
      ],
      skills: "./skills/",
      interface: {
        displayName: PRODUCT_NAME,
        shortDescription: "Repo audits and upgrade workflows",
        longDescription:
          "Production-grade audit, review, planning, and upgrade workflows with shared Claude/Codex parity metadata.",
        developerName: PRODUCT_AUTHOR.name,
        category: "Productivity",
        capabilities: ["Interactive", "Write"],
        websiteURL: PRODUCT_REPOSITORY,
        privacyPolicyURL: PRODUCT_REPOSITORY,
        termsOfServiceURL: PRODUCT_REPOSITORY,
        defaultPrompt: [
          "Audit this repo and prioritize the highest-leverage fixes.",
          "Run the ProductionOS review workflow on this diff.",
          "Map this Claude workflow to Codex-native execution.",
        ],
        brandColor: "#0F766E",
      },
    },
    null,
    2,
  )}\n`;
}

export function renderCodexParityHandoff(): string {
  const counts = collectRepoCounts();
  const rows = WORKFLOW_PARITY.map(
    (workflow) =>
      `| \`${workflow.id}\` | [${workflow.sourceCommand}](${docLinkFromDocs(workflow.sourceCommand)}) | [skills/${workflow.id}/SKILL.md](${docLinkFromDocs(`skills/${workflow.id}/SKILL.md`)}) | ${workflow.targets.join(", ")} | ${workflow.codexBehavior} | ${workflow.validation.join(", ")} |`,
  ).join("\n");

  return [
    "# ProductionOS Codex Parity Handoff",
    "",
    `This document is generated from the runtime-neutral registry in [scripts/lib/runtime-targets.ts](${docLinkFromDocs("scripts/lib/runtime-targets.ts")}).`,
    "",
    `Current snapshot: ${counts.agents} agents, ${counts.commands} commands, ${counts.hooks} hooks, ${counts.templates} templates, ${counts.tests} tests.`,
    "",
    "## Runtime Targets",
    "",
    "| Target | Artifact | Purpose |",
    "|--------|----------|---------|",
    `| Claude plugin | [.claude-plugin/plugin.json](${docLinkFromDocs(".claude-plugin/plugin.json")}) | Claude-native plugin manifest |`,
    `| Claude marketplace | [.claude-plugin/marketplace.json](${docLinkFromDocs(".claude-plugin/marketplace.json")}) | Marketplace metadata and discovery |`,
    `| Codex CLI | [SKILL.md](${docLinkFromDocs("SKILL.md")}) + [agents/openai.yaml](${docLinkFromDocs("agents/openai.yaml")}) | Direct Codex skill contract |`,
    `| Codex app/plugin | [.codex-plugin/plugin.json](${docLinkFromDocs(".codex-plugin/plugin.json")}) + [skills/productionos/SKILL.md](${docLinkFromDocs("skills/productionos/SKILL.md")}) | Native Codex app/plugin surface |`,
    "",
    "## Workflow Parity Map",
    "",
    "| Workflow | Source Spec | Codex Skill | Targets | Codex Behavior | Validation |",
    "|----------|-------------|-------------|---------|----------------|------------|",
    rows,
    "",
    "## Notes",
    "",
    "- `.claude/commands/*.md` remain workflow specs, not the cross-runtime source of truth.",
    "- The runtime-neutral registry owns target support, shared descriptions, and generated manifests.",
    "- The Codex plugin now exposes one generated skill wrapper per ProductionOS command under `skills/<command>/SKILL.md`.",
    "- Claude-only concepts must be translated to Codex-native execution, not copied verbatim.",
    "",
  ].join("\n");
}

/**
 * Skills with hand-crafted dense runbooks that should NOT be auto-generated.
 * These skills have been upgraded to self-contained 150+ line SKILL.md files
 * that inline all agent instructions, error handling, and output specs.
 */
const HAND_CRAFTED_SKILLS = new Set([
  "omni-plan-nth",
  "designer-upgrade",
  "auto-mode",
  "logic-mode",
  "agentic-eval",
  "omni-plan",
  "auto-swarm-nth",
  "frontend-upgrade",
  "context-engineer",
  "max-research",
]);

export function getGeneratedTargetFiles(): GeneratedTargetFile[] {
  const commandSpecs = getCommandSkillSpecs();
  const autoGenSpecs = commandSpecs.filter((spec) => !HAND_CRAFTED_SKILLS.has(spec.name));

  return [
    { path: ".claude-plugin/plugin.json", content: renderClaudePluginManifest() },
    { path: ".claude-plugin/marketplace.json", content: renderClaudeMarketplaceManifest() },
    { path: ".codex-plugin/plugin.json", content: renderCodexPluginManifest() },
    { path: "SKILL.md", content: renderRootSkill() },
    { path: "skills/productionos/SKILL.md", content: renderCodexPluginSkill() },
    { path: ".claude/skills/productionos/SKILL.md", content: renderClaudeSkill() },
    { path: "agents/openai.yaml", content: renderOpenAIInterfaceYaml() },
    { path: "docs/CODEX-PARITY-HANDOFF.md", content: renderCodexParityHandoff() },
  ].concat(
    autoGenSpecs.map((spec) => ({
      path: `skills/${spec.name}/SKILL.md`,
      content: renderCommandSkill(spec),
    })),
    autoGenSpecs.map((spec) => ({
      path: `codex-skills/${spec.aliasName}/SKILL.md`,
      content: renderCommandAliasSkill(spec),
    })),
  );
}

export function writeGeneratedTargetFiles(): GeneratedTargetFile[] {
  const files = getGeneratedTargetFiles();
  for (const file of files) {
    const fullPath = join(ROOT, file.path);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, file.content, "utf-8");
  }
  return files;
}
