---
name: browse
description: "Headless browser for QA testing, site inspection, and interaction verification. Navigate, screenshot, click, fill forms, capture snapshots."
arguments:
  - name: url
    description: "URL to navigate to"
    required: true
  - name: action
    description: "Action: navigate | screenshot | interact | snapshot (default: navigate)"
    required: false
    default: "navigate"
---

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
