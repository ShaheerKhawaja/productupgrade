---
name: productionos-refine
description: "Review and refine flagged RLM outputs — reads pending signals, dispatches L17 SelfRefine (generate critique, refine, converge), updates signals with human verdicts"
argument-hint: "[repo path, target, or task context]"
---

# productionos-refine

## Overview

Top-level Codex alias for the ProductionOS workflow [`refine`](../../skills/refine/SKILL.md).

- Source command: [.claude/commands/refine.md](../../.claude/commands/refine.md)
- Plugin-local skill: [skills/refine/SKILL.md](../../skills/refine/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `refine`
- Codex intent: Review and refine flagged RLM outputs — reads pending signals, dispatches L17 SelfRefine (generate critique, refine, converge), updates signals with human verdicts

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
