# Cross-Harness Collaboration Kernel SRS Package

## Purpose

This package specifies the ProductionOS collaboration kernel for cross-harness work across:

- `native harness` mode
- `embedded layer` mode
- `plugin` mode
- `adapter SDK` mode

It is the implementation-ready specification set for adding explicit Claude Code, Codex, and third-party harness collaboration with artifact-based handoffs, audit boundaries, ownership control, and degraded-mode rules.

## Package Contents

- [SRS.md](./SRS.md) - source-of-truth product and architecture specification
- [adapter-sdk.md](./adapter-sdk.md) - public adapter contract and lifecycle
- [protocols.md](./protocols.md) - handoff, event, ownership, review, approval, and session schemas
- [compatibility-matrix.md](./compatibility-matrix.md) - mode and host capability coverage
- [traceability-matrix.md](./traceability-matrix.md) - goals, requirements, scenarios, and rollout gates
- [repo-reference-map.md](./repo-reference-map.md) - file-by-file evidence map back to the MIT first-party repo
- [implementation-roadmap.md](./implementation-roadmap.md) - phased delivery plan, workstreams, tests, and rollout risks

## Repository Reference Inventory

All normative repository references used by this package are first-party references to the `ShaheerKhawaja/ProductionOS` repository, which is distributed under the MIT license in [LICENSE](../../../LICENSE).

### Normative Repo

| Repo | Role | License | Notes |
|------|------|---------|-------|
| `ShaheerKhawaja/ProductionOS` | source of truth for implementation and normative behavior | MIT | all cited files and referenced branches in this package resolve to this repo |

### Branch Inputs Checked On 2026-04-11

| Branch | Commit |
|--------|--------|
| `codex/productionos-codex-parity` | `e7f34641260a760f07ea79d8aca2f1fe04e98c05` |
| `refactor/canonical-plugin-structure` | `63e5ac88a411fb5caa71962507f7b550ae787466` |
| `feat/v8-sprint5-worktree-isolation` | `8a5e797cb12983a3d030d431a5a5e3a40b6bb780` |
| `feat/v8-sprint7-ownership-protocol` | `bb72b82387565b7537138c0bcd4a4b636fb50a72` |
| `docs/v8-handoff-todo` | `f4aa47288ef78f111dafee37f16d6455a0c401b6` |
| `sprint-9-infrastructure` | `44becd012a244e7289354ae6c0cb7b3ec24f6db0` |

## Reference Policy

- Normative implementation references for this package must come from MIT-licensed repositories.
- For this package, the only normative repository is `ShaheerKhawaja/ProductionOS`.
- Comparative or inspirational external repositories are out of scope unless they are added explicitly with license verification and marked as non-normative.
- No requirement in this package may depend on undocumented or private host behavior.

## Reading Order

1. Start with [SRS.md](./SRS.md).
2. Read [adapter-sdk.md](./adapter-sdk.md) to lock the implementation contract.
3. Read [protocols.md](./protocols.md) to lock state, handoff, review, and approval behavior.
4. Use [compatibility-matrix.md](./compatibility-matrix.md) to plan runtime-specific behavior.
5. Use [repo-reference-map.md](./repo-reference-map.md) to confirm the exact first-party evidence base.
6. Use [implementation-roadmap.md](./implementation-roadmap.md) to sequence build work.
7. Use [traceability-matrix.md](./traceability-matrix.md) to verify completeness before implementation.
