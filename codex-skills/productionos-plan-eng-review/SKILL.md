---
name: productionos-plan-eng-review
description: "Engineering architecture review — lock in execution plan with data flow diagrams, error paths, test matrix, performance budget, and dependency analysis."
argument-hint: "[repo path, target, or task context]"
---

# productionos-plan-eng-review

## Overview

Top-level Codex alias for the ProductionOS workflow [`plan-eng-review`](../../skills/plan-eng-review/SKILL.md).

- Source command: [.claude/commands/plan-eng-review.md](../../.claude/commands/plan-eng-review.md)
- Plugin-local skill: [skills/plan-eng-review/SKILL.md](../../skills/plan-eng-review/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `plan-eng-review`
- Codex intent: Lock architecture, trust boundaries, error paths, and test coverage before implementation.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
