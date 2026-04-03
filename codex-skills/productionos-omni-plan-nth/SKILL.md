---
name: productionos-omni-plan-nth
description: "Nth-iteration omni-plan — recursive orchestration that chains ALL ProductionOS skills and agents, evaluates strictly per iteration, and loops until 10/10 is achieved. Each iteration can invoke any command or skill in the system."
argument-hint: "[repo path, target, or task context]"
---

# productionos-omni-plan-nth

## Overview

Top-level Codex alias for the ProductionOS workflow [`omni-plan-nth`](../../skills/omni-plan-nth/SKILL.md).

- Source command: [.claude/commands/omni-plan-nth.md](../../.claude/commands/omni-plan-nth.md)
- Plugin-local skill: [skills/omni-plan-nth/SKILL.md](../../skills/omni-plan-nth/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `omni-plan-nth`
- Codex intent: Iterate the full orchestration loop until quality targets are met or clearly plateau.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
