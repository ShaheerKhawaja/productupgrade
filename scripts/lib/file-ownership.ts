/**
 * File Ownership Protocol — computes per-file ownership for parallel agent waves.
 * Replaces keyword-matching assignScopes with file-level granularity.
 *
 * Addresses: GAP-06 (empty scopes), GAP-09 (concurrent swarms), GAP-10 (case sensitivity),
 * GAP-11 (symlinks), GAP-13 (agent ID), GAP-15 (orphaned requests), GAP-17 (multi-file atomic),
 * GAP-21 (new file creation), GAP-22 (scope keyword collisions).
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, renameSync, unlinkSync } from "fs";
import { join, dirname, normalize, basename, extname } from "path";
import { platform } from "os";

// ─── Types ─────────────────────────────────────────────────

export type AccessMode = "write" | "readonly" | "none";

export interface AgentScope {
  agentId: string;
  waveId: string;
  writable_files: string[];
  writable_dirs: string[];
  readonly_files: string[];
  readonly_dirs: string[];
}

export interface AccessCheck {
  allowed: boolean;
  mode: AccessMode;
  reason: string;
  owner?: string;
}

export interface TaskInput {
  task: string;
  description: string;
  hints?: string[];
  files?: string[];
  directories?: string[];
}

export interface FileOwnershipMap {
  waveId: string;
  computedAt: string;
  agents: Record<string, AgentScope>;
  sharedFiles: string[];
  unclaimed: string[];
}

export interface IntegrationRequest {
  target_file: string;
  action: "edit" | "create" | "delete";
  old_string?: string;
  new_string?: string;
  reason: string;
  agentId: string;
  priority?: number;
  /** Transaction group — requests with same groupId must all succeed or all fail */
  groupId?: string;
  status?: "complete" | "partial";
}

// ─── Constants ─────────────────────────────────────────────

const IS_CASE_INSENSITIVE = platform() === "darwin" || platform() === "win32";

/** Directories that are always readonly for all agents */
const SHARED_INFRA_PATTERNS = [
  "scripts/lib/",
  "templates/",
  "hooks/",
  ".claude-plugin/",
  ".claude/skills/",
];

/** File patterns that are always readonly */
const SHARED_FILE_PATTERNS = [
  "package.json",
  "tsconfig.json",
  "CLAUDE.md",
  "VERSION",
  "hooks.json",
];

// ─── Path Utilities ────────────────────────────────────────

/** Normalize a path for comparison — NO symlink resolution (done separately) */
export function normalizePath(filePath: string): string {
  let p = normalize(filePath).replace(/\/+/g, "/").replace(/\/$/, "");
  // Case-insensitive comparison on macOS/Windows (GAP-10)
  if (IS_CASE_INSENSITIVE) p = p.toLowerCase();
  return p;
}


/** Check if a file path is under a directory */
function isUnderDir(filePath: string, dir: string): boolean {
  const nFile = normalizePath(filePath);
  let nDir = normalizePath(dir);
  if (!nDir.endsWith("/")) nDir += "/";
  return nFile.startsWith(nDir);
}

// ─── Core Functions ────────────────────────────────────────

/**
 * Check if a file access is allowed given an agent's scope.
 * Pure function — no I/O. Used by the enforcement hook.
 */
export function checkAccess(filePath: string, scope: AgentScope): AccessCheck {
  if (!filePath) {
    return { allowed: false, mode: "none", reason: "Empty file path" };
  }

  // Normalize path for comparison. Symlink resolution (GAP-11) is handled
  // at the hook level where absolute paths are available.
  const nPath = normalizePath(filePath);

  // Specific file matches take priority over directory matches
  // Check writable_files first (most specific)
  for (const f of scope.writable_files) {
    if (normalizePath(f) === nPath) {
      return { allowed: true, mode: "write", reason: `File in write scope`, owner: scope.agentId };
    }
  }

  // Check readonly_files (specific file override)
  for (const f of scope.readonly_files) {
    if (normalizePath(f) === nPath) {
      return { allowed: false, mode: "readonly", reason: `File is readonly in this wave`, owner: scope.agentId };
    }
  }

  // Check writable_dirs (allows new file creation within scope — GAP-21)
  for (const d of scope.writable_dirs) {
    if (isUnderDir(filePath, d)) {
      return { allowed: true, mode: "write", reason: `File under writable directory ${d}`, owner: scope.agentId };
    }
  }

  // Check readonly_dirs
  for (const d of scope.readonly_dirs) {
    if (isUnderDir(filePath, d)) {
      return { allowed: false, mode: "readonly", reason: `File under readonly directory ${d}`, owner: scope.agentId };
    }
  }

  // .productionos/ is always writable (output directory for all agents)
  if (isUnderDir(filePath, ".productionos/")) {
    return { allowed: true, mode: "write", reason: "Output directory is always writable" };
  }

  // Not in any scope
  return { allowed: false, mode: "none", reason: `File not in agent ${scope.agentId}'s scope` };
}

/**
 * Compute file ownership for a set of tasks.
 * Each task gets a non-overlapping set of writable files/dirs.
 * Conflicts are auto-promoted to readonly.
 */
export function computeOwnership(tasks: TaskInput[], root: string, waveId: string): FileOwnershipMap {
  const agents: Record<string, AgentScope> = {};
  const fileClaims = new Map<string, string[]>(); // normalized path -> agentIds

  // Phase 1: Extract seed files from each task
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]!;
    const agentId = `agent-${i + 1}`;
    const scope: AgentScope = {
      agentId, waveId,
      writable_files: [], writable_dirs: [],
      readonly_files: [], readonly_dirs: [],
    };

    // Explicit files (preferred)
    if (task.files) {
      for (const f of task.files) {
        const nf = normalizePath(f); // use relative path as key
        scope.writable_files.push(f);
        const claims = fileClaims.get(nf) || [];
        claims.push(agentId);
        fileClaims.set(nf, claims);
      }
    }

    // Explicit directories
    if (task.directories) {
      for (const d of task.directories) {
        scope.writable_dirs.push(d);
      }
    }

    // Hints-based fallback (keyword matching — kept for backward compat)
    if (!task.files && !task.directories && task.hints) {
      const desc = `${task.task} ${task.description} ${(task.hints || []).join(" ")}`.toLowerCase();
      const dirs = listDirectories(root);
      for (const d of dirs) {
        const b = d.split("/").pop() || "";
        if (desc.includes(b.toLowerCase()) && b.length > 2) {
          scope.writable_dirs.push(d);
        }
      }
    }

    // Co-location rule: owning agents/foo.md → also claim agents/foo.test.ts etc
    // Strip to stem (first dot): "foo.test.ts" → "foo", "foo.md" → "foo"
    const stem = (name: string): string => {
      const dotIdx = name.indexOf(".");
      return dotIdx > 0 ? name.slice(0, dotIdx) : name;
    };
    const colocated: string[] = [];
    for (const f of scope.writable_files) {
      const dir = dirname(f);
      const base = stem(basename(f));
      try {
        const entries = readdirSync(join(root, dir));
        for (const entry of entries) {
          if (stem(entry) === base && entry !== basename(f)) {
            colocated.push(join(dir, entry));
          }
        }
      } catch { /* dir doesn't exist */ }
    }
    for (const c of colocated) {
      if (!scope.writable_files.includes(c)) {
        scope.writable_files.push(c);
        const nc = normalizePath(c); // relative path as key
        const claims = fileClaims.get(nc) || [];
        claims.push(agentId);
        fileClaims.set(nc, claims);
      }
    }

    agents[agentId] = scope;
  }

  // Phase 2: Conflict resolution — files claimed by >1 agent become readonly
  const sharedFiles: string[] = [];
  for (const [nPath, claimants] of fileClaims) {
    if (claimants.length > 1) {
      // nPath is already a normalized relative path
      const relPath = nPath;
      sharedFiles.push(relPath);
      for (const agentId of claimants) {
        const scope = agents[agentId];
        scope.writable_files = scope.writable_files.filter(f => normalizePath(f) !== nPath);
        if (!scope.readonly_files.includes(relPath)) {
          scope.readonly_files.push(relPath);
        }
      }
    }
  }

  // Phase 3: Shared infrastructure is always readonly (GAP-06)
  for (const agentId of Object.keys(agents)) {
    const scope = agents[agentId];
    for (const pattern of SHARED_INFRA_PATTERNS) {
      if (!scope.readonly_dirs.includes(pattern)) {
        scope.readonly_dirs.push(pattern);
      }
      // Remove from writable if present — normalize both sides for comparison
      scope.writable_dirs = scope.writable_dirs.filter(d => {
        const nd = normalizePath(d);
        const np = normalizePath(pattern);
        return !isUnderDir(d, pattern) && nd !== np;
      });
    }
    for (const pattern of SHARED_FILE_PATTERNS) {
      if (!scope.readonly_files.includes(pattern)) {
        scope.readonly_files.push(pattern);
      }
      scope.writable_files = scope.writable_files.filter(f => basename(f) !== pattern);
    }
  }

  // Phase 4: Validate no empty scopes (GAP-06)
  const unclaimed: string[] = [];
  for (const agentId of Object.keys(agents)) {
    const scope = agents[agentId];
    if (scope.writable_files.length === 0 && scope.writable_dirs.length === 0) {
      unclaimed.push(agentId);
    }
  }

  return {
    waveId,
    computedAt: new Date().toISOString(),
    agents,
    sharedFiles,
    unclaimed,
  };
}

/**
 * Generate the block message that tells the agent HOW to write an integration-request.
 * The message IS the instruction channel for autonomous agents (GAP-08 fix).
 */
export function generateBlockMessage(filePath: string, check: AccessCheck, agentId: string): string {
  const ts = Date.now();
  const base = basename(filePath, extname(filePath));
  const requestFile = `.productionos/integration-requests/${base}-${ts}.json`;

  return [
    `SCOPE BLOCKED: '${filePath}' is ${check.mode === "readonly" ? "readonly" : "out of scope"} for agent '${agentId}'.`,
    ``,
    `To request this change during the integration phase, write a JSON file to:`,
    `  ${requestFile}`,
    ``,
    `With this exact format:`,
    `{`,
    `  "target_file": "${filePath}",`,
    `  "action": "edit",`,
    `  "old_string": "the exact text you want to replace",`,
    `  "new_string": "the replacement text",`,
    `  "reason": "why this change is needed",`,
    `  "agentId": "${agentId}",`,
    `  "priority": 0,`,
    `  "groupId": null,`,
    `  "status": "complete"`,
    `}`,
    ``,
    `For multi-file atomic changes, use the same "groupId" string across all request files.`,
    `Do NOT attempt to bypass this restriction via Bash, git checkout, mv, cp, or symlinks.`,
  ].join("\n");
}

/**
 * Write an agent's scope to the state directory.
 * Returns the absolute path to the scope file (for PRODUCTIONOS_AGENT_SCOPE env var).
 */
export function writeAgentScope(scope: AgentScope, stateDir: string): string {
  const dir = join(stateDir, "wave-scopes");
  mkdirSync(dir, { recursive: true });
  const scopePath = join(dir, `${scope.waveId}-${scope.agentId}.json`);
  const tmp = scopePath + ".tmp." + process.pid;
  writeFileSync(tmp, JSON.stringify(scope, null, 2));
  try {
    renameSync(tmp, scopePath);
  } catch {
    writeFileSync(scopePath, JSON.stringify(scope, null, 2));
    try { unlinkSync(tmp); } catch { /* ignore */ }
  }
  return scopePath;
}

/**
 * Read an agent's scope from a scope file.
 * Returns null if missing or corrupt.
 */
export function readAgentScope(scopePath: string): AgentScope | null {
  try {
    const content = readFileSync(scopePath, "utf-8");
    const parsed = JSON.parse(content);
    if (!parsed.agentId || !Array.isArray(parsed.writable_files)) return null;
    return parsed as AgentScope;
  } catch {
    return null;
  }
}

/**
 * Collect integration requests from worktree paths.
 * Reads .productionos/integration-requests/*.json from each worktree.
 * Skips invalid/incomplete requests (GAP-15).
 * Sorts by priority (higher first), then alphabetical by target_file.
 */
export function collectIntegrationRequests(worktreePaths: string[]): IntegrationRequest[] {
  const requests: IntegrationRequest[] = [];

  for (const wtPath of worktreePaths) {
    const reqDir = join(wtPath, ".productionos", "integration-requests");
    if (!existsSync(reqDir)) continue;

    try {
      const files = readdirSync(reqDir).filter(f => f.endsWith(".json"));
      for (const file of files) {
        try {
          const content = readFileSync(join(reqDir, file), "utf-8");
          const req = JSON.parse(content) as IntegrationRequest;
          // Validate required fields (GAP-15: skip incomplete)
          if (!req.target_file || !req.action || !req.reason || !req.agentId) continue;
          if (req.status !== "complete") continue;
          requests.push(req);
        } catch { /* skip corrupt files */ }
      }
    } catch { /* skip unreadable dirs */ }
  }

  // Sort: higher priority first, then alphabetical by target_file
  requests.sort((a, b) => {
    const pa = a.priority ?? 0;
    const pb = b.priority ?? 0;
    if (pb !== pa) return pb - pa;
    return a.target_file.localeCompare(b.target_file);
  });

  return requests;
}

// ─── Helpers ───────────────────────────────────────────────

function listDirectories(root: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(root, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (["node_modules", ".git", ".worktrees", "dist", ".productionos"].includes(entry.name)) continue;
      results.push(entry.name);
      try {
        const sub = readdirSync(join(root, entry.name), { withFileTypes: true });
        for (const s of sub) {
          if (s.isDirectory() && !["node_modules", ".git"].includes(s.name)) {
            results.push(join(entry.name, s.name));
          }
        }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return results;
}
