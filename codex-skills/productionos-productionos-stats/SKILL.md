---
name: productionos-productionos-stats
description: "Display ProductionOS system statistics — agent count, command count, hook count, test count, version, instinct count, and session history."
argument-hint: "[repo path, target, or task context]"
---

# productionos-productionos-stats

## Overview

Top-level Codex alias for the ProductionOS workflow [`productionos-stats`](../../skills/productionos-stats/SKILL.md).

- Source command: [.claude/commands/productionos-stats.md](../../.claude/commands/productionos-stats.md)
- Plugin-local skill: [skills/productionos-stats/SKILL.md](../../skills/productionos-stats/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `productionos-stats`
- Codex intent: Display ProductionOS system statistics — agent count, command count, hook count, test count, version, instinct count, and session history.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
