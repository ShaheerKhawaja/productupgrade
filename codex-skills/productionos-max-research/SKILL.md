---
name: productionos-max-research
description: "Nuclear-scale autonomous research — deploys 500-1000 agents in ONE massive simultaneous wave for exhaustive topic saturation. Deep-research methodology × auto-swarm scale = maximum parallel intelligence. WARNING: Extreme resource consumption."
argument-hint: "[repo path, target, or task context]"
---

# productionos-max-research

## Overview

Top-level Codex alias for the ProductionOS workflow [`max-research`](../../skills/max-research/SKILL.md).

- Source command: [.claude/commands/max-research.md](../../.claude/commands/max-research.md)
- Plugin-local skill: [skills/max-research/SKILL.md](../../skills/max-research/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `max-research`
- Codex intent: Nuclear-scale autonomous research — deploys 500-1000 agents in ONE massive simultaneous wave for exhaustive topic saturation. Deep-research methodology × auto-swarm scale = maximum parallel intelligence. WARNING: Extreme resource consumption.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
