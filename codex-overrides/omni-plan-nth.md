---
name: omni-plan-nth
description: "Nth-iteration omni-plan — recursive orchestration that chains ALL ProductionOS skills and agents, evaluates strictly per iteration, and loops until 10/10 is achieved. Each iteration can invoke any command or skill in the system."
argument-hint: "[target, focus, or repo path]"
---

# omni-plan-nth

## Overview

Use this as the Codex-first recursive top-level orchestrator. It should chain discovery, review, execution, and reevaluation into repeated iterations until the important quality dimensions are truly addressed or the system clearly plateaus.

Source references:
- `.claude/commands/omni-plan-nth.md`
- `.claude/commands/omni-plan.md`
- `agents/self-evaluator.md`
- `agents/self-healer.md`

## Inputs

- target repo, path, or problem
- optional `focus`
- optional `max_iterations`
- optional `max_cost`

## Codex Workflow

1. Discover prior state first.
   - read `.productionos/` artifacts
   - identify what work already exists
   - build a skill map
2. Establish a baseline.
   - identify weak dimensions
   - set success criteria
3. For each iteration:
   - assess the current state
   - choose the best workflow mix for the weakest dimensions
   - execute the selected workflows
   - re-evaluate
   - decide: continue, pivot, or deliver
4. Use `auto-swarm-nth` when the iteration needs parallel coverage work.
5. Stop when:
   - target quality is reached
   - cost ceiling is hit
   - progress has stalled across multiple iterations

## Expected Output

- baseline score
- per-iteration reports
- convergence log
- final orchestration summary

## Guardrails

- do not redo work that is already represented in usable `.productionos/` artifacts
- do not spread each iteration across every possible dimension; focus force on the weakest areas
- regressions matter more than superficial iteration count progress
- if the loop stalls, pivot the strategy instead of repeating the same passes
