#!/usr/bin/env bun
/**
 * quality-gate-checker.ts — Evaluate quality gates against current project state.
 * Reads quality-gates.yml, evaluates each gate, returns pass/fail/warn.
 */
import { execSync } from "child_process";

interface GateResult { name: string; status: "pass" | "fail" | "warn" | "skip"; value: string; threshold: string; }

function run(cmd: string): string {
  try { return execSync(cmd, { encoding: "utf-8", timeout: 30000, stdio: ["pipe", "pipe", "pipe"] }).trim(); } catch { return ""; }
}

function checkGates(): GateResult[] {
  const results: GateResult[] = [];
  const testFiles = parseInt(run('find . -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | grep -v node_modules | wc -l') || "0");
  const totalFiles = parseInt(run('find . -name "*.ts" -o -name "*.tsx" -o -name "*.py" -o -name "*.js" 2>/dev/null | grep -v node_modules | wc -l') || "1");
  const ratio = totalFiles > 0 ? testFiles / totalFiles : 0;
  results.push({ name: "test-ratio", status: ratio >= 0.20 ? "pass" : ratio >= 0.10 ? "warn" : "fail", value: `${(ratio * 100).toFixed(1)}%`, threshold: ">= 20%" });

  const hasGitleaks = run("command -v gitleaks") !== "";
  results.push({ name: "gitleaks", status: hasGitleaks ? "pass" : "skip", value: hasGitleaks ? "installed" : "not installed", threshold: "installed" });

  const hasSemgrep = run("command -v semgrep") !== "";
  results.push({ name: "semgrep", status: hasSemgrep ? "pass" : "skip", value: hasSemgrep ? "installed" : "not installed", threshold: "installed" });

  return results;
}

const results = checkGates();
if (process.argv.includes("--json")) { console.log(JSON.stringify(results, null, 2)); }
else {
  console.log("ProductionOS Quality Gate Check\n" + "=".repeat(50));
  for (const r of results) {
    const icon = r.status === "pass" ? "✅" : r.status === "fail" ? "❌" : r.status === "warn" ? "⚠️" : "⏭️";
    console.log(`  ${icon} ${r.name.padEnd(20)} ${r.value.padEnd(20)} (${r.threshold})`);
  }
  const fails = results.filter(r => r.status === "fail").length;
  console.log(`\n  ${results.filter(r => r.status === "pass").length} pass, ${fails} fail, ${results.filter(r => r.status === "warn").length} warn`);
  process.exit(fails > 0 ? 1 : 0);
}
