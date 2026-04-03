---
name: productionos-ship
description: "Ship workflow — detect base branch, merge, run tests, review diff, bump VERSION, update CHANGELOG, commit, push, create PR."
argument-hint: "[version bump, repo path, or branch context]"
---

# productionos-ship


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

Use this as the Codex-first shipping workflow. It should prepare the current branch for review and release by synchronizing with base, validating the code, reviewing the diff, updating release metadata, and then pushing and opening a PR.

Source references:
- `.claude/commands/ship.md`
- `.claude/commands/review.md`

## Inputs

- optional `version_bump`: `patch`, `minor`, `major`, or `auto`
- current branch and base branch context

## Codex Workflow

1. Resolve the base branch.
2. Sync with base safely.
   - fetch
   - merge or rebase only if the workflow allows it
   - stop on conflicts
3. Run the validation gate.
   - tests
   - type checks
   - any repo-specific release checks
4. Review the diff.
   - no critical issues
   - no release blockers
5. Update release metadata.
   - `VERSION`
   - `CHANGELOG`
   - other manifest versions when needed
6. Commit, push, and open or update the PR.

## Expected Output

- branch readiness summary
- version decision
- release metadata updates
- push and PR status

## Guardrails

- never push directly to `main`
- never ship with failing tests
- never ignore critical review findings
- if GitHub auth or network is unavailable, report the blocker clearly instead of pretending the PR was created
