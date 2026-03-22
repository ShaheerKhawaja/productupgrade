#!/usr/bin/env bun
/**
 * ProductionOS Review Readiness Dashboard
 *
 * Tracks which reviews have been completed for the current branch.
 * Modeled after gstack's $BRANCH-reviews.jsonl pattern.
 *
 * Usage:
 *   bun run scripts/review-dashboard.ts show     — Display dashboard
 *   bun run scripts/review-dashboard.ts log       — Log a review result (pipe JSON)
 *   bun run scripts/review-dashboard.ts clear     — Clear reviews for current branch
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { execFileSync } from "child_process";
import { join } from "path";

interface ReviewEntry {
  skill: string;
  timestamp: string;
  status: "clean" | "issues_open";
  unresolved: number;
  critical_gaps: number;
  mode?: string;
}

function getBranch(): string {
  try {
    return execFileSync("git", ["branch", "--show-current"], { encoding: "utf-8" }).trim() || "unknown";
  } catch {
    return "unknown";
  }
}

function getSlug(): string {
  try {
    const remote = execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf-8" }).trim();
    return remote.replace(/.*[:/]/, "").replace(/\.git$/, "").replace(/\//g, "-");
  } catch {
    const cwd = process.cwd();
    return cwd.split("/").pop() || "unknown";
  }
}

function getReviewsDir(): string {
  const home = process.env.HOME || "~";
  const slug = getSlug();
  const dir = join(home, ".productionos", "projects", slug);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function getReviewsFile(): string {
  const branch = getBranch();
  return join(getReviewsDir(), `${branch}-reviews.jsonl`);
}

function readReviews(): ReviewEntry[] {
  const file = getReviewsFile();
  if (!existsSync(file)) return [];

  const lines = readFileSync(file, "utf-8").trim().split("\n").filter(Boolean);
  return lines.map(line => {
    try {
      return JSON.parse(line) as ReviewEntry;
    } catch {
      return null;
    }
  }).filter((e): e is ReviewEntry => e !== null);
}

function showDashboard(): void {
  const reviews = readReviews();
  const branch = getBranch();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const latest = new Map<string, ReviewEntry>();
  for (const r of reviews) {
    const ts = new Date(r.timestamp);
    if (ts < sevenDaysAgo) continue;
    const existing = latest.get(r.skill);
    if (!existing || new Date(existing.timestamp) < ts) {
      latest.set(r.skill, r);
    }
  }

  const skills = [
    "production-upgrade",
    "omni-plan",
    "auto-swarm",
    "agentic-eval",
    "security-audit",
    "deep-research",
  ];

  console.log("+====================================================================+");
  console.log("|                    REVIEW READINESS DASHBOARD                       |");
  console.log("+====================================================================+");
  console.log(`| Branch: ${branch.padEnd(55)}|`);
  console.log("+--------------------------------------------------------------------+");
  console.log("| Review              | Last Run            | Status    | Issues      |");
  console.log("|---------------------|---------------------|-----------|-------------|");

  let hasClean = false;
  for (const skill of skills) {
    const r = latest.get(skill);
    if (r) {
      const ts = r.timestamp.slice(0, 16).replace("T", " ");
      const status = r.status === "clean" ? "CLEAR" : "ISSUES";
      const issues = r.critical_gaps > 0 ? `${r.critical_gaps} critical` : `${r.unresolved} open`;
      if (r.status === "clean") hasClean = true;
      console.log(`| ${skill.padEnd(20)}| ${ts.padEnd(20)}| ${status.padEnd(10)}| ${issues.padEnd(12)}|`);
    } else {
      console.log(`| ${skill.padEnd(20)}| ${"—".padEnd(20)}| ${"—".padEnd(10)}| ${"—".padEnd(12)}|`);
    }
  }

  console.log("+--------------------------------------------------------------------+");
  const verdict = hasClean ? "CLEARED — at least one review passed" : "NOT CLEARED — no clean reviews";
  console.log(`| VERDICT: ${verdict.padEnd(57)}|`);
  console.log("+====================================================================+");
}

function logReview(): void {
  const input = readFileSync(0, "utf-8").trim();
  if (!input) {
    console.error("Usage: echo '{...}' | bun run scripts/review-dashboard.ts log");
    process.exit(1);
  }

  try {
    const entry = JSON.parse(input) as ReviewEntry;
    if (!entry.skill || !entry.timestamp || !entry.status) {
      console.error("Missing required fields: skill, timestamp, status");
      process.exit(1);
    }
    const file = getReviewsFile();
    writeFileSync(file, JSON.stringify(entry) + "\n", { flag: "a" });
    console.log(`Logged ${entry.status} review for ${entry.skill}`);
  } catch {
    console.error("Invalid JSON input");
    process.exit(1);
  }
}

function clearReviews(): void {
  const file = getReviewsFile();
  if (existsSync(file)) {
    writeFileSync(file, "");
    console.log(`Cleared reviews for branch ${getBranch()}`);
  } else {
    console.log("No reviews to clear");
  }
}

const command = process.argv[2] || "show";
switch (command) {
  case "show":
    showDashboard();
    break;
  case "log":
    logReview();
    break;
  case "clear":
    clearReviews();
    break;
  default:
    console.error(`Unknown command: ${command}. Use: show, log, clear`);
    process.exit(1);
}
