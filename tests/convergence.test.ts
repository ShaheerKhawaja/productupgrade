import { describe, test, expect } from "bun:test";
import { ROOT, readFileOrNull } from "../scripts/lib/shared";
import { join } from "path";

// ─── Constants ───────────────────────────────────────────────

const CONVERGENCE_FILE = join(ROOT, "algorithms", "convergence-detection.md");
const content = readFileOrNull(CONVERGENCE_FILE);

/** Named algorithms that must be defined in the specification */
const EXPECTED_ALGORITHMS = [
  "Score-Based Convergence",
  "Semantic Convergence",
  "Diminishing Returns Detection",
  "Oscillation Detection",
  "Plateau Detection",
  "EMA Improvement Velocity Model",
];

/** Minimum number of named algorithms required */
const MIN_ALGORITHMS = 5;

/** Minimum line count for the specification */
const MIN_LINES = 1000;

// ─── Tests ───────────────────────────────────────────────────

describe("Convergence Detection Specification", () => {
  test("convergence-detection.md file exists and has >1000 lines", () => {
    expect(content).not.toBeNull();
    const lines = content!.split("\n");
    expect(lines.length).toBeGreaterThan(MIN_LINES);
  });

  test("defines at least 5 named algorithms", () => {
    expect(content).not.toBeNull();

    const foundAlgorithms: string[] = [];
    for (const algo of EXPECTED_ALGORITHMS) {
      if (content!.includes(algo)) {
        foundAlgorithms.push(algo);
      }
    }

    expect(foundAlgorithms.length).toBeGreaterThanOrEqual(MIN_ALGORITHMS);
  });

  test("specification contains parameter definitions (thresholds, constants, configs)", () => {
    expect(content).not.toBeNull();
    // The spec must define numeric thresholds/parameters somewhere
    const hasThresholds =
      content!.includes("threshold") ||
      content!.includes("Threshold") ||
      content!.includes("PATIENCE") ||
      content!.includes("patience") ||
      /[A-Z_]{3,}\s*[=:]\s*\d/.test(content!);
    expect(hasThresholds).toBe(true);
  });

  test("specification defines convergence decisions (CONTINUE, CONVERGED, etc.)", () => {
    expect(content).not.toBeNull();
    // The spec must define what decisions the engine can make
    const decisions = ["CONTINUE", "CONVERGED", "DEGRADED", "MAX_REACHED"];
    const found = decisions.filter((d) => content!.includes(d));
    expect(found.length).toBeGreaterThanOrEqual(3);
  });
});

describe("Unified Convergence Engine", () => {
  test("has a priority ordering section", () => {
    expect(content).not.toBeNull();

    // The unified engine must define decision priority
    const hasPriorityOrdering =
      content!.includes("Priority") &&
      (content!.includes("highest to lowest") ||
        content!.includes("DEGRADED") ||
        content!.includes("Priority 1"));

    expect(hasPriorityOrdering).toBe(true);
  });
});

describe("Regression Detection", () => {
  test("regression detection is defined (dimension drop > 0.5)", () => {
    expect(content).not.toBeNull();

    // Check that the dimension regression threshold of 0.5 is defined
    const hasRegressionThreshold =
      content!.includes("DIMENSION_REGRESSION_THRESHOLD") &&
      content!.includes("0.5");

    expect(hasRegressionThreshold).toBe(true);

    // Also verify that DEGRADED verdict is tied to regression
    const hasDegradedOnRegression =
      content!.includes("DEGRADED") && content!.includes("regression");

    expect(hasDegradedOnRegression).toBe(true);
  });
});

describe("Termination Guarantee", () => {
  test("MAX_ITERATIONS is defined as a termination guarantee", () => {
    expect(content).not.toBeNull();

    // MAX_ITERATIONS must be defined
    expect(content!.includes("MAX_ITERATIONS")).toBe(true);

    // It should be set to a concrete value (20 is the default)
    expect(content!.includes("max_iterations")).toBe(true);

    // MAX_REACHED verdict must exist as the forced exit
    expect(content!.includes("MAX_REACHED")).toBe(true);
  });
});

describe("Academic Foundations", () => {
  test("the file references at least 3 academic citations", () => {
    expect(content).not.toBeNull();

    // Known citation patterns in the file
    const citationPatterns = [
      /Madaan\s+et\s+al/,
      /Shinn\s+et\s+al/,
      /Zheng\s+et\s+al/,
      /Page\s+1954/,
      /Killick\s+et\s+al/,
      /Li\s+et\s+al/,
      /Adams\s+et\s+al/,
      /arxiv\s+\d+\.\d+/,
      /NeurIPS/,
      /Biometrika/,
      /ICLR/,
    ];

    let citationCount = 0;
    for (const pattern of citationPatterns) {
      if (pattern.test(content!)) {
        citationCount++;
      }
    }

    expect(citationCount).toBeGreaterThanOrEqual(3);
  });
});
