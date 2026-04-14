---
name: productionos-resume
description: "Resume a paused pipeline from .productionos/CHECKPOINT.json. Restores context and routes to the correct step."
argument-hint: "[repo path, target, or task context]"
---

# productionos-resume

Resume a paused pipeline from .productionos/CHECKPOINT.json. Restores context and routes to the correct step.

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `target` | path or context | cwd | What to operate on |

# ProductionOS Resume — Restore Pipeline State

Resume work from a previously paused pipeline.

## Execution

1. **Read checkpoint:**
   ```
   Read .productionos/CHECKPOINT.json
   If not found: "No checkpoint found. Start a new pipeline with /production-upgrade or /omni-plan."
   ```

2. **Validate state:**
   - Check that all listed artifacts still exist
   - Compare `git diff --name-only` with saved `uncommitted_files`
   - If divergence detected: warn but don't halt
     `"WARNING: Working tree has changed since pause. {N} new files, {M} missing files."`

3. **Display status:**
   ```
   [ProductionOS] Resuming pipeline.
     Command: {command}
     Paused at: {step} ({timestamp})
     Grade: {before} → {current}
     Artifacts: {N} files in .productionos/
     Uncommitted: {N} files
   ```

4. **Route to command:**
   - Parse the `command` and `step` fields
   - Invoke the appropriate command with a `--resume-from` context:
     - `/omni-plan` → resume from the saved step number
     - `/production-upgrade` → resume from the saved step
     - `/auto-swarm` → resume with remaining coverage gaps
   - Pass all existing `.productionos/` artifacts as prior work (the Preamble's artifact reuse check handles this)

5. **Clean up:**
   - After successful resumption (pipeline reaches completion or next pause): delete CHECKPOINT.json
   - If the resumed pipeline fails: keep CHECKPOINT.json for retry

## Notes

- Resume is NOT a full context restoration — it provides enough state for the pipeline to skip completed steps
- The Preamble's "Prior work check" (Step 0B) already handles artifact reuse, so most of the context recovery is automatic

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
