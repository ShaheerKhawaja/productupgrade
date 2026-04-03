---
name: productionos-build-productionos
description: "Smart router entrypoint that maps user intent to the most relevant ProductionOS workflow."
argument-hint: "[intent, repo path, or workflow goal]"
---

# productionos-build-productionos


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

Use this as the Codex-first smart router for ProductionOS. It should classify the user’s intent and route them into the most appropriate workflow instead of making them pick from the whole command catalog themselves.

## Inputs

- user intent
- optional repo context

## Codex Workflow

1. classify the intent
2. identify the closest ProductionOS workflow
3. explain the routing choice briefly
4. hand off into that workflow

## Expected Output

- selected workflow
- routing rationale

## Guardrails

- route quickly, do not linger in generic triage
- if multiple workflows fit, choose the one with the clearest user outcome
