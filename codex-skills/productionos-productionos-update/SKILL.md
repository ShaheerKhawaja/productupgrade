---
name: productionos-productionos-update
description: "Update ProductionOS plugin to the latest version from GitHub"
argument-hint: "[repo path or install context]"
---

# productionos-productionos-update


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

Use this as the Codex-first self-update workflow for local ProductionOS installs. It should discover where ProductionOS is installed, compare local versus remote state, update safely, and sync the installed surfaces for Claude and Codex.

Source references:
- `.claude/commands/productionos-update.md`
- `bin/install.cjs`

## Inputs

- local repo or installation path
- optional target runtime: Claude, Codex, or both

## Codex Workflow

1. Detect the current installation layout.
   - local repo
   - Claude install
   - Codex install
2. Inspect the current version and compare against the remote source.
3. Show the changelog delta before updating.
4. Update the repo and then re-sync installed surfaces.
5. Verify the final version and installed artifacts.

## Expected Output

- current version
- available update summary
- synced install targets
- final installed version

## Guardrails

- do not reset or overwrite local work without approval
- report network or auth blockers clearly
- verify installed surfaces after update instead of assuming sync succeeded
