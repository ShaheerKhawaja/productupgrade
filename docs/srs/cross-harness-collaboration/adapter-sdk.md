# Cross-Harness Adapter SDK

## Purpose

This document defines the provider-neutral contract that lets ProductionOS run as:

- a native harness
- an embedded orchestration layer
- a host-native plugin surface
- a third-party harness integration target

The SDK is intentionally host-agnostic. Claude Code and Codex are first-party adapters, not special cases in the kernel.

## Design Constraints

- The adapter contract must be sufficient to stub a new harness without making behavioral design decisions.
- The kernel may only depend on declared capabilities.
- Hidden host session state is not a required dependency.
- Plugin mode and embedded mode share the same adapter contract.
- Any unsupported capability must degrade through explicit metadata, not silent omission.

## Adapter Lifecycle

1. `load`
Resolve adapter manifest and instantiate adapter.

2. `probe`
Discover capabilities, limits, and runtime identity.

3. `session create or resume`
Obtain a `SessionHandle` for the collaboration run.

4. `dispatch`
Send task, wave, and role assignments to the host.

5. `observe`
Capture events, artifacts, approvals, and telemetry.

6. `pause, recover, or close`
Persist state, recover from failure, or close the session cleanly.

## Interface Definitions

The kernel SHALL treat the following interfaces as public and versioned.

```ts
export type RuntimeMode =
  | "native-harness"
  | "embedded-layer"
  | "plugin"
  | "adapter-sdk";

export type CapabilitySupport =
  | "native"
  | "adapter"
  | "emulated"
  | "none";

export interface CapabilityDescriptor {
  runtime_id: string;
  runtime_mode: RuntimeMode;
  runtime_version?: string;
  supports_sessions: CapabilitySupport;
  supports_subagents: CapabilitySupport;
  supports_parallelism: CapabilitySupport;
  supports_worktrees: CapabilitySupport;
  supports_hooks: CapabilitySupport;
  supports_streaming: CapabilitySupport;
  supports_approvals: CapabilitySupport;
  supports_native_plugins: CapabilitySupport;
  max_parallel_participants?: number;
  max_nested_dispatch_depth?: number;
  allows_same_worktree_writes: boolean;
  notes?: string[];
}

export interface SessionHandle {
  session_id: string;
  runtime_id: string;
  runtime_mode: RuntimeMode;
  host_session_ref?: string;
  task_ids: string[];
  wave_ids: string[];
  downgrade_flags: string[];
  created_at: string;
  resumed_from?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface TaskSpec {
  task_id: string;
  title: string;
  goal: string;
  inputs: string[];
  constraints: string[];
  acceptance_checks: string[];
  audit_requirements: string[];
  owned_scope: {
    writable_files: string[];
    writable_dirs: string[];
    readonly_files: string[];
    readonly_dirs: string[];
  };
  preferred_isolation: "worktree" | "same-worktree" | "readonly";
  stakes: "low" | "medium" | "high";
  metadata?: Record<string, string | number | boolean>;
}

export interface WaveAssignment {
  participant_id: string;
  role: "planner" | "builder" | "reviewer" | "judge" | "approver";
  runtime_id: string;
  task_ids: string[];
  write_access: boolean;
}

export interface WavePlan {
  wave_id: string;
  objective: string;
  assignments: WaveAssignment[];
  isolation_mode: "worktree" | "same-worktree";
  merge_strategy: "sequential-merge" | "integration-request" | "no-merge";
  stop_conditions: string[];
  cost_limit?: number;
  time_limit_minutes?: number;
  downgrade_flags: string[];
}

export interface AdapterManifest {
  adapter_id: string;
  runtime_id: string;
  display_name: string;
  runtime_mode: RuntimeMode;
  version: string;
  entrypoints: {
    install?: string;
    launch?: string;
    resume?: string;
    plugin_manifest?: string;
    docs?: string;
  };
  capability_defaults: Partial<CapabilityDescriptor>;
  required_environment?: string[];
  notes?: string[];
}

export interface DispatchReceipt {
  dispatch_id: string;
  session_id: string;
  wave_id?: string;
  participant_id: string;
  accepted: boolean;
  downgrade_flags: string[];
  artifact_targets: string[];
}

export interface ApprovalDecision {
  approval_id: string;
  status: "approved" | "denied" | "deferred";
  decided_at: string;
  notes?: string;
}

export interface HarnessAdapter {
  getManifest(): Promise<AdapterManifest>;
  probe(): Promise<CapabilityDescriptor>;
  createSession(input: {
    mode: RuntimeMode;
    task_ids?: string[];
    metadata?: Record<string, string | number | boolean>;
  }): Promise<SessionHandle>;
  resumeSession(input: {
    session_id?: string;
    host_session_ref?: string;
  }): Promise<SessionHandle | null>;
  dispatchTask(input: {
    session: SessionHandle;
    task: TaskSpec;
    wave?: WavePlan;
    participant_id: string;
  }): Promise<DispatchReceipt>;
  requestApproval(input: {
    session: SessionHandle;
    approval_id: string;
    reason: string;
    operation: string;
  }): Promise<ApprovalDecision>;
  writeArtifact(input: {
    session: SessionHandle;
    path: string;
    content: string;
    content_type: "markdown" | "json";
  }): Promise<{ path: string; digest?: string }>;
  readArtifact(input: {
    session: SessionHandle;
    path: string;
  }): Promise<{ path: string; content: string } | null>;
  collectTelemetry(input: {
    session: SessionHandle;
    event_type: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
  closeSession(input: {
    session: SessionHandle;
    reason: "complete" | "paused" | "failed" | "canceled";
  }): Promise<void>;
}
```

## Capability Rules

The kernel MUST honor capability declarations as follows:

- If `supports_worktrees` is `none`, the kernel MUST prohibit multi-writer execution and fall back to one writer plus readonly reviewers.
- If `supports_subagents` is `none`, the kernel MUST serialize assignments and emit `no_subagents`.
- If `supports_streaming` is `none`, the kernel MUST use artifact checkpoints and event polling.
- If `supports_hooks` is `none`, validation moves into adapter-managed preflight and postflight checks.
- If `supports_approvals` is `none`, the kernel MUST route approvals through ProductionOS-managed human gates.
- If `supports_native_plugins` is `none`, plugin mode is unavailable for that runtime.

## Adapter Requirements

Every adapter MUST:

- provide a manifest and capability descriptor
- preserve task, wave, and session identifiers assigned by the kernel
- support artifact read and write for collaboration state
- surface downgrade flags instead of silently dropping unsupported behavior
- avoid undocumented host behavior as a required dependency

Every adapter MAY:

- emulate approvals, hooks, or telemetry if the host lacks them
- provide richer event streaming than the minimum contract
- expose host-specific convenience metadata, as long as the kernel does not require it

## First-Party Adapter Mapping

### Claude Code Adapter

Expected mode coverage:

- `embedded-layer`
- `plugin`

Expected strengths:

- native plugin manifests
- hook integration
- strong command and workflow surfaces
- session and review artifacts

Kernel rule:

- Claude-specific commands remain host surfaces; the kernel still owns collaboration semantics.

### Codex Adapter

Expected mode coverage:

- `embedded-layer`
- `plugin`

Expected strengths:

- native plugin manifest
- generated skill wrappers
- runtime-neutral parity registry input

Kernel rule:

- Codex session semantics are adapter-local. The kernel may not assume Claude-style session identity or hidden shared session state.

### ProductionOS Native Adapter

Expected mode coverage:

- `native-harness`

Responsibilities:

- provide the default adapter for native runtime control
- own orchestration, worktrees, approvals, events, and artifact paths directly

### Third-Party SDK Adapter

Expected mode coverage:

- `adapter-sdk`
- optionally `embedded-layer`

Minimum required support:

- manifest
- capability probe
- session create or resume
- task dispatch
- artifact read and write
- telemetry or event emission

## Versioning

- Initial contract version: `pos.adapter.v1`
- Any removal or semantic change to required fields is a breaking change.
- New optional fields are minor changes.
- Protocol version and adapter version must be recorded in session metadata.

## Adapter Acceptance Checklist

An adapter is implementation-ready only if it can answer all of these without inventing missing semantics:

- How does ProductionOS open or resume a session?
- How does ProductionOS dispatch a planner, builder, reviewer, or judge?
- Where are artifacts written and validated?
- How are downgrade flags surfaced?
- How are approvals resolved?
- How does pause or crash recovery reconstruct state?
- Which capabilities are native, emulated, or absent?

If any answer requires undocumented host behavior, the adapter is not v1-compatible.
