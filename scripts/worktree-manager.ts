#!/usr/bin/env bun
/**
 * worktree-manager.ts — Git worktree lifecycle management for ProductionOS.
 * Implements m13v's production patterns: preflight checks, scope assignment,
 * sequential merge with test gates, crash recovery.
 *
 * Commands:
 *   create <branch> [--base <ref>]  Create isolated worktree
 *   list [--json]                    List active worktrees
 *   cleanup [--all | <branch>]      Remove worktree(s)
 *   merge <branch> [--into <tgt>]   Merge with test gate
 *   status [--json]                  Health check + orphan detection
 *   preflight <branch>              Run preflight checks
 *   assign <tasks-json>             Compute non-overlapping scopes
 */
import { execFileSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, renameSync } from "fs";
import { join, dirname } from "path";

// ─── Types ─────────────────────────────────────────────────
type WorktreeStatus =
  | "pending-create" | "active" | "failed" | "stalled"
  | "orphaned" | "merging" | "merged" | "conflict"
  | "recovery-stashed" | "cleaned";

interface WorktreeInfo {
  branch: string;
  path: string;
  headCommit: string;
  isActive: boolean;
  createdAt: string;
  agentId?: string;
  scope?: { directories: string[]; files: string[]; readonly: string[]; };
  status: WorktreeStatus;
  pid?: number;
  baseRef?: string;
  wave?: number;
  mergeCommit?: string;
  recoveryBranch?: string;
  failureReason?: string;
  lastActivityTime?: string;
}

// ─── Constants ─────────────────────────────────────────────
const STATE_DIR = process.env.PRODUCTIONOS_HOME || join(process.env.HOME || "/tmp", ".productionos");
const WORKTREES_FILE = join(STATE_DIR, "worktrees.json");
const LOCK_FILE = join(STATE_DIR, ".worktree-registry.lock");
const MERGE_LOCK_FILE = join(STATE_DIR, ".merge-lock");
const WORKTREES_DIR = ".worktrees";
const MAX_WORKTREES = 10;
const BRANCH_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9/_.-]{0,200}$/;

// ─── Shell Execution ───────────────────────────────────────
function runSafe(cmd: string, args: string[], opts?: { cwd?: string; timeout?: number }): string {
  try {
    return execFileSync(cmd, args, {
      encoding: "utf-8", timeout: opts?.timeout ?? 30000,
      cwd: opts?.cwd, stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch (e: any) { return e.stdout?.trim?.() ?? ""; }
}

function runSafeThrows(cmd: string, args: string[], opts?: { cwd?: string; timeout?: number }): string {
  return execFileSync(cmd, args, {
    encoding: "utf-8", timeout: opts?.timeout ?? 30000,
    cwd: opts?.cwd, stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

// ─── Validation ────────────────────────────────────────────
function validateBranchName(name: string): string | null {
  if (!name) return "Branch name is required";
  if (!BRANCH_REGEX.test(name)) return `Invalid branch name: must match ${BRANCH_REGEX}`;
  if (name.includes("..")) return "Branch name cannot contain '..'";
  return null;
}

function isPidAlive(pid: number): boolean {
  try { process.kill(pid, 0); return true; } catch { return false; }
}

// ─── Registry (with file-based locking) ────────────────────
function acquireLock(lockPath: string, timeoutMs = 5000): boolean {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (!existsSync(lockPath)) {
      try { writeFileSync(lockPath, String(process.pid), { flag: "wx" }); return true; }
      catch { /* race lost */ }
    } else {
      try {
        const lockPid = parseInt(readFileSync(lockPath, "utf-8").trim());
        if (!isPidAlive(lockPid)) { unlinkSync(lockPath); continue; }
      } catch { try { unlinkSync(lockPath); } catch {} continue; }
    }
    const end = Date.now() + 200; while (Date.now() < end) {}
  }
  return false;
}

function releaseLock(lockPath: string): void { try { unlinkSync(lockPath); } catch {} }

function getProjectRoot(): string { return runSafe("git", ["rev-parse", "--show-toplevel"]); }

function loadRegistry(): WorktreeInfo[] {
  if (!existsSync(WORKTREES_FILE)) return [];
  try { return JSON.parse(readFileSync(WORKTREES_FILE, "utf-8")); } catch { return []; }
}

function saveRegistry(entries: WorktreeInfo[]): void {
  mkdirSync(dirname(WORKTREES_FILE), { recursive: true });
  const tmp = WORKTREES_FILE + ".tmp." + process.pid;
  writeFileSync(tmp, JSON.stringify(entries, null, 2));
  try { renameSync(tmp, WORKTREES_FILE); }
  catch { writeFileSync(WORKTREES_FILE, JSON.stringify(entries, null, 2)); try { unlinkSync(tmp); } catch {} }
}

function withLockedRegistry<T>(fn: (reg: WorktreeInfo[]) => T): T {
  if (!acquireLock(LOCK_FILE)) { console.error("ERROR: Could not acquire registry lock."); process.exit(1); }
  try { const reg = loadRegistry(); const r = fn(reg); saveRegistry(reg); return r; }
  finally { releaseLock(LOCK_FILE); }
}

// ─── Create ────────────────────────────────────────────────
function createWorktree(branchName: string, baseRef?: string): WorktreeInfo | null {
  const err = validateBranchName(branchName);
  if (err) { console.error(`ERROR: ${err}`); process.exit(1); }

  const root = getProjectRoot();
  const wtDir = join(root, WORKTREES_DIR);
  const wtPath = join(wtDir, branchName.replace(/\//g, "-"));

  const active = loadRegistry().filter(w => w.status === "active" || w.status === "merging");
  if (active.length >= MAX_WORKTREES) { console.error(`ERROR: Max ${MAX_WORKTREES} worktrees. Run cleanup first.`); process.exit(1); }

  const gitignore = join(root, ".gitignore");
  if (existsSync(gitignore)) {
    const c = readFileSync(gitignore, "utf-8");
    if (!c.includes(WORKTREES_DIR)) writeFileSync(gitignore, c + `\n${WORKTREES_DIR}/\n`);
  }

  mkdirSync(wtDir, { recursive: true });
  const base = baseRef || runSafe("git", ["branch", "--show-current"]) || "main";
  runSafe("git", ["worktree", "add", "-b", branchName, wtPath, base]);
  if (!existsSync(wtPath)) { console.error(`ERROR: Failed to create worktree`); return null; }

  if (existsSync(join(wtPath, "package.json"))) {
    const lock = existsSync(join(wtPath, "bun.lock")) ? "bun" : "npm";
    runSafe(lock, ["install"], { cwd: wtPath, timeout: 60000 });
  }

  const info: WorktreeInfo = {
    branch: branchName, path: wtPath,
    headCommit: runSafe("git", ["-C", wtPath, "rev-parse", "HEAD"]),
    isActive: true, createdAt: new Date().toISOString(),
    status: "active", pid: process.ppid, baseRef: base,
    lastActivityTime: new Date().toISOString(),
  };
  withLockedRegistry((reg) => { reg.push(info); });
  console.log(`Created worktree: ${wtPath} (branch: ${branchName})`);
  return info;
}

// ─── List ──────────────────────────────────────────────────
function listWorktrees(json = false): void {
  const reg = loadRegistry();
  if (json) { console.log(JSON.stringify(reg, null, 2)); return; }
  console.log("=== Git Worktrees ===\n" + runSafe("git", ["worktree", "list"]));
  console.log("\n=== ProductionOS Registry ===");
  if (reg.length === 0) { console.log("No worktrees registered."); return; }
  for (const w of reg) console.log(`  ${w.status.toUpperCase().padEnd(18)} ${w.branch.padEnd(30)} ${w.path}${existsSync(w.path) ? "" : " (MISSING)"}`);
}

// ─── Orphan Detection ──────────────────────────────────────
function detectOrphans(): WorktreeInfo[] {
  const orphans: WorktreeInfo[] = [];
  withLockedRegistry((reg) => {
    for (const w of reg) {
      if (w.status !== "active") continue;
      if ((w.pid && !isPidAlive(w.pid)) || !existsSync(w.path)) { w.status = "orphaned"; orphans.push(w); }
    }
  });
  console.log(orphans.length > 0 ? `Found ${orphans.length} orphaned worktree(s)` : "No orphaned worktrees found.");
  return orphans;
}

// ─── Preflight ─────────────────────────────────────────────
function preflightCheck(branch: string): void {
  const reg = loadRegistry();
  const wt = reg.find(w => w.branch === branch);
  const checks: [string, boolean, string][] = [];

  if (!wt) { checks.push(["registered", false, "Not in registry"]); }
  else {
    checks.push(["registered", true, "Found"]);
    const exists = existsSync(wt.path);
    checks.push(["pathExists", exists, exists ? wt.path : "Missing"]);
    if (exists) {
      const behind = parseInt(runSafe("git", ["-C", wt.path, "rev-list", "--count", `HEAD..${wt.baseRef || "main"}`])) || 0;
      checks.push(["branchFreshness", behind <= 5, behind === 0 ? "Up to date" : `${behind} behind`]);
      // In worktrees, .git is a file pointing to the real gitdir — resolve it
      let gitDir = join(wt.path, ".git");
      try {
        const gitFile = readFileSync(gitDir, "utf-8").trim();
        if (gitFile.startsWith("gitdir:")) gitDir = gitFile.replace("gitdir:", "").trim();
      } catch { /* .git is a directory (main worktree) — use as-is */ }
      const hasLock = existsSync(join(gitDir, "index.lock"));
      checks.push(["noStaleLocks", !hasLock, hasLock ? "Stale index.lock" : "No stale locks"]);
      const hasPkg = existsSync(join(wt.path, "package.json"));
      const hasNM = existsSync(join(wt.path, "node_modules"));
      checks.push(["depsExist", !hasPkg || hasNM, !hasPkg ? "No package.json" : hasNM ? "node_modules present" : "node_modules missing"]);
      const active = reg.filter(w => w.status === "active" || w.status === "merging").length;
      checks.push(["countUnderLimit", active <= MAX_WORKTREES, `${active}/${MAX_WORKTREES}`]);
      try {
        const parts = runSafe("df", ["-k", wt.path]).split("\n")[1]?.split(/\s+/) || [];
        const mb = Math.floor((parseInt(parts[3]) || 0) / 1024);
        checks.push(["diskSpace", mb > 500, `${mb}MB available`]);
      } catch { checks.push(["diskSpace", true, "Could not check"]); }
    }
  }

  const blocking = checks.filter(([, pass]) => !pass).map(([name]) => name);
  console.log(`\n=== Preflight: ${branch} ===`);
  for (const [name, pass, detail] of checks) console.log(`  ${pass ? "PASS" : "FAIL"}  ${name.padEnd(20)} ${detail}`);
  console.log(`\nResult: ${blocking.length === 0 ? "ALL CHECKS PASSED" : `BLOCKED by: ${blocking.join(", ")}`}`);
}

// ─── Merge ─────────────────────────────────────────────────
function mergeWorktree(branch: string, target?: string): void {
  const tgt = target || "main";
  const root = getProjectRoot();

  withLockedRegistry((reg) => { const w = reg.find(w => w.branch === branch); if (w) w.status = "merging"; });

  if (!acquireLock(MERGE_LOCK_FILE, 10000)) {
    console.error("ERROR: Merge lock held by another process.");
    withLockedRegistry((reg) => { const w = reg.find(w => w.branch === branch); if (w) { w.status = "conflict"; w.failureReason = "Lock timeout"; } });
    return;
  }

  try {
    // Ensure we're on the target branch before merging
    const currentBranch = runSafe("git", ["branch", "--show-current"], { cwd: root });
    if (currentBranch !== tgt) {
      try { runSafeThrows("git", ["checkout", tgt], { cwd: root }); }
      catch { console.error(`ERROR: Could not checkout ${tgt}`); releaseLock(MERGE_LOCK_FILE); return; }
    }
    const checkpoint = runSafe("git", ["rev-parse", "HEAD"], { cwd: root });

    try { runSafeThrows("git", ["merge", "--no-ff", branch, "-m", `Merge worktree: ${branch}`], { cwd: root }); }
    catch {
      runSafe("git", ["merge", "--abort"], { cwd: root });
      console.error(`MERGE FAILED: ${branch} — conflicts`);
      withLockedRegistry((reg) => { const w = reg.find(w => w.branch === branch); if (w) { w.status = "conflict"; w.failureReason = "Merge conflicts"; } });
      return;
    }

    console.log("Merge successful, running test gate...");
    try { runSafeThrows("bun", ["test"], { cwd: root, timeout: 120000 }); console.log("Tests PASSED"); }
    catch {
      console.error("Tests FAILED — reverting");
      runSafe("git", ["reset", "--hard", checkpoint], { cwd: root });
      withLockedRegistry((reg) => { const w = reg.find(w => w.branch === branch); if (w) { w.status = "conflict"; w.failureReason = "Tests failed"; } });
      return;
    }

    const sha = runSafe("git", ["rev-parse", "HEAD"], { cwd: root });
    withLockedRegistry((reg) => { const w = reg.find(w => w.branch === branch); if (w) { w.status = "merged"; w.mergeCommit = sha; } });
    console.log(`MERGED: ${branch} -> ${tgt} (${sha.slice(0, 8)})`);
  } finally { releaseLock(MERGE_LOCK_FILE); }
}

// ─── Cleanup ───────────────────────────────────────────────
function cleanupWorktree(branch: string): void {
  withLockedRegistry((reg) => {
    const idx = reg.findIndex(w => w.branch === branch);
    if (idx === -1) { console.error(`Not found: ${branch}`); return; }
    const wt = reg[idx];
    if (wt.status === "active" || wt.status === "merging") { console.error(`Cannot cleanup ${branch}: status is ${wt.status}`); return; }

    if (wt.status === "orphaned" && existsSync(wt.path)) {
      const diff = runSafe("git", ["-C", wt.path, "diff", "--stat"]);
      if (diff) {
        const rb = `recovery/${wt.branch}/${Date.now()}`;
        runSafe("git", ["-C", wt.path, "stash", "push", "-m", `Recovery: ${wt.branch}`]);
        runSafe("git", ["-C", wt.path, "checkout", "-b", rb]);
        runSafe("git", ["-C", wt.path, "stash", "pop"]);
        runSafe("git", ["-C", wt.path, "add", "-A"]);
        runSafe("git", ["-C", wt.path, "commit", "-m", `RECOVERY: ${wt.branch}`]);
        wt.recoveryBranch = rb;
        console.log(`Recovered uncommitted work to: ${rb}`);
      }
    }

    if (existsSync(wt.path)) runSafe("git", ["worktree", "remove", wt.path, "--force"]);
    // Use -d for merged (safe delete), -D for orphaned/failed (force delete of unmerged)
    const delFlag = wt.status === "merged" ? "-d" : "-D";
    if (["merged", "orphaned", "failed"].includes(wt.status)) runSafe("git", ["branch", delFlag, branch]);
    reg.splice(idx, 1);
    console.log(`Cleaned up: ${branch}`);
  });
}

function cleanupAll(): void {
  const reg = loadRegistry();
  const c = reg.filter(w => ["merged", "orphaned", "failed", "recovery-stashed", "cleaned"].includes(w.status));
  if (c.length === 0) { console.log("No worktrees eligible for cleanup."); return; }
  for (const w of c) cleanupWorktree(w.branch);
  runSafe("git", ["worktree", "prune"]);
}

// ─── Assign ────────────────────────────────────────────────
function assignScopes(file: string): void {
  if (!existsSync(file)) { console.error(`Not found: ${file}`); process.exit(1); }
  const tasks: { task: string; description: string; hints?: string[] }[] = JSON.parse(readFileSync(file, "utf-8"));
  const root = getProjectRoot();
  const reg = loadRegistry();
  const dirs = runSafe("find", [root, "-maxdepth", "2", "-type", "d", "-not", "-path", "*/node_modules/*", "-not", "-path", "*/.git/*", "-not", "-path", "*/.worktrees/*"])
    .split("\n").filter(Boolean).map(d => d.replace(root + "/", "")).filter(d => d !== root);

  const used = new Set<string>();
  const out: { task: string; branch: string; scope: { directories: string[]; files: string[]; readonly: string[] } }[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const desc = `${tasks[i].task} ${tasks[i].description} ${(tasks[i].hints || []).join(" ")}`.toLowerCase();
    const matched: string[] = [];
    for (const d of dirs) { const b = d.split("/").pop() || ""; if ((desc.includes(d.toLowerCase()) || desc.includes(b.toLowerCase())) && !used.has(d)) { matched.push(d); used.add(d); } }
    const kw = ["auth", "api", "test", "frontend", "backend", "ui", "component", "hook", "agent", "script", "template", "config", "security", "deploy", "docs"];
    for (const k of kw) { if (desc.includes(k)) { for (const d of dirs) { if (d.toLowerCase().includes(k) && !used.has(d)) { matched.push(d); used.add(d); } } } }
    // Filter to active worktrees only (not from previous waves)
    const activeWts = reg.filter(w => w.status === "active");
    out.push({ task: tasks[i].task, branch: activeWts[i]?.branch || `swarm/task-${i + 1}`, scope: { directories: matched, files: [], readonly: [] } });
  }

  const outPath = join(STATE_DIR, "swarm-assignments.json");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log("=== Scope Assignments ===");
  for (const a of out) { console.log(`  ${a.task.padEnd(30)} -> ${a.scope.directories.length} dirs`); }
  console.log(`Written to: ${outPath}`);
}

// ─── CLI ───────────────────────────────────────────────────
const [, , command, ...args] = process.argv;
const jsonFlag = args.includes("--json");
const allFlag = args.includes("--all");
const getArg = (f: string) => { const i = args.indexOf(f); return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined; };

switch (command) {
  case "create": createWorktree(args[0], getArg("--base")); break;
  case "list": listWorktrees(jsonFlag); break;
  case "status":
    if (jsonFlag) { const r = loadRegistry(); console.log(JSON.stringify({ worktrees: r, orphans: r.filter(w => w.status === "active" && w.pid && !isPidAlive(w.pid)).length, total: r.length })); }
    else { listWorktrees(false); console.log(""); detectOrphans(); }
    break;
  case "preflight": if (!args[0]) { console.error("Usage: preflight <branch>"); process.exit(1); } preflightCheck(args[0]); break;
  case "merge": if (!args[0]) { console.error("Usage: merge <branch> [--into <target>]"); process.exit(1); } mergeWorktree(args[0], getArg("--into")); break;
  case "cleanup": if (allFlag) cleanupAll(); else if (args[0] && args[0] !== "--all") cleanupWorktree(args[0]); else { console.error("Usage: cleanup [--all | <branch>]"); process.exit(1); } break;
  case "assign": if (!args[0]) { console.error("Usage: assign <tasks-json>"); process.exit(1); } assignScopes(args[0]); break;
  default:
    console.log("Usage: worktree-manager.ts [create|list|status|cleanup|merge|preflight|assign] [args]");
    console.log("\nCommands:");
    console.log("  create <branch> [--base <ref>]   Create isolated worktree");
    console.log("  list [--json]                     List worktrees");
    console.log("  status [--json]                   Health check + orphan detection");
    console.log("  preflight <branch>                Run preflight checks");
    console.log("  merge <branch> [--into <target>]  Merge with test gate");
    console.log("  cleanup [--all | <branch>]        Remove merged/orphaned worktrees");
    console.log("  assign <tasks-json>               Compute non-overlapping scopes");
}
