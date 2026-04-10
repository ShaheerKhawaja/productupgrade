import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { ResolverContext } from "./index";

export function resolveInvokeSkill(skillName: string, ctx: ResolverContext): string {
  if (!skillName) return "<!-- INVOKE_SKILL: no skill name provided -->";

  const skillPath = join(ctx.pluginRoot, "skills", skillName, "SKILL.md");
  if (!existsSync(skillPath)) {
    return `<!-- INVOKE_SKILL: ${skillName} not found -->`;
  }

  const content = readFileSync(skillPath, "utf-8");
  // Strip frontmatter (between --- markers)
  const fmEnd = content.indexOf("---", 4);
  const body = fmEnd > 0 ? content.slice(fmEnd + 3).trim() : content;

  return `\n## Invoked: ${skillName}\n\n${body}\n`;
}
