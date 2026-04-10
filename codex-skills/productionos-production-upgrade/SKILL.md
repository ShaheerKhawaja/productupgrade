---
name: productionos-production-upgrade
description: "Run the full product upgrade pipeline — 55-agent iterative review with CEO/Engineering/UX/QA parallel loops"
argument-hint: "[mode, target repo, or directory]"
---

# productionos-production-upgrade


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
The flagship ProductionOS command. Runs a bounded audit-and-improve loop: discover the current state, score the codebase across 10 dimensions, dispatch parallel review agents, prioritize fixes, implement in safe batches with rollback, validate, and converge toward a target grade.

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `mode` | `full`, `audit`, `ux`, `fix`, `validate` | `full` | Pipeline mode |
| `target` | directory path or repo URL | cwd | Target to upgrade |
| `profile` | `quality`, `balanced`, `budget` | `quality` | Model profile. Budget reduces agent depth and enables ES-CoT. |
| `converge` | `on`, `off`, or a number | `off` | Enable recursive convergence loop. Number = target grade. |
| `target_grade` | `1.0` - `10.0` | `10.0` | Target grade for convergence |

## Pre-Execution Checks (mandatory)

Before any work begins, run these four checks:

1. **Artifact check.** If `.productionos/` exists, read `AUDIT-DISCOVERY.md` and `CONVERGENCE-LOG.md`. Report: "Found prior audit from {date} -- building on existing work." Do not re-discover what is already known.
2. **Cost estimate.** Estimate tokens and display: "Estimated cost: ~$X.XX ({tokens}K tokens, {agents} agents, ~{minutes}min)". Full mode = ~200K-400K tokens, audit-only = ~100K tokens.
3. **Dependency check.** If `/plan-ceo-review` or `/plan-eng-review` are unavailable (gstack not installed), warn: "NOTICE: gstack not installed -- CEO/Eng review steps will be skipped." Do NOT halt.
4. **Decision capture.** If `.productionos/DECISIONS-LOCKED.md` does not exist, discuss with the user first. Do not optimize in a direction the user never wanted.

## Progress Reporting

At every step transition, output:
```
[ProductionOS] Step {N}/{total} -- {step_name} ({elapsed}s)
```

---

## Step 0: Discovery

Read the target codebase systematically:

1. **Tech stack** -- check `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `Gemfile`
2. **Architecture** -- identify entry points, routes, services, models, data flow
3. **Tests and coverage** -- existing test suites, coverage reports
4. **Project docs** -- `CLAUDE.md`, `TODOS.md`, `README.md`, `CHANGELOG.md`
5. **Git history** -- last 30 commits, churn hotspots via `git log --format='%H' -30 | xargs -I{} git diff-tree --no-commit-id --name-only -r {} | sort | uniq -c | sort -rn | head -20`
6. **Markers** -- `TODO`, `FIXME`, `HACK`, `XXX` across all source files

Produce `.productionos/AUDIT-DISCOVERY.md` with structured findings.

### Large File Handling

Before processing any file, check if it exceeds 50K characters. If yes, split by class/function boundaries and process each chunk. This is transparent -- the pipeline continues with chunked results.

---

## Step 1: Parallel Review Agents (7 agents)

Launch 7 agents in parallel using the Agent tool:

| Agent | Role | Scope | Output |
|-------|------|-------|--------|
| 1 - CEO Review (Expand) | `/plan-ceo-review` SCOPE EXPANSION mode | Dream state, 10x vision, delight opportunities | `.productionos/UPGRADE-REVIEW-CEO.md` |
| 2 - CEO Review (Hold) | `/plan-ceo-review` HOLD SCOPE mode | Error map, security, failure modes | appended to CEO review |
| 3 - Eng Review (Arch) | `/plan-eng-review` architecture focus | Data flow, state machines, scaling, SPOFs | `.productionos/UPGRADE-REVIEW-ENGINEERING.md` |
| 4 - Eng Review (Robust) | `/plan-eng-review` robustness focus | Edge cases, error handling, rollback, deployment | appended to Eng review |
| 5 - Code Review | `/code-review` on last 30 commits | Code quality, patterns, anti-patterns | `.productionos/UPGRADE-REVIEW-CODE.md` |
| 6 - Frontend Review | `/frontend-design` audit | Component consistency, a11y, responsive behavior | `.productionos/UPGRADE-REVIEW-DESIGN.md` |
| 7 - Backend Review | `/backend-patterns` audit | API design, DB queries, error handling patterns | appended to Code review |

Wait for ALL agents. Use the `UPGRADE-` prefix on filenames to avoid collision with `/omni-plan` artifacts.

### Step 1.5: Specialized Agents (profile=quality, mode=full only)

| Agent | File | Scope |
|-------|------|-------|
| 8 - Plan Checker | `agents/plan-checker.md` | Validate UPGRADE-PLAN.md for completeness, circular deps, goal alignment |
| 9 - Guardrails Controller | `agents/guardrails-controller.md` | Verify batch limits, protected file guard, pre-commit diff, cost ceiling |
| 10 - AI/ML Engineer | `agents/aiml-engineer.md` | If LLM/embedding/fine-tuning code exists: audit pipeline, model selection, cost |
| 11 - Infra Setup | `agents/infra-setup.md` | If Docker/K8s/cloud infra: audit deployment, secrets, scaling |
| 12 - Recursive Orchestrator | `agents/recursive-orchestrator.md` | When converge is active: focus narrowing, plateau detection |

---

## Step 2: Score BEFORE (10-Dimension Rubric)

Score the codebase 1-10 on each dimension:

| Dimension | Weight | What to Evaluate |
|-----------|--------|------------------|
| Code Quality | 12% | Readability, naming, DRY, SOLID, consistent patterns |
| Security | 15% | Auth, injection prevention, secret handling, CORS, CSP |
| Performance | 10% | Bundle size, query efficiency, caching, lazy loading |
| UX/UI | 10% | Consistency, responsiveness, loading states, error states |
| Test Coverage | 12% | Line/branch coverage, edge case tests, integration tests |
| Accessibility | 8% | WCAG 2.1 AA, ARIA, keyboard nav, color contrast |
| Documentation | 8% | README, API docs, inline comments, CHANGELOG |
| Error Handling | 10% | Try/catch patterns, user-facing errors, logging, recovery |
| Observability | 7% | Structured logging, metrics, tracing, alerting |
| Deployment Safety | 8% | CI/CD, rollback, health checks, feature flags |

Save to `.productionos/RUBRIC-BEFORE.md`.

---

## Step 3: Plan Generation

Create an implementation plan from ALL review findings. For each finding:

| Field | Description |
|-------|-------------|
| ID | Sequential: FIX-001, FIX-002, ... |
| Priority | P0 (critical), P1 (high), P2 (medium), P3 (low) |
| Effort | hours, days, sprint |
| Dimension | Which rubric dimension this improves |
| Files | Exact files to modify |
| Description | What to do |
| Risk | What could break |

Rank all findings P0 first. Save to `.productionos/UPGRADE-PLAN.md`.

---

## Step 4: Execution Batches

Execute fixes in batches of up to 7 parallel agents, up to 7 batches (49 total agent dispatches max across entire pipeline).

### Per-Batch Protocol

```
FOR each batch (1..7):

  1. CREATE ROLLBACK POINT
     git stash push -m "productionos-batch-N-pre"

  2. BATCH LIMIT ENFORCEMENT
     Count total files targeted by this batch.
     IF > 15 files:
       Split into sub-batches of <=15 files each
       Log: "[ProductionOS] Batch split: {total} files -> {N} sub-batches of <=15"
       Execute sub-batches sequentially with validation gate between each

  3. DISPATCH 7 AGENTS
     Select next 7 independent fixes from the plan.
     Each agent gets: fix description + scope boundary + output format + constraints.
     Launch all 7 in parallel via Agent tool.

  4. VALIDATION GATE (mandatory, never skip)
     Run: lint (eslint/ruff), type check (tsc/mypy), test suite (bun test/pytest)
     ALL must pass.

  5. IF GATE PASSES:
     a. PRE-COMMIT DIFF REVIEW (mandatory):
        - Run: git diff --stat
        - Verify: no files outside batch scope were modified
        - Verify: no protected files (.env, keys, certs) in diff
        - If unexpected files: HALT commit, investigate
        - Log: "[ProductionOS] Pre-commit review: {N} files, {add}+/{del}- lines"
     b. git stash drop (discard rollback, keep changes)
     c. Commit the batch

  6. IF GATE FAILS:
     Invoke self-healer to fix lint/type errors.
     Retry validation up to 3 rounds.
     If still failing after 3 rounds:
       git stash pop (restore pre-batch state)
       Log failed batch to .productionos/UPGRADE-LOG.md
       Continue to next batch

  7. LOG to .productionos/UPGRADE-LOG.md
```

### Self-Evaluation Gate (after each agent completes)

Apply the 7-question self-eval protocol:

| Question | What It Checks |
|----------|----------------|
| Q1: Quality | Score output 1-10 with evidence. Would a senior engineer accept this? |
| Q2: Necessity | Did we solve the actual problem? Any scope creep? |
| Q3: Correctness | Logical errors? New bugs? Tested claims? |
| Q4: Dependencies | What depends on what we changed? Downstream consumers checked? |
| Q5: Completeness | Edge cases handled? TODOs resolved? |
| Q6: Learning | Patterns discovered? Gotchas to document? |
| Q7: Honesty | Inflating score? Hiding doubts? Would you bet $1000 on correctness? |

Score thresholds:
- >= 8.0: **PASS** -- proceed to next agent/phase
- 6.0-7.9: **SELF-HEAL** -- trigger self-healer (max 3 iterations)
- < 6.0: **BLOCK** -- escalate to human, do not commit

---

## Step 5: Validation

Launch 5 parallel validation agents:

1. **Code review** all changes made during execution
2. **QA test** affected pages (if web app, run `/qa`)
3. **Run full test suite** (`bun test`, `pytest`, etc.)
4. **Score AFTER rubric** -- re-evaluate all 10 dimensions
5. **Compare BEFORE vs AFTER** -- flag any dimension regression

Save to `.productionos/VALIDATION-REPORT.md` and `.productionos/RUBRIC-AFTER.md`.

### Regression Protection

If ANY dimension score dropped below its BEFORE score: flag, investigate, and do not declare success until resolved. A dimension drop > 0.5 triggers automatic rollback of the offending batch.

---

## Step 5.5: Convergence Loop (when converge is active)

```
target_grade = (converge is a number) ? converge : target_grade (default: 10.0)
max_convergence_iterations = 5

AFTER each Step 5 validation:
  current_grade = AFTER grade from RUBRIC-AFTER.md

  IF current_grade >= target_grade:
    DONE. Log: "[ProductionOS] Converged at iteration {N} -- grade {current} >= target {target}"

  IF current_grade < previous_grade:
    REGRESSION. Rollback last batch, HALT.
    Log: "[ProductionOS] Regression: {previous} -> {current}. Rolling back."

  IF convergence_iteration >= max_convergence_iterations:
    MAX ITERATIONS. Proceed to Step 6.
    Log: "[ProductionOS] Max convergence iterations ({max}). Final: {current}"

  IF delta < 0.3 for 2 consecutive iterations:
    DIMINISHING RETURNS. Proceed to Step 6.
    Log: "[ProductionOS] Diminishing returns (delta < 0.3 x2). Final: {current}"

  ELSE:
    Read VALIDATION-REPORT.md for remaining issues.
    Filter to items NOT yet fixed.
    Loop back to Step 3 with remaining items only.
    Display: "Convergence iteration {N}/5 -- grade: {current} -> target: {target}"
```

Cost tracking: each convergence iteration costs ~$1-3. Display running total.

---

## Step 6: Summary

### Post-Upgrade Doc Check
1. If agent count changed: update CLAUDE.md
2. If test count changed: update README.md
3. If version bumped: verify CHANGELOG.md entry
4. Log: "[ProductionOS] Doc check: {N} items verified"

### Final Output Format

```
PRODUCTIONOS UPGRADE COMPLETE
----------------------------
Grade: {BEFORE} -> {AFTER}
Findings: X total (Y fixed, Z deferred)
Commits: N batches
Files changed: M
Tests added: T
```

If convergence was active:
```
CONVERGENCE HISTORY
----------------------------
Iteration 1: X.X -> Y.Y (+Z.Z)
Iteration 2: Y.Y -> W.W (+V.V)
...
Final: A.A (target: T.T) -- {CONVERGED|MAX_REACHED|DIMINISHING_RETURNS}
```

---

## Error Handling and Escalation

| Scenario | Action |
|----------|--------|
| Agent dispatch fails | Degrade gracefully. Run the check inline. Never halt. |
| Lint/type check fails after fix | Self-healer, max 3 retries, then rollback batch |
| Test suite fails | Rollback batch, log failure, continue to next batch |
| Score regression detected | Rollback offending batch, investigate |
| Context budget exceeded (80%) | Trigger emergency compression, summarize completed work |
| Protected file modified | HALT commit immediately, alert user |
| User cancels mid-pipeline | Save state to `.productionos/CHECKPOINT.md` for `/productionos-resume` |

## Guardrails (Non-Negotiable)

1. NEVER skip the validation gate between batches
2. ALWAYS commit after a successful batch -- do not accumulate uncommitted changes
3. If a fix introduces new lint/type errors, self-heal before committing
4. Track all deferred items in TODOS.md
5. Use `/qa` for web apps, `pytest` for Python, `bun test` for JS/TS
6. Maximum 49 total agent dispatches (7 review + 7x5 fix + 5 validate + 1 summary)
7. Maximum 15 files per batch, 200 lines per file
8. Never take destructive actions without explicit user approval
9. Never hide regressions behind aggregate score improvement
10. Treat existing `.productionos/` artifacts as valuable -- build on them

## Output Files

```
.productionos/
  AUDIT-DISCOVERY.md         # Step 0 findings
  UPGRADE-REVIEW-CEO.md      # Step 1 CEO review
  UPGRADE-REVIEW-ENGINEERING.md  # Step 1 Eng review
  UPGRADE-REVIEW-DESIGN.md   # Step 1 Design review
  UPGRADE-REVIEW-CODE.md     # Step 1 Code review
  RUBRIC-BEFORE.md           # Step 2 baseline scores
  UPGRADE-PLAN.md            # Step 3 prioritized plan
  UPGRADE-LOG.md             # Step 4 batch execution log
  VALIDATION-REPORT.md       # Step 5 validation results
  RUBRIC-AFTER.md            # Step 5 final scores
  CONVERGENCE-LOG.md         # Step 5.5 iteration history
  self-eval/                 # Per-agent evaluation logs
```
