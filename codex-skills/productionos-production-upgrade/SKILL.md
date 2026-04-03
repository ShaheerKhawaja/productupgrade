---
name: productionos-production-upgrade
description: "Run the full product upgrade pipeline — 55-agent iterative review with CEO/Engineering/UX/QA parallel loops"
argument-hint: "[mode, target repo, or directory]"
---

# productionos-production-upgrade


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

Use this as the Codex-first end-to-end upgrade workflow for a repository. It should behave like a bounded audit-and-improve loop: discover the current state, score the codebase, prioritize high-leverage fixes, implement safe improvements, validate, and summarize before/after results.

Source references:
- `.claude/commands/production-upgrade.md`
- `agents/self-evaluator.md`
- `agents/self-healer.md`
- `agents/plan-checker.md`

## Inputs

- `mode`: `full`, `audit`, `ux`, `fix`, or `validate`
- optional target path or repository
- optional `profile`, `converge`, and `target_grade`

## Codex Workflow

1. Discover the codebase.
   - stack, architecture, tests, docs, churn hotspots, TODO markers
   - read any existing `.productionos/` artifacts first
2. Build the baseline.
   - score major quality dimensions
   - identify the 2-3 weakest dimensions
3. Plan the next fix slice.
   - prioritize high-leverage, bounded work
   - avoid giant rewrite batches
4. Implement safely.
   - make focused changes
   - validate after each batch
   - stop on regressions
5. Re-score and summarize.
   - before/after posture
   - fixed items
   - deferred items

## Expected Output

- baseline findings
- prioritized fix plan
- implemented improvements when mode allows it
- validation results
- before/after summary

## Verification

- run the smallest relevant tests or checks after each implementation batch
- if validation fails, repair or stop; do not claim success

## Guardrails

- do not take destructive actions without approval
- do not hide regressions behind aggregate score improvement
- do not treat existing `.productionos/` artifacts as disposable; build on them when useful
