import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { execSync } from "child_process";
import { join } from "path";
import { mkdirSync, rmSync, existsSync, readFileSync } from "fs";

const ROOT = join(import.meta.dir, "..");
const BIN = join(ROOT, "bin");
const TEST_STATE = join(import.meta.dir, "tmp-learnings-test");

beforeAll(() => {
  mkdirSync(TEST_STATE, { recursive: true });
});

afterAll(() => {
  rmSync(TEST_STATE, { recursive: true, force: true });
});

function run(cmd: string): string {
  return execSync(cmd, { cwd: ROOT, env: { ...process.env, PRODUCTIONOS_HOME: TEST_STATE } }).toString();
}

describe("Learnings System", () => {
  test("pos-learnings-log creates JSONL file", () => {
    run(`bash ${join(BIN, "pos-learnings-log")} '{"skill":"test","type":"pattern","key":"test-key","insight":"Test insight","confidence":7,"source":"observed"}'`);
    const slug = "ProductionOS";  // basename of git root
    const file = join(TEST_STATE, "learnings", slug, "learnings.jsonl");
    expect(existsSync(file)).toBe(true);
    const content = readFileSync(file, "utf-8");
    expect(content).toContain("test-key");
    expect(content).toContain("Test insight");
  });

  test("pos-learnings-search returns results", () => {
    const out = run(`bash ${join(BIN, "pos-learnings-search")}`);
    expect(out).toContain("test-key");
    expect(out).toContain("conf:");
  });

  test("pos-learnings-log validates required fields", () => {
    try {
      run(`bash ${join(BIN, "pos-learnings-log")} '{"skill":"test"}'`);
      expect(true).toBe(false); // should have thrown
    } catch (e: any) {
      expect(e.status).not.toBe(0);
    }
  });

  test("pos-timeline-log creates timeline file", () => {
    run(`bash ${join(BIN, "pos-timeline-log")} '{"skill":"test","event":"completed","branch":"main","outcome":"success"}'`);
    const slug = "ProductionOS";
    const file = join(TEST_STATE, "timeline", slug + ".jsonl");
    expect(existsSync(file)).toBe(true);
  });
});
