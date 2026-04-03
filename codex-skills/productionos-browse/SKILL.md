---
name: productionos-browse
description: "Headless browser inspection workflow for checking routes, state, and rendered UI behavior."
argument-hint: "[url, route, or app target]"
---

# productionos-browse


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

Use this as the Codex-first browser inspection workflow. It should inspect the live app surface, verify pages and state, and gather evidence for bugs or UX issues.

## Inputs

- URL or route
- optional target flow

## Codex Workflow

1. open the target page or route
2. inspect critical UI state and interactions
3. gather screenshots or evidence where helpful
4. summarize what works, what is broken, and what was not verified

## Expected Output

- browsed routes
- observed page state
- bug evidence

## Guardrails

- do not pretend interactive coverage you did not actually verify
- if browser tooling is unavailable, say so clearly
