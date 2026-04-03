---
name: productionos-auto-swarm-nth
description: "Nth-iteration agent swarm — spawns parallel agent waves, evaluates strictly per wave, re-swarms gaps until 100% coverage and 10/10 quality. Can invoke any ProductionOS skill or command within waves."
argument-hint: "[task, mode, or repo path]"
---

# productionos-auto-swarm-nth


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

Use this as the Codex-first recursive swarm workflow. It should decompose the task into coverage items, run wave-based execution, prefer worktree isolation for parallel code changes, and keep iterating until the real gaps are closed or the returns clearly flatten out.

Source references:
- `.claude/commands/auto-swarm-nth.md`
- `agents/worktree-orchestrator.md`
- `agents/self-evaluator.md`
- `agents/self-healer.md`

## Inputs

- required `task`
- optional `mode`
- optional `max_waves`
- optional `swarm_size`
- optional `max_cost`
- optional `isolation`

## Codex Workflow

1. Decompose the task into a coverage map before dispatching anything.
2. Choose the swarm mode from the task:
   - `research`
   - `build`
   - `audit`
   - `fix`
   - `explore`
3. If parallel execution is needed, prefer worktree isolation.
   - non-overlapping scopes
   - explicit ownership
   - merge gates between branches
4. Run one wave at a time.
   - assign scopes
   - execute agents or sub-agents
   - synthesize findings
   - update coverage
5. Re-swarm only when meaningful gaps remain.
6. Stop on:
   - full coverage with acceptable quality
   - cost ceiling
   - repeated stalls
   - regression in quality

## Expected Output

- wave-by-wave coverage tracking
- gap list
- quality summary per wave
- final swarm report

## Guardrails

- never parallelize overlapping write scopes without isolation
- if `isolation=worktree`, treat merge safety as part of the workflow, not a postscript
- halt on regressions instead of pushing through to a cosmetically complete report
- prefer fewer high-signal waves over noisy recursive churn
