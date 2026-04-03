---
name: productionos-qa
description: "Systematic QA testing with health scoring — tests web app, finds bugs, fixes them iteratively. Regression mode for re-testing known issues."
argument-hint: "[url, mode, or repo path]"
---

# productionos-qa


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

Use this as the Codex-first QA workflow for web applications and user flows. It should discover the app surface, test the critical paths, identify failures, optionally fix them, and then re-test to confirm the health score improved.

Source references:
- `.claude/commands/qa.md`
- `agents/browser-controller.md`
- `agents/ux-auditor.md`
- `agents/self-evaluator.md`

## Inputs

- `url`: target app URL or local dev server
- `mode`: `full`, `regression`, or `smoke`
- `fix`: `on` or `off`

## Codex Workflow

1. Discover the app entrypoint.
   - detect local dev server or use the provided URL
2. Run smoke coverage first.
   - home
   - auth
   - dashboard or main flow
   - settings
   - key forms
3. Expand to deeper QA if requested.
   - route coverage
   - interaction edge cases
   - accessibility and responsive checks
4. If `fix=on`, make only minimal, verified fixes.
5. Re-test and report a health score with bug counts.

## Expected Output

- pages tested
- bugs found and fixed
- health score
- remaining regressions or risks

## Guardrails

- do not invent app state that you did not actually verify
- if browser automation is unavailable, say so and fall back to report-only static analysis
- re-test every claimed fix
