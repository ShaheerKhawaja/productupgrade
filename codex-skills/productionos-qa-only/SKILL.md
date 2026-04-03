---
name: productionos-qa-only
description: "Report-only QA testing — produces structured report with health score, screenshots, and repro steps. No fixes applied."
argument-hint: "[repo path, target, or task context]"
---

# productionos-qa-only

## Overview

Top-level Codex alias for the ProductionOS workflow [`qa-only`](../../skills/qa-only/SKILL.md).

- Source command: [.claude/commands/qa-only.md](../../.claude/commands/qa-only.md)
- Plugin-local skill: [skills/qa-only/SKILL.md](../../skills/qa-only/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `qa-only`
- Codex intent: Report-only QA testing — produces structured report with health score, screenshots, and repro steps. No fixes applied.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
