---
name: plan-eng-review
description: "Engineering architecture review — lock in execution plan with data flow diagrams, error paths, test matrix, performance budget, and dependency analysis."
argument-hint: "[plan, architecture, or repo path]"
---

# plan-eng-review

## Overview

Use this as the Codex-first engineering plan review. Its job is to make an execution plan safe to build: architecture, trust boundaries, failure modes, test coverage, dependency risks, and rollout posture.

Source references:
- `.claude/commands/plan-eng-review.md`
- `agents/architecture-designer.md`
- `agents/database-auditor.md`
- `agents/vulnerability-explorer.md`

## Inputs

- target plan, design doc, or feature description
- optional current branch or diff context
- optional architecture notes or prior review artifacts

## Codex Workflow

1. Restate the execution target.
   - What is being built?
   - What are the important boundaries and dependencies?
2. Review the architecture.
   - Draw or describe the component graph.
   - Check data flow, state changes, error paths, and migration risk.
3. Review for engineering completeness.
   - test matrix
   - performance budget
   - dependency and licensing risk
   - deployment and rollback posture
4. Surface issues as concrete recommendations.
   - prefer minimal-diff, explicit designs
   - call out over-engineering and under-engineering
5. End with what must change before implementation and what is safe to proceed with.

## Expected Output

- Architecture notes with concrete risks
- Error-path and test-coverage gaps
- Performance or migration concerns
- A short implementation-readiness verdict

## Verification

- Ground every recommendation in the actual plan or repo context.
- If a risk depends on an assumption, state the assumption plainly.

## Guardrails

- Do not silently expand product scope.
- Do not optimize for novelty over maintainability.
- Prefer boring, reversible engineering choices unless the repo clearly needs otherwise.
