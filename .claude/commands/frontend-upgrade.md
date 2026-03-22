---
name: frontend-upgrade
description: "Full-stack frontend upgrade pipeline — fuses /production-upgrade iterative audit with /plan-ceo-review vision and /plan-eng-review rigor. Deploys parallel auto-swarm agents for iterative audit and execution. Enriched with /deep-research for competitive parity."
arguments:
  - name: target
    description: "Target frontend directory or repo (default: current directory)"
    required: false
  - name: grade
    description: "Target grade (default: 10.0)"
    required: false
    default: "10.0"
  - name: iterations
    description: "Max convergence iterations (default: 7)"
    required: false
    default: "7"
  - name: swarm_size
    description: "Parallel audit agents per wave (default: 7)"
    required: false
    default: "7"
  - name: focus
    description: "Comma-separated focus areas (e.g., design,performance,a11y). Empty = full audit."
    required: false
---

# Frontend Upgrade — CEO-Enriched Iterative Frontend Production Pipeline

You are the Frontend Upgrade orchestrator — a fusion of three ProductionOS systems:
1. **Production Upgrade** — iterative audit + execution convergence engine
2. **CEO Review** — 10x vision, platonic ideal, scope expansion
3. **Auto-Swarm** — parallel agent waves with convergence scoring

This is NOT a generic code review. This is a **full-spectrum frontend transformation** that audits, researches, designs, implements, and converges to 10/10 quality across all frontend dimensions.

## Banner

```
\033[38;5;214m  ╔══════════════════════════════════════════════════════════╗\033[0m
\033[38;5;208m  ║  ███████╗██████╗  ██████╗ ███╗   ██╗████████╗         ║\033[0m
\033[38;5;202m  ║  ██╔════╝██╔══██╗██╔═══██╗████╗  ██║╚══██╔══╝         ║\033[0m
\033[38;5;196m  ║  █████╗  ██████╔╝██║   ██║██╔██╗ ██║   ██║            ║\033[0m
\033[38;5;199m  ║  ██╔══╝  ██╔══██╗██║   ██║██║╚██╗██║   ██║            ║\033[0m
\033[38;5;135m  ║  ██║     ██║  ██║╚██████╔╝██║ ╚████║   ██║            ║\033[0m
\033[38;5;99m   ║  ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝            ║\033[0m
\033[38;5;63m   ║  ██╗   ██╗██████╗  ██████╗ ██████╗  █████╗ ██████╗ ███████╗ ║\033[0m
\033[38;5;33m   ║  ██║   ██║██╔══██╗██╔════╝ ██╔══██╗██╔══██╗██╔══██╗██╔════╝ ║\033[0m
\033[38;5;39m   ║  ██║   ██║██████╔╝██║  ███╗██████╔╝███████║██║  ██║█████╗   ║\033[0m
\033[38;5;44m   ║  ██║   ██║██╔═══╝ ██║   ██║██╔══██╗██╔══██║██║  ██║██╔══╝   ║\033[0m
\033[38;5;49m   ║  ╚██████╔╝██║     ╚██████╔╝██║  ██║██║  ██║██████╔╝███████╗ ║\033[0m
\033[38;5;48m   ║   ╚═════╝ ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝ ║\033[0m
\033[38;5;214m  ╠══════════════════════════════════════════════════════════╣\033[0m
\033[38;5;255m  ║  CEO Vision + Eng Rigor + Parallel Swarm Execution      ║\033[0m
\033[38;5;245m  ║  Target: $ARGUMENTS.grade/10 | Agents: $ARGUMENTS.swarm_size | Iterations: $ARGUMENTS.iterations  ║\033[0m
\033[38;5;214m  ╚══════════════════════════════════════════════════════════╝\033[0m
```

## Input
- Target: $ARGUMENTS.target (default: current working directory)
- Target Grade: $ARGUMENTS.grade (default: 10.0)
- Max Iterations: $ARGUMENTS.iterations (default: 7)
- Swarm Size: $ARGUMENTS.swarm_size (default: 7)
- Focus: $ARGUMENTS.focus (default: all dimensions)

---

## Step 0: Preamble + Discovery

Before executing, run the shared ProductionOS preamble (`templates/PREAMBLE.md`).

### Discovery & Context

### 0.1 Codebase Scan
```bash
# Detect frontend stack
ls package.json tsconfig.json next.config.* nuxt.config.* vite.config.* 2>/dev/null
cat package.json | head -50

# Recent changes
git log --oneline -20
git diff --stat HEAD~10

# Existing issues
grep -r "TODO\|FIXME\|HACK\|XXX" -l --exclude-dir=node_modules --exclude-dir=.next . | head -30

# Design system state
ls src/styles/ src/components/ui/ src/design-system/ 2>/dev/null
```

### 0.2 Read Project Context
- Read CLAUDE.md, README.md, ARCHITECTURE.md
- Read `docs/references/` for design specs
- Check `.productionos/` for prior upgrade artifacts
- Check `~/.gstack/projects/*/ceo-plans/` for prior CEO visions

### 0.3 Baseline Score
Run the 10-dimension frontend audit (score 1-10 each):

| Dimension | What to Evaluate |
|-----------|-----------------|
| 1. Visual Design | Color system, typography, spacing, hierarchy, dark mode |
| 2. Component Architecture | Composition, reusability, prop patterns, state management |
| 3. Performance | Bundle size, LCP, FID, CLS, lazy loading, code splitting |
| 4. Accessibility | WCAG 2.1 AA, keyboard nav, screen readers, contrast, ARIA |
| 5. Responsive Design | Mobile-first, breakpoints, touch targets, viewport handling |
| 6. Animation & Motion | Transitions, micro-interactions, loading states, skeleton UI |
| 7. Error & Edge States | Empty states, error boundaries, loading, offline, stale data |
| 8. Code Quality | TypeScript strictness, linting, naming, DRY, file structure |
| 9. Testing | Unit, integration, E2E, visual regression, a11y testing |
| 10. Design System | Token consistency, component library, theming, documentation |

Save baseline to `.productionos/FRONTEND-BASELINE.md`.

---

## Phase 1: CEO Vision (Dream State)

<HARD-GATE>
Do NOT skip this phase. Do NOT jump to implementation.
The CEO vision sets the north star. Without it, you're polishing without direction.
</HARD-GATE>

### 1.1 Deep Research — Competitive Parity

Deploy 3 parallel research agents:

**Agent 1: Design Inspiration**
- Research top 5 products in the same category (SaaS, dashboard, creative tool, etc.)
- Capture design patterns, color systems, typography choices
- Note what feels "premium" vs "generic"

**Agent 2: Technology Landscape**
- Latest React/Next.js/Vue patterns (App Router, Server Components, etc.)
- Component library state of the art (shadcn/ui, Radix, Headless UI)
- Animation libraries (Framer Motion, GSAP, CSS animations)
- Performance optimization techniques (ISR, streaming, edge)

**Agent 3: Accessibility & Standards**
- WCAG 2.1 AA compliance checklist
- Best-in-class a11y implementations to reference
- Inclusive design patterns

### 1.2 10x Vision
Answer these questions:
1. What would make this frontend **feel inevitable** — like this is the only way it could have been designed?
2. What would make a user say "oh nice, they thought of that" within the first 30 seconds?
3. What's the **platonic ideal** of this product's UI? Describe the user's emotional experience.
4. What would a new engineer joining in 6 months think when they see the codebase?

### 1.3 Dream State Document
Write `.productionos/FRONTEND-VISION.md`:
```markdown
# Frontend Vision — {Product Name}

## North Star
{One paragraph describing the ideal user experience}

## Design Principles
1. {Principle 1}
2. {Principle 2}
3. {Principle 3}

## Current → Target
| Dimension | Current (X/10) | Target | Key Changes |
|-----------|---------------|--------|-------------|

## Competitive Parity Gaps
{What competitors do better and how to surpass them}

## Design System Direction
{Token system, component library, theming approach}
```

---

## Phase 2: Engineering Architecture Review

### 2.1 Component Audit
For every component directory, evaluate:
- Composition patterns (slots vs props vs children)
- State management (local, context, store, server)
- Prop drilling depth (flag anything > 3 levels)
- Reusability score (used in 1 place = smell)

### 2.2 Performance Audit
```bash
# Bundle analysis
npx next build 2>&1 | tail -40  # or vite build
# Check for large imports
npx @next/bundle-analyzer 2>/dev/null

# Lighthouse (if dev server running)
# Use /browse or playwright for automated capture
```

### 2.3 Architecture Diagram
Produce ASCII diagram of:
```
PAGES/ROUTES → LAYOUTS → COMPONENTS → UI PRIMITIVES
                                         ↓
                               DESIGN TOKENS (CSS vars)
                                         ↓
                               THEME (light/dark/custom)
```

Map data flow: Server Components → Client Components → State → API

### 2.4 Engineering Plan
Write `.productionos/FRONTEND-ENG-PLAN.md` with:
- Priority-ordered fix list (P0/P1/P2)
- Estimated effort per fix (S/M/L)
- Dependencies between fixes
- Risk assessment for each change

---

## Phase 3: Parallel Swarm Execution

<HARD-GATE>
Do NOT spawn swarm agents until Phase 1 (Vision) and Phase 2 (Architecture) are complete.
Agents need direction. Vision without execution is fantasy. Execution without vision is chaos.
</HARD-GATE>

### 3.1 Swarm Decomposition

Deploy $ARGUMENTS.swarm_size parallel agents, each assigned a dimension:

```
WAVE 1 — AUDIT (all agents run in parallel, read-only)
├── Agent 1: Visual Design Auditor
│   Focus: Color, typography, spacing, hierarchy, dark mode
│   Tools: Read, Glob, Grep, Bash (screenshots)
│
├── Agent 2: Component Architecture Auditor
│   Focus: Composition, state, props, reusability
│   Tools: Read, Glob, Grep
│
├── Agent 3: Performance Auditor
│   Focus: Bundle size, LCP, code splitting, lazy loading
│   Tools: Read, Bash (build analysis)
│
├── Agent 4: Accessibility Auditor
│   Focus: WCAG 2.1, keyboard nav, ARIA, contrast
│   Tools: Read, Glob, Grep
│
├── Agent 5: Error & Edge State Auditor
│   Focus: Empty states, error boundaries, loading, offline
│   Tools: Read, Glob, Grep
│
├── Agent 6: Code Quality Auditor
│   Focus: TypeScript, linting, naming, DRY, structure
│   Tools: Read, Glob, Grep, Bash (lint)
│
└── Agent 7: Design System Auditor
    Focus: Token consistency, component library, theming
    Tools: Read, Glob, Grep
```

Each agent writes findings to `.productionos/swarm/wave-{N}/agent-{N}-{dimension}.md`.

### 3.2 Convergence Layer
After Wave 1 completes:
1. Merge all findings into `.productionos/FRONTEND-AUDIT-MERGED.md`
2. Deduplicate overlapping issues
3. Score each dimension (1-10)
4. Identify the 3 lowest-scoring dimensions

### 3.3 Fix Waves (Iterative)

```
WAVE 2+ — FIX (focused on lowest 3 dimensions)
├── Agent A: Fix Dimension X (lowest score)
│   Tools: Read, Edit, Write, Bash
│   Constraint: Max 15 files per batch, 200 lines per file
│
├── Agent B: Fix Dimension Y (second lowest)
│   Tools: Read, Edit, Write, Bash
│
├── Agent C: Fix Dimension Z (third lowest)
│   Tools: Read, Edit, Write, Bash
│
├── Agent D: Adversarial Reviewer (read-only)
│   Reviews all changes from A/B/C for regressions
│
└── Agent E: Test Writer
    Writes tests for all changes from A/B/C
```

### 3.4 Iteration Protocol

After each fix wave:
1. **Validate** — run build, lint, tests
2. **Re-score** — evaluate all 10 dimensions again
3. **Decide:**
   - All dimensions >= target grade → **DELIVER**
   - Score improving → **CONTINUE** (focus on new lowest 3)
   - Score stalled for 2 iterations → **PIVOT** strategy
   - Max iterations reached → **FORCED EXIT** with gap report
4. **Commit** — atomic commit per fix batch with conventional message

```
ITERATION LOOP:
  AUDIT (Wave 1) → MERGE → SCORE → FIX (Wave 2) → VALIDATE → RE-SCORE
       ↑                                                        │
       └────────────── CONTINUE if < target ────────────────────┘
```

---

## Phase 4: Quality Gates

### 4.1 Self-Heal Protocol
If build/lint/tests fail after a fix batch:
1. Read error output
2. Attempt auto-fix (max 3 attempts)
3. If still failing: revert batch, log to `.productionos/FRONTEND-REVERTS.md`
4. Continue with next batch

### 4.2 Regression Protection
- Score regression > 0.5 on any dimension → **ROLLBACK** that batch
- Test failure after fix → revert + investigate
- Visual regression detected → flag for human review

### 4.3 Human Checkpoints
- **Iteration 3:** Pause and show progress (score delta, files changed, key decisions)
- **Before final commit:** Show full diff summary
- **Security changes:** Always flag for approval

---

## Phase 5: Delivery

### 5.1 Final Report
Write `.productionos/FRONTEND-UPGRADE-REPORT.md`:
```markdown
# Frontend Upgrade Report

## Score Progression
| Dimension | Baseline | Final | Delta |
|-----------|----------|-------|-------|

## Vision Alignment
{How close are we to the CEO vision from Phase 1?}

## Changes Summary
- Files modified: X
- Lines added: Y
- Lines removed: Z
- Commits: N

## Remaining Gaps
{What prevents each dimension from being 10/10}

## Next Steps
{Prioritized list of follow-up work}
```

### 5.2 Design System Artifacts
If design system changes were made, update:
- Token documentation
- Component storybook/examples
- Theme configuration
- DESIGN.md or equivalent

### 5.3 Convergence Log
Append to `.productionos/CONVERGENCE-LOG.md` with iteration-by-iteration progression.

---

## Red Flags — STOP If You See These

- Rewriting components that work fine ("refactor creep")
- Adding new dependencies without justification
- Changing design patterns mid-upgrade without CEO re-approval
- Skipping accessibility to "save time"
- Not running tests between fix batches
- Silently reverting changes without logging
- Claiming score improvement without evidence (run the build!)
- Touching backend/API code (this is a FRONTEND upgrade)

---

## Guardrails

### Scope Boundaries
- ONLY modify frontend code (src/, components/, pages/, styles/, public/)
- Do NOT modify: backend/, api/, database/, infrastructure/, .env files
- Do NOT add major dependencies without flagging

### Cost Budget
- Per wave: 200K tokens, max $ARGUMENTS.swarm_size agents
- Per iteration: 500K tokens
- Total session: 3M tokens
- If approaching budget: pause and report progress

### File Safety
- Protected: .env*, credentials, production configs
- Max 15 files per fix batch
- Max 200 lines changed per file per batch
- Always run build + lint + tests between batches
