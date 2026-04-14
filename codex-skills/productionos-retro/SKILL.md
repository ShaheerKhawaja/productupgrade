---
name: productionos-retro
description: "Retrospective workflow that summarizes what shipped, what broke, and what should improve next."
argument-hint: "[time window, scope, or repo path]"
---

# productionos-retro


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

Use this as the Codex-first retrospective workflow. It should look back across recent work, summarize what happened, surface patterns, and identify concrete process or code improvements.

## Inputs

- optional time window
- optional scope

## Codex Workflow

1. inspect recent commits and artifacts
2. summarize wins, misses, and repeated pain points
3. connect those patterns to concrete improvements

## Expected Output

- retrospective summary
- improvement recommendations
- backlog-worthy follow-ups

## Guardrails

- prioritize real patterns over generic retro boilerplate
- tie observations to evidence in the repo history
