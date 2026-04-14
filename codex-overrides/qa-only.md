---
name: qa-only
description: "Report-only QA testing — produces structured report with health score, screenshots, and repro steps. No fixes applied."
argument-hint: "[url, mode, or repo path]"
---

# qa-only

## Overview

Use this as the Codex-first report-only QA workflow. It should behave like the `qa` workflow without crossing into implementation: find problems, gather evidence, score the app, and stop at the report.

Source references:
- `.claude/commands/qa-only.md`
- `.claude/commands/qa.md`

## Inputs

- optional `url`
- optional `mode`

## Codex Workflow

1. Discover the target app or route set.
2. Run smoke and deeper QA checks appropriate to the mode.
3. Collect screenshots, repro steps, accessibility findings, and performance notes.
4. Produce the report only.
5. Do not modify code.

## Expected Output

- health score
- screenshots
- repro steps
- bug list with severity
- accessibility and performance findings

## Guardrails

- absolutely no code changes
- do not silently slip into the fix loop from `qa`
- if visual/browser tooling is unavailable, report what was not verified
