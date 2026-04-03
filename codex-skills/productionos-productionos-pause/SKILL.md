---
name: productionos-productionos-pause
description: "Save current pipeline state for later resumption. Creates a checkpoint at .productionos/CHECKPOINT.json with all active context."
argument-hint: "[repo path, target, or task context]"
---

# productionos-productionos-pause

## Overview

Top-level Codex alias for the ProductionOS workflow [`productionos-pause`](../../skills/productionos-pause/SKILL.md).

- Source command: [.claude/commands/productionos-pause.md](../../.claude/commands/productionos-pause.md)
- Plugin-local skill: [skills/productionos-pause/SKILL.md](../../skills/productionos-pause/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `productionos-pause`
- Codex intent: Save current pipeline state for later resumption. Creates a checkpoint at .productionos/CHECKPOINT.json with all active context.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
