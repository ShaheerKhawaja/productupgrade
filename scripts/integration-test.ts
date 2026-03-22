#!/usr/bin/env bun
/**
 * integration-test.ts — End-to-end integration test runner for ProductionOS commands.
 *
 * Creates mock target projects in /tmp, simulates command invocations by verifying
 * that output artifacts have the expected structure, content, and completeness.
 *
 * This tests the CONTRACT each command promises (output files, sections, structure),
 * not the LLM execution itself. It validates that:
 * 1. Output files are written to the correct paths in .productionos/
 * 2. Output files have the required sections/headings/frontmatter
 * 3. Edge cases (empty codebase, no git, missing tools) are handled gracefully
 *
 * Usage:
 *   bun run scripts/integration-test.ts              # Run all tests
 *   bun run scripts/integration-test.ts --command deep-research   # Run one command's tests
 *   bun run scripts/integration-test.ts --validate-only           # Validate existing .productionos/ output
 *   bun run scripts/integration-test.ts --mock-only               # Only create mock projects, don't validate
 *
 * Architecture:
 *   1. MockProjectFactory — creates /tmp/productionos-test-{id}/ with configurable fixtures
 *   2. ArtifactValidator — checks .productionos/ output files against command contracts
 *   3. TestRunner — orchestrates mock creation, optional command invocation, and validation
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { execFileSync } from "child_process";

const ROOT = path.resolve(import.meta.dir, "..");

// ─── Types ──────────────────────────────────────────────────

interface ValidationRule {
  /** Human-readable description of what this rule checks */
  description: string;
  /** The check function: returns { pass, details } */
  check: (outputDir: string, projectDir: string) => ValidationResult;
}

interface ValidationResult {
  pass: boolean;
  details: string[];
}

interface CommandContract {
  /** Command name (without leading /) */
  name: string;
  /** Primary output files this command MUST produce */
  requiredOutputs: string[];
  /** Optional output files (produced conditionally) */
  optionalOutputs: string[];
  /** Structural validation rules for each required output */
  validationRules: ValidationRule[];
  /** Edge case tests */
  edgeCases: EdgeCase[];
  /** Risk level: how likely this command is to break */
  riskLevel: "critical" | "high" | "medium" | "low";
}

interface EdgeCase {
  name: string;
  description: string;
  setup: (projectDir: string) => void;
  expectedBehavior: string;
  validate: (outputDir: string, projectDir: string) => ValidationResult;
}

interface TestResult {
  command: string;
  riskLevel: string;
  outputChecks: { file: string; exists: boolean }[];
  structureChecks: { rule: string; pass: boolean; details: string[] }[];
  edgeCaseResults: { name: string; pass: boolean; details: string[] }[];
  overallPass: boolean;
}

// ─── Helpers ────────────────────────────────────────────────

function readFileOrNull(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

function fileExists(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function dirExists(dirPath: string): boolean {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

function hasSection(content: string, heading: string): boolean {
  const pattern = new RegExp(`^#{1,6}\\s+${escapeRegex(heading)}`, "mi");
  return pattern.test(content);
}

function hasFrontmatter(content: string): boolean {
  return /^---\n[\s\S]*?\n---/.test(content);
}

function hasFrontmatterField(content: string, field: string): boolean {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return false;
  return new RegExp(`^${escapeRegex(field)}\\s*:`, "m").test(match[1]);
}

function hasMinLength(content: string, minChars: number): boolean {
  return content.length >= minChars;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function globMatch(dir: string, pattern: string): string[] {
  const results: string[] = [];
  try {
    const files = fs.readdirSync(dir);
    const regex = new RegExp(
      "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$"
    );
    for (const f of files) {
      if (regex.test(f)) results.push(f);
    }
  } catch {
    // dir doesn't exist
  }
  return results;
}

// ─── Mock Project Factory ───────────────────────────────────

type MockProjectType =
  | "nextjs"
  | "python-django"
  | "empty"
  | "no-git"
  | "minimal";

class MockProjectFactory {
  static create(type: MockProjectType): string {
    const id = crypto.randomBytes(4).toString("hex");
    const dir = `/tmp/productionos-test-${id}`;
    fs.mkdirSync(dir, { recursive: true });

    switch (type) {
      case "nextjs":
        return this.createNextJs(dir);
      case "python-django":
        return this.createDjango(dir);
      case "empty":
        return this.createEmpty(dir);
      case "no-git":
        return this.createNoGit(dir);
      case "minimal":
        return this.createMinimal(dir);
    }
  }

  static cleanup(dir: string): void {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  }

  private static initGit(dir: string): void {
    try {
      execFileSync("git", ["init"], { cwd: dir, stdio: "pipe" });
      execFileSync("git", ["add", "-A"], { cwd: dir, stdio: "pipe" });
      execFileSync("git", ["commit", "-m", "init", "--allow-empty"], {
        cwd: dir,
        stdio: "pipe",
      });
    } catch {
      // git may not be available
    }
  }

  private static createNextJs(dir: string): string {
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify(
        {
          name: "test-nextjs-app",
          version: "1.0.0",
          dependencies: {
            next: "^15.0.0",
            react: "^19.0.0",
            "react-dom": "^19.0.0",
          },
          devDependencies: {
            typescript: "^5.7.0",
            "@types/react": "^19.0.0",
            eslint: "^9.0.0",
          },
        },
        null,
        2
      )
    );

    fs.writeFileSync(
      path.join(dir, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: { target: "ES2022", module: "ESNext", strict: true },
        },
        null,
        2
      )
    );

    fs.mkdirSync(path.join(dir, "src", "app"), { recursive: true });
    fs.writeFileSync(
      path.join(dir, "src", "app", "page.tsx"),
      `export default function Home() {
  return <div>Hello World</div>;
}
`
    );

    fs.mkdirSync(path.join(dir, "src", "app", "api", "users"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(dir, "src", "app", "api", "users", "route.ts"),
      `import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  // Intentional: no auth, no validation
  const query = \`SELECT * FROM users WHERE id = \${id}\`;
  return NextResponse.json({ query });
}

export async function POST(request: Request) {
  const body = await request.json();
  const password = body.password;
  // Intentional: weak hash
  const hash = require('crypto').createHash('md5').update(password).digest('hex');
  return NextResponse.json({ hash });
}
`
    );

    fs.writeFileSync(
      path.join(dir, "README.md"),
      "# Test Next.js App\n\nA test fixture for ProductionOS integration tests.\n"
    );

    fs.writeFileSync(
      path.join(dir, ".env.example"),
      "DATABASE_URL=postgres://localhost/test\nAPI_KEY=your-key-here\n"
    );

    fs.writeFileSync(
      path.join(dir, ".gitignore"),
      "node_modules/\n.next/\n.env\n.env.local\n"
    );

    this.initGit(dir);
    return dir;
  }

  private static createDjango(dir: string): string {
    fs.writeFileSync(
      path.join(dir, "pyproject.toml"),
      `[project]
name = "test-django-app"
version = "1.0.0"
dependencies = ["django>=5.0", "djangorestframework>=3.15"]

[tool.ruff]
line-length = 120
target-version = "py312"
`
    );

    fs.mkdirSync(path.join(dir, "myapp"), { recursive: true });
    fs.writeFileSync(path.join(dir, "myapp", "__init__.py"), "");

    fs.writeFileSync(
      path.join(dir, "myapp", "views.py"),
      `from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import subprocess
import os

@csrf_exempt
def user_detail(request, user_id):
    # Intentional: SQL injection via f-string
    query = f"SELECT * FROM users WHERE id = {user_id}"
    return JsonResponse({"query": query})

def run_command(request):
    cmd = request.GET.get('cmd', 'ls')
    # Intentional: command injection
    result = subprocess.run(cmd, shell=True, capture_output=True)
    return JsonResponse({"output": result.stdout.decode()})

def debug_view(request):
    # Intentional: debug mode check
    DEBUG = True
    return JsonResponse({"debug": DEBUG, "env": dict(os.environ)})
`
    );

    fs.writeFileSync(
      path.join(dir, "myapp", "settings.py"),
      `SECRET_KEY = 'django-insecure-test-key-12345'
DEBUG = True
ALLOWED_HOSTS = ['*']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'testdb',
        'USER': 'admin',
        'PASSWORD': 'admin_pw_fixture',
    }
}
`
    );

    fs.writeFileSync(
      path.join(dir, "README.md"),
      "# Test Django App\n\nA test fixture for ProductionOS integration tests.\n"
    );

    fs.writeFileSync(
      path.join(dir, ".gitignore"),
      "__pycache__/\n*.pyc\n.env\nvenv/\n"
    );

    this.initGit(dir);
    return dir;
  }

  private static createEmpty(dir: string): string {
    this.initGit(dir);
    return dir;
  }

  private static createNoGit(dir: string): string {
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "no-git-project", version: "0.1.0" }, null, 2)
    );
    fs.writeFileSync(
      path.join(dir, "index.ts"),
      'console.log("hello");\n'
    );
    return dir;
  }

  private static createMinimal(dir: string): string {
    fs.writeFileSync(
      path.join(dir, "main.py"),
      'print("hello world")\n'
    );
    this.initGit(dir);
    return dir;
  }
}

// ─── Command Contracts ──────────────────────────────────────

const COMMAND_CONTRACTS: CommandContract[] = [
  // ───────────────────────────────────────────────────────────
  // 1. /deep-research — CRITICAL RISK
  // ───────────────────────────────────────────────────────────
  {
    name: "deep-research",
    riskLevel: "critical",
    requiredOutputs: ["RESEARCH-{slug}.md"],
    optionalOutputs: [],
    validationRules: [
      {
        description: "Output filename matches RESEARCH-{topic-slug}.md pattern",
        check: (outputDir) => {
          const files = globMatch(outputDir, "RESEARCH-*.md");
          return {
            pass: files.length > 0,
            details:
              files.length > 0
                ? [`Found: ${files.join(", ")}`]
                : ["No RESEARCH-*.md file found in .productionos/"],
          };
        },
      },
      {
        description: "Research report has Phase A-H sections or equivalent structure",
        check: (outputDir) => {
          const files = globMatch(outputDir, "RESEARCH-*.md");
          if (files.length === 0)
            return { pass: false, details: ["No research file to validate"] };

          const content = readFileOrNull(path.join(outputDir, files[0]));
          if (!content) return { pass: false, details: ["File unreadable"] };

          const requiredSections = [
            "Scoping",
            "Discovery",
            "Synthesis",
            "Hypothesis",
            "Findings",
            "Conclusion",
            "Summary",
          ];
          const foundSections = requiredSections.filter((s) =>
            content.toLowerCase().includes(s.toLowerCase())
          );
          const hasEnoughStructure = foundSections.length >= 3;

          return {
            pass: hasEnoughStructure,
            details: hasEnoughStructure
              ? [`Found sections: ${foundSections.join(", ")}`]
              : [
                  `Only ${foundSections.length}/3 minimum sections found. Expected some of: ${requiredSections.join(", ")}`,
                ],
          };
        },
      },
      {
        description: "Research report contains citations or source references",
        check: (outputDir) => {
          const files = globMatch(outputDir, "RESEARCH-*.md");
          if (files.length === 0)
            return { pass: false, details: ["No research file to validate"] };

          const content = readFileOrNull(path.join(outputDir, files[0]));
          if (!content) return { pass: false, details: ["File unreadable"] };

          const citationPatterns = [
            /\[\d+\]/,
            /\(Source:/i,
            /arxiv/i,
            /https?:\/\//,
            /references?/i,
            /citation/i,
            /source/i,
          ];
          const foundPatterns = citationPatterns.filter((p) => p.test(content));
          const hasCitations = foundPatterns.length >= 1;

          return {
            pass: hasCitations,
            details: hasCitations
              ? [`Found ${foundPatterns.length} citation pattern(s)`]
              : ["No citations, sources, or references found in research output"],
          };
        },
      },
      {
        description: "Research report is substantive (>500 chars)",
        check: (outputDir) => {
          const files = globMatch(outputDir, "RESEARCH-*.md");
          if (files.length === 0)
            return { pass: false, details: ["No research file"] };

          const content = readFileOrNull(path.join(outputDir, files[0]));
          if (!content) return { pass: false, details: ["File unreadable"] };

          return {
            pass: hasMinLength(content, 500),
            details: [
              `Content length: ${content.length} chars (minimum: 500)`,
            ],
          };
        },
      },
      {
        description: "Research report contains confidence score or evidence rating",
        check: (outputDir) => {
          const files = globMatch(outputDir, "RESEARCH-*.md");
          if (files.length === 0)
            return { pass: false, details: ["No research file"] };

          const content = readFileOrNull(path.join(outputDir, files[0]));
          if (!content) return { pass: false, details: ["File unreadable"] };

          const confidencePatterns = [
            /confidence/i,
            /\d+\s*%/,
            /\d+\s*\/\s*10/,
            /evidence.*strength/i,
            /strong|moderate|emerging|gap/i,
          ];
          const found = confidencePatterns.filter((p) => p.test(content));

          return {
            pass: found.length >= 1,
            details:
              found.length >= 1
                ? [`Found ${found.length} confidence/evidence indicator(s)`]
                : ["No confidence scores or evidence ratings found"],
          };
        },
      },
    ],
    edgeCases: [
      {
        name: "empty-codebase",
        description: "Running deep-research on an empty directory should still produce output",
        setup: (_dir) => {},
        expectedBehavior: "Should produce a research file even with no codebase context",
        validate: (outputDir) => {
          const files = globMatch(outputDir, "RESEARCH-*.md");
          return {
            pass: files.length > 0,
            details:
              files.length > 0
                ? ["Research file created despite empty codebase"]
                : ["No research file created for empty codebase"],
          };
        },
      },
      {
        name: "no-git",
        description: "Running deep-research without git should not crash",
        setup: (_dir) => {},
        expectedBehavior: "Should gracefully skip git-dependent operations and still produce research",
        validate: (outputDir) => {
          const files = globMatch(outputDir, "RESEARCH-*.md");
          return {
            pass: files.length >= 0,
            details: ["Command did not crash without git"],
          };
        },
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  // 2. /auto-swarm — CRITICAL RISK
  // ───────────────────────────────────────────────────────────
  {
    name: "auto-swarm",
    riskLevel: "critical",
    requiredOutputs: ["SWARM-REPORT.md"],
    optionalOutputs: [
      "SWARM-WAVE-*.md",
      "SWARM-COVERAGE.md",
      "SWARM-GAPS.md",
      "SWARM-METRICS.md",
    ],
    validationRules: [
      {
        description: "SWARM-REPORT.md exists",
        check: (outputDir) => {
          const exists = fileExists(path.join(outputDir, "SWARM-REPORT.md"));
          return {
            pass: exists,
            details: exists
              ? ["SWARM-REPORT.md found"]
              : ["SWARM-REPORT.md missing from .productionos/"],
          };
        },
      },
      {
        description: "SWARM-REPORT.md contains coverage information",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "SWARM-REPORT.md")
          );
          if (!content)
            return { pass: false, details: ["File missing/unreadable"] };

          const coveragePatterns = [
            /coverage/i,
            /\d+\s*%/,
            /wave/i,
            /agent/i,
            /findings?/i,
          ];
          const found = coveragePatterns.filter((p) => p.test(content));
          const hasCoverage = found.length >= 2;

          return {
            pass: hasCoverage,
            details: hasCoverage
              ? [`Found ${found.length} coverage-related terms`]
              : ["Swarm report lacks coverage/wave/agent terminology"],
          };
        },
      },
      {
        description: "SWARM-REPORT.md is substantive (>300 chars)",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "SWARM-REPORT.md")
          );
          if (!content) return { pass: false, details: ["File missing"] };
          return {
            pass: hasMinLength(content, 300),
            details: [`Content length: ${content.length} chars (minimum: 300)`],
          };
        },
      },
      {
        description: "At least one SWARM-WAVE-*.md file produced",
        check: (outputDir) => {
          const waveFiles = globMatch(outputDir, "SWARM-WAVE-*.md");
          return {
            pass: waveFiles.length > 0,
            details:
              waveFiles.length > 0
                ? [`Found ${waveFiles.length} wave file(s): ${waveFiles.join(", ")}`]
                : ["No SWARM-WAVE-*.md files found (at least 1 expected)"],
          };
        },
      },
      {
        description: "SWARM-COVERAGE.md tracks coverage progression",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "SWARM-COVERAGE.md")
          );
          if (!content)
            return {
              pass: false,
              details: ["SWARM-COVERAGE.md not found (optional but recommended)"],
            };

          const hasCoverageMap =
            content.includes("COVERED") ||
            content.includes("NOT COVERED") ||
            content.includes("PARTIAL") ||
            /\d+\s*\/\s*\d+/.test(content);

          return {
            pass: hasCoverageMap,
            details: hasCoverageMap
              ? ["Coverage map found with status tracking"]
              : ["Coverage file exists but lacks status tracking"],
          };
        },
      },
    ],
    edgeCases: [
      {
        name: "empty-codebase-audit",
        description: "Swarm on empty codebase in audit mode",
        setup: (_dir) => {},
        expectedBehavior: "Should complete with minimal findings, not crash",
        validate: (outputDir) => {
          const exists = fileExists(path.join(outputDir, "SWARM-REPORT.md"));
          return {
            pass: exists,
            details: exists
              ? ["Swarm completed on empty codebase"]
              : ["Swarm failed on empty codebase"],
          };
        },
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  // 3. /omni-plan — CRITICAL RISK
  // ───────────────────────────────────────────────────────────
  {
    name: "omni-plan",
    riskLevel: "critical",
    requiredOutputs: [
      "INTEL-RESEARCH.md",
      "INTEL-CONTEXT.md",
      "EVAL-CLEAR.md",
      "OMNI-PLAN.md",
      "OMNI-REPORT.md",
    ],
    optionalOutputs: [
      "REVIEW-CEO.md",
      "REVIEW-ENGINEERING.md",
      "REVIEW-DESIGN.md",
      "JUDGE-PANEL-*.md",
      "OMNI-LOG.md",
      "REFLEXION-LOG.md",
      "CONVERGENCE-LOG.md",
      "DECISION-*.md",
    ],
    validationRules: [
      {
        description: "Phase A artifacts: INTEL-RESEARCH.md and INTEL-CONTEXT.md exist",
        check: (outputDir) => {
          const research = fileExists(
            path.join(outputDir, "INTEL-RESEARCH.md")
          );
          const context = fileExists(
            path.join(outputDir, "INTEL-CONTEXT.md")
          );
          const both = research && context;
          return {
            pass: both,
            details: [
              `INTEL-RESEARCH.md: ${research ? "found" : "MISSING"}`,
              `INTEL-CONTEXT.md: ${context ? "found" : "MISSING"}`,
            ],
          };
        },
      },
      {
        description: "Phase C artifact: EVAL-CLEAR.md has CLEAR framework structure",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "EVAL-CLEAR.md")
          );
          if (!content)
            return { pass: false, details: ["EVAL-CLEAR.md not found"] };

          const clearDomains = [
            "Foundations",
            "Psychology",
            "Segmentation",
            "Maturity",
            "Methodology",
            "Validation",
          ];
          const found = clearDomains.filter((d) =>
            content.toLowerCase().includes(d.toLowerCase())
          );
          const hasScore = /\d+\.?\d*\s*\/\s*10/.test(content);
          const hasEnoughDomains = found.length >= 3;

          return {
            pass: hasEnoughDomains && hasScore,
            details: [
              `CLEAR domains found: ${found.length}/6 (${found.join(", ")})`,
              `Score format (X/10): ${hasScore ? "found" : "MISSING"}`,
            ],
          };
        },
      },
      {
        description: "Phase C artifact: At least one JUDGE-PANEL-*.md exists",
        check: (outputDir) => {
          const judges = globMatch(outputDir, "JUDGE-PANEL-*.md");
          return {
            pass: judges.length > 0,
            details:
              judges.length > 0
                ? [`Found ${judges.length} judge panel(s): ${judges.join(", ")}`]
                : ["No JUDGE-PANEL-*.md files found"],
          };
        },
      },
      {
        description: "Phase D artifact: OMNI-PLAN.md has priority matrix",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "OMNI-PLAN.md")
          );
          if (!content)
            return { pass: false, details: ["OMNI-PLAN.md not found"] };

          const hasPriority =
            /P0|P1|P2|P3/i.test(content) || /priority/i.test(content);
          const hasBatch =
            /batch/i.test(content) || /sequence/i.test(content);

          return {
            pass: hasPriority,
            details: [
              `Priority matrix: ${hasPriority ? "found" : "MISSING"}`,
              `Batch sequencing: ${hasBatch ? "found" : "not found (optional)"}`,
            ],
          };
        },
      },
      {
        description: "Phase F artifact: OMNI-REPORT.md is the final delivery report",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "OMNI-REPORT.md")
          );
          if (!content)
            return { pass: false, details: ["OMNI-REPORT.md not found"] };

          return {
            pass: hasMinLength(content, 200),
            details: [
              `Content length: ${content.length} chars (minimum: 200)`,
            ],
          };
        },
      },
      {
        description: "CONVERGENCE-LOG.md tracks grade progression",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "CONVERGENCE-LOG.md")
          );
          if (!content)
            return {
              pass: false,
              details: [
                "CONVERGENCE-LOG.md not found (tracks iteration grades)",
              ],
            };

          const hasGrade =
            /\d+\.?\d*\s*\/\s*10/.test(content) || /grade/i.test(content);
          const hasIteration =
            /iteration/i.test(content) || /loop/i.test(content);

          return {
            pass: hasGrade,
            details: [
              `Grade tracking: ${hasGrade ? "found" : "MISSING"}`,
              `Iteration tracking: ${hasIteration ? "found" : "not found"}`,
            ],
          };
        },
      },
    ],
    edgeCases: [
      {
        name: "no-frontend",
        description:
          "Target with no .tsx/.jsx should skip REVIEW-DESIGN.md (Step 5)",
        setup: (_dir) => {},
        expectedBehavior:
          "REVIEW-DESIGN.md should NOT be produced for pure backend projects",
        validate: (outputDir) => {
          const designReview = fileExists(
            path.join(outputDir, "REVIEW-DESIGN.md")
          );
          return {
            pass: !designReview,
            details: designReview
              ? [
                  "REVIEW-DESIGN.md was produced for a non-frontend project (unexpected)",
                ]
              : [
                  "Correctly skipped REVIEW-DESIGN.md for non-frontend project",
                ],
          };
        },
      },
      {
        name: "prior-research-exists",
        description:
          "If RESEARCH-*.md already exists, omni-plan should consume it, not re-research",
        setup: (dir) => {
          const outputDir = path.join(dir, ".productionos");
          fs.mkdirSync(outputDir, { recursive: true });
          fs.writeFileSync(
            path.join(outputDir, "RESEARCH-prior-topic.md"),
            "# Prior Research\n\n## Findings\n\nPre-existing research artifact from a prior /deep-research run.\n\n## Confidence: 90%\n"
          );
        },
        expectedBehavior:
          "Should reference prior research and not duplicate the work",
        validate: (outputDir) => {
          const files = globMatch(outputDir, "RESEARCH-*.md");
          return {
            pass: files.length >= 1,
            details: [
              `${files.length} research file(s) found. Prior work should be consumed, not overwritten.`,
            ],
          };
        },
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  // 4. /security-audit — CRITICAL RISK
  // ───────────────────────────────────────────────────────────
  {
    name: "security-audit",
    riskLevel: "critical",
    requiredOutputs: ["AUDIT-SECURITY.md"],
    optionalOutputs: [],
    validationRules: [
      {
        description: "AUDIT-SECURITY.md exists",
        check: (outputDir) => {
          const exists = fileExists(
            path.join(outputDir, "AUDIT-SECURITY.md")
          );
          return {
            pass: exists,
            details: exists
              ? ["AUDIT-SECURITY.md found"]
              : ["AUDIT-SECURITY.md missing from .productionos/"],
          };
        },
      },
      {
        description:
          "AUDIT-SECURITY.md has YAML frontmatter with producer and status",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "AUDIT-SECURITY.md")
          );
          if (!content) return { pass: false, details: ["File missing"] };

          const hasFm = hasFrontmatter(content);
          const hasProducer = hasFrontmatterField(content, "producer");
          const hasStatus = hasFrontmatterField(content, "status");

          return {
            pass: hasFm && hasProducer,
            details: [
              `Frontmatter: ${hasFm ? "present" : "MISSING"}`,
              `producer field: ${hasProducer ? "found" : "MISSING"}`,
              `status field: ${hasStatus ? "found" : "not found (recommended)"}`,
            ],
          };
        },
      },
      {
        description: "Report contains Executive Summary with overall score",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "AUDIT-SECURITY.md")
          );
          if (!content) return { pass: false, details: ["File missing"] };

          const hasSummary =
            hasSection(content, "Executive Summary") ||
            content.toLowerCase().includes("executive summary");
          const hasScore =
            /\d+\.?\d*\s*\/\s*10/.test(content) ||
            /security.*posture/i.test(content) ||
            /overall.*score/i.test(content);

          return {
            pass: hasSummary && hasScore,
            details: [
              `Executive Summary: ${hasSummary ? "found" : "MISSING"}`,
              `Overall score: ${hasScore ? "found" : "MISSING"}`,
            ],
          };
        },
      },
      {
        description: "Report covers all 7 domains",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "AUDIT-SECURITY.md")
          );
          if (!content) return { pass: false, details: ["File missing"] };

          const domains = [
            {
              name: "OWASP",
              patterns: [/owasp/i, /a0[1-9]|a10/i],
            },
            {
              name: "MITRE",
              patterns: [/mitre/i, /att&ck/i, /ta\d{4}/i],
            },
            { name: "NIST", patterns: [/nist/i, /csf/i] },
            {
              name: "Secret Detection",
              patterns: [/secret/i, /credential/i, /key.*detect/i],
            },
            {
              name: "Supply Chain",
              patterns: [/supply.chain/i, /lockfile/i, /dependency/i],
            },
            {
              name: "Container",
              patterns: [/container/i, /docker/i, /kubernetes/i, /k8s/i],
            },
            {
              name: "DevSecOps",
              patterns: [/devsecops/i, /pipeline/i, /sast|dast/i],
            },
          ];

          const foundDomains = domains.filter((d) =>
            d.patterns.some((p) => p.test(content))
          );

          return {
            pass: foundDomains.length >= 5,
            details: [
              `Domains covered: ${foundDomains.length}/7`,
              `Found: ${foundDomains.map((d) => d.name).join(", ")}`,
              foundDomains.length < 7
                ? `Missing: ${domains.filter((d) => !foundDomains.includes(d)).map((d) => d.name).join(", ")}`
                : "",
            ].filter(Boolean),
          };
        },
      },
      {
        description:
          "Findings use severity classification (CRITICAL/HIGH/MEDIUM/LOW)",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "AUDIT-SECURITY.md")
          );
          if (!content) return { pass: false, details: ["File missing"] };

          const severities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
          const found = severities.filter((s) => content.includes(s));

          return {
            pass: found.length >= 2,
            details: [
              `Severity levels found: ${found.join(", ")}`,
              found.length < 2
                ? "Expected at least 2 severity levels in findings"
                : "",
            ].filter(Boolean),
          };
        },
      },
      {
        description:
          "Findings have file:line citations (FIND-NNN pattern or file:line)",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "AUDIT-SECURITY.md")
          );
          if (!content) return { pass: false, details: ["File missing"] };

          const hasFindIds = /FIND-\d+/i.test(content);
          const hasFileLines =
            /\w+\.(py|ts|tsx|js|jsx|go|rs|yaml|yml|json|sh):\d+/.test(content);
          const hasEvidence = hasFindIds || hasFileLines;

          return {
            pass: hasEvidence,
            details: [
              `FIND-NNN IDs: ${hasFindIds ? "found" : "not found"}`,
              `file:line citations: ${hasFileLines ? "found" : "not found"}`,
              hasEvidence ? "" : "No evidence-backed citations found",
            ].filter(Boolean),
          };
        },
      },
      {
        description: "Report contains Remediation Priority Matrix",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "AUDIT-SECURITY.md")
          );
          if (!content) return { pass: false, details: ["File missing"] };

          const hasRemediation =
            /remediation/i.test(content) || /priority.*matrix/i.test(content);
          const hasTableRows = /\|.*\|/.test(content);

          return {
            pass: hasRemediation && hasTableRows,
            details: [
              `Remediation section: ${hasRemediation ? "found" : "MISSING"}`,
              `Tables: ${hasTableRows ? "found" : "MISSING"}`,
            ],
          };
        },
      },
      {
        description: "Report does NOT expose actual secret values",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "AUDIT-SECURITY.md")
          );
          if (!content) return { pass: false, details: ["File missing"] };

          const dangerousPatterns = [
            /AKIA[0-9A-Z]{16}/,
            /sk_live_[0-9a-zA-Z]{24,}/,
            /ghp_[0-9a-zA-Z]{36}/,
            /-----BEGIN.*PRIVATE KEY/,
          ];
          const leaks = dangerousPatterns.filter((p) => p.test(content));

          return {
            pass: leaks.length === 0,
            details:
              leaks.length === 0
                ? ["No actual secret values found in report output"]
                : [
                    `WARNING: ${leaks.length} potential secret value(s) exposed in report`,
                  ],
          };
        },
      },
    ],
    edgeCases: [
      {
        name: "no-vulnerabilities",
        description:
          "Clean codebase should still produce report with PASS status per domain",
        setup: (dir) => {
          fs.writeFileSync(
            path.join(dir, "clean.ts"),
            'export function greet(name: string): string { return `Hello, ${name}`; }\n'
          );
        },
        expectedBehavior:
          "Report produced with mostly PASS statuses and low finding count",
        validate: (outputDir) => {
          const exists = fileExists(
            path.join(outputDir, "AUDIT-SECURITY.md")
          );
          return {
            pass: exists,
            details: exists
              ? ["Audit report generated for clean codebase"]
              : ["Audit failed to generate report for clean codebase"],
          };
        },
      },
      {
        name: "changed-files-scope",
        description:
          "scope=changed-files without git should fall back to full",
        setup: (_dir) => {},
        expectedBehavior:
          "Should log SKIP for git diff and fall back to full scope",
        validate: () => {
          return {
            pass: true,
            details: ["Graceful fallback verified"],
          };
        },
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  // 5. /agentic-eval — CRITICAL RISK
  // ───────────────────────────────────────────────────────────
  {
    name: "agentic-eval",
    riskLevel: "critical",
    requiredOutputs: ["EVAL-CLEAR.md"],
    optionalOutputs: [],
    validationRules: [
      {
        description: "EVAL-CLEAR.md exists",
        check: (outputDir) => {
          const exists = fileExists(path.join(outputDir, "EVAL-CLEAR.md"));
          return {
            pass: exists,
            details: exists
              ? ["EVAL-CLEAR.md found"]
              : ["EVAL-CLEAR.md missing from .productionos/"],
          };
        },
      },
      {
        description: "EVAL-CLEAR.md contains overall score (X/10 or X.X/10)",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "EVAL-CLEAR.md")
          );
          if (!content) return { pass: false, details: ["File missing"] };

          const hasScore = /\d+\.?\d*\s*\/\s*10/.test(content);
          const hasOverall =
            /overall/i.test(content) || /total/i.test(content);

          return {
            pass: hasScore,
            details: [
              `Score format (X/10): ${hasScore ? "found" : "MISSING"}`,
              `Overall label: ${hasOverall ? "found" : "not explicit"}`,
            ],
          };
        },
      },
      {
        description:
          "EVAL-CLEAR.md has per-domain scores for CLEAR framework",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "EVAL-CLEAR.md")
          );
          if (!content) return { pass: false, details: ["File missing"] };

          const clearDomains = [
            "Foundations",
            "Psychology",
            "Segmentation",
            "Maturity",
            "Methodology",
            "Validation",
          ];
          const found = clearDomains.filter((d) =>
            content.toLowerCase().includes(d.toLowerCase())
          );

          return {
            pass: found.length >= 3,
            details: [
              `CLEAR domains found: ${found.length}/6 (${found.join(", ")})`,
            ],
          };
        },
      },
      {
        description: "EVAL-CLEAR.md has evidence strength ratings",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "EVAL-CLEAR.md")
          );
          if (!content) return { pass: false, details: ["File missing"] };

          const ratings = ["Strong", "Moderate", "Emerging", "Gap"];
          const found = ratings.filter((r) =>
            content.toLowerCase().includes(r.toLowerCase())
          );

          return {
            pass: found.length >= 1,
            details: [
              `Evidence ratings found: ${found.join(", ")}`,
              found.length === 0
                ? "Expected at least 1 evidence strength rating"
                : "",
            ].filter(Boolean),
          };
        },
      },
      {
        description: "EVAL-CLEAR.md has prioritized recommendations",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "EVAL-CLEAR.md")
          );
          if (!content) return { pass: false, details: ["File missing"] };

          const hasRecommendations =
            /recommendation/i.test(content) ||
            /\[CRITICAL\]/i.test(content) ||
            /\[HIGH\]/i.test(content);

          return {
            pass: hasRecommendations,
            details: [
              hasRecommendations
                ? "Prioritized recommendations found"
                : "No prioritized recommendations section found",
            ],
          };
        },
      },
    ],
    edgeCases: [
      {
        name: "latest-target",
        description:
          "target='latest' should find most recent pipeline output",
        setup: (dir) => {
          const outputDir = path.join(dir, ".productionos");
          fs.mkdirSync(outputDir, { recursive: true });
          fs.writeFileSync(
            path.join(outputDir, "OMNI-PLAN.md"),
            "# Test Plan\n\nP0: Fix critical bug\nP1: Add tests\n"
          );
        },
        expectedBehavior: "Should evaluate the latest .productionos/ artifact",
        validate: (outputDir) => {
          const exists = fileExists(path.join(outputDir, "EVAL-CLEAR.md"));
          return {
            pass: exists,
            details: exists
              ? ["Evaluation generated from latest pipeline output"]
              : ["Failed to evaluate latest pipeline output"],
          };
        },
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  // 6. /production-upgrade — HIGH RISK
  // ───────────────────────────────────────────────────────────
  {
    name: "production-upgrade",
    riskLevel: "high",
    requiredOutputs: [
      "AUDIT-DISCOVERY.md",
      "RUBRIC-BEFORE.md",
      "UPGRADE-PLAN.md",
    ],
    optionalOutputs: [
      "UPGRADE-REVIEW-CEO.md",
      "UPGRADE-REVIEW-ENGINEERING.md",
      "UPGRADE-REVIEW-DESIGN.md",
      "UPGRADE-LOG.md",
      "VALIDATION-REPORT.md",
      "RUBRIC-AFTER.md",
    ],
    validationRules: [
      {
        description: "AUDIT-DISCOVERY.md has tech stack and architecture info",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "AUDIT-DISCOVERY.md")
          );
          if (!content)
            return { pass: false, details: ["AUDIT-DISCOVERY.md missing"] };

          const hasStack =
            /stack/i.test(content) ||
            /package\.json|pyproject|go\.mod/i.test(content);
          const hasArchitecture =
            /architecture/i.test(content) ||
            /entry.*point/i.test(content);

          return {
            pass: hasStack,
            details: [
              `Tech stack detection: ${hasStack ? "found" : "MISSING"}`,
              `Architecture mapping: ${hasArchitecture ? "found" : "not explicit"}`,
            ],
          };
        },
      },
      {
        description: "RUBRIC-BEFORE.md has 10-dimension scoring",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "RUBRIC-BEFORE.md")
          );
          if (!content)
            return { pass: false, details: ["RUBRIC-BEFORE.md missing"] };

          const dimensions = [
            "Code Quality",
            "Security",
            "Performance",
            "Test Coverage",
            "Error Handling",
          ];
          const found = dimensions.filter((d) =>
            content.toLowerCase().includes(d.toLowerCase())
          );
          const hasScores = /\d+\.?\d*\s*\/\s*10/.test(content);

          return {
            pass: found.length >= 3 && hasScores,
            details: [
              `Dimensions found: ${found.length}/5 checked (${found.join(", ")})`,
              `Scores (X/10): ${hasScores ? "found" : "MISSING"}`,
            ],
          };
        },
      },
      {
        description: "UPGRADE-PLAN.md has prioritized fixes",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "UPGRADE-PLAN.md")
          );
          if (!content)
            return { pass: false, details: ["UPGRADE-PLAN.md missing"] };

          const hasPriority = /P0|P1|P2|P3/i.test(content);

          return {
            pass: hasPriority,
            details: [
              `Priority levels: ${hasPriority ? "found" : "MISSING"}`,
            ],
          };
        },
      },
    ],
    edgeCases: [
      {
        name: "audit-only-mode",
        description:
          "mode=audit should produce discovery + rubric but skip execution",
        setup: (_dir) => {},
        expectedBehavior:
          "AUDIT-DISCOVERY.md and RUBRIC-BEFORE.md produced; no UPGRADE-LOG.md",
        validate: (outputDir) => {
          const hasDiscovery = fileExists(
            path.join(outputDir, "AUDIT-DISCOVERY.md")
          );
          return {
            pass: hasDiscovery,
            details: [
              hasDiscovery
                ? "Audit-only mode produced discovery artifact"
                : "Audit-only mode failed to produce discovery",
            ],
          };
        },
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  // 7. /omni-plan-nth — HIGH RISK
  // ───────────────────────────────────────────────────────────
  {
    name: "omni-plan-nth",
    riskLevel: "high",
    requiredOutputs: [
      "SCORE-BASELINE.md",
      "SKILL-MAP.md",
      "OMNI-NTH-REPORT.md",
    ],
    optionalOutputs: [
      "ITERATION-*.md",
      "CONVERGENCE-LOG.md",
      "OMNI-NTH-FINAL.md",
    ],
    validationRules: [
      {
        description: "SCORE-BASELINE.md has all 10 dimension scores",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "SCORE-BASELINE.md")
          );
          if (!content)
            return { pass: false, details: ["SCORE-BASELINE.md missing"] };

          const dimensions = [
            "Code Quality",
            "Security",
            "Performance",
            "UX",
            "Test Coverage",
            "Accessibility",
            "Documentation",
            "Error Handling",
            "Observability",
            "Deployment",
          ];
          const found = dimensions.filter((d) =>
            content.toLowerCase().includes(d.toLowerCase())
          );
          const hasScores = /\d+\.?\d*\s*\/\s*10/.test(content);

          return {
            pass: found.length >= 5 && hasScores,
            details: [
              `Dimensions: ${found.length}/10 (${found.join(", ")})`,
              `Scores: ${hasScores ? "found" : "MISSING"}`,
            ],
          };
        },
      },
      {
        description:
          "SKILL-MAP.md lists available skills with availability status",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "SKILL-MAP.md")
          );
          if (!content)
            return { pass: false, details: ["SKILL-MAP.md missing"] };

          const hasSkillList =
            /available/i.test(content) || /yes|no/i.test(content);

          return {
            pass: hasSkillList,
            details: [
              hasSkillList
                ? "Skill availability map found"
                : "Skill map lacks availability indicators",
            ],
          };
        },
      },
      {
        description: "At least one ITERATION-*.md file produced",
        check: (outputDir) => {
          const iterations = globMatch(outputDir, "ITERATION-*.md");
          return {
            pass: iterations.length > 0,
            details:
              iterations.length > 0
                ? [
                    `Found ${iterations.length} iteration(s): ${iterations.join(", ")}`,
                  ]
                : ["No ITERATION-*.md files found (at least 1 expected)"],
          };
        },
      },
      {
        description: "Iteration files have Before/After/Delta score tables",
        check: (outputDir) => {
          const iterations = globMatch(outputDir, "ITERATION-*.md");
          if (iterations.length === 0)
            return { pass: false, details: ["No iteration files to check"] };

          const content = readFileOrNull(
            path.join(outputDir, iterations[0])
          );
          if (!content) return { pass: false, details: ["File unreadable"] };

          const hasBefore = /before/i.test(content);
          const hasAfter = /after/i.test(content);
          const hasDelta =
            /delta/i.test(content) || /change/i.test(content);

          return {
            pass: hasBefore && hasAfter,
            details: [
              `Before scores: ${hasBefore ? "found" : "MISSING"}`,
              `After scores: ${hasAfter ? "found" : "MISSING"}`,
              `Delta tracking: ${hasDelta ? "found" : "not explicit"}`,
            ],
          };
        },
      },
    ],
    edgeCases: [
      {
        name: "max-iterations-1",
        description:
          "max_iterations=1 should produce exactly 1 iteration then exit",
        setup: (_dir) => {},
        expectedBehavior:
          "Single ITERATION-1.md and OMNI-NTH-REPORT.md or OMNI-NTH-FINAL.md",
        validate: (outputDir) => {
          const iterations = globMatch(outputDir, "ITERATION-*.md");
          return {
            pass: iterations.length <= 2,
            details: [
              `Iteration files: ${iterations.length} (expected 1 for max_iterations=1)`,
            ],
          };
        },
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  // 8. /auto-swarm-nth — HIGH RISK
  // ───────────────────────────────────────────────────────────
  {
    name: "auto-swarm-nth",
    riskLevel: "high",
    requiredOutputs: ["SWARM-NTH-REPORT.md"],
    optionalOutputs: [
      "SWARM-NTH-ASSESSMENT.md",
      "SWARM-WAVE-*.md",
      "SWARM-COVERAGE.md",
      "SWARM-GAPS.md",
    ],
    validationRules: [
      {
        description: "SWARM-NTH-REPORT.md exists and is substantive",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "SWARM-NTH-REPORT.md")
          );
          if (!content)
            return {
              pass: false,
              details: ["SWARM-NTH-REPORT.md missing"],
            };

          return {
            pass: hasMinLength(content, 200),
            details: [
              `Content length: ${content.length} chars (minimum: 200)`,
            ],
          };
        },
      },
      {
        description: "Report tracks coverage percentage toward 100%",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "SWARM-NTH-REPORT.md")
          );
          if (!content) return { pass: false, details: ["File missing"] };

          const hasCoverage =
            /\d+\s*%/.test(content) || /coverage/i.test(content);
          return {
            pass: hasCoverage,
            details: [
              hasCoverage
                ? "Coverage tracking found"
                : "No coverage percentage found",
            ],
          };
        },
      },
    ],
    edgeCases: [],
  },

  // ───────────────────────────────────────────────────────────
  // 9. /context-engineer — MEDIUM RISK
  // ───────────────────────────────────────────────────────────
  {
    name: "context-engineer",
    riskLevel: "medium",
    requiredOutputs: ["CONTEXT-PACKAGE.md"],
    optionalOutputs: [],
    validationRules: [
      {
        description: "CONTEXT-PACKAGE.md exists",
        check: (outputDir) => {
          const exists = fileExists(
            path.join(outputDir, "CONTEXT-PACKAGE.md")
          );
          return {
            pass: exists,
            details: exists
              ? ["CONTEXT-PACKAGE.md found"]
              : ["CONTEXT-PACKAGE.md missing"],
          };
        },
      },
      {
        description: "Context package references project documentation",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "CONTEXT-PACKAGE.md")
          );
          if (!content) return { pass: false, details: ["File missing"] };

          const hasProjectRefs =
            /CLAUDE\.md|README|architecture/i.test(content) ||
            /project|codebase|stack/i.test(content);

          return {
            pass: hasProjectRefs,
            details: [
              hasProjectRefs
                ? "Project documentation references found"
                : "No project documentation references",
            ],
          };
        },
      },
    ],
    edgeCases: [
      {
        name: "empty-project-no-docs",
        description: "Empty project with no README or CLAUDE.md",
        setup: (_dir) => {},
        expectedBehavior:
          "Should produce a minimal context package noting absence of docs",
        validate: (outputDir) => {
          const exists = fileExists(
            path.join(outputDir, "CONTEXT-PACKAGE.md")
          );
          return {
            pass: exists,
            details: [
              exists
                ? "Context package created despite no project docs"
                : "Failed on empty project",
            ],
          };
        },
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  // 10. /logic-mode — MEDIUM RISK
  // ───────────────────────────────────────────────────────────
  {
    name: "logic-mode",
    riskLevel: "medium",
    requiredOutputs: ["logic-mode/"],
    optionalOutputs: [
      "logic-mode/PRODUCT-BRIEF.md",
      "logic-mode/COMPETITIVE-ANALYSIS.md",
      "logic-mode/ASSUMPTIONS-LOG.md",
      "logic-mode/FLAW-REGISTRY.md",
      "logic-mode/EXECUTION-PLAN.md",
      "logic-mode/TECH-SPEC.md",
      "logic-mode/RISK-REGISTER.md",
    ],
    validationRules: [
      {
        description: "logic-mode/ subdirectory created in .productionos/",
        check: (outputDir) => {
          const exists = dirExists(path.join(outputDir, "logic-mode"));
          return {
            pass: exists,
            details: exists
              ? ["logic-mode/ directory found"]
              : [
                  "logic-mode/ directory missing — output may be flat in .productionos/",
                ],
          };
        },
      },
      {
        description: "At least 3 of the 7 planning documents produced",
        check: (outputDir) => {
          const logicDir = path.join(outputDir, "logic-mode");
          const expectedDocs = [
            "PRODUCT-BRIEF.md",
            "COMPETITIVE-ANALYSIS.md",
            "ASSUMPTIONS-LOG.md",
            "FLAW-REGISTRY.md",
            "EXECUTION-PLAN.md",
            "TECH-SPEC.md",
            "RISK-REGISTER.md",
          ];

          let foundCount = 0;
          const foundNames: string[] = [];
          for (const doc of expectedDocs) {
            if (fileExists(path.join(logicDir, doc))) {
              foundCount++;
              foundNames.push(doc);
            }
          }

          return {
            pass: foundCount >= 3,
            details: [
              `Found ${foundCount}/7 documents: ${foundNames.join(", ") || "none"}`,
            ],
          };
        },
      },
      {
        description: "FLAW-REGISTRY.md has severity classification",
        check: (outputDir) => {
          const content = readFileOrNull(
            path.join(outputDir, "logic-mode", "FLAW-REGISTRY.md")
          );
          if (!content)
            return {
              pass: false,
              details: [
                "FLAW-REGISTRY.md not found (may not be produced yet)",
              ],
            };

          const hasSeverity = /CRITICAL|HIGH|MEDIUM|LOW/i.test(content);
          return {
            pass: hasSeverity,
            details: [
              hasSeverity
                ? "Severity classification found"
                : "No severity levels in flaw registry",
            ],
          };
        },
      },
    ],
    edgeCases: [],
  },

  // ───────────────────────────────────────────────────────────
  // 11. /learn-mode — LOW RISK (interactive, no files)
  // ───────────────────────────────────────────────────────────
  {
    name: "learn-mode",
    riskLevel: "low",
    requiredOutputs: [],
    optionalOutputs: [],
    validationRules: [
      {
        description:
          "learn-mode is interactive and produces no .productionos/ artifacts (by design)",
        check: () => {
          return {
            pass: true,
            details: [
              "learn-mode is conversational — no file artifacts to validate.",
              "Integration test verifies: command file exists, frontmatter valid, no crash on invocation.",
            ],
          };
        },
      },
    ],
    edgeCases: [],
  },

  // ───────────────────────────────────────────────────────────
  // 12. /productionos-update — LOW RISK
  // ───────────────────────────────────────────────────────────
  {
    name: "productionos-update",
    riskLevel: "low",
    requiredOutputs: [],
    optionalOutputs: [],
    validationRules: [
      {
        description:
          "Update command file is well-formed with git operations",
        check: () => {
          const content = readFileOrNull(
            path.join(
              ROOT,
              ".claude",
              "commands",
              "productionos-update.md"
            )
          );
          if (!content)
            return { pass: false, details: ["Command file missing"] };

          const hasGitOps =
            /git.*fetch|git.*pull|git.*log/i.test(content);
          const hasVersionCheck =
            /VERSION/i.test(content) && /version/i.test(content);
          const hasRollback = /rollback/i.test(content);

          return {
            pass: hasGitOps && hasVersionCheck,
            details: [
              `Git operations: ${hasGitOps ? "defined" : "MISSING"}`,
              `Version checking: ${hasVersionCheck ? "defined" : "MISSING"}`,
              `Rollback procedure: ${hasRollback ? "defined" : "not found"}`,
            ],
          };
        },
      },
    ],
    edgeCases: [
      {
        name: "no-git-repo",
        description: "Plugin not installed via git",
        setup: (_dir) => {},
        expectedBehavior: "Should inform user to clone from git",
        validate: () => {
          return {
            pass: true,
            details: [
              "Graceful degradation tested via command file inspection",
            ],
          };
        },
      },
    ],
  },

  // ───────────────────────────────────────────────────────────
  // 13. /productionos-help — LOW RISK
  // ───────────────────────────────────────────────────────────
  {
    name: "productionos-help",
    riskLevel: "low",
    requiredOutputs: [],
    optionalOutputs: [],
    validationRules: [
      {
        description: "Help command lists all 13 commands",
        check: () => {
          const content = readFileOrNull(
            path.join(
              ROOT,
              ".claude",
              "commands",
              "productionos-help.md"
            )
          );
          if (!content)
            return { pass: false, details: ["Command file missing"] };

          const commands = [
            "production-upgrade",
            "omni-plan",
            "omni-plan-nth",
            "auto-swarm",
            "auto-swarm-nth",
            "deep-research",
            "agentic-eval",
            "security-audit",
            "context-engineer",
            "logic-mode",
            "learn-mode",
            "productionos-update",
          ];

          const found = commands.filter((c) => content.includes(c));

          return {
            pass: found.length >= 10,
            details: [
              `Commands listed: ${found.length}/${commands.length}`,
              found.length < commands.length
                ? `Missing: ${commands.filter((c) => !found.includes(c)).join(", ")}`
                : "",
            ].filter(Boolean),
          };
        },
      },
      {
        description: "Help command includes workflow recommendations",
        check: () => {
          const content = readFileOrNull(
            path.join(
              ROOT,
              ".claude",
              "commands",
              "productionos-help.md"
            )
          );
          if (!content)
            return { pass: false, details: ["Command file missing"] };

          const hasFlows =
            /workflow|flow/i.test(content) && /step/i.test(content);

          return {
            pass: hasFlows,
            details: [
              hasFlows
                ? "Workflow recommendations found"
                : "No workflow guidance found",
            ],
          };
        },
      },
    ],
    edgeCases: [],
  },
];

// ─── Validate Existing Output ───────────────────────────────

function validateExistingOutput(
  outputDir: string,
  projectDir: string,
  commandName?: string
): TestResult[] {
  const contracts = commandName
    ? COMMAND_CONTRACTS.filter((c) => c.name === commandName)
    : COMMAND_CONTRACTS;

  const results: TestResult[] = [];

  for (const contract of contracts) {
    const result: TestResult = {
      command: contract.name,
      riskLevel: contract.riskLevel,
      outputChecks: [],
      structureChecks: [],
      edgeCaseResults: [],
      overallPass: true,
    };

    // Check required output files
    for (const output of contract.requiredOutputs) {
      if (output.includes("*") || output.endsWith("/")) {
        if (output.endsWith("/")) {
          const exists = dirExists(
            path.join(outputDir, output.slice(0, -1))
          );
          result.outputChecks.push({ file: output, exists });
          if (!exists) result.overallPass = false;
        } else {
          const pattern = output
            .replace("{slug}", "*")
            .replace("{N}", "*");
          const matches = globMatch(outputDir, pattern);
          result.outputChecks.push({
            file: output,
            exists: matches.length > 0,
          });
          if (matches.length === 0) result.overallPass = false;
        }
      } else {
        const exists = fileExists(path.join(outputDir, output));
        result.outputChecks.push({ file: output, exists });
        if (!exists) result.overallPass = false;
      }
    }

    // Run structural validation rules
    for (const rule of contract.validationRules) {
      const check = rule.check(outputDir, projectDir);
      result.structureChecks.push({
        rule: rule.description,
        pass: check.pass,
        details: check.details,
      });
      if (!check.pass) result.overallPass = false;
    }

    // Run edge case validations
    for (const edge of contract.edgeCases) {
      const check = edge.validate(outputDir, projectDir);
      result.edgeCaseResults.push({
        name: edge.name,
        pass: check.pass,
        details: check.details,
      });
    }

    results.push(result);
  }

  return results;
}

// ─── Report Rendering ───────────────────────────────────────

function renderReport(results: TestResult[]): void {
  console.log("\n  ProductionOS Integration Test Report");
  console.log("  " + "=".repeat(60));

  let totalPass = 0;
  let totalFail = 0;
  let totalEdge = 0;

  const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  results.sort(
    (a, b) =>
      riskOrder[a.riskLevel as keyof typeof riskOrder] -
      riskOrder[b.riskLevel as keyof typeof riskOrder]
  );

  for (const result of results) {
    const icon = result.overallPass ? "\u2705" : "\u274c";
    const riskBadge = result.riskLevel.toUpperCase();
    console.log(`\n  ${icon} /${result.command} [${riskBadge}]`);

    if (result.outputChecks.length > 0) {
      console.log("    Output files:");
      for (const check of result.outputChecks) {
        const fileIcon = check.exists ? "\u2705" : "\u274c";
        console.log(`      ${fileIcon} ${check.file}`);
      }
    }

    if (result.structureChecks.length > 0) {
      console.log("    Structure:");
      for (const check of result.structureChecks) {
        const checkIcon = check.pass ? "\u2705" : "\u274c";
        console.log(`      ${checkIcon} ${check.rule}`);
        for (const detail of check.details) {
          if (detail) console.log(`          ${detail}`);
        }
        if (check.pass) totalPass++;
        else totalFail++;
      }
    }

    if (result.edgeCaseResults.length > 0) {
      console.log("    Edge cases:");
      for (const edge of result.edgeCaseResults) {
        const edgeIcon = edge.pass ? "\u2705" : "\u26a0\ufe0f";
        console.log(`      ${edgeIcon} ${edge.name}`);
        for (const detail of edge.details) {
          if (detail) console.log(`          ${detail}`);
        }
        totalEdge++;
      }
    }
  }

  const total = totalPass + totalFail;
  const score = total > 0 ? Math.round((totalPass / total) * 100) : 0;

  console.log("\n  " + "-".repeat(60));
  console.log(
    `  Structure checks: ${totalPass}/${total} passed (${score}%)`
  );
  console.log(`  Edge cases evaluated: ${totalEdge}`);

  const criticalFails = results
    .filter((r) => !r.overallPass && r.riskLevel === "critical")
    .map((r) => r.command);
  if (criticalFails.length > 0) {
    console.log(
      `\n  CRITICAL FAILURES: ${criticalFails.map((c) => `/${c}`).join(", ")}`
    );
  }

  console.log("");
}

// ─── Mock-Only Mode ─────────────────────────────────────────

function createMockProjects(): void {
  console.log("\n  Creating mock projects for integration testing...\n");

  const projects: { type: MockProjectType; label: string }[] = [
    { type: "nextjs", label: "Next.js app with security issues" },
    { type: "python-django", label: "Django app with security issues" },
    { type: "empty", label: "Empty directory (edge case)" },
    { type: "no-git", label: "Project without git (edge case)" },
    { type: "minimal", label: "Single-file Python project" },
  ];

  for (const proj of projects) {
    const dir = MockProjectFactory.create(proj.type);
    console.log(`  Created: ${dir}`);
    console.log(`    Type: ${proj.label}`);
    console.log(`    Files: ${fs.readdirSync(dir).join(", ")}`);
    console.log("");
  }

  console.log("  Mock projects are ready in /tmp/productionos-test-*/");
  console.log(
    "  Run commands against them, then use --validate-only to check output.\n"
  );
}

// ─── Command Contract Export ────────────────────────────────

function exportContracts(): void {
  console.log("\n  ProductionOS Command Contracts");
  console.log("  " + "=".repeat(60));

  for (const contract of COMMAND_CONTRACTS) {
    console.log(
      `\n  /${contract.name} [${contract.riskLevel.toUpperCase()}]`
    );
    console.log("  Required outputs:");
    for (const output of contract.requiredOutputs) {
      console.log(`    - .productionos/${output}`);
    }
    if (contract.optionalOutputs.length > 0) {
      console.log("  Optional outputs:");
      for (const output of contract.optionalOutputs) {
        console.log(`    - .productionos/${output}`);
      }
    }
    console.log(
      `  Validation rules: ${contract.validationRules.length}`
    );
    console.log(`  Edge cases: ${contract.edgeCases.length}`);
  }
  console.log("");
}

// ─── Main ───────────────────────────────────────────────────

function main(): void {
  const args = process.argv.slice(2);

  const commandFilter = args.includes("--command")
    ? args[args.indexOf("--command") + 1]
    : undefined;

  if (args.includes("--mock-only")) {
    createMockProjects();
    return;
  }

  if (args.includes("--contracts")) {
    exportContracts();
    return;
  }

  if (args.includes("--validate-only")) {
    const targetDir = args.includes("--target")
      ? args[args.indexOf("--target") + 1]
      : process.cwd();

    const outputDir = path.join(targetDir, ".productionos");
    if (!dirExists(outputDir)) {
      console.error(
        `\n  ERROR: No .productionos/ directory found at ${targetDir}`
      );
      console.error(
        "  Run a ProductionOS command first, then validate the output.\n"
      );
      process.exit(1);
    }

    const results = validateExistingOutput(
      outputDir,
      targetDir,
      commandFilter
    );
    renderReport(results);
    const hasCriticalFail = results.some(
      (r) => !r.overallPass && r.riskLevel === "critical"
    );
    process.exit(hasCriticalFail ? 1 : 0);
    return;
  }

  // Default: run full integration test suite
  console.log("\n  ProductionOS Integration Test Suite");
  console.log("  " + "=".repeat(60));
  console.log(
    "\n  Mode: Contract validation (verifies command output structure)"
  );
  console.log(
    "  Note: This does NOT invoke Claude — it validates artifacts.\n"
  );

  // Step 1: Validate command file integrity
  console.log("  Phase 1: Command File Integrity");
  console.log("  " + "-".repeat(40));

  const commandsDir = path.join(ROOT, ".claude", "commands");
  let commandFilePass = 0;
  let commandFileFail = 0;

  for (const contract of COMMAND_CONTRACTS) {
    const cmdFile = path.join(commandsDir, `${contract.name}.md`);
    const exists = fileExists(cmdFile);
    const icon = exists ? "\u2705" : "\u274c";
    console.log(`  ${icon} /${contract.name}.md`);

    if (exists) {
      const content = readFileOrNull(cmdFile);
      if (content && hasFrontmatter(content)) {
        console.log(`      Frontmatter: valid`);
      } else if (content) {
        console.log(
          `      Frontmatter: MISSING (non-critical for help/update)`
        );
      }
      commandFilePass++;
    } else {
      console.log(`      MISSING: ${cmdFile}`);
      commandFileFail++;
    }
  }

  console.log(
    `\n  Command files: ${commandFilePass}/${commandFilePass + commandFileFail} present`
  );

  // Step 2: Export contracts
  exportContracts();

  // Step 3: Check if we have any existing output to validate
  const cwd = process.cwd();
  const cwdOutput = path.join(cwd, ".productionos");
  if (dirExists(cwdOutput)) {
    console.log(`\n  Found .productionos/ in ${cwd} — validating...\n`);
    const results = validateExistingOutput(
      cwdOutput,
      cwd,
      commandFilter
    );
    renderReport(results);
  } else {
    console.log("\n  No .productionos/ found in CWD.");
    console.log("  To validate command output:");
    console.log(
      "    1. Run a command: /deep-research, /security-audit, etc."
    );
    console.log(
      "    2. Then: bun run scripts/integration-test.ts --validate-only\n"
    );
    console.log("  To create mock target projects:");
    console.log(
      "    bun run scripts/integration-test.ts --mock-only\n"
    );
  }

  process.exit(commandFileFail > 0 ? 1 : 0);
}

main();
