# ProductionOS Hooks

15 lifecycle hooks across 4 events. Auto-enforced via `hooks/hooks.json`. All hooks degrade gracefully if dependencies are missing.

## Hook Inventory

### SessionStart (1 hook)

| Hook | What | Dependencies |
|------|------|-------------|
| `session-start.sh` | Init state, display banner, load instincts, context recovery | python3, bun |

### PreToolUse (5 hooks)

| Hook | Matcher | What | Dependencies |
|------|---------|------|-------------|
| `scope-enforcement.sh` | Edit/Write/Bash | Block out-of-scope file edits | python3, jq |
| `repo-boundary-guard.sh` | Edit/Write/Bash | Block cross-repo operations | python3, jq |
| `protected-file-guard.sh` | Edit/Write/Bash | Block writes to .env, keys, certs | python3, jq |
| `pre-edit-security.sh` | Edit/Write/Bash | Advisory on auth/payment file edits | python3, jq |
| `pre-commit-gitleaks.sh` | Bash | Secret detection in git commits | python3, jq, gitleaks (optional) |

### PostToolUse (4 hooks)

| Hook | Matcher | What | Dependencies |
|------|---------|------|-------------|
| `self-learn.sh` | Edit/Write | Cross-session pattern capture | python3, jq |
| `post-edit-telemetry.sh` | Edit/Write | Log file edits to analytics | python3, jq |
| `post-edit-review-hint.sh` | Edit/Write | Suggest review after 10+ edits | python3 |
| `eval-gate.sh` | Edit/Write | Quality gate (tests + tsc + eval) | bun, jq |

### Stop (3 hooks)

| Hook | What | Dependencies |
|------|------|-------------|
| `stop-session-handoff.sh` | Generate session summary + Obsidian log | python3, jq |
| `stop-extract-instincts.sh` | Extract patterns to instincts directory | python3 |
| `stop-eval-gate.sh` | Session-end evaluation score | bun |

### Non-Lifecycle (1 hook)

| Hook | What |
|------|------|
| `pre-push-gate.sh` | Git pre-push validation (tests + tsc) |

## Error Handling

All hooks include:
- `set -euo pipefail` for strict error handling
- Binary availability checks (`_HAS_BUN`, `_HAS_PYTHON`, `_HAS_JQ`)
- `_log_error()` function writing to `~/.productionos/logs/hook-errors.log`
- Graceful degradation when dependencies are missing (skip, don't crash)

## Error Log

Hook failures are logged to:
```
~/.productionos/logs/hook-errors.log
```

Format: `[ISO8601] ERROR hook-name.sh: description`

## Configuration

Hooks are registered in `hooks/hooks.json`. The file is read by Claude Code on session start.

### Disable a Specific Hook

Remove the hook entry from `hooks/hooks.json`. Do not delete the `.sh` file.

### Disable All Hooks

Remove the `hooks` key from `hooks/hooks.json` or rename the file.

### Eval-Gate Frequency

The eval-gate runs tests after every 10 edits (configurable):
- Fast gate (tests + tsc): every 10 edits
- Full eval: every 20 edits

## Adding a New Hook

1. Create `hooks/my-hook.sh` with `#!/usr/bin/env bash` + `set -euo pipefail`
2. Include the binary check preamble (copy from any existing hook)
3. Add entry to `hooks/hooks.json` under the appropriate event
4. Make executable: `chmod +x hooks/my-hook.sh`
5. Test: `echo '{}' | bash hooks/my-hook.sh`
