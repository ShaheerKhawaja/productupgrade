---
name: productionos-agentic-eval
description: "Niche-agnostic agentic evaluator using CLEAR v2.0 framework — 6-domain assessment, 8 analysis dimensions, 6-tier source prioritization, evidence strength ratings, and decision trees. Evaluates any plan, codebase, or research output."
argument-hint: "[repo path, target, or task context]"
---

# productionos-agentic-eval

## Overview

Top-level Codex alias for the ProductionOS workflow [`agentic-eval`](../../skills/agentic-eval/SKILL.md).

- Source command: [.claude/commands/agentic-eval.md](../../.claude/commands/agentic-eval.md)
- Plugin-local skill: [skills/agentic-eval/SKILL.md](../../skills/agentic-eval/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `agentic-eval`
- Codex intent: Niche-agnostic agentic evaluator using CLEAR v2.0 framework — 6-domain assessment, 8 analysis dimensions, 6-tier source prioritization, evidence strength ratings, and decision trees. Evaluates any plan, codebase, or research output.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
