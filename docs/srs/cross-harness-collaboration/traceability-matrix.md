# Cross-Harness Traceability Matrix

## Goals To Requirements

| Goal | Intent | Requirements |
|------|--------|--------------|
| `CHC-G1` | one kernel across native, embedded, plugin, and SDK modes | `CHC-REQ-001`, `CHC-REQ-002`, `CHC-REQ-013`, `CHC-REQ-015` |
| `CHC-G2` | cross-provider collaboration with explicit handoff and audit | `CHC-REQ-003`, `CHC-REQ-004`, `CHC-REQ-007`, `CHC-REQ-008`, `CHC-REQ-011` |
| `CHC-G3` | preserve ProductionOS safety primitives | `CHC-REQ-005`, `CHC-REQ-006`, `CHC-REQ-012`, `CHC-REQ-016` |
| `CHC-G4` | keep Claude and Codex parity surfaces working during migration | `CHC-REQ-009`, `CHC-REQ-015` |
| `CHC-G5` | decision-complete implementation contract | `CHC-REQ-010`, `CHC-REQ-013`, `CHC-REQ-014` |

## Requirements To Interfaces, Protocols, And Scenarios

| Requirement | Tag | Primary interface or protocol | Validation scenarios | Rollout gates |
|-------------|-----|-------------------------------|----------------------|---------------|
| `CHC-REQ-001` | `Inference` | `RuntimeMode`, `AdapterManifest` | `CHC-SC-003`, `CHC-SC-004` | `CHC-GATE-001`, `CHC-GATE-002` |
| `CHC-REQ-002` | `Inference` | `HarnessAdapter`, `CapabilityDescriptor` | `CHC-SC-003`, `CHC-SC-004`, `CHC-SC-010` | `CHC-GATE-001`, `CHC-GATE-005` |
| `CHC-REQ-003` | `Inference` | `TaskSpec`, `WavePlan` | `CHC-SC-001`, `CHC-SC-002`, `CHC-SC-006` | `CHC-GATE-001`, `CHC-GATE-003` |
| `CHC-REQ-004` | `Evidence` | `HandoffArtifact`, `BroadcastEvent` | `CHC-SC-001`, `CHC-SC-002`, `CHC-SC-008` | `CHC-GATE-003` |
| `CHC-REQ-005` | `New Requirement` | ownership protocol, worktree rules | `CHC-SC-001`, `CHC-SC-006` | `CHC-GATE-003`, `CHC-GATE-004` |
| `CHC-REQ-006` | `New Requirement` | `OwnershipMap`, `IntegrationRequest` | `CHC-SC-005`, `CHC-SC-006` | `CHC-GATE-003` |
| `CHC-REQ-007` | `Inference` | handoff protocol, session protocol | `CHC-SC-001`, `CHC-SC-002`, `CHC-SC-008` | `CHC-GATE-005` |
| `CHC-REQ-008` | `New Requirement` | review protocol, role assignment | `CHC-SC-001`, `CHC-SC-002`, `CHC-SC-009` | `CHC-GATE-003`, `CHC-GATE-006` |
| `CHC-REQ-009` | `Evidence` | host surface generators, runtime-neutral registry | `CHC-SC-003`, `CHC-SC-004` | `CHC-GATE-002`, `CHC-GATE-004` |
| `CHC-REQ-010` | `New Requirement` | degradation protocol, session metadata | `CHC-SC-004`, `CHC-SC-010` | `CHC-GATE-002`, `CHC-GATE-003` |
| `CHC-REQ-011` | `Inference` | `SessionHandle`, session protocol | `CHC-SC-007`, `CHC-SC-008` | `CHC-GATE-003` |
| `CHC-REQ-012` | `Inference` | `ApprovalRequest`, approval protocol | `CHC-SC-009` | `CHC-GATE-006` |
| `CHC-REQ-013` | `New Requirement` | adapter SDK | `CHC-SC-004` | `CHC-GATE-001` |
| `CHC-REQ-014` | `New Requirement` | adapter acceptance rule | `CHC-SC-004`, `CHC-SC-010` | `CHC-GATE-005` |
| `CHC-REQ-015` | `Inference` | migration plan, host surface generation | `CHC-SC-003`, `CHC-SC-004` | `CHC-GATE-004` |
| `CHC-REQ-016` | `Evidence` | event protocol, telemetry records | `CHC-SC-006`, `CHC-SC-007`, `CHC-SC-010` | `CHC-GATE-003` |

## Rollout Gates

| Gate | Meaning | Pass condition |
|------|---------|----------------|
| `CHC-GATE-001` | adapter contract completeness | a new adapter can be stubbed from `adapter-sdk.md` without inventing missing fields or lifecycle steps |
| `CHC-GATE-002` | compatibility coverage | native harness, embedded layer, Claude plugin, Codex plugin, and SDK mode all appear in the compatibility matrix |
| `CHC-GATE-003` | protocol completeness | all required schemas, downgrade flags, ownership rules, and handoff validation steps are explicit |
| `CHC-GATE-004` | migration safety | parity-based generation maps forward to collaboration-kernel generation without breaking existing host surfaces |
| `CHC-GATE-005` | host-independence | no requirement depends on undocumented or private host behavior |
| `CHC-GATE-006` | security and approval posture | approval gates, artifact integrity, and cross-audit rules are explicit for protected and high-stakes work |

## Scenario Coverage

| Scenario | Requirements covered |
|----------|----------------------|
| `CHC-SC-001` Claude planner -> Codex builder -> Claude reviewer | `CHC-REQ-003`, `CHC-REQ-004`, `CHC-REQ-005`, `CHC-REQ-007`, `CHC-REQ-008` |
| `CHC-SC-002` Codex planner -> Claude auditor -> Codex fixer | `CHC-REQ-003`, `CHC-REQ-004`, `CHC-REQ-007`, `CHC-REQ-008` |
| `CHC-SC-003` ProductionOS native harness mode | `CHC-REQ-001`, `CHC-REQ-002`, `CHC-REQ-009`, `CHC-REQ-015` |
| `CHC-SC-004` partial-capability third-party adapter | `CHC-REQ-001`, `CHC-REQ-002`, `CHC-REQ-010`, `CHC-REQ-013`, `CHC-REQ-014` |
| `CHC-SC-005` same-worktree one-writer collaboration | `CHC-REQ-006` |
| `CHC-SC-006` parallel wave with ownership conflicts | `CHC-REQ-003`, `CHC-REQ-005`, `CHC-REQ-006`, `CHC-REQ-016` |
| `CHC-SC-007` crash recovery mid-wave | `CHC-REQ-011`, `CHC-REQ-016` |
| `CHC-SC-008` pause and resume with handoff validation | `CHC-REQ-004`, `CHC-REQ-007`, `CHC-REQ-011` |
| `CHC-SC-009` approval gate for protected action | `CHC-REQ-008`, `CHC-REQ-012` |
| `CHC-SC-010` degraded mode with missing features | `CHC-REQ-002`, `CHC-REQ-010`, `CHC-REQ-014`, `CHC-REQ-016` |

## Authoring And Review Trace

The SRS package was structured to satisfy the requested review order:

- `context-engineer` - minimal high-signal source pack
- `plan-ceo-review` - hybrid kernel and product-shape pressure test
- `plan-eng-review` - architecture, interfaces, states, failures, and gates
- `security-audit` - approvals, tamper handling, and trust boundaries
- `review` - ambiguity and missing-test closure
- `self-eval` - refinement of non-goals, migration, and downgrade rules
- `omni-plan-nth` - final convergence on scenario and gate completeness
