---
name: productionos-self-eval
description: "Run self-evaluation on recent work — questions quality, necessity, correctness, dependencies, completeness, learning, and honesty. Enabled by default in all flows. Standalone invocation for on-demand evaluation."
argument-hint: "[repo path, target, or task context]"
---

# productionos-self-eval

## Overview

Top-level Codex alias for the ProductionOS workflow [`self-eval`](../../skills/self-eval/SKILL.md).

- Source command: [.claude/commands/self-eval.md](../../.claude/commands/self-eval.md)
- Plugin-local skill: [skills/self-eval/SKILL.md](../../skills/self-eval/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `self-eval`
- Codex intent: Run self-evaluation on recent work — questions quality, necessity, correctness, dependencies, completeness, learning, and honesty. Enabled by default in all flows. Standalone invocation for on-demand evaluation.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
