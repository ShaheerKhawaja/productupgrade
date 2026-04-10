import { describe, expect, test } from "bun:test";
import { existsSync } from "fs";
import { join } from "path";
import { ROOT, listMdFiles, readFileOrNull } from "../scripts/lib/shared";
import { getGeneratedTargetFiles, WORKFLOW_PARITY } from "../scripts/lib/runtime-targets";

/**
 * Skills with hand-crafted dense runbooks. These are NOT auto-generated but
 * their SKILL.md files exist on disk as manually authored content.
 */
const HAND_CRAFTED_SKILLS = new Set([
  "omni-plan-nth",
  "designer-upgrade",
  "auto-mode",
  "logic-mode",
  "agentic-eval",
  "omni-plan",
  "auto-swarm-nth",
  "frontend-upgrade",
  "context-engineer",
  "max-research",
]);

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

  test("every Claude command has a generated or hand-crafted Codex skill wrapper", () => {
    const commandNames = listMdFiles(join(ROOT, ".claude", "commands"))
      .map((file) => file.replace(/\.md$/, ""))
      .sort();
    const generatedSkillNames = getGeneratedTargetFiles()
      .filter((file) => file.path.startsWith("skills/") && file.path.endsWith("/SKILL.md"))
      .map((file) => file.path.replace(/^skills\//, "").replace(/\/SKILL\.md$/, ""))
      .filter((name) => name !== "productionos" && name !== "interface-craft")
      .sort();

    // Hand-crafted skills exist on disk but are not in auto-generated targets
    const allSkillNames = [...new Set([...generatedSkillNames, ...HAND_CRAFTED_SKILLS])].sort();

    expect(allSkillNames).toEqual(commandNames);

    // Verify hand-crafted skills actually exist on disk
    for (const skill of HAND_CRAFTED_SKILLS) {
      expect(existsSync(join(ROOT, "skills", skill, "SKILL.md"))).toBe(true);
    }
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

  test("every Claude command has a generated top-level Codex alias skill or is hand-crafted", () => {
    const commandNames = listMdFiles(join(ROOT, ".claude", "commands"))
      .map((file) => file.replace(/\.md$/, ""))
      .sort();
    const generatedAliasNames = getGeneratedTargetFiles()
      .filter((file) => file.path.startsWith("codex-skills/") && file.path.endsWith("/SKILL.md"))
      .map((file) => file.path.replace(/^codex-skills\//, "").replace(/\/SKILL\.md$/, ""))
      .sort();

    // Hand-crafted skills do not need codex-alias wrappers since they are self-contained
    const expectedAliases = commandNames
      .filter((name) => !HAND_CRAFTED_SKILLS.has(name))
      .map((name) => `productionos-${name}`)
      .sort();

    expect(generatedAliasNames).toEqual(expectedAliases);
  });

  test("core workflows use hand-authored Codex overrides or dense runbooks", () => {
    // Skills still in auto-generated targets (with codex-overrides or special rendering)
    const autoGenCoreSkills = [
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
      "ux-genie",
      "document-release",
      "productionos-update",
    ];

    for (const skillName of autoGenCoreSkills) {
      const skill = getGeneratedTargetFiles().find((file) => file.path === `skills/${skillName}/SKILL.md`);
      expect(skill).toBeDefined();
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

    // Hand-crafted dense runbooks exist on disk, not in auto-generated targets
    const handCraftedCoreSkills = ["omni-plan", "designer-upgrade"];
    for (const skillName of handCraftedCoreSkills) {
      expect(HAND_CRAFTED_SKILLS.has(skillName)).toBe(true);
      const content = readFileOrNull(join(ROOT, "skills", skillName, "SKILL.md"));
      expect(content).not.toBeNull();
      expect(content!).toContain("## Inputs");
      expect(content!).toContain("## Guardrails");
    }
  });
});
