---
name: productionos-ship
description: "Ship workflow — detect base branch, merge, run tests, review diff, bump VERSION, update CHANGELOG, commit, push, create PR."
argument-hint: "[repo path, target, or task context]"
---

# productionos-ship

## Overview

Top-level Codex alias for the ProductionOS workflow [`ship`](../../skills/ship/SKILL.md).

- Source command: [.claude/commands/ship.md](../../.claude/commands/ship.md)
- Plugin-local skill: [skills/ship/SKILL.md](../../skills/ship/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `ship`
- Codex intent: Ship workflow — detect base branch, merge, run tests, review diff, bump VERSION, update CHANGELOG, commit, push, create PR.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
