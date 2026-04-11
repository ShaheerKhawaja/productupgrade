# Cross-Harness Compatibility Matrix

## Legend

- `Native` - supported directly by the mode or host
- `Adapter` - supported through ProductionOS adapter logic
- `Emulated` - supported through fallback behavior
- `Blocked` - unavailable in that mode
- `Required` - must exist before the mode is considered valid

## Mode Coverage

| Capability | Native Harness | Embedded Layer | Claude Plugin | Codex Plugin or App | Adapter SDK |
|------------|----------------|----------------|---------------|---------------------|-------------|
| Adapter registry | Native | Required | Required | Required | Required |
| Task and wave orchestration | Native | Native | Native | Native | Native |
| Artifact store | Native | Adapter | Adapter | Adapter | Required |
| Broadcast events | Native | Adapter | Adapter | Adapter | Required |
| Native plugin manifest | Blocked | Blocked | Native | Native | Blocked |
| Session identity | Native | Adapter | Adapter | Adapter | Required |
| Pause and resume | Native | Adapter | Adapter | Adapter | Required |
| Subagent dispatch | Native | Adapter or Emulated | Adapter | Adapter or Emulated | Adapter or Emulated |
| Parallel execution | Native | Adapter or Emulated | Adapter | Adapter or Emulated | Adapter or Emulated |
| Worktree isolation | Native | Adapter or Emulated | Adapter | Adapter or Emulated | Adapter or Emulated |
| Same-worktree single-writer mode | Native | Native | Native | Native | Required |
| Hooks | Native | Adapter or Emulated | Native | Adapter or Emulated | Adapter or Emulated |
| Approvals | Native | Adapter or Emulated | Native or Adapter | Adapter or Emulated | Adapter or Emulated |
| Cross-provider handoff | Native | Native | Native | Native | Required |
| Cross-audit | Native | Native | Native | Native | Required |
| Merge gates | Native | Adapter or Emulated | Adapter | Adapter or Emulated | Adapter or Emulated |
| Telemetry | Native | Adapter | Adapter | Adapter | Required |
| Degraded mode recording | Native | Required | Required | Required | Required |

## First-Party Host Notes

### ProductionOS Native Harness

- Acts as the reference implementation for the collaboration kernel.
- Owns orchestration, storage, approvals, and isolation directly.
- Does not depend on external host-native plugin capability.

### Claude Plugin Mode

- Uses generated Claude plugin surfaces and host-native hooks where available.
- Session and workflow semantics are still governed by the kernel.
- Plugin mode must not become a fork of collaboration behavior.

### Codex Plugin or App Mode

- Uses generated Codex plugin and skill surfaces.
- Codex session identity is treated as adapter-local metadata, not shared collaboration truth.
- When host-native worktree or subagent features are absent, the adapter must degrade explicitly.

### Generic Adapter SDK Mode

- Third-party harnesses integrate by manifest plus adapter implementation.
- No Claude-only or Codex-only assumptions are allowed.
- The smallest valid integration still needs session, artifact, and event support.

## Degradation Rules

| Missing capability | Fallback | Required metadata |
|--------------------|----------|-------------------|
| no subagents | serialize planner, builder, reviewer, and judge assignments | `no_subagents` |
| no worktrees | same-worktree with one writer and readonly reviewers only | `no_worktrees`, `same_worktree_exception` when used |
| no streaming | artifact checkpoints plus event polling | `no_streaming` |
| no hooks | adapter-managed preflight and postflight checks | `no_hooks` |
| no host approvals | ProductionOS-managed approval records | `no_host_approvals` |
| single runtime only | keep all participants on one host but preserve cross-role artifacts | `single_runtime_only` |

## Minimum Capability Thresholds

### Native Harness Mode

- must provide all kernel subsystems directly
- cannot rely on undeclared host capabilities

### Embedded Layer Mode

- requires adapter registry, session handling, artifact IO, and telemetry
- may emulate hooks, approvals, and subagents

### Plugin Mode

- requires embedded-layer thresholds plus host-native plugin or skill surface
- generated surfaces must still point back to shared kernel behavior

### Adapter SDK Mode

- requires manifest, capability probe, session create or resume, dispatch, artifact IO, and telemetry
- may emulate worktrees, subagents, approvals, and hooks

## Compatibility Assertions

- ProductionOS collaboration behavior is mode-stable even when the host surface differs.
- Degraded mode is valid if and only if the downgrade is explicit and the remaining safety properties still hold.
- No mode may silently upgrade or downgrade isolation, audit, or approval behavior.
