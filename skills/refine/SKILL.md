---
name: refine
description: "Review and refine flagged outputs, using critique and focused iteration to improve weak results."
argument-hint: "[mode, target, or repo path]"
---

# refine

## Overview

Use this as the Codex-first refinement workflow. It should inspect flagged outputs, critique them, improve them in focused passes, and stop when further refinement is not justified.

## Inputs

- optional mode
- target artifact or signal set

## Codex Workflow

Source references:
- `.claude/commands/refine.md`

1. load the flagged outputs or pending signals
2. critique the weaknesses directly
3. refine in focused passes
4. stop on convergence or regression

## Expected Output

- critique
- improved version or improvement plan
- convergence reason

## Guardrails

- do not refine blindly without a concrete critique
- stop if changes stop improving the result
