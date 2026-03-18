import { describe, test, expect } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dir, '..');

// ─── Helpers ────────────────────────────────────────────────

function readFileOrNull(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function listMdFiles(dir: string): string[] {
  try {
    return fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  } catch {
    return [];
  }
}

function parseFrontmatter(content: string): Record<string, unknown> | null {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;

  const frontmatter: Record<string, unknown> = {};
  const lines = fmMatch[1].split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    if (line.startsWith(' ') || line.startsWith('\t')) continue;

    const key = line.slice(0, colonIdx).trim();
    const inlineValue = line.slice(colonIdx + 1).trim();

    if (inlineValue === '' || inlineValue === '|' || inlineValue === '>') {
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
      frontmatter[key] = items.length > 0 ? items : '';
    } else {
      frontmatter[key] = inlineValue.replace(/^["']|["']$/g, '');
    }
  }

  return frontmatter;
}

function walkFiles(dir: string, ext: string): string[] {
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        results.push(...walkFiles(fullPath, ext));
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist
  }
  return results;
}

function walkMdFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist') {
        results.push(...walkMdFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(fullPath);
      }
    }
  } catch {
    // skip
  }
  return results;
}

// ─── Tests ──────────────────────────────────────────────────

describe('VERSION file', () => {
  test('exists and is valid semver', () => {
    const content = readFileOrNull(path.join(ROOT, 'VERSION'));
    expect(content).not.toBeNull();
    const version = content!.trim();
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('plugin.json', () => {
  test('is valid JSON', () => {
    const content = readFileOrNull(path.join(ROOT, '.claude-plugin', 'plugin.json'));
    expect(content).not.toBeNull();
    expect(() => JSON.parse(content!)).not.toThrow();
  });

  test('version matches VERSION file', () => {
    const versionContent = readFileOrNull(path.join(ROOT, 'VERSION'));
    const pluginContent = readFileOrNull(path.join(ROOT, '.claude-plugin', 'plugin.json'));
    expect(versionContent).not.toBeNull();
    expect(pluginContent).not.toBeNull();

    const version = versionContent!.trim();
    const plugin = JSON.parse(pluginContent!);
    expect(plugin.version).toBe(version);
  });

  test('has required fields', () => {
    const content = readFileOrNull(path.join(ROOT, '.claude-plugin', 'plugin.json'));
    expect(content).not.toBeNull();
    const plugin = JSON.parse(content!);
    expect(plugin.name).toBeDefined();
    expect(typeof plugin.name).toBe('string');
    expect(plugin.description).toBeDefined();
    expect(typeof plugin.description).toBe('string');
    expect(plugin.version).toBeDefined();
  });
});

describe('Agent frontmatter validation', () => {
  const agentsDir = path.join(ROOT, 'agents');
  const agentFiles = listMdFiles(agentsDir);

  test('agents directory has files', () => {
    expect(agentFiles.length).toBeGreaterThan(0);
  });

  test('all agent files have YAML frontmatter', () => {
    const missing: string[] = [];
    for (const file of agentFiles) {
      const content = readFileOrNull(path.join(agentsDir, file));
      if (!content) {
        missing.push(`${file}: unreadable`);
        continue;
      }
      const fm = parseFrontmatter(content);
      if (!fm) {
        missing.push(`${file}: no frontmatter`);
      }
    }
    expect(missing).toEqual([]);
  });

  test('all agent files have required frontmatter fields (name, description, tools)', () => {
    const violations: string[] = [];
    for (const file of agentFiles) {
      const content = readFileOrNull(path.join(agentsDir, file));
      if (!content) continue;
      const fm = parseFrontmatter(content);
      if (!fm) continue;

      const missingFields: string[] = [];
      if (!fm.name) missingFields.push('name');
      if (!fm.description) missingFields.push('description');
      if (!fm.tools) missingFields.push('tools');
      if (missingFields.length > 0) {
        violations.push(`${file}: missing ${missingFields.join(', ')}`);
      }
    }
    expect(violations).toEqual([]);
  });

  test('all agent files have <role> and <instructions> XML tags', () => {
    const violations: string[] = [];
    for (const file of agentFiles) {
      const content = readFileOrNull(path.join(agentsDir, file));
      if (!content) continue;

      const missingTags: string[] = [];
      if (!content.includes('<role>') || !content.includes('</role>')) {
        missingTags.push('<role>');
      }
      if (!content.includes('<instructions>') || !content.includes('</instructions>')) {
        missingTags.push('<instructions>');
      }
      if (missingTags.length > 0) {
        violations.push(`${file}: missing ${missingTags.join(', ')}`);
      }
    }
    expect(violations).toEqual([]);
  });
});

describe('Command frontmatter validation', () => {
  const commandsDir = path.join(ROOT, '.claude', 'commands');
  const commandFiles = listMdFiles(commandsDir);

  test('commands directory has files', () => {
    expect(commandFiles.length).toBeGreaterThan(0);
  });

  test('all command files are non-empty and well-structured', () => {
    const violations: string[] = [];
    for (const file of commandFiles) {
      const content = readFileOrNull(path.join(commandsDir, file));
      if (!content) {
        violations.push(`${file}: unreadable`);
        continue;
      }
      if (content.trim().length === 0) {
        violations.push(`${file}: empty file`);
      }
    }
    expect(violations).toEqual([]);
  });
});

describe('No stale references', () => {
  test('no .productupgrade/ references in agents or commands', () => {
    const filesToCheck = [
      ...walkFiles(path.join(ROOT, 'agents'), '.md'),
      ...walkFiles(path.join(ROOT, '.claude', 'commands'), '.md'),
      ...walkFiles(path.join(ROOT, 'prompts'), '.md'),
    ];
    const violations: string[] = [];

    for (const file of filesToCheck) {
      const content = readFileOrNull(file);
      if (!content) continue;
      if (content.includes('.productupgrade/')) {
        violations.push(path.relative(ROOT, file));
      }
    }

    expect(violations).toEqual([]);
  });

  test('no /ultra-upgrade references (old command name)', () => {
    const filesToCheck = [
      ...walkFiles(path.join(ROOT, 'agents'), '.md'),
      ...walkFiles(path.join(ROOT, '.claude', 'commands'), '.md'),
      ...walkFiles(path.join(ROOT, 'prompts'), '.md'),
    ];
    const violations: string[] = [];

    for (const file of filesToCheck) {
      const content = readFileOrNull(file);
      if (!content) continue;
      if (content.includes('/ultra-upgrade')) {
        violations.push(path.relative(ROOT, file));
      }
    }

    expect(violations).toEqual([]);
  });
});

describe('Context budget', () => {
  test('total context is under 200KB threshold', () => {
    const contextDirs = [
      path.join(ROOT, 'agents'),
      path.join(ROOT, '.claude', 'commands'),
      path.join(ROOT, '.claude', 'skills'),
      path.join(ROOT, 'prompts'),
      path.join(ROOT, 'templates'),
    ];

    let totalBytes = 0;

    // Root-level .md files
    const rootMds = fs.readdirSync(ROOT).filter(f => f.endsWith('.md'));
    for (const file of rootMds) {
      try {
        totalBytes += fs.statSync(path.join(ROOT, file)).size;
      } catch {
        // skip
      }
    }

    // Context directories
    for (const dir of contextDirs) {
      const mdFiles = walkMdFiles(dir);
      for (const file of mdFiles) {
        try {
          totalBytes += fs.statSync(file).size;
        } catch {
          // skip
        }
      }
    }

    // 200KB — generous threshold for 32 agents + 10 commands
    const threshold = 200 * 1024;
    expect(totalBytes).toBeLessThan(threshold);
  });

  test('no single file exceeds 25KB', () => {
    const contextDirs = [
      path.join(ROOT, 'agents'),
      path.join(ROOT, '.claude', 'commands'),
      path.join(ROOT, 'prompts'),
      path.join(ROOT, 'templates'),
    ];

    const oversized: string[] = [];
    const maxSize = 25 * 1024;

    for (const dir of contextDirs) {
      const mdFiles = walkMdFiles(dir);
      for (const file of mdFiles) {
        try {
          const stat = fs.statSync(file);
          if (stat.size > maxSize) {
            oversized.push(`${path.relative(ROOT, file)} (${(stat.size / 1024).toFixed(1)}KB)`);
          }
        } catch {
          // skip
        }
      }
    }

    expect(oversized).toEqual([]);
  });
});

describe('hooks.json validation', () => {
  test('hooks.json exists and is valid JSON', () => {
    const content = readFileOrNull(path.join(ROOT, 'hooks', 'hooks.json'));
    expect(content).not.toBeNull();
    expect(() => JSON.parse(content!)).not.toThrow();
  });

  test('hooks.json has at least one hook type defined', () => {
    const content = readFileOrNull(path.join(ROOT, 'hooks', 'hooks.json'));
    expect(content).not.toBeNull();
    const hooks = JSON.parse(content!);
    const hookTypes = Object.keys(hooks);
    expect(hookTypes.length).toBeGreaterThan(0);
  });
});

describe('marketplace.json validation', () => {
  test('marketplace.json exists and is valid JSON', () => {
    const content = readFileOrNull(path.join(ROOT, '.claude-plugin', 'marketplace.json'));
    expect(content).not.toBeNull();
    expect(() => JSON.parse(content!)).not.toThrow();
  });
});

describe('CLAUDE.md consistency', () => {
  test('all commands listed in CLAUDE.md have corresponding files', () => {
    const claudeContent = readFileOrNull(path.join(ROOT, 'CLAUDE.md'));
    expect(claudeContent).not.toBeNull();

    const commandPattern = /^\s*\/([a-z][a-z0-9-]+)/gm;
    const claudeCommands: string[] = [];
    let cmdMatch;
    while ((cmdMatch = commandPattern.exec(claudeContent!)) !== null) {
      const cmd = cmdMatch[1];
      if (!claudeCommands.includes(cmd)) {
        claudeCommands.push(cmd);
      }
    }

    const commandsDir = path.join(ROOT, '.claude', 'commands');
    const commandFiles = listMdFiles(commandsDir).map(f => f.replace('.md', ''));

    const missingFiles = claudeCommands.filter(cmd => !commandFiles.includes(cmd));
    expect(missingFiles).toEqual([]);
  });
});

describe('No hardcoded user paths', () => {
  test('no /Users/<username>/ paths in source files', () => {
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
      if (hardcodedPathPattern.test(content)) {
        violations.push(path.relative(ROOT, file));
      }
      // Reset lastIndex since we reuse the regex with global flag
      hardcodedPathPattern.lastIndex = 0;
    }

    expect(violations).toEqual([]);
  });
});
