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
const HEAVY_TOKEN_THRESHOLD = 3000;

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
  let score = 5;
  const evidenceParts: string[] = [];

  switch (dimension) {
    case "Code Quality": {
      const agentCount = Math.max(agents.length, 1);
      const avgLines = agents.reduce((s, a) => s + a.lineCount, 0) / agentCount;
      if (avgLines > 100) { score += 1; evidenceParts.push(`avg ${Math.round(avgLines)} lines/agent`); }
      if (avgLines > 200) { score += 1; evidenceParts.push("substantial agent definitions"); }

      const withRole = agents.filter((a) => a.hasRole).length;
      const rolePct = (withRole / agentCount) * 100;
      if (rolePct === 100) { score += 1; evidenceParts.push("100% role coverage"); }
      else if (rolePct < 80) { score -= 1; evidenceParts.push(`only ${rolePct.toFixed(0)}% have role tags`); }
      break;
    }
    case "Security": {
      const allAgentContent = agents.map((a) => readFileOrNull(join(AGENTS_DIR, a.file)) || "").join("\n");
      const allCmdContent = commands.map((c) => readFileOrNull(join(COMMANDS_DIR, c.file)) || "").join("\n");
      const combined = allAgentContent + "\n" + allCmdContent;

      if (combined.includes("prompt injection")) { score += 1; evidenceParts.push("prompt injection defense"); }
      if (combined.includes("untrusted")) { score += 1; evidenceParts.push("untrusted data handling"); }
      if (/secret|credential|api.key/i.test(combined) && /env.var|process\.env/i.test(combined)) {
        score += 1; evidenceParts.push("secrets via env vars");
      }
      const secAgent = agents.find((a) => a.name.includes("security"));
      if (secAgent) { score += 1; evidenceParts.push(`security agent: ${secAgent.name}`); }
      break;
    }
    case "Performance": {
      const heavyAgents = agents.filter((a) => a.tokenEstimate > HEAVY_TOKEN_THRESHOLD).length;
      if (heavyAgents === 0) { score += 2; evidenceParts.push("no heavy agents"); }
      else { score -= 1; evidenceParts.push(`${heavyAgents} heavy agent(s)`); }

      const perfAgent = agents.find((a) => a.name.includes("performance"));
      if (perfAgent) { score += 1; evidenceParts.push(`perf agent: ${perfAgent.name}`); }
      break;
    }
    case "UX/UI": {
      const uxAgent = agents.find((a) => a.name.includes("ux") || a.name.includes("frontend"));
      if (uxAgent) { score += 2; evidenceParts.push(`UX agent: ${uxAgent.name}`); }

      const learnCmd = commands.find((c) => c.file.includes("learn"));
      if (learnCmd) { score += 1; evidenceParts.push("learn-mode for user education"); }
      break;
    }
    case "Test Coverage": {
      const testFiles = walkFiles(join(ROOT, "tests"), ".ts");
      if (testFiles.length > 0) { score += 2; evidenceParts.push(`${testFiles.length} test file(s)`); }
      else { score -= 2; evidenceParts.push("no test files found"); }

      const testAgent = agents.find((a) => a.name.includes("test"));
      if (testAgent) { score += 1; evidenceParts.push(`test agent: ${testAgent.name}`); }
      break;
    }
    case "Accessibility": {
      const allAgentContent = agents.map((a) => readFileOrNull(join(AGENTS_DIR, a.file)) || "").join("\n");
      if (/a11y|accessibility|WCAG|ARIA/i.test(allAgentContent)) {
        score += 2; evidenceParts.push("accessibility references in agents");
      } else {
        score -= 1; evidenceParts.push("no accessibility references");
      }
      break;
    }
    case "Documentation": {
      const rootMd = listMdFiles(ROOT);
      const hasReadme = rootMd.includes("README.md");
      const hasChangelog = rootMd.includes("CHANGELOG.md");
      const hasArch = rootMd.includes("ARCHITECTURE.md");
      const hasContrib = rootMd.includes("CONTRIBUTING.md");

      if (hasReadme) { score += 1; evidenceParts.push("README present"); }
      if (hasChangelog) { score += 1; evidenceParts.push("CHANGELOG present"); }
      if (hasArch) { score += 1; evidenceParts.push("ARCHITECTURE present"); }
      if (hasContrib) { score += 1; evidenceParts.push("CONTRIBUTING present"); }
      if (!hasReadme) { score -= 2; evidenceParts.push("missing README"); }
      break;
    }
    case "Error Handling": {
      const allAgentContent = agents.map((a) => readFileOrNull(join(AGENTS_DIR, a.file)) || "").join("\n");
      if (/rollback|self-heal|recover|graceful/i.test(allAgentContent)) {
        score += 2; evidenceParts.push("recovery/rollback patterns");
      }
      const healAgent = agents.find((a) => a.name.includes("heal") || a.name.includes("guardrail"));
      if (healAgent) { score += 1; evidenceParts.push(`error agent: ${healAgent.name}`); }
      break;
    }
    case "Observability": {
      const convLog = readFileOrNull(join(TEMPLATES_DIR, "CONVERGENCE-LOG.md"));
      if (convLog) { score += 2; evidenceParts.push("convergence tracking template"); }

      if (existsSync(join(ROOT, "scripts", "review-dashboard.ts"))) {
        score += 1; evidenceParts.push("review dashboard script");
      }
      if (existsSync(join(ROOT, "scripts", "context-audit.ts"))) {
        score += 1; evidenceParts.push("context audit script");
      }
      break;
    }
    case "Deployment Safety": {
      const allCmdContent = commands.map((c) => readFileOrNull(join(COMMANDS_DIR, c.file)) || "").join("\n");
      const claudeContent = readFileOrNull(join(ROOT, "CLAUDE.md")) || "";
      const combined = allCmdContent + "\n" + claudeContent;

      if (/pre-commit|pre-push/i.test(combined)) { score += 1; evidenceParts.push("git hook references"); }
      if (/protected.file|\.env/i.test(combined)) { score += 1; evidenceParts.push("protected file patterns"); }
      if (/rollback|revert/i.test(combined)) { score += 1; evidenceParts.push("rollback strategy"); }

      const gitopsAgent = agents.find((a) => a.name.includes("gitops"));
      if (gitopsAgent) { score += 1; evidenceParts.push(`gitops agent: ${gitopsAgent.name}`); }
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
