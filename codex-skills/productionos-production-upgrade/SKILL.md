---
name: productionos-production-upgrade
description: "Run the full product upgrade pipeline — 55-agent iterative review with CEO/Engineering/UX/QA parallel loops"
argument-hint: "[repo path, target, or task context]"
---

# productionos-production-upgrade

## Overview

Top-level Codex alias for the ProductionOS workflow [`production-upgrade`](../../skills/production-upgrade/SKILL.md).

- Source command: [.claude/commands/production-upgrade.md](../../.claude/commands/production-upgrade.md)
- Plugin-local skill: [skills/production-upgrade/SKILL.md](../../skills/production-upgrade/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `production-upgrade`
- Codex intent: Run a repo audit, prioritize high-leverage defects, implement bounded fixes, then validate before reporting.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
