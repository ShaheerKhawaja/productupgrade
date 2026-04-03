---
name: productionos-auto-mode
description: "Idea-to-running-code lifecycle orchestration. 10-phase pipeline with 5 hard decision gates, wave-based parallelism, and STATE.json resumability. Composes /deep-research, /auto-swarm-nth, /production-upgrade, /security-audit, and /ship into a single end-to-end flow."
argument-hint: "[repo path, target, or task context]"
---

# productionos-auto-mode

## Overview

Top-level Codex alias for the ProductionOS workflow [`auto-mode`](../../skills/auto-mode/SKILL.md).

- Source command: [.claude/commands/auto-mode.md](../../.claude/commands/auto-mode.md)
- Plugin-local skill: [skills/auto-mode/SKILL.md](../../skills/auto-mode/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `auto-mode`
- Codex intent: Idea-to-running-code lifecycle orchestration. 10-phase pipeline with 5 hard decision gates, wave-based parallelism, and STATE.json resumability. Composes /deep-research, /auto-swarm-nth, /production-upgrade, /security-audit, and /ship into a single end-to-end flow.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
