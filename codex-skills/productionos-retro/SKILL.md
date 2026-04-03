---
name: productionos-retro
description: "Engineering retrospective — analyzes commit history, work patterns, code quality metrics, self-eval scores, and ProductionOS health with persistent trend tracking."
argument-hint: "[repo path, target, or task context]"
---

# productionos-retro

## Overview

Top-level Codex alias for the ProductionOS workflow [`retro`](../../skills/retro/SKILL.md).

- Source command: [.claude/commands/retro.md](../../.claude/commands/retro.md)
- Plugin-local skill: [skills/retro/SKILL.md](../../skills/retro/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `retro`
- Codex intent: Engineering retrospective — analyzes commit history, work patterns, code quality metrics, self-eval scores, and ProductionOS health with persistent trend tracking.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
