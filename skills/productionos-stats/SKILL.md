---
name: productionos-stats
description: "Display ProductionOS system statistics — agent count, command count, hook count, test count, version, instinct count, and session history."
argument-hint: "[repo path, target, or task context]"
---

# productionos-stats

Display ProductionOS system statistics — agent count, command count, hook count, test count, version, instinct count, and session history.

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `target` | path or context | cwd | What to operate on |

# /productionos-stats — System Dashboard

Display a comprehensive stats dashboard for the current ProductionOS installation.

## Step 0: Preamble

Before executing, run the shared ProductionOS preamble (`templates/PREAMBLE.md`).

## Step 1: Run Stats Dashboard

Execute the stats dashboard script:

```bash
bun run scripts/stats-dashboard.ts
```

The script computes and outputs all metrics in structured markdown format.

## Metrics Computed

### System Metrics
- **Version** — from `VERSION` file
- **Agent count** — total `.md` files in `agents/` with HIGH/MEDIUM/LOW stakes breakdown
- **Command count** — total `.md` files in `.claude/commands/`
- **Hook count** — unique hook scripts referenced in `hooks/hooks.json`
- **Template count** — total `.md` files in `templates/`
- **Script count** — total `.ts` files in `scripts/`
- **Test file count** — total `.ts` files in `tests/`

### Learning Metrics
- **Project instincts** — patterns learned for the current project
- **Global instincts** — cross-project patterns (confidence > 0.8)
- **Session handoffs** — auto-generated handoff documents
- **Skill usage events** — total events in analytics log

### Git Activity
- **Total commits** — `git rev-list --count HEAD`
- **Commits today** — `git log --oneline --since=midnight`
- **Last handoff** — most recent session handoff document

## Output Format

The dashboard outputs a markdown table for each category, suitable for display in Claude Code's conversation.

## Use Cases

- Run after a sprint to see what was shipped (new agents, commands, hooks)
- Check learning progress (instinct accumulation across sessions)
- Verify installation completeness (all counts match expected values)
- Share stats in session handoff documents for continuity

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
