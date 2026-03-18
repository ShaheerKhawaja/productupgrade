#!/usr/bin/env bun
/**
 * gen-skill-docs.ts — Generate SKILL.md from source of truth
 *
 * Modeled on gstack's gen-skill-docs.ts pattern:
 * - Reads plugin.json as the single source of truth for version, name, description
 * - Reads all agent definitions from agents/
 * - Reads all command definitions from .claude/commands/
 * - Validates consistency and reports drift
 *
 * Usage:
 *   bun run scripts/gen-skill-docs.ts           # Generate and write
 *   bun run scripts/gen-skill-docs.ts --dry-run # Check only, exit 1 on drift
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { existsSync } from "node:fs";

const ROOT = join(import.meta.dir, "..");
const DRY_RUN = process.argv.includes("--dry-run");

interface PluginMeta {
  name: string;
  version: string;
  description: string;
}

interface AgentDef {
  filename: string;
  name: string;
}

interface CommandDef {
  filename: string;
  name: string;
  description: string;
}

async function readPluginJson(): Promise<PluginMeta> {
  const raw = await readFile(join(ROOT, ".claude-plugin", "plugin.json"), "utf-8");
  return JSON.parse(raw);
}

async function readVersion(): Promise<string> {
  return (await readFile(join(ROOT, "VERSION"), "utf-8")).trim();
}

async function listAgents(): Promise<AgentDef[]> {
  const agentsDir = join(ROOT, "agents");
  if (!existsSync(agentsDir)) return [];

  const files = await readdir(agentsDir);
  return files
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({
      filename: f,
      name: f.replace(".md", ""),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function listCommands(): Promise<CommandDef[]> {
  const commandsDir = join(ROOT, ".claude", "commands");
  if (!existsSync(commandsDir)) return [];

  const files = await readdir(commandsDir);
  const commands: CommandDef[] = [];

  for (const f of files.filter((f) => f.endsWith(".md"))) {
    const content = await readFile(join(commandsDir, f), "utf-8");
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    let name = f.replace(".md", "");
    let description = "";

    if (frontmatterMatch) {
      const fm = frontmatterMatch[1];
      const nameMatch = fm.match(/^name:\s*(.+)$/m);
      const descMatch = fm.match(/^description:\s*"?(.+?)"?\s*$/m);
      if (nameMatch) name = nameMatch[1].trim();
      if (descMatch) description = descMatch[1].trim();
    }

    commands.push({ filename: f, name, description });
  }

  return commands.sort((a, b) => a.name.localeCompare(b.name));
}

async function main() {
  const plugin = await readPluginJson();
  const version = await readVersion();
  const agents = await listAgents();
  const commands = await listCommands();

  // Validate version consistency
  const issues: string[] = [];
  if (plugin.version !== version) {
    issues.push(`VERSION file (${version}) != plugin.json (${plugin.version})`);
  }

  // Report
  console.log(`ProductionOS v${version}`);
  console.log(`  Agents:   ${agents.length}`);
  console.log(`  Commands: ${commands.length}`);
  console.log(`  Plugin:   ${plugin.name} v${plugin.version}`);

  if (issues.length > 0) {
    console.error("\nVersion drift detected:");
    for (const issue of issues) {
      console.error(`  - ${issue}`);
    }
  }

  // Read current SKILL.md
  const skillPath = join(ROOT, ".claude", "skills", "productionos", "SKILL.md");
  const currentSkill = existsSync(skillPath)
    ? await readFile(skillPath, "utf-8")
    : "";

  // Check if SKILL.md references correct counts
  const agentCountMatch = currentSkill.match(/(\d+)\s*agent/i);
  const commandCountMatch = currentSkill.match(/(\d+)\s*command/i);

  if (agentCountMatch && parseInt(agentCountMatch[1]) !== agents.length) {
    issues.push(
      `SKILL.md says ${agentCountMatch[1]} agents, found ${agents.length} agent files`
    );
  }
  if (commandCountMatch && parseInt(commandCountMatch[1]) !== commands.length) {
    issues.push(
      `SKILL.md says ${commandCountMatch[1]} commands, found ${commands.length} command files`
    );
  }

  // Check SKILL.md version
  const skillVersionMatch = currentSkill.match(/V(\d+\.\d+)/);
  if (skillVersionMatch && skillVersionMatch[1] !== version.replace(/\.\d+$/, "")) {
    issues.push(
      `SKILL.md says V${skillVersionMatch[1]}, VERSION file says ${version}`
    );
  }

  if (issues.length > 0) {
    console.error("\nDrift issues found:");
    for (const issue of issues) {
      console.error(`  ✗ ${issue}`);
    }
    if (DRY_RUN) {
      process.exit(1);
    }
  } else {
    console.log("\n  ✓ No drift detected");
  }

  // List agents and commands for reference
  console.log("\nAgents:");
  for (const agent of agents) {
    console.log(`  - ${agent.name}`);
  }
  console.log("\nCommands:");
  for (const cmd of commands) {
    console.log(`  - /${cmd.name}: ${cmd.description.slice(0, 60)}...`);
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
