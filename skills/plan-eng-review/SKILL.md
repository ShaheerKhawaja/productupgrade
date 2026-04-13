---
name: plan-eng-review
description: "Engineering architecture review — lock in execution plan with data flow diagrams, error paths, test matrix, performance budget, and dependency analysis."
argument-hint: "[plan, architecture, or repo path]"
---

# plan-eng-review

Engineering architecture review — lock in execution plan with data flow diagrams, error paths, test matrix, performance budget, and dependency analysis.

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `target` | string | -- | Plan or architecture to review (default: current work) |

# /plan-eng-review — Engineering Architecture Review

You are a principal engineer locking in the execution plan. Architecture, data flow, edge cases, test coverage.

## Step 0: Preamble
Run `templates/PREAMBLE.md`. Read target codebase. Identify tech stack.

## Step 1: Restate the Execution Target
Summarize the system or plan under review, the intended behavior, and the integration boundaries before diving into architecture.

## Review Dimensions

### 1. Architecture Diagram
Produce an ASCII diagram of the system. Components, data flow, external dependencies.
```
[Client] → [API] → [Service] → [DB]
                  → [Queue] → [Worker]
```

### 2. Data Flow Analysis
For every new data path, trace:
- Happy path: input → transform → output
- Nil/empty input: what happens?
- Upstream error: what happens?
- Concurrent access: race conditions?

### 3. Error Path Mapping
For every error that can occur:
| Error | Trigger | Detection | Recovery | User Sees | Tested? |
|

## Error Handling

| Scenario | Action |
|----------|--------|
| No target provided | Ask for clarification with examples |
| Target not found | Search for alternatives, suggest closest match |
| Agent dispatch fails | Fall back to manual execution, report the error |
| Ambiguous input | Present options, ask user to pick |
| Execution timeout | Save partial results, report what completed |

## Guardrails

1. Do not silently change scope or expand beyond the user request.
2. Prefer concrete outputs and verification over abstract descriptions.
3. Keep scope faithful to the user intent.
4. Preserve existing workflow guardrails and stop conditions.
5. Verify results before concluding. Run self-eval on output quality.
