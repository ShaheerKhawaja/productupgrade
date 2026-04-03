---
name: productionos-debug
description: "Systematic debugging with hypothesis tracking — reproduce, hypothesize, test, narrow, fix. Never guess-and-check."
argument-hint: "[repo path, target, or task context]"
---

# productionos-debug

## Overview

Top-level Codex alias for the ProductionOS workflow [`debug`](../../skills/debug/SKILL.md).

- Source command: [.claude/commands/debug.md](../../.claude/commands/debug.md)
- Plugin-local skill: [skills/debug/SKILL.md](../../skills/debug/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `debug`
- Codex intent: Systematic debugging with hypothesis tracking — reproduce, hypothesize, test, narrow, fix. Never guess-and-check.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
