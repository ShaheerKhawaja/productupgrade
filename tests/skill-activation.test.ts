import { describe, test, expect } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { ROOT } from "../scripts/lib/shared";

const SKILLS_DIR = join(ROOT, ".claude", "skills");

// Helper to extract filePattern from SKILL.md frontmatter
function extractPatterns(skillPath: string): {
  filePatterns: string[];
  bashPatterns: string[];
  priority: number;
} {
  const content = readFileSync(skillPath, "utf-8");
  const filePatterns: string[] = [];
  const bashPatterns: string[] = [];
  let priority = 0;

  // Extract filePattern array
  const fpMatch = content.match(/filePattern:\s*\n((?:\s+-\s+"[^"]+"\n?)+)/);
  if (fpMatch) {
    const lines = fpMatch[1].match(/"([^"]+)"/g);
    if (lines) filePatterns.push(...lines.map((l) => l.replace(/"/g, "")));
  }

  // Extract bashPattern array
  const bpMatch = content.match(/bashPattern:\s*\n((?:\s+-\s+"[^"]+"\n?)+)/);
  if (bpMatch) {
    const lines = bpMatch[1].match(/"([^"]+)"/g);
    if (lines) bashPatterns.push(...lines.map((l) => l.replace(/"/g, "")));
  }

  // Extract priority
  const prMatch = content.match(/priority:\s*(\d+)/);
  if (prMatch) priority = parseInt(prMatch[1], 10);

  return { filePatterns, bashPatterns, priority };
}

describe("Skill Auto-Activation Patterns", () => {
  const skills = ["productionos", "security-scan", "frontend-audit", "continuous-learning"];

  for (const skill of skills) {
    const skillPath = join(SKILLS_DIR, skill, "SKILL.md");
    if (!existsSync(skillPath)) continue;

    const { filePatterns, priority } = extractPatterns(skillPath);

    test(`${skill}: has file patterns`, () => {
      expect(filePatterns.length).toBeGreaterThan(0);
    });

    test(`${skill}: has priority > 0`, () => {
      expect(priority).toBeGreaterThan(0);
    });

    test(`${skill}: file patterns use glob syntax`, () => {
      for (const pattern of filePatterns) {
        // Patterns should contain ** or * for glob matching
        expect(pattern).toMatch(/\*|\?/);
      }
    });
  }

  test("security-scan has highest priority among skills", () => {
    const secPath = join(SKILLS_DIR, "security-scan", "SKILL.md");
    const posPath = join(SKILLS_DIR, "productionos", "SKILL.md");
    if (!existsSync(secPath) || !existsSync(posPath)) return;

    const sec = extractPatterns(secPath);
    const pos = extractPatterns(posPath);
    expect(sec.priority).toBeGreaterThan(pos.priority);
  });

  test("security-scan patterns cover auth and payment", () => {
    const secPath = join(SKILLS_DIR, "security-scan", "SKILL.md");
    if (!existsSync(secPath)) return;

    const { filePatterns } = extractPatterns(secPath);
    const combined = filePatterns.join(" ");
    expect(combined).toContain("auth");
    expect(combined).toContain("payment");
  });

  test("frontend-audit patterns cover component files", () => {
    const fePath = join(SKILLS_DIR, "frontend-audit", "SKILL.md");
    if (!existsSync(fePath)) return;

    const { filePatterns } = extractPatterns(fePath);
    const combined = filePatterns.join(" ");
    expect(combined).toContain("tsx");
    expect(combined).toContain("components");
  });
});

describe("Skill HARD-GATE Enforcement", () => {
  test("security-scan skill has HARD-GATE block", () => {
    const path = join(SKILLS_DIR, "security-scan", "SKILL.md");
    if (!existsSync(path)) return;
    const content = readFileSync(path, "utf-8");
    expect(content).toContain("HARD-GATE");
  });

  test("skills with HARD-GATE have checklist items", () => {
    for (const skill of ["security-scan"]) {
      const path = join(SKILLS_DIR, skill, "SKILL.md");
      if (!existsSync(path)) continue;
      const content = readFileSync(path, "utf-8");
      if (content.includes("HARD-GATE")) {
        // Should have numbered checklist items
        expect(content).toMatch(/\d+\.\s+\*\*/);
      }
    }
  });
});
