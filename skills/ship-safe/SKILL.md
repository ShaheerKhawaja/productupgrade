---
name: ship-safe
description: "Composite: self-eval -> review -> ship. Use when user says 'ship', 'deploy', 'push', 'merge', or 'create PR'. Ensures quality before shipping."
argument-hint: "[branch name]"
---

# ship-safe

Composite skill that enforces quality gates before shipping. Chains self-evaluation, code review, and ship into a gated pipeline where each step must pass before the next begins.

## Chain Overview

```
self-eval -> review -> ship
    |           |        |
    v           v        v
 EVAL.md    REVIEW.md   PR created
    |           |
    v           v
 >= 8.0?    No CRITICAL?
 (gate)      (gate)
```

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `branch` | branch name | current branch | Branch to ship |
| `version_bump` | `patch`, `minor`, `major`, `auto` | `auto` | Version increment |

---

## Step 1: Self-Evaluation

**Invokes:** `/self-eval diff`

**What it does:**
- Evaluates all staged and unstaged changes in the current branch
- Scores across 7 dimensions: quality, necessity, correctness, dependencies, completeness, learning, honesty
- Computes overall score as weighted average

**Produces:** `.productionos/SHIP-EVAL.md`

**Quality Gate:**

| Score | Action |
|-------|--------|
| >= 8.0 | PASS. Proceed to Step 2. |
| 6.0 - 7.9 | SELF-HEAL. Run up to 3 remediation loops targeting lowest-scoring dimensions. Re-evaluate after each loop. If still < 8.0 after 3 loops, BLOCK. |
| < 6.0 | BLOCK. Do not proceed. Report the failing dimensions and specific issues. |

When blocked:
```
STATUS: BLOCKED
REASON: Self-eval score {X}/10 below shipping threshold (8.0)
FAILING DIMENSIONS:
  - {dimension}: {score}/10 -- {specific issue}
RECOMMENDATION: Fix the listed issues, then re-run /ship-safe
```

---

## Step 2: Code Review

**Invokes:** `/review`

**What it does:**
- Full diff review: logic errors, security issues, performance regressions, style violations
- Checks for: missing tests, broken imports, hardcoded values, debug artifacts
- SQL safety check on any database-touching changes
- LLM trust boundary check on any AI-related changes
- Dependency audit on any new packages

**Produces:** `.productionos/SHIP-REVIEW.md`

**Quality Gate:**

| Finding | Action |
|---------|--------|
| CRITICAL issues found | BLOCK. Do not ship. Report CRITICAL issues with file:line evidence. |
| HIGH issues found | WARN. Print warning, proceed with user acknowledgment prompt. |
| MEDIUM/LOW only | PASS. Proceed to Step 3. |
| No issues | PASS. Proceed to Step 3. |

When blocked:
```
STATUS: BLOCKED
REASON: Code review found {N} CRITICAL issues
CRITICAL ISSUES:
  1. {file}:{line} -- {description}
RECOMMENDATION: Fix CRITICAL issues before shipping
```

---

## Step 3: Ship

**Invokes:** `/ship`

**What it does:**
- Resolves base branch (main/master/develop)
- Syncs with base (fetch + merge, stop on conflicts)
- Runs validation gate (tests, type checks, lint)
- Updates release metadata (VERSION, CHANGELOG)
- Commits, pushes, creates or updates PR

**Produces:** PR URL + `.productionos/SHIP-RESULT.md`

**Pre-ship checklist (automated):**
- [ ] Self-eval score >= 8.0
- [ ] No CRITICAL review findings
- [ ] Tests pass
- [ ] Type checks pass
- [ ] No merge conflicts with base
- [ ] VERSION bumped
- [ ] CHANGELOG updated

---

## Output Format

Final composite report written to `.productionos/SHIP-SAFE.md`:

```markdown
# Ship-Safe Report

## Result: SHIPPED | BLOCKED
- **Self-Eval Score:** X/10 (PASS/FAIL)
- **Review:** X issues (Y critical, Z high)
- **Ship Status:** PR #{number} created | BLOCKED at step {N}

## Gate Results
| Gate | Score/Result | Status |
|------|-------------|--------|
| Self-Eval | X/10 | PASS/FAIL |
| Code Review | N issues | PASS/WARN/FAIL |
| Tests | X passed | PASS/FAIL |
| Ship | PR #{N} | DONE/BLOCKED |

## Issues (if any)
{list of issues that blocked or warned}

## PR Details (if shipped)
- **URL:** {pr_url}
- **Branch:** {branch} -> {base}
- **Version:** {old} -> {new}

Ship completed: {timestamp}
```

---

## When to Use

- "Ship this" -- runs full gated pipeline
- "Create a PR" -- runs full gated pipeline
- "Push to main" -- runs full gated pipeline
- "Deploy this branch" -- runs full gated pipeline
- "Merge my changes" -- runs full gated pipeline

## When NOT to Use

- Just reviewing without shipping -- use `/review` directly
- Just evaluating quality -- use `/self-eval` directly
- Deploying to a specific environment -- use infrastructure-specific tools
