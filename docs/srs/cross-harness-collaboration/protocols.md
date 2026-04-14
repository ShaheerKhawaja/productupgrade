# Cross-Harness Collaboration Protocols

## Purpose

This document defines the canonical collaboration protocols for ProductionOS cross-harness work. These protocols sit above host-specific runtime behavior and below workflow-specific skills or commands.

The protocol stack extends existing ProductionOS primitives:

- artifact manifests from `templates/INVOCATION-PROTOCOL.md`
- broadcast channels from `scripts/lib/broadcast.ts`
- file ownership and integration requests from `scripts/lib/file-ownership.ts`
- session handoff from existing stop and resume behavior
- worktree merge and preflight rules from `scripts/worktree-manager.ts`

## Protocol Stack

| Layer | Purpose | Canonical form |
|-------|---------|----------------|
| Handoff | cross-agent and cross-provider transfer of work | versioned markdown artifact with manifest |
| Events | progress, findings, alerts, requests, telemetry | versioned JSON event |
| Ownership | write and readonly scope control | JSON ownership map |
| Review | findings, verification, and signoff boundaries | review findings JSON plus review summary artifact |
| Approval | protected operation gate | approval request and decision JSON |
| Session | session creation, pause, resume, recovery | session record JSON |

## Canonical Storage Layout

The collaboration kernel keeps existing stable paths and introduces versioned records beside them.

```text
.productionos/
├── broadcast/
│   ├── progress/
│   ├── findings/
│   ├── requests/
│   └── alerts/
├── integration-requests/
│   └── {wave-id}/
├── collaboration/
│   ├── tasks/{task-id}.json
│   ├── waves/{wave-id}.json
│   ├── sessions/{session-id}.json
│   ├── handoffs/{artifact-id}.md
│   ├── reviews/{review-id}.json
│   ├── approvals/{approval-id}.json
│   └── telemetry/{date}.jsonl
└── sessions/
    └── handoff-{date}.md
```

Compatibility rules:

- `.productionos/broadcast/` remains canonical for event channels.
- `.productionos/integration-requests/` remains canonical for readonly-to-writer requests.
- legacy handoff files remain valid if they satisfy manifest validation.
- new collaboration artifacts must include schema version metadata.

## Handoff Protocol

### HandoffArtifact

Required frontmatter:

```yaml
---
schema: pos.handoff.v1
artifact_id: handoff-uuid
task_id: task-uuid
wave_id: wave-uuid
session_id: session-uuid
producer:
  participant_id: planner-1
  role: planner
  runtime_id: claude-code
consumer:
  participant_id: builder-1
  role: builder
  runtime_id: codex
status: complete
stakes: medium
degradation_flags: []
created_at: 2026-04-11T18:00:00Z
input_artifacts:
  - wave-plan-uuid
owned_scope:
  writable_files: []
  writable_dirs:
    - src/
  readonly_files: []
  readonly_dirs:
    - docs/
---
```

Required body sections:

- `Summary`
- `Evidence`
- `Files and Scope`
- `Open Risks`
- `Next Action`
- `Validation`

Protocol rules:

- every cross-provider handoff must produce a `HandoffArtifact`
- every consuming participant must validate the manifest before use
- status values are `complete`, `partial`, `blocked`, or `failed`
- `partial` and `blocked` artifacts must include unresolved risks and required follow-up
- artifact consumers may not rely on hidden provider chat state

### Handoff Validation

Before consuming a handoff artifact:

1. file exists
2. first five lines contain manifest delimiters
3. `schema`, `artifact_id`, `producer`, `status`, and `created_at` exist
4. `status` is not `failed`
5. `owned_scope` exists for artifacts that transfer writable responsibility

Failure outcomes:

- `MISSING`
- `MALFORMED`
- `INVALID_MANIFEST`
- `FAILED_ARTIFACT`
- `STALE_SCOPE`

Any failure records a downgrade flag and blocks direct consumption of writable authority.

## Event Protocol

### BroadcastEvent

```json
{
  "schema": "pos.event.v1",
  "channel": "progress",
  "event_id": "evt-uuid",
  "agent_id": "builder-1",
  "wave_id": "wave-uuid",
  "task_id": "task-uuid",
  "session_id": "session-uuid",
  "type": "progress_update",
  "payload": {
    "percent_complete": 55,
    "message": "Builder completed parser changes"
  },
  "runtime_id": "codex",
  "timestamp": "2026-04-11T18:02:00Z"
}
```

Channels:

- `progress`
- `findings`
- `requests`
- `alerts`
- `telemetry` is persisted separately as jsonl for bulk reporting

Required event types:

- `progress_update`
- `finding`
- `agent_request`
- `stall`
- `failure`
- `regression`
- `approval_requested`
- `approval_decided`
- `session_paused`
- `session_resumed`
- `downgrade_recorded`

Event rules:

- filenames must remain sortable by time
- writes must be atomic
- consumers must tolerate corrupt or partial files by skipping invalid events
- every event must carry `wave_id` when emitted inside a wave
- every downgrade must emit `downgrade_recorded`

## Ownership Protocol

### OwnershipMap

```json
{
  "schema": "pos.ownership.v1",
  "wave_id": "wave-uuid",
  "computed_at": "2026-04-11T18:01:00Z",
  "isolation_mode": "worktree",
  "agents": {
    "builder-1": {
      "writable_files": ["src/runtime/adapter.ts"],
      "writable_dirs": [],
      "readonly_files": ["package.json"],
      "readonly_dirs": ["templates/", "hooks/", "scripts/lib/"]
    },
    "reviewer-1": {
      "writable_files": [],
      "writable_dirs": [],
      "readonly_files": ["src/runtime/adapter.ts"],
      "readonly_dirs": ["src/", "docs/"]
    }
  },
  "shared_files": [],
  "downgrade_flags": []
}
```

Ownership rules:

- default isolation mode is `worktree`
- same-worktree mode is valid only if one participant is the designated writer
- if more than one participant claims the same writable file, the file is demoted to readonly for all claimants
- shared infrastructure paths remain readonly
- `.productionos/` remains writable to all participants for artifacts and requests

### IntegrationRequest

Readonly participants use integration requests instead of direct writes.

```json
{
  "schema": "pos.integration-request.v1",
  "request_id": "ir-uuid",
  "wave_id": "wave-uuid",
  "target_file": "src/runtime/adapter.ts",
  "action": "edit",
  "reason": "Reviewer requires guardrail change before merge",
  "requested_by": "reviewer-1",
  "priority": 1,
  "group_id": "optional-transaction-group",
  "status": "complete"
}
```

Integration request rules:

- only writers may apply requested code changes
- reviewers and readonly participants must never bypass the request path
- grouped requests are all-or-nothing

## Review Protocol

### ReviewFinding

```json
{
  "schema": "pos.review-finding.v1",
  "finding_id": "finding-uuid",
  "task_id": "task-uuid",
  "wave_id": "wave-uuid",
  "review_id": "review-uuid",
  "severity": "high",
  "confidence": 0.88,
  "category": "trust-boundary",
  "title": "Builder consumed malformed handoff without validation",
  "evidence": [
    {
      "artifact": "handoff-uuid",
      "path": "docs/srs/cross-harness-collaboration/protocols.md",
      "line": 1
    }
  ],
  "required_action": "Validate manifest before consuming writable scope",
  "verifier": {
    "participant_id": "reviewer-1",
    "role": "reviewer",
    "runtime_id": "claude-code"
  },
  "status": "open"
}
```

Review rules:

- builders may not self-verify high-stakes modifications
- reviewers must be a distinct role from builders
- medium- and high-stakes flows must use cross-audit by another role or provider when available
- findings-first output remains mandatory
- a task cannot reach `merge_pending` until all blocking findings are closed or explicitly waived by approval

## Approval Protocol

### ApprovalRequest

```json
{
  "schema": "pos.approval.v1",
  "approval_id": "approval-uuid",
  "task_id": "task-uuid",
  "wave_id": "wave-uuid",
  "requested_by": {
    "participant_id": "builder-1",
    "runtime_id": "codex"
  },
  "operation": "merge-worktree",
  "reason": "Protected merge after high-stakes review closure",
  "stakes": "high",
  "artifacts": [
    "handoff-uuid",
    "review-uuid"
  ],
  "status": "pending",
  "created_at": "2026-04-11T18:10:00Z"
}
```

Approval rules:

- protected operations include merge, push, deploy, auth changes, secrets-related edits, and policy overrides
- host-native approvals may be used when available
- ProductionOS-managed approvals are the fallback when the host lacks approval support
- denial blocks the operation and records a blocked task state

## Session Protocol

### Session Record

```json
{
  "schema": "pos.session.v1",
  "session_id": "session-uuid",
  "runtime_id": "codex",
  "runtime_mode": "plugin",
  "host_session_ref": "provider-local-session",
  "status": "running",
  "task_ids": ["task-uuid"],
  "wave_ids": ["wave-uuid"],
  "downgrade_flags": ["no_streaming"],
  "created_at": "2026-04-11T17:55:00Z",
  "last_checkpoint_at": "2026-04-11T18:05:00Z"
}
```

Session states:

- `created`
- `running`
- `paused`
- `recovering`
- `blocked`
- `complete`
- `failed`

Session rules:

- pause writes a handoff artifact and session checkpoint
- resume must validate the latest handoff artifact before continuing
- crash recovery rebuilds state from session record, wave plan, ownership map, and artifacts
- host-local session references are optional metadata, not the collaboration source of truth

## Degradation Protocol

Standard downgrade flags:

- `no_subagents`
- `no_worktrees`
- `no_streaming`
- `no_hooks`
- `no_host_approvals`
- `single_runtime_only`
- `same_worktree_exception`

Rules:

- downgrade flags must appear in task, wave, and session records
- downgrade flags must be emitted as events
- any approval or review artifact produced in degraded mode must restate active downgrade flags

## Security and Integrity Rules

- every artifact must declare schema version
- high-stakes artifacts should record a digest when available
- malformed artifacts may be read for forensics but not trusted for execution
- readonly participants may not mutate claimed target files
- no protocol may require undocumented provider behavior

## Protocol Acceptance Checklist

The protocol layer is complete only if:

- a planner, builder, reviewer, and approver can collaborate without hidden shared memory
- a degraded host can still participate with explicit downgrade flags
- every writable action is tied to an ownership decision
- every protected action is tied to an approval decision
- every review can be traced to a distinct reviewer identity
