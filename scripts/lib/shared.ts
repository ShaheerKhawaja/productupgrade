/**
 * Shared utilities for ProductionOS TypeScript scripts.
 * Extracted to eliminate 4x duplication of parseFrontmatter, readFileOrNull, walkFiles.
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

/** Root directory of the ProductionOS plugin */
export const ROOT = new URL("../../", import.meta.url).pathname.replace(/\/$/, "");

/** Approximate bytes-per-token ratio for LLM token estimation */
export const BYTES_PER_TOKEN = 4;

/** Read a file, returning null if it doesn't exist */
export function readFileOrNull(filePath: string): string | null {
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

/** Parse YAML-ish frontmatter from a markdown file (between --- delimiters) */
export function parseFrontmatter(content: string): Record<string, unknown> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const fm: Record<string, unknown> = {};
  const lines = match[1].split("\n");

  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let value: unknown = line.slice(colonIdx + 1).trim();

    // Strip quotes
    if (typeof value === "string" && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }

    // Handle arrays (tools list)
    if (key === "tools" || key === "arguments") {
      const items: string[] = [];
      const startIdx = lines.indexOf(line);
      for (let i = startIdx + 1; i < lines.length; i++) {
        const item = lines[i].trim();
        if (item.startsWith("- ")) {
          items.push(item.slice(2).trim());
        } else if (item.startsWith("-")) {
          // Handle compact YAML list with nested keys
          break;
        } else {
          break;
        }
      }
      if (items.length > 0) {
        fm[key] = items;
      }
      continue;
    }

    fm[key] = value;
  }

  return Object.keys(fm).length > 0 ? fm : null;
}

/** Recursively walk a directory and return files matching an extension */
export function walkFiles(dir: string, ext: string = ".md"): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          results.push(...walkFiles(fullPath, ext));
        } else if (extname(entry) === ext) {
          results.push(fullPath);
        }
      } catch {
        // Skip unreadable entries
      }
    }
  } catch {
    // Dir doesn't exist
  }
  return results;
}

/** List .md files in a directory (non-recursive, names only) */
export function listMdFiles(dir: string): string[] {
  try {
    return readdirSync(dir).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
}

/** Read VERSION file and return trimmed version string */
export function readVersion(): string | null {
  const content = readFileOrNull(join(ROOT, "VERSION"));
  return content ? content.trim() : null;
}

/** Check if a string is valid semver (major.minor.patch) */
export function isValidSemver(version: string): boolean {
  return /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(version);
}

/**
 * Get all version sources and their values.
 * Used for version drift detection across all files that declare a version.
 */
export function getAllVersionSources(): { source: string; version: string | null }[] {
  const sources: { source: string; version: string | null }[] = [];

  // VERSION file
  sources.push({ source: "VERSION", version: readVersion() });

  // plugin.json
  const pluginJson = readFileOrNull(join(ROOT, ".claude-plugin", "plugin.json"));
  if (pluginJson) {
    try {
      const parsed = JSON.parse(pluginJson);
      sources.push({ source: "plugin.json", version: parsed.version || null });
    } catch {
      sources.push({ source: "plugin.json", version: null });
    }
  }

  // marketplace.json
  const marketplaceJson = readFileOrNull(join(ROOT, ".claude-plugin", "marketplace.json"));
  if (marketplaceJson) {
    try {
      const parsed = JSON.parse(marketplaceJson);
      const pluginEntry = parsed.plugins?.[0];
      sources.push({ source: "marketplace.json", version: pluginEntry?.version || null });
    } catch {
      sources.push({ source: "marketplace.json", version: null });
    }
  }

  // package.json
  const packageJson = readFileOrNull(join(ROOT, "package.json"));
  if (packageJson) {
    try {
      const parsed = JSON.parse(packageJson);
      sources.push({ source: "package.json", version: parsed.version || null });
    } catch {
      sources.push({ source: "package.json", version: null });
    }
  }

  // SKILL.md frontmatter (extract version from description if present)
  const skillMd = readFileOrNull(join(ROOT, ".claude", "skills", "productionos", "SKILL.md"));
  if (skillMd) {
    const fm = parseFrontmatter(skillMd);
    if (fm?.description) {
      const vMatch = String(fm.description).match(/(\d+\.\d+)/);
      sources.push({ source: "SKILL.md", version: vMatch ? vMatch[1] : null });
    }
  }

  return sources;
}
