---
name: productionos-browse
description: "Headless browser for QA testing, site inspection, and interaction verification. Navigate, screenshot, click, fill forms, capture snapshots."
argument-hint: "[repo path, target, or task context]"
---

# productionos-browse

## Overview

Top-level Codex alias for the ProductionOS workflow [`browse`](../../skills/browse/SKILL.md).

- Source command: [.claude/commands/browse.md](../../.claude/commands/browse.md)
- Plugin-local skill: [skills/browse/SKILL.md](../../skills/browse/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `browse`
- Codex intent: Headless browser for QA testing, site inspection, and interaction verification. Navigate, screenshot, click, fill forms, capture snapshots.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
