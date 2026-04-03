---
name: productionos-ux-genie
description: "UX improvement pipeline — creates user stories from UI guidelines, maps user journeys, identifies friction, dispatches fix agents. The user-experience equivalent of /production-upgrade."
argument-hint: "[repo path, target, or task context]"
---

# productionos-ux-genie

## Overview

Top-level Codex alias for the ProductionOS workflow [`ux-genie`](../../skills/ux-genie/SKILL.md).

- Source command: [.claude/commands/ux-genie.md](../../.claude/commands/ux-genie.md)
- Plugin-local skill: [skills/ux-genie/SKILL.md](../../skills/ux-genie/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `ux-genie`
- Codex intent: Map user flows, identify friction, and translate findings into concrete improvements.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
