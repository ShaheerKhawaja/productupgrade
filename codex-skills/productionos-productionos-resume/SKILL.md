---
name: productionos-productionos-resume
description: "Resume a paused ProductionOS workflow from saved context and artifacts."
argument-hint: "[handoff artifact or repo path]"
---

# productionos-productionos-resume


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

Use this as the Codex-first resume workflow. It should load the saved context from a previous pause or handoff and continue the work from the correct point.

## Inputs

- handoff artifact or repo path

## Codex Workflow

1. locate the latest relevant handoff
2. restore the active context
3. confirm what was done and what remains
4. continue from the right next step

## Expected Output

- resumed state summary
- next action

## Guardrails

- do not guess the resume point if the handoff is ambiguous
