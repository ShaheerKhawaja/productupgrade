---
name: plan-eng-review
description: "Engineering architecture review — lock in execution plan with data flow diagrams, error paths, test matrix, performance budget, and dependency analysis."
arguments:
  - name: target
    description: "Plan or architecture to review (default: current work)"
    required: false
---

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
|-------|---------|-----------|----------|-----------|---------|

### 4. Test Matrix
| Component | Unit | Integration | E2E | Edge Cases | Coverage |
|-----------|------|-------------|-----|------------|----------|

### 5. Performance Budget
- Response time targets (p50, p95, p99)
- Memory budget per request
- Database query budget (max N queries per endpoint)
- Bundle size budget (if frontend)

### 6. Dependency Analysis
- New dependencies: justified? Maintained? License compatible?
- Existing dependency upgrades needed?
- Breaking changes in transitive deps?

### 7. Migration Plan
If modifying existing systems:
- Can this be deployed with zero downtime?
- Rollback strategy?
- Feature flag needed?
- Data migration steps?

## Agent References
- Dispatch `architecture-designer` for structural analysis
- Dispatch `database-auditor` for schema review
- Dispatch `vulnerability-explorer` for security paths

## Self-Eval
Run `templates/SELF-EVAL-PROTOCOL.md`. Score: Was every error path traced? Every data flow mapped? Every dependency justified?
