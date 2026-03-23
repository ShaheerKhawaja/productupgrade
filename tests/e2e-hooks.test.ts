import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { existsSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { ROOT } from "../scripts/lib/shared";

const HOOKS_DIR = join(ROOT, "hooks");
const BIN_DIR = join(ROOT, "bin");
const TEST_STATE = "/tmp/productionos-test-state";

function run(cmd: string): string {
  const { execSync } = require("child_process");
  return execSync(cmd, { encoding: "utf-8", timeout: 10000 });
}

describe("CLI Tool E2E", () => {
  beforeAll(() => {
    rmSync(TEST_STATE, { recursive: true, force: true });
  });

  afterAll(() => {
    rmSync(TEST_STATE, { recursive: true, force: true });
  });

  test("pos-init creates state directory", () => {
    const result = run(
      `PRODUCTIONOS_HOME=${TEST_STATE} bash ${join(BIN_DIR, "pos-init")}`
    );
    expect(result).toContain("ProductionOS state:");
    expect(existsSync(join(TEST_STATE, "config", "settings.json"))).toBe(true);
    expect(existsSync(join(TEST_STATE, "analytics"))).toBe(true);
    expect(existsSync(join(TEST_STATE, "sessions"))).toBe(true);
  });

  test("pos-config list shows settings", () => {
    const result = run(
      `PRODUCTIONOS_HOME=${TEST_STATE} bash ${join(BIN_DIR, "pos-config")} list`
    );
    expect(result).toContain("version");
    expect(result).toContain("proactive");
  });

  test("pos-config get retrieves a value", () => {
    const result = run(
      `PRODUCTIONOS_HOME=${TEST_STATE} bash ${join(BIN_DIR, "pos-config")} get version`
    ).trim();
    expect(result).toBe("1.0.0-beta.1");
  });

  test("pos-config set changes a value", () => {
    run(
      `PRODUCTIONOS_HOME=${TEST_STATE} bash ${join(BIN_DIR, "pos-config")} set telemetry community`
    );
    const result = run(
      `PRODUCTIONOS_HOME=${TEST_STATE} bash ${join(BIN_DIR, "pos-config")} get telemetry`
    ).trim();
    expect(result).toBe("community");
  });

  test("pos-analytics runs without error", () => {
    const result = run(
      `PRODUCTIONOS_HOME=${TEST_STATE} bash ${join(BIN_DIR, "pos-analytics")}`
    );
    expect(result).toContain("ProductionOS Analytics");
  });

  test("pos-update-check shows version", () => {
    const result = run(
      `PRODUCTIONOS_HOME=${TEST_STATE} bash ${join(BIN_DIR, "pos-update-check")}`
    );
    expect(result).toContain("ProductionOS v");
  });

  test("pos-telemetry logs an event", () => {
    run(
      `PRODUCTIONOS_HOME=${TEST_STATE} bash ${join(BIN_DIR, "pos-telemetry")} test-skill 5 success`
    );
    const log = readFileSync(
      join(TEST_STATE, "analytics", "skill-usage.jsonl"),
      "utf-8"
    );
    expect(log).toContain("test-skill");
  });

  test("pos-review-log appends review", () => {
    run(
      `PRODUCTIONOS_HOME=${TEST_STATE} bash ${join(BIN_DIR, "pos-review-log")} '{"skill":"test","status":"clean"}'`
    );
    const log = readFileSync(
      join(TEST_STATE, "analytics", "review-log.jsonl"),
      "utf-8"
    );
    expect(log).toContain("test");
  });
});

describe("Hook Script E2E", () => {
  test("session-start.sh produces banner", () => {
    const result = run(
      `PRODUCTIONOS_HOME=${TEST_STATE} bash ${join(HOOKS_DIR, "session-start.sh")}`
    );
    expect(result).toContain("ProductionOS");
    expect(result).toContain("Production House");
  });

  test("pre-edit-security.sh allows non-sensitive files", () => {
    const result = run(
      `echo '{"tool_input":{"file_path":"/tmp/test.txt"}}' | PRODUCTIONOS_HOME=${TEST_STATE} bash ${join(HOOKS_DIR, "pre-edit-security.sh")}`
    );
    expect(result.trim()).toBe("{}");
  });

  test("pre-edit-security.sh flags sensitive files", () => {
    const result = run(
      `echo '{"tool_input":{"file_path":"/app/auth-handler.ts"}}' | PRODUCTIONOS_HOME=${TEST_STATE} bash ${join(HOOKS_DIR, "pre-edit-security.sh")}`
    );
    expect(result).toContain("security-sensitive");
  });

  test("post-edit-telemetry.sh logs edits", () => {
    run(
      `echo '{"tool_input":{"file_path":"/app/test.ts"}}' | PRODUCTIONOS_HOME=${TEST_STATE} bash ${join(HOOKS_DIR, "post-edit-telemetry.sh")}`
    );
    const log = readFileSync(
      join(TEST_STATE, "analytics", "skill-usage.jsonl"),
      "utf-8"
    );
    expect(log).toContain("test.ts");
  });

  test("stop-session-handoff.sh logs session end", () => {
    run(
      `PRODUCTIONOS_HOME=${TEST_STATE} bash ${join(HOOKS_DIR, "stop-session-handoff.sh")}`
    );
    const log = readFileSync(
      join(TEST_STATE, "analytics", "skill-usage.jsonl"),
      "utf-8"
    );
    expect(log).toContain("session_end");
  });
});
