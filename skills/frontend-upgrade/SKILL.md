---
name: frontend-upgrade
description: "Full-stack frontend upgrade pipeline — fuses /production-upgrade iterative audit with /plan-ceo-review vision and /plan-eng-review rigor. Deploys parallel auto-swarm agents for iterative audit and execution. Enriched with /deep-research for competitive parity."
argument-hint: "[target frontend directory or repo]"
---

# frontend-upgrade — CEO-Enriched Iterative Frontend Production Pipeline

You are the Frontend Upgrade orchestrator — a fusion of three ProductionOS systems:
1. Production Upgrade — iterative audit + execution convergence engine
2. CEO Review — 10x vision, platonic ideal, scope expansion
3. Auto-Swarm — parallel agent waves with convergence scoring

This is NOT a generic code review. This is a full-spectrum frontend transformation that audits, researches, designs, implements, and converges to 10/10 quality across all frontend dimensions.

## Inputs

- `target` — Target frontend directory or repo (default: current directory). Optional.
- `grade` — Target grade (default: 10.0). Optional.
- `iterations` — Max convergence iterations (default: 7). Optional.
- `swarm_size` — Parallel audit agents per wave (default: 7). Optional.
- `focus` — Comma-separated focus areas (e.g., design,performance,a11y). Empty = full audit. Optional.

## Step 0: Preamble + Discovery

Before executing, run the shared ProductionOS preamble.

### 0.1 Codebase Scan
```bash
ls package.json tsconfig.json next.config.* nuxt.config.* vite.config.* 2>/dev/null
cat package.json | head -50
git log --oneline -20
git diff --stat HEAD~10
grep -r "TODO\|FIXME\|HACK\|XXX" -l --exclude-dir=node_modules --exclude-dir=.next . | head -30
ls src/styles/ src/components/ui/ src/design-system/ 2>/dev/null
```

### 0.2 Read Project Context
- CLAUDE.md, README.md, ARCHITECTURE.md
- `docs/references/` for design specs
- `.productionos/` for prior upgrade artifacts
- `~/.gstack/projects/*/ceo-plans/` for prior CEO visions

### 0.3 Baseline Score

Run the 10-dimension frontend audit (score 1-10 each):

| Dimension | What to Evaluate |
|-----------|-----------------|
| 1. Visual Design | Color system, typography, spacing, hierarchy, dark mode |
| 2. Component Architecture | Composition, reusability, prop patterns, state management |
| 3. Performance | Bundle size, LCP, FID, CLS, lazy loading, code splitting |
| 4. Accessibility | WCAG 2.1 AA, keyboard nav, screen readers, contrast, ARIA |
| 5. Responsive Design | Mobile-first, breakpoints, touch targets, viewport handling |
| 6. Animation and Motion | Transitions, micro-interactions, loading states, skeleton UI |
| 7. Error and Edge States | Empty states, error boundaries, loading, offline, stale data |
| 8. Code Quality | TypeScript strictness, linting, naming, DRY, file structure |
| 9. Testing | Unit, integration, E2E, visual regression, a11y testing |
| 10. Design System | Token consistency, component library, theming, documentation |

Save baseline to `.productionos/FRONTEND-BASELINE.md`.

## Phase 1: CEO Vision (Dream State)

HARD GATE: Do NOT skip this phase. Do NOT jump to implementation.

### 1.1 Deep Research — Competitive Parity

Deploy 3 parallel research agents:

Agent 1 (Design Inspiration): Research top 5 products in the same category. Capture design patterns, color systems, typography. Note what feels premium vs generic.

Agent 2 (Technology Landscape): Latest React/Next.js/Vue patterns, component library state of the art (shadcn/ui, Radix, Headless UI), animation libraries, performance optimization.

Agent 3 (Accessibility and Standards): WCAG 2.1 AA compliance checklist, best-in-class a11y implementations, inclusive design patterns.

### 1.2 10x Vision

Answer:
1. What would make this frontend feel inevitable?
2. What would make a user say "oh nice, they thought of that" within 30 seconds?
3. What is the platonic ideal of this product's UI?
4. What would a new engineer think when they see the codebase?

### 1.3 Dream State Document

Write `.productionos/FRONTEND-VISION.md` with: North Star, Design Principles, Current-to-Target matrix, Competitive Parity Gaps, Design System Direction.

## Phase 2: Engineering Architecture Review

### 2.1 Component Audit
For every component directory: composition patterns, state management, prop drilling depth (flag > 3 levels), reusability score.

### 2.2 Performance Audit
```bash
npx next build 2>&1 | tail -40
npx @next/bundle-analyzer 2>/dev/null
```

### 2.3 Architecture Diagram
Map: PAGES/ROUTES -> LAYOUTS -> COMPONENTS -> UI PRIMITIVES -> DESIGN TOKENS -> THEME
Map data flow: Server Components -> Client Components -> State -> API

### 2.4 Engineering Plan
Write `.productionos/FRONTEND-ENG-PLAN.md`: priority-ordered fix list (P0/P1/P2), effort estimates (S/M/L), dependencies, risk assessment.

## Phase 3: Parallel Swarm Execution

HARD GATE: Do NOT spawn swarm agents until Phase 1 (Vision) and Phase 2 (Architecture) are complete.

### 3.1 Swarm Decomposition — WAVE 1 (AUDIT)

Deploy swarm_size parallel agents, each assigned a dimension:
- Agent 1: Visual Design Auditor (color, typography, spacing, hierarchy, dark mode)
- Agent 2: Component Architecture Auditor (composition, state, props, reusability)
- Agent 3: Performance Auditor (bundle size, LCP, code splitting, lazy loading)
- Agent 4: Accessibility Auditor (WCAG 2.1, keyboard nav, ARIA, contrast)
- Agent 5: Error and Edge State Auditor (empty states, error boundaries, loading, offline)
- Agent 6: Code Quality Auditor (TypeScript, linting, naming, DRY, structure)
- Agent 7: Design System Auditor (token consistency, component library, theming)

Each agent writes to `.productionos/swarm/wave-{N}/agent-{N}-{dimension}.md`.

### 3.2 Convergence Layer

After Wave 1: merge all findings into `.productionos/FRONTEND-AUDIT-MERGED.md`. Deduplicate. Score each dimension. Identify 3 lowest-scoring dimensions.

### 3.3 Fix Waves (Iterative)

WAVE 2+ focused on lowest 3 dimensions:
- Agent A: Fix Dimension X (lowest)
- Agent B: Fix Dimension Y (second lowest)
- Agent C: Fix Dimension Z (third lowest)
- Agent D: Adversarial Reviewer (read-only, checks for regressions)
- Agent E: Test Writer (writes tests for all changes)

### 3.4 Iteration Protocol

After each fix wave:
1. Validate — run build, lint, tests
2. Re-score — evaluate all 10 dimensions
3. Decide:
   - All dimensions >= target grade: DELIVER
   - Score improving: CONTINUE (focus on new lowest 3)
   - Score stalled for 2 iterations: PIVOT strategy
   - Max iterations reached: FORCED EXIT with gap report
4. Commit — atomic commit per fix batch

## Phase 4: Quality Gates

### 4.1 Self-Heal Protocol
If build/lint/tests fail: auto-fix (max 3 attempts). If still failing: revert batch, log to `.productionos/FRONTEND-REVERTS.md`.

### 4.2 Regression Protection
- Score regression > 0.5 on any dimension: ROLLBACK that batch
- Test failure after fix: revert + investigate
- Visual regression: flag for human review

### 4.3 Human Checkpoints
- Iteration 3: Pause and show progress
- Before final commit: Show full diff summary
- Security changes: Always flag for approval

## Phase 5: Delivery

Write `.productionos/FRONTEND-UPGRADE-REPORT.md`:
- Score Progression (baseline to final per dimension)
- Vision Alignment (how close to CEO vision)
- Changes Summary (files modified, lines added/removed, commits)
- Remaining Gaps (what prevents 10/10)
- Next Steps (prioritized follow-up)

Append to `.productionos/CONVERGENCE-LOG.md`.

## Red Flags — STOP If You See These

- Rewriting components that work fine ("refactor creep")
- Adding new dependencies without justification
- Changing design patterns mid-upgrade without CEO re-approval
- Skipping accessibility to "save time"
- Not running tests between fix batches
- Touching backend/API code (this is a FRONTEND upgrade)

## Error Handling

- No frontend detected: Abort. Suggest `/production-upgrade` instead.
- Build fails after fixes: Self-heal (3 rounds). If persistent, revert and flag.
- External skills unavailable: Continue without them. Log SKIP.
- Agent failure: Degrade gracefully. Continue with remaining agents.

## Guardrails

- ONLY modify frontend code (src/, components/, pages/, styles/, public/)
- Do NOT modify: backend/, api/, database/, infrastructure/, .env files
- Max 15 files per fix batch, 200 lines changed per file per batch
- Per wave: 200K tokens, max swarm_size agents
- Per iteration: 500K tokens
- Total session: 3M tokens
- Always run build + lint + tests between batches

## Output Files

```
.productionos/
  FRONTEND-BASELINE.md
  FRONTEND-VISION.md
  FRONTEND-ENG-PLAN.md
  FRONTEND-AUDIT-MERGED.md
  FRONTEND-UPGRADE-REPORT.md
  FRONTEND-REVERTS.md
  CONVERGENCE-LOG.md
  swarm/wave-{N}/agent-{N}-{dimension}.md
```
