---
name: omni-plan
description: "ProductionOS flagship — 13-step orchestrative pipeline with tri-tiered evaluation, recursive convergence, CEO/Eng/Design review chain, CLEAR framework evaluation, multi-model judge tribunal, and autonomous PIVOT/REFINE/PROCEED decisions. Targets 100% production-ready output."
argument-hint: "[repo path, target, or task context]"
---

# omni-plan

## Overview

This is the Codex-native workflow wrapper for [.claude/commands/omni-plan.md](../../.claude/commands/omni-plan.md).

Use it when the user wants this exact ProductionOS workflow, not just the umbrella `productionos` router.

## Source of Truth

1. Read the source command spec at [.claude/commands/omni-plan.md](../../.claude/commands/omni-plan.md).
2. Use [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md) to confirm runtime support and parity expectations.
3. Preserve the source workflow's guardrails, scope, artifacts, and verification intent.
4. Translate Claude-only slash-command and hook semantics into Codex-native execution instead of copying them literally.

## Codex Behavior

- Summary: Full multi-step orchestration pipeline for planning and execution.
- Expected behavior: Chain the major review and execution patterns in a Codex-native sequence without Claude-only assumptions.
- Validation: tests/runtime-targets.test.ts

## Inputs

- `target` — Target directory, repo URL, or idea description Optional.
- `focus` — Focus area: architecture | security | ux | performance | full (default: full) Optional.
- `depth` — Research depth: quick | standard | deep | exhaustive (default: deep) Optional.
- `profile` — Model profile: quality (default) | balanced | budget. Budget enables ES-CoT and reduces agent depth. Default: `quality` Optional.

## Execution Outline

1. Preamble

## Agents And Assets

- Agents: no explicit agent references in the source command.
- Templates: `INVOCATION-PROTOCOL.md`, `PREAMBLE.md`
- Artifacts: `.productionos/CONVERGENCE-DATA.json`, `.productionos/EVAL-CLEAR.md`, `.productionos/INTEL-CONTEXT.md`, `.productionos/INTEL-RESEARCH.md`, `.productionos/JUDGE-PANEL-{N}.md`, `.productionos/OMNI-PLAN.md`, `.productionos/OMNI-REPORT.md`, `.productionos/REVIEW-CEO.md`, `.productionos/REVIEW-DESIGN.md`, `.productionos/REVIEW-ENGINEERING.md`

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
