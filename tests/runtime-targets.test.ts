import { describe, expect, test } from "bun:test";
import { join } from "path";
import { ROOT, readFileOrNull } from "../scripts/lib/shared";
import { getGeneratedTargetFiles, WORKFLOW_PARITY } from "../scripts/lib/runtime-targets";

describe("runtime target generation", () => {
  test("generated target files match committed files", () => {
    const mismatches = getGeneratedTargetFiles()
      .filter((file) => readFileOrNull(join(ROOT, file.path)) !== file.content)
      .map((file) => file.path);

    expect(mismatches).toEqual([]);
  });

  test("registry covers the required parity workflows", () => {
    const required = [
      "production-upgrade",
      "review",
      "plan-ceo-review",
      "plan-eng-review",
      "security-audit",
      "designer-upgrade",
      "ux-genie",
      "auto-swarm",
      "auto-swarm-nth",
      "omni-plan",
      "omni-plan-nth",
    ];

    const actual = WORKFLOW_PARITY.map((workflow) => workflow.id).sort();
    expect(actual).toEqual(required.sort());
  });

  test("every workflow supports Claude plugin, Codex CLI, and Codex app targets", () => {
    for (const workflow of WORKFLOW_PARITY) {
      expect(workflow.targets).toContain("claude-plugin");
      expect(workflow.targets).toContain("codex-cli");
      expect(workflow.targets).toContain("codex-app");
    }
  });
});
