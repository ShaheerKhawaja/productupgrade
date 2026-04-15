---
name: productionos-writing-plans
description: "Implementation planning workflow that turns approved ideas into dependency-aware execution plans."
argument-hint: "[spec, feature, or repo path]"
---

# productionos-writing-plans


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

Use this as the Codex-first execution-planning workflow. It should convert an approved problem or design into an implementation-ready plan with clear tasks, dependencies, risks, and verification.

## Inputs

- approved spec or feature
- optional repo scope

## Codex Workflow

Source references:
- `.claude/commands/writing-plans.md`

1. restate the approved scope
2. break the work into tasks
3. map dependencies and risk
4. define verification and acceptance checks

## Expected Output

- ordered task plan
- dependency map
- risk matrix
- verification plan

## Guardrails

- do not blur planning and implementation
- keep the plan specific enough that another engineer could execute it directly
