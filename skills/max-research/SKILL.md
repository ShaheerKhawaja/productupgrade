---
name: max-research
description: "Nuclear-scale autonomous research — deploys 500-1000 agents in ONE massive simultaneous wave for exhaustive topic saturation. Deep-research methodology × auto-swarm scale = maximum parallel intelligence. WARNING: Extreme resource consumption."
argument-hint: "[repo path, target, or task context]"
---

# max-research

## Overview

This is the Codex-native workflow wrapper for [.claude/commands/max-research.md](../../.claude/commands/max-research.md).

Use it when the user wants this exact ProductionOS workflow, not just the umbrella `productionos` router.

## Source of Truth

1. Read the source command spec at [.claude/commands/max-research.md](../../.claude/commands/max-research.md).
2. Use [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md) to confirm runtime support and parity expectations.
3. Preserve the source workflow's guardrails, scope, artifacts, and verification intent.
4. Translate Claude-only slash-command and hook semantics into Codex-native execution instead of copying them literally.

## Codex Behavior

- Summary: Nuclear-scale autonomous research — deploys 500-1000 agents in ONE massive simultaneous wave for exhaustive topic saturation. Deep-research methodology × auto-swarm scale = maximum parallel intelligence. WARNING: Extreme resource consumption.
- Use the source command as the behavioral spec, then execute the same intent with Codex-native tools and constraints.

## Inputs

- `topic` — Research topic, question, or domain to exhaustively research Required.
- `agents` — Total agents to deploy in single wave: 500 | 750 | 1000 (default: 500) Default: `500` Optional.
- `domains` — Number of research domains to decompose into (default: 10, max: 25) Default: `10` Optional.
- `depth` — Per-agent research depth: deep | ultra | exhaustive (default: ultra) Default: `ultra` Optional.
- `sources` — Source types: arxiv | web | docs | repos | all (default: all) Default: `all` Optional.
- `skip_warning` — Skip the usage warning (--skip-warning). Default: false Default: `false` Optional.

## Execution Outline

1. Follow the source command sections in order and preserve its exit criteria.

## Agents And Assets

- Agents: no explicit agent references in the source command.
- Templates: `INVOCATION-PROTOCOL.md`, `PREAMBLE.md`, `PROMPT-COMPOSITION.md`
- Artifacts: `.productionos/MAX-RESEARCH-DOMAIN-{D}-{domain-slug}.md`, `.productionos/MAX-RESEARCH-INDEX.md`, `.productionos/MAX-RESEARCH-REPORT-{topic-slug}.md`, `.productionos/MAX-RESEARCH-SYNTHESIS.md`, `.productionos/MAX-WAVE/`, `.productionos/MAX-WAVE/agent-{D}-{N}.md`, `.productionos/context-packages/MAX-RESEARCH-{domain-slug}.md`, `.productionos/learned/max-research-meta-{topic-slug}.jsonl`

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
