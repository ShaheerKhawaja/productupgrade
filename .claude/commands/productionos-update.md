---
name: productionos-update
description: "Update ProductionOS plugin to the latest version from GitHub"
---

# ProductionOS Self-Update

You are the update mechanism for the ProductionOS plugin.

## Update Protocol

### Step 1: Detect Current Installation
```bash
# Find where ProductionOS is installed
INSTALL_DIR=""

# Check marketplace installation
for dir in "$HOME/.claude/plugins/marketplaces/productupgrade" \
           "$HOME/.claude/plugins/marketplaces/productionos"; do
  if [ -d "$dir" ]; then
    INSTALL_DIR="$dir"
    break
  fi
done

# Check skill installation
SKILL_DIR=""
for dir in "$HOME/.claude/skills/productionos" \
           "$HOME/.claude/skills/productupgrade"; do
  if [ -d "$dir" ]; then
    SKILL_DIR="$dir"
    break
  fi
done

# Check local repo
REPO_DIR=""
for dir in "$HOME/productupgrade" "$HOME/productionos"; do
  if [ -d "$dir" ]; then
    REPO_DIR="$dir"
    break
  fi
done
```

Read the current version from:
1. `$INSTALL_DIR/.claude-plugin/plugin.json` → `.version` field
2. `$REPO_DIR/VERSION` if exists
3. Report current version to user

### Step 2: Check for Updates
```bash
# Fetch latest from GitHub without merging
cd "$REPO_DIR" 2>/dev/null || cd "$INSTALL_DIR"
git fetch origin 2>/dev/null

# Compare versions
LOCAL_VERSION=$(cat VERSION 2>/dev/null || jq -r .version .claude-plugin/plugin.json)
REMOTE_LOG=$(git log HEAD..origin/$(git rev-parse --abbrev-ref HEAD) --oneline -10 2>/dev/null)
```

If no git repo found, inform user:
```
ProductionOS is not installed from git.
To install the updatable version:
  git clone https://github.com/ShaheerKhawaja/productupgrade.git ~/productupgrade
  claude plugins add ~/productupgrade
```

### Step 3: Show Changelog
Show the user what changed:
```bash
git log HEAD..origin/$(git rev-parse --abbrev-ref HEAD) --oneline --no-merges 2>/dev/null
```

If there are changes, show:
```
ProductionOS Update Available
──────────────────────────────
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
git pull origin $(git rev-parse --abbrev-ref HEAD)
```

### Step 5: Sync Installations
After pulling, sync to all installation locations:
```bash
# Sync to marketplace plugin directory
if [ -n "$INSTALL_DIR" ] && [ -d "$INSTALL_DIR" ]; then
  rsync -av --delete \
    --exclude='.git' \
    --exclude='.productionos' \
    "$REPO_DIR/" "$INSTALL_DIR/"
  echo "Synced to marketplace installation"
fi

# Sync SKILL.md to skills directory
if [ -n "$SKILL_DIR" ] && [ -d "$SKILL_DIR" ]; then
  cp "$REPO_DIR/.claude/skills/productionos/SKILL.md" \
     "$SKILL_DIR/SKILL.md"
  echo "Synced SKILL.md to skills directory"
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
───────────────────────────────────
Previous: vX.Y.Z
Current:  vA.B.C
Files synced: marketplace, skills, commands
```

## Rollback
If update breaks something:
```bash
cd ~/productupgrade
git log --oneline -5  # Find the commit to roll back to
git reset --hard <commit>  # Roll back
# Then re-run sync steps
```
