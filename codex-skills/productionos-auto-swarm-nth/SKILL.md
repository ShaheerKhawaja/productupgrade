---
name: productionos-auto-swarm-nth
description: "Nth-iteration agent swarm — spawns parallel agent waves, evaluates strictly per wave, re-swarms gaps until 100% coverage and 10/10 quality. Can invoke any ProductionOS skill or command within waves."
argument-hint: "[repo path, target, or task context]"
---

# productionos-auto-swarm-nth

## Overview

Top-level Codex alias for the ProductionOS workflow [`auto-swarm-nth`](../../skills/auto-swarm-nth/SKILL.md).

- Source command: [.claude/commands/auto-swarm-nth.md](../../.claude/commands/auto-swarm-nth.md)
- Plugin-local skill: [skills/auto-swarm-nth/SKILL.md](../../skills/auto-swarm-nth/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `auto-swarm-nth`
- Codex intent: Repeat swarm-style execution until gaps close, while translating agent waves into Codex-native orchestration.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
