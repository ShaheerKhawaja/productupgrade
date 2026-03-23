import { describe, test, expect } from "bun:test";
import { detectStack } from "../scripts/stack-detector";

const ROOT = new URL("../", import.meta.url).pathname.replace(/\/$/, "");

describe("stack-detector", () => {
  const result = detectStack(ROOT);

  test("detects node stack for ProductionOS", () => {
    expect(result.type).toBe("node");
  });

  test("detects bun test runner", () => {
    expect(result.testRunner).toBe("bun test");
  });

  test("has all required fields", () => {
    expect(typeof result.type).toBe("string");
    expect(typeof result.monorepo).toBe("boolean");
    expect(Array.isArray(result.tools)).toBe(true);
    // These can be null
    expect(result.framework === null || typeof result.framework === "string").toBe(true);
    expect(result.testRunner === null || typeof result.testRunner === "string").toBe(true);
    expect(result.linter === null || typeof result.linter === "string").toBe(true);
    expect(result.packageManager === null || typeof result.packageManager === "string").toBe(true);
  });

  test("core tools always present", () => {
    const coreTools = ["Read", "Write", "Edit", "Bash", "Grep", "Glob"];
    for (const tool of coreTools) {
      expect(result.tools).toContain(tool);
    }
  });

  test("type is a valid stack type", () => {
    const validTypes = ["node", "python", "go", "rust", "ruby", "java", "unknown"];
    expect(validTypes).toContain(result.type);
  });

  test("returns unknown for nonexistent directory", () => {
    const unknown = detectStack("/tmp/nonexistent-project-dir-12345");
    expect(unknown.type).toBe("unknown");
  });

  test("unknown stack still has core tools", () => {
    const unknown = detectStack("/tmp/nonexistent-project-dir-12345");
    expect(unknown.tools).toContain("Read");
    expect(unknown.tools).toContain("Bash");
  });
});
