---
name: productionos-brainstorming
description: "Idea exploration before building — understand the problem, propose approaches, present design, get approval. HARD-GATE: no implementation until design is approved."
argument-hint: "[repo path, target, or task context]"
---

# productionos-brainstorming

## Overview

Top-level Codex alias for the ProductionOS workflow [`brainstorming`](../../skills/brainstorming/SKILL.md).

- Source command: [.claude/commands/brainstorming.md](../../.claude/commands/brainstorming.md)
- Plugin-local skill: [skills/brainstorming/SKILL.md](../../skills/brainstorming/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `brainstorming`
- Codex intent: Idea exploration before building — understand the problem, propose approaches, present design, get approval. HARD-GATE: no implementation until design is approved.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
