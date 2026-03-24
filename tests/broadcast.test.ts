/**
 * Tests for the Inter-Agent Broadcast Protocol.
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  publish,
  subscribe,
  publishProgress,
  publishFinding,
  publishAlert,
  publishRequest,
  getWaveEvents,
  getWaveProgress,
  getFindingsSummary,
  getActiveAlerts,
  pruneChannel,
  initBroadcast,
} from "../scripts/lib/broadcast";
// Types used implicitly through function return types
// import type { BroadcastEvent } from "../scripts/lib/broadcast";

// ─── Helpers ──────────────────────────────────────────

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), "pos-broadcast-test-"));
}

// ─── Core Publish/Subscribe ───────────────────────────

describe("Broadcast: Publish/Subscribe", () => {
  let stateDir: string;

  beforeEach(() => {
    stateDir = makeTempDir();
  });

  afterEach(() => {
    try { rmSync(stateDir, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  test("publish creates event file in correct channel directory", () => {
    const event = publish(stateDir, "progress", "agent-1", "wave-1", "status", { message: "Started" });

    expect(event.channel).toBe("progress");
    expect(event.agentId).toBe("agent-1");
    expect(event.waveId).toBe("wave-1");
    expect(event.type).toBe("status");
    expect(event.payload.message).toBe("Started");
    expect(event.timestamp).toBeTruthy();

    const channelDir = join(stateDir, "broadcast", "progress");
    expect(existsSync(channelDir)).toBe(true);
    const files = readdirSync(channelDir).filter(f => f.endsWith(".json"));
    expect(files.length).toBe(1);
  });

  test("subscribe reads all events from a channel", () => {
    publish(stateDir, "findings", "agent-1", "wave-1", "finding", { severity: "high", title: "Bug 1" });
    publish(stateDir, "findings", "agent-2", "wave-1", "finding", { severity: "low", title: "Bug 2" });
    publish(stateDir, "findings", "agent-3", "wave-1", "finding", { severity: "critical", title: "Bug 3" });

    const { events, cursor } = subscribe(stateDir, "findings");
    expect(events.length).toBe(3);
    expect(cursor.lastReadFile).toBeTruthy();
  });

  test("subscribe with cursor only returns new events", () => {
    publish(stateDir, "progress", "agent-1", "wave-1", "update", { percent: 25 });
    publish(stateDir, "progress", "agent-1", "wave-1", "update", { percent: 50 });

    // First read: get all
    const { events: first, cursor } = subscribe(stateDir, "progress");
    expect(first.length).toBe(2);

    // Publish more
    publish(stateDir, "progress", "agent-1", "wave-1", "update", { percent: 75 });
    publish(stateDir, "progress", "agent-1", "wave-1", "update", { percent: 100 });

    // Second read with cursor: only new events
    const { events: second, cursor: cursor2 } = subscribe(stateDir, "progress", cursor);
    expect(second.length).toBe(2);
    expect((second[0].payload.percent as number)).toBe(75);
    expect((second[1].payload.percent as number)).toBe(100);

    // Third read: no new events
    const { events: third } = subscribe(stateDir, "progress", cursor2);
    expect(third.length).toBe(0);
  });

  test("subscribe to empty channel returns empty array", () => {
    const { events } = subscribe(stateDir, "alerts");
    expect(events.length).toBe(0);
  });

  test("events are sorted chronologically", () => {
    // Publish in rapid succession
    for (let i = 0; i < 5; i++) {
      publish(stateDir, "progress", `agent-${i + 1}`, "wave-1", "update", { order: i });
    }

    const { events } = subscribe(stateDir, "progress");
    expect(events.length).toBe(5);

    // Timestamps should be ascending
    for (let i = 1; i < events.length; i++) {
      expect(events[i].timestamp >= events[i - 1].timestamp).toBe(true);
    }
  });
});

// ─── Convenience Publishers ───────────────────────────

describe("Broadcast: Convenience Publishers", () => {
  let stateDir: string;

  beforeEach(() => {
    stateDir = makeTempDir();
  });

  afterEach(() => {
    try { rmSync(stateDir, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  test("publishProgress clamps percentage to 0-100", () => {
    publishProgress(stateDir, "agent-1", "wave-1", 150, "Overcomplete");
    publishProgress(stateDir, "agent-2", "wave-1", -10, "Undercomplete");

    const { events } = subscribe(stateDir, "progress");
    expect((events[0].payload.percentComplete as number)).toBe(100);
    expect((events[1].payload.percentComplete as number)).toBe(0);
  });

  test("publishFinding includes severity and details", () => {
    publishFinding(stateDir, "agent-1", "wave-1", "critical", "SQL Injection", "Unsanitized input", "src/api.ts", 42);

    const { events } = subscribe(stateDir, "findings");
    expect(events.length).toBe(1);
    expect(events[0].payload.severity).toBe("critical");
    expect(events[0].payload.title).toBe("SQL Injection");
    expect(events[0].payload.file).toBe("src/api.ts");
    expect(events[0].payload.line).toBe(42);
  });

  test("publishAlert sends to alerts channel", () => {
    publishAlert(stateDir, "agent-1", "wave-1", "stall", "Agent stuck on task for 5 minutes");

    const { events } = subscribe(stateDir, "alerts");
    expect(events.length).toBe(1);
    expect(events[0].type).toBe("stall");
  });

  test("publishRequest includes target agent", () => {
    publishRequest(stateDir, "agent-1", "wave-1", "agent-3", "code_review", { file: "src/index.ts" });

    const { events } = subscribe(stateDir, "requests");
    expect(events.length).toBe(1);
    expect(events[0].payload.targetAgentId).toBe("agent-3");
    expect(events[0].payload.requestType).toBe("code_review");
  });
});

// ─── Wave-Level Queries ────────────────────────────────

describe("Broadcast: Wave Queries", () => {
  let stateDir: string;

  beforeEach(() => {
    stateDir = makeTempDir();
  });

  afterEach(() => {
    try { rmSync(stateDir, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  test("getWaveEvents returns all events for a specific wave", () => {
    publish(stateDir, "progress", "agent-1", "wave-1", "update", { percent: 50 });
    publish(stateDir, "findings", "agent-1", "wave-1", "finding", { severity: "low" });
    publish(stateDir, "progress", "agent-2", "wave-2", "update", { percent: 25 }); // Different wave

    const events = getWaveEvents(stateDir, "wave-1");
    expect(events.length).toBe(2);
    expect(events.every(e => e.waveId === "wave-1")).toBe(true);
  });

  test("getWaveProgress aggregates progress across agents", () => {
    publishProgress(stateDir, "agent-1", "wave-1", 100, "Done");
    publishProgress(stateDir, "agent-2", "wave-1", 50, "Halfway");
    publishProgress(stateDir, "agent-3", "wave-1", 75, "Almost");

    const progress = getWaveProgress(stateDir, "wave-1");
    expect(Object.keys(progress.agents).length).toBe(3);
    expect(progress.agents["agent-1"].percentComplete).toBe(100);
    expect(progress.agents["agent-2"].percentComplete).toBe(50);
    expect(progress.overallPercent).toBe(75); // (100 + 50 + 75) / 3
  });

  test("getWaveProgress uses latest update per agent", () => {
    publishProgress(stateDir, "agent-1", "wave-1", 25, "Starting");
    publishProgress(stateDir, "agent-1", "wave-1", 75, "Almost done");
    publishProgress(stateDir, "agent-1", "wave-1", 100, "Complete");

    const progress = getWaveProgress(stateDir, "wave-1");
    expect(progress.agents["agent-1"].percentComplete).toBe(100);
    expect(progress.agents["agent-1"].lastMessage).toBe("Complete");
  });

  test("getFindingsSummary counts by severity", () => {
    publishFinding(stateDir, "agent-1", "wave-1", "critical", "Bug 1", "Details");
    publishFinding(stateDir, "agent-1", "wave-1", "critical", "Bug 2", "Details");
    publishFinding(stateDir, "agent-2", "wave-1", "high", "Bug 3", "Details");
    publishFinding(stateDir, "agent-3", "wave-1", "low", "Bug 4", "Details");
    publishFinding(stateDir, "agent-3", "wave-2", "critical", "Wave 2 bug", "Details"); // Different wave

    const summary = getFindingsSummary(stateDir, "wave-1");
    expect(summary.critical).toBe(2);
    expect(summary.high).toBe(1);
    expect(summary.low).toBe(1);
    expect(summary.total).toBe(4);
  });

  test("getActiveAlerts filters by wave", () => {
    publishAlert(stateDir, "agent-1", "wave-1", "stall", "Stuck");
    publishAlert(stateDir, "agent-2", "wave-2", "failure", "Crashed");

    const wave1Alerts = getActiveAlerts(stateDir, "wave-1");
    expect(wave1Alerts.length).toBe(1);
    expect(wave1Alerts[0].type).toBe("stall");

    const allAlerts = getActiveAlerts(stateDir);
    expect(allAlerts.length).toBe(2);
  });
});

// ─── Maintenance ──────────────────────────────────────

describe("Broadcast: Maintenance", () => {
  let stateDir: string;

  beforeEach(() => {
    stateDir = makeTempDir();
  });

  afterEach(() => {
    try { rmSync(stateDir, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  test("pruneChannel removes oldest events keeping N most recent", () => {
    // Create 10 events
    for (let i = 0; i < 10; i++) {
      publish(stateDir, "progress", "agent-1", "wave-1", "update", { i });
    }

    const deleted = pruneChannel(stateDir, "progress", 5);
    expect(deleted).toBe(5);

    const { events } = subscribe(stateDir, "progress");
    expect(events.length).toBe(5);
  });

  test("pruneChannel does nothing when under limit", () => {
    publish(stateDir, "alerts", "agent-1", "wave-1", "stall", { message: "test" });

    const deleted = pruneChannel(stateDir, "alerts", 100);
    expect(deleted).toBe(0);
  });

  test("initBroadcast creates all channel directories", () => {
    initBroadcast(stateDir);

    for (const channel of ["progress", "findings", "requests", "alerts"]) {
      expect(existsSync(join(stateDir, "broadcast", channel))).toBe(true);
    }
  });
});

// ─── Multi-Agent Simulation ────────────────────────────

describe("Broadcast: Multi-Agent Wave Simulation", () => {
  let stateDir: string;

  beforeEach(() => {
    stateDir = makeTempDir();
    initBroadcast(stateDir);
  });

  afterEach(() => {
    try { rmSync(stateDir, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  test("5-agent wave: each publishes progress, coordinator tracks overall", () => {
    const waveId = "wave-sim";
    const agentCount = 5;

    // Each agent publishes progress updates
    for (let a = 1; a <= agentCount; a++) {
      publishProgress(stateDir, `agent-${a}`, waveId, 20, "Starting analysis");
    }
    for (let a = 1; a <= agentCount; a++) {
      publishProgress(stateDir, `agent-${a}`, waveId, 60, "Processing");
    }
    for (let a = 1; a <= agentCount; a++) {
      publishProgress(stateDir, `agent-${a}`, waveId, 100, "Complete");
    }

    // Coordinator checks overall progress
    const progress = getWaveProgress(stateDir, waveId);
    expect(Object.keys(progress.agents).length).toBe(5);
    expect(progress.overallPercent).toBe(100);

    // All agents should show 100%
    for (let a = 1; a <= agentCount; a++) {
      expect(progress.agents[`agent-${a}`].percentComplete).toBe(100);
    }
  });

  test("agent publishes finding, coordinator reads and tallies", () => {
    publishFinding(stateDir, "agent-1", "wave-1", "high", "Missing error handling", "No try/catch around API call", "src/api.ts", 15);
    publishFinding(stateDir, "agent-2", "wave-1", "medium", "Unused import", "import { foo } from 'bar' is unused", "src/utils.ts", 1);
    publishFinding(stateDir, "agent-3", "wave-1", "critical", "Secret in code", "API key hardcoded in source", "src/config.ts", 8);

    const summary = getFindingsSummary(stateDir, "wave-1");
    expect(summary.critical).toBe(1);
    expect(summary.high).toBe(1);
    expect(summary.medium).toBe(1);
    expect(summary.total).toBe(3);
  });

  test("stall detection: agent-1 sends alert, coordinator receives", () => {
    publishProgress(stateDir, "agent-1", "wave-1", 25, "Started but stuck...");
    publishAlert(stateDir, "agent-1", "wave-1", "stall", "No progress for 5 minutes on task: review agents");

    const alerts = getActiveAlerts(stateDir, "wave-1");
    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe("stall");
    expect(alerts[0].payload.message).toContain("No progress");
  });

  test("inter-agent request: agent-1 requests review from agent-3", () => {
    publishRequest(stateDir, "agent-1", "wave-1", "agent-3", "code_review", {
      file: "agents/code-reviewer.md",
      reason: "Need second opinion on security section",
    });

    const { events } = subscribe(stateDir, "requests");
    expect(events.length).toBe(1);
    expect(events[0].payload.targetAgentId).toBe("agent-3");
    expect(events[0].payload.requestType).toBe("code_review");
    expect(events[0].payload.file).toBe("agents/code-reviewer.md");
  });
});
