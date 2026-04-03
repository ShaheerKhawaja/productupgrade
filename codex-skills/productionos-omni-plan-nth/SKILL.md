---
name: productionos-omni-plan-nth
description: "Nth-iteration omni-plan — recursive orchestration that chains ALL ProductionOS skills and agents, evaluates strictly per iteration, and loops until 10/10 is achieved. Each iteration can invoke any command or skill in the system."
argument-hint: "[repo path, target, or task context]"
---

# productionos-omni-plan-nth


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

This is the Codex-native workflow wrapper for [.claude/commands/omni-plan-nth.md](../../.claude/commands/omni-plan-nth.md).

Use it when the user wants this exact ProductionOS workflow, not just the umbrella `productionos` router.

## Source of Truth

1. Read the source command spec at [.claude/commands/omni-plan-nth.md](../../.claude/commands/omni-plan-nth.md).
2. Use [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md) to confirm runtime support and parity expectations.
3. Preserve the source workflow's guardrails, scope, artifacts, and verification intent.
4. Translate Claude-only slash-command and hook semantics into Codex-native execution instead of copying them literally.

## Codex Behavior

- Summary: Recursive top-level orchestrator aiming for production-ready convergence.
- Expected behavior: Iterate the full orchestration loop until quality targets are met or clearly plateau.
- Validation: tests/runtime-targets.test.ts

## Inputs

- `target` — Target directory, repo URL, or idea description Optional.
- `max_iterations` — Maximum iterations before forced exit (default: unlimited, practical cap: 20) Default: `20` Optional.
- `focus` — Focus area: architecture | security | ux | performance | full (default: full) Default: `full` Optional.
- `max_cost` — Maximum accumulated cost in USD before halting (default: 20) Default: `20` Optional.

## Execution Outline

1. Preamble

## Agents And Assets

- Agents: `self-evaluator`, `self-healer`
- Templates: `INVOCATION-PROTOCOL.md`, `PREAMBLE.md`, `SELF-EVAL-PROTOCOL.md`
- Artifacts: `.productionos/AUDIT-SECURITY.md`, `.productionos/CONVERGENCE-LOG.md`, `.productionos/EVAL-CLEAR.md`, `.productionos/ITERATION-{N}.md`, `.productionos/OMNI-NTH-COST-HALT.md`, `.productionos/OMNI-NTH-FINAL.md`, `.productionos/OMNI-NTH-REPORT.md`, `.productionos/RESEARCH-security-`, `.productionos/SCORE-BASELINE.md`, `.productionos/SKILL-MAP.md`, `.productionos/SWARM-NTH-REPORT.md`, `.productionos/SWARM-REPORT.md`, `.productionos/TOKEN-BUDGET.md`, `.productionos/self-eval/`

## Workflow

1. Load only the agents, templates, prompts, and docs referenced by the source command.
2. Execute the workflow intent with Codex-native tools.
3. If the source command implies parallel agent work, only delegate when the user explicitly wants that overhead.
4. Verify with the smallest relevant checks before concluding.
5. Summarize what changed, what was verified, and what still needs human approval.

## Guardrails

- Do not claim that Claude-only marketplace, hook, or slash-command behavior runs directly in Codex.
- Keep the scope faithful to the source command rather than broadening into a generic repo audit.
- Prefer concrete outputs and validation over describing the workflow abstractly.
- **Cost ceiling: $ARGUMENTS.max_cost (default $20). Enforced via Phase 0 cost check before every iteration. Hard halt when exceeded.**
- Maximum iterations: $ARGUMENTS.max_iterations (default 20, hard cap 50)
- Per-iteration agent limit: 21 agents
- Per-iteration token budget: 800K
- Regression protection: rollback any batch that causes dimension drop > 0.5
- Self-regulation: if 3 consecutive iterations show no improvement, force a strategy pivot
- Emergency stop: if total session tokens exceed 5M, pause and ask user to continue
