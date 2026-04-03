---
name: productionos-designer-upgrade
description: "Full UI/UX redesign pipeline — audits design, creates design systems, generates interactive HTML mockups, launches local browser for user interaction. Fuses /production-upgrade rigor with design agency methodology."
argument-hint: "[repo path, target, or task context]"
---

# productionos-designer-upgrade

## Overview

Top-level Codex alias for the ProductionOS workflow [`designer-upgrade`](../../skills/designer-upgrade/SKILL.md).

- Source command: [.claude/commands/designer-upgrade.md](../../.claude/commands/designer-upgrade.md)
- Plugin-local skill: [skills/designer-upgrade/SKILL.md](../../skills/designer-upgrade/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `designer-upgrade`
- Codex intent: Build a UX audit and redesign plan, then route into interface work when needed.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
