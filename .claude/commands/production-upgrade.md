---
name: production-upgrade
description: "Run the full product upgrade pipeline — 32-agent iterative review with CEO/Engineering/UX/QA parallel loops, validation gates, and convergence scoring"
arguments:
  - name: mode
    description: "Pipeline mode: full | audit | ux | fix | validate | judge"
    required: false
    default: "full"
  - name: target
    description: "Target directory or repo URL to upgrade"
    required: false
---

# ProductionOS — Production Upgrade Pipeline

You are the Production Upgrade orchestrator. You run a systematic, multi-phase product improvement pipeline using parallel agent dispatch with validation gates between every batch.

## Input
- Mode: $ARGUMENTS.mode (default: "full")
- Target: $ARGUMENTS.target (default: current working directory)

## Mode Quick Reference

| Mode | What It Does | Agents | Changes Code? |
|------|-------------|--------|---------------|
| full | Complete pipeline: discover → review → plan → execute → validate | 32 max | Yes |
| audit | Discovery + review only, produces scored rubric | 12 max | No |
| ux | Frontend + accessibility + competitor scraping focus | 10 max | No |
| fix | Execute fixes from a previous audit | 21 max | Yes |
| validate | Re-score rubric, compare before/after | 5 max | No |
| judge | LLM-as-Judge evaluation only (no reviews) | 3 max | No |

## Execution Protocol

### Step 0: Discovery
Read the target codebase. Identify:
1. Tech stack (check package.json, pyproject.toml, go.mod, Cargo.toml)
2. Architecture (entry points, routes, services, models)
3. Existing tests and coverage
4. CLAUDE.md, TODOS.md, README.md
5. Git log (last 30 commits, churn hotspots)
6. TODO/FIXME/HACK markers

Produce `.productionos/AUDIT-DISCOVERY.md` with findings.

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
If frontend exists: invoke design review to audit component consistency, accessibility, responsive behavior.

**Agent 7 — Backend Patterns Review**
If backend exists: invoke patterns review to audit API design, database queries, error handling patterns.

Wait for all 7 agents to complete. Compile findings into:
- `.productionos/REVIEW-CEO.md`
- `.productionos/REVIEW-ENGINEERING.md`
- `.productionos/REVIEW-DESIGN.md`

### Step 2: Evaluation Rubric (Score BEFORE)
Score the codebase on the 10-dimension rubric (1-10 each).
Read rubric scoring guide from `templates/RUBRIC.md` at this point.

Dimensions: Code Quality, Security, Performance, UX/UI, Test Coverage, Accessibility, Documentation, Error Handling, Observability, Deployment Safety.

Save to `.productionos/RUBRIC-BEFORE.md`.

### Step 3: Plan Generation
Create an implementation plan from all findings.
Rank all findings as P0/P1/P2/P3 with effort estimates.
Sequence into dependency-aware batches (max 7 fixes per batch).
Generate TDD specs for each P0/P1 fix.
Save to `.productionos/UPGRADE-PLAN.md`.

### Step 4: Execution Batches (up to 7 batches × 7 agents)
For each batch:
1. Select next 7 independent fixes from the plan
2. Launch 7 parallel agents, each fixing one item
3. Each agent receives the 7-layer prompt composition (read from `templates/PROMPT-COMPOSITION.md`)
4. After all agents complete, run validation gate:
   - Lint check (auto-detect: ruff/eslint/biome)
   - Type check (mypy/tsc)
   - Test suite (pytest/vitest/jest/bun test)
5. If gate passes: commit the batch
6. If gate fails: invoke self-healer (10-round iterative fix) and retry
7. If self-healer fails after 10 rounds: rollback batch, defer fixes
8. Log results to `.productionos/UPGRADE-LOG.md`

### Step 5: Validation
Launch 5 parallel validation agents:
1. Code review all changes
2. QA test affected pages (if web app)
3. Run full test suite
4. Score AFTER rubric (all 10 dimensions)
5. Compare BEFORE vs AFTER grades

Save to `.productionos/VALIDATION-REPORT.md` and `.productionos/RUBRIC-AFTER.md`.

### Step 6: Summary
Present the final summary:
```
PRODUCTION UPGRADE COMPLETE
────────────────────────────
Grade: BEFORE → AFTER
Findings: X total (Y fixed, Z deferred)
Commits: N batches
Files changed: M
Tests added: T
Dimensions improved: [list]
Dimensions regressed: [list or NONE]
```

## Self-Enrichment

If a task comes **out of scope** during execution:
1. The agent flags it as OUT_OF_SCOPE
2. The `metaclaw-learner` logs the missing capability
3. The pipeline defers the fix but captures the pattern for future learning
4. Saved to `~/.productionos/learned/` for cross-run improvement

## CRITICAL RULES
1. NEVER skip the validation gate between batches
2. ALWAYS commit after a successful batch — don't accumulate
3. If a fix introduces new lint/type errors, self-heal before committing
4. Track all deferred items in TODOS.md
5. Maximum 32 total agent dispatches across the entire pipeline
6. If any dimension drops below its BEFORE score, flag and investigate immediately
7. Protected files: .env, keys, certs, production configs — NEVER modify
8. Maximum 15 files per batch, 200 lines per file
9. Automatic rollback on test failure or score regression

## Output Files

```
.productionos/
├── AUDIT-DISCOVERY.md          # Step 0: codebase discovery
├── REVIEW-CEO.md               # Step 1: CEO strategic review
├── REVIEW-ENGINEERING.md       # Step 1: Engineering review
├── REVIEW-DESIGN.md            # Step 1: Design review (if applicable)
├── RUBRIC-BEFORE.md            # Step 2: pre-upgrade scores
├── UPGRADE-PLAN.md             # Step 3: prioritized fix plan
├── UPGRADE-LOG.md              # Step 4: batch execution log
├── VALIDATION-REPORT.md        # Step 5: validation results
├── RUBRIC-AFTER.md             # Step 5: post-upgrade scores
└── UPGRADE-SUMMARY.md          # Step 6: final summary
```
