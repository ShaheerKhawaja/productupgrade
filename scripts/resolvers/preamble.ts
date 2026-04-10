import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { ResolverContext } from "./index";

export function resolvePreamble(_arg: string, ctx: ResolverContext): string {
  const preamblePath = join(ctx.pluginRoot, "templates", "PREAMBLE.md");
  if (!existsSync(preamblePath)) {
    return "<!-- PREAMBLE not found -->";
  }
  const content = readFileSync(preamblePath, "utf-8");
  // Extract the environment check section (before Postamble)
  const preIdx = content.indexOf("## Postamble");
  return preIdx > 0 ? content.slice(0, preIdx).trim() : content.trim();
}
