import { describe, test, expect } from "bun:test";
import { classifyIntent, getAgentIndex } from "../scripts/agent-index";

describe("agent-index", () => {
  const { agents } = getAgentIndex();

  describe("scanAgents", () => {
    test("returns entries with required fields", () => {
      expect(agents.length).toBeGreaterThan(0);
      for (const agent of agents) {
        expect(agent.name).toBeTruthy();
        expect(agent.description).toBeTruthy();
        expect(Array.isArray(agent.keywords)).toBe(true);
        expect(agent.keywords.length).toBeGreaterThan(0);
        expect(typeof agent.stakes).toBe("string");
        expect(typeof agent.filePath).toBe("string");
        expect(typeof agent.mtime).toBe("number");
      }
    });

    test("scans all agent files", () => {
      expect(agents.length).toBeGreaterThanOrEqual(70);
    });
  });

  describe("classifyIntent", () => {
    test("ranks security agents high for 'fix auth bugs'", () => {
      const result = classifyIntent("fix auth bugs", agents);
      expect(result.lowConfidence).toBe(false);
      expect(result.agents.length).toBeGreaterThan(0);
      const names = result.agents.map(a => a.name);
      const hasSecurityAgent = names.some(n =>
        ["security-hardener", "vulnerability-explorer", "code-reviewer", "semgrep-scanner"].includes(n)
      );
      expect(hasSecurityAgent).toBe(true);
    });

    test("ranks frontend agents high for 'redesign dashboard'", () => {
      const result = classifyIntent("redesign the dashboard UI", agents);
      expect(result.agents.length).toBeGreaterThan(0);
      const names = result.agents.map(a => a.name);
      const hasFrontendAgent = names.some(n =>
        ["frontend-designer", "designer-upgrade", "design-system-architect", "ux-auditor"].includes(n)
      );
      expect(hasFrontendAgent).toBe(true);
    });

    test("returns lowConfidence for empty goal", () => {
      const result = classifyIntent("", agents);
      expect(result.lowConfidence).toBe(true);
      expect(result.agents).toHaveLength(0);
    });

    test("returns lowConfidence for gibberish", () => {
      const result = classifyIntent("xyzzy qwfp zxcv", agents);
      expect(result.lowConfidence).toBe(true);
    });

    test("confidence scores are between 0 and 1", () => {
      const result = classifyIntent("plan the architecture for video pipeline", agents);
      for (const agent of result.agents) {
        expect(agent.confidence).toBeGreaterThanOrEqual(0);
        expect(agent.confidence).toBeLessThanOrEqual(1);
      }
    });

    test("returns at most 7 agents", () => {
      const result = classifyIntent("fix all security and code quality bugs in the frontend", agents);
      expect(result.agents.length).toBeLessThanOrEqual(7);
    });
  });

  describe("getAgentIndex", () => {
    test("returns agents array and fromCache boolean", () => {
      const index = getAgentIndex();
      expect(Array.isArray(index.agents)).toBe(true);
      expect(typeof index.fromCache).toBe("boolean");
    });
  });
});
