import { existsSync } from "fs";
import { delimiter, dirname, join } from "path";

function getCandidateBunPaths(env: NodeJS.ProcessEnv): string[] {
  const candidates: string[] = [];

  if (env.BUN_BIN) candidates.push(env.BUN_BIN);

  if (typeof process.execPath === "string" && process.execPath.length > 0) {
    candidates.push(process.execPath);
  }

  const bunWhich =
    typeof Bun !== "undefined" && typeof Bun.which === "function"
      ? Bun.which("bun")
      : undefined;
  if (bunWhich) candidates.push(bunWhich);

  const home = env.HOME ?? "";
  if (home) {
    candidates.push(join(home, ".bun", "bin", "bun"));
  }

  candidates.push("/opt/homebrew/bin/bun");
  candidates.push("/usr/local/bin/bun");
  candidates.push("bun");

  return [...new Set(candidates)];
}

export function resolveBunBinary(env: NodeJS.ProcessEnv = process.env): string {
  for (const candidate of getCandidateBunPaths(env)) {
    if (candidate === "bun") return candidate;
    if (existsSync(candidate)) return candidate;
  }

  return "bun";
}

export function withResolvedRuntimeEnv(
  env: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  const bunBinary = resolveBunBinary(env);
  const nextEnv: NodeJS.ProcessEnv = { ...env, BUN_BIN: bunBinary };

  if (bunBinary !== "bun") {
    const bunDir = dirname(bunBinary);
    const currentPath = env.PATH ?? "";
    if (!currentPath.split(delimiter).includes(bunDir)) {
      nextEnv.PATH = currentPath ? `${bunDir}${delimiter}${currentPath}` : bunDir;
    }
  }

  return nextEnv;
}

export function getBunRunCommand(
  args: string[],
  env: NodeJS.ProcessEnv = process.env,
): { command: string; args: string[]; env: NodeJS.ProcessEnv } {
  const normalizedArgs = args[0] === "run" ? args : ["run", ...args];
  return {
    command: resolveBunBinary(env),
    args: normalizedArgs,
    env: withResolvedRuntimeEnv(env),
  };
}
