---
name: productupgrade
description: AI-powered product upgrade pipeline — runs 54-agent iterative review with CEO/Engineering/UX/QA parallel loops, competitor analysis, GUI audit, and end-to-end validation. Use when upgrading, auditing, or improving any product codebase.
---

# ProductUpgrade — 54-Agent Iterative Product Improvement Pipeline

A comprehensive skill that orchestrates up to 54 concurrent review agents in batches of 7 iterations to systematically audit, improve, and validate any product codebase. Combines CEO strategic review, engineering deep-dive, UX/UI analysis, competitor scraping, and automated QA.

## When to Use

- `/productupgrade` — Run the full pipeline on the current codebase
- `/productupgrade audit` — Run audit-only (no code changes)
- `/productupgrade ux` — UX/UI focused analysis with competitor scraping
- `/productupgrade fix` — Fix all findings from a previous audit
- `/productupgrade validate` — Run validation-only on recent changes

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTUPGRADE PIPELINE                       │
│                                                                 │
│  Phase 1: DISCOVERY (7 parallel agents)                         │
│  ├── Codebase scanner (architecture, patterns, tech debt)       │
│  ├── Dependency auditor (CVEs, outdated, license)               │
│  ├── Competitor scraper (5 competitor sites → UX patterns)      │
│  ├── Type safety analyzer (TS strict, Python mypy)              │
│  ├── API contract validator (OpenAPI, schema drift)             │
│  ├── Performance profiler (bundle size, N+1, memory)            │
│  └── Security scanner (OWASP top 10, secrets, injection)        │
│                                                                 │
│  Phase 2: STRATEGIC REVIEW (7 parallel conversations)           │
│  ├── CEO Review (/plan-ceo-review × 3 modes)                   │
│  │   ├── SCOPE EXPANSION — dream state, 10x version            │
│  │   ├── HOLD SCOPE — bulletproof current plan                  │
│  │   └── SCOPE REDUCTION — minimum viable cut                  │
│  ├── Engineering Review (/plan-eng-review × 2 passes)           │
│  │   ├── Pass 1: Architecture, data flow, state machines        │
│  │   └── Pass 2: Edge cases, error handling, deployment         │
│  └── Design Review (/frontend-design × 2 passes)               │
│      ├── Pass 1: Component audit, accessibility, responsive     │
│      └── Pass 2: Interaction patterns, animation, polish        │
│                                                                 │
│  Phase 3: IMPLEMENTATION PLANNING (7 parallel agents)           │
│  ├── Plan writer (/superpowers:write-plan)                      │
│  ├── Test plan generator (TDD specs per finding)                │
│  ├── Migration planner (breaking changes, rollback)             │
│  ├── UX improvement designer (mockups, component specs)         │
│  ├── Backend pattern optimizer (/backend-patterns)              │
│  ├── Frontend design improver (/frontend-design)                │
│  └── Priority ranker (P0/P1/P2 with effort estimates)           │
│                                                                 │
│  Phase 4: EXECUTION (7 batches × 7 parallel agents = 49 max)   │
│  ├── Batch 1-7: Fix findings by priority                        │
│  │   Each batch: 7 independent fixes in parallel                │
│  │   After each batch: validation gate (lint + type + test)     │
│  │   If gate fails: self-heal and retry                         │
│  └── Commit after each successful batch                         │
│                                                                 │
│  Phase 5: VALIDATION (5 parallel agents)                        │
│  ├── Code review (/code-review on all changes)                  │
│  ├── QA testing (/gstack qa on all affected pages)              │
│  ├── Regression check (run full test suite)                     │
│  ├── Performance comparison (before/after metrics)              │
│  └── Final CEO re-review (grade improvement)                    │
│                                                                 │
│  TOTAL: Up to 54 concurrent agent slots across all phases       │
└─────────────────────────────────────────────────────────────────┘
```

## Phase 1: DISCOVERY

### Codebase Scan
```bash
# Auto-detect project type and run appropriate scanners
productupgrade scan --target /path/to/repo
```

The scanner:
1. Detects tech stack (package.json, pyproject.toml, go.mod, Cargo.toml)
2. Maps architecture (entry points, routes, services, models)
3. Counts LOC, files, test coverage
4. Identifies TODO/FIXME/HACK markers
5. Checks git history for churn hotspots (files changed most frequently)
6. Produces `AUDIT-DISCOVERY.md`

### Competitor Scraping
Uses Playwright + Firecrawl to:
1. Accept 3-5 competitor URLs
2. Screenshot key flows (signup, dashboard, core feature)
3. Extract design tokens (colors, typography, spacing)
4. Map UX patterns (navigation, onboarding, empty states)
5. Produce `AUDIT-COMPETITORS.md` with screenshots and findings

### GUI Analysis
For frontend projects:
1. Screenshot all routes at 3 breakpoints (mobile, tablet, desktop)
2. Run Lighthouse audit (performance, accessibility, best practices, SEO)
3. Check component consistency (spacing, colors, typography)
4. Identify interaction dead-ends (buttons that do nothing, missing loading states)
5. Produce `AUDIT-GUI.md`

## Phase 2: STRATEGIC REVIEW

### CEO Review Loop
```
Iteration 1: SCOPE EXPANSION mode
  → "What would make this 10x better for 2x effort?"
  → Dream state mapping
  → Delight opportunities (5+)

Iteration 2: HOLD SCOPE mode
  → Bulletproof the current plan
  → Error/rescue map
  → Security threat model
  → Failure modes registry

Iteration 3: SCOPE REDUCTION mode
  → Minimum viable cut
  → What ships value fastest?
```

### Engineering Review Loop
```
Pass 1: Architecture
  → Dependency graph
  → Data flow diagrams (happy + shadow paths)
  → State machines
  → Scaling characteristics
  → Single points of failure

Pass 2: Robustness
  → Edge case enumeration
  → Error handling audit
  → Deployment safety
  → Rollback plan
  → Observability gaps
```

### Design Review Loop
```
Pass 1: Component Audit
  → Design system consistency
  → Accessibility compliance (WCAG 2.1 AA)
  → Responsive behavior
  → Dark/light mode

Pass 2: Interaction Polish
  → Loading states for every async operation
  → Empty states for every list
  → Error states with recovery actions
  → Animation/transition consistency
  → Touch target sizes (48px minimum)
```

## Phase 3: IMPLEMENTATION PLANNING

All findings from Phase 2 are compiled into a ranked backlog:

```
┌──────────────────────────────────────────────┐
│ FINDING PRIORITY MATRIX                       │
├──────┬──────────┬────────┬───────────────────┤
│ P0   │ Blocking │ < 1hr  │ Fix immediately    │
│ P1   │ High     │ 1-4hr  │ Fix in this batch  │
│ P2   │ Medium   │ 4-8hr  │ Fix if time allows │
│ P3   │ Low      │ > 8hr  │ Add to TODOS.md    │
└──────┴──────────┴────────┴───────────────────┘
```

The plan writer produces:
- `UPGRADE-PLAN.md` — ordered list of fixes with dependencies
- `UPGRADE-TESTS.md` — TDD specs for each fix
- `UPGRADE-MIGRATION.md` — breaking changes and rollback procedures

## Phase 4: EXECUTION

Fixes are executed in batches of 7 parallel agents:

```
Batch 1: P0 fixes (7 agents max)
  → Agent 1: Fix security vulnerability A
  → Agent 2: Fix data integrity bug B
  → Agent 3: Fix crash on edge case C
  → ... (up to 7)
  → GATE: lint + type check + test
  → COMMIT

Batch 2: P1 fixes (7 agents max)
  ... same pattern ...

Batch 3-7: P1 + P2 fixes
  ... up to 7 batches total = 49 fix agents ...
```

Each agent:
1. Reads the finding + plan
2. Deep-researches the fix (checks docs, similar patterns in codebase)
3. Implements the fix
4. Runs local validation
5. Reports result

## Phase 5: VALIDATION

After all batches:
1. Full code review on all changes (`/code-review`)
2. QA test all affected pages (`/gstack qa`)
3. Run full test suite
4. Compare before/after metrics
5. CEO re-review: grade improvement from baseline

### Evaluation Rubric

```
┌─────────────────────────────────────────────────────────────┐
│ PRODUCTUPGRADE EVALUATION RUBRIC                             │
├────────────────────┬──────┬──────┬──────┬──────┬────────────┤
│ Dimension          │  1   │  3   │  5   │  7   │  9-10      │
├────────────────────┼──────┼──────┼──────┼──────┼────────────┤
│ Code Quality       │ Bugs │ Works│ Clean│ Eleg.│ Exemplary  │
│ Security           │ CVEs │ Basic│ OWASP│ Pen  │ Hardened   │
│ Performance        │ Slow │ OK   │ Fast │ Opt. │ Edge-opt.  │
│ UX/UI              │ Ugly │ Func.│ Good │ Pol. │ Delightful │
│ Test Coverage      │ 0%   │ 30%  │ 60%  │ 80%  │ 95%+       │
│ Accessibility      │ None │ Some │ AA   │ AAA  │ AAA+Audit  │
│ Documentation      │ None │ README│ API  │ Full │ Interactive│
│ Error Handling     │ Crash│ Catch│ Log  │ Rec. │ Self-heal  │
│ Observability      │ None │ Logs │ Metr.│ Trac.│ Dashboards │
│ Deployment Safety  │ YOLO │ CI   │ CD   │ Canary│ Blue-green │
├────────────────────┼──────┴──────┴──────┴──────┴────────────┤
│ OVERALL GRADE      │ Average of all dimensions               │
└────────────────────┴────────────────────────────────────────┘
```

## Tools

### Source Code Extraction
```bash
# Pull and analyze any public repo
productupgrade pull https://github.com/owner/repo

# Pull competitor source (if open-source)
productupgrade pull-competitor https://github.com/competitor/app
```

### Competitor Analysis
```bash
# Scrape competitor UX patterns
productupgrade scrape https://competitor.com --flows signup,dashboard,pricing

# Compare UX patterns across competitors
productupgrade compare site1.com site2.com site3.com
```

### GUI Audit
```bash
# Screenshot all routes
productupgrade screenshot http://localhost:3000

# Run Lighthouse on all pages
productupgrade lighthouse http://localhost:3000

# Full GUI analysis (screenshots + Lighthouse + component audit)
productupgrade gui-audit http://localhost:3000
```

## Configuration

Create `.productupgrade.yml` in your repo root:

```yaml
# .productupgrade.yml
target: .
competitors:
  - https://competitor1.com
  - https://competitor2.com
  - https://competitor3.com

focus:
  - ux          # UX/UI improvements
  - security    # Security hardening
  - performance # Performance optimization
  - quality     # Code quality

max_agents: 54       # Maximum concurrent agents
batch_size: 7        # Agents per execution batch
iterations: 7        # Review iterations per phase
auto_fix: true       # Automatically fix P0/P1 findings
commit_per_batch: true

rubric:
  min_grade: 7.0     # Minimum acceptable grade (1-10)
  fail_dimensions:   # Dimensions that must pass
    - security
    - code_quality
```

## Integration with Existing Skills

This skill orchestrates these existing skills:
- `/plan-ceo-review` — CEO strategic review (3 modes)
- `/plan-eng-review` — Engineering deep-dive review
- `/superpowers:write-plan` — Implementation planning
- `/code-review` — Code review on changes
- `/frontend-design` — Frontend component design
- `/backend-patterns` — Backend architecture patterns
- `/gstack qa` — Automated QA testing
- `/browse` — Headless browser for screenshots and testing
- `/ux-browse` — UX screenshot capture
- `/ux-analyze` — Multi-model vision analysis
- `/ux-clone` — Full UX replication pipeline

## Output Files

After a full run, the following files are produced:

```
.productupgrade/
├── AUDIT-DISCOVERY.md      # Codebase scan results
├── AUDIT-COMPETITORS.md    # Competitor UX analysis
├── AUDIT-GUI.md            # GUI screenshot analysis
├── REVIEW-CEO.md           # CEO review findings (3 modes)
├── REVIEW-ENGINEERING.md   # Engineering review findings
├── REVIEW-DESIGN.md        # Design review findings
├── RUBRIC-BEFORE.md        # Pre-upgrade evaluation scores
├── RUBRIC-AFTER.md         # Post-upgrade evaluation scores
├── UPGRADE-PLAN.md         # Ordered fix plan with dependencies
├── UPGRADE-TESTS.md        # TDD specs for each fix
├── UPGRADE-MIGRATION.md    # Breaking changes and rollback
├── UPGRADE-LOG.md          # Execution log (batch results)
└── VALIDATION-REPORT.md    # Final validation results
```
