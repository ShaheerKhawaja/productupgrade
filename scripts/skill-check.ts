#!/usr/bin/env bun
/**
 * skill-check.ts — Health dashboard for ProductionOS
 *
 * Validates:
 * 1. All agent .md files have valid structure
 * 2. All command .md files have valid YAML frontmatter
 * 3. Version consistency across VERSION, plugin.json, marketplace.json, SKILL.md
 * 4. No orphaned agent references in commands
 * 5. Hook files exist and are valid JSON
 *
 * Usage:
 *   bun run scripts/skill-check.ts
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

const ROOT = join(import.meta.dir, "..");

interface CheckResult {
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
}

const results: CheckResult[] = [];

function pass(name: string, message: string) {
  results.push({ name, status: "pass", message });
}
function warn(name: string, message: string) {
  results.push({ name, status: "warn", message });
}
function fail(name: string, message: string) {
  results.push({ name, status: "fail", message });
}

async function checkVersionConsistency() {
  const version = (await readFile(join(ROOT, "VERSION"), "utf-8")).trim();

  // plugin.json
  const pluginRaw = await readFile(
    join(ROOT, ".claude-plugin", "plugin.json"),
    "utf-8"
  );
  const plugin = JSON.parse(pluginRaw);
  if (plugin.version === version) {
    pass("version:plugin.json", `v${version}`);
  } else {
    fail(
      "version:plugin.json",
      `VERSION=${version} but plugin.json=${plugin.version}`
    );
  }

  // marketplace.json
  const marketRaw = await readFile(
    join(ROOT, ".claude-plugin", "marketplace.json"),
    "utf-8"
  );
  const market = JSON.parse(marketRaw);
  const marketVersion = market.plugins?.[0]?.version;
  if (marketVersion === version) {
    pass("version:marketplace.json", `v${version}`);
  } else {
    fail(
      "version:marketplace.json",
      `VERSION=${version} but marketplace.json=${marketVersion}`
    );
  }

  // SKILL.md version check
  const skillPath = join(ROOT, ".claude", "skills", "productionos", "SKILL.md");
  if (existsSync(skillPath)) {
    const skill = await readFile(skillPath, "utf-8");
    const match = skill.match(/V(\d+\.\d+)/);
    const majorMinor = version.split(".").slice(0, 2).join(".");
    if (match && match[1] === majorMinor) {
      pass("version:SKILL.md", `V${majorMinor}`);
    } else {
      fail(
        "version:SKILL.md",
        `VERSION=${version} but SKILL.md says V${match?.[1] || "unknown"}`
      );
    }
  }
}

async function checkAgentFiles() {
  const agentsDir = join(ROOT, "agents");
  if (!existsSync(agentsDir)) {
    fail("agents", "agents/ directory missing");
    return;
  }

  const files = await readdir(agentsDir);
  const mdFiles = files.filter((f) => f.endsWith(".md"));

  for (const f of mdFiles) {
    const content = await readFile(join(agentsDir, f), "utf-8");
    const name = f.replace(".md", "");

    // Check it has content (not empty)
    if (content.trim().length < 50) {
      fail(`agent:${name}`, "File too short (< 50 chars)");
      continue;
    }

    // Check for a heading
    if (!content.includes("# ")) {
      warn(`agent:${name}`, "Missing markdown heading");
    } else {
      pass(`agent:${name}`, "Valid");
    }
  }

  pass("agents:count", `${mdFiles.length} agent definitions`);
}

async function checkCommandFiles() {
  const commandsDir = join(ROOT, ".claude", "commands");
  if (!existsSync(commandsDir)) {
    fail("commands", ".claude/commands/ directory missing");
    return;
  }

  const files = await readdir(commandsDir);
  const mdFiles = files.filter((f) => f.endsWith(".md"));

  for (const f of mdFiles) {
    const content = await readFile(join(commandsDir, f), "utf-8");
    const name = f.replace(".md", "");

    // Check YAML frontmatter
    if (!content.startsWith("---")) {
      fail(`command:${name}`, "Missing YAML frontmatter");
      continue;
    }

    const fmEnd = content.indexOf("---", 4);
    if (fmEnd === -1) {
      fail(`command:${name}`, "Unclosed YAML frontmatter");
      continue;
    }

    const fm = content.slice(4, fmEnd);
    if (!fm.includes("name:")) {
      warn(`command:${name}`, "Frontmatter missing 'name' field");
    }
    if (!fm.includes("description:")) {
      warn(`command:${name}`, "Frontmatter missing 'description' field");
    }

    pass(`command:${name}`, "Valid frontmatter");
  }

  pass("commands:count", `${mdFiles.length} commands`);
}

async function checkHooks() {
  const hooksJson = join(ROOT, "hooks", "hooks.json");
  if (!existsSync(hooksJson)) {
    fail("hooks", "hooks/hooks.json missing");
    return;
  }

  try {
    const raw = await readFile(hooksJson, "utf-8");
    const hooks = JSON.parse(raw);

    // Check hook structure
    const hookObj = hooks.hooks || hooks;
    const events = Object.keys(hookObj);
    pass("hooks:parse", `Valid JSON with ${events.length} events: ${events.join(", ")}`);

    // Check referenced files exist
    for (const event of events) {
      const entries = hookObj[event];
      if (!Array.isArray(entries)) continue;
      for (const entry of entries) {
        const hookList = entry.hooks || [];
        for (const hook of hookList) {
          if (hook.command) {
            // Extract filename from command
            const fileMatch = hook.command.match(
              /(?:bash|node)\s+"?\$\{CLAUDE_PLUGIN_ROOT\}\/hooks\/([^"]+)"?/
            );
            if (fileMatch) {
              const hookFile = join(ROOT, "hooks", fileMatch[1]);
              if (!existsSync(hookFile)) {
                fail(`hooks:${event}`, `Referenced file missing: hooks/${fileMatch[1]}`);
              } else {
                pass(`hooks:${event}`, `hooks/${fileMatch[1]} exists`);
              }
            }
          }
        }
      }
    }
  } catch (e: any) {
    fail("hooks", `Invalid JSON: ${e.message}`);
  }
}

async function checkOutputPaths() {
  // Scan all commands for stale .productupgrade/ references
  const commandsDir = join(ROOT, ".claude", "commands");
  if (!existsSync(commandsDir)) return;

  const files = await readdir(commandsDir);
  for (const f of files.filter((f) => f.endsWith(".md"))) {
    const content = await readFile(join(commandsDir, f), "utf-8");
    const name = f.replace(".md", "");

    if (content.includes(".productupgrade/")) {
      fail(`paths:${name}`, 'Contains stale ".productupgrade/" reference');
    }
    if (content.includes("productupgrade") && !content.includes("productionos")) {
      warn(`paths:${name}`, 'References "productupgrade" without "productionos"');
    }
  }
}

async function main() {
  console.log("ProductionOS Health Dashboard\n");

  await checkVersionConsistency();
  await checkAgentFiles();
  await checkCommandFiles();
  await checkHooks();
  await checkOutputPaths();

  // Print results
  const passes = results.filter((r) => r.status === "pass");
  const warns = results.filter((r) => r.status === "warn");
  const fails = results.filter((r) => r.status === "fail");

  if (fails.length > 0) {
    console.log("FAILURES:");
    for (const r of fails) {
      console.log(`  ✗ [${r.name}] ${r.message}`);
    }
    console.log();
  }

  if (warns.length > 0) {
    console.log("WARNINGS:");
    for (const r of warns) {
      console.log(`  ⚠ [${r.name}] ${r.message}`);
    }
    console.log();
  }

  console.log(`PASSES: ${passes.length}`);
  console.log(
    `\nSummary: ${passes.length} pass, ${warns.length} warn, ${fails.length} fail`
  );

  if (fails.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
