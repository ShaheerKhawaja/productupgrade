/**
 * Inter-Agent Broadcast Protocol — file-based pub/sub for agent coordination.
 *
 * Agents publish events to .productionos/broadcast/{channel}/{timestamp}-{agentId}.json
 * Subscribers poll channels by reading files since their last read timestamp.
 *
 * Channels: progress, findings, requests, alerts
 * Events: { channel, agentId, waveId, type, payload, timestamp }
 *
 * Zero external dependencies — uses only Node.js/Bun builtins.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, renameSync, unlinkSync } from "fs";
import { join } from "path";

// ─── Types ─────────────────────────────────────────────

export type BroadcastChannel = "progress" | "findings" | "requests" | "alerts";

export interface BroadcastEvent {
  channel: BroadcastChannel;
  agentId: string;
  waveId: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface SubscriptionCursor {
  channel: BroadcastChannel;
  lastReadTimestamp: string;
  lastReadFile: string;
}

// ─── Constants ─────────────────────────────────────────

const CHANNELS: BroadcastChannel[] = ["progress", "findings", "requests", "alerts"];

const MAX_EVENTS_PER_CHANNEL = 1000;

/** Monotonic counter to prevent filename collisions within the same millisecond */
let _publishSeq = 0;

// ─── Core Functions ────────────────────────────────────

/**
 * Publish an event to a broadcast channel.
 * Writes atomically to prevent partial reads.
 */
export function publish(
  stateDir: string,
  channel: BroadcastChannel,
  agentId: string,
  waveId: string,
  type: string,
  payload: Record<string, unknown>,
): BroadcastEvent {
  const now = new Date();
  const ts = now.toISOString();
  // Filename: sortable timestamp + sequence + PID + agent ID for cross-process uniqueness
  const seq = String(++_publishSeq).padStart(6, "0");
  const pid = String(process.pid).padStart(6, "0");
  const filename = `${now.getTime()}-${seq}-${pid}-${agentId.replace(/[^a-zA-Z0-9-]/g, "_")}.json`;
  const channelDir = join(stateDir, "broadcast", channel);
  mkdirSync(channelDir, { recursive: true });

  const event: BroadcastEvent = { channel, agentId, waveId, type, payload, timestamp: ts };

  const filePath = join(channelDir, filename);
  const tmpPath = filePath + ".tmp." + process.pid;
  writeFileSync(tmpPath, JSON.stringify(event, null, 2));
  try {
    renameSync(tmpPath, filePath);
  } catch {
    writeFileSync(filePath, JSON.stringify(event, null, 2));
    try { unlinkSync(tmpPath); } catch { /* ignore */ }
  }

  return event;
}

/**
 * Subscribe to a channel: read all events since a cursor (or all events if no cursor).
 * Returns events sorted by timestamp ascending.
 */
export function subscribe(
  stateDir: string,
  channel: BroadcastChannel,
  cursor?: SubscriptionCursor,
): { events: BroadcastEvent[]; cursor: SubscriptionCursor } {
  const channelDir = join(stateDir, "broadcast", channel);
  if (!existsSync(channelDir)) {
    return {
      events: [],
      cursor: cursor || { channel, lastReadTimestamp: "", lastReadFile: "" },
    };
  }

  const files = readdirSync(channelDir)
    .filter(f => f.endsWith(".json") && !f.endsWith(".tmp"))
    .sort(); // Lexicographic sort = chronological (timestamp prefix)

  const events: BroadcastEvent[] = [];
  let lastFile = cursor?.lastReadFile || "";
  let lastTs = cursor?.lastReadTimestamp || "";

  for (const file of files) {
    // Skip files we've already read
    if (cursor && file <= (cursor.lastReadFile || "")) continue;

    try {
      const content = readFileSync(join(channelDir, file), "utf-8");
      const event = JSON.parse(content) as BroadcastEvent;
      if (event.channel && event.agentId && event.timestamp) {
        events.push(event);
        lastFile = file;
        lastTs = event.timestamp;
      }
    } catch {
      // Skip corrupt events
    }
  }

  return {
    events,
    cursor: {
      channel,
      lastReadTimestamp: lastTs || cursor?.lastReadTimestamp || "",
      lastReadFile: lastFile || cursor?.lastReadFile || "",
    },
  };
}

/**
 * Publish a progress update (convenience wrapper).
 */
export function publishProgress(
  stateDir: string,
  agentId: string,
  waveId: string,
  percentComplete: number,
  message: string,
): BroadcastEvent {
  return publish(stateDir, "progress", agentId, waveId, "progress_update", {
    percentComplete: Math.min(100, Math.max(0, percentComplete)),
    message,
  });
}

/**
 * Publish a finding (issue, gap, etc.).
 */
export function publishFinding(
  stateDir: string,
  agentId: string,
  waveId: string,
  severity: "critical" | "high" | "medium" | "low",
  title: string,
  details: string,
  file?: string,
  line?: number,
): BroadcastEvent {
  return publish(stateDir, "findings", agentId, waveId, "finding", {
    severity, title, details, file, line,
  });
}

/**
 * Publish an alert (urgent, needs attention).
 */
export function publishAlert(
  stateDir: string,
  agentId: string,
  waveId: string,
  alertType: "stall" | "failure" | "regression" | "budget_exceeded",
  message: string,
): BroadcastEvent {
  return publish(stateDir, "alerts", agentId, waveId, alertType, { message });
}

/**
 * Publish a request to another agent.
 */
export function publishRequest(
  stateDir: string,
  fromAgentId: string,
  waveId: string,
  targetAgentId: string,
  requestType: string,
  details: Record<string, unknown>,
): BroadcastEvent {
  return publish(stateDir, "requests", fromAgentId, waveId, "agent_request", {
    targetAgentId, requestType, ...details,
  });
}

/**
 * Get all events for a wave across all channels.
 * Useful for wave synthesis/summary.
 */
export function getWaveEvents(stateDir: string, waveId: string): BroadcastEvent[] {
  const allEvents: BroadcastEvent[] = [];

  for (const channel of CHANNELS) {
    const { events } = subscribe(stateDir, channel);
    for (const event of events) {
      if (event.waveId === waveId) {
        allEvents.push(event);
      }
    }
  }

  return allEvents.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/**
 * Get wave progress summary across all agents.
 */
export function getWaveProgress(stateDir: string, waveId: string): {
  agents: Record<string, { percentComplete: number; lastMessage: string; lastUpdate: string }>;
  overallPercent: number;
} {
  const { events } = subscribe(stateDir, "progress");
  const agentProgress: Record<string, { percentComplete: number; lastMessage: string; lastUpdate: string }> = {};

  for (const event of events) {
    if (event.waveId !== waveId) continue;
    if (event.type !== "progress_update") continue;

    agentProgress[event.agentId] = {
      percentComplete: (event.payload.percentComplete as number) || 0,
      lastMessage: (event.payload.message as string) || "",
      lastUpdate: event.timestamp,
    };
  }

  const agents = Object.values(agentProgress);
  const overallPercent = agents.length > 0
    ? agents.reduce((sum, a) => sum + a.percentComplete, 0) / agents.length
    : 0;

  return { agents: agentProgress, overallPercent };
}

/**
 * Get findings summary by severity.
 */
export function getFindingsSummary(stateDir: string, waveId?: string): {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
} {
  const { events } = subscribe(stateDir, "findings");
  const summary = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };

  for (const event of events) {
    if (waveId && event.waveId !== waveId) continue;
    if (event.type !== "finding") continue;

    const severity = event.payload.severity as string;
    if (severity in summary) {
      summary[severity as keyof typeof summary]++;
    }
    summary.total++;
  }

  return summary;
}

/**
 * Check for active alerts.
 */
export function getActiveAlerts(stateDir: string, waveId?: string): BroadcastEvent[] {
  const { events } = subscribe(stateDir, "alerts");
  return events.filter(e => !waveId || e.waveId === waveId);
}

/**
 * Prune old events from a channel (keep last N).
 * Call periodically to prevent unbounded growth.
 */
export function pruneChannel(stateDir: string, channel: BroadcastChannel, keepCount: number = MAX_EVENTS_PER_CHANNEL): number {
  const channelDir = join(stateDir, "broadcast", channel);
  if (!existsSync(channelDir)) return 0;

  const files = readdirSync(channelDir)
    .filter(f => f.endsWith(".json") && !f.endsWith(".tmp"))
    .sort();

  if (files.length <= keepCount) return 0;

  const toDelete = files.slice(0, files.length - keepCount);
  let deleted = 0;
  for (const file of toDelete) {
    try {
      unlinkSync(join(channelDir, file));
      deleted++;
    } catch { /* ignore */ }
  }

  return deleted;
}

/**
 * Initialize broadcast directories for a wave.
 */
export function initBroadcast(stateDir: string): void {
  for (const channel of CHANNELS) {
    mkdirSync(join(stateDir, "broadcast", channel), { recursive: true });
  }
}
