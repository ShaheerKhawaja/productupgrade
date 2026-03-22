---
name: qa-only
description: "Report-only QA testing — produces structured report with health score, screenshots, and repro steps. No fixes applied."
arguments:
  - name: url
    description: "URL to test"
    required: false
  - name: mode
    description: "Mode: full | smoke (default: full)"
    required: false
    default: "full"
---

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
