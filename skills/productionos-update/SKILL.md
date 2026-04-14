---
name: productionos-update
description: "Update ProductionOS plugin to the latest version from GitHub"
argument-hint: "[repo path or install context]"
---

# productionos-update

Update ProductionOS plugin to the latest version from GitHub

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `target` | path or context | cwd | What to operate on |

# ProductionOS Self-Update

You are the update mechanism for the ProductionOS plugin.

## Step 0: Preamble

Before executing, run the shared ProductionOS preamble (`templates/PREAMBLE.md`):
1. **Environment check** — version, agent count, stack detection
2. **Prior work check** — read `.productionos/` for existing output
3. **Success criteria** — successful update to latest version

## Update Protocol

### Step 1: Detect Current Installation
```bash
# Find where ProductionOS is installed
INSTALL_DIR=""
CODEX_PLUGIN_DIR=""

# Check marketplace installation
if [ -d "$HOME/.claude/plugins/marketplaces/productionos" ]; then
  INSTALL_DIR="$HOME/.claude/plugins/marketplaces/productionos"
fi

# Check Codex plugin installation
if [ -d "$HOME/.codex/plugins/productionos" ]; then
  CODEX_PLUGIN_DIR="$HOME/.codex/plugins/productionos"
fi

# Check local repo
if [ -d "$HOME/ProductionOS" ]; then
  REPO_DIR="$HOME/ProductionOS"
fi
```

Read the current version from:
1. `$INSTALL_DIR/.claude-plugin/plugin.json` → `.version` field
2. `$REPO_DIR/VERSION` if exists
3. Report current version to user

### Step 2: Check for Updates
```bash
# Fetch latest from GitHub without merging
cd "$REPO_DIR" 2>/dev/null || cd "$INSTALL_DIR"
git fetch origin main 2>/dev/null

# Compare versions
LOCAL_VERSION=$(cat VERSION 2>/dev/null || jq -r .version .claude-plugin/plugin.json)
REMOTE_LOG=$(git log origin/main --oneline -10 2>/dev/null)
```

If no git repo found, inform user:
```
ProductionOS is not installed from git.
To install the updatable version:
  git clone https://github.com/ShaheerKhawaja/ProductionOS.git ~/ProductionOS
  claude plugin install productionos
```

### Step 3: Show Changelog
Show the user what changed:
```bash
git log HEAD..origin/main --oneline --no-merges 2>/dev/null
```

If there are changes, show:
```
ProductionOS Update Available
───────────────────────────────
Current: vX.Y.Z
Latest:  vA.B.C

Changes:
  - commit message 1
  - commit message 2
  ...

Update now? (This will pull latest changes)
```

### Step 4: Apply Update
If user confirms (or running in auto mode):
```bash
cd "$REPO_DIR"
git pull origin main
```

### Step 5: Sync Installations
After pulling, sync to all installation locations:
```bash
# Sync to marketplace plugin directory
if [ -d "$HOME/.claude/plugins/marketplaces/productionos" ]; then
  rsync -av --update \
    --exclude='.git' \
    "$REPO_DIR/" "$HOME/.claude/plugins/marketplaces/productionos/"
  echo "Synced to marketplace installation"
fi

# Sync Codex plugin installation
if [ -d "$HOME/.codex/plugins/productionos" ]; then
  rsync -av --update \
    --exclude='.git' \
    "$REPO_DIR/" "$HOME/.codex/plugins/productionos/"
  echo "Synced Codex plugin installation"
fi

# Sync command files
if [ -d "$HOME/.claude/commands" ]; then
  for cmd in "$REPO_DIR/.claude/commands/"*.md; do
    cp "$cmd" "$HOME/.claude/commands/$(basename $cmd)"
  done
  echo "Synced commands"
fi
```

### Step 6: Verify
```bash
NEW_VERSION=$(cat "$REPO_DIR/VERSION" 2>/dev/null || jq -r .version "$REPO_DIR/.claude-plugin/plugin.json")
echo "Updated to v${NEW_VERSION}"
```

Report:
```
ProductionOS Updated Successfully
────────────────────────────────────
Previous: vX.Y.Z
Current:  vA.B.C
Files synced: marketplace, Codex plugin, commands
```

## Rollback
If update breaks something:
```bash
cd ~/ProductionOS
git log --oneline -5  # Find the commit to roll back to
git reset --hard <commit>  # Roll back
# Then re-run sync steps
```

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
