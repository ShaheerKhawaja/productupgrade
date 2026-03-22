---
name: retro
description: "Engineering retrospective — analyzes commit history, work patterns, code quality metrics, self-eval scores, and ProductionOS health with persistent trend tracking."
arguments:
  - name: window
    description: "Time window: 7d (default), 24h, 14d, 30d, compare, compare 14d"
    required: false
    default: "7d"
---

# /retro — Engineering Retrospective

Comprehensive engineering retrospective with ProductionOS-specific metrics. Analyzes commit history, work patterns, code quality, self-eval scores, and agent dispatch patterns.

## Step 0: Preamble
Run `templates/PREAMBLE.md`.

## Step 1: Parse Arguments

Parse `$ARGUMENTS` to determine time window:
- `/retro` → `--since="7 days ago"` (default)
- `/retro 24h` → `--since="24 hours ago"`
- `/retro 14d` → `--since="14 days ago"`
- `/retro 30d` → `--since="30 days ago"`
- `/retro compare` → compare current 7d vs prior 7d
- `/retro compare 14d` → compare current 14d vs prior 14d

If argument doesn't match: show usage and stop.

Detect default branch:
```bash
git remote show origin 2>/dev/null | grep "HEAD branch" | sed 's/.*: //' || echo "main"
```

Detect current user:
```bash
git config user.name
```

## Step 2: Gather Raw Data

Run ALL of these git commands in parallel (they are independent):

```bash
# 1. All commits with stats
git log --since="<window>" --format="%H|%aN|%ae|%ai|%s" --shortstat

# 2. Per-commit numstat for test vs prod LOC breakdown
git log --since="<window>" --format="COMMIT:%H|%aN" --numstat

# 3. Timestamps for session detection (Pacific time)
TZ=America/Los_Angeles git log --since="<window>" --format="%at|%aN|%ai|%s" | sort -n

# 4. File hotspots
git log --since="<window>" --format="" --name-only | grep -v '^$' | sort | uniq -c | sort -rn

# 5. PR numbers from commit messages
git log --since="<window>" --format="%s" | grep -oE '#[0-9]+' | sed 's/^#//' | sort -n | uniq | sed 's/^/#/'

# 6. Author commit counts
git shortlog --since="<window>" -sn --no-merges

# 7. Test file count
find . -name '*.test.*' -o -name '*.spec.*' -o -name '*_test.*' -o -name '*_spec.*' 2>/dev/null | grep -v node_modules | wc -l

# 8. Test files changed in window
git log --since="<window>" --format="" --name-only | grep -E '\.(test|spec)\.' | sort -u | wc -l

# 9. TODOS.md backlog (if available)
cat TODOS.md 2>/dev/null | head -50 || true
```

## Step 3: Gather ProductionOS Data

```bash
# Self-eval scores from this period
ls ~/.productionos/self-eval/ 2>/dev/null | tail -20
cat ~/.productionos/self-eval/SESSION-*.md 2>/dev/null | grep -E 'Score:|Overall:' | tail -20 || true

# Skill usage from analytics
cat ~/.productionos/analytics/skill-usage.jsonl 2>/dev/null | python3 -c "
import json, sys, collections
from datetime import datetime, timedelta
cutoff = (datetime.utcnow() - timedelta(days=<WINDOW_DAYS>)).strftime('%Y-%m-%d')
events = []
for line in sys.stdin:
    try:
        e = json.loads(line)
        if e.get('ts', '') >= cutoff:
            events.append(e)
    except:
        pass
types = collections.Counter(e.get('event', '') for e in events)
cross_repo = sum(1 for e in events if e.get('event') == 'cross_repo_edit')
security = sum(1 for e in events if e.get('event') == 'security_edit')
print(f'Total events: {len(events)}')
print(f'Event breakdown: {dict(types.most_common(10))}')
print(f'Cross-repo edits: {cross_repo}')
print(f'Security-sensitive edits: {security}')
" 2>/dev/null || true

# Mini-retro session history
cat ~/.productionos/retro/sessions.jsonl 2>/dev/null | tail -20 || true

# Instinct confidence levels
ls ~/.productionos/instincts/project/ 2>/dev/null | wc -l || echo "0"
ls ~/.productionos/instincts/global/ 2>/dev/null | wc -l || echo "0"
```

## Step 4: Compute Summary Table

Present in a markdown table:

```
┌─────────────────────────┬─────────────────────────┐
│         Metric          │          Value           │
├─────────────────────────┼─────────────────────────┤
│ Commits to main         │ N                       │
│ Contributors            │ N                       │
│ PRs merged              │ N                       │
│ Total insertions        │ N                       │
│ Total deletions         │ N                       │
│ Net LOC added           │ +N                      │
│ Test LOC (insertions)   │ N                       │
│ Test LOC ratio          │ N%                      │
│ Active days             │ N/N                     │
│ Detected sessions       │ N                       │
│ Deep sessions (50+ min) │ N                       │
│ Avg session length      │ N min                   │
│ Avg LOC/session-hour    │ ~N                      │
│ AI-assisted commits     │ N (N%)                  │
│ Self-eval avg score     │ N.N                     │
│ Self-heal loops         │ N                       │
│ Agent dispatches        │ N                       │
│ Cross-repo edits        │ N                       │
│ Backlog Health          │ N open · N completed    │
│ Test Health             │ N files · N changed     │
└─────────────────────────┴─────────────────────────┘
```

Generate a tweetable one-liner at the top:
```
Week of <date>: N commits, N LOC (+N net), N% tests, N PRs, N sessions, peak: Npm PT | Streak: Nd
```

## Step 5: Commit Time Distribution

Show hourly histogram in Pacific time:
```
Hour (PT)  Commits  ████████████████████████████████
 00:    4      ████
 07:    5      █████
 18:   31      ███████████████████████████████  ← PEAK
```

Identify: peak hours, dead zones, bimodal patterns, late-night clusters.

## Step 6: Session Detection

Use 45-minute gap threshold between consecutive commits.

Classify:
- **Deep sessions** (50+ min): bread and butter
- **Medium sessions** (20-50 min): quick targeted work
- **Micro sessions** (<20 min): fire-and-forget single commits

Calculate: total active coding time, average session length, LOC per hour.

## Step 7: Commit Type Breakdown

Categorize by conventional commit prefix:
```
feat:      67  (34%)  ██████████████████████████████████
fix:       83  (42%)  ██████████████████████████████████████████
refactor:   6  ( 3%)  ███
test:       5  ( 3%)  ███
docs:      30  (15%)  ███████████████
chore:      7  ( 4%)  ████
```

Flag if fix ratio > 50% — signals "ship fast, fix fast" pattern.

## Step 8: Hotspot Analysis

Show top 10 most-changed files. Flag:
- Files changed 5+ times (churn hotspots — interface may need stabilizing)
- Test vs production in hotspot list
- VERSION/CHANGELOG frequency

## Step 9: Focus Score + Ship of the Week

**Focus score:** % of commits touching the most-changed top-level directory.

**Ship of the week:** Highest-LOC commit/PR. Why it matters.

**Runner-up:** Second-highest impact commit/PR.

## Step 10: Test Health

```
┌────────────────────────────────┬─────────────────────┐
│             Metric             │        Value        │
├────────────────────────────────┼─────────────────────┤
│ Total test files               │ N                   │
│ Test files changed this period │ N                   │
│ Test LOC added                 │ N                   │
│ Tests passing                  │ N (if known)        │
└────────────────────────────────┴─────────────────────┘
```

Call out if test ratio < 20% — actionable recommendation.

## Step 11: ProductionOS Health

This section is unique to ProductionOS retro:

- **Self-eval score trend:** Average score this period vs last (if history exists)
- **Self-heal loops triggered:** Count of conditional passes (6.0-7.9 scores)
- **Skill/command usage:** Top 5 most-invoked skills/commands from analytics
- **Agent dispatch patterns:** Most commonly dispatched agents
- **Cross-repo edit count:** How many times the boundary guard fired
- **Instinct library size:** Project-scoped and global instinct counts
- **Security-sensitive edits:** Count with file list

## Step 12: Trends vs Last Retro

Load prior retro from `~/.productionos/retro/`:
```bash
ls -t ~/.productionos/retro/*.json 2>/dev/null | head -1
```

If prior retro exists, show delta table:
```
                    Last        Now         Delta
Commits:            32     →    47          ↑47%
Test ratio:         9%     →    20%         ↑11pp
Self-eval avg:      7.5    →    8.2         ↑0.7
Sessions:           10     →    14          ↑4
Fix ratio:          54%    →    30%         ↓24pp (improving)
```

If no prior retros: "First retro recorded — run again next week to see trends."

## Step 13: Streak Tracking

Count consecutive days with at least 1 commit:
```bash
TZ=America/Los_Angeles git log --format="%ad" --date=format:"%Y-%m-%d" | sort -u
```
Count backward from today.

## Step 14: Narrative Output

### Your Week
2-3 paragraph narrative summarizing the period. Use actual numbers. Reference the tweetable summary.

### Top 3 Wins
Specific, evidence-based wins from the data.

### 3 Things to Improve
Specific, actionable improvements anchored in actual metrics. Each should include:
- The metric/evidence
- The specific action
- Why it matters

### 3 Habits for Next Week
Concrete, repeatable habits. Each should take < 5 minutes per session.

## Step 15: Save Retro JSON

```bash
mkdir -p ~/.productionos/retro
```

Determine sequence number for today:
```bash
today=$(TZ=America/Los_Angeles date +%Y-%m-%d)
existing=$(ls ~/.productionos/retro/${today}-*.json 2>/dev/null | wc -l | tr -d ' ')
next=$((existing + 1))
```

Use the Write tool to save `~/.productionos/retro/${today}-${next}.json` with schema:
```json
{
  "date": "2026-03-21",
  "window": "7d",
  "metrics": {
    "commits": 198,
    "contributors": 1,
    "prs_merged": 7,
    "insertions": 145684,
    "deletions": 17918,
    "net_loc": 127766,
    "test_loc": 13258,
    "test_ratio": 0.091,
    "active_days": 7,
    "sessions": 39,
    "deep_sessions": 14,
    "avg_session_minutes": 50,
    "loc_per_session_hour": 4500,
    "feat_pct": 0.34,
    "fix_pct": 0.42,
    "peak_hour": 18,
    "ai_assisted_commits": 199,
    "self_eval_avg": 8.2,
    "self_heal_loops": 3,
    "agent_dispatches": 45,
    "cross_repo_edits": 2,
    "security_edits": 5
  },
  "test_health": {
    "total_test_files": 25,
    "tests_added_this_period": 21,
    "test_files_changed": 21
  },
  "backlog": {
    "total_open": 13,
    "p0_p1": 0,
    "p2": 0,
    "completed_this_period": 27
  },
  "streak_days": 7,
  "tweetable": "Week of Mar 15: 198 commits, 145.7k LOC, 9% tests, 7 PRs, 39 sessions, peak: 6pm PT | Streak: 7d",
  "top_action_item": "Start the backend. docker compose up is the highest-ROI 15 minutes you can spend."
}
```

**IMPORTANT:** The `top_action_item` field is the single most important improvement from "3 Things to Improve." It is displayed in the session-start banner of future sessions.

## Step 16: Compare Mode (if requested)

If `/retro compare` or `/retro compare 14d`:
1. Run Steps 2-13 for the CURRENT window
2. Run Steps 2-13 for the PRIOR window (same duration, immediately before)
3. Show side-by-side comparison table with deltas and directional arrows

## Self-Eval
Run `templates/SELF-EVAL-PROTOCOL.md` on retro quality:
- Was it honest (not inflated)?
- Were action items specific and anchored in data?
- Did it identify the REAL top priority (not the easy one)?
