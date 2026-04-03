---
name: auto-mode
description: "Idea-to-running-code lifecycle orchestration. 10-phase pipeline with 5 hard decision gates, wave-based parallelism, and STATE.json resumability. Composes /deep-research, /auto-swarm-nth, /production-upgrade, /security-audit, and /ship into a single end-to-end flow."
argument-hint: "[repo path, target, or task context]"
---

# auto-mode

## Overview

This is the Codex-native workflow wrapper for [.claude/commands/auto-mode.md](../../.claude/commands/auto-mode.md).

Use it when the user wants this exact ProductionOS workflow, not just the umbrella `productionos` router.

## Source of Truth

1. Read the source command spec at [.claude/commands/auto-mode.md](../../.claude/commands/auto-mode.md).
2. Use [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md) to confirm runtime support and parity expectations.
3. Preserve the source workflow's guardrails, scope, artifacts, and verification intent.
4. Translate Claude-only slash-command and hook semantics into Codex-native execution instead of copying them literally.

## Codex Behavior

- Summary: Idea-to-running-code lifecycle orchestration. 10-phase pipeline with 5 hard decision gates, wave-based parallelism, and STATE.json resumability. Composes /deep-research, /auto-swarm-nth, /production-upgrade, /security-audit, and /ship into a single end-to-end flow.
- Use the source command as the behavioral spec, then execute the same intent with Codex-native tools and constraints.

## Inputs

- `idea` — The idea to build (text description, file path, or URL) Required.
- `depth` — Pipeline depth: quick | standard | deep | exhaustive (default: deep) Default: `deep` Optional.
- `resume` — Resume from last checkpoint — reads STATE.json (default: false) Default: `false` Optional.
- `output_dir` — Where to create the project (default: current working directory) Optional.

## Execution Outline

1. Preamble

## Agents And Assets

- Agents: `adversarial-reviewer`, `api-contract-validator`, `architecture-designer`, `business-logic-validator`, `code-reviewer`, `comparative-analyzer`, `context-retriever`, `database-auditor`, `debate-tribunal`, `decision-loop`, `deep-researcher`, `density-summarizer`, `dependency-scanner`, `discuss-phase`, `dynamic-planner`, `ecosystem-scanner`, `frontend-designer`, `gap-analyzer`, `gitops`, `intake-interviewer`, `llm-judge`, `naming-enforcer`, `performance-profiler`, `prd-generator`, `refactoring-agent`, `requirements-tracer`, `research-pipeline`, `scaffold-generator`, `security-hardener`, `swarm-orchestrator`, `test-architect`, `ux-auditor`, `verification-gate`
- Templates: `INVOCATION-PROTOCOL.md`, `PREAMBLE.md`
- Artifacts: `.productionos/auto-mode/`, `.productionos/auto-mode/STATE.json`, `.productionos/auto-mode/STATE.json.bak`, `.productionos/auto-mode/{ARTIFACT}.md`

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
