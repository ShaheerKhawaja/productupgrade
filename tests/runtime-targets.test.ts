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
      expect(skill.content).toContain("## Guardrails");
      // Upgraded skills replace "Agents And Assets" with richer sections (e.g. Step, Phase, Domain headings)
      expect(
        skill.content.includes("## Agents And Assets") ||
        skill.content.includes("Source references:") ||
        skill.content.includes("## Step ") ||
        skill.content.includes("## Phase ") ||
        skill.content.includes("## Domain "),
      ).toBe(true);
      expect(
        skill.content.includes("## Execution Outline") ||
        skill.content.includes("## Codex Workflow") ||
        skill.content.includes("## Step 1:") ||
        skill.content.includes("## Phase A:") ||
        skill.content.includes("## Domain 1:"),
      ).toBe(true);
    }
  });

  test("every Claude command has a generated top-level Codex alias skill", () => {
    const commandNames = listMdFiles(join(ROOT, ".claude", "commands"))
      .map((file) => file.replace(/\.md$/, ""))
      .sort();
    const generatedAliasNames = getGeneratedTargetFiles()
      .filter((file) => file.path.startsWith("codex-skills/") && file.path.endsWith("/SKILL.md"))
      .map((file) => file.path.replace(/^codex-skills\//, "").replace(/\/SKILL\.md$/, ""))
      .sort();

    expect(generatedAliasNames).toEqual(commandNames.map((name) => `productionos-${name}`).sort());
  });

  test("core workflows use hand-authored Codex overrides", () => {
    const coreSkills = [
      "review",
      "plan-eng-review",
      "plan-ceo-review",
      "production-upgrade",
      "security-audit",
      "qa",
      "ship",
      "deep-research",
      "debug",
      "auto-swarm",
      "omni-plan",
      "designer-upgrade",
      "ux-genie",
      "document-release",
      "productionos-update",
    ];

    for (const skillName of coreSkills) {
      const skill = getGeneratedTargetFiles().find((file) => file.path === `skills/${skillName}/SKILL.md`);
      expect(skill).toBeDefined();
      // Upgraded overrides may replace "## Overview" with inline content and
      // "## Codex Workflow" with specific step/phase headings
      expect(
        skill!.content.includes("## Overview") ||
        skill!.content.includes("## Inputs"),
      ).toBe(true);
      expect(
        skill!.content.includes("## Codex Workflow") ||
        skill!.content.includes("## Step ") ||
        skill!.content.includes("## Phase ") ||
        skill!.content.includes("## Domain "),
      ).toBe(true);
      expect(skill!.content).toContain("## Guardrails");
      expect(skill!.content).not.toContain("This is the Codex-native workflow wrapper");
    }
  });
});
