import { describe, expect, test } from "bun:test";
import { join } from "path";
import { ROOT, listMdFiles, readFileOrNull } from "../scripts/lib/shared";
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

  test("every Claude command has a generated Codex skill wrapper", () => {
    const commandNames = listMdFiles(join(ROOT, ".claude", "commands"))
      .map((file) => file.replace(/\.md$/, ""))
      .sort();
    const generatedSkillNames = getGeneratedTargetFiles()
      .filter((file) => file.path.startsWith("skills/") && file.path.endsWith("/SKILL.md"))
      .map((file) => file.path.replace(/^skills\//, "").replace(/\/SKILL\.md$/, ""))
      .filter((name) => name !== "productionos" && name !== "interface-craft")
      .sort();

    expect(generatedSkillNames).toEqual(commandNames);
  });

  test("generated command skill wrappers contain Codex-specific workflow sections", () => {
    const generatedCommandSkills = getGeneratedTargetFiles()
      .filter((file) => file.path.startsWith("skills/") && file.path.endsWith("/SKILL.md"))
      .filter((file) => !file.path.endsWith("skills/productionos/SKILL.md"));

    for (const skill of generatedCommandSkills) {
      expect(skill.content).toContain("## Inputs");
      expect(skill.content).toContain("## Execution Outline");
      expect(skill.content).toContain("## Agents And Assets");
      expect(skill.content).toContain("## Guardrails");
    }
  });
});
