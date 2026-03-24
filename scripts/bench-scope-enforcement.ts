#!/usr/bin/env bun
/**
 * Scope Enforcement Latency Benchmark
 *
 * Measures scope-enforcement.sh performance under load:
 * - No scope (fast path baseline)
 * - Single agent (50 checks)
 * - 7-agent wave (7 sequential checks)
 * - Stress test (350 jq invocations)
 *
 * Reports p50/p95/p99 latency and bottleneck analysis.
 * Uses spawnSync for safe, non-injectable process execution.
 */

import { spawnSync } from "child_process";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// ─── Config ─────────────────────────────────────────────

const HOOK_PATH = join(import.meta.dir, "..", "hooks", "scope-enforcement.sh");
const ITERATIONS = { single: 50, wave: 7, stress: 350 };

// ─── Helpers ────────────────────────────────────────────

function makeScopeFile(tmpDir: string, agentId: string): string {
  const scopePath = join(tmpDir, `scope-${agentId}.json`);
  writeFileSync(scopePath, JSON.stringify({
    agentId, waveId: "wave-bench",
    writable_files: ["agents/code-reviewer.md", "agents/security-hardener.md", "src/index.ts"],
    writable_dirs: ["src/components/"],
    readonly_files: ["package.json", "CLAUDE.md", "tsconfig.json", "VERSION", "hooks.json"],
    readonly_dirs: ["scripts/lib/", "templates/", "hooks/", ".claude-plugin/", ".claude/skills/"],
  }));
  return scopePath;
}

function makeToolInput(toolName: string, filePath: string): string {
  return JSON.stringify({ tool_name: toolName, tool_input: { file_path: filePath } });
}

function runHook(scopeFile: string, input: string): number {
  const start = performance.now();
  spawnSync("bash", [HOOK_PATH], {
    input,
    env: { ...process.env, PRODUCTIONOS_AGENT_SCOPE: scopeFile },
    encoding: "utf-8",
    timeout: 10000,
    stdio: ["pipe", "pipe", "pipe"],
  });
  return performance.now() - start;
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function formatMs(ms: number): string {
  return ms < 1 ? `${(ms * 1000).toFixed(0)}us` : `${ms.toFixed(1)}ms`;
}

// ─── Benchmark Runners ──────────────────────────────────

function benchNoScope(): number[] {
  const latencies: number[] = [];
  for (let i = 0; i < 50; i++) {
    const input = makeToolInput("Edit", "src/index.ts");
    const start = performance.now();
    spawnSync("bash", [HOOK_PATH], {
      input,
      env: { ...process.env, PRODUCTIONOS_AGENT_SCOPE: "" },
      encoding: "utf-8",
      timeout: 5000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    latencies.push(performance.now() - start);
  }
  return latencies;
}

function benchSingle(tmpDir: string): number[] {
  const scopeFile = makeScopeFile(tmpDir, "agent-1");
  const latencies: number[] = [];
  const testFiles = [
    "agents/code-reviewer.md", "src/components/Button.tsx", "package.json",
    "scripts/lib/shared.ts", "unknown/file.ts", ".productionos/report.md",
  ];
  for (let i = 0; i < ITERATIONS.single; i++) {
    const file = testFiles[i % testFiles.length];
    latencies.push(runHook(scopeFile, makeToolInput("Edit", file)));
  }
  return latencies;
}

function benchWave(tmpDir: string): number[] {
  const latencies: number[] = [];
  for (let a = 1; a <= ITERATIONS.wave; a++) {
    const scopeFile = makeScopeFile(tmpDir, `agent-${a}`);
    latencies.push(runHook(scopeFile, makeToolInput("Edit", `agents/file-${a}.md`)));
  }
  return latencies;
}

function benchStress(tmpDir: string): number[] {
  const scopeFile = makeScopeFile(tmpDir, "agent-stress");
  const latencies: number[] = [];
  for (let i = 0; i < ITERATIONS.stress; i++) {
    latencies.push(runHook(scopeFile, makeToolInput("Edit", `src/components/Component${i}.tsx`)));
  }
  return latencies;
}

// ─── Main ───────────────────────────────────────────────

function main() {
  if (!existsSync(HOOK_PATH)) {
    console.error(`Hook not found: ${HOOK_PATH}`);
    process.exit(1);
  }

  const jqCheck = spawnSync("which", ["jq"], { encoding: "utf-8" });
  if (jqCheck.status !== 0) {
    console.error("jq is required. Install: brew install jq");
    process.exit(1);
  }

  const tmpDir = join(tmpdir(), `pos-bench-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });

  console.log("========================================================");
  console.log("  Scope Enforcement Latency Benchmark");
  console.log("========================================================");
  console.log("");

  // Warmup
  console.log("  Warmup (5 invocations)...");
  const warmScope = makeScopeFile(tmpDir, "agent-warmup");
  for (let i = 0; i < 5; i++) runHook(warmScope, makeToolInput("Edit", "agents/test.md"));

  // Bench 1: No scope (fast path)
  console.log("  Bench 1: No scope active (fast path, 50 invocations)");
  const noScope = benchNoScope().sort((a, b) => a - b);
  const noScopeAvg = noScope.reduce((a, b) => a + b, 0) / noScope.length;
  console.log(`    p50: ${formatMs(percentile(noScope, 50))}  p95: ${formatMs(percentile(noScope, 95))}  p99: ${formatMs(percentile(noScope, 99))}  avg: ${formatMs(noScopeAvg)}`);
  console.log("");

  // Bench 2: Single agent
  console.log(`  Bench 2: Single agent (${ITERATIONS.single} invocations)`);
  const single = benchSingle(tmpDir).sort((a, b) => a - b);
  const singleAvg = single.reduce((a, b) => a + b, 0) / single.length;
  console.log(`    p50: ${formatMs(percentile(single, 50))}  p95: ${formatMs(percentile(single, 95))}  p99: ${formatMs(percentile(single, 99))}  avg: ${formatMs(singleAvg)}`);
  console.log("");

  // Bench 3: 7-agent wave
  console.log(`  Bench 3: 7-agent wave (${ITERATIONS.wave} sequential invocations)`);
  const wave = benchWave(tmpDir).sort((a, b) => a - b);
  const waveTotal = wave.reduce((a, b) => a + b, 0);
  console.log(`    p50: ${formatMs(percentile(wave, 50))}  total: ${formatMs(waveTotal)}  avg: ${formatMs(waveTotal / wave.length)}`);
  console.log("");

  // Bench 4: Stress (350 jq invocations)
  console.log(`  Bench 4: Stress test (${ITERATIONS.stress} jq invocations)`);
  const stress = benchStress(tmpDir).sort((a, b) => a - b);
  const stressTotal = stress.reduce((a, b) => a + b, 0);
  console.log(`    p50: ${formatMs(percentile(stress, 50))}  p95: ${formatMs(percentile(stress, 95))}  p99: ${formatMs(percentile(stress, 99))}`);
  console.log(`    avg: ${formatMs(stressTotal / stress.length)}  total: ${formatMs(stressTotal)}  (${(stressTotal / 1000).toFixed(1)}s)`);
  console.log("");

  // Analysis
  console.log("--------------------------------------------------------");
  console.log("  Analysis");
  console.log("--------------------------------------------------------");
  const overhead = singleAvg - noScopeAvg;
  console.log(`  jq overhead per check: ~${formatMs(overhead)}`);
  console.log(`  Projected 350-check wave: ~${formatMs(overhead * 350)}`);

  if (overhead > 50) {
    console.log("\n  WARNING: jq overhead > 50ms/check");
    console.log("  Recommendation: Replace jq with native TS scope checker");
  } else if (overhead > 20) {
    console.log("\n  MODERATE: jq overhead 20-50ms/check");
    console.log("  Consider: Pre-loading scope data or caching jq filter");
  } else {
    console.log("\n  OK: jq overhead < 20ms/check");
  }
  console.log("========================================================");

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    benchmarks: {
      no_scope: { count: noScope.length, p50: percentile(noScope, 50), p95: percentile(noScope, 95), p99: percentile(noScope, 99), avg: noScopeAvg },
      single_agent: { count: single.length, p50: percentile(single, 50), p95: percentile(single, 95), p99: percentile(single, 99), avg: singleAvg },
      wave_7: { count: wave.length, total_ms: waveTotal, avg: waveTotal / wave.length },
      stress_350: { count: stress.length, p50: percentile(stress, 50), p95: percentile(stress, 95), p99: percentile(stress, 99), total_ms: stressTotal },
    },
    analysis: { jq_overhead_ms: overhead, bottleneck: overhead > 50 },
  };

  try {
    mkdirSync(join(process.cwd(), ".productionos"), { recursive: true });
    writeFileSync(join(process.cwd(), ".productionos", "BENCH-SCOPE-ENFORCEMENT.json"), JSON.stringify(report, null, 2));
    console.log("  Report: .productionos/BENCH-SCOPE-ENFORCEMENT.json");
  } catch { /* ignore in CI */ }

  try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
}

main();
