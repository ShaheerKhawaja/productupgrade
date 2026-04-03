---
name: auto-swarm-nth
description: "Nth-iteration agent swarm — spawns parallel agent waves, evaluates strictly per wave, re-swarms gaps until 100% coverage and 10/10 quality. Can invoke any ProductionOS skill or command within waves."
argument-hint: "[repo path, target, or task context]"
---

# auto-swarm-nth

## Overview

This is the Codex-native workflow wrapper for [.claude/commands/auto-swarm-nth.md](../../.claude/commands/auto-swarm-nth.md).

Use it when the user wants this exact ProductionOS workflow, not just the umbrella `productionos` router.

## Source of Truth

1. Read the source command spec at [.claude/commands/auto-swarm-nth.md](../../.claude/commands/auto-swarm-nth.md).
2. Use [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md) to confirm runtime support and parity expectations.
3. Preserve the source workflow's guardrails, scope, artifacts, and verification intent.
4. Translate Claude-only slash-command and hook semantics into Codex-native execution instead of copying them literally.

## Codex Behavior

- Summary: Recursive swarm orchestration until coverage and quality thresholds are met.
- Expected behavior: Repeat swarm-style execution until gaps close, while translating agent waves into Codex-native orchestration.
- Validation: tests/runtime-targets.test.ts

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
