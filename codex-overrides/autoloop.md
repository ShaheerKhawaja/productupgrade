---
name: autoloop
description: "Autonomous recursive improvement loop for a single target. Runs gap analysis, refinement, evaluation, and convergence checks."
argument-hint: "[target, goal, or quality objective]"
---

# autoloop

## Overview

Use this as the Codex-first single-target recursive improvement loop. It should repeatedly score, refine, and re-evaluate one artifact until quality converges or the loop stops being productive.

## Inputs

- target artifact or file
- optional goal

## Codex Workflow

1. assess the target
2. identify gaps
3. refine one iteration at a time
4. score after each iteration
5. stop on convergence, regression, or budget limits

## Expected Output

- iteration log
- best-scoring result
- convergence reason

## Guardrails

- do not keep looping without real improvement
- regressions should stop the loop, not be normalized
