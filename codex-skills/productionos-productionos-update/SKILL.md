---
name: productionos-productionos-update
description: "Update ProductionOS plugin to the latest version from GitHub"
argument-hint: "[repo path, target, or task context]"
---

# productionos-productionos-update

## Overview

Top-level Codex alias for the ProductionOS workflow [`productionos-update`](../../skills/productionos-update/SKILL.md).

- Source command: [.claude/commands/productionos-update.md](../../.claude/commands/productionos-update.md)
- Plugin-local skill: [skills/productionos-update/SKILL.md](../../skills/productionos-update/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `productionos-update`
- Codex intent: Update ProductionOS plugin to the latest version from GitHub

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
