---
name: self-eval
description: "Run self-evaluation on recent work — questions quality, necessity, correctness, dependencies, completeness, learning, and honesty. Enabled by default in all flows. Standalone invocation for on-demand evaluation."
argument-hint: "[repo path, target, or task context]"
---

# self-eval

## Overview

This is the Codex-native workflow wrapper for [.claude/commands/self-eval.md](../../.claude/commands/self-eval.md).

Use it when the user wants this exact ProductionOS workflow, not just the umbrella `productionos` router.

## Source of Truth

1. Read the source command spec at [.claude/commands/self-eval.md](../../.claude/commands/self-eval.md).
2. Use [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md) to confirm runtime support and parity expectations.
3. Preserve the source workflow's guardrails, scope, artifacts, and verification intent.
4. Translate Claude-only slash-command and hook semantics into Codex-native execution instead of copying them literally.

## Codex Behavior

- Summary: Run self-evaluation on recent work — questions quality, necessity, correctness, dependencies, completeness, learning, and honesty. Enabled by default in all flows. Standalone invocation for on-demand evaluation.
- Use the source command as the behavioral spec, then execute the same intent with Codex-native tools and constraints.

## Inputs

- `target` — What to evaluate: 'last' (last agent output), 'session' (all session work), 'diff' (git diff), or a specific .productionos/ artifact path Default: `last` Optional.
- `depth` — Evaluation depth: quick (Q1-Q3 only) | standard (all 7 questions) | deep (7 questions + adversarial challenge) Default: `standard` Optional.
- `heal` — Enable self-heal loop: on | off (default: on) Default: `on` Optional.

## Execution Outline

1. Preamble
2. Determine Evaluation Target
3. Dispatch Self-Evaluator Agent
4. Process Results
5. Deep Mode (if depth = "deep")
6. Session Summary (if target = "session")

## Agents And Assets

- Agents: `self-evaluator`
- Templates: `PREAMBLE.md`
- Artifacts: `.productionos/self-eval/`, `.productionos/self-eval/SESSION-{date}.md`, `.productionos/self-eval/{file}`, `.productionos/self-eval/{latest}`, `.productionos/self-eval/{timestamp}-adversarial.md`, `.productionos/self-eval/{timestamp}-eval.md`

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
