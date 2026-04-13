---
name: devtools
description: "ProductionOS Mission Control — launch Claude DevTools, show session dashboard with eval convergence, agent dispatches, cost tracking, and hot file intelligence."
argument-hint: "[repo path, target, or task context]"
---

# devtools

ProductionOS Mission Control — launch Claude DevTools, show session dashboard with eval convergence, agent dispatches, cost tracking, and hot file intelligence.

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `action` | string | launch | Action: 'launch' (default), 'status', 'focus', 'quit' |

# ProductionOS DevTools — Mission Control

## Step 0: Preamble

Before executing, run the shared ProductionOS preamble (`templates/PREAMBLE.md`) to confirm the active install root and session context.

Execute the requested action for Claude DevTools within the ProductionOS ecosystem.

## Action: $ARGUMENTS.action

### Step 1: Check DevTools installation and status

```bash
DEVTOOLS_APP="/Applications/claude-devtools.app"
if [ ! -d "$DEVTOOLS_APP" ]; then
  echo "DEVTOOLS_NOT_INSTALLED"
  echo "Install with: brew install --cask claude-devtools"
else
  DEVTOOLS_PID=$(pgrep -f "claude-devtools" 2>/dev/null | head -1)
  if [ -n "$DEVTOOLS_PID" ]; then
    echo "DEVTOOLS_RUNNING (PID: $DEVTOOLS_PID)"
  else
    echo "DEVTOOLS_STOPPED"
  fi
fi
```

If not installed, tell the user to run `brew install --cask claude-devtools` and stop.

### Step 2: Execute action

**launch** (default):
1. If DevTools is NOT running, launch it:
   ```bash
   open /Applications/claude-devtools.app
   ```
2. If already running, bring to foreground:
   ```bash
   osascript -e 'tell application "claude-devtools" to activate'
   ```
3. Then show the full dashboard (Step 3)

**status**:
1. Run the dashboard script for the full report:
   ```bash
   python3 "${CLAUDE_PLUGIN_ROOT:-$HOME/.claude/plugins/marketplaces/productionos}/hooks/devtools-dashboard.py" --full
   ```
2. Display the output to the user as-is (it's already formatted)

**focus**:
1. Bring DevTools window to foreground:
   ```bash
   osascript -e 'tell application "claude-devtools" to activate'
   ```

**quit**:
1. Gracefully quit DevTools:
   ```bash
   osascript -e 'tell application "claude-devtools" to quit'
   ```

### Step 3: Full Dashboard (runs on launch and status)

Run the dashboard script:
```bash
python3 "${CLAUDE_PLUGIN_ROOT:-$HOME/.claude/plugins/marketplaces/productionos}/hooks/devtools-dashboard.py" --full
```

This shows:
- Session metrics (edits, agents, security events)
- Cost tracking (session delta, all-time total)
- Eval convergence (latest score, sparkline trend, data points)
- Agent dispatch breakdown by type
- Hot files (cross-session churn with bar charts)
- Event breakdown

### Step 4: Report to user

After executing the action, provide a concise summary:
- For **launch**: Show the full dashboard output, then "DevTools launched"
- For **status**: Show the full dashboard output only
- For **focus**: "DevTools brought to foreground"
- For **quit**: "DevTools closed"

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
