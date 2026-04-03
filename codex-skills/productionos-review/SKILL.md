---
name: productionos-review
description: "Pre-landing code review — analyzes diff for SQL safety, LLM trust boundaries, conditional side effects, missing tests, dependency risks, and security issues."
argument-hint: "[repo path, target, or task context]"
---

# productionos-review

## Overview

Top-level Codex alias for the ProductionOS workflow [`review`](../../skills/review/SKILL.md).

- Source command: [.claude/commands/review.md](../../.claude/commands/review.md)
- Plugin-local skill: [skills/review/SKILL.md](../../skills/review/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `review`
- Codex intent: Use Codex in review mode and report concrete findings before summaries.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
