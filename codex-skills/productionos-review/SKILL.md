---
name: productionos-review
description: "Pre-landing code review — analyzes diff for SQL safety, LLM trust boundaries, conditional side effects, missing tests, dependency risks, and security issues."
argument-hint: "[diff scope, branch, or repo path]"
---

# productionos-review


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

Use this as the Codex-first pre-landing review workflow for ProductionOS. It should behave like a principal engineer reviewing a risky PR: findings first, evidence first, and no hand-wavy approval.

Source references:
- `.claude/commands/review.md`
- `agents/code-reviewer.md`
- `agents/vulnerability-explorer.md`
- `agents/adversarial-reviewer.md`

## Inputs

- `scope`: `diff`, `branch`, or `file`
- repo path or current checkout
- optional base branch override when `origin/main` is not the correct comparison base

## Codex Workflow

1. Resolve the review scope first.
   - Prefer the current diff against the merge base with the default branch.
   - If the user names a file or branch, narrow the review to that.
2. Gather review context.
   - Inspect `git diff --stat`, changed files, and recent commits in scope.
   - Read only the files needed for the review.
3. Review for the ProductionOS core risk buckets.
   - SQL safety and injection risks
   - LLM trust boundaries and unsafe output usage
   - conditional side effects and hidden mutations
   - auth, CSRF, secrets, and boundary validation
   - missing tests, weak edge-case coverage, dependency risk
4. Produce findings before any summary.
   - Order by severity.
   - Include file and line references.
   - Explain the concrete user or system impact.
5. If there are no findings, say that explicitly and call out any residual risk or testing gaps.

## Output Shape

- Primary output: numbered findings
- Each finding should include:
  - severity
  - file and line
  - why it is a problem
  - what should change
- Keep the overview short and secondary

## Verification

- Re-check the exact lines referenced in each finding before sending the review.
- If you are uncertain, lower confidence explicitly rather than overstating.

## Guardrails

- Do not implement fixes unless the user asks for fixes.
- Do not pad the review with style nitpicks when there are real correctness or safety risks.
- Do not summarize before presenting findings.
- Do not claim a clean review unless you actually inspected the changed code.
