#!/usr/bin/env bun
// gen-skill-templates.ts — Generate SKILL.md from .tmpl templates
// Usage: bun run scripts/gen-skill-templates.ts [--dry-run]

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { resolveTemplate, type ResolverContext } from "./resolvers/index";

const ROOT = join(import.meta.dir, "..");
const SKILLS_DIR = join(ROOT, "skills");
const DRY_RUN = process.argv.includes("--dry-run");

let pass = 0;
let fail = 0;
let warn = 0;
const failures: string[] = [];

// Find all .tmpl files
const skillDirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

for (const skill of skillDirs) {
  const tmplPath = join(SKILLS_DIR, skill, "SKILL.md.tmpl");
  const outputPath = join(SKILLS_DIR, skill, "SKILL.md");

  if (!existsSync(tmplPath)) continue; // No template, skip

  const ctx: ResolverContext = { pluginRoot: ROOT, skillName: skill };
  const template = readFileSync(tmplPath, "utf-8");
  const generated = resolveTemplate(template, ctx);

  if (DRY_RUN) {
    // Compare with existing SKILL.md
    if (existsSync(outputPath)) {
      const existing = readFileSync(outputPath, "utf-8");
      if (existing === generated) {
        pass++;
      } else {
        fail++;
        failures.push(skill);
      }
    } else {
      fail++;
      failures.push(`${skill} (no SKILL.md)`);
    }
  } else {
    writeFileSync(outputPath, generated);
    pass++;
  }
}

// Report
console.log(`  gen-skill-templates: ${pass} pass, ${fail} fail, ${warn} warn`);
if (failures.length > 0) {
  console.log(`  Out of sync: ${failures.join(", ")}`);
}

process.exit(fail > 0 ? 1 : 0);
