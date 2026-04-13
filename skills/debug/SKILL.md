---
name: debug
description: "Systematic debugging with hypothesis tracking — reproduce, hypothesize, test, narrow, fix. Never guess-and-check."
argument-hint: "[bug, failing behavior, or repro path]"
---

# debug

Systematic debugging with hypothesis tracking — reproduce, hypothesize, test, narrow, fix. Never guess-and-check.

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `bug` | string | required | Description of the bug or error |
| `max_hypotheses` | string | 5 | Maximum hypotheses to test before escalating (default: 5) |

# /debug — Systematic Debugging

Reproduce. Hypothesize. Test. Narrow. Fix. Never guess-and-check.

## Step 0: Preamble
Run `templates/PREAMBLE.md`.

## Step 1: Reproduce
Make the bug happen consistently:
```bash
# Run the failing test/command
# Capture the exact error output
# Note: environment, branch, recent changes
```
If you cannot reproduce: STOP. You cannot fix what you cannot see.

## Step 2: Gather Evidence
```bash
# Recent changes that might have caused this
git log --oneline -10
# Files most recently modified
git diff --name-only HEAD~5
# Error logs
grep -r "Error\|Exception\|FAIL" logs/ 2>/dev/null | tail -20
```

## Step 3: Generate Hypotheses
Based on evidence, generate up to $ARGUMENTS.max_hypotheses hypotheses:

```markdown
| # | Hypothesis | Evidence For | Evidence Against | Test |
|

## Error Handling

| Scenario | Action |
|----------|--------|
| No target provided | Ask for clarification with examples |
| Target not found | Search for alternatives, suggest closest match |
| Agent dispatch fails | Fall back to manual execution, report the error |
| Ambiguous input | Present options, ask user to pick |
| Execution timeout | Save partial results, report what completed |

## Guardrails

1. Do not silently change scope or expand beyond the user request.
2. Prefer concrete outputs and verification over abstract descriptions.
3. Keep scope faithful to the user intent.
4. Preserve existing workflow guardrails and stop conditions.
5. Verify results before concluding. Run self-eval on output quality.
