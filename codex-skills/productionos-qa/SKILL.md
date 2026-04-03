---
name: productionos-qa
description: "Systematic QA testing with health scoring — tests web app, finds bugs, fixes them iteratively. Regression mode for re-testing known issues."
argument-hint: "[repo path, target, or task context]"
---

# productionos-qa

## Overview

Top-level Codex alias for the ProductionOS workflow [`qa`](../../skills/qa/SKILL.md).

- Source command: [.claude/commands/qa.md](../../.claude/commands/qa.md)
- Plugin-local skill: [skills/qa/SKILL.md](../../skills/qa/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `qa`
- Codex intent: Systematic QA testing with health scoring — tests web app, finds bugs, fixes them iteratively. Regression mode for re-testing known issues.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
