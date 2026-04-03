---
name: productionos-plan-ceo-review
description: "CEO/founder-mode plan review — rethink the problem, find the 10-star product, challenge premises. Four modes: SCOPE EXPANSION, SELECTIVE EXPANSION, HOLD SCOPE, SCOPE REDUCTION."
argument-hint: "[repo path, target, or task context]"
---

# productionos-plan-ceo-review

## Overview

Top-level Codex alias for the ProductionOS workflow [`plan-ceo-review`](../../skills/plan-ceo-review/SKILL.md).

- Source command: [.claude/commands/plan-ceo-review.md](../../.claude/commands/plan-ceo-review.md)
- Plugin-local skill: [skills/plan-ceo-review/SKILL.md](../../skills/plan-ceo-review/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `plan-ceo-review`
- Codex intent: Challenge scope, tighten user value, and surface expansion opportunities explicitly.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
