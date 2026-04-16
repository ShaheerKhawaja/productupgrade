#!/usr/bin/env bun
/**
 * Cross-Harness Collaboration Protocol
 *
 * Enables two sessions (Claude+Claude, Claude+Codex, Codex+Codex) to
 * co-work on the same repo via shared artifacts and event messages.
 *
 * Communication is file-based and poll-based — no shared process or socket.
 * Sessions write events to a shared JSONL file and poll for new messages.
 *
 * Usage:
 *   bun run scripts/collaboration/protocol.ts init [session-name]
 *   bun run scripts/collaboration/protocol.ts send [to] [type] [message]
 *   bun run scripts/collaboration/protocol.ts poll [session-name]
 *   bun run scripts/collaboration/protocol.ts status
 *   bun run scripts/collaboration/protocol.ts claim [file-path]
 *   bun run scripts/collaboration/protocol.ts release [file-path]
 */

import { mkdirSync, readFileSync, writeFileSync, appendFileSync, existsSync } from "fs";
import { join } from "path";

const COLLAB_DIR = join(process.cwd(), ".productionos", "collaboration");
const MESSAGES_FILE = join(COLLAB_DIR, "messages.jsonl");
const STATUS_FILE = join(COLLAB_DIR, "status.json");
const PLAN_FILE = join(COLLAB_DIR, "plan.md");
const OWNERSHIP_FILE = join(COLLAB_DIR, "ownership.json");

interface CollabMessage {
  timestamp: string;
  from: string;
  to: string | "*";
  type: "task-assigned" | "task-complete" | "finding" | "question" | "status-update" | "file-claim" | "file-release";
  payload: Record<string, unknown>;
}

interface SessionStatus {
  sessions: Record<string, {
    name: string;
    started: string;
    lastActive: string;
    status: "active" | "paused" | "done";
    worktree?: string;
    currentTask?: string;
  }>;
}

interface OwnershipMap {
  files: Record<string, {
    owner: string;
    claimed: string;
    mode: "exclusive" | "readonly";
  }>;
}

function ensureDir(): void {
  mkdirSync(COLLAB_DIR, { recursive: true });
  if (!existsSync(MESSAGES_FILE)) writeFileSync(MESSAGES_FILE, "");
  if (!existsSync(STATUS_FILE)) writeFileSync(STATUS_FILE, JSON.stringify({ sessions: {} }, null, 2));
  if (!existsSync(OWNERSHIP_FILE)) writeFileSync(OWNERSHIP_FILE, JSON.stringify({ files: {} }, null, 2));
}

function readStatus(): SessionStatus {
  try {
    return JSON.parse(readFileSync(STATUS_FILE, "utf-8"));
  } catch {
    return { sessions: {} };
  }
}

function writeStatus(status: SessionStatus): void {
  writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
}

function readOwnership(): OwnershipMap {
  try {
    return JSON.parse(readFileSync(OWNERSHIP_FILE, "utf-8"));
  } catch {
    return { files: {} };
  }
}

function writeOwnership(ownership: OwnershipMap): void {
  writeFileSync(OWNERSHIP_FILE, JSON.stringify(ownership, null, 2));
}

function sendMessage(msg: CollabMessage): void {
  appendFileSync(MESSAGES_FILE, JSON.stringify(msg) + "\n");
}

function readMessages(since?: string): CollabMessage[] {
  if (!existsSync(MESSAGES_FILE)) return [];
  const lines = readFileSync(MESSAGES_FILE, "utf-8").trim().split("\n").filter(Boolean);
  const messages = lines.map((line) => {
    try { return JSON.parse(line) as CollabMessage; }
    catch { return null; }
  }).filter(Boolean) as CollabMessage[];
  if (since) {
    return messages.filter((m) => m.timestamp > since);
  }
  return messages;
}

// === Commands ===

const [, , command, ...args] = process.argv;

switch (command) {
  case "init": {
    const sessionName = args[0] || `session-${Date.now()}`;
    ensureDir();
    const status = readStatus();
    status.sessions[sessionName] = {
      name: sessionName,
      started: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      status: "active",
    };
    writeStatus(status);
    if (!existsSync(PLAN_FILE)) {
      writeFileSync(PLAN_FILE, `# Collaboration Plan\n\nCreated: ${new Date().toISOString()}\nSessions: ${sessionName}\n\n## Tasks\n\n- [ ] (assign tasks here)\n`);
    }
    console.log(JSON.stringify({ ok: true, session: sessionName, dir: COLLAB_DIR }));
    break;
  }

  case "send": {
    const [to, type, ...messageParts] = args;
    if (!to || !type) {
      console.error("Usage: send [to] [type] [message]");
      process.exit(1);
    }
    ensureDir();
    const msg: CollabMessage = {
      timestamp: new Date().toISOString(),
      from: process.env.COLLAB_SESSION || "unknown",
      to,
      type: type as CollabMessage["type"],
      payload: { message: messageParts.join(" ") },
    };
    sendMessage(msg);
    console.log(JSON.stringify({ ok: true, sent: msg }));
    break;
  }

  case "poll": {
    const sessionName = args[0];
    const since = args[1]; // ISO timestamp
    const messages = readMessages(since);
    const relevant = sessionName
      ? messages.filter((m) => m.to === sessionName || m.to === "*")
      : messages;
    console.log(JSON.stringify({ messages: relevant, count: relevant.length }));
    break;
  }

  case "status": {
    ensureDir();
    const status = readStatus();
    const ownership = readOwnership();
    console.log(JSON.stringify({ sessions: status.sessions, files: ownership.files }, null, 2));
    break;
  }

  case "claim": {
    const filePath = args[0];
    const sessionName = args[1] || process.env.COLLAB_SESSION || "unknown";
    if (!filePath) {
      console.error("Usage: claim [file-path] [session-name]");
      process.exit(1);
    }
    ensureDir();
    const ownership = readOwnership();
    if (ownership.files[filePath] && ownership.files[filePath].owner !== sessionName) {
      console.log(JSON.stringify({ ok: false, error: `File claimed by ${ownership.files[filePath].owner}` }));
      process.exit(1);
    }
    ownership.files[filePath] = {
      owner: sessionName,
      claimed: new Date().toISOString(),
      mode: "exclusive",
    };
    writeOwnership(ownership);
    sendMessage({
      timestamp: new Date().toISOString(),
      from: sessionName,
      to: "*",
      type: "file-claim",
      payload: { file: filePath },
    });
    console.log(JSON.stringify({ ok: true, claimed: filePath }));
    break;
  }

  case "release": {
    const filePath = args[0];
    if (!filePath) {
      console.error("Usage: release [file-path]");
      process.exit(1);
    }
    ensureDir();
    const ownership = readOwnership();
    const sessionName = args[1] || process.env.COLLAB_SESSION || "unknown";
    delete ownership.files[filePath];
    writeOwnership(ownership);
    sendMessage({
      timestamp: new Date().toISOString(),
      from: sessionName,
      to: "*",
      type: "file-release",
      payload: { file: filePath },
    });
    console.log(JSON.stringify({ ok: true, released: filePath }));
    break;
  }

  default:
    console.log(`Cross-Harness Collaboration Protocol

Commands:
  init [name]              Register this session
  send [to] [type] [msg]   Send message to another session
  poll [name] [since]      Read messages for this session
  status                   Show active sessions and file ownership
  claim [file] [name]      Claim exclusive access to a file
  release [file]           Release file ownership

Message types: task-assigned, task-complete, finding, question, status-update, file-claim, file-release
`);
}
