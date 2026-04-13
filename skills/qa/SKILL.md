---
name: qa
description: "Systematic QA testing with health scoring — tests web app, finds bugs, fixes them iteratively. Regression mode for re-testing known issues."
argument-hint: "[url, mode, or repo path]"
---

# qa

Systematic QA testing with health scoring — tests web app, finds bugs, fixes them iteratively. Regression mode for re-testing known issues.

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `url` | string | -- | URL to test (default: localhost dev server) |
| `mode` | string | full | Mode: full | regression | smoke (default: full) |
| `fix` | string | on | Auto-fix found issues: on | off (default: on) |

# /qa — Systematic QA Testing

Test the web app systematically. Find bugs. Fix them. Re-test. Score health 0-100.

## Step 0: Preamble
Run `templates/PREAMBLE.md`. Detect dev server URL.

## Step 1: Discover
```bash
# Detect dev server
curl -s http://localhost:3000 > /dev/null 2>&1 && echo "Dev server: http://localhost:3000"
curl -s http://localhost:8000 > /dev/null 2>&1 && echo "Dev server: http://localhost:8000"
```

## Step 2: Smoke Test
Dispatch `browser-controller` to navigate key pages:
- Home/landing
- Auth (login/signup)
- Dashboard/main
- Settings
- Any page with forms

Report: loads? errors? missing elements?

## Step 3: Deep QA (if mode = full)
Dispatch parallel agents:
- `browser-controller`: Navigate every route, screenshot each
- `ux-auditor`: Full WCAG + interaction audit on each page
- `self-evaluator`: Score each page's quality

## Step 4: Health Score
Calculate 0-100 score:
- Pages load without error: 20 pts
- No console errors: 15 pts
- Forms work: 15 pts
- Accessibility passes: 15 pts
- Responsive: 15 pts
- Performance (< 3s load): 10 pts
- No broken links: 10 pts

## Step 5: Fix Loop (if fix = on)
For each bug found:
1. Read the source file causing the issue
2. Fix with minimal change
3. Re-test to verify fix
4. Self-eval the fix quality

## Step 6: Report
Write to `.productionos/QA-REPORT-{timestamp}.md`:
```markdown
# QA Report
**Health Score:** X/100
**Pages Tested:** N
**Bugs Found:** N
**Bugs Fixed:** N
**Regressions:** N (if regression mode)
```

## Self-Eval
Run `templates/SELF-EVAL-PROTOCOL.md` on QA thoroughness.

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
