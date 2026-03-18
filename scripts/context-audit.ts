#!/usr/bin/env bun
/**
 * context-audit.ts — Context budget analyzer for ProductionOS.
 *
 * Calculates the total context weight of all .md files that could be
 * injected into Claude's context window. Flags heavy files and overload risks.
 *
 * This is unique to ProductionOS — gstack doesn't have an equivalent.
 * With 32 agents, 10 commands, and multiple prompt templates, context
 * budget management is critical to avoid degrading agent performance.
 *
 * Usage:
 *   bun run scripts/context-audit.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dir, '..');

// ─── Configuration ──────────────────────────────────────────

const HEAVY_FILE_THRESHOLD = 10 * 1024;    // 10KB — flag individual files
const TOTAL_OVERLOAD_THRESHOLD = 50 * 1024; // 50KB — flag total context
const BYTES_PER_TOKEN = 4;                  // Rough estimate: 1 token ~ 4 bytes

// ─── Helpers ────────────────────────────────────────────────

interface FileEntry {
  path: string;
  relativePath: string;
  bytes: number;
  estimatedTokens: number;
  isHeavy: boolean;
}

function walkMdFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip hidden dirs, node_modules, .git, dist
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
          continue;
        }
        results.push(...walkMdFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist
  }
  return results;
}

// ─── Scan ───────────────────────────────────────────────────

// Context-injectable directories (files Claude might read during commands)
const contextDirs = [
  path.join(ROOT, 'agents'),
  path.join(ROOT, '.claude', 'commands'),
  path.join(ROOT, '.claude', 'skills'),
  path.join(ROOT, 'prompts'),
  path.join(ROOT, 'templates'),
];

// Also scan root-level .md files
const rootMdFiles = fs.readdirSync(ROOT)
  .filter(f => f.endsWith('.md'))
  .map(f => path.join(ROOT, f));

const allMdPaths = new Set<string>();

for (const dir of contextDirs) {
  for (const file of walkMdFiles(dir)) {
    allMdPaths.add(file);
  }
}
for (const file of rootMdFiles) {
  allMdPaths.add(file);
}

const entries: FileEntry[] = [];

for (const filePath of allMdPaths) {
  try {
    const stat = fs.statSync(filePath);
    const bytes = stat.size;
    const estimatedTokens = Math.ceil(bytes / BYTES_PER_TOKEN);
    entries.push({
      path: filePath,
      relativePath: path.relative(ROOT, filePath),
      bytes,
      estimatedTokens,
      isHeavy: bytes > HEAVY_FILE_THRESHOLD,
    });
  } catch {
    // Skip unreadable files
  }
}

// Sort by size, largest first
entries.sort((a, b) => b.bytes - a.bytes);

// ─── Analysis ───────────────────────────────────────────────

const totalBytes = entries.reduce((sum, e) => sum + e.bytes, 0);
const totalTokens = Math.ceil(totalBytes / BYTES_PER_TOKEN);
const heavyFiles = entries.filter(e => e.isHeavy);
const isOverloaded = totalBytes > TOTAL_OVERLOAD_THRESHOLD;

// Category breakdown
const categories = new Map<string, { count: number; bytes: number }>();
for (const entry of entries) {
  const parts = entry.relativePath.split(path.sep);
  const category = parts.length > 1 ? parts[0] : '(root)';
  const existing = categories.get(category) ?? { count: 0, bytes: 0 };
  existing.count++;
  existing.bytes += entry.bytes;
  categories.set(category, existing);
}

// ─── Report ─────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatTokens(tokens: number): string {
  if (tokens < 1000) return `${tokens}`;
  return `${(tokens / 1000).toFixed(1)}K`;
}

console.log('\n  ProductionOS Context Budget Report');
console.log('  ' + '='.repeat(60));

// Overall stats
const overloadIcon = isOverloaded ? '\u274c' : '\u2705';
console.log(`  ${overloadIcon} Total context: ${formatBytes(totalBytes)} (~${formatTokens(totalTokens)} tokens)`);
console.log(`     Files: ${entries.length} .md files across ${categories.size} categories`);
console.log(`     Threshold: ${formatBytes(TOTAL_OVERLOAD_THRESHOLD)} total, ${formatBytes(HEAVY_FILE_THRESHOLD)} per file`);

if (isOverloaded) {
  console.log(`     \u26a0\ufe0f  OVERLOAD RISK: Total context exceeds ${formatBytes(TOTAL_OVERLOAD_THRESHOLD)}`);
  console.log(`        Consider splitting large agents or using lazy loading`);
}

// Category breakdown
console.log('\n  Category Breakdown:');
const sortedCategories = [...categories.entries()].sort((a, b) => b[1].bytes - a[1].bytes);
for (const [category, data] of sortedCategories) {
  const pct = ((data.bytes / totalBytes) * 100).toFixed(0);
  console.log(`     ${category.padEnd(20)} ${data.count.toString().padStart(3)} files  ${formatBytes(data.bytes).padStart(8)}  (${pct}%)`);
}

// Heavy files
if (heavyFiles.length > 0) {
  console.log(`\n  \u26a0\ufe0f  Heavy Files (>${formatBytes(HEAVY_FILE_THRESHOLD)}):`);
  for (const entry of heavyFiles) {
    console.log(`     \u274c ${entry.relativePath.padEnd(45)} ${formatBytes(entry.bytes).padStart(8)}  (~${formatTokens(entry.estimatedTokens)} tokens)`);
  }
} else {
  console.log('\n  \u2705 No heavy files detected');
}

// All files by size
console.log('\n  All Files (by size):');
for (const entry of entries) {
  const heavyMarker = entry.isHeavy ? ' \u26a0\ufe0f' : '';
  console.log(`     ${entry.relativePath.padEnd(50)} ${formatBytes(entry.bytes).padStart(8)}${heavyMarker}`);
}

console.log('  ' + '-'.repeat(60));

// Exit summary
if (isOverloaded) {
  console.log(`  Status: OVERLOAD RISK — ${formatBytes(totalBytes)} exceeds ${formatBytes(TOTAL_OVERLOAD_THRESHOLD)} budget`);
} else if (heavyFiles.length > 0) {
  console.log(`  Status: WARNING — ${heavyFiles.length} heavy file(s) but total within budget`);
} else {
  console.log(`  Status: HEALTHY — all files within budget`);
}
console.log('');

// Exit with error if overloaded
process.exit(isOverloaded ? 1 : 0);
