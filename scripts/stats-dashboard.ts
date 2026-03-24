/**
 * ProductionOS Stats Dashboard — computes and displays system metrics.
 * Run: bun run scripts/stats-dashboard.ts
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { ROOT, walkFiles, listMdFiles, readVersion, parseFrontmatter } from "./lib/shared";

const STATE_DIR = join(process.env.HOME || "/tmp", ".productionos");

// ─── Helpers ───────────────────────────────────────────────

function countFiles(dir: string, ext: string): number {
  try { return readdirSync(dir).filter(f => f.endsWith(ext)).length; } catch { return 0; }
}

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
const agentFiles = listMdFiles(join(ROOT, "agents"));
const agentCount = agentFiles.length;
const commandCount = listMdFiles(join(ROOT, ".claude", "commands")).length;
const templateCount = listMdFiles(join(ROOT, "templates")).length;
const scriptCount = countFiles(join(ROOT, "scripts"), ".ts");
const testFileCount = countFiles(join(ROOT, "tests"), ".ts");

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
let hookCount = 0;
try {
  const hooksJson = JSON.parse(readFileSync(join(ROOT, "hooks", "hooks.json"), "utf-8"));
  const hookFiles = new Set<string>();
  for (const event of Object.values(hooksJson) as Array<{ hooks?: Array<{ command?: string }> }[]>) {
    if (!Array.isArray(event)) continue;
    for (const matcher of event) {
      if (!matcher.hooks) continue;
      for (const hook of matcher.hooks) {
        if (hook.command) {
          const match = hook.command.match(/hooks\/([^"]+)/);
          if (match) hookFiles.add(match[1]);
        }
      }
    }
  }
  hookCount = hookFiles.size;
} catch { hookCount = countFiles(join(ROOT, "hooks"), ".sh"); }

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
const totalCommits = safeExec("git", ["rev-list", "--count", "HEAD"], ROOT);

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
| Hooks | ${hookCount} scripts |
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
