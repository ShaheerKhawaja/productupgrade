---
name: productionos-designer-upgrade
description: "Full UI/UX redesign pipeline — audits design, creates design systems, generates interactive HTML mockups, launches local browser for user interaction. Fuses /production-upgrade rigor with design agency methodology."
argument-hint: "[repo path, target, or task context]"
---

# productionos-designer-upgrade


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

This is the Codex-native workflow wrapper for [.claude/commands/designer-upgrade.md](../../.claude/commands/designer-upgrade.md).

Use it when the user wants this exact ProductionOS workflow, not just the umbrella `productionos` router.

## Source of Truth

1. Read the source command spec at [.claude/commands/designer-upgrade.md](../../.claude/commands/designer-upgrade.md).
2. Use [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md) to confirm runtime support and parity expectations.
3. Preserve the source workflow's guardrails, scope, artifacts, and verification intent.
4. Translate Claude-only slash-command and hook semantics into Codex-native execution instead of copying them literally.

## Codex Behavior

- Summary: Design audit, system creation, mockups, and implementation plan.
- Expected behavior: Build a UX audit and redesign plan, then route into interface work when needed.
- Validation: tests/runtime-targets.test.ts

## Inputs

- `target` — Target frontend directory or repo (default: current directory) Optional.
- `grade` — Target design score (default: 10.0) Default: `10.0` Optional.
- `focus` — Focus areas: design-system | mockups | audit | full (default: full) Default: `full` Optional.
- `mockup_views` — Comma-separated list of views to mockup (default: auto-detect top 5) Optional.
- `competitive` — Number of competitor products to analyze (default: 5) Default: `5` Optional.

## Execution Outline

1. Preamble

## Agents And Assets

- Agents: `designer-upgrade`, `quality-loop-controller`
- Templates: `PREAMBLE.md`, `SELF-EVAL-PROTOCOL.md`
- Artifacts: `.productionos/designer-upgrade/`, `.productionos/designer-upgrade/{audit`

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
