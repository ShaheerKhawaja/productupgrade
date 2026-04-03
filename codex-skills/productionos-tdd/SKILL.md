---
name: productionos-tdd
description: "Test-driven development — write tests first, then implement minimal code to pass. Enforces red-green-refactor cycle with coverage targets."
argument-hint: "[repo path, target, or task context]"
---

# productionos-tdd

## Overview

Top-level Codex alias for the ProductionOS workflow [`tdd`](../../skills/tdd/SKILL.md).

- Source command: [.claude/commands/tdd.md](../../.claude/commands/tdd.md)
- Plugin-local skill: [skills/tdd/SKILL.md](../../skills/tdd/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `tdd`
- Codex intent: Test-driven development — write tests first, then implement minimal code to pass. Enforces red-green-refactor cycle with coverage targets.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
