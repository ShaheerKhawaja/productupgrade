---
name: productionos-autoloop
description: "Autonomous recursive improvement loop for a single target. Runs gap analysis, recursive refinement, evaluation, and convergence checks until the target reaches quality threshold or converges."
argument-hint: "[repo path, target, or task context]"
---

# productionos-autoloop

## Overview

Top-level Codex alias for the ProductionOS workflow [`autoloop`](../../skills/autoloop/SKILL.md).

- Source command: [.claude/commands/autoloop.md](../../.claude/commands/autoloop.md)
- Plugin-local skill: [skills/autoloop/SKILL.md](../../skills/autoloop/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `autoloop`
- Codex intent: Autonomous recursive improvement loop for a single target. Runs gap analysis, recursive refinement, evaluation, and convergence checks until the target reaches quality threshold or converges.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
