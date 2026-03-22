#!/usr/bin/env bun
/**
 * cost-estimator.ts — Token and cost estimation for ProductionOS.
 *
 * Provides pre-execution cost estimates so users can budget before expensive
 * recursive commands. Uses the chars/4 heuristic validated in eval-runner.ts.
 *
 * Zero external dependencies. TypeScript strict mode.
 */

// ─── Interfaces ────────────────────────────────────────────────

export interface ModelPricing {
  name: string;
  inputPerMTok: number;
  outputPerMTok: number;
}

export interface CostEstimate {
  tokens: number;
  cost: number;
  warning?: string;
}

// ─── Constants ─────────────────────────────────────────────────

export const PRICING: Record<string, ModelPricing> = {
  sonnet: { name: "Claude Sonnet", inputPerMTok: 3.0, outputPerMTok: 15.0 },
  opus: { name: "Claude Opus", inputPerMTok: 15.0, outputPerMTok: 75.0 },
  haiku: { name: "Claude Haiku", inputPerMTok: 0.25, outputPerMTok: 1.25 },
};

import { BYTES_PER_TOKEN } from "./lib/shared";
const OUTPUT_RATIO = 0.3; // output tokens estimated at 30% of input
const COST_WARNING_THRESHOLD_USD = 5.0;

/** Base token estimates per depth level (empirical from agent prompt sizes). */
const DEPTH_MULTIPLIERS: Record<string, number> = {
  shallow: 1,
  medium: 3,
  deep: 7,
  ultra: 15,
};

// ─── Core Functions ────────────────────────────────────────────

/** Estimate token count from a string using the bytes/4 heuristic. */
export function estimateTokens(text: string): number {
  return Math.ceil(Buffer.byteLength(text, "utf-8") / BYTES_PER_TOKEN);
}

/** Estimate USD cost for a given token count (input + assumed 30% output). */
export function estimateCost(tokens: number, model: string = "sonnet"): number {
  const pricing = PRICING[model] ?? PRICING["sonnet"]!;
  const inputCost = (tokens / 1_000_000) * pricing.inputPerMTok;
  const outputTokens = Math.ceil(tokens * OUTPUT_RATIO);
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMTok;
  return parseFloat((inputCost + outputCost).toFixed(4));
}

/** Estimate cost for a command invocation given agent count and depth. */
export function estimateCommandCost(
  command: string,
  agentCount: number,
  depth: string = "medium"
): CostEstimate {
  const depthMul = DEPTH_MULTIPLIERS[depth] ?? DEPTH_MULTIPLIERS["medium"]!;
  // Base: ~4K tokens per agent prompt, scaled by depth
  const baseTokensPerAgent = 4000;
  const tokens = agentCount * baseTokensPerAgent * depthMul;
  const model = "sonnet";
  const cost = estimateCost(tokens, model);
  const warning =
    cost >= COST_WARNING_THRESHOLD_USD
      ? `High cost estimate: $${cost.toFixed(2)} for ${command} (${agentCount} agents, ${depth} depth). Consider reducing scope.`
      : undefined;

  return { tokens, cost, warning };
}

/** Format a cost estimate as a human-readable warning box for terminal display. */
export function formatCostWarning(estimate: CostEstimate): string {
  const border = "+--------------------------------------------------+";
  const tokStr = estimate.tokens.toLocaleString();
  const costStr = `$${estimate.cost.toFixed(2)}`;

  const lines: string[] = [
    border,
    `| COST ESTIMATE${" ".repeat(36)}|`,
    `|${" ".repeat(50)}|`,
    `|  Estimated tokens:  ${tokStr.padEnd(29)}|`,
    `|  Estimated cost:    ${costStr.padEnd(29)}|`,
    `|  Model:             Claude Sonnet ($3/$15 MTok)   |`,
  ];

  if (estimate.warning) {
    lines.push(`|${" ".repeat(50)}|`);
    // Word-wrap warning to fit within the box (46 chars usable)
    const words = estimate.warning.split(" ");
    let line = "";
    for (const word of words) {
      if (line.length + word.length + 1 > 46) {
        lines.push(`|  ${line.padEnd(48)}|`);
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    }
    if (line) {
      lines.push(`|  ${line.padEnd(48)}|`);
    }
  }

  lines.push(border);
  return lines.join("\n");
}

// ─── CLI Entry Point ───────────────────────────────────────────

if (import.meta.main) {
  const args = process.argv.slice(2);
  const command = args[0] ?? "unknown";
  const agentCount = parseInt(args[1] ?? "7", 10);
  const depth = args[2] ?? "medium";

  const estimate = estimateCommandCost(command, agentCount, depth);
  process.stdout.write(formatCostWarning(estimate) + "\n");
}
