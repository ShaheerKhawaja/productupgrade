# Cross-Harness Collaboration Implementation Roadmap

## Purpose

This roadmap translates the cross-harness collaboration SRS package into an
implementation sequence that another engineer can execute with minimal design
ambiguity.

It is not a second product spec. It is the delivery plan for building the
kernel, adapters, protocols, and rollout in the existing `ProductionOS` repo.

## Delivery Principles

- preserve current Claude and Codex surfaces while adding the collaboration
  kernel underneath them
- treat the runtime-neutral registry as the authority for host support
- default to worktree isolation for multi-writer flows
- keep artifact and event protocols backward-compatible where practical
- do not require undocumented host behavior

## Workstreams

### WS1: Kernel Metadata Foundation

Goal:

- add collaboration-kernel metadata without breaking existing parity output

Likely repo touch points:

- `scripts/lib/runtime-targets.ts`
- generated parity docs and manifests
- any shared metadata helpers under `scripts/lib/`

Required outputs:

- adapter identities
- capability descriptors
- downgrade flag model
- protocol version fields
- role and mode metadata

Exit criteria:

- current generated Claude and Codex surfaces still build
- new metadata is available to the SRS-defined adapter layer
- parity tests still pass

### WS2: Adapter Registry And Contracts

Goal:

- implement the provider-neutral adapter layer and registry

Likely repo touch points:

- new adapter registry module under `scripts/lib/` or a new runtime package
- generated manifests and adapter metadata
- native runtime bootstrap code for ProductionOS-native mode

Required outputs:

- `HarnessAdapter` implementation contract
- `AdapterManifest` support for Claude, Codex, and native runtime
- capability probing
- downgrade handling

Exit criteria:

- a stub third-party adapter can be added without new design work
- Claude and Codex adapters resolve from the same contract
- capability probe behavior is testable

### WS3: Protocol Promotion

Goal:

- convert current collaboration primitives into versioned kernel protocols

Likely repo touch points:

- `scripts/lib/broadcast.ts`
- `scripts/lib/file-ownership.ts`
- session handoff and artifact helpers
- hook or lifecycle scripts that produce `.productionos` artifacts

Required outputs:

- versioned handoff artifacts
- versioned event records
- versioned ownership maps
- session records
- approval records

Exit criteria:

- legacy artifacts remain readable or are migrated explicitly
- protocol validation blocks malformed or incomplete execution inputs
- downgrade flags are persisted consistently

### WS4: Orchestrator Upgrade

Goal:

- route multi-participant collaboration through the new kernel

Likely repo touch points:

- orchestrative skills and commands
- worktree orchestration helpers
- role assignment and review routing
- session pause and resume flow

Required outputs:

- task and wave planning through `TaskSpec` and `WavePlan`
- role-separated planner, builder, reviewer, judge, and approver dispatch
- pause, resume, and crash recovery through session protocol

Exit criteria:

- planner -> builder -> reviewer workflows are artifact-driven
- multi-writer work routes through worktrees by default
- same-worktree flow is restricted to one writer

### WS5: Review, Approval, And Safety Enforcement

Goal:

- preserve ProductionOS safety guarantees across hosts

Likely repo touch points:

- review helpers
- approval gate logic
- hook validation and fallback checks
- merge gating logic

Required outputs:

- mandatory cross-audit for medium and high stakes
- explicit approval requests for protected actions
- adapter-managed fallbacks when host approvals or hooks are absent

Exit criteria:

- no protected action can proceed without an approval path
- high-stakes builder and reviewer identities are distinct
- degraded mode still preserves safety semantics

### WS6: Host Surface Regeneration

Goal:

- keep host-native surfaces aligned with the collaboration kernel

Likely repo touch points:

- `scripts/lib/runtime-targets.ts`
- `.claude-plugin/*`
- `.codex-plugin/*`
- generated skills and parity handoff docs

Required outputs:

- generated surfaces include kernel-aware metadata
- compatibility matrix and parity docs stay synchronized
- README and install docs remain accurate

Exit criteria:

- Claude and Codex surfaces still work as entrypoints
- kernel behavior, not host-specific drift, defines collaboration semantics

### WS7: Native Harness And SDK Rollout

Goal:

- add ProductionOS-native harness mode and third-party adapter SDK support

Likely repo touch points:

- native runtime package or entrypoint
- adapter SDK docs and examples
- integration tests

Required outputs:

- native harness reference implementation
- third-party adapter example or stub
- rollout and migration notes

Exit criteria:

- native mode works without an external host harness
- third-party SDK mode can be stubbed and tested

## Suggested Delivery Phases

| Phase | Workstreams | Why this order |
|-------|-------------|----------------|
| `PH0` | WS1 | preserve current parity and add metadata foundation first |
| `PH1` | WS2 | the adapter layer is the main architectural seam |
| `PH2` | WS3 | protocols must stabilize before deeper orchestration changes |
| `PH3` | WS4 | orchestration upgrade depends on registry and protocol stability |
| `PH4` | WS5 | safety gates harden the new orchestration model |
| `PH5` | WS6 | regenerate host surfaces after kernel behavior is stable |
| `PH6` | WS7 | native mode and external SDK are last because they depend on the previous seams |

## Test Matrix

| Area | Minimum tests to add |
|------|----------------------|
| adapter registry | capability probe success, downgrade path, invalid manifest rejection |
| adapter SDK | stub adapter compile-time and runtime contract tests |
| handoff protocol | valid artifact, malformed artifact, incomplete artifact, stale scope |
| event protocol | event ordering, downgrade event emission, recovery polling |
| ownership protocol | worktree default, same-worktree one-writer rule, shared-file demotion |
| approvals | pending, approved, denied, missing host approval fallback |
| session protocol | create, pause, resume, crash recovery, blocked state |
| host surfaces | generated output remains in sync with kernel metadata |
| migration | old parity generation coexists with new kernel-aware generation |

## Rollout Risks

| Risk | Where it appears | Mitigation |
|------|------------------|------------|
| host surface drift | generated Claude and Codex outputs | keep registry authoritative and test generation |
| hidden provider assumptions | adapter implementations | capability descriptor and acceptance checks |
| unsafe same-worktree writes | orchestration layer | one-writer rule and readonly demotion |
| malformed artifacts causing cascade failure | protocol adoption | strict manifest validation and downgrade flags |
| migration breaks existing installs | generation and packaging | phase rollout and parity-preserving baseline |

## PR And Merge Strategy

- land metadata and adapter seams before native harness mode
- keep host surface generation changes isolated from protocol refactors where
  possible
- require findings-first review on protocol and safety PRs
- require regression coverage before merging worktree or ownership changes
- keep each PR scoped to one phase or one tightly related subphase

## Definition Of Done

The collaboration kernel is ready for broader use only when:

- the adapter registry exists and can load Claude, Codex, and a stub SDK adapter
- kernel protocols are versioned and validated
- planner, builder, reviewer, and approver flows are artifact-based
- default multi-writer isolation is worktree
- degraded mode is explicit and test-covered
- generated host surfaces remain aligned with the kernel metadata
