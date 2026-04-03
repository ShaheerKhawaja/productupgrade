---
name: productionos-context-engineer
description: "Context engineering agent — researches context window optimization from arxiv, builds token-efficient context packages for downstream agents, manages cross-session persistence via MetaClaw."
argument-hint: "[repo path, target, or task context]"
---

# productionos-context-engineer


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

This is the Codex-native workflow wrapper for [.claude/commands/context-engineer.md](../../.claude/commands/context-engineer.md).

Use it when the user wants this exact ProductionOS workflow, not just the umbrella `productionos` router.

## Source of Truth

1. Read the source command spec at [.claude/commands/context-engineer.md](../../.claude/commands/context-engineer.md).
2. Use [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md) to confirm runtime support and parity expectations.
3. Preserve the source workflow's guardrails, scope, artifacts, and verification intent.
4. Translate Claude-only slash-command and hook semantics into Codex-native execution instead of copying them literally.

## Codex Behavior

- Summary: Context engineering agent — researches context window optimization from arxiv, builds token-efficient context packages for downstream agents, manages cross-session persistence via MetaClaw.
- Use the source command as the behavioral spec, then execute the same intent with Codex-native tools and constraints.

## Inputs

- `task` — What context to engineer: 'for-omni-plan' | 'for-agents' | 'research-arxiv' | custom Default: `for-omni-plan` Optional.
- `budget` — Token budget for context package (default: 50000) Default: `50000` Optional.

## Execution Outline

1. Follow the source command sections in order and preserve its exit criteria.

## Agents And Assets

- Agents: no explicit agent references in the source command.
- Templates: no explicit shared templates beyond general repo conventions.
- Artifacts: `.productionos/CONTEXT-PACKAGE.md`, `.productionos/learned/`

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
