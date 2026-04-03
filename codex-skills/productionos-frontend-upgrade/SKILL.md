---
name: productionos-frontend-upgrade
description: "Full-stack frontend upgrade pipeline — fuses /production-upgrade iterative audit with /plan-ceo-review vision and /plan-eng-review rigor. Deploys parallel auto-swarm agents for iterative audit and execution. Enriched with /deep-research for competitive parity."
argument-hint: "[repo path, target, or task context]"
---

# productionos-frontend-upgrade


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

This is the Codex-native workflow wrapper for [.claude/commands/frontend-upgrade.md](../../.claude/commands/frontend-upgrade.md).

Use it when the user wants this exact ProductionOS workflow, not just the umbrella `productionos` router.

## Source of Truth

1. Read the source command spec at [.claude/commands/frontend-upgrade.md](../../.claude/commands/frontend-upgrade.md).
2. Use [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md) to confirm runtime support and parity expectations.
3. Preserve the source workflow's guardrails, scope, artifacts, and verification intent.
4. Translate Claude-only slash-command and hook semantics into Codex-native execution instead of copying them literally.

## Codex Behavior

- Summary: Full-stack frontend upgrade pipeline — fuses /production-upgrade iterative audit with /plan-ceo-review vision and /plan-eng-review rigor. Deploys parallel auto-swarm agents for iterative audit and execution. Enriched with /deep-research for competitive parity.
- Use the source command as the behavioral spec, then execute the same intent with Codex-native tools and constraints.

## Inputs

- `target` — Target frontend directory or repo (default: current directory) Optional.
- `grade` — Target grade (default: 10.0) Default: `10.0` Optional.
- `iterations` — Max convergence iterations (default: 7) Default: `7` Optional.
- `swarm_size` — Parallel audit agents per wave (default: 7) Default: `7` Optional.
- `focus` — Comma-separated focus areas (e.g., design,performance,a11y). Empty = full audit. Optional.

## Execution Outline

1. Preamble + Discovery

## Agents And Assets

- Agents: no explicit agent references in the source command.
- Templates: `PREAMBLE.md`
- Artifacts: `.productionos/CONVERGENCE-LOG.md`, `.productionos/FRONTEND-AUDIT-MERGED.md`, `.productionos/FRONTEND-BASELINE.md`, `.productionos/FRONTEND-ENG-PLAN.md`, `.productionos/FRONTEND-REVERTS.md`, `.productionos/FRONTEND-UPGRADE-REPORT.md`, `.productionos/FRONTEND-VISION.md`, `.productionos/swarm/wave-{N}/agent-{N}-{dimension}.md`

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
- Preserve the scope and stop conditions from the source command rather than broadening into a generic repo audit.
