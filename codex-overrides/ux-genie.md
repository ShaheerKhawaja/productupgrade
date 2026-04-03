---
name: ux-genie
description: "UX improvement pipeline — creates user stories from UI guidelines, maps user journeys, identifies friction, dispatches fix agents. The user-experience equivalent of /production-upgrade."
argument-hint: "[target, focus, or persona count]"
---

# ux-genie

## Overview

Use this as the Codex-first UX analysis workflow. It should derive personas, build user stories, map journeys, find friction, and optionally turn those friction points into a prioritized improvement plan or fix set.

Source references:
- `.claude/commands/ux-genie.md`
- `agents/ux-genie.md`
- `agents/user-story-mapper.md`
- `agents/ux-auditor.md`

## Inputs

- target repo or frontend area
- optional `personas`
- optional `focus`
- optional `fix`

## Codex Workflow

1. Read the current UX context and any design artifacts.
2. Derive personas from the actual product surface.
3. Generate stories with testable acceptance criteria.
4. Build journey maps and identify friction.
5. If `fix=on`, convert the biggest friction points into a bounded fix plan and execute carefully.

## Expected Output

- personas
- user stories
- journey map
- friction report
- improvement or fix plan

## Guardrails

- keep stories user-centered, not system-centered
- every friction point should map back to a real screen, flow, or code path
- if visual context is missing, say that instead of inventing journeys
