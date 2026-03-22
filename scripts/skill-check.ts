#!/usr/bin/env bun
/**
 * skill-check.ts — Comprehensive health check for ProductionOS.
 *
 * Runs structural, semantic, and hygiene checks across the entire plugin.
 * Outputs pass/fail per check with a total score.
 *
 * Usage:
 *   bun run scripts/skill-check.ts
 */

import * as path from 'path';
import { parseFrontmatter, readFileOrNull, walkFiles, listMdFiles, ROOT } from './lib/shared';

// ─── Helpers (remaining, not in shared.ts) ──────────────────

function isValidJson(content: string): boolean {
  try {
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
}

// ─── Check Framework ────────────────────────────────────────

interface CheckResult {
  name: string;
  status: 'pass' | 'fail';
  details: string[];
}

const checks: CheckResult[] = [];

function runCheck(name: string, fn: () => { pass: boolean; details: string[] }): void {
  try {
    const result = fn();
    checks.push({ name, status: result.pass ? 'pass' : 'fail', details: result.details });
  } catch (err) {
    checks.push({ name, status: 'fail', details: [`Uncaught: ${err}`] });
  }
}

// ─── Checks ─────────────────────────────────────────────────

// 1. VERSION file exists and is valid semver
runCheck('VERSION is valid semver', () => {
  const content = readFileOrNull(path.join(ROOT, 'VERSION'));
  if (!content) return { pass: false, details: ['VERSION file not found'] };
  const version = content.trim();
  const valid = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(version);
  return { pass: valid, details: valid ? [`v${version}`] : [`Invalid: "${version}"`] };
});

// 2. plugin.json version matches VERSION
runCheck('plugin.json version matches VERSION', () => {
  const versionContent = readFileOrNull(path.join(ROOT, 'VERSION'));
  const pluginContent = readFileOrNull(path.join(ROOT, '.claude-plugin', 'plugin.json'));
  if (!versionContent || !pluginContent) {
    return { pass: false, details: ['Missing VERSION or plugin.json'] };
  }
  const version = versionContent.trim();
  try {
    const plugin = JSON.parse(pluginContent);
    const match = version === plugin.version;
    return {
      pass: match,
      details: match
        ? [`Both are v${version}`]
        : [`VERSION=${version}, plugin.json=${plugin.version}`],
    };
  } catch {
    return { pass: false, details: ['plugin.json is invalid JSON'] };
  }
});

// 3. marketplace.json is valid JSON
runCheck('marketplace.json is valid JSON', () => {
  const content = readFileOrNull(path.join(ROOT, '.claude-plugin', 'marketplace.json'));
  if (!content) return { pass: false, details: ['marketplace.json not found'] };
  const valid = isValidJson(content);
  return { pass: valid, details: valid ? ['Valid'] : ['Invalid JSON'] };
});

// 4. SKILL.md frontmatter has correct name/description
runCheck('SKILL.md has valid frontmatter', () => {
  const content = readFileOrNull(path.join(ROOT, '.claude', 'skills', 'productionos', 'SKILL.md'));
  if (!content) return { pass: false, details: ['SKILL.md not found'] };
  const fm = parseFrontmatter(content);
  if (!fm) return { pass: false, details: ['No YAML frontmatter found'] };
  const hasName = typeof fm.name === 'string' && fm.name.length > 0;
  const hasDesc = typeof fm.description === 'string' && fm.description.length > 0;
  const details: string[] = [];
  if (!hasName) details.push('Missing "name" field');
  if (!hasDesc) details.push('Missing "description" field');
  if (details.length === 0) details.push(`name="${fm.name}"`);
  return { pass: hasName && hasDesc, details };
});

// 5. All agent .md files have valid YAML frontmatter (name, description, color, tools)
runCheck('All agents have valid frontmatter', () => {
  const agentFiles = listMdFiles(path.join(ROOT, 'agents'));
  const details: string[] = [];
  let allValid = true;

  for (const file of agentFiles) {
    const content = readFileOrNull(path.join(ROOT, 'agents', file));
    if (!content) {
      details.push(`${file}: unreadable`);
      allValid = false;
      continue;
    }
    const fm = parseFrontmatter(content);
    if (!fm) {
      details.push(`${file}: no frontmatter`);
      allValid = false;
      continue;
    }
    const missing: string[] = [];
    if (!fm.name) missing.push('name');
    if (!fm.description) missing.push('description');
    if (!fm.tools) missing.push('tools');
    if (missing.length > 0) {
      details.push(`${file}: missing ${missing.join(', ')}`);
      allValid = false;
    }
  }

  if (allValid) details.push(`All ${agentFiles.length} agents have valid frontmatter`);
  return { pass: allValid, details };
});

// 6. No agent references .productupgrade/ (should be .productionos/)
runCheck('No stale .productupgrade/ references in agents', () => {
  const agentFiles = listMdFiles(path.join(ROOT, 'agents'));
  const violations: string[] = [];

  for (const file of agentFiles) {
    const content = readFileOrNull(path.join(ROOT, 'agents', file));
    if (!content) continue;
    if (content.includes('.productupgrade/') || content.includes('.productupgrade\\')) {
      violations.push(file);
    }
  }

  return {
    pass: violations.length === 0,
    details: violations.length === 0
      ? ['No stale references found']
      : violations.map(f => `${f} references .productupgrade/`),
  };
});

// 7. No file references /ultra-upgrade or /productupgrade (old command names)
runCheck('No stale command name references', () => {
  const allMdFiles = [
    ...walkFiles(path.join(ROOT, 'agents'), '.md'),
    ...walkFiles(path.join(ROOT, '.claude', 'commands'), '.md'),
    ...walkFiles(path.join(ROOT, 'prompts'), '.md'),
  ];
  const violations: string[] = [];
  const stalePatterns = ['/ultra-upgrade'];
  // Note: '/productupgrade' is excluded because the actual directory is named 'productupgrade'
  // and legitimate references to the directory path are valid (e.g., in productionos-update.md)

  for (const file of allMdFiles) {
    const content = readFileOrNull(file);
    if (!content) continue;
    for (const pattern of stalePatterns) {
      if (content.includes(pattern)) {
        const relPath = path.relative(ROOT, file);
        violations.push(`${relPath} contains "${pattern}"`);
      }
    }
  }

  return {
    pass: violations.length === 0,
    details: violations.length === 0
      ? ['No stale command name references']
      : violations,
  };
});

// 8. CLAUDE.md command list matches actual files
runCheck('CLAUDE.md commands match .claude/commands/ files', () => {
  const claudeContent = readFileOrNull(path.join(ROOT, 'CLAUDE.md'));
  if (!claudeContent) return { pass: false, details: ['CLAUDE.md not found'] };

  const commandPattern = /^\s*\/([a-z][a-z0-9-]+)/gm;
  const claudeCommands: string[] = [];
  let match;
  while ((match = commandPattern.exec(claudeContent)) !== null) {
    const cmd = match[1];
    if (!claudeCommands.includes(cmd)) {
      claudeCommands.push(cmd);
    }
  }

  const commandsDir = path.join(ROOT, '.claude', 'commands');
  const commandFiles = listMdFiles(commandsDir).map(f => f.replace('.md', ''));

  const missingFiles = claudeCommands.filter(cmd => !commandFiles.includes(cmd));
  const details: string[] = [];

  if (missingFiles.length > 0) {
    details.push(`Commands in CLAUDE.md without files: ${missingFiles.join(', ')}`);
  } else {
    details.push(`${claudeCommands.length} commands, all consistent`);
  }

  return { pass: missingFiles.length === 0, details };
});

// 9. hooks/hooks.json is valid JSON
runCheck('hooks.json is valid JSON', () => {
  const content = readFileOrNull(path.join(ROOT, 'hooks', 'hooks.json'));
  if (!content) return { pass: false, details: ['hooks/hooks.json not found'] };
  const valid = isValidJson(content);
  return { pass: valid, details: valid ? ['Valid'] : ['Invalid JSON'] };
});

// 10. No files contain hardcoded absolute user paths
runCheck('No hardcoded user paths', () => {
  const allFiles = [
    ...walkFiles(path.join(ROOT, 'agents'), '.md'),
    ...walkFiles(path.join(ROOT, '.claude', 'commands'), '.md'),
    ...walkFiles(path.join(ROOT, 'scripts'), '.ts'),
    ...walkFiles(path.join(ROOT, 'scripts'), '.sh'),
    ...walkFiles(path.join(ROOT, 'prompts'), '.md'),
  ];
  const violations: string[] = [];
  const hardcodedPathPattern = /\/Users\/[a-zA-Z]+\//g;

  for (const file of allFiles) {
    const content = readFileOrNull(file);
    if (!content) continue;
    const matches = content.match(hardcodedPathPattern);
    if (matches) {
      const relPath = path.relative(ROOT, file);
      violations.push(`${relPath}: ${matches[0]}`);
    }
  }

  return {
    pass: violations.length === 0,
    details: violations.length === 0
      ? ['No hardcoded paths found']
      : violations,
  };
});

// ─── Report ─────────────────────────────────────────────────

console.log('\n  ProductionOS Skill Check');
console.log('  ' + '='.repeat(55));

let passCount = 0;
let failCount = 0;

for (const c of checks) {
  const icon = c.status === 'pass' ? '\u2705' : '\u274c';
  console.log(`  ${icon} ${c.name}`);
  for (const detail of c.details) {
    console.log(`      ${detail}`);
  }
  if (c.status === 'pass') passCount++;
  else failCount++;
}

const total = passCount + failCount;
const score = total > 0 ? Math.round((passCount / total) * 100) : 0;

console.log('  ' + '-'.repeat(55));
console.log(`  Score: ${passCount}/${total} checks passed (${score}%)`);
console.log('');

process.exit(failCount > 0 ? 1 : 0);
