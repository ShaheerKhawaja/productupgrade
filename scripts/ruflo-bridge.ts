#!/usr/bin/env bun
// ruflo-bridge.ts — Adapter between ProductionOS swarm commands and ruflo CLI
// ProductionOS provides STRATEGY (which agents, convergence, judging)
// ruflo provides EXECUTION (process spawning, AgentDB, neural learning)
//
// Security note: All shell commands use hardcoded strings or validated
// constants. No user input is passed to shell execution.

import { execFileSync } from "child_process";

export interface SwarmConfig {
  topology: "hierarchical" | "mesh" | "ring" | "star";
  agentCount: number;
  taskDescription: string;
  depth: "shallow" | "medium" | "deep" | "ultra";
}

export interface SwarmResult {
  success: boolean;
  agentsSpawned: number;
  output: string;
  error?: string;
}

// Validated topology values (prevents injection)
const VALID_TOPOLOGIES = new Set(["hierarchical", "mesh", "ring", "star"]);

/**
 * Check if ruflo (claude-flow) is available on the system
 */
export function isRufloAvailable(): boolean {
  try {
    execFileSync("which", ["claude-flow"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get ruflo version
 */
export function getRufloVersion(): string | null {
  try {
    return execFileSync("claude-flow", ["--version"], { stdio: "pipe" })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

/**
 * Initialize a ruflo swarm for ProductionOS agent dispatch
 */
export function initSwarm(config: SwarmConfig): SwarmResult {
  if (!isRufloAvailable()) {
    return {
      success: false,
      agentsSpawned: 0,
      output: "",
      error: "ruflo (claude-flow) not installed. Falling back to Claude Code Agent tool.",
    };
  }

  // Validate topology
  if (!VALID_TOPOLOGIES.has(config.topology)) {
    return { success: false, agentsSpawned: 0, output: "", error: "Invalid topology" };
  }

  // Validate agent count
  const count = Math.max(1, Math.min(50, config.agentCount));

  try {
    const output = execFileSync("claude-flow", [
      "swarm", "init",
      "--topology", config.topology,
      "--agents", String(count),
    ], { timeout: 30000, stdio: "pipe" }).toString();

    return { success: true, agentsSpawned: count, output };
  } catch (e: any) {
    return { success: false, agentsSpawned: 0, output: "", error: e.message || "Swarm init failed" };
  }
}

/**
 * Store a key-value pair in ruflo's AgentDB for intra-swarm state
 */
export function storeInAgentDB(key: string, value: string): boolean {
  if (!isRufloAvailable()) return false;
  try {
    execFileSync("claude-flow", ["memory", "store", key, value], { timeout: 5000, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieve a value from ruflo's AgentDB
 */
export function getFromAgentDB(key: string): string | null {
  if (!isRufloAvailable()) return null;
  try {
    return execFileSync("claude-flow", ["memory", "get", key], { timeout: 5000, stdio: "pipe" })
      .toString().trim();
  } catch {
    return null;
  }
}

/**
 * Dispatch strategy: decide whether to use ruflo or Claude Code Agent tool
 */
export function selectDispatchMethod(config: SwarmConfig): "ruflo" | "claude-agent" {
  if (!isRufloAvailable()) return "claude-agent";
  if (config.agentCount >= 5 || config.depth === "deep" || config.depth === "ultra") return "ruflo";
  return "claude-agent";
}

// CLI interface
const cmd = process.argv[2];
if (cmd === "check") {
  const available = isRufloAvailable();
  const version = available ? getRufloVersion() : null;
  console.log(JSON.stringify({
    available, version,
    recommendation: available
      ? "ruflo available for swarms with 5+ agents or deep/ultra depth"
      : "ruflo not installed — using Claude Code Agent tool",
  }));
} else if (cmd === "init") {
  const result = initSwarm({
    topology: (process.argv[3] as any) || "hierarchical",
    agentCount: parseInt(process.argv[4] || "5"),
    taskDescription: process.argv[5] || "swarm task",
    depth: (process.argv[6] as any) || "medium",
  });
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log("Usage:");
  console.log("  bun run scripts/ruflo-bridge.ts check");
  console.log("  bun run scripts/ruflo-bridge.ts init <topology> <count> <task> <depth>");
}
