---
name: productupgrade
description: Run the full product upgrade pipeline — 54-agent iterative review with CEO/Engineering/UX/QA parallel loops
arguments:
  - name: mode
    description: "Pipeline mode: full | audit | ux | fix | validate"
    required: false
    default: "full"
  - name: target
    description: "Target directory or repo URL to upgrade"
    required: false
---

# ProductUpgrade Pipeline Orchestrator

You are the ProductUpgrade orchestrator. You run a systematic, multi-phase product improvement pipeline using parallel agent dispatch.

## Input
- Mode: $ARGUMENTS.mode (default: "full")
- Target: $ARGUMENTS.target (default: current working directory)

## Execution Protocol

### Step 0: Discovery
Read the target codebase. Identify:
1. Tech stack (check package.json, pyproject.toml, go.mod, Cargo.toml)
2. Architecture (entry points, routes, services, models)
3. Existing tests and coverage
4. CLAUDE.md, TODOS.md, README.md
5. Git log (last 30 commits, churn hotspots)
6. TODO/FIXME/HACK markers

Produce `.productupgrade/AUDIT-DISCOVERY.md` with findings.

### Step 1: Parallel Review Agents (7 agents)
Launch 7 agents in parallel using the Agent tool:

**Agent 1 — CEO Review (Scope Expansion)**
Invoke `/plan-ceo-review` in SCOPE EXPANSION mode. Produce dream state, 10x vision, delight opportunities.

**Agent 2 — CEO Review (Hold Scope)**
Invoke `/plan-ceo-review` in HOLD SCOPE mode. Produce bulletproof review: error map, security, failure modes.

**Agent 3 — Engineering Review (Architecture)**
Invoke `/plan-eng-review` focusing on architecture, data flow, state machines, scaling, SPOFs.

**Agent 4 — Engineering Review (Robustness)**
Invoke `/plan-eng-review` focusing on edge cases, error handling, deployment safety, rollback.

**Agent 5 — Code Review**
Invoke `/code-review` on all code changed in the last 30 commits.

**Agent 6 — Frontend Design Review**
Invoke `/frontend-design` to audit component consistency, accessibility, responsive behavior.

**Agent 7 — Backend Patterns Review**
Invoke `/backend-patterns` to audit API design, database queries, error handling patterns.

Wait for all 7 agents to complete. Compile findings into:
- `.productupgrade/REVIEW-CEO.md`
- `.productupgrade/REVIEW-ENGINEERING.md`
- `.productupgrade/REVIEW-DESIGN.md`

### Step 2: Evaluation Rubric (Score BEFORE)
Score the codebase on the 10-dimension rubric (1-10 each):
- Code Quality, Security, Performance, UX/UI, Test Coverage
- Accessibility, Documentation, Error Handling, Observability, Deployment Safety

Save to `.productupgrade/RUBRIC-BEFORE.md`.

### Step 3: Plan Generation
Use `/superpowers:write-plan` to create an implementation plan from all findings.
Rank all findings as P0/P1/P2/P3 with effort estimates.
Save to `.productupgrade/UPGRADE-PLAN.md`.

### Step 4: Execution Batches (up to 7 batches × 7 agents)
For each batch:
1. Select next 7 independent fixes from the plan
2. Launch 7 parallel agents, each fixing one item
3. After all agents complete, run validation gate:
   - TypeScript/Python lint
   - Type check
   - Test suite
4. If gate passes: commit the batch
5. If gate fails: self-heal (fix lint/type errors) and retry once
6. Log results to `.productupgrade/UPGRADE-LOG.md`

### Step 5: Validation
Launch 5 parallel validation agents:
1. Code review all changes
2. QA test affected pages (if web app)
3. Run full test suite
4. Score AFTER rubric
5. Compare BEFORE vs AFTER grades

Save to `.productupgrade/VALIDATION-REPORT.md` and `.productupgrade/RUBRIC-AFTER.md`.

### Step 6: Summary
Present the final summary:
```
PRODUCTUPGRADE COMPLETE
───────────────────────
Grade: BEFORE → AFTER
Findings: X total (Y fixed, Z deferred)
Commits: N batches
Files changed: M
Tests added: T
```

## CRITICAL RULES
1. NEVER skip the validation gate between batches
2. ALWAYS commit after a successful batch — don't accumulate
3. If a fix introduces new lint/type errors, self-heal before committing
4. Track all deferred items in TODOS.md
5. Use `/gstack qa` for web apps, `pytest` for Python, `bun test` for JS/TS
6. Maximum 54 total agent dispatches across the entire pipeline
7. If any dimension drops below its BEFORE score, flag and investigate
