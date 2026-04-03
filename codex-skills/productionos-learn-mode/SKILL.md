---
name: productionos-learn-mode
description: "Interactive code tutor — breaks down codebase logic, explains complexities, translates technical concepts for the user. Ideal after /btw commands. Teaches the WHY behind the code, not just the WHAT."
argument-hint: "[repo path, target, or task context]"
---

# productionos-learn-mode

## Overview

Top-level Codex alias for the ProductionOS workflow [`learn-mode`](../../skills/learn-mode/SKILL.md).

- Source command: [.claude/commands/learn-mode.md](../../.claude/commands/learn-mode.md)
- Plugin-local skill: [skills/learn-mode/SKILL.md](../../skills/learn-mode/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `learn-mode`
- Codex intent: Interactive code tutor — breaks down codebase logic, explains complexities, translates technical concepts for the user. Ideal after /btw commands. Teaches the WHY behind the code, not just the WHAT.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
