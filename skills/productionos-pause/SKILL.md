---
name: productionos-pause
description: "Save current pipeline state for later resumption. Creates a checkpoint at .productionos/CHECKPOINT.json with all active context."
argument-hint: "[repo path, target, or task context]"
---

# productionos-pause

Save current pipeline state for later resumption. Creates a checkpoint at .productionos/CHECKPOINT.json with all active context.

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `target` | path or context | cwd | What to operate on |

# ProductionOS Pause — Save Pipeline State

Save the current pipeline state so work can be resumed in a new session.

## What Gets Saved

Write `.productionos/CHECKPOINT.json`:

```json
{
  "command": "<active command name>",
  "step": "<current step number and name>",
  "iteration": "<current iteration if recursive>",
  "timestamp": "<ISO 8601>",
  "grade": {
    "before": "<BEFORE grade if available>",
    "current": "<latest grade>"
  },
  "artifacts": ["<list of .productionos/*.md files that exist>"],
  "uncommitted_files": ["<output of git diff --name-only>"],
  "pending_batches": "<number of unexecuted batches if mid-execution>",
  "context_notes": "<brief description of what was happening>"
}
```

## Execution

1. Detect the active pipeline state:
   - Read `.productionos/CONVERGENCE-LOG.md` for iteration history
   - Read `.productionos/CONVERGENCE-DATA.json` for current scores
   - Check `git status` for uncommitted work
   - Count remaining batches from `OMNI-PLAN.md` or `UPGRADE-PLAN.md`

2. Write the checkpoint file

3. Display confirmation:
```
[ProductionOS] Pipeline paused.
  Command: {command}
  Step: {step}
  Grade: {current_grade}
  Uncommitted: {N} files

  Resume with: /productionos-resume
```

4. Do NOT commit or push — preserve the working state exactly as-is

## Notes

- This is a lightweight state save, not a full context serialization
- The checkpoint is sufficient for a new session to pick up where this one left off
- Resume reads the checkpoint and routes to the appropriate command step

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
