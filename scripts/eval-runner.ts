#!/usr/bin/env bun
/**
 * eval-runner.ts — 3-Tier Evaluation Framework for ProductionOS.
 *
 * Tier 1: Static Analysis (structure, cross-refs, naming, dead code, token budgets)
 * Tier 2: Functional Validation (output formats, agent dispatch, integration paths)
 * Tier 3: Quality Scoring (dimension scores, historical comparison, trend analysis)
 *
 * Outputs: console report + .productionos/EVAL-REPORT.md
 *
 * Usage:
 *   bun run eval
 *   bun run scripts/eval-runner.ts
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { parseFrontmatter, readFileOrNull, walkFiles, listMdFiles, ROOT, BYTES_PER_TOKEN } from "./lib/shared";

// ─── Types ───────────────────────────────────────────────────

interface Finding {
  tier: 1 | 2 | 3;
  severity: "critical" | "warning" | "info";
  category: string;
  message: string;
  file?: string;
}

interface AgentMeta {
  file: string;
  name: string;
  description: string;
  tools: string[];
  hasRole: boolean;
  hasInstructions: boolean;
  lineCount: number;
  tokenEstimate: number;
  crossRefs: string[];
}

interface CommandMeta {
  file: string;
  name: string;
  description: string;
  hasPreambleRef: boolean;
  referencedAgents: string[];
  referencedCommands: string[];
  lineCount: number;
  tokenEstimate: number;
}

interface DimensionScore {
  dimension: string;
  score: number;
  evidence: string;
}

interface QualityReport {
  overallScore: number;
  dimensions: DimensionScore[];
  trend: "improving" | "stable" | "declining" | "unknown";
  historicalScores: number[];
}

interface EvalResult {
  timestamp: string;
  tier1: { pass: number; fail: number; warn: number; findings: Finding[] };
  tier2: { pass: number; fail: number; warn: number; findings: Finding[] };
  tier3: QualityReport;
  allFindings: Finding[];
  grade: string;
}

// ─── Constants ───────────────────────────────────────────────

const AGENTS_DIR = join(ROOT, "agents");
const COMMANDS_DIR = join(ROOT, ".claude", "commands");
const PROMPTS_DIR = join(ROOT, "prompts");
const TEMPLATES_DIR = join(ROOT, "templates");
const OUTPUT_DIR = join(ROOT, ".productionos");
const KEBAB_CASE_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const VALID_TOOLS = new Set([
  "Read", "Write", "Edit", "Glob", "Grep", "Bash",
  "Skill", "Agent", "TodoRead", "TodoWrite",
  "WebFetch", "WebSearch", "NotebookEdit",
]);
const QUALITY_DIMENSIONS = [
  "Code Quality", "Security", "Performance", "UX/UI", "Test Coverage",
  "Accessibility", "Documentation", "Error Handling", "Observability",
  "Deployment Safety",
];
const MIN_AGENT_LINES = 50;
const HEAVY_TOKEN_THRESHOLD = 5000;

// ─── Helpers ─────────────────────────────────────────────────

function estimateTokens(content: string): number {
  return Math.ceil(Buffer.byteLength(content, "utf-8") / BYTES_PER_TOKEN);
}

function isKebabCase(name: string): boolean {
  return KEBAB_CASE_RE.test(name);
}

function extractCrossRefs(content: string, pattern: RegExp): string[] {
  const refs: string[] = [];
  let match;
  while ((match = pattern.exec(content)) !== null) {
    const ref = match[1];
    if (!refs.includes(ref)) refs.push(ref);
  }
  return refs;
}

function findCommandReferences(content: string): string[] {
  const refs: string[] = [];
  const pattern = /\/([a-z][a-z0-9-]+)/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    const cmd = match[1];
    if (!refs.includes(cmd) && cmd.length > 2) refs.push(cmd);
  }
  return refs;
}

// ─── Collectors ──────────────────────────────────────────────

function collectAgents(): AgentMeta[] {
  const files = listMdFiles(AGENTS_DIR);
  const agents: AgentMeta[] = [];

  for (const file of files) {
    const content = readFileOrNull(join(AGENTS_DIR, file));
    if (!content) continue;

    const fm = parseFrontmatter(content);
    const lines = content.split("\n");
    const tools = (fm?.tools as string[] | undefined) ?? [];

    agents.push({
      file,
      name: (fm?.name as string) || file.replace(".md", ""),
      description: (fm?.description as string) || "",
      tools,
      hasRole: content.includes("<role>") && content.includes("</role>"),
      hasInstructions: content.includes("<instructions>") && content.includes("</instructions>"),
      lineCount: lines.length,
      tokenEstimate: estimateTokens(content),
      crossRefs: extractCrossRefs(content, /agents\/([a-z][a-z0-9-]+)\.md/g),
    });
  }

  return agents;
}

function collectCommands(): CommandMeta[] {
  const files = listMdFiles(COMMANDS_DIR);
  const commands: CommandMeta[] = [];

  for (const file of files) {
    const content = readFileOrNull(join(COMMANDS_DIR, file));
    if (!content) continue;

    const fm = parseFrontmatter(content);
    const lines = content.split("\n");

    commands.push({
      file,
      name: (fm?.name as string) || file.replace(".md", ""),
      description: (fm?.description as string) || "",
      hasPreambleRef: content.includes("PREAMBLE.md") || content.includes("preamble"),
      referencedAgents: extractCrossRefs(content, /agents\/([a-z][a-z0-9-]+)\.md/g),
      referencedCommands: findCommandReferences(content),
      lineCount: lines.length,
      tokenEstimate: estimateTokens(content),
    });
  }

  return commands;
}

// ─── Tier 1: Static Analysis ─────────────────────────────────

function runTier1(agents: AgentMeta[], commands: CommandMeta[]): Finding[] {
  const findings: Finding[] = [];
  const agentNames = new Set(agents.map((a) => a.name));

  // 1a. Agent frontmatter validation
  for (const agent of agents) {
    const fm = parseFrontmatter(readFileOrNull(join(AGENTS_DIR, agent.file)) || "");

    if (!fm) {
      findings.push({
        tier: 1, severity: "critical", category: "frontmatter",
        message: "Agent missing YAML frontmatter", file: `agents/${agent.file}`,
      });
      continue;
    }

    if (!fm.name) {
      findings.push({
        tier: 1, severity: "critical", category: "frontmatter",
        message: "Agent missing 'name' in frontmatter", file: `agents/${agent.file}`,
      });
    }

    if (!fm.description) {
      findings.push({
        tier: 1, severity: "warning", category: "frontmatter",
        message: "Agent missing 'description' in frontmatter", file: `agents/${agent.file}`,
      });
    }

    if (!fm.tools || !Array.isArray(fm.tools) || (fm.tools as string[]).length === 0) {
      findings.push({
        tier: 1, severity: "warning", category: "frontmatter",
        message: "Agent missing 'tools' list in frontmatter", file: `agents/${agent.file}`,
      });
    }

    if (!agent.hasRole) {
      findings.push({
        tier: 1, severity: "critical", category: "structure",
        message: "Agent missing <role></role> XML tags", file: `agents/${agent.file}`,
      });
    }

    if (!agent.hasInstructions) {
      findings.push({
        tier: 1, severity: "critical", category: "structure",
        message: "Agent missing <instructions></instructions> XML tags", file: `agents/${agent.file}`,
      });
    }

    if (agent.lineCount < MIN_AGENT_LINES) {
      findings.push({
        tier: 1, severity: "warning", category: "quality",
        message: `Agent too short: ${agent.lineCount} lines (min ${MIN_AGENT_LINES})`, file: `agents/${agent.file}`,
      });
    }
  }

  // 1b. Command preamble validation
  for (const cmd of commands) {
    const fm = parseFrontmatter(readFileOrNull(join(COMMANDS_DIR, cmd.file)) || "");

    if (!fm) {
      findings.push({
        tier: 1, severity: "critical", category: "frontmatter",
        message: "Command missing YAML frontmatter", file: `.claude/commands/${cmd.file}`,
      });
      continue;
    }

    if (!fm.name) {
      findings.push({
        tier: 1, severity: "critical", category: "frontmatter",
        message: "Command missing 'name' in frontmatter", file: `.claude/commands/${cmd.file}`,
      });
    }

    if (!fm.description) {
      findings.push({
        tier: 1, severity: "warning", category: "frontmatter",
        message: "Command missing 'description' in frontmatter", file: `.claude/commands/${cmd.file}`,
      });
    }
  }

  // 1c. Cross-reference integrity
  for (const agent of agents) {
    for (const ref of agent.crossRefs) {
      if (!agentNames.has(ref)) {
        findings.push({
          tier: 1, severity: "critical", category: "cross-ref",
          message: `References non-existent agent '${ref}'`, file: `agents/${agent.file}`,
        });
      }
    }
  }

  for (const cmd of commands) {
    for (const ref of cmd.referencedAgents) {
      if (!agentNames.has(ref)) {
        findings.push({
          tier: 1, severity: "warning", category: "cross-ref",
          message: `References non-existent agent '${ref}'`, file: `.claude/commands/${cmd.file}`,
        });
      }
    }
  }

  // 1d. Naming convention enforcement (kebab-case)
  for (const agent of agents) {
    const stem = agent.file.replace(".md", "");
    if (!isKebabCase(stem)) {
      findings.push({
        tier: 1, severity: "warning", category: "naming",
        message: `File name '${agent.file}' is not kebab-case`, file: `agents/${agent.file}`,
      });
    }
  }

  for (const cmd of commands) {
    const stem = cmd.file.replace(".md", "");
    if (!isKebabCase(stem)) {
      findings.push({
        tier: 1, severity: "warning", category: "naming",
        message: `File name '${cmd.file}' is not kebab-case`, file: `.claude/commands/${cmd.file}`,
      });
    }
  }

  // 1e. Dead code detection: orphaned agents (not referenced by any command)
  const allReferencedAgents = new Set<string>();
  for (const cmd of commands) {
    for (const ref of cmd.referencedAgents) {
      allReferencedAgents.add(ref);
    }
  }
  // Also check agent-to-agent cross-refs
  for (const agent of agents) {
    for (const ref of agent.crossRefs) {
      allReferencedAgents.add(ref);
    }
  }
  // Check CLAUDE.md for agent references
  const claudeMd = readFileOrNull(join(ROOT, "CLAUDE.md"));
  if (claudeMd) {
    const claudeRefs = extractCrossRefs(claudeMd, /agents\/([a-z][a-z0-9-]+)\.md/g);
    for (const ref of claudeRefs) allReferencedAgents.add(ref);
  }

  for (const agent of agents) {
    if (!allReferencedAgents.has(agent.name)) {
      findings.push({
        tier: 1, severity: "info", category: "dead-code",
        message: `Agent '${agent.name}' is not referenced by any command or agent`, file: `agents/${agent.file}`,
      });
    }
  }

  // 1f. Orphaned prompt files (not referenced anywhere)
  const promptFiles = listMdFiles(PROMPTS_DIR);
  const allContent = [
    ...agents.map((a) => readFileOrNull(join(AGENTS_DIR, a.file)) || ""),
    ...commands.map((c) => readFileOrNull(join(COMMANDS_DIR, c.file)) || ""),
    claudeMd || "",
  ].join("\n");

  for (const pf of promptFiles) {
    if (pf === "README.md") continue;
    const stem = pf.replace(".md", "");
    if (!allContent.includes(pf) && !allContent.includes(stem)) {
      findings.push({
        tier: 1, severity: "info", category: "dead-code",
        message: `Prompt file '${pf}' is not referenced by any agent or command`, file: `prompts/${pf}`,
      });
    }
  }

  // 1g. Token budget estimation
  for (const agent of agents) {
    if (agent.tokenEstimate > HEAVY_TOKEN_THRESHOLD) {
      findings.push({
        tier: 1, severity: "warning", category: "token-budget",
        message: `Agent is heavy: ~${agent.tokenEstimate} tokens (threshold: ${HEAVY_TOKEN_THRESHOLD})`, file: `agents/${agent.file}`,
      });
    }
  }

  for (const cmd of commands) {
    if (cmd.tokenEstimate > HEAVY_TOKEN_THRESHOLD) {
      findings.push({
        tier: 1, severity: "warning", category: "token-budget",
        message: `Command is heavy: ~${cmd.tokenEstimate} tokens (threshold: ${HEAVY_TOKEN_THRESHOLD})`, file: `.claude/commands/${cmd.file}`,
      });
    }
  }

  // Estimate total token cost per command (command + referenced agents)
  for (const cmd of commands) {
    let totalTokens = cmd.tokenEstimate;
    for (const ref of cmd.referencedAgents) {
      const agent = agents.find((a) => a.name === ref);
      if (agent) totalTokens += agent.tokenEstimate;
    }
    if (totalTokens > HEAVY_TOKEN_THRESHOLD * 3) {
      findings.push({
        tier: 1, severity: "warning", category: "token-budget",
        message: `Command total context: ~${totalTokens} tokens (cmd + ${cmd.referencedAgents.length} agents)`,
        file: `.claude/commands/${cmd.file}`,
      });
    }
  }

  return findings;
}

// ─── Tier 2: Functional Validation ───────────────────────────

function runTier2(agents: AgentMeta[], commands: CommandMeta[]): Finding[] {
  const findings: Finding[] = [];

  // 2a. Command output format validation
  for (const cmd of commands) {
    const content = readFileOrNull(join(COMMANDS_DIR, cmd.file)) || "";

    const writesOutput = content.includes(".productionos/") || content.includes("EVAL-REPORT") || content.includes("CONVERGENCE-LOG");
    const hasOutputSection = /## Output|## Deliverables|OUTPUT:/i.test(content);

    if (!writesOutput && !hasOutputSection) {
      findings.push({
        tier: 2, severity: "info", category: "output-format",
        message: "Command has no defined output path or deliverables section", file: `.claude/commands/${cmd.file}`,
      });
    }
  }

  // 2b. Agent dispatch feasibility — verify tools are valid
  for (const agent of agents) {
    for (const tool of agent.tools) {
      if (!VALID_TOOLS.has(tool)) {
        // Check if it is an MCP tool pattern
        if (!tool.startsWith("mcp__")) {
          findings.push({
            tier: 2, severity: "warning", category: "dispatch",
            message: `Agent declares unknown tool '${tool}'`, file: `agents/${agent.file}`,
          });
        }
      }
    }

    // Check if agent references subagent dispatch but lacks the Agent tool
    const content = readFileOrNull(join(AGENTS_DIR, agent.file)) || "";
    if (content.includes("Agent tool") || content.includes("subagent")) {
      if (!agent.tools.includes("Agent") && !agent.tools.includes("Bash")) {
        findings.push({
          tier: 2, severity: "warning", category: "dispatch",
          message: "Agent references subagent dispatch but does not declare Agent or Bash tool",
          file: `agents/${agent.file}`,
        });
      }
    }
  }

  // 2c. Integration path validation — command chains
  const KNOWN_CHAINS: [string, string][] = [
    ["deep-research", "omni-plan"],
    ["omni-plan", "auto-swarm"],
    ["omni-plan", "agentic-eval"],
    ["production-upgrade", "agentic-eval"],
    ["omni-plan-nth", "omni-plan"],
    ["auto-swarm-nth", "auto-swarm"],
  ];

  for (const [source, target] of KNOWN_CHAINS) {
    const sourceCmd = commands.find((c) => c.file.replace(".md", "") === source);
    if (!sourceCmd) {
      findings.push({
        tier: 2, severity: "info", category: "integration",
        message: `Chain source command '${source}' not found`, file: `(chain: ${source} -> ${target})`,
      });
      continue;
    }

    const content = readFileOrNull(join(COMMANDS_DIR, sourceCmd.file)) || "";
    const refsTarget = content.includes(`/${target}`) || content.includes(`${target}.md`);

    if (!refsTarget) {
      findings.push({
        tier: 2, severity: "warning", category: "integration",
        message: `Expected chain '${source}' -> '${target}' but source does not reference target`,
        file: `.claude/commands/${sourceCmd.file}`,
      });
    }
  }

  // 2d. Preamble protocol compliance
  const preambleCommands = ["omni-plan", "omni-plan-nth", "production-upgrade", "auto-swarm", "auto-swarm-nth"];
  for (const cmdName of preambleCommands) {
    const cmd = commands.find((c) => c.file.replace(".md", "") === cmdName);
    if (!cmd) continue;

    if (!cmd.hasPreambleRef) {
      findings.push({
        tier: 2, severity: "warning", category: "protocol",
        message: "Orchestrative command should reference PREAMBLE.md", file: `.claude/commands/${cmd.file}`,
      });
    }
  }

  // 2e. Template integrity — verify required templates exist
  const templateFiles = new Set(listMdFiles(TEMPLATES_DIR));
  const templateRefs = ["PREAMBLE.md", "RUBRIC.md", "CONVERGENCE-LOG.md", "PROMPT-COMPOSITION.md", "INVOCATION-PROTOCOL.md"];

  for (const tRef of templateRefs) {
    if (!templateFiles.has(tRef)) {
      findings.push({
        tier: 2, severity: "critical", category: "template",
        message: `Required template '${tRef}' is missing from templates/`, file: `templates/${tRef}`,
      });
    }
  }

  // 2f. Guardrails presence in orchestrative commands
  for (const cmdName of preambleCommands) {
    const cmd = commands.find((c) => c.file.replace(".md", "") === cmdName);
    if (!cmd) continue;

    const content = readFileOrNull(join(COMMANDS_DIR, cmd.file)) || "";
    const hasGuardrails = /guardrail|rollback|max.*(iteration|file|batch)|protected/i.test(content);

    if (!hasGuardrails) {
      findings.push({
        tier: 2, severity: "warning", category: "guardrails",
        message: "Orchestrative command lacks guardrails/limits section", file: `.claude/commands/${cmd.file}`,
      });
    }
  }

  return findings;
}

// ─── Tier 3: Quality Scoring ─────────────────────────────────

function scoreDimension(dimension: string, agents: AgentMeta[], commands: CommandMeta[]): DimensionScore {
  let score = 0;
  const evidenceParts: string[] = [];

  // Helper: read all agent content once per dimension that needs it
  const lazyAgentContent = () => agents.map((a) => readFileOrNull(join(AGENTS_DIR, a.file)) || "").join("\n");
  const lazyCmdContent = () => commands.map((c) => readFileOrNull(join(COMMANDS_DIR, c.file)) || "").join("\n");

  switch (dimension) {
    case "Code Quality": {
      const agentCount = Math.max(agents.length, 1);
      const avgLines = agents.reduce((s, a) => s + a.lineCount, 0) / agentCount;
      // 2 pts: agent definition depth
      if (avgLines > 200) { score += 2; evidenceParts.push(`avg ${Math.round(avgLines)} lines/agent`); }
      else if (avgLines > 100) { score += 1; evidenceParts.push(`avg ${Math.round(avgLines)} lines/agent`); }
      // 2 pts: structural completeness
      const withRole = agents.filter((a) => a.hasRole).length;
      const withInstr = agents.filter((a) => a.hasInstructions).length;
      const rolePct = (withRole / agentCount) * 100;
      const instrPct = (withInstr / agentCount) * 100;
      if (rolePct >= 95) { score += 1; evidenceParts.push(`${rolePct.toFixed(0)}% role coverage`); }
      if (instrPct >= 95) { score += 1; evidenceParts.push(`${instrPct.toFixed(0)}% instructions coverage`); }
      // 2 pts: frontmatter quality
      const withDesc = agents.filter((a) => a.description.length > 50).length;
      if (withDesc / agentCount > 0.9) { score += 1; evidenceParts.push("detailed descriptions"); }
      const withTools = agents.filter((a) => a.tools.length > 0).length;
      if (withTools === agentCount) { score += 1; evidenceParts.push("100% tool declarations"); }
      // 2 pts: ecosystem integration
      const agentNames = new Set(agents.map((a) => a.name));
      let totalNameRefs = 0;
      for (const a of agents) {
        const content = readFileOrNull(join(AGENTS_DIR, a.file)) || "";
        for (const name of agentNames) {
          if (name !== a.name && content.includes(name)) totalNameRefs++;
        }
      }
      const avgNameRefs = totalNameRefs / agentCount;
      if (avgNameRefs > 0.5) { score += 1; evidenceParts.push(`avg ${avgNameRefs.toFixed(1)} agent name refs`); }
      if (agents.length >= 70) { score += 1; evidenceParts.push(`${agents.length} agents — comprehensive coverage`); }
      // 2 pts: TypeScript strict + zero deps
      if (existsSync(join(ROOT, "tsconfig.json"))) {
        const tsconfig = readFileOrNull(join(ROOT, "tsconfig.json")) || "";
        if (tsconfig.includes('"strict": true')) { score += 1; evidenceParts.push("strict TypeScript"); }
        if (tsconfig.includes("noUnusedLocals")) { score += 1; evidenceParts.push("noUnusedLocals enabled"); }
      }
      break;
    }
    case "Security": {
      const combined = lazyAgentContent() + "\n" + lazyCmdContent();
      // 2 pts: threat modeling
      if (combined.includes("prompt injection")) { score += 1; evidenceParts.push("prompt injection defense"); }
      if (combined.includes("untrusted")) { score += 1; evidenceParts.push("untrusted data handling"); }
      // 2 pts: secret management
      if (/secret|credential|api.key/i.test(combined) && /env.var|process\.env/i.test(combined)) {
        score += 1; evidenceParts.push("secrets via env vars");
      }
      if (existsSync(join(ROOT, "hooks", "protected-file-guard.sh"))) { score += 1; evidenceParts.push("file guard hook"); }
      // 2 pts: security agents
      const secAgent = agents.find((a) => a.name.includes("security"));
      if (secAgent) { score += 1; evidenceParts.push(`security agent: ${secAgent.name}`); }
      if (existsSync(join(ROOT, "hooks", "pre-commit-gitleaks.sh"))) { score += 1; evidenceParts.push("gitleaks secret scanning"); }
      // 2 pts: scope enforcement
      if (existsSync(join(ROOT, "hooks", "scope-enforcement.sh"))) { score += 1; evidenceParts.push("scope enforcement hook"); }
      if (existsSync(join(ROOT, "scripts", "lib", "file-ownership.ts"))) { score += 1; evidenceParts.push("file ownership protocol"); }
      // 2 pts: red flags
      const redFlagCount = agents.filter((a) => (readFileOrNull(join(AGENTS_DIR, a.file)) || "").toLowerCase().includes("red flag")).length;
      if (redFlagCount / Math.max(agents.length, 1) > 0.9) { score += 1; evidenceParts.push(`${redFlagCount}/${agents.length} agents have red flags`); }
      if (combined.includes("NEVER") || combined.includes("non-negotiable")) { score += 1; evidenceParts.push("explicit guardrail language"); }
      break;
    }
    case "Performance": {
      // 2 pts: agent efficiency (ratio-based, not absolute)
      const heavyAgents = agents.filter((a) => a.tokenEstimate > HEAVY_TOKEN_THRESHOLD).length;
      const heavyPct = (heavyAgents / Math.max(agents.length, 1)) * 100;
      if (heavyPct < 10) { score += 2; evidenceParts.push(`${heavyPct.toFixed(0)}% heavy agents`); }
      else if (heavyPct < 25) { score += 2; evidenceParts.push(`${heavyPct.toFixed(0)}% heavy agents (${heavyAgents}/${agents.length} above ${HEAVY_TOKEN_THRESHOLD}t — within budget)`); }
      else if (heavyPct < 50) { score += 1; evidenceParts.push(`${heavyPct.toFixed(0)}% heavy agents (${heavyAgents} above ${HEAVY_TOKEN_THRESHOLD} tokens)`); }
      else { evidenceParts.push(`${heavyPct.toFixed(0)}% heavy agents — consider splitting`); }
      // 2 pts: performance tooling
      const perfAgent = agents.find((a) => a.name.includes("performance") || a.name.includes("profiler"));
      if (perfAgent) { score += 1; evidenceParts.push(`perf agent: ${perfAgent.name}`); }
      if (existsSync(join(ROOT, "scripts", "cost-tracker.ts"))) { score += 1; evidenceParts.push("cost tracking"); }
      // 2 pts: convergence engine (prevents wasted compute)
      if (existsSync(join(ROOT, "scripts", "convergence.ts"))) { score += 1; evidenceParts.push("convergence engine"); }
      if (existsSync(join(ROOT, "scripts", "lib", "wave-state.ts"))) { score += 1; evidenceParts.push("wave state machine"); }
      // 2 pts: caching and optimization patterns
      const combined = lazyAgentContent();
      if (/cache|memoize|incremental/i.test(combined)) { score += 1; evidenceParts.push("caching/incremental patterns"); }
      if (existsSync(join(ROOT, "scripts", "cost-estimator.ts"))) { score += 1; evidenceParts.push("cost estimator"); }
      // 2 pts: parallel execution infrastructure
      if (existsSync(join(ROOT, "scripts", "worktree-manager.ts"))) { score += 1; evidenceParts.push("worktree parallelism"); }
      if (existsSync(join(ROOT, "scripts", "stats-dashboard.ts"))) { score += 1; evidenceParts.push("stats dashboard"); }
      break;
    }
    case "UX/UI": {
      // 2 pts: UX agents
      const uxAgent = agents.find((a) => a.name.includes("ux") || a.name.includes("frontend"));
      if (uxAgent) { score += 1; evidenceParts.push(`UX agent: ${uxAgent.name}`); }
      const designAgent = agents.find((a) => a.name.includes("design"));
      if (designAgent) { score += 1; evidenceParts.push(`design agent: ${designAgent.name}`); }
      // 2 pts: user education
      const learnCmd = commands.find((c) => c.file.includes("learn"));
      if (learnCmd) { score += 1; evidenceParts.push("learn-mode"); }
      const helpCmd = commands.find((c) => c.file.includes("help"));
      if (helpCmd) { score += 1; evidenceParts.push("help command"); }
      // 2 pts: onboarding
      const statsCmd = commands.find((c) => c.file.includes("stats"));
      if (statsCmd) { score += 1; evidenceParts.push("stats dashboard"); }
      if (existsSync(join(ROOT, "bin", "install.cjs"))) { score += 1; evidenceParts.push("installer script"); }
      // 2 pts: feedback & iteration
      const combined = lazyAgentContent();
      if (/self-eval|self-check/i.test(combined)) { score += 1; evidenceParts.push("self-evaluation feedback loop"); }
      if (/mockup|wireframe|prototype/i.test(combined)) { score += 1; evidenceParts.push("mockup/prototype patterns"); }
      // 2 pts: progressive complexity
      const pauseCmd = commands.find((c) => c.file.includes("pause"));
      if (pauseCmd) { score += 1; evidenceParts.push("pause/resume for long tasks"); }
      if (existsSync(join(ROOT, "hooks", "post-edit-review-hint.sh"))) { score += 1; evidenceParts.push("review hints"); }
      break;
    }
    case "Test Coverage": {
      // 2 pts: test file count
      const testFiles = walkFiles(join(ROOT, "tests"), ".ts");
      if (testFiles.length >= 15) { score += 2; evidenceParts.push(`${testFiles.length} test files`); }
      else if (testFiles.length >= 5) { score += 1; evidenceParts.push(`${testFiles.length} test files`); }
      // 2 pts: test types
      const hasBehavioral = testFiles.some((f) => f.includes("behavioral"));
      const hasIntegration = testFiles.some((f) => f.includes("integration"));
      if (hasBehavioral) { score += 1; evidenceParts.push("behavioral tests"); }
      if (hasIntegration) { score += 1; evidenceParts.push("integration tests"); }
      // 2 pts: test agent + CI
      const testAgent = agents.find((a) => a.name.includes("test") || a.name.includes("e2e"));
      if (testAgent) { score += 1; evidenceParts.push(`test agent: ${testAgent.name}`); }
      if (existsSync(join(ROOT, ".github", "workflows", "ci.yml"))) { score += 1; evidenceParts.push("CI pipeline"); }
      // 2 pts: coverage breadth
      const hasHookTests = testFiles.some((f) => f.includes("hook"));
      const hasWorktreeTests = testFiles.some((f) => f.includes("worktree"));
      if (hasHookTests) { score += 1; evidenceParts.push("hook contract tests"); }
      if (hasWorktreeTests) { score += 1; evidenceParts.push("worktree tests"); }
      // 2 pts: eval system
      if (existsSync(join(ROOT, "scripts", "eval-runner.ts"))) { score += 1; evidenceParts.push("eval runner"); }
      const hasWaveTests = testFiles.some((f) => f.includes("wave"));
      if (hasWaveTests) { score += 1; evidenceParts.push("wave state tests"); }
      break;
    }
    case "Accessibility": {
      const combined = lazyAgentContent();
      // 2 pts: a11y awareness
      if (/a11y|accessibility|WCAG|ARIA/i.test(combined)) { score += 1; evidenceParts.push("a11y references"); }
      if (/screen.reader|keyboard.nav/i.test(combined)) { score += 1; evidenceParts.push("screen reader/keyboard patterns"); }
      // 2 pts: inclusive design
      if (/color.contrast|alt.text|semantic.html/i.test(combined)) { score += 1; evidenceParts.push("visual accessibility"); }
      const frontendAgent = agents.find((a) => a.name.includes("frontend"));
      if (frontendAgent) { score += 1; evidenceParts.push("frontend design agent"); }
      // 2 pts: progressive disclosure (CLI accessibility)
      if (existsSync(join(ROOT, ".claude", "commands", "productionos-help.md"))) { score += 1; evidenceParts.push("help system"); }
      if (existsSync(join(ROOT, ".claude", "commands", "learn-mode.md"))) { score += 1; evidenceParts.push("learn mode"); }
      // 2 pts: error messages and feedback quality
      if (/actionable|specific.*error|clear.*message/i.test(combined)) { score += 1; evidenceParts.push("actionable error messages"); }
      if (existsSync(join(ROOT, "hooks", "eval-gate.sh"))) { score += 1; evidenceParts.push("eval feedback loop"); }
      // 2 pts: documentation accessibility
      if (existsSync(join(ROOT, "CONTRIBUTING.md"))) { score += 1; evidenceParts.push("contributing guide"); }
      if (existsSync(join(ROOT, "CODE_OF_CONDUCT.md"))) { score += 1; evidenceParts.push("code of conduct"); }
      break;
    }
    case "Documentation": {
      const rootMd = listMdFiles(ROOT);
      // 2 pts: core docs
      if (rootMd.includes("README.md")) { score += 1; evidenceParts.push("README"); }
      if (rootMd.includes("CHANGELOG.md")) { score += 1; evidenceParts.push("CHANGELOG"); }
      // 2 pts: architecture docs
      if (rootMd.includes("ARCHITECTURE.md")) { score += 1; evidenceParts.push("ARCHITECTURE"); }
      if (rootMd.includes("CONTRIBUTING.md")) { score += 1; evidenceParts.push("CONTRIBUTING"); }
      // 2 pts: security & compliance
      if (rootMd.includes("SECURITY.md")) { score += 1; evidenceParts.push("SECURITY"); }
      if (existsSync(join(ROOT, "LICENSE")) || rootMd.includes("LICENSE.md")) { score += 1; evidenceParts.push("LICENSE"); }
      // 2 pts: templates
      const templateCount = listMdFiles(join(ROOT, "templates")).length;
      if (templateCount >= 5) { score += 1; evidenceParts.push(`${templateCount} templates`); }
      if (existsSync(join(ROOT, "CLAUDE.md"))) { score += 1; evidenceParts.push("CLAUDE.md"); }
      // 2 pts: versioning & tracking
      if (existsSync(join(ROOT, "VERSION"))) { score += 1; evidenceParts.push("VERSION file"); }
      if (existsSync(join(ROOT, "CODE_OF_CONDUCT.md"))) { score += 1; evidenceParts.push("CODE_OF_CONDUCT"); }
      break;
    }
    case "Error Handling": {
      const combined = lazyAgentContent();
      // 2 pts: recovery patterns
      if (/rollback|self-heal|recover/i.test(combined)) { score += 1; evidenceParts.push("recovery patterns"); }
      if (/graceful|degrad/i.test(combined)) { score += 1; evidenceParts.push("graceful degradation"); }
      // 2 pts: error agents
      const healAgent = agents.find((a) => a.name.includes("heal"));
      if (healAgent) { score += 1; evidenceParts.push(`healer: ${healAgent.name}`); }
      const guardAgent = agents.find((a) => a.name.includes("guardrail"));
      if (guardAgent) { score += 1; evidenceParts.push(`guardrails: ${guardAgent.name}`); }
      // 2 pts: checkpoint/state management
      if (existsSync(join(ROOT, "scripts", "lib", "wave-state.ts"))) { score += 1; evidenceParts.push("wave state checkpoints"); }
      if (/checkpoint|atomic.write/i.test(combined)) { score += 1; evidenceParts.push("checkpoint patterns"); }
      // 2 pts: validation
      if (existsSync(join(ROOT, "scripts", "validate-agents.ts"))) { score += 1; evidenceParts.push("agent validation"); }
      if (existsSync(join(ROOT, "scripts", "quality-gate-checker.ts"))) { score += 1; evidenceParts.push("quality gates"); }
      // 2 pts: scope + boundary enforcement
      if (existsSync(join(ROOT, "hooks", "scope-enforcement.sh"))) { score += 1; evidenceParts.push("scope enforcement"); }
      if (existsSync(join(ROOT, "hooks", "repo-boundary-guard.sh"))) { score += 1; evidenceParts.push("repo boundary guard"); }
      break;
    }
    case "Observability": {
      // 2 pts: convergence tracking
      const convLog = readFileOrNull(join(TEMPLATES_DIR, "CONVERGENCE-LOG.md"));
      if (convLog) { score += 1; evidenceParts.push("convergence log template"); }
      if (existsSync(join(ROOT, "scripts", "convergence.ts"))) { score += 1; evidenceParts.push("convergence engine"); }
      // 2 pts: dashboards
      if (existsSync(join(ROOT, "scripts", "review-dashboard.ts"))) { score += 1; evidenceParts.push("review dashboard"); }
      if (existsSync(join(ROOT, "scripts", "stats-dashboard.ts"))) { score += 1; evidenceParts.push("stats dashboard"); }
      // 2 pts: auditing
      if (existsSync(join(ROOT, "scripts", "context-audit.ts"))) { score += 1; evidenceParts.push("context audit"); }
      if (existsSync(join(ROOT, "scripts", "eval-runner.ts"))) { score += 1; evidenceParts.push("eval runner"); }
      // 2 pts: telemetry hooks
      if (existsSync(join(ROOT, "hooks", "post-edit-telemetry.sh"))) { score += 1; evidenceParts.push("edit telemetry"); }
      if (existsSync(join(ROOT, "hooks", "post-bash-telemetry.sh"))) { score += 1; evidenceParts.push("bash telemetry"); }
      // 2 pts: eval gate + history
      if (existsSync(join(ROOT, "hooks", "eval-gate.sh"))) { score += 1; evidenceParts.push("eval gate hook"); }
      if (existsSync(join(ROOT, "hooks", "stop-eval-gate.sh"))) { score += 1; evidenceParts.push("session-end eval"); }
      break;
    }
    case "Deployment Safety": {
      const combined = lazyCmdContent() + "\n" + (readFileOrNull(join(ROOT, "CLAUDE.md")) || "");
      // 2 pts: git hooks
      if (/pre-commit|pre-push/i.test(combined)) { score += 1; evidenceParts.push("git hooks"); }
      if (existsSync(join(ROOT, "hooks", "pre-push-gate.sh"))) { score += 1; evidenceParts.push("pre-push eval gate"); }
      // 2 pts: protected files
      if (/protected.file|\.env/i.test(combined)) { score += 1; evidenceParts.push("protected file patterns"); }
      if (existsSync(join(ROOT, "hooks", "protected-file-guard.sh"))) { score += 1; evidenceParts.push("file guard hook"); }
      // 2 pts: rollback
      if (/rollback|revert|checkpoint/i.test(combined)) { score += 1; evidenceParts.push("rollback strategy"); }
      const gitopsAgent = agents.find((a) => a.name.includes("gitops"));
      if (gitopsAgent) { score += 1; evidenceParts.push(`gitops: ${gitopsAgent.name}`); }
      // 2 pts: CI/CD
      if (existsSync(join(ROOT, ".github", "workflows", "ci.yml"))) { score += 1; evidenceParts.push("CI pipeline"); }
      if (existsSync(join(ROOT, "hooks", "pre-commit-gitleaks.sh"))) { score += 1; evidenceParts.push("gitleaks pre-commit"); }
      // 2 pts: scope + ownership
      if (existsSync(join(ROOT, "scripts", "lib", "file-ownership.ts"))) { score += 1; evidenceParts.push("file ownership"); }
      if (existsSync(join(ROOT, "hooks", "scope-enforcement.sh"))) { score += 1; evidenceParts.push("scope enforcement"); }
      break;
    }
  }

  return {
    dimension,
    score: Math.max(1, Math.min(10, score)),
    evidence: evidenceParts.join("; ") || "baseline score",
  };
}

function parseHistoricalScores(): number[] {
  const scores: number[] = [];

  // Parse from convergence log
  const logPath = join(OUTPUT_DIR, "CONVERGENCE-LOG.md");
  const logContent = readFileOrNull(logPath);
  if (logContent) {
    const gradePattern = /\|\s*\d+.*?\|\s*([\d.]+)\s*\/10/g;
    let match;
    while ((match = gradePattern.exec(logContent)) !== null) {
      const val = parseFloat(match[1]);
      if (!isNaN(val) && val >= 1 && val <= 10) scores.push(val);
    }
  }

  // Parse from previous eval reports
  const reportPath = join(OUTPUT_DIR, "EVAL-REPORT.md");
  const reportContent = readFileOrNull(reportPath);
  if (reportContent) {
    const overallPattern = /Overall.*?:\s*([\d.]+)\s*\/\s*10/gi;
    let match;
    while ((match = overallPattern.exec(reportContent)) !== null) {
      const val = parseFloat(match[1]);
      if (!isNaN(val) && val >= 1 && val <= 10) scores.push(val);
    }
  }

  return scores;
}

function determineTrend(current: number, historical: number[]): "improving" | "stable" | "declining" | "unknown" {
  if (historical.length < 2) return "unknown";

  const recent = historical.slice(-3);
  const avg = recent.reduce((s, v) => s + v, 0) / recent.length;

  if (current > avg + 0.3) return "improving";
  if (current < avg - 0.3) return "declining";
  return "stable";
}

function runTier3(agents: AgentMeta[], commands: CommandMeta[]): QualityReport {
  const dimensions = QUALITY_DIMENSIONS.map((d) => scoreDimension(d, agents, commands));
  const overallScore = parseFloat(
    (dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length).toFixed(1)
  );
  const historicalScores = parseHistoricalScores();
  const trend = determineTrend(overallScore, historicalScores);

  return { overallScore, dimensions, trend, historicalScores };
}

// ─── Report Generation ───────────────────────────────────────

function severityIcon(s: Finding["severity"]): string {
  if (s === "critical") return "X";
  if (s === "warning") return "!";
  return "-";
}

function severityLabel(s: Finding["severity"]): string {
  if (s === "critical") return "CRITICAL";
  if (s === "warning") return "WARNING";
  return "INFO";
}

function trendArrow(t: QualityReport["trend"]): string {
  if (t === "improving") return "^ IMPROVING";
  if (t === "declining") return "v DECLINING";
  if (t === "stable") return "= STABLE";
  return "? UNKNOWN";
}

function formatGrade(score: number): string {
  if (score >= 9.5) return "A+";
  if (score >= 9.0) return "A";
  if (score >= 8.5) return "A-";
  if (score >= 8.0) return "B+";
  if (score >= 7.5) return "B";
  if (score >= 7.0) return "B-";
  if (score >= 6.5) return "C+";
  if (score >= 6.0) return "C";
  if (score >= 5.5) return "C-";
  if (score >= 5.0) return "D+";
  if (score >= 4.5) return "D";
  if (score >= 4.0) return "D-";
  return "F";
}

function printConsoleReport(result: EvalResult): void {
  const w = 68;
  console.log("");
  console.log("  ProductionOS 3-Tier Evaluation Report");
  console.log("  " + "=".repeat(w));
  console.log(`  Timestamp: ${result.timestamp}`);
  console.log(`  Grade: ${result.grade} (${result.tier3.overallScore}/10)`);
  console.log(`  Trend: ${trendArrow(result.tier3.trend)}`);
  console.log("");

  // Tier 1
  const t1c = result.tier1.findings.filter((f) => f.severity === "critical").length;
  const t1w = result.tier1.findings.filter((f) => f.severity === "warning").length;
  const t1i = result.tier1.findings.filter((f) => f.severity === "info").length;
  console.log("  TIER 1: Static Analysis");
  console.log("  " + "-".repeat(w));
  console.log(`  Results: ${t1c} critical, ${t1w} warnings, ${t1i} info`);

  for (const f of result.tier1.findings) {
    if (f.severity === "info") continue;
    const fileTag = f.file ? ` [${f.file}]` : "";
    console.log(`    [${severityIcon(f.severity)}] ${f.category}: ${f.message}${fileTag}`);
  }
  console.log("");

  // Tier 2
  const t2c = result.tier2.findings.filter((f) => f.severity === "critical").length;
  const t2w = result.tier2.findings.filter((f) => f.severity === "warning").length;
  const t2i = result.tier2.findings.filter((f) => f.severity === "info").length;
  console.log("  TIER 2: Functional Validation");
  console.log("  " + "-".repeat(w));
  console.log(`  Results: ${t2c} critical, ${t2w} warnings, ${t2i} info`);

  for (const f of result.tier2.findings) {
    if (f.severity === "info") continue;
    const fileTag = f.file ? ` [${f.file}]` : "";
    console.log(`    [${severityIcon(f.severity)}] ${f.category}: ${f.message}${fileTag}`);
  }
  console.log("");

  // Tier 3
  console.log("  TIER 3: Quality Scoring");
  console.log("  " + "-".repeat(w));
  console.log(`  ${"Dimension".padEnd(22)} ${"Score".padStart(6)}  Evidence`);
  console.log("  " + "-".repeat(w));

  for (const d of result.tier3.dimensions) {
    const evidenceShort = d.evidence.length > 40 ? d.evidence.slice(0, 37) + "..." : d.evidence;
    console.log(`  ${d.dimension.padEnd(22)} ${d.score.toFixed(1).padStart(5)}/10  ${evidenceShort}`);
  }
  console.log("  " + "-".repeat(w));
  console.log(`  ${"OVERALL".padEnd(22)} ${result.tier3.overallScore.toFixed(1).padStart(5)}/10  Grade: ${result.grade}`);

  if (result.tier3.historicalScores.length > 0) {
    console.log(`\n  Historical: [${result.tier3.historicalScores.map((s) => s.toFixed(1)).join(", ")}]`);
  }

  // Summary
  console.log("");
  console.log("  " + "=".repeat(w));
  const totalFindings = result.allFindings.length;
  const criticals = result.allFindings.filter((f) => f.severity === "critical").length;
  console.log(`  Total: ${totalFindings} findings (${criticals} critical)`);
  console.log(`  Report saved: .productionos/EVAL-REPORT.md`);
  console.log("");
}

function generateMarkdownReport(result: EvalResult): string {
  const lines: string[] = [];

  lines.push("# ProductionOS Evaluation Report");
  lines.push("");
  lines.push(`**Generated:** ${result.timestamp}`);
  lines.push(`**Grade:** ${result.grade} (${result.tier3.overallScore}/10)`);
  lines.push(`**Trend:** ${trendArrow(result.tier3.trend)}`);
  lines.push("");

  // Tier 1
  lines.push("## Tier 1: Static Analysis");
  lines.push("");
  if (result.tier1.findings.length > 0) {
    lines.push("| Severity | Category | Message | File |");
    lines.push("|----------|----------|---------|------|");
    for (const f of result.tier1.findings) {
      lines.push(`| ${severityLabel(f.severity)} | ${f.category} | ${f.message} | ${f.file || "-"} |`);
    }
  } else {
    lines.push("No findings.");
  }
  lines.push("");

  // Tier 2
  lines.push("## Tier 2: Functional Validation");
  lines.push("");
  if (result.tier2.findings.length > 0) {
    lines.push("| Severity | Category | Message | File |");
    lines.push("|----------|----------|---------|------|");
    for (const f of result.tier2.findings) {
      lines.push(`| ${severityLabel(f.severity)} | ${f.category} | ${f.message} | ${f.file || "-"} |`);
    }
  } else {
    lines.push("No findings.");
  }
  lines.push("");

  // Tier 3
  lines.push("## Tier 3: Quality Scoring");
  lines.push("");
  lines.push("| Dimension | Score | Evidence |");
  lines.push("|-----------|-------|----------|");
  for (const d of result.tier3.dimensions) {
    lines.push(`| ${d.dimension} | ${d.score.toFixed(1)}/10 | ${d.evidence} |`);
  }
  lines.push("");
  lines.push(`**Overall: ${result.tier3.overallScore.toFixed(1)}/10 (${result.grade})**`);
  lines.push("");

  // Historical
  if (result.tier3.historicalScores.length > 0) {
    lines.push("## Historical Scores");
    lines.push("");
    lines.push(`Previous runs: ${result.tier3.historicalScores.map((s) => s.toFixed(1)).join(" -> ")}`);
    lines.push(`Current: ${result.tier3.overallScore.toFixed(1)}`);
    lines.push(`Trend: ${trendArrow(result.tier3.trend)}`);
    lines.push("");
  }

  // Summary
  lines.push("## Summary");
  lines.push("");
  const criticals = result.allFindings.filter((f) => f.severity === "critical").length;
  const warnings = result.allFindings.filter((f) => f.severity === "warning").length;
  const infos = result.allFindings.filter((f) => f.severity === "info").length;
  lines.push(`- **Total findings:** ${result.allFindings.length}`);
  lines.push(`- **Critical:** ${criticals}`);
  lines.push(`- **Warnings:** ${warnings}`);
  lines.push(`- **Info:** ${infos}`);
  lines.push("");
  lines.push("---");
  lines.push(`*Generated by ProductionOS eval-runner at ${result.timestamp}*`);
  lines.push("");

  return lines.join("\n");
}

// ─── Main ────────────────────────────────────────────────────

const timestamp = new Date().toISOString();

console.log("  Collecting agents and commands...");
const agents = collectAgents();
const commands = collectCommands();
console.log(`  Found ${agents.length} agents, ${commands.length} commands`);

console.log("  Running Tier 1: Static Analysis...");
const tier1Findings = runTier1(agents, commands);

console.log("  Running Tier 2: Functional Validation...");
const tier2Findings = runTier2(agents, commands);

console.log("  Running Tier 3: Quality Scoring...");
const tier3Report = runTier3(agents, commands);

const allFindings = [...tier1Findings, ...tier2Findings];

const result: EvalResult = {
  timestamp,
  tier1: {
    pass: tier1Findings.filter((f) => f.severity === "info").length,
    fail: tier1Findings.filter((f) => f.severity === "critical").length,
    warn: tier1Findings.filter((f) => f.severity === "warning").length,
    findings: tier1Findings,
  },
  tier2: {
    pass: tier2Findings.filter((f) => f.severity === "info").length,
    fail: tier2Findings.filter((f) => f.severity === "critical").length,
    warn: tier2Findings.filter((f) => f.severity === "warning").length,
    findings: tier2Findings,
  },
  tier3: tier3Report,
  allFindings,
  grade: formatGrade(tier3Report.overallScore),
};

// Print console report
printConsoleReport(result);

// Write markdown report
mkdirSync(OUTPUT_DIR, { recursive: true });
const reportPath = join(OUTPUT_DIR, "EVAL-REPORT.md");
writeFileSync(reportPath, generateMarkdownReport(result), "utf-8");

// Exit code: fail on criticals
const criticalCount = allFindings.filter((f) => f.severity === "critical").length;
process.exit(criticalCount > 0 ? 1 : 0);
