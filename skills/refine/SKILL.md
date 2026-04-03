---
name: refine
description: "Review and refine flagged RLM outputs — reads pending signals, dispatches L17 SelfRefine (generate critique, refine, converge), updates signals with human verdicts"
argument-hint: "[repo path, target, or task context]"
---

# refine

## Overview

This is the Codex-native workflow wrapper for [.claude/commands/refine.md](../../.claude/commands/refine.md).

Use it when the user wants this exact ProductionOS workflow, not just the umbrella `productionos` router.

## Source of Truth

1. Read the source command spec at [.claude/commands/refine.md](../../.claude/commands/refine.md).
2. Use [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md) to confirm runtime support and parity expectations.
3. Preserve the source workflow's guardrails, scope, artifacts, and verification intent.
4. Translate Claude-only slash-command and hook semantics into Codex-native execution instead of copying them literally.

## Codex Behavior

- Summary: Review and refine flagged RLM outputs — reads pending signals, dispatches L17 SelfRefine (generate critique, refine, converge), updates signals with human verdicts
- Use the source command as the behavioral spec, then execute the same intent with Codex-native tools and constraints.

## Inputs

- `mode` — Mode: interactive (default, asks for input) | auto (auto-approve PASS, auto-refine FLAG) | review-only (just show signals, no refinement) Default: `interactive` Optional.
- `max_signals` — Maximum number of pending signals to process (default: 10) Default: `10` Optional.

## Execution Outline

1. Preamble
2. Load Pending Signals
3. Display Signal Summary
4. Process Each Signal
5. Update Pending Signals
6. Log Refinement Results to Metrics
7. Summary Report

## Agents And Assets

- Agents: no explicit agent references in the source command.
- Templates: `PREAMBLE.md`
- Artifacts: `.productionos/recursive/metrics`, `.productionos/recursive/pending`, `.productionos/recursive/pending/`

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
