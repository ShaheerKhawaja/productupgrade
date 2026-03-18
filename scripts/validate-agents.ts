#!/usr/bin/env bun
/**
 * validate-agents.ts — Agent roster validation for ProductionOS.
 *
 * Reads every .md file in agents/, parses YAML frontmatter,
 * validates required fields, checks XML structure tags,
 * enforces minimum quality thresholds, and verifies cross-references.
 *
 * Usage:
 *   bun run scripts/validate-agents.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dir, '..');
const AGENTS_DIR = path.join(ROOT, 'agents');

// ─── Helpers ────────────────────────────────────────────────

function readFileOrNull(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

interface Frontmatter {
  name?: string;
  description?: string;
  color?: string;
  tools?: string[];
  [key: string]: unknown;
}

function parseFrontmatter(content: string): Frontmatter | null {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;

  const frontmatter: Frontmatter = {};
  const lines = fmMatch[1].split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    // Skip indented lines (array items)
    if (line.startsWith(' ') || line.startsWith('\t')) continue;

    const key = line.slice(0, colonIdx).trim();
    const inlineValue = line.slice(colonIdx + 1).trim();

    if (inlineValue === '' || inlineValue === '|' || inlineValue === '>') {
      // Collect indented list items
      const items: string[] = [];
      for (let j = i + 1; j < lines.length; j++) {
        const trimmed = lines[j].trim();
        if (trimmed.startsWith('- ')) {
          items.push(trimmed.slice(2).trim());
        } else if (trimmed === '' || lines[j].startsWith(' ') || lines[j].startsWith('\t')) {
          continue;
        } else {
          break;
        }
      }
      (frontmatter as Record<string, unknown>)[key] = items.length > 0 ? items : '';
    } else {
      (frontmatter as Record<string, unknown>)[key] = inlineValue.replace(/^["']|["']$/g, '');
    }
  }

  return frontmatter;
}

// ─── Validation ─────────────────────────────────────────────

interface AgentValidation {
  file: string;
  name: string;
  status: 'valid' | 'invalid';
  issues: string[];
  lineCount: number;
  hasRole: boolean;
  hasInstructions: boolean;
  crossRefs: string[];
  missingRefs: string[];
}

const MIN_LINE_COUNT = 50;

function validateAgent(file: string, allAgentNames: Set<string>): AgentValidation {
  const filePath = path.join(AGENTS_DIR, file);
  const content = readFileOrNull(filePath);

  const result: AgentValidation = {
    file,
    name: file.replace('.md', ''),
    status: 'valid',
    issues: [],
    lineCount: 0,
    hasRole: false,
    hasInstructions: false,
    crossRefs: [],
    missingRefs: [],
  };

  if (!content) {
    result.status = 'invalid';
    result.issues.push('File unreadable');
    return result;
  }

  const lines = content.split('\n');
  result.lineCount = lines.length;

  // 1. Parse frontmatter
  const fm = parseFrontmatter(content);
  if (!fm) {
    result.status = 'invalid';
    result.issues.push('No YAML frontmatter');
    return result;
  }

  // 2. Required frontmatter fields
  if (!fm.name || typeof fm.name !== 'string') {
    result.issues.push('Missing frontmatter: name');
  } else {
    result.name = fm.name;
  }

  if (!fm.description || typeof fm.description !== 'string') {
    result.issues.push('Missing frontmatter: description');
  }

  if (!fm.tools || !Array.isArray(fm.tools) || fm.tools.length === 0) {
    result.issues.push('Missing frontmatter: tools (must be non-empty array)');
  }

  // Note: color is optional but recommended
  if (!fm.color) {
    result.issues.push('Missing frontmatter: color (recommended)');
  }

  // 3. XML structure tags
  result.hasRole = content.includes('<role>') && content.includes('</role>');
  result.hasInstructions = content.includes('<instructions>') && content.includes('</instructions>');

  if (!result.hasRole) {
    result.issues.push('Missing <role></role> XML tags');
  }
  if (!result.hasInstructions) {
    result.issues.push('Missing <instructions></instructions> XML tags');
  }

  // 4. Minimum line count for quality
  if (result.lineCount < MIN_LINE_COUNT) {
    result.issues.push(`Too short: ${result.lineCount} lines (minimum ${MIN_LINE_COUNT})`);
  }

  // 5. Cross-references to other agents via file path
  const crossRefPattern = /agents\/([a-z][a-z0-9-]+)\.md/g;
  let crossMatch;
  while ((crossMatch = crossRefPattern.exec(content)) !== null) {
    const refName = crossMatch[1];
    if (!result.crossRefs.includes(refName)) {
      result.crossRefs.push(refName);
    }
  }

  // Also check prose references like "the llm-judge agent"
  for (const agentName of allAgentNames) {
    if (agentName === result.name) continue;
    const namePattern = new RegExp(`\\b${agentName.replace(/-/g, '[-\\s]')}\\b`, 'gi');
    if (namePattern.test(content) && !result.crossRefs.includes(agentName)) {
      result.crossRefs.push(agentName);
    }
  }

  // 6. Verify cross-references point to existing agents
  for (const ref of result.crossRefs) {
    if (!allAgentNames.has(ref)) {
      result.missingRefs.push(ref);
      result.issues.push(`References non-existent agent: ${ref}`);
    }
  }

  // Determine overall status (color/missing is a warning, not a failure)
  const criticalIssues = result.issues.filter(
    i => !i.startsWith('Missing frontmatter: color')
  );
  if (criticalIssues.length > 0) {
    result.status = 'invalid';
  }

  return result;
}

// ─── Main ───────────────────────────────────────────────────

const agentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));

if (agentFiles.length === 0) {
  console.log('\n  No agent files found in agents/\n');
  process.exit(1);
}

const allAgentNames = new Set(agentFiles.map(f => f.replace('.md', '')));
const validations = agentFiles.map(f => validateAgent(f, allAgentNames));

// ─── Report ─────────────────────────────────────────────────

console.log('\n  ProductionOS Agent Roster Validation');
console.log('  ' + '='.repeat(60));

let validCount = 0;
let invalidCount = 0;

for (const v of validations) {
  const icon = v.status === 'valid' ? '\u2705' : '\u274c';
  const refs = v.crossRefs.length > 0 ? ` [refs: ${v.crossRefs.length}]` : '';
  console.log(`  ${icon} ${v.name.padEnd(30)} ${v.lineCount} lines${refs}`);

  if (v.issues.length > 0) {
    for (const issue of v.issues) {
      console.log(`      \u2022 ${issue}`);
    }
  }

  if (v.status === 'valid') validCount++;
  else invalidCount++;
}

console.log('  ' + '-'.repeat(60));
console.log(`  Total: ${agentFiles.length} agents | ${validCount} valid | ${invalidCount} invalid`);

// Summary stats
const totalLines = validations.reduce((sum, v) => sum + v.lineCount, 0);
const totalRefs = validations.reduce((sum, v) => sum + v.crossRefs.length, 0);
console.log(`  Lines: ${totalLines} total | avg ${Math.round(totalLines / agentFiles.length)} per agent`);
console.log(`  Cross-refs: ${totalRefs} total`);
console.log('');

process.exit(invalidCount > 0 ? 1 : 0);
