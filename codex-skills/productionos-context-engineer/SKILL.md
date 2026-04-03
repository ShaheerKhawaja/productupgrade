---
name: productionos-context-engineer
description: "Context engineering agent — researches context window optimization from arxiv, builds token-efficient context packages for downstream agents, manages cross-session persistence via MetaClaw."
argument-hint: "[repo path, target, or task context]"
---

# productionos-context-engineer

## Overview

Top-level Codex alias for the ProductionOS workflow [`context-engineer`](../../skills/context-engineer/SKILL.md).

- Source command: [.claude/commands/context-engineer.md](../../.claude/commands/context-engineer.md)
- Plugin-local skill: [skills/context-engineer/SKILL.md](../../skills/context-engineer/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `context-engineer`
- Codex intent: Context engineering agent — researches context window optimization from arxiv, builds token-efficient context packages for downstream agents, manages cross-session persistence via MetaClaw.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
