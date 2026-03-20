#!/usr/bin/env bun
/**
 * gen-skill-docs.ts — Health report generator for ProductionOS.
 *
 * Validates consistency across VERSION, plugin.json, SKILL.md, CLAUDE.md,
 * agent files, and command files. Outputs a structured health report.
 *
 * Usage:
 *   bun run scripts/gen-skill-docs.ts
 *   bun run scripts/gen-skill-docs.ts --dry-run   (check only, no writes)
 */

import * as fs from 'fs';
import * as path from 'path';
import { readFileOrNull, listMdFiles, ROOT } from './lib/shared';

const DRY_RUN = process.argv.includes('--dry-run');

// ─── Helpers ────────────────────────────────────────────────

function listFilesInDir(dir: string, ext: string): string[] {
  if (ext === '.md') return listMdFiles(dir);
  try {
    return fs.readdirSync(dir).filter(f => f.endsWith(ext));
  } catch {
    return [];
  }
}

// ─── Checks ─────────────────────────────────────────────────

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const results: CheckResult[] = [];

function check(name: string, status: 'pass' | 'fail' | 'warn', message: string): void {
  results.push({ name, status, message });
}

// 1. VERSION file
const versionContent = readFileOrNull(path.join(ROOT, 'VERSION'));
const version = versionContent?.trim() ?? '';
const semverRegex = /^\d+\.\d+\.\d+$/;

if (!versionContent) {
  check('VERSION file', 'fail', 'VERSION file not found');
} else if (!semverRegex.test(version)) {
  check('VERSION file', 'fail', `Invalid semver: "${version}"`);
} else {
  check('VERSION file', 'pass', `v${version}`);
}

// 2. plugin.json
const pluginJsonPath = path.join(ROOT, '.claude-plugin', 'plugin.json');
const pluginJsonContent = readFileOrNull(pluginJsonPath);
let pluginVersion = '';

if (!pluginJsonContent) {
  check('plugin.json', 'fail', 'File not found at .claude-plugin/plugin.json');
} else {
  try {
    const pluginData = JSON.parse(pluginJsonContent);
    pluginVersion = pluginData.version ?? '';
    check('plugin.json', 'pass', `Parsed successfully (name: ${pluginData.name})`);
  } catch (err) {
    check('plugin.json', 'fail', `Invalid JSON: ${err}`);
  }
}

// 3. VERSION matches plugin.json
if (version && pluginVersion) {
  if (version === pluginVersion) {
    check('Version sync', 'pass', `VERSION (${version}) matches plugin.json (${pluginVersion})`);
  } else {
    check('Version sync', 'fail', `VERSION (${version}) != plugin.json (${pluginVersion})`);
  }
} else {
  check('Version sync', 'warn', 'Cannot compare — one or both version sources missing');
}

// 4. Agent count
const agentsDir = path.join(ROOT, 'agents');
const agentFiles = listFilesInDir(agentsDir, '.md');
const agentCount = agentFiles.length;

check('Agent files', 'pass', `${agentCount} agents in agents/`);

// 5. Command count
const commandsDir = path.join(ROOT, '.claude', 'commands');
const commandFiles = listFilesInDir(commandsDir, '.md');
const commandCount = commandFiles.length;

check('Command files', 'pass', `${commandCount} commands in .claude/commands/`);

// 6. SKILL.md agent count verification
const skillMdPath = path.join(ROOT, '.claude', 'skills', 'productionos', 'SKILL.md');
const skillMdContent = readFileOrNull(skillMdPath);

if (skillMdContent) {
  // Look for patterns like "29 agents" or "Agent Roster (29 agents)"
  const agentCountMatch = skillMdContent.match(/(\d+)\s+agents/i);
  if (agentCountMatch) {
    const claimedCount = parseInt(agentCountMatch[1], 10);
    if (claimedCount === agentCount) {
      check('SKILL.md agent count', 'pass', `Claims ${claimedCount}, found ${agentCount}`);
    } else {
      check('SKILL.md agent count', 'warn', `Claims ${claimedCount} agents, but found ${agentCount} files`);
    }
  } else {
    check('SKILL.md agent count', 'warn', 'No agent count pattern found in SKILL.md');
  }
} else {
  check('SKILL.md', 'warn', 'SKILL.md not found');
}

// 7. CLAUDE.md command list vs actual files
const claudeMdPath = path.join(ROOT, 'CLAUDE.md');
const claudeMdContent = readFileOrNull(claudeMdPath);

if (claudeMdContent) {
  // Extract command names from CLAUDE.md (lines like "/production-upgrade" or "/omni-plan")
  const commandPattern = /^\s*\/([a-z][a-z0-9-]+)/gm;
  const claudeCommands: string[] = [];
  let match;
  while ((match = commandPattern.exec(claudeMdContent)) !== null) {
    const cmd = match[1];
    if (!claudeCommands.includes(cmd)) {
      claudeCommands.push(cmd);
    }
  }

  const missingFiles: string[] = [];
  for (const cmd of claudeCommands) {
    const cmdFile = path.join(commandsDir, `${cmd}.md`);
    if (!fs.existsSync(cmdFile)) {
      missingFiles.push(cmd);
    }
  }

  if (missingFiles.length === 0) {
    check('CLAUDE.md commands', 'pass', `All ${claudeCommands.length} commands have files`);
  } else {
    check('CLAUDE.md commands', 'fail', `Missing command files: ${missingFiles.join(', ')}`);
  }

  // Check for orphan command files (files with no CLAUDE.md reference)
  const orphanCommands = commandFiles
    .map(f => f.replace('.md', ''))
    .filter(cmd => !claudeCommands.includes(cmd));

  if (orphanCommands.length > 0) {
    check('Orphan commands', 'warn', `Command files not in CLAUDE.md: ${orphanCommands.join(', ')}`);
  }
} else {
  check('CLAUDE.md', 'fail', 'CLAUDE.md not found');
}

// 8. Agent references in commands exist
if (claudeMdContent) {
  const agentNames = new Set(agentFiles.map(f => f.replace('.md', '')));

  for (const cmdFile of commandFiles) {
    const cmdContent = readFileOrNull(path.join(commandsDir, cmdFile));
    if (!cmdContent) continue;

    // Look for agent references like "agents/code-reviewer.md"
    const agentRefPattern = /agents\/([a-z-]+)\.md/g;
    let agentMatch;
    while ((agentMatch = agentRefPattern.exec(cmdContent)) !== null) {
      const agentName = agentMatch[1];
      if (!agentNames.has(agentName)) {
        check('Agent reference', 'fail', `Command ${cmdFile} references missing agent: ${agentName}`);
      }
    }
  }
}

// ─── Report ─────────────────────────────────────────────────

console.log('\n  ProductionOS Health Report');
console.log('  ' + '='.repeat(50));
console.log(`  Version: ${version || '(unknown)'}`);
console.log(`  Agents:  ${agentCount}`);
console.log(`  Commands: ${commandCount}`);
console.log('  ' + '-'.repeat(50));

let passCount = 0;
let failCount = 0;
let warnCount = 0;

for (const r of results) {
  const icon = r.status === 'pass' ? '\u2705' : r.status === 'fail' ? '\u274c' : '\u26a0\ufe0f';
  console.log(`  ${icon} ${r.name.padEnd(28)} ${r.message}`);
  if (r.status === 'pass') passCount++;
  else if (r.status === 'fail') failCount++;
  else warnCount++;
}

console.log('  ' + '-'.repeat(50));
console.log(`  Total: ${passCount} pass, ${failCount} fail, ${warnCount} warn`);
console.log('');

if (DRY_RUN) {
  console.log('  (dry-run mode — no files modified)');
}

process.exit(failCount > 0 ? 1 : 0);
