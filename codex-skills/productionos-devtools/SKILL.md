---
name: productionos-devtools
description: "Mission Control workflow for local session metrics, eval convergence, and operational visibility."
argument-hint: "[action or dashboard task]"
---

# productionos-devtools


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

Use this as the Codex-first operational dashboard workflow. It should inspect the local ProductionOS operational state, show useful metrics, and help the user understand what the system is doing.

## Inputs

- action such as launch, status, focus, or quit

## Codex Workflow

1. inspect the current devtools/dashboard state
2. perform the requested action
3. surface the relevant dashboard output

## Expected Output

- dashboard or status view
- action result

## Guardrails

- if the local app or dashboard is unavailable, say so instead of implying success
