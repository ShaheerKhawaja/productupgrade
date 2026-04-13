---
name: browse
description: "Headless browser for QA testing, site inspection, and interaction verification. Navigate, screenshot, click, fill forms, capture snapshots."
argument-hint: "[repo path, target, or task context]"
---

# browse

Headless browser for QA testing, site inspection, and interaction verification. Navigate, screenshot, click, fill forms, capture snapshots.

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `url` | string | required | URL to navigate to |
| `action` | string | navigate | Action: navigate | screenshot | interact | snapshot (default: navigate) |

# /browse — Headless Browser Interaction

Control a headless browser for testing, QA, and site inspection.

## Step 0: Preamble
Run `templates/PREAMBLE.md`.

## Execution
Dispatch `browser-controller` agent:
```
Read agents/browser-controller.md
Dispatch with:
  URL: $ARGUMENTS.url
  Action: $ARGUMENTS.action
  Output: .productionos/browse/
```

## Actions

### navigate — Load page, report status
Navigate to URL, report HTTP status, page title, key elements found.

### screenshot — Full-page capture
Navigate + capture full-page screenshot. Save to `.productionos/browse/screenshot-{timestamp}.png`.

### interact — Interactive session
Navigate + describe all interactive elements (buttons, forms, links). Execute user-directed interactions.

### snapshot — Accessibility tree
Navigate + capture full accessibility snapshot. Report missing labels, roles, ARIA attributes.

## Self-Eval
After browsing, run `templates/SELF-EVAL-PROTOCOL.md` on findings quality.

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
