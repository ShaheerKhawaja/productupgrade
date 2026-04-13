---
name: qa-only
description: "Report-only QA testing — produces structured report with health score, screenshots, and repro steps. No fixes applied."
argument-hint: "[repo path, target, or task context]"
---

# qa-only

Report-only QA testing — produces structured report with health score, screenshots, and repro steps. No fixes applied.

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `url` | string | -- | URL to test |
| `mode` | string | full | Mode: full | smoke (default: full) |

# /qa-only — Report-Only QA Testing

Same methodology as `/qa` but strictly read-only. No fixes. No code changes. Report only.

## Step 0: Preamble
Run `templates/PREAMBLE.md`.

## Execution
Follow the same Steps 1-4 as `/qa` (discover, smoke, deep QA, health score).

**HARD-GATE: Do NOT dispatch any agent with Write or Edit tools. This is a READ-ONLY audit.**

## Output
Write report to `.productionos/QA-ONLY-{timestamp}.md` with:
- Health score (0-100)
- Screenshots of every page
- Bug list with severity, repro steps, and file:line references
- Accessibility findings
- Performance metrics

## Self-Eval
Run `templates/SELF-EVAL-PROTOCOL.md` on report completeness and evidence quality.

## Error Handling

| Scenario | Action |
|----------|--------|
| No target provided | Ask for clarification with examples |
| Target not found | Search for alternatives, suggest closest match |
| Missing dependencies | Report what is needed and how to install |
| Permission denied | Check file permissions, suggest fix |
| State file corrupted | Reset to defaults, report what was lost |

## Guardrails

1. Do not silently change scope or expand beyond the user request.
2. Prefer concrete outputs and verification over abstract descriptions.
3. Keep scope faithful to the user intent.
4. Preserve existing workflow guardrails and stop conditions.
5. Verify results before concluding.
