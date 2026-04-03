---
name: productionos-productionos-help
description: "Show how to use ProductionOS — explains commands, recommended workflows, best flows to run, and usage guidelines."
argument-hint: "[repo path, target, or task context]"
---

# productionos-productionos-help

## Overview

Top-level Codex alias for the ProductionOS workflow [`productionos-help`](../../skills/productionos-help/SKILL.md).

- Source command: [.claude/commands/productionos-help.md](../../.claude/commands/productionos-help.md)
- Plugin-local skill: [skills/productionos-help/SKILL.md](../../skills/productionos-help/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `productionos-help`
- Codex intent: Show how to use ProductionOS — explains commands, recommended workflows, best flows to run, and usage guidelines.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
