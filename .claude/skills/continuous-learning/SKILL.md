---
name: continuous-learning
description: "ProductionOS instinct-based learning system. Observes sessions via hooks, extracts patterns, creates atomic instincts with confidence scoring, and auto-promotes high-confidence patterns across projects."
metadata:
  filePattern:
    - "**/.productionos/instincts/**"
    - "**/.productionos/analytics/**"
  bashPattern:
    - "pos-instincts"
    - "pos-learn"
  priority: 70
---

# ProductionOS Continuous Learning

## Architecture

```
SESSION ACTIVITY (via PostToolUse hooks)
       ↓
  Observation Log (~/.productionos/analytics/skill-usage.jsonl)
       ↓
  Pattern Extractor (runs at session end via Stop hook)
       ↓
  Instinct Creation (~/.productionos/instincts/project/{hash}/)
       ↓
  Confidence Scoring (0.0 - 1.0, based on repetition + outcome)
       ↓
  Auto-Promotion (confidence > 0.8 → global instinct)
       ↓
  Global Instincts (~/.productionos/instincts/global/)
```

## Instinct Format

Each instinct is a single markdown file:

```markdown
---
name: {pattern-name}
confidence: 0.65
observations: 3
first_seen: 2026-03-20
last_seen: 2026-03-20
scope: project
promoted_from: null
---

## Pattern
{What was observed}

## Evidence
- Session {date}: {observation 1}
- Session {date}: {observation 2}

## Application
{When to apply this pattern in future sessions}
```

## Confidence Scoring

| Confidence | Meaning | Action |
|-----------|---------|--------|
| 0.0 - 0.3 | Weak signal | Store but don't act |
| 0.3 - 0.6 | Emerging pattern | Suggest when relevant |
| 0.6 - 0.8 | Strong pattern | Apply proactively |
| 0.8 - 1.0 | Proven pattern | Auto-promote to global |

## Observation Types

1. **Code Pattern** — Repeated code structure across sessions
2. **Tool Usage** — Preferred tool sequences (e.g., always Grep before Edit)
3. **Error Recovery** — How errors were resolved (reusable fix patterns)
4. **Architecture Decision** — Repeated structural choices
5. **Review Finding** — Common issues found in code reviews

## Stop Hook: Pattern Extraction

At session end, the Stop hook:
1. Reads `~/.productionos/analytics/skill-usage.jsonl` for this session
2. Groups events by type (edit, bash, security_edit, etc.)
3. Identifies patterns (repeated file types, common commands, recurring errors)
4. Creates or updates instinct files
5. Bumps confidence on existing instincts that match

## Commands

- `pos-instincts list` — Show all instincts with confidence
- `pos-instincts promote {name}` — Manually promote to global
- `pos-instincts demote {name}` — Reduce confidence
- `pos-instincts forget {name}` — Delete an instinct

## Red Flags — STOP If You See These

- Creating instincts from single observations (need 2+ sessions)
- Promoting instincts below 0.6 confidence
- Instincts that contradict CLAUDE.md or project conventions
- Learning patterns that are project-specific as global instincts
- Extracting patterns from error sessions (failed attempts aren't patterns)
