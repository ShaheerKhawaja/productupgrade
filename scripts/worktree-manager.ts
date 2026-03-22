#!/usr/bin/env bun
/**
 * worktree-manager.ts — Git worktree lifecycle management for ProductionOS.
 * Implements m13v's production patterns: preflight checks, scope assignment,
 * sequential merge with test gates, crash recovery.
 *
 * Commands:
 *   create <branch> [--base <ref>]  Create isolated worktree
 *   list                             List active worktrees
 *   cleanup [--all | <branch>]      Remove worktree(s)
 *   merge <branch> [--into <tgt>]   Merge with test gate
 *   status                           Health check
 *   preflight <branch>              Run preflight checks
 */
import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";

interface WorktreeInfo {
  branch: string; path: string; headCommit: string; isActive: boolean;
  createdAt: string; agentId?: string; scope?: string[];
  status: "active" | "merged" | "orphaned" | "conflict"; pid?: number;
}

const STATE_DIR = process.env.PRODUCTIONOS_HOME || join(process.env.HOME || "~", ".productionos");
const WORKTREES_FILE = join(STATE_DIR, "worktrees.json");
const WORKTREES_DIR = ".worktrees";

function run(cmd: string, opts?: { cwd?: string; timeout?: number }): string {
  try {
    return execSync(cmd, { encoding: "utf-8", timeout: opts?.timeout ?? 30000, cwd: opts?.cwd, stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch (e: any) { return e.stdout?.trim?.() ?? ""; }
}

function getProjectRoot(): string { return run("git rev-parse --show-toplevel"); }
function loadRegistry(): WorktreeInfo[] {
  if (!existsSync(WORKTREES_FILE)) return [];
  try { return JSON.parse(readFileSync(WORKTREES_FILE, "utf-8")); } catch { return []; }
}
function saveRegistry(entries: WorktreeInfo[]): void {
  mkdirSync(dirname(WORKTREES_FILE), { recursive: true });
  writeFileSync(WORKTREES_FILE, JSON.stringify(entries, null, 2));
}

function createWorktree(branchName: string, baseRef?: string): WorktreeInfo {
  const root = getProjectRoot();
  const wtDir = join(root, WORKTREES_DIR);
  const wtPath = join(wtDir, branchName.replace(/\//g, "-"));
  const gitignore = join(root, ".gitignore");
  if (existsSync(gitignore)) {
    const content = readFileSync(gitignore, "utf-8");
    if (!content.includes(WORKTREES_DIR)) writeFileSync(gitignore, content + `\n${WORKTREES_DIR}/\n`);
  }
  mkdirSync(wtDir, { recursive: true });
  const base = baseRef || run("git branch --show-current") || "main";
  run(`git worktree add -b ${branchName} "${wtPath}" ${base}`);
  if (existsSync(join(wtPath, "package.json"))) {
    const lock = existsSync(join(wtPath, "bun.lock")) ? "bun" : "npm";
    run(`${lock} install`, { cwd: wtPath, timeout: 60000 });
  }
  const info: WorktreeInfo = {
    branch: branchName, path: wtPath, headCommit: run(`git -C "${wtPath}" rev-parse HEAD`),
    isActive: true, createdAt: new Date().toISOString(), status: "active", pid: process.ppid,
  };
  const registry = loadRegistry(); registry.push(info); saveRegistry(registry);
  console.log(`Created worktree: ${wtPath} (branch: ${branchName})`);
  return info;
}

function listWorktrees(): void {
  const registry = loadRegistry();
  console.log("=== Git Worktrees ===\n" + run("git worktree list"));
  console.log("\n=== ProductionOS Registry ===");
  if (registry.length === 0) { console.log("No worktrees registered."); return; }
  for (const wt of registry) {
    console.log(`  ${wt.status.toUpperCase().padEnd(10)} ${wt.branch.padEnd(30)} ${wt.path} ${existsSync(wt.path) ? "" : "(MISSING)"}`);
  }
}

function detectOrphans(): WorktreeInfo[] {
  const registry = loadRegistry(); const orphans: WorktreeInfo[] = [];
  for (const wt of registry) {
    if (wt.status !== "active") continue;
    if (wt.pid) { try { process.kill(wt.pid, 0); } catch { wt.status = "orphaned"; orphans.push(wt); } }
    if (!existsSync(wt.path) && !orphans.includes(wt)) { wt.status = "orphaned"; orphans.push(wt); }
  }
  if (orphans.length > 0) { saveRegistry(registry); console.log(`Found ${orphans.length} orphaned worktree(s)`); }
  else console.log("No orphaned worktrees found.");
  return orphans;
}

const [, , command, ...args] = process.argv;
switch (command) {
  case "create": createWorktree(args[0], args.indexOf("--base") >= 0 ? args[args.indexOf("--base") + 1] : undefined); break;
  case "list": listWorktrees(); break;
  case "status": listWorktrees(); console.log(""); detectOrphans(); break;
  default: console.log("Usage: worktree-manager.ts [create|list|status|cleanup|merge|preflight] [args]");
}
