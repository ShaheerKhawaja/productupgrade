---
name: retro
description: "Engineering retrospective — analyzes commit history, work patterns, code quality metrics, and self-eval scores with persistent trend tracking."
arguments:
  - name: period
    description: "Period: week | sprint | month (default: week)"
    required: false
    default: "week"
---

# /retro — Engineering Retrospective

Analyze what happened, what went well, what didn't, and what to change.

## Step 0: Preamble
Run `templates/PREAMBLE.md`.

## Step 1: Gather Data
```bash
# Commit history for period
git log --oneline --since="1 week ago" --stat
# Files most changed
git log --since="1 week ago" --name-only --pretty=format: | sort | uniq -c | sort -rn | head -20
# Lines added/removed
git diff --stat $(git log --since="1 week ago" --reverse --format=%H | head -1)..HEAD
```

## Step 2: Self-Eval History
```bash
# Read session self-eval scores
ls ~/.productionos/self-eval/ 2>/dev/null | tail -20
cat ~/.productionos/self-eval/SESSION-*.md 2>/dev/null | head -50
```

## Step 3: Analysis

### What Went Well
- High self-eval scores (>= 8.0)
- Features completed
- Tests added
- Bugs fixed

### What Didn't Go Well
- Low self-eval scores (< 8.0)
- Self-heal loops triggered
- Regressions
- Scope creep detected

### Metrics
| Metric | This Period | Trend |
|--------|------------|-------|
| Commits | N | ↑↓→ |
| Files changed | N | ↑↓→ |
| Lines added | N | ↑↓→ |
| Tests added | N | ↑↓→ |
| Avg self-eval score | X.X | ↑↓→ |
| Self-heal loops | N | ↑↓→ |

### Action Items
- What to start doing
- What to stop doing
- What to continue doing

## Output
Write to `.productionos/RETRO-{date}.md`.

## Self-Eval
Run `templates/SELF-EVAL-PROTOCOL.md` on retro quality. Was it honest? Were action items specific?
