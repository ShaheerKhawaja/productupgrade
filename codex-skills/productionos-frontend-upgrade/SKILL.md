---
name: productionos-frontend-upgrade
description: "Full-stack frontend upgrade pipeline — fuses /production-upgrade iterative audit with /plan-ceo-review vision and /plan-eng-review rigor. Deploys parallel auto-swarm agents for iterative audit and execution. Enriched with /deep-research for competitive parity."
argument-hint: "[repo path, target, or task context]"
---

# productionos-frontend-upgrade

## Overview

Top-level Codex alias for the ProductionOS workflow [`frontend-upgrade`](../../skills/frontend-upgrade/SKILL.md).

- Source command: [.claude/commands/frontend-upgrade.md](../../.claude/commands/frontend-upgrade.md)
- Plugin-local skill: [skills/frontend-upgrade/SKILL.md](../../skills/frontend-upgrade/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `frontend-upgrade`
- Codex intent: Full-stack frontend upgrade pipeline — fuses /production-upgrade iterative audit with /plan-ceo-review vision and /plan-eng-review rigor. Deploys parallel auto-swarm agents for iterative audit and execution. Enriched with /deep-research for competitive parity.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
