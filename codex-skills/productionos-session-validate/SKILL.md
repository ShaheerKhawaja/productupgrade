---
name: productionos-session-validate
description: "End-of-session self-training — captures session metrics, extracts patterns via metaclaw-learner, updates instincts, and generates optimization hypotheses for the next run."
argument-hint: "[repo path, target, or task context]"
---

# productionos-session-validate


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

This is the Codex-native workflow wrapper for [.claude/commands/session-validate.md](../../.claude/commands/session-validate.md).

Use it when the user wants this exact ProductionOS workflow, not just the umbrella `productionos` router.

## Source of Truth

1. Read the source command spec at [.claude/commands/session-validate.md](../../.claude/commands/session-validate.md).
2. Use [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md) to confirm runtime support and parity expectations.
3. Preserve the source workflow's guardrails, scope, artifacts, and verification intent.
4. Translate Claude-only slash-command and hook semantics into Codex-native execution instead of copying them literally.

## Codex Behavior

- Summary: End-of-session self-training — captures session metrics, extracts patterns via metaclaw-learner, updates instincts, and generates optimization hypotheses for the next run.
- Use the source command as the behavioral spec, then execute the same intent with Codex-native tools and constraints.

## Inputs

- `mode` — Validation mode: quick (metrics only) | standard (metrics + lessons) | deep (metrics + lessons + hypothesis generation) Default: `standard` Optional.

## Execution Outline

1. Preamble
2. Capture Session Metrics
3. Extract Lessons (standard + deep modes)
4. Generate Optimization Hypotheses (deep mode only)
5. Write Session Report
6. Update Convergence

## Agents And Assets

- Agents: `metaclaw-learner`
- Templates: `PREAMBLE.md`
- Artifacts: `.productionos/CONVERGENCE-LOG.md`, `.productionos/SELF-EVAL-`, `.productionos/SESSION-VALIDATE-HYPOTHESES.md`, `.productionos/SESSION-VALIDATE-REPORT.md`, `.productionos/analytics/skill-usage.jsonl`, `.productionos/instincts/project/{hash}/lessons.json`, `.productionos/sessions/`

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
