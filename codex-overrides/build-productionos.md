---
name: build-productionos
description: "ProductionOS smart router — single entry point that routes to the right pipeline based on intent. The ONLY command new users need to know."
argument-hint: "[repo path, target, or task context]"
---

# build-productionos

## Overview

This is the Codex-native workflow wrapper for [.claude/commands/build-productionos.md](../../.claude/commands/build-productionos.md).

Use it when the user wants this exact ProductionOS workflow, not just the umbrella `productionos` router.

## Source of Truth

1. Read the source command spec at [.claude/commands/build-productionos.md](../../.claude/commands/build-productionos.md).
2. Use [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md) to confirm runtime support and parity expectations.
3. Preserve the source workflow's guardrails, scope, artifacts, and verification intent.
4. Translate Claude-only slash-command and hook semantics into Codex-native execution instead of copying them literally.

## Codex Behavior

- Summary: ProductionOS smart router — single entry point that routes to the right pipeline based on intent. The ONLY command new users need to know.
- Use the source command as the behavioral spec, then execute the same intent with Codex-native tools and constraints.

## First-Run Onboarding
If session context contains `FIRST_RUN: true`, read `templates/ONBOARDING.md` and execute the onboarding flow before any other dispatch. This only runs once — the stop hook marks `.onboarded` after the first session.

## Step 0: Smart Routing

Before static intent classification, check if the user's goal matches a composite skill chain. Run the skill router:

```bash
ROUTE_RESULT=$(bun run "${CLAUDE_PLUGIN_ROOT}/scripts/skill-router.ts" "USER_GOAL" 2>/dev/null || echo '{}')
```

Parse the JSON result. If `confidence` > 0.6 and `chain` is non-empty, execute the skills in the chain sequentially. Each chain step's output feeds into the next step as context. If confidence <= 0.6 or the router fails, fall through to the existing static intent classification below.

When multiple skills match the same intent, consult SKILL_REGISTRY.md for the canonical source.

## Inputs

- `intent` — What you want to do. Natural language or keyword. Examples: 'audit this project', 'fix the frontend', 'research authentication', 'review my PR', 'ship it', 'debug the login bug' Required.
- `target` — Target directory, file, or URL (default: current directory) Optional.

## Execution Outline

1. Preamble
2. .5: Smart Agent Routing (Production House Layer 1)
3. Intent Classification (Static Fallback)
4. Confirm Route
5. Execute
6. Post-Route Self-Eval

## Agents And Assets

- Agents: no explicit agent references in the source command.
- Templates: `PREAMBLE.md`
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
