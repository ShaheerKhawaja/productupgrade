---
name: productionos-stats
description: "Operational stats workflow for reporting current ProductionOS counts, health, and activity."
argument-hint: "[repo path or stats request]"
---

# productionos-stats

## Overview

Use this as the Codex-first stats workflow. It should surface the current repo and ProductionOS operational metrics in a concise, trustworthy format.

## Inputs

- optional repo path

## Codex Workflow

1. gather current counts and health metrics
2. format them cleanly
3. call out anything obviously stale or inconsistent

## Expected Output

- version
- agents/commands/hooks/tests counts
- key operational metrics

## Guardrails

- counts must come from the current repo state, not stale docs
