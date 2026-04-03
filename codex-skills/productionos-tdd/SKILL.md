---
name: productionos-tdd
description: "Test-driven development — write tests first, then implement minimal code to pass. Enforces red-green-refactor cycle with coverage targets."
argument-hint: "[repo path, target, or task context]"
---

# productionos-tdd


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

This is the Codex-native workflow wrapper for [.claude/commands/tdd.md](../../.claude/commands/tdd.md).

Use it when the user wants this exact ProductionOS workflow, not just the umbrella `productionos` router.

## Source of Truth

1. Read the source command spec at [.claude/commands/tdd.md](../../.claude/commands/tdd.md).
2. Use [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md) to confirm runtime support and parity expectations.
3. Preserve the source workflow's guardrails, scope, artifacts, and verification intent.
4. Translate Claude-only slash-command and hook semantics into Codex-native execution instead of copying them literally.

## Codex Behavior

- Summary: Test-driven development — write tests first, then implement minimal code to pass. Enforces red-green-refactor cycle with coverage targets.
- Use the source command as the behavioral spec, then execute the same intent with Codex-native tools and constraints.

## Inputs

- `target` — Feature or file to TDD Optional.
- `coverage` — Coverage target percentage (default: 80) Default: `80` Optional.

## Execution Outline

1. Preamble
2. Write the First Failing Test

## Agents And Assets

- Agents: `self-healer`, `test-architect`
- Templates: `PREAMBLE.md`, `SELF-EVAL-PROTOCOL.md`
- Artifacts: no explicit `.productionos/` artifacts called out in the source command.

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
