---
name: productionos-auto-optimize
description: "Self-improving agent optimization — generates challenger variants of any agent/command, benchmarks against baseline, promotes winners, logs learnings to instincts. Inspired by Karpathy's autoresearch pattern."
argument-hint: "[repo path, target, or task context]"
---

# productionos-auto-optimize

## Overview

Top-level Codex alias for the ProductionOS workflow [`auto-optimize`](../../skills/auto-optimize/SKILL.md).

- Source command: [.claude/commands/auto-optimize.md](../../.claude/commands/auto-optimize.md)
- Plugin-local skill: [skills/auto-optimize/SKILL.md](../../skills/auto-optimize/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `auto-optimize`
- Codex intent: Self-improving agent optimization — generates challenger variants of any agent/command, benchmarks against baseline, promotes winners, logs learnings to instincts. Inspired by Karpathy's autoresearch pattern.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
