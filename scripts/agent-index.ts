/**
 * ProductionOS Agent Index — Smart Router Layer 1
 *
 * Scans agents/*.md frontmatter, builds a keyword index, and ranks agents
 * by relevance to a natural language goal. JSON cache with mtime invalidation.
 *
 * Usage:
 *   bun run scripts/agent-index.ts --goal "fix auth bugs"
 *   bun run scripts/agent-index.ts --rebuild   # force cache rebuild
 *   bun run scripts/agent-index.ts --list       # dump full index
 *
 * Architecture:
 *   USER GOAL → tokenize → match agent keywords → boost from dispatch log → rank
 *       ↓
 *   { agents: [{ name, confidence, reason }], lowConfidence: boolean }
 */

import { readFileSync, writeFileSync, existsSync, statSync, readdirSync, mkdirSync } from "fs";
import { join } from "path";
import { ROOT, parseFrontmatter, readFileOrNull } from "./lib/shared";

// ─── Types ──────────────────────────────────────────────────

export interface AgentEntry {
  name: string;
  description: string;
  keywords: string[];
  stakes: string;
  tools: string[];
  filePath: string;
  mtime: number;
}

export interface RankedAgent {
  name: string;
  confidence: number;
  reason: string;
}

export interface ClassifyResult {
  agents: RankedAgent[];
  lowConfidence: boolean;
  goal: string;
  fromCache: boolean;
}

interface CacheData {
  version: number;
  builtAt: string;
  maxMtime: number;
  agents: AgentEntry[];
}

const CACHE_VERSION = 1;
const AGENTS_DIR = join(ROOT, "agents");
const CACHE_DIR = join(process.env.PRODUCTIONOS_HOME || join(process.env.HOME || "~", ".productionos"));
const CACHE_PATH = join(CACHE_DIR, "agent-index.json");
const DISPATCH_LOG = join(CACHE_DIR, "dispatch-log.jsonl");
const LOW_CONFIDENCE_THRESHOLD = 0.3;

// ─── Agent Scanning ─────────────────────────────────────────

/** Extract keywords from agent name + description */
function extractKeywords(name: string, description: string): string[] {
  const text = `${name} ${description}`.toLowerCase();
  // Remove punctuation, split on whitespace, dedupe
  const words = text
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2);
  return [...new Set(words)];
}

/** Scan agents directory and build index */
export function scanAgents(): AgentEntry[] {
  const agents: AgentEntry[] = [];
  let files: string[];
  try {
    files = readdirSync(AGENTS_DIR).filter(f => f.endsWith(".md"));
  } catch {
    return agents;
  }

  for (const file of files) {
    const filePath = join(AGENTS_DIR, file);
    try {
      const content = readFileSync(filePath, "utf-8");
      const stat = statSync(filePath);
      const fm = parseFrontmatter(content);
      if (!fm || !fm.name) continue;

      const name = String(fm.name);
      const description = String(fm.description || "");
      const stakes = String(fm.stakes || "MEDIUM");
      const tools = Array.isArray(fm.tools) ? fm.tools.map(String) : [];

      agents.push({
        name,
        description,
        keywords: extractKeywords(name, description),
        stakes,
        tools,
        filePath,
        mtime: stat.mtimeMs,
      });
    } catch {
      // Skip unreadable agents — log warning to stderr
      process.stderr.write(`[agent-index] WARN: skipping unreadable agent: ${file}\n`);
    }
  }

  return agents;
}

// ─── Cache ──────────────────────────────────────────────────

/** Get max mtime of all agent files */
function getMaxMtime(): number {
  try {
    const files = readdirSync(AGENTS_DIR).filter(f => f.endsWith(".md"));
    let max = 0;
    for (const file of files) {
      try {
        const stat = statSync(join(AGENTS_DIR, file));
        if (stat.mtimeMs > max) max = stat.mtimeMs;
      } catch { /* skip */ }
    }
    return max;
  } catch {
    return 0;
  }
}

/** Load cached index if valid */
function loadCache(): AgentEntry[] | null {
  try {
    if (!existsSync(CACHE_PATH)) return null;
    const raw = readFileSync(CACHE_PATH, "utf-8");
    const cache: CacheData = JSON.parse(raw);
    if (cache.version !== CACHE_VERSION) return null;
    // Invalidate if any agent file changed
    const currentMaxMtime = getMaxMtime();
    if (currentMaxMtime > cache.maxMtime) return null;
    return cache.agents;
  } catch {
    return null;
  }
}

/** Write index to cache */
function writeCache(agents: AgentEntry[]): void {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    const cache: CacheData = {
      version: CACHE_VERSION,
      builtAt: new Date().toISOString(),
      maxMtime: getMaxMtime(),
      agents,
    };
    writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  } catch {
    // Non-fatal — cache is a performance optimization, not required
  }
}

/** Get agent index (cached or fresh scan) */
export function getAgentIndex(forceRebuild = false): { agents: AgentEntry[]; fromCache: boolean } {
  if (!forceRebuild) {
    const cached = loadCache();
    if (cached) return { agents: cached, fromCache: true };
  }
  const agents = scanAgents();
  writeCache(agents);
  return { agents, fromCache: false };
}

// ─── Intent Classification ──────────────────────────────────

/** Tokenize a goal string into searchable terms */
function tokenize(goal: string): string[] {
  return goal
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2);
}

/** Read dispatch log for historical boost data */
function getDispatchBoosts(): Map<string, number> {
  const boosts = new Map<string, number>();
  try {
    if (!existsSync(DISPATCH_LOG)) return boosts;
    const lines = readFileSync(DISPATCH_LOG, "utf-8").trim().split("\n");
    // Only consider last 50 entries for recency
    const recent = lines.slice(-50);
    for (const line of recent) {
      try {
        const entry = JSON.parse(line);
        if (entry.agents && Array.isArray(entry.agents) && entry.outcome === "success") {
          for (const agent of entry.agents) {
            boosts.set(agent, (boosts.get(agent) || 0) + 0.05);
          }
        }
        // Penalize agents from failed dispatches
        if (entry.agents && Array.isArray(entry.agents) && entry.outcome === "failure") {
          for (const agent of entry.agents) {
            boosts.set(agent, (boosts.get(agent) || 0) - 0.03);
          }
        }
      } catch { /* skip corrupt lines */ }
    }
  } catch { /* no log yet */ }
  return boosts;
}

/** Intent→category synonyms for agent-map.yml matching */
const INTENT_SYNONYMS: Record<string, string[]> = {
  security: ["auth", "authentication", "authorization", "secret", "vulnerability", "owasp", "injection", "xss", "csrf", "encrypt"],
  code_quality: ["refactor", "clean", "lint", "quality", "smell", "debt", "dry"],
  testing: ["test", "coverage", "spec", "e2e", "unit", "integration"],
  architecture: ["architect", "design", "schema", "database", "infra", "structure"],
  frontend: ["frontend", "component", "css", "ui", "layout", "responsive", "dark-mode"],
  ux: ["ux", "user", "journey", "friction", "onboarding", "persona", "accessibility"],
  performance: ["performance", "slow", "optimize", "cache", "latency", "memory", "n+1"],
  research: ["research", "investigate", "explore", "compare", "analyze", "landscape"],
  planning: ["plan", "roadmap", "strategy", "requirements", "spec", "prd"],
  review: ["review", "audit", "evaluate", "grade", "score", "judge"],
  fix: ["fix", "bug", "error", "broken", "crash", "fail", "issue", "repair"],
  debug: ["debug", "trace", "log", "diagnose", "why", "reproduce"],
  documentation: ["doc", "readme", "changelog", "comment", "explain"],
};

/** Load agent-map.yml for category→agent mapping */
function loadAgentMap(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const mapPath = join(ROOT, "templates", "agent-map.yml");
  try {
    const content = readFileSync(mapPath, "utf-8");
    let currentCategory = "";
    for (const line of content.split("\n")) {
      if (line.match(/^[a-z_]+:/)) {
        currentCategory = line.replace(":", "").trim();
        map.set(currentCategory, []);
      } else if (line.trim().startsWith("- ") && currentCategory) {
        map.get(currentCategory)?.push(line.trim().slice(2));
      }
    }
  } catch { /* no map file */ }
  return map;
}

/** Match goal tokens to intent categories */
function matchIntentCategories(goalTokens: string[]): string[] {
  const matched: string[] = [];
  for (const [category, synonyms] of Object.entries(INTENT_SYNONYMS)) {
    for (const token of goalTokens) {
      if (synonyms.includes(token) || category.includes(token)) {
        matched.push(category);
        break;
      }
    }
  }
  return matched;
}

/** Classify a goal and return ranked agents */
export function classifyIntent(goal: string, agents: AgentEntry[]): ClassifyResult {
  if (!goal.trim()) {
    return { agents: [], lowConfidence: true, goal, fromCache: false };
  }

  const goalTokens = tokenize(goal);
  const boosts = getDispatchBoosts();
  const agentMap = loadAgentMap();
  const matchedCategories = matchIntentCategories(goalTokens);
  const scored: RankedAgent[] = [];

  // Build set of agents boosted by category match
  const categoryBoosted = new Set<string>();
  for (const cat of matchedCategories) {
    const catAgents = agentMap.get(cat) || [];
    for (const a of catAgents) categoryBoosted.add(a);
  }

  for (const agent of agents) {
    let score = 0;
    const matchedKeywords: string[] = [];

    // Category map boost (strongest signal)
    if (categoryBoosted.has(agent.name)) {
      score += 0.35;
      matchedKeywords.push(`[${matchedCategories.join("+")}]`);
    }

    // Keyword overlap scoring
    for (const token of goalTokens) {
      for (const keyword of agent.keywords) {
        if (keyword === token) {
          score += 0.15; // exact match
          matchedKeywords.push(keyword);
        } else if (keyword.includes(token) || token.includes(keyword)) {
          score += 0.08; // partial match
          matchedKeywords.push(`~${keyword}`);
        }
      }
    }

    // Description semantic overlap (simple bag-of-words)
    const descTokens = tokenize(agent.description);
    for (const token of goalTokens) {
      if (descTokens.includes(token)) {
        score += 0.05;
      }
    }

    // Historical dispatch boost
    const boost = boosts.get(agent.name) || 0;
    score += Math.max(-0.1, Math.min(0.2, boost)); // clamp boost

    // Normalize to 0-1 range
    const confidence = Math.min(1, score);

    if (confidence > 0.05) {
      scored.push({
        name: agent.name,
        confidence: Math.round(confidence * 100) / 100,
        reason: matchedKeywords.length > 0
          ? `Matched: ${[...new Set(matchedKeywords)].slice(0, 5).join(", ")}`
          : "Description overlap",
      });
    }
  }

  // Sort by confidence descending
  scored.sort((a, b) => b.confidence - a.confidence);

  // Take top 7 (max agents per dispatch)
  const topAgents = scored.slice(0, 7);
  const lowConfidence = topAgents.length === 0 || topAgents[0].confidence < LOW_CONFIDENCE_THRESHOLD;

  return {
    agents: topAgents,
    lowConfidence,
    goal,
    fromCache: false,
  };
}

// ─── CLI ────────────────────────────────────────────────────

if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.includes("--list")) {
    const { agents, fromCache } = getAgentIndex();
    console.log(JSON.stringify({ count: agents.length, fromCache, agents: agents.map(a => ({ name: a.name, keywords: a.keywords.slice(0, 8), stakes: a.stakes })) }, null, 2));
    process.exit(0);
  }

  if (args.includes("--rebuild")) {
    const { agents } = getAgentIndex(true);
    console.log(JSON.stringify({ rebuilt: true, count: agents.length }));
    process.exit(0);
  }

  const goalIdx = args.indexOf("--goal");
  if (goalIdx === -1 || !args[goalIdx + 1]) {
    console.error("Usage: bun run scripts/agent-index.ts --goal \"fix auth bugs\"");
    process.exit(1);
  }

  const goal = args[goalIdx + 1];
  const { agents, fromCache } = getAgentIndex();
  const result = classifyIntent(goal, agents);
  result.fromCache = fromCache;

  console.log(JSON.stringify(result, null, 2));
}
