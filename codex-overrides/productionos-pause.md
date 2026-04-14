---
name: productionos-pause
description: "Pause the current workflow and persist enough state to resume cleanly later."
argument-hint: "[current workflow or repo path]"
---

# productionos-pause

## Overview

Use this as the Codex-first pause workflow. It should save the current working state, key decisions, and next actions so a later session can resume without re-deriving everything.

## Inputs

- current workflow context

## Codex Workflow

1. capture current branch and state
2. summarize work done
3. list next steps and blockers
4. persist the handoff artifact

## Expected Output

- pause summary
- resumable handoff

## Guardrails

- the pause artifact should be enough to restart accurately later
