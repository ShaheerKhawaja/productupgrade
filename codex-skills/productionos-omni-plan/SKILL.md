---
name: productionos-omni-plan
description: "ProductionOS flagship — 13-step orchestrative pipeline with tri-tiered evaluation, recursive convergence, CEO/Eng/Design review chain, CLEAR framework evaluation, multi-model judge tribunal, and autonomous PIVOT/REFINE/PROCEED decisions. Targets 100% production-ready output."
argument-hint: "[repo path, target, or task context]"
---

# productionos-omni-plan

## Overview

Top-level Codex alias for the ProductionOS workflow [`omni-plan`](../../skills/omni-plan/SKILL.md).

- Source command: [.claude/commands/omni-plan.md](../../.claude/commands/omni-plan.md)
- Plugin-local skill: [skills/omni-plan/SKILL.md](../../skills/omni-plan/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `omni-plan`
- Codex intent: Chain the major review and execution patterns in a Codex-native sequence without Claude-only assumptions.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
