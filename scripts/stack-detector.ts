/**
 * ProductionOS Stack Detector — Layer 2
 *
 * Detects project tech stack from manifest files and returns tool provisioning config.
 * Extends session-start.sh monorepo detection with language/framework awareness.
 *
 * Usage:
 *   bun run scripts/stack-detector.ts [project-dir]
 *   bun run scripts/stack-detector.ts /path/to/project
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

// ─── Types ──────────────────────────────────────────────────

export type StackType = "node" | "python" | "go" | "rust" | "ruby" | "java" | "unknown";

export interface StackInfo {
  type: StackType;
  framework: string | null;
  testRunner: string | null;
  linter: string | null;
  packageManager: string | null;
  monorepo: boolean;
  tools: string[];
}

interface ManifestDetector {
  file: string;
  stack: StackType;
  detect: (content: string) => Partial<StackInfo>;
}

// ─── Detectors ──────────────────────────────────────────────

const detectors: ManifestDetector[] = [
  {
    file: "package.json",
    stack: "node",
    detect: (content: string) => {
      try {
        const pkg = JSON.parse(content);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        const framework = deps["next"] ? "nextjs"
          : deps["nuxt"] ? "nuxt"
          : deps["@angular/core"] ? "angular"
          : deps["svelte"] ? "svelte"
          : deps["vue"] ? "vue"
          : deps["react"] ? "react"
          : deps["express"] ? "express"
          : deps["fastify"] ? "fastify"
          : null;
        const testRunner = deps["vitest"] ? "vitest"
          : deps["jest"] ? "jest"
          : deps["bun-types"] ? "bun test"
          : deps["mocha"] ? "mocha"
          : null;
        const linter = deps["eslint"] ? "eslint"
          : deps["biome"] ? "biome"
          : null;
        const packageManager = existsSync("bun.lockb") ? "bun"
          : existsSync("pnpm-lock.yaml") ? "pnpm"
          : existsSync("yarn.lock") ? "yarn"
          : "npm";
        return { framework, testRunner, linter, packageManager };
      } catch {
        return {};
      }
    },
  },
  {
    file: "pyproject.toml",
    stack: "python",
    detect: (content: string) => {
      const framework = content.includes("django") ? "django"
        : content.includes("fastapi") ? "fastapi"
        : content.includes("flask") ? "flask"
        : null;
      const testRunner = content.includes("pytest") ? "pytest" : "unittest";
      const linter = content.includes("ruff") ? "ruff"
        : content.includes("flake8") ? "flake8"
        : null;
      const packageManager = content.includes("[tool.uv]") ? "uv"
        : content.includes("[tool.poetry]") ? "poetry"
        : "pip";
      return { framework, testRunner, linter, packageManager };
    },
  },
  {
    file: "go.mod",
    stack: "go",
    detect: (content: string) => {
      const framework = content.includes("gin-gonic") ? "gin"
        : content.includes("echo") ? "echo"
        : content.includes("fiber") ? "fiber"
        : null;
      return { framework, testRunner: "go test", linter: "golangci-lint", packageManager: "go mod" };
    },
  },
  {
    file: "Cargo.toml",
    stack: "rust",
    detect: (content: string) => {
      const framework = content.includes("actix") ? "actix"
        : content.includes("axum") ? "axum"
        : content.includes("rocket") ? "rocket"
        : null;
      return { framework, testRunner: "cargo test", linter: "clippy", packageManager: "cargo" };
    },
  },
  {
    file: "Gemfile",
    stack: "ruby",
    detect: (content: string) => {
      const framework = content.includes("rails") ? "rails"
        : content.includes("sinatra") ? "sinatra"
        : null;
      return { framework, testRunner: "rspec", linter: "rubocop", packageManager: "bundler" };
    },
  },
  {
    file: "pom.xml",
    stack: "java",
    detect: (content: string) => {
      const framework = content.includes("spring-boot") ? "spring-boot"
        : content.includes("quarkus") ? "quarkus"
        : null;
      return { framework, testRunner: "junit", linter: "checkstyle", packageManager: "maven" };
    },
  },
];

// ─── Detection ──────────────────────────────────────────────

/** Detect the tech stack of a project directory */
export function detectStack(projectDir: string): StackInfo {
  const result: StackInfo = {
    type: "unknown",
    framework: null,
    testRunner: null,
    linter: null,
    packageManager: null,
    monorepo: false,
    tools: [],
  };

  for (const detector of detectors) {
    const filePath = join(projectDir, detector.file);
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, "utf-8");
        const detected = detector.detect(content);
        result.type = detector.stack;
        result.framework = detected.framework || null;
        result.testRunner = detected.testRunner || null;
        result.linter = detected.linter || null;
        result.packageManager = detected.packageManager || null;
        break; // Use first match (priority order)
      } catch { /* skip */ }
    }
  }

  // Monorepo detection (same as session-start.sh logic)
  const manifestFiles = ["package.json", "go.mod", "pyproject.toml", "Cargo.toml"];
  let subprojectCount = 0;
  try {
    const entries = require("fs").readdirSync(projectDir);
    for (const entry of entries) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      const subDir = join(projectDir, entry);
      try {
        if (require("fs").statSync(subDir).isDirectory()) {
          for (const manifest of manifestFiles) {
            if (existsSync(join(subDir, manifest))) {
              subprojectCount++;
              break;
            }
          }
        }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  result.monorepo = subprojectCount > 2;

  // Provision tools based on detected stack
  result.tools = provisionTools(result);

  return result;
}

/** Return recommended tools for the detected stack */
function provisionTools(stack: StackInfo): string[] {
  const tools: string[] = ["Read", "Write", "Edit", "Bash", "Grep", "Glob"];

  if (stack.testRunner) tools.push(`test:${stack.testRunner}`);
  if (stack.linter) tools.push(`lint:${stack.linter}`);

  switch (stack.type) {
    case "node":
      tools.push("mcp:context7");
      if (stack.framework === "nextjs") tools.push("mcp:playwright");
      break;
    case "python":
      tools.push("mcp:context7");
      if (stack.framework === "django" || stack.framework === "fastapi") {
        tools.push("mcp:postgres");
      }
      break;
    case "go":
    case "rust":
      tools.push("mcp:context7");
      break;
  }

  return tools;
}

// ─── CLI ────────────────────────────────────────────────────

if (import.meta.main) {
  const projectDir = process.argv[2] || process.cwd();
  const result = detectStack(projectDir);
  console.log(JSON.stringify(result, null, 2));
}
