---
name: auto-swarm
description: "Distributed agent swarm orchestrator — spawns parallel subagent clusters for any task with configurable depth, swarm size, and convergence criteria"
argument-hint: "[task, mode, or depth]"
---

# auto-swarm

## Overview

Use this as the Codex-first swarm workflow. In Codex it should preserve the decomposition and convergence ideas from ProductionOS while defaulting to practical execution: decompose clearly, parallelize only when the user wants it, and keep a visible coverage map.

Source references:
- `.claude/commands/auto-swarm.md`
- `agents/swarm-orchestrator.md`
- `agents/worktree-orchestrator.md`

## Inputs

- required `task`
- optional `mode`
- optional `depth`
- optional `swarm_size`
- optional `iterations`

## Codex Workflow

1. Analyze the task and choose the mode.
2. Decompose the work into independent slices.
3. Build a coverage map before execution starts.
4. Execute serially by default in Codex unless the user explicitly wants sub-agents or parallel work.
5. After each wave, synthesize:
   - what was covered
   - what remains
   - whether another wave is justified
6. Stop when coverage is sufficient or returns diminish.

## Expected Output

- task decomposition
- coverage map
- per-wave synthesis
- final compiled result

## Guardrails

- do not parallelize by reflex
- keep subtask boundaries explicit
- stop when additional waves are not producing meaningful coverage gains
