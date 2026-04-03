---
name: productionos-devtools
description: "ProductionOS Mission Control — launch Claude DevTools, show session dashboard with eval convergence, agent dispatches, cost tracking, and hot file intelligence."
argument-hint: "[repo path, target, or task context]"
---

# productionos-devtools

## Overview

Top-level Codex alias for the ProductionOS workflow [`devtools`](../../skills/devtools/SKILL.md).

- Source command: [.claude/commands/devtools.md](../../.claude/commands/devtools.md)
- Plugin-local skill: [skills/devtools/SKILL.md](../../skills/devtools/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `devtools`
- Codex intent: ProductionOS Mission Control — launch Claude DevTools, show session dashboard with eval convergence, agent dispatches, cost tracking, and hot file intelligence.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
