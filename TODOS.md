# ProductionOS TODOs

This file tracks the remaining work intentionally deferred after the main Claude/Codex parity migration.

## P1

- Finish manual Codex-first rewrites for the long-tail workflows that still rely on generated wrappers.
  Why: the core and orchestration tiers are now hand-authored, but the remaining workflows still have less opinionated Codex behavior.

- Investigate the Codex telemetry warning emitted on namespaced skill injection.
  Why: functionality works, but the `productionos:...` form still emits a non-blocking warning and should be cleaned up or intentionally deprecated.

## P2

- Add a dedicated CI workflow or matrix leg that explicitly exercises the Codex installer path.
  Why: installer smoke coverage exists in the test suite, but a visible CI job would make Codex regressions easier to spot.

- Refresh `HANDOFF.md` from the current repo state after the Codex parity branch lands.
  Why: the historical handoff still reports pre-parity counts and validation state from 2026-04-02.

## P3

- Add richer Codex plugin presentation assets if the app starts surfacing local plugin cards more prominently.
  Why: the current plugin manifest is structurally valid, but it still ships without optional icons or screenshots metadata.
