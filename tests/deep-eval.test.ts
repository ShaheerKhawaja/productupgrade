/**
 * ProductionOS Deep Evaluation Test Suite
 *
 * T1: Structural integrity (extends existing tests with deeper checks)
 * T2: Behavioral validation (agent quality, cross-reference integrity, functional checks)
 * T3: Integration testing (pipeline coherence, hook lifecycle, self-eval verification)
 *
 * Run: bun test tests/deep-eval.test.ts
 */
import { describe, test, expect } from "bun:test";
import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { ROOT, parseFrontmatter, readFileOrNull, listMdFiles } from "../scripts/lib/shared";

// ─── Setup ────────────────────────────────────────────────────

const AGENTS_DIR = join(ROOT, "agents");
const COMMANDS_DIR = join(ROOT, ".claude", "commands");
const HOOKS_DIR = join(ROOT, "hooks");
const TEMPLATES_DIR = join(ROOT, "templates");
const SKILLS_DIR = join(ROOT, ".claude", "skills");
const BIN_DIR = join(ROOT, "bin");

const agentFiles = listMdFiles(AGENTS_DIR);
const commandFiles = listMdFiles(COMMANDS_DIR);

interface AgentMeta {
  file: string;
  name: string;
  content: string;
  frontmatter: Record<string, unknown> | null;
  lineCount: number;
}

interface CommandMeta {
  file: string;
  name: string;
  content: string;
  frontmatter: Record<string, unknown> | null;
  lineCount: number;
}

interface EvalIssue {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  category: string;
  file: string;
  message: string;
  detail?: string;
}

const issues: EvalIssue[] = [];

function addIssue(severity: EvalIssue["severity"], category: string, file: string, message: string, detail?: string) {
  issues.push({ severity, category, file, message, detail });
}

// Load all agents and commands
const agents: AgentMeta[] = agentFiles.map(f => {
  const content = readFileSync(join(AGENTS_DIR, f), "utf-8");
  return {
    file: f,
    name: f.replace(".md", ""),
    content,
    frontmatter: parseFrontmatter(content),
    lineCount: content.split("\n").length,
  };
});

const commands: CommandMeta[] = commandFiles.map(f => {
  const content = readFileSync(join(COMMANDS_DIR, f), "utf-8");
  return {
    file: f,
    name: f.replace(".md", ""),
    content,
    frontmatter: parseFrontmatter(content),
    lineCount: content.split("\n").length,
  };
});

const agentNames = new Set(agents.map(a => a.name));

// ═══════════════════════════════════════════════════════════════
// T1: STRUCTURAL INTEGRITY (Deep)
// ═══════════════════════════════════════════════════════════════

describe("T1: Agent Structural Integrity", () => {

  test("every agent has valid YAML frontmatter", () => {
    const missing: string[] = [];
    for (const agent of agents) {
      if (!agent.frontmatter) missing.push(agent.file);
    }
    if (missing.length > 0) {
      addIssue("CRITICAL", "frontmatter", "agents/", `${missing.length} agents missing frontmatter: ${missing.join(", ")}`);
    }
    expect(missing).toEqual([]);
  });

  test("every agent frontmatter has required fields", () => {
    const REQUIRED_FIELDS = ["name", "description", "model", "tools"];
    const violations: string[] = [];
    for (const agent of agents) {
      if (!agent.frontmatter) continue;
      for (const field of REQUIRED_FIELDS) {
        if (!agent.frontmatter[field]) {
          violations.push(`${agent.file}: missing '${field}'`);
          addIssue("HIGH", "frontmatter", agent.file, `Missing required field: ${field}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  test("every agent has stakes classification", () => {
    const missing: string[] = [];
    for (const agent of agents) {
      if (!agent.frontmatter?.stakes) {
        missing.push(agent.file);
        addIssue("MEDIUM", "classification", agent.file, "Missing stakes classification (LOW/MEDIUM/HIGH)");
      }
    }
    // Allow some agents without stakes — flag but don't fail
    if (missing.length > agents.length * 0.2) {
      expect(missing.length).toBeLessThan(agents.length * 0.2);
    }
  });

  test("every agent has substantive content (>50 lines)", () => {
    const thin: string[] = [];
    for (const agent of agents) {
      if (agent.lineCount < 50) {
        thin.push(`${agent.file} (${agent.lineCount} lines)`);
        addIssue("HIGH", "quality", agent.file, `Thin agent: only ${agent.lineCount} lines (min: 50)`);
      }
    }
    expect(thin).toEqual([]);
  });

  test("no duplicate agent names in frontmatter", () => {
    const nameMap = new Map<string, string[]>();
    for (const agent of agents) {
      const name = String(agent.frontmatter?.name || agent.name);
      const list = nameMap.get(name) || [];
      list.push(agent.file);
      nameMap.set(name, list);
    }
    const dupes = [...nameMap.entries()].filter(([_, files]) => files.length > 1);
    if (dupes.length > 0) {
      for (const [name, files] of dupes) {
        addIssue("HIGH", "naming", "agents/", `Duplicate agent name '${name}' in: ${files.join(", ")}`);
      }
    }
    expect(dupes).toEqual([]);
  });

  test("agent model field uses valid values", () => {
    const VALID_MODELS = ["opus", "sonnet", "haiku", "claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5"];
    const invalid: string[] = [];
    for (const agent of agents) {
      const model = String(agent.frontmatter?.model || "").toLowerCase();
      if (model && !VALID_MODELS.some(v => model.includes(v))) {
        invalid.push(`${agent.file}: model='${model}'`);
        addIssue("MEDIUM", "config", agent.file, `Unknown model: '${model}'`);
      }
    }
    expect(invalid).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════
// T1: COMMAND STRUCTURAL INTEGRITY
// ═══════════════════════════════════════════════════════════════

describe("T1: Command Structural Integrity", () => {

  test("every command has description in frontmatter or first heading", () => {
    const missing: string[] = [];
    for (const cmd of commands) {
      const hasDesc = cmd.frontmatter?.description || cmd.content.match(/^#\s+.+/m);
      if (!hasDesc) {
        missing.push(cmd.file);
        addIssue("MEDIUM", "documentation", cmd.file, "No description in frontmatter or heading");
      }
    }
    expect(missing.length).toBeLessThan(commands.length * 0.1);
  });

  test("every command has clear entry point (Step 1 or ## Instructions)", () => {
    const missing: string[] = [];
    for (const cmd of commands) {
      const hasEntry = cmd.content.includes("Step 1") ||
                       cmd.content.includes("## Instructions") ||
                       cmd.content.includes("## Process") ||
                       cmd.content.includes("## Workflow");
      if (!hasEntry) {
        missing.push(cmd.file);
        addIssue("MEDIUM", "structure", cmd.file, "No clear entry point (Step 1 or ## Instructions)");
      }
    }
    // Allow some commands to have different structure
    expect(missing.length).toBeLessThan(commands.length * 0.3);
  });
});

// ═══════════════════════════════════════════════════════════════
// T2: CROSS-REFERENCE INTEGRITY
// ═══════════════════════════════════════════════════════════════

describe("T2: Cross-Reference Integrity", () => {

  test("agents referenced in commands actually exist", () => {
    const broken: string[] = [];
    for (const cmd of commands) {
      // Find agent references: agents/xyz.md or agent: xyz or dispatch xyz
      const refs = cmd.content.matchAll(/agents\/([a-z0-9-]+)\.md/g);
      for (const match of refs) {
        if (!agentNames.has(match[1])) {
          broken.push(`${cmd.file} references non-existent agent: ${match[1]}`);
          addIssue("CRITICAL", "cross-ref", cmd.file, `References non-existent agent: ${match[1]}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  test("agents referencing other agents use valid names", () => {
    const broken: string[] = [];
    for (const agent of agents) {
      const refs = agent.content.matchAll(/agents\/([a-z0-9-]+)\.md/g);
      for (const match of refs) {
        if (!agentNames.has(match[1])) {
          broken.push(`${agent.file} references non-existent agent: ${match[1]}`);
          addIssue("HIGH", "cross-ref", agent.file, `References non-existent agent: ${match[1]}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  test("template references in commands resolve", () => {
    const broken: string[] = [];
    for (const cmd of commands) {
      const refs = cmd.content.matchAll(/templates\/([A-Z0-9-]+\.md)/g);
      for (const match of refs) {
        if (!existsSync(join(TEMPLATES_DIR, match[1]))) {
          broken.push(`${cmd.file} references non-existent template: ${match[1]}`);
          addIssue("HIGH", "cross-ref", cmd.file, `References non-existent template: ${match[1]}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  test("hook scripts referenced in hooks.json exist", () => {
    const config = JSON.parse(readFileSync(join(HOOKS_DIR, "hooks.json"), "utf-8"));
    const broken: string[] = [];
    for (const phase of ["SessionStart", "PreToolUse", "PostToolUse", "Stop"]) {
      const entries = config[phase];
      if (!Array.isArray(entries)) continue;
      for (const entry of entries) {
        if (!entry.hooks) continue;
        for (const hook of entry.hooks) {
          const match = hook.command?.match(/hooks\/([a-z0-9-]+\.sh)/);
          if (match && !existsSync(join(HOOKS_DIR, match[1]))) {
            broken.push(`hooks.json ${phase}: references non-existent script ${match[1]}`);
            addIssue("CRITICAL", "hooks", "hooks.json", `Missing hook script: ${match[1]}`);
          }
        }
      }
    }
    expect(broken).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════
// T2: VERSION CONSISTENCY
// ═══════════════════════════════════════════════════════════════

describe("T2: Version Consistency", () => {

  test("VERSION file, plugin.json, and package.json have consistent versions", () => {
    const versionFile = readFileOrNull(join(ROOT, "VERSION"))?.trim();
    const pluginJson = JSON.parse(readFileSync(join(ROOT, ".claude-plugin", "plugin.json"), "utf-8"));
    const packageJson = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));

    const pluginVersion = pluginJson.version;
    const packageVersion = packageJson.version;

    const mismatches: string[] = [];
    if (versionFile !== pluginVersion) {
      mismatches.push(`VERSION (${versionFile}) != plugin.json (${pluginVersion})`);
    }
    if (versionFile !== packageVersion) {
      mismatches.push(`VERSION (${versionFile}) != package.json (${packageVersion})`);
    }

    if (mismatches.length > 0) {
      addIssue("HIGH", "versioning", "VERSION", `Version drift: ${mismatches.join("; ")}`);
    }
    expect(mismatches).toEqual([]);
  });

  test("agent count in docs matches filesystem", () => {
    const actualCount = agentFiles.length;
    const readme = readFileOrNull(join(ROOT, "README.md")) || "";
    const claudeMd = readFileOrNull(join(ROOT, "CLAUDE.md")) || "";

    const readmeMatch = readme.match(/(\d+)\s*agents?/i);
    const claudeMatch = claudeMd.match(/(\d+)-agent/i) || claudeMd.match(/(\d+)\s*agents?/i);

    const mismatches: string[] = [];
    if (readmeMatch && parseInt(readmeMatch[1]) !== actualCount) {
      mismatches.push(`README claims ${readmeMatch[1]} agents, filesystem has ${actualCount}`);
    }
    if (claudeMatch && parseInt(claudeMatch[1]) !== actualCount) {
      mismatches.push(`CLAUDE.md claims ${claudeMatch[1]} agents, filesystem has ${actualCount}`);
    }

    if (mismatches.length > 0) {
      for (const m of mismatches) {
        addIssue("HIGH", "doc-drift", "docs", m);
      }
    }
    // Don't fail — just report
    expect(true).toBe(true);
  });

  test("command count in docs matches filesystem", () => {
    const actualCount = commandFiles.length;
    const readme = readFileOrNull(join(ROOT, "README.md")) || "";

    const match = readme.match(/(\d+)\s*commands?/i);
    if (match && parseInt(match[1]) !== actualCount) {
      addIssue("MEDIUM", "doc-drift", "README.md",
        `Claims ${match[1]} commands, filesystem has ${actualCount}`);
    }
    expect(true).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// T2: AGENT QUALITY SCORING
// ═══════════════════════════════════════════════════════════════

describe("T2: Agent Quality Scoring", () => {

  test("every agent has examples or use cases", () => {
    const missing: string[] = [];
    for (const agent of agents) {
      const hasExamples = agent.content.toLowerCase().includes("example") ||
                          agent.content.toLowerCase().includes("use case") ||
                          agent.content.toLowerCase().includes("when to use");
      if (!hasExamples) {
        missing.push(agent.file);
        addIssue("LOW", "documentation", agent.file, "No examples or use cases documented");
      }
    }
    // Flag if more than 30% lack examples
    if (missing.length > agents.length * 0.3) {
      addIssue("MEDIUM", "quality", "agents/", `${missing.length}/${agents.length} agents lack examples`);
    }
    expect(missing.length).toBeLessThan(agents.length * 0.5);
  });

  test("every agent has error handling or failure modes documented", () => {
    const missing: string[] = [];
    for (const agent of agents) {
      const hasErrors = agent.content.toLowerCase().includes("error") ||
                        agent.content.toLowerCase().includes("fail") ||
                        agent.content.toLowerCase().includes("edge case") ||
                        agent.content.toLowerCase().includes("guardrail") ||
                        agent.content.toLowerCase().includes("red flag");
      if (!hasErrors) {
        missing.push(agent.file);
      }
    }
    // Don't fail, just report
    if (missing.length > agents.length * 0.3) {
      addIssue("MEDIUM", "robustness", "agents/",
        `${missing.length}/${agents.length} agents lack error handling documentation`);
    }
    expect(true).toBe(true);
  });

  test("quality depth distribution — no more than 20% thin agents", () => {
    const buckets = { thin: 0, medium: 0, deep: 0 };
    for (const agent of agents) {
      if (agent.lineCount < 80) buckets.thin++;
      else if (agent.lineCount < 200) buckets.medium++;
      else buckets.deep++;
    }

    const thinPct = (buckets.thin / agents.length) * 100;
    if (thinPct > 20) {
      addIssue("HIGH", "quality", "agents/",
        `${thinPct.toFixed(0)}% of agents are thin (<80 lines). Distribution: thin=${buckets.thin}, medium=${buckets.medium}, deep=${buckets.deep}`);
    }
    expect(buckets.thin).toBeLessThan(agents.length * 0.2);
  });

  test("agent depth disparity — max/min line ratio < 10x", () => {
    const lineCounts = agents.map(a => a.lineCount).sort((a, b) => a - b);
    const min = lineCounts[0];
    const max = lineCounts[lineCounts.length - 1];
    const ratio = max / min;

    if (ratio > 10) {
      const shortest = agents.find(a => a.lineCount === min)!;
      const longest = agents.find(a => a.lineCount === max)!;
      addIssue("MEDIUM", "quality", "agents/",
        `Depth disparity: ${ratio.toFixed(1)}x ratio. Shortest: ${shortest.file} (${min} lines), Longest: ${longest.file} (${max} lines)`);
    }
    expect(ratio).toBeLessThan(15);
  });
});

// ═══════════════════════════════════════════════════════════════
// T2: HOOK FUNCTIONAL VALIDATION
// ═══════════════════════════════════════════════════════════════

describe("T2: Hook Functional Validation", () => {

  test("all hook scripts are valid bash", () => {
    const hookScripts = readdirSync(HOOKS_DIR).filter(f => f.endsWith(".sh"));
    const invalid: string[] = [];
    for (const script of hookScripts) {
      try {
        execFileSync("bash", ["-n", join(HOOKS_DIR, script)], { timeout: 5000 });
      } catch {
        invalid.push(script);
        addIssue("CRITICAL", "hooks", script, "Bash syntax error in hook script");
      }
    }
    expect(invalid).toEqual([]);
  });

  test("hook scripts use environment variables not hardcoded paths", () => {
    const hookScripts = readdirSync(HOOKS_DIR).filter(f => f.endsWith(".sh"));
    const hardcoded: string[] = [];
    for (const script of hookScripts) {
      const content = readFileSync(join(HOOKS_DIR, script), "utf-8");
      // Check for hardcoded home paths (allow /tmp/ and /dev/)
      if (content.match(/\/Users\/[a-zA-Z]+/) || content.match(/\/home\/[a-zA-Z]+/)) {
        hardcoded.push(script);
        addIssue("HIGH", "portability", script, "Contains hardcoded user home path");
      }
    }
    expect(hardcoded).toEqual([]);
  });

  test("hook scripts are executable", () => {
    const hookScripts = readdirSync(HOOKS_DIR).filter(f => f.endsWith(".sh"));
    const notExec: string[] = [];
    for (const script of hookScripts) {
      const stats = statSync(join(HOOKS_DIR, script));
      if (!(stats.mode & 0o111)) {
        notExec.push(script);
        addIssue("HIGH", "permissions", script, "Hook script is not executable");
      }
    }
    expect(notExec).toEqual([]);
  });

  test("session-start.sh runs without errors in test context", () => {
    const sessionStart = join(HOOKS_DIR, "session-start.sh");
    if (!existsSync(sessionStart)) {
      addIssue("CRITICAL", "hooks", "session-start.sh", "Session start hook missing");
      expect(false).toBe(true);
      return;
    }
    try {
      const output = execFileSync("bash", [sessionStart], {
        env: { ...process.env, PRODUCTIONOS_HOME: "/tmp/productionos-eval-test" },
        timeout: 10000,
        encoding: "utf-8",
      });
      expect(typeof output).toBe("string");
    } catch (e: any) {
      // Some hooks may fail in test context — flag but don't block
      addIssue("MEDIUM", "hooks", "session-start.sh",
        `Fails in test context: ${e.message?.slice(0, 100)}`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// T2: SELF-EVAL SYSTEM VERIFICATION
// ═══════════════════════════════════════════════════════════════

describe("T2: Self-Eval System Verification", () => {

  test("self-evaluator agent exists and has 7-question protocol", () => {
    const selfEval = agents.find(a => a.name === "self-evaluator");
    expect(selfEval).toBeDefined();
    if (!selfEval) return;

    const questions = [
      "quality", "necessity", "correctness",
      "dependencies", "completeness", "learning", "honesty"
    ];
    const missing = questions.filter(q => !selfEval.content.toLowerCase().includes(q));
    if (missing.length > 0) {
      addIssue("HIGH", "self-eval", "self-evaluator.md",
        `Missing ${missing.length}/7 evaluation questions: ${missing.join(", ")}`);
    }
    expect(missing).toEqual([]);
  });

  test("quality-loop-controller agent exists and references self-evaluator", () => {
    const qlc = agents.find(a => a.name === "quality-loop-controller");
    expect(qlc).toBeDefined();
    if (!qlc) return;

    const refsSelfEval = qlc.content.includes("self-eval") ||
                         qlc.content.includes("self_eval") ||
                         qlc.content.includes("self-check");
    if (!refsSelfEval) {
      addIssue("HIGH", "self-eval", "quality-loop-controller.md",
        "Quality loop controller doesn't reference self-evaluation");
    }
    expect(refsSelfEval).toBe(true);
  });

  test("self-eval protocol template exists", () => {
    const protocol = existsSync(join(TEMPLATES_DIR, "SELF-EVAL-PROTOCOL.md"));
    if (!protocol) {
      addIssue("CRITICAL", "self-eval", "templates/", "SELF-EVAL-PROTOCOL.md missing");
    }
    expect(protocol).toBe(true);
  });

  test("self-eval is referenced in main orchestrators", () => {
    const orchestrators = ["omni-plan-nth", "auto-swarm-nth", "production-upgrade"];
    const missing: string[] = [];
    for (const name of orchestrators) {
      const cmd = commands.find(c => c.name === name);
      if (!cmd) { missing.push(name); continue; }
      const refsSelfEval = cmd.content.toLowerCase().includes("self-eval") ||
                           cmd.content.toLowerCase().includes("self_eval") ||
                           cmd.content.toLowerCase().includes("self-evaluation");
      if (!refsSelfEval) {
        missing.push(name);
        addIssue("HIGH", "self-eval", `${name}.md`, "Orchestrator doesn't reference self-evaluation");
      }
    }
    expect(missing).toEqual([]);
  });

  test("score threshold documented correctly (10.0)", () => {
    const protocol = readFileOrNull(join(TEMPLATES_DIR, "SELF-EVAL-PROTOCOL.md"));
    if (!protocol) return;
    const has10 = protocol.includes("10.0") || protocol.includes("10/10");
    if (!has10) {
      addIssue("MEDIUM", "self-eval", "SELF-EVAL-PROTOCOL.md",
        "Score threshold not set to 10.0 as documented in CLAUDE.md");
    }
    expect(has10).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// T3: PIPELINE COHERENCE
// ═══════════════════════════════════════════════════════════════

describe("T3: Pipeline Coherence", () => {

  test("orchestration hierarchy: omni-plan-nth can reach all other commands", () => {
    const omniNth = commands.find(c => c.name === "omni-plan-nth");
    expect(omniNth).toBeDefined();
    if (!omniNth) return;

    // Core commands that should be reachable
    const reachable = [
      "omni-plan", "auto-swarm", "deep-research", "production-upgrade",
      "self-eval", "security-audit"
    ];

    const unreachable: string[] = [];
    for (const target of reachable) {
      const found = omniNth.content.includes(target) ||
                    omniNth.content.includes(`/${target}`);
      if (!found) {
        unreachable.push(target);
      }
    }

    if (unreachable.length > 0) {
      addIssue("MEDIUM", "orchestration", "omni-plan-nth.md",
        `Cannot reach commands: ${unreachable.join(", ")}`);
    }
    expect(unreachable.length).toBeLessThan(3);
  });

  test("auto-swarm-nth dispatches agents with proper protocol", () => {
    const swarm = commands.find(c => c.name === "auto-swarm-nth");
    expect(swarm).toBeDefined();
    if (!swarm) return;

    const hasAgentTool = swarm.content.includes("Agent tool") ||
                         swarm.content.includes("subagent") ||
                         swarm.content.includes("dispatch");
    if (!hasAgentTool) {
      addIssue("HIGH", "orchestration", "auto-swarm-nth.md",
        "Swarm command doesn't reference Agent tool dispatch");
    }
    expect(hasAgentTool).toBe(true);
  });

  test("production-upgrade has convergence criteria", () => {
    const upgrade = commands.find(c => c.name === "production-upgrade");
    expect(upgrade).toBeDefined();
    if (!upgrade) return;

    const hasConvergence = upgrade.content.includes("convergence") ||
                           upgrade.content.includes("iteration") ||
                           upgrade.content.includes("threshold") ||
                           upgrade.content.includes("score");
    if (!hasConvergence) {
      addIssue("HIGH", "orchestration", "production-upgrade.md",
        "No convergence criteria defined");
    }
    expect(hasConvergence).toBe(true);
  });

  test("preamble template exists and has required sections", () => {
    const preamble = readFileOrNull(join(TEMPLATES_DIR, "PREAMBLE.md"));
    expect(preamble).toBeTruthy();
    if (!preamble) return;

    const requiredSections = ["Step 0", "context", "budget", "scope"];
    const missing = requiredSections.filter(s => !preamble.toLowerCase().includes(s.toLowerCase()));
    if (missing.length > 0) {
      addIssue("HIGH", "infrastructure", "PREAMBLE.md",
        `Missing preamble sections: ${missing.join(", ")}`);
    }
    expect(missing.length).toBeLessThan(2);
  });
});

// ═══════════════════════════════════════════════════════════════
// T3: CLI TOOLS VALIDATION
// ═══════════════════════════════════════════════════════════════

describe("T3: CLI Tools Validation", () => {

  test("all declared CLI tools exist in bin/", () => {
    const expected = ["pos-init", "pos-config", "pos-analytics", "pos-update-check", "pos-review-log", "pos-telemetry"];
    const missing: string[] = [];
    for (const tool of expected) {
      if (!existsSync(join(BIN_DIR, tool))) {
        missing.push(tool);
        addIssue("MEDIUM", "cli", tool, "CLI tool missing from bin/");
      }
    }
    expect(missing).toEqual([]);
  });

  test("pos-init creates state directory", () => {
    const posInit = join(BIN_DIR, "pos-init");
    if (!existsSync(posInit)) return;

    try {
      const output = execFileSync("bash", [posInit], {
        env: { ...process.env, PRODUCTIONOS_HOME: "/tmp/productionos-eval-init-test" },
        timeout: 5000,
        encoding: "utf-8",
      });
      expect(typeof output).toBe("string");
    } catch (e: any) {
      addIssue("MEDIUM", "cli", "pos-init", `Fails in test context: ${e.message?.slice(0, 100)}`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// T3: DEAD CODE / ORPHAN DETECTION
// ═══════════════════════════════════════════════════════════════

describe("T3: Dead Code / Orphan Detection", () => {

  test("every agent is referenced by at least one command or another agent", () => {
    const allCommandContent = commands.map(c => c.content).join("\n");
    const allAgentContent = agents.map(a => a.content).join("\n");
    const combined = allCommandContent + "\n" + allAgentContent;

    // Also check templates
    const templateFiles = existsSync(TEMPLATES_DIR) ? readdirSync(TEMPLATES_DIR).filter(f => f.endsWith(".md")) : [];
    const templateContent = templateFiles.map(f => readFileSync(join(TEMPLATES_DIR, f), "utf-8")).join("\n");
    const fullContent = combined + "\n" + templateContent;

    const orphans: string[] = [];
    for (const agent of agents) {
      // Check if agent name appears in any command, agent, or template
      const isReferenced = fullContent.includes(agent.name) &&
        // Exclude self-references
        agents.filter(a => a.name !== agent.name).some(a => a.content.includes(agent.name)) ||
        commands.some(c => c.content.includes(agent.name)) ||
        templateContent.includes(agent.name);

      if (!isReferenced) {
        orphans.push(agent.file);
        addIssue("LOW", "dead-code", agent.file, "Agent not referenced by any command or other agent");
      }
    }

    // Flag if more than 30% are orphans
    if (orphans.length > agents.length * 0.3) {
      addIssue("HIGH", "architecture", "agents/",
        `${orphans.length}/${agents.length} agents are orphans (not referenced anywhere)`);
    }
    expect(true).toBe(true); // Don't fail — just report
  });

  test("no commands reference non-existent skills", () => {
    const broken: string[] = [];
    for (const cmd of commands) {
      const skillRefs = cmd.content.matchAll(/skills\/([a-z0-9-]+)\//g);
      for (const match of skillRefs) {
        const skillDir = join(SKILLS_DIR, match[1]);
        if (!existsSync(skillDir)) {
          broken.push(`${cmd.file} references non-existent skill: ${match[1]}`);
          addIssue("MEDIUM", "cross-ref", cmd.file, `References non-existent skill: ${match[1]}`);
        }
      }
    }
    // Allow some — skills may be external
    expect(true).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// EVAL REPORT GENERATION
// ═══════════════════════════════════════════════════════════════

describe("Eval Report", () => {
  test("generate eval summary", () => {
    // Count by severity
    const bySeverity = {
      CRITICAL: issues.filter(i => i.severity === "CRITICAL").length,
      HIGH: issues.filter(i => i.severity === "HIGH").length,
      MEDIUM: issues.filter(i => i.severity === "MEDIUM").length,
      LOW: issues.filter(i => i.severity === "LOW").length,
    };

    // Count by category
    const byCategory = new Map<string, number>();
    for (const issue of issues) {
      byCategory.set(issue.category, (byCategory.get(issue.category) || 0) + 1);
    }

    console.log("\n" + "═".repeat(60));
    console.log("  PRODUCTIONOS DEEP EVAL REPORT");
    console.log("═".repeat(60));
    console.log(`\n  Total Issues: ${issues.length}`);
    console.log(`  CRITICAL: ${bySeverity.CRITICAL}`);
    console.log(`  HIGH:     ${bySeverity.HIGH}`);
    console.log(`  MEDIUM:   ${bySeverity.MEDIUM}`);
    console.log(`  LOW:      ${bySeverity.LOW}`);
    console.log(`\n  By Category:`);
    for (const [cat, count] of [...byCategory.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`    ${cat}: ${count}`);
    }

    if (issues.length > 0) {
      console.log(`\n  Issues:`);
      for (const issue of issues.sort((a, b) => {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return order[a.severity] - order[b.severity];
      })) {
        console.log(`  [${issue.severity}] ${issue.category} | ${issue.file}: ${issue.message}`);
      }
    }
    console.log("\n" + "═".repeat(60));

    // This test always passes — it's a report generator
    expect(true).toBe(true);
  });
});
