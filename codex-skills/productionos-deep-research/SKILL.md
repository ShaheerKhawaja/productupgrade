---
name: productionos-deep-research
description: "8-phase autonomous research pipeline with multi-source discovery, 4-layer citation verification, hypothesis generation, and PIVOT/REFINE/PROCEED decision loops. Confidence-gated — loops until 95%+ confidence."
argument-hint: "[repo path, target, or task context]"
---

# productionos-deep-research

## Overview

Top-level Codex alias for the ProductionOS workflow [`deep-research`](../../skills/deep-research/SKILL.md).

- Source command: [.claude/commands/deep-research.md](../../.claude/commands/deep-research.md)
- Plugin-local skill: [skills/deep-research/SKILL.md](../../skills/deep-research/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `deep-research`
- Codex intent: 8-phase autonomous research pipeline with multi-source discovery, 4-layer citation verification, hypothesis generation, and PIVOT/REFINE/PROCEED decision loops. Confidence-gated — loops until 95%+ confidence.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
