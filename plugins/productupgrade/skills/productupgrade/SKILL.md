---
name: productupgrade
description: AI-powered product upgrade pipeline — runs 54-agent iterative review with CEO/Engineering/UX/QA parallel loops, LLM-as-judge evaluation, recursive improvement loops, competitor analysis, GUI audit, and end-to-end validation. Use when upgrading, auditing, or improving any product codebase.
---

# ProductUpgrade — 54-Agent Recursive Product Improvement Pipeline

A comprehensive skill that orchestrates up to 54 concurrent review agents in recursive iteration loops to systematically audit, improve, and validate any product codebase. Combines CEO strategic review, engineering deep-dive, UX/UI analysis, competitor scraping, automated QA, and **LLM-as-Judge** evaluation with convergence criteria.

## When to Use

- `/productupgrade` — Run the full recursive pipeline until convergence
- `/productupgrade audit` — Run audit-only (no code changes)
- `/productupgrade ux` — UX/UI focused analysis with competitor scraping
- `/productupgrade fix` — Fix all findings from a previous audit
- `/productupgrade validate` — Run validation-only on recent changes
- `/productupgrade judge` — Run LLM-as-Judge evaluation only

## Core Innovation: Recursive Convergence Loop

Unlike linear review tools, ProductUpgrade runs in a **recursive loop** that continues until either:
1. The target grade is reached (configurable, default 8.0/10)
2. The maximum iteration count is hit (default 7 master iterations)
3. The grade delta between iterations drops below threshold (< 0.2 improvement = converged)

```
┌─────────────────────────────────────────────────────────────────────┐
│                   RECURSIVE CONVERGENCE ENGINE                       │
│                                                                     │
│  MASTER LOOP (up to 7 iterations):                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Iteration N:                                                │   │
│  │  1. DISCOVER (7 agents) → scan + scrape + audit              │   │
│  │  2. REVIEW (7 agents) → CEO + Eng + Design                  │   │
│  │  3. PLAN (7 agents) → prioritize + spec + TDD               │   │
│  │  4. EXECUTE (7 agents per batch × up to 7 batches)           │   │
│  │  5. VALIDATE (5 agents) → test + QA + review                │   │
│  │  6. JUDGE (LLM-as-Judge) → score all 10 dimensions          │   │
│  │                                                               │   │
│  │  ┌─────────────────────────────────────────────┐             │   │
│  │  │ LLM JUDGE VERDICT:                          │             │   │
│  │  │ Grade: 6.2/10                               │             │   │
│  │  │ Target: 8.0/10                              │             │   │
│  │  │ Delta from last: +0.8                       │             │   │
│  │  │ Verdict: CONTINUE (grade < target)          │             │   │
│  │  │ Focus next iteration: Tests, Accessibility  │             │   │
│  │  └─────────────────────────────────────────────┘             │   │
│  │                                                               │   │
│  │  IF grade >= target: STOP (SUCCESS)                          │   │
│  │  IF delta < 0.2: STOP (CONVERGED)                            │   │
│  │  IF iteration >= max: STOP (MAX REACHED)                     │   │
│  │  ELSE: feed findings back → next iteration                   │   │
│  └──────────────────────────────────────────┬──────────────────┘   │
│                                              │                       │
│                                              ▼                       │
│                                    NEXT ITERATION                    │
│                              (focused on gaps from judge)            │
└─────────────────────────────────────────────────────────────────────┘
```

### Iteration Focus Narrowing

Each iteration, the judge identifies the **2 lowest-scoring dimensions**. The next iteration focuses its 7 review agents and 49 fix agents exclusively on those dimensions. This prevents thrashing and ensures convergence:

```
Iteration 1: Full scan (all 10 dimensions) → Grade 5.4
  Judge says: Focus on Tests (4/10) and Accessibility (3/10)

Iteration 2: Focused on Tests + Accessibility → Grade 6.2 (+0.8)
  Judge says: Focus on Security (5/10) and Observability (5/10)

Iteration 3: Focused on Security + Observability → Grade 6.8 (+0.6)
  Judge says: Focus on Performance (6/10) and Deployment (6/10)

Iteration 4: Focused on Performance + Deployment → Grade 7.2 (+0.4)
  Judge says: Focus on UX/UI (7/10) and Documentation (7/10)

Iteration 5: Focused on UX + Docs → Grade 7.6 (+0.4)
  Judge says: Focus on Error Handling (7/10) and Code Quality (7.5/10)

Iteration 6: Focused on Errors + Quality → Grade 7.9 (+0.3)
  Judge says: Focus on remaining gaps

Iteration 7: Final polish → Grade 8.1 (+0.2)
  Judge says: CONVERGED (delta < 0.2). Grade exceeds target.
```

## LLM-as-Judge Module

The judge is a **separate LLM evaluation** that scores the codebase objectively after each iteration. It is NOT the same model doing the fixes — it's an independent evaluator.

### Judge Protocol

```
FOR EACH of the 10 dimensions:
  1. Sample 5 files most relevant to this dimension
  2. Read each file completely
  3. Apply the rubric criteria (1-10 scale with specific evidence thresholds)
  4. Score with justification (evidence from actual code, not assumptions)
  5. Identify the single highest-impact improvement for next iteration

THEN:
  6. Compute overall grade (weighted average)
  7. Compare to previous iteration grade
  8. Compute delta
  9. Decide: CONTINUE / CONVERGED / SUCCESS / MAX_REACHED
  10. If CONTINUE: identify 2 focus dimensions for next iteration
```

### Judge Prompt Template

```markdown
You are an expert software quality evaluator. Score this codebase on the following
dimension using ONLY evidence from the actual code you read. Do not assume — verify.

**Dimension:** {{DIMENSION}}
**Scale:** 1-10 (see rubric below)

**Files to evaluate:**
{{FILE_LIST}}

**Rubric:**
- 1-2: {{CRITERIA_LOW}}
- 3-4: {{CRITERIA_MED_LOW}}
- 5-6: {{CRITERIA_MED}}
- 7-8: {{CRITERIA_MED_HIGH}}
- 9-10: {{CRITERIA_HIGH}}

**Your evaluation must include:**
1. Score (integer 1-10)
2. Three specific code evidence citations (file:line)
3. One highest-impact improvement suggestion
4. Confidence level (HIGH/MEDIUM/LOW)

**Previous iteration score:** {{PREV_SCORE}} (or "N/A" for first iteration)
**Previous iteration feedback:** {{PREV_FEEDBACK}}

Return JSON:
{
  "dimension": "{{DIMENSION}}",
  "score": <int>,
  "evidence": ["file:line — description", ...],
  "improvement": "description of highest-impact fix",
  "confidence": "HIGH|MEDIUM|LOW",
  "delta": <float or null>
}
```

### Judge Independence

The judge MUST be independent from the fix agents. Implementation:
1. Judge runs as a **separate agent** with read-only access (no Edit/Write tools)
2. Judge reads files directly, does not rely on agent self-reports
3. Judge uses `sequential-thinking` MCP for structured reasoning
4. Judge output is saved to `.productupgrade/JUDGE-ITERATION-{N}.md`

## Phase-by-Phase Detail

### Phase 1: DISCOVERY (7 parallel agents)

Launch ALL 7 simultaneously via Agent tool:

| Agent | Task | Tools | Output |
|-------|------|-------|--------|
| 1 | Codebase scan | Glob, Grep, Read, Bash | Architecture map, LOC, churn hotspots |
| 2 | Dependency audit | Bash (npm audit, pip-audit) | CVE list, outdated packages |
| 3 | Competitor scrape | scripts/scrape-competitor.sh, /ux-browse | Screenshots, design tokens |
| 4 | Type safety | Bash (tsc --noEmit, mypy) | Type error list |
| 5 | API contracts | Grep, Read | Endpoint inventory, schema consistency |
| 6 | Performance profile | Bash (lighthouse, bundle-analyzer) | Performance metrics |
| 7 | Security scan | Grep, Read | OWASP findings, secret detection |

### Phase 2: STRATEGIC REVIEW (7 parallel conversations)

Launch ALL 7 simultaneously. Each invokes a skill:

| Agent | Skill | Mode/Pass | Focus |
|-------|-------|-----------|-------|
| 1 | /plan-ceo-review | SCOPE EXPANSION | Dream state, 10x vision |
| 2 | /plan-ceo-review | HOLD SCOPE | Error map, failure modes |
| 3 | /plan-ceo-review | SCOPE REDUCTION | Minimum viable cut |
| 4 | /plan-eng-review | Pass 1 | Architecture, data flow |
| 5 | /plan-eng-review | Pass 2 | Edge cases, deployment |
| 6 | /frontend-design | Component audit | Design system, a11y |
| 7 | /backend-patterns | Pattern audit | API design, DB queries |

### Phase 3: PLANNING (7 parallel agents)

| Agent | Task | Skill | Output |
|-------|------|-------|--------|
| 1 | Write implementation plan | /superpowers:write-plan | UPGRADE-PLAN.md |
| 2 | Generate TDD test specs | /test-driven-development | UPGRADE-TESTS.md |
| 3 | Plan migrations | /deployment-patterns | UPGRADE-MIGRATION.md |
| 4 | Design UX improvements | /frontend-design | UX mockups + specs |
| 5 | Optimize backend patterns | /backend-patterns | Refactor specs |
| 6 | Code review baseline | /code-review | Baseline findings |
| 7 | Priority ranking | (direct) | P0/P1/P2/P3 matrix |

### Phase 4: EXECUTION (7 batches × 7 agents = 49 max)

```python
for batch in range(1, 8):  # Up to 7 batches
    fixes = select_next_7_independent_fixes(plan)
    if not fixes:
        break

    # Launch 7 parallel fix agents
    agents = []
    for fix in fixes:
        agent = launch_agent(
            task=f"Fix: {fix.title}",
            context=f"Finding: {fix.description}\nPlan: {fix.plan}\nFiles: {fix.files}",
            tools=["Read", "Edit", "Write", "Bash", "Grep", "Glob"],
        )
        agents.append(agent)

    # Wait for all agents
    results = await_all(agents)

    # Validation gate
    lint_ok = run("bun run lint") and run("uvx ruff check .")
    type_ok = run("npx tsc --noEmit")
    test_ok = run("pytest") or run("bun test")

    if lint_ok and type_ok and test_ok:
        git_commit(f"fix(productupgrade): batch {batch} — {len(fixes)} fixes")
    else:
        # Self-heal: fix lint/type errors
        self_heal_agent = launch_agent(task="Fix lint and type errors")
        await self_heal_agent
        git_commit(f"fix(productupgrade): batch {batch} — {len(fixes)} fixes (healed)")
```

### Phase 5: VALIDATION (5 parallel agents)

| Agent | Task | Tool/Skill |
|-------|------|------------|
| 1 | Code review all changes | /code-review |
| 2 | QA test affected pages | /gstack qa |
| 3 | Run full test suite | Bash (pytest, bun test) |
| 4 | Performance comparison | Bash (lighthouse before/after) |
| 5 | CEO re-review | /plan-ceo-review HOLD SCOPE |

### Phase 6: LLM-AS-JUDGE (1 agent, 10 evaluations)

The judge agent evaluates all 10 dimensions independently, then produces:
- Per-dimension score with evidence
- Overall grade
- Delta from previous iteration
- Verdict: CONTINUE / CONVERGED / SUCCESS / MAX_REACHED
- If CONTINUE: 2 focus dimensions for next iteration

Output: `.productupgrade/JUDGE-ITERATION-{N}.md`

## Convergence Criteria

```
SUCCESS:    overall_grade >= target_grade (default 8.0)
CONVERGED:  delta < convergence_threshold (default 0.2) for 2 consecutive iterations
MAX_REACHED: iteration_count >= max_iterations (default 7)
DEGRADED:   any dimension score decreased — HALT and investigate
```

## Configuration

```yaml
# .productupgrade.yml
target: .
competitors:
  - https://competitor1.com
  - https://competitor2.com

# Recursive loop settings
max_iterations: 7          # Master loop iterations
target_grade: 8.0          # Stop when this grade is reached
convergence_threshold: 0.2 # Stop when improvement < this
batch_size: 7              # Agents per execution batch
max_agents: 54             # Maximum concurrent agents

# Judge settings
judge:
  model: opus              # Use strongest model for judging
  samples_per_dimension: 5 # Files to sample per dimension
  require_evidence: true   # Must cite file:line for each score

# Focus areas (empty = all)
focus: []

# Auto-fix settings
auto_fix: true
commit_per_batch: true

rubric:
  min_grade: 7.0
  fail_dimensions:
    - security
    - code_quality
```

## Output Files

```
.productupgrade/
├── AUDIT-DISCOVERY.md          # Codebase scan results
├── AUDIT-COMPETITORS.md        # Competitor UX analysis
├── AUDIT-GUI.md                # GUI screenshot analysis
├── REVIEW-CEO.md               # CEO review findings (3 modes)
├── REVIEW-ENGINEERING.md       # Engineering review findings
├── REVIEW-DESIGN.md            # Design review findings
├── RUBRIC-BEFORE.md            # Pre-upgrade evaluation scores
├── RUBRIC-AFTER.md             # Post-upgrade evaluation scores
├── UPGRADE-PLAN.md             # Ordered fix plan with dependencies
├── UPGRADE-TESTS.md            # TDD specs for each fix
├── UPGRADE-MIGRATION.md        # Breaking changes and rollback
├── UPGRADE-LOG.md              # Execution log (all batch results)
├── JUDGE-ITERATION-1.md        # Judge evaluation after iteration 1
├── JUDGE-ITERATION-2.md        # Judge evaluation after iteration 2
├── ...                         # Up to JUDGE-ITERATION-7.md
├── CONVERGENCE-LOG.md          # Grade progression across iterations
└── VALIDATION-REPORT.md        # Final validation results
```

## Integrated Skills

Orchestrates all of these existing skills:
- `/plan-ceo-review` — CEO strategic review (3 modes: expansion/hold/reduction)
- `/plan-eng-review` — Engineering deep-dive review (architecture + robustness)
- `/superpowers:write-plan` — Implementation planning with checkpoints
- `/code-review` — Code review on all changes
- `/frontend-design` — Frontend component design and audit
- `/backend-patterns` — Backend architecture patterns and optimization
- `/gstack qa` — Automated QA testing with health scoring
- `/browse` — Headless browser for screenshots and testing
- `/ux-browse` — UX screenshot capture at multiple breakpoints
- `/ux-analyze` — Multi-model vision analysis of screenshots
- `/ux-clone` — Full UX replication pipeline
- `/test-driven-development` — TDD spec generation
- `/deployment-patterns` — Migration and deployment planning
- `/systematic-debugging` — Root cause analysis for complex bugs
- `/agentic-engineering` — Eval-first agent execution patterns
- `/dispatching-parallel-agents` — Parallel agent dispatch coordination

## Anti-Patterns (What NOT to Do)

1. **Never skip the judge.** Every iteration must be scored independently.
2. **Never let fix agents self-report quality.** The judge reads code directly.
3. **Never continue if a dimension DECREASED.** Halt and investigate.
4. **Never batch more than 7 fixes.** Larger batches cause merge conflicts.
5. **Never skip the validation gate.** Broken code must not be committed.
6. **Never run the judge with the same model context as the fixer.** Independence is critical.
7. **Never hardcode iteration count.** Use convergence criteria to stop naturally.
