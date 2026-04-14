# Cross-Harness Collaboration Repo Reference Map

## Purpose

This document maps the cross-harness collaboration SRS package back to the
specific first-party `ProductionOS` repository files and branch inputs that
justify it.

This is a normative evidence map, not a general reading list. Every entry in
this document points to the MIT-licensed `ShaheerKhawaja/ProductionOS`
repository and is intended to reduce ambiguity during implementation.

## License Scope

- Normative repository: `ShaheerKhawaja/ProductionOS`
- License: MIT
- Source of license: [LICENSE](../../../LICENSE)
- Rule: no requirement in the collaboration kernel may depend on a repository
  that has not been license-verified and marked explicitly as normative

## Normative Repository Evidence

| Repo File | Evidence Type | Why It Matters | Primary SRS Areas |
|-----------|---------------|----------------|-------------------|
| `README.md` | `Evidence` | product claims, install surfaces, dual-target positioning, hooks summary, and generated surface visibility | operating modes, migration, package discoverability |
| `ARCHITECTURE.md` | `Evidence` | current ProductionOS architecture, command pipeline, context model, handoff flow, and convergence framing | kernel architecture, lifecycle, migration constraints |
| `docs/CODEX-PARITY-HANDOFF.md` | `Evidence` | runtime-neutral registry output, current target coverage, and host-surface parity language | host surface generators, compatibility, migration |
| `docs/RLM-INTEGRATION-SPEC.md` | `Inference` | recursive orchestration depth model and structured spec style already present in the repo | recursive re-dispatch, implementation planning posture |
| `scripts/lib/runtime-targets.ts` | `Evidence` | current runtime-neutral metadata, generation model, and target support contract | adapter registry, host surface generation, migration path |
| `scripts/lib/file-ownership.ts` | `Evidence` | current ownership map shape, readonly demotion rules, and integration-request semantics | ownership protocol, same-worktree exception, writer rules |
| `scripts/lib/broadcast.ts` | `Evidence` | current event-channel model and wave-level synthesis primitives | event protocol, telemetry, degradation reporting |
| `scripts/worktree-manager.ts` | `Evidence` | current worktree lifecycle, registry, preflight, merge, and recovery behavior | default worktree isolation, merge gates, failure modes |
| `templates/INVOCATION-PROTOCOL.md` | `Evidence` | current artifact manifest validation and subagent invocation rules | handoff protocol, artifact validation, session continuity |
| `templates/SUB-AGENT-PROTOCOL.md` | `Evidence` | current role handoff and specialist orchestration expectations | role assignment, nested dispatch limits, degraded mode |
| `tests/runtime-targets.test.ts` | `Evidence` | guarantees around generated targets and parity coverage | host surface generators, compatibility gates |
| `tests/file-ownership.test.ts` | `Evidence` | guarantees around writable scopes, readonly demotion, and requests | ownership protocol, conflict resolution |
| `tests/worktree-integration.test.ts` | `Evidence` | end-to-end ownership and wave lifecycle behavior | worktree isolation, crash recovery, merge gates |
| `tests/broadcast.test.ts` | `Evidence` | guarantees around event channels, ordering, and wave aggregation | event protocol, telemetry, wave synthesis |
| `tests/hook-contracts.test.ts` | `Evidence` | guarantees around hook structure and host guardrail expectations | embedded mode, plugin mode, hook downgrade rules |

## Branch Input Map

The following branch references were checked as design inputs on 2026-04-11.
They are still first-party references because they are branches of the same MIT
repository.

| Branch | Commit | Why It Matters | SRS Impact |
|--------|--------|----------------|------------|
| `codex/productionos-codex-parity` | `e7f34641260a760f07ea79d8aca2f1fe04e98c05` | current working branch and parity baseline | generated surfaces, adapter expectations |
| `refactor/canonical-plugin-structure` | `63e5ac88a411fb5caa71962507f7b550ae787466` | plugin packaging direction | plugin mode and migration |
| `feat/v8-sprint5-worktree-isolation` | `8a5e797cb12983a3d030d431a5a5e3a40b6bb780` | worktree-first concurrency emphasis | default isolation and merge rules |
| `feat/v8-sprint7-ownership-protocol` | `bb72b82387565b7537138c0bcd4a4b636fb50a72` | scope and ownership rigor | ownership protocol and same-worktree exception |
| `docs/v8-handoff-todo` | `f4aa47288ef78f111dafee37f16d6455a0c401b6` | handoff and session documentation direction | handoff protocol, pause/resume, recovery |
| `sprint-9-infrastructure` | `44becd012a244e7289354ae6c0cb7b3ec24f6db0` | infrastructure consolidation direction | adapter registry and kernel rollout framing |

## Coverage Map

| SRS Topic | Primary Repo Sources |
|-----------|----------------------|
| operating modes | `README.md`, `docs/CODEX-PARITY-HANDOFF.md`, `scripts/lib/runtime-targets.ts` |
| collaboration kernel architecture | `ARCHITECTURE.md`, `README.md`, `docs/RLM-INTEGRATION-SPEC.md` |
| host surface generation | `docs/CODEX-PARITY-HANDOFF.md`, `scripts/lib/runtime-targets.ts`, `tests/runtime-targets.test.ts` |
| handoff artifacts and validation | `templates/INVOCATION-PROTOCOL.md`, existing `.productionos` artifact conventions, `ARCHITECTURE.md` |
| event and telemetry model | `scripts/lib/broadcast.ts`, `tests/broadcast.test.ts` |
| ownership and isolation | `scripts/lib/file-ownership.ts`, `tests/file-ownership.test.ts`, `tests/worktree-integration.test.ts` |
| worktree lifecycle and recovery | `scripts/worktree-manager.ts`, `tests/worktree-integration.test.ts`, `ARCHITECTURE.md` |
| approvals and guarded operations | `README.md`, `ARCHITECTURE.md`, `tests/hook-contracts.test.ts` |
| degradation policy | `docs/CODEX-PARITY-HANDOFF.md`, `scripts/lib/runtime-targets.ts`, `README.md` |
| migration constraints | `README.md`, `ARCHITECTURE.md`, `scripts/lib/runtime-targets.ts` |

## Implementation Use Rules

- Treat `README.md` and `ARCHITECTURE.md` as product and architecture intent.
- Treat `scripts/lib/*.ts` and `scripts/worktree-manager.ts` as the current
  executable truth for collaboration primitives.
- Treat `templates/*.md` as the current protocol baseline for artifacts and
  invocation behavior.
- Treat `tests/*.test.ts` as the current behavioral safety net.
- If a future implementation contradicts a normative source in this map, update
  the SRS package and the source or document the divergence explicitly in the
  implementation PR.

## Completion Checklist

- all normative references are first-party and MIT-licensed
- every major SRS section maps back to at least one repo file or branch input
- no branch input is treated as normative outside the same first-party repo
- comparative external repositories remain non-normative unless added with
  explicit license verification
