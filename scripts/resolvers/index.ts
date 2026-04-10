// Resolver registry — maps {{PLACEHOLDER}} tags to resolver functions
import { resolvePreamble } from "./preamble";
import { resolveInvokeSkill } from "./invoke-skill";

export interface ResolverContext {
  pluginRoot: string;
  skillName: string;
}

export type Resolver = (tag: string, ctx: ResolverContext) => string;

const resolvers: Record<string, Resolver> = {
  PREAMBLE: resolvePreamble,
  INVOKE_SKILL: resolveInvokeSkill,
};

export function resolveTemplate(template: string, ctx: ResolverContext): string {
  // Replace {{TAG}} and {{TAG:arg}} patterns
  return template.replace(/\{\{(\w+)(?::([^}]+))?\}\}/g, (match, tag, arg) => {
    const resolver = resolvers[tag];
    if (!resolver) return match; // Leave unresolved tags as-is
    return resolver(arg || "", ctx);
  });
}
