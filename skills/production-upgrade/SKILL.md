---
name: production-upgrade
description: "Run the full product upgrade pipeline — 55-agent iterative review with CEO/Engineering/UX/QA parallel loops"
argument-hint: "[repo path, target, or task context]"
---

# production-upgrade

## Overview

This is the Codex-native workflow wrapper for [.claude/commands/production-upgrade.md](../../.claude/commands/production-upgrade.md).

Use it when the user wants this exact ProductionOS workflow, not just the umbrella `productionos` router.

## Source of Truth

1. Read the source command spec at [.claude/commands/production-upgrade.md](../../.claude/commands/production-upgrade.md).
2. Use [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md) to confirm runtime support and parity expectations.
3. Preserve the source workflow's guardrails, scope, artifacts, and verification intent.
4. Translate Claude-only slash-command and hook semantics into Codex-native execution instead of copying them literally.

## Codex Behavior

- Summary: Repo-wide audit, planning, fix batching, and validation loop.
- Expected behavior: Run a repo audit, prioritize high-leverage defects, implement bounded fixes, then validate before reporting.
- Validation: tests/runtime-targets.test.ts, tests/behavioral.test.ts

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
