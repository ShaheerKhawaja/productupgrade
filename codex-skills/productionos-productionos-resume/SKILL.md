---
name: productionos-productionos-resume
description: "Resume a paused pipeline from .productionos/CHECKPOINT.json. Restores context and routes to the correct step."
argument-hint: "[repo path, target, or task context]"
---

# productionos-productionos-resume

## Overview

Top-level Codex alias for the ProductionOS workflow [`productionos-resume`](../../skills/productionos-resume/SKILL.md).

- Source command: [.claude/commands/productionos-resume.md](../../.claude/commands/productionos-resume.md)
- Plugin-local skill: [skills/productionos-resume/SKILL.md](../../skills/productionos-resume/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `productionos-resume`
- Codex intent: Resume a paused pipeline from .productionos/CHECKPOINT.json. Restores context and routes to the correct step.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
