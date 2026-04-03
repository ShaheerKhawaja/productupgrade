/**
 * ProductionOS Stats Dashboard — computes and displays system metrics.
 * Run: bun run scripts/stats-dashboard.ts
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { ROOT, walkFiles, listMdFiles, readVersion, parseFrontmatter } from "./lib/shared";
import { collectRepoCounts } from "./lib/runtime-targets";

const STATE_DIR = join(process.env.HOME || "/tmp", ".productionos");

// ─── Helpers ───────────────────────────────────────────────

function countLines(path: string): number {
  try { return readFileSync(path, "utf-8").split("\n").length; } catch { return 0; }
}

function safeExec(cmd: string, args: string[], cwd?: string): string {
  try {
    return execFileSync(cmd, args, { encoding: "utf-8", timeout: 15000, cwd: cwd || ROOT, stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch { return ""; }
}

// ─── Stats Computation ────────────────────────────────────

// System
const version = readVersion() || "unknown";
const repoCounts = collectRepoCounts();
const agentFiles = listMdFiles(join(ROOT, "agents"));
const agentCount = repoCounts.agents;
const commandCount = repoCounts.commands;
const templateCount = repoCounts.templates;
const scriptCount = repoCounts.scripts;
const testFileCount = repoCounts.tests;

// Stakes breakdown
let highStakes = 0, medStakes = 0, lowStakes = 0;
for (const file of agentFiles) {
  const content = readFileSync(join(ROOT, "agents", file), "utf-8");
  const fm = parseFrontmatter(content);
  const stakes = String(fm?.stakes || "").toLowerCase();
  if (stakes === "high") highStakes++;
  else if (stakes === "medium") medStakes++;
  else lowStakes++;
}

// Hooks
const hookCount = repoCounts.hooks;

// Learning
const projectInstincts = existsSync(join(STATE_DIR, "instincts", "project"))
  ? walkFiles(join(STATE_DIR, "instincts", "project")).length : 0;
const globalInstincts = existsSync(join(STATE_DIR, "instincts", "global"))
  ? walkFiles(join(STATE_DIR, "instincts", "global")).length : 0;
const sessionCount = existsSync(join(STATE_DIR, "sessions"))
  ? readdirSync(join(STATE_DIR, "sessions")).filter(f => f.endsWith(".md")).length : 0;
const usageEvents = existsSync(join(STATE_DIR, "analytics", "skill-usage.jsonl"))
  ? countLines(join(STATE_DIR, "analytics", "skill-usage.jsonl")) : 0;

// Git activity
const commitsToday = safeExec("git", ["log", "--oneline", "--since=midnight"], ROOT).split("\n").filter(Boolean).length;
const totalCommits = safeExec("git", ["rev-list", "--count", "--all"], ROOT);

// Last handoff
let lastHandoff = "N/A";
try {
  const handoffs = readdirSync(join(STATE_DIR, "sessions")).filter(f => f.startsWith("handoff-")).sort().reverse();
  if (handoffs.length > 0) lastHandoff = handoffs[0].replace("handoff-", "").replace(".md", "");
} catch { /* no handoffs */ }

// ─── Output ────────────────────────────────────────────────

console.log(`## ProductionOS Stats

### System
| Metric | Value |
|--------|-------|
| Version | ${version} |
| Agents | ${agentCount} (${highStakes} HIGH / ${medStakes} MEDIUM / ${lowStakes} LOW) |
| Commands | ${commandCount} |
| Hooks | ${hookCount} files |
| Templates | ${templateCount} |
| Scripts | ${scriptCount} |
| Test files | ${testFileCount} |

### Learning
| Metric | Value |
|--------|-------|
| Project instincts | ${projectInstincts} |
| Global instincts | ${globalInstincts} |
| Session handoffs | ${sessionCount} |
| Skill usage events | ${usageEvents} |

### Git Activity
| Metric | Value |
|--------|-------|
| Total commits | ${totalCommits} |
| Commits today | ${commitsToday} |
| Last handoff | ${lastHandoff} |
`);
