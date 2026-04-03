---
name: productionos-session-validate
description: "End-of-session self-training — captures session metrics, extracts patterns via metaclaw-learner, updates instincts, and generates optimization hypotheses for the next run."
argument-hint: "[repo path, target, or task context]"
---

# productionos-session-validate

## Overview

Top-level Codex alias for the ProductionOS workflow [`session-validate`](../../skills/session-validate/SKILL.md).

- Source command: [.claude/commands/session-validate.md](../../.claude/commands/session-validate.md)
- Plugin-local skill: [skills/session-validate/SKILL.md](../../skills/session-validate/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `session-validate`
- Codex intent: End-of-session self-training — captures session metrics, extracts patterns via metaclaw-learner, updates instincts, and generates optimization hypotheses for the next run.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
