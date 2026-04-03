---
name: productionos-build-productionos
description: "ProductionOS smart router — single entry point that routes to the right pipeline based on intent. The ONLY command new users need to know."
argument-hint: "[repo path, target, or task context]"
---

# productionos-build-productionos

## Overview

Top-level Codex alias for the ProductionOS workflow [`build-productionos`](../../skills/build-productionos/SKILL.md).

- Source command: [.claude/commands/build-productionos.md](../../.claude/commands/build-productionos.md)
- Plugin-local skill: [skills/build-productionos/SKILL.md](../../skills/build-productionos/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `build-productionos`
- Codex intent: ProductionOS smart router — single entry point that routes to the right pipeline based on intent. The ONLY command new users need to know.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
