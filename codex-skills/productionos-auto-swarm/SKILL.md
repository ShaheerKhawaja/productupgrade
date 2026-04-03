---
name: productionos-auto-swarm
description: "Distributed agent swarm orchestrator — spawns parallel subagent clusters for any task with configurable depth, swarm size, and convergence criteria"
argument-hint: "[repo path, target, or task context]"
---

# productionos-auto-swarm

## Overview

Top-level Codex alias for the ProductionOS workflow [`auto-swarm`](../../skills/auto-swarm/SKILL.md).

- Source command: [.claude/commands/auto-swarm.md](../../.claude/commands/auto-swarm.md)
- Plugin-local skill: [skills/auto-swarm/SKILL.md](../../skills/auto-swarm/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `auto-swarm`
- Codex intent: Run the workflow serially by default in Codex, or delegate only when the user explicitly wants parallel work.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
