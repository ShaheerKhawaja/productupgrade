---
name: productionos-auto-swarm
description: "Distributed agent swarm orchestrator — spawns parallel subagent clusters for any task with configurable depth, swarm size, and convergence criteria"
argument-hint: "[repo path, target, or task context]"
---

# productionos-auto-swarm


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

This is the Codex-native workflow wrapper for [.claude/commands/auto-swarm.md](../../.claude/commands/auto-swarm.md).

Use it when the user wants this exact ProductionOS workflow, not just the umbrella `productionos` router.

## Source of Truth

1. Read the source command spec at [.claude/commands/auto-swarm.md](../../.claude/commands/auto-swarm.md).
2. Use [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md) to confirm runtime support and parity expectations.
3. Preserve the source workflow's guardrails, scope, artifacts, and verification intent.
4. Translate Claude-only slash-command and hook semantics into Codex-native execution instead of copying them literally.

## Codex Behavior

- Summary: Parallel task distribution and wave-based execution protocol.
- Expected behavior: Run the workflow serially by default in Codex, or delegate only when the user explicitly wants parallel work.
- Validation: tests/runtime-targets.test.ts

## Inputs

- `task` — The task to swarm on (natural language description) Required.
- `depth` — Research depth: shallow | medium | deep | ultra (default: deep) Default: `deep` Optional.
- `swarm_size` — Agents per swarm wave (default: 7, max: 7) Default: `7` Optional.
- `iterations` — Maximum iteration loops (default: 7, max: 11) Default: `7` Optional.
- `mode` — Swarm mode: research | build | audit | fix | explore (default: auto-detect) Optional.

## Execution Outline

1. Preamble

## Agents And Assets

- Agents: no explicit agent references in the source command.
- Templates: `INVOCATION-PROTOCOL.md`, `PREAMBLE.md`
- Artifacts: `.productionos/SWARM-REPORT.md`

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
- Maximum 7 agents per wave (Claude Code Agent tool limit)
- Maximum 11 waves (77 total agents)
- Per-agent token budget: 100K
- Per-wave token budget: 400K
- Total session budget: 2M tokens
- Emergency stop if any agent exceeds budget
- Read-only mode available (append `--readonly` to prevent code changes)
- All code changes require validation gate before commit
