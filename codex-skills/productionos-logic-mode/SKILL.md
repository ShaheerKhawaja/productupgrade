---
name: productionos-logic-mode
description: "Business idea → production-ready plan pipeline. User provides an idea or business plan, agent researches market, competitors, existing solutions, challenges assumptions, identifies flaws, and builds a comprehensive execution plan with auto-document population."
argument-hint: "[repo path, target, or task context]"
---

# productionos-logic-mode

## Overview

Top-level Codex alias for the ProductionOS workflow [`logic-mode`](../../skills/logic-mode/SKILL.md).

- Source command: [.claude/commands/logic-mode.md](../../.claude/commands/logic-mode.md)
- Plugin-local skill: [skills/logic-mode/SKILL.md](../../skills/logic-mode/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `logic-mode`
- Codex intent: Business idea → production-ready plan pipeline. User provides an idea or business plan, agent researches market, competitors, existing solutions, challenges assumptions, identifies flaws, and builds a comprehensive execution plan with auto-document population.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
