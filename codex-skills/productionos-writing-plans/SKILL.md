---
name: productionos-writing-plans
description: "Create step-by-step implementation plans with risk assessment, dependency mapping, and effort estimation. Used after brainstorming, before execution."
argument-hint: "[repo path, target, or task context]"
---

# productionos-writing-plans

## Overview

Top-level Codex alias for the ProductionOS workflow [`writing-plans`](../../skills/writing-plans/SKILL.md).

- Source command: [.claude/commands/writing-plans.md](../../.claude/commands/writing-plans.md)
- Plugin-local skill: [skills/writing-plans/SKILL.md](../../skills/writing-plans/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `writing-plans`
- Codex intent: Create step-by-step implementation plans with risk assessment, dependency mapping, and effort estimation. Used after brainstorming, before execution.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
