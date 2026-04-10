import { describe, test, expect } from "bun:test";
import { execSync } from "child_process";
import { join } from "path";

const ROOT = join(import.meta.dir, "..");
const ROUTER = join(ROOT, "scripts", "skill-router.ts");

function route(goal: string): any {
  const out = execSync(`bun run "${ROUTER}" "${goal}"`, { cwd: ROOT }).toString();
  return JSON.parse(out);
}

describe("Skill Router", () => {
  test("routes 'audit security' to audit-and-fix chain", () => {
    const r = route("audit the security and fix issues");
    expect(r.chain.length).toBeGreaterThanOrEqual(2);
    expect(r.chain[0].skill).toBe("security-audit");
    expect(r.confidence).toBeGreaterThan(0.5);
  });

  test("routes 'ship to production' to ship-safe chain", () => {
    const r = route("ship this to production");
    expect(r.chain.some((s: any) => s.skill === "ship")).toBe(true);
    expect(r.confidence).toBeGreaterThan(0.5);
  });

  test("routes 'marketing audit' to growth-audit chain", () => {
    const r = route("run a full marketing SEO audit");
    expect(r.chain.some((s: any) => s.skill.includes("seo") || s.skill.includes("content"))).toBe(true);
    expect(r.confidence).toBeGreaterThan(0.5);
  });

  test("routes 'research authentication' to research-and-plan chain", () => {
    const r = route("research how to add authentication");
    expect(r.chain.some((s: any) => s.skill === "deep-research")).toBe(true);
    expect(r.confidence).toBeGreaterThan(0.5);
  });

  test("fallback for unknown intent has low confidence", () => {
    const r = route("xyzzy plugh");
    expect(r.confidence).toBeLessThanOrEqual(0.5);
  });
});
