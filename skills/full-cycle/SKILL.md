---
name: full-cycle
description: "Composite: audit -> upgrade -> research -> plan -> swarm fix -> eval -> ship. The complete ProductionOS pipeline. Use when user says 'do everything', 'full cycle', 'end to end', or 'make it production-ready'."
argument-hint: "[target scope]"
---

# full-cycle

The nuclear option. Chains 7 skills into a complete audit-research-plan-fix-verify-ship pipeline. This is the most comprehensive ProductionOS composite skill -- it touches every layer of the codebase and produces a fully evaluated, reviewed, and shipped result.

**Cost:** High. Expect 30-90 minutes of agent time depending on codebase size.
**When to use:** Major milestones, pre-launch readiness, end-of-sprint quality gates, or when the answer to "what needs work?" is "everything."
**When NOT to use:** Quick fixes, single-file changes, debugging a specific bug. Use targeted skills instead.

## Chain Overview

```
security-audit -> production-upgrade -> deep-research -> plan-ceo-review
      |                  |                   |                 |
      v                  v                   v                 v
  AUDIT.md           UPGRADE.md         RESEARCH.md       CEO-REVIEW.md
      |                  |                   |                 |
      +------ Phase 1: Assess -----------+  +-- Phase 2: Plan -+
                                                               |
                                                               v
auto-swarm ---------> self-eval ---------> ship
      |                  |                   |
      v                  v                   v
  SWARM-RESULT.md    EVAL.md             PR created
      |                  |
      +-- Phase 3: Fix --+--- Phase 4: Ship ---+
```

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `target` | path, scope | `.` | What to process |
| `depth` | `medium`, `deep`, `ultra` | `deep` | Swarm depth for fix phase |

---

## Phase 1: Assess (Steps 1-2)

### Step 1: Security Audit

**Invokes:** `/security-audit` with framework=all, scope=full

Runs the full 7-domain security scan. Produces `.productionos/AUDIT-SECURITY.md`.

**Escalation:** If CRITICAL findings > 0, the full-cycle continues but flags them as MUST-FIX items for the swarm phase. Unlike audit-and-fix, full-cycle does not halt on CRITICALs -- it feeds them into the fix pipeline.

### Step 2: Production Upgrade

**Invokes:** `/production-upgrade`

Full codebase quality audit beyond security: code style, error handling, test coverage, dependency health, API design, performance, maintainability. Produces `.productionos/UPGRADE.md`.

**Phase 1 output:** Combined issue list from security audit + production upgrade, deduplicated and priority-ranked.

---

## Phase 2: Plan (Steps 3-4)

### Step 3: Deep Research

**Invokes:** `/deep-research`

Researches solutions for the top issues found in Phase 1. Cross-references `~/repos/` for existing implementations, checks library docs via context7, identifies best-practice patterns. Produces `.productionos/RESEARCH.md`.

### Step 4: CEO Review

**Invokes:** `/plan-ceo-review`

Applies founder lens to the research findings. Identifies the 10-star fix strategy, scope expansions worth taking, and priority ordering. Produces `.productionos/CEO-REVIEW.md`.

**Phase 2 output:** Prioritized fix plan with CEO-approved scope, ready for automated execution.

---

## Phase 3: Fix (Step 5)

### Step 5: Auto-Swarm

**Invokes:** `/auto-swarm --mode=fix`

Parallel agent swarm that executes the fix plan from Phase 2. Each agent targets one issue or improvement. Swarm operates with quality gates -- each fix must pass its own self-check before merging.

**Swarm configuration:**
- Depth: `{depth}` parameter (default: deep)
- Mode: fix (apply changes, not just audit)
- Quality gate: each fix self-evaluated, >= 8.0 required
- Rollback: any fix that causes test regression is reverted

**Produces:** `.productionos/SWARM-RESULT.md`

**Estimated effort by depth:**
| Depth | Agents | Time | Coverage |
|-------|--------|------|----------|
| medium | 5-15 | 15-30 min | Top priority issues |
| deep | 15-50 | 30-60 min | All HIGH+ issues |
| ultra | 50-100+ | 60-90 min | All issues including LOW |

---

## Phase 4: Ship (Steps 6-7)

### Step 6: Self-Evaluation

**Invokes:** `/self-eval session`

Evaluates the entire session: all changes made across all phases. Scores quality, necessity, correctness, completeness. This is the final quality gate before shipping.

**Quality gate:** Score >= 8.0 required. If < 8.0 after 3 self-heal loops, BLOCK shipping and report remaining issues.

### Step 7: Ship

**Invokes:** `/ship`

Ships the result: syncs with base branch, runs tests, bumps version, updates changelog, commits, pushes, creates PR.

**Pre-ship gate:** Only runs if Step 6 scored >= 8.0 AND tests pass.

---

## Abort Conditions

The full-cycle aborts (does not ship) when:

| Condition | Aborts At | Recovery |
|-----------|-----------|----------|
| Self-eval < 6.0 after 3 loops | Step 6 | Fix manually, re-run |
| Tests fail after swarm fixes | Step 5 | Rollback, investigate |
| Merge conflicts with base | Step 7 | Resolve conflicts, re-run Step 7 |
| > 3 CRITICAL unfixed after swarm | Step 5 | Manual CRITICAL fix required |

---

## Output Format

Final composite report written to `.productionos/FULL-CYCLE.md`:

```markdown
# Full Cycle Report

## Summary
- **Security Posture:** X/10 (before) -> Y/10 (after)
- **Code Quality:** X/10 (before) -> Y/10 (after)
- **Issues Found:** N total
- **Issues Fixed:** M fixed, K remaining
- **Self-Eval Score:** X/10
- **Ship Status:** SHIPPED (PR #{N}) | BLOCKED

## Phase Results
| Phase | Step | Status | Output |
|-------|------|--------|--------|
| Assess | Security Audit | DONE | N findings |
| Assess | Production Upgrade | DONE | M opportunities |
| Plan | Deep Research | DONE | K solutions found |
| Plan | CEO Review | DONE | Scope approved |
| Fix | Auto-Swarm | DONE | J fixes applied |
| Ship | Self-Eval | PASS/FAIL | X/10 |
| Ship | Ship | DONE/BLOCKED | PR #{N} |

## Before/After Comparison
| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| Security score | X | Y | +Z |
| Test coverage | X% | Y% | +Z% |
| Open issues | N | M | -K |

## Remaining Items
{issues not addressed in this cycle}

Full cycle completed: {timestamp} | Duration: {minutes}m
```

---

## Cost Estimates

| Codebase Size | Estimated Duration | Agent-Minutes | Recommended Depth |
|---------------|-------------------|---------------|-------------------|
| Small (< 10K LOC) | 15-25 min | ~50 | deep |
| Medium (10-50K LOC) | 30-50 min | ~150 | deep |
| Large (50-200K LOC) | 45-75 min | ~300 | medium |
| Huge (> 200K LOC) | 60-90 min | ~500 | medium |

## When to Use

- "Make this production-ready" -- full 7-step pipeline
- "Do everything" -- full 7-step pipeline
- "End-to-end quality pass" -- full 7-step pipeline
- "Pre-launch checklist" -- full 7-step pipeline

## When NOT to Use

- Fixing one bug -- use `/debug`
- Shipping one feature -- use `/ship-safe`
- Just auditing -- use `/audit-and-fix`
- Just planning -- use `/research-and-plan`
- Quick marketing check -- use `/growth-audit`
