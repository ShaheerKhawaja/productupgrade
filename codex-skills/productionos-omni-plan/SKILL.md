---
name: productionos-omni-plan
description: "ProductionOS flagship — 13-step orchestrative pipeline with tri-tiered evaluation, recursive convergence, CEO/Eng/Design review chain, CLEAR framework evaluation, multi-model judge tribunal, and autonomous PIVOT/REFINE/PROCEED decisions. Targets 100% production-ready output."
argument-hint: "[target, focus, or depth]"
---

# productionos-omni-plan


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

Use this as the Codex-first flagship orchestration workflow. It should chain research, review, evaluation, planning, execution, and convergence into one coherent path without pretending Codex has Claude-only slash-command behavior.

Source references:
- `.claude/commands/omni-plan.md`
- `agents/research-pipeline.md`
- `agents/dynamic-planner.md`
- `agents/llm-judge.md`

## Inputs

- target repo, branch, or feature
- optional `focus`
- optional `depth`
- optional `profile`

## Codex Workflow

1. Build the intelligence layer.
   - repo context
   - prior artifacts
   - research where needed
2. Run the strategic review layer.
   - CEO review
   - engineering review
   - design review if applicable
3. Run the evaluation gate.
   - CLEAR-style evaluation
   - judge alignment or disagreement summary
4. Produce the execution plan.
   - prioritized batches
   - explicit stop conditions
5. Execute only when the user wants execution, otherwise stop at the implementation-ready plan.
6. Re-evaluate and decide:
   - proceed
   - refine
   - pivot

## Expected Output

- orchestration summary
- stacked review findings
- prioritized implementation plan
- convergence/readiness verdict

## Guardrails

- do not silently skip critical gates
- do not spread effort across every dimension at once when focus narrowing is needed
- distinguish clearly between planning output and execution output
