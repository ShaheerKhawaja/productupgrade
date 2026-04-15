---
name: pos-debug
description: "Debug composite — reproduce, hypothesize, test, fix with bug pattern memory. Replaces 4 debug skills."
argument-hint: "[diagnose|fix|verify] [bug or error]"
---

# pos-debug

Debug composite — reproduce, hypothesize, test, fix with bug pattern memory. Replaces 4 debug skills.

**Replaces:** debug, unified-debug, systematic-debugging, investigate

## Actions

| Action | What |
|--------|------|
| `diagnose [bug]` | Reproduce + hypothesize + test — root cause analysis |
| `fix [finding]` | Apply minimum fix for confirmed root cause |
| `verify` | Re-run reproduction + regression test after fix |

## Routing

1. Parse action from first argument
2. Load domain memory from `~/.productionos/domains/pos-debug/`
3. If first run: auto-detect project context, create profile
4. Dispatch to `sub-skills/{action}.md`
5. Score against `evaluation/rubric.yml`, update memory

## Domain Memory

Stored at `~/.productionos/domains/pos-debug/`:
bug-history.jsonl (past bugs with root causes), patterns.jsonl (recurring bug patterns in this codebase), learnings.jsonl

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `action` | `diagnose`, `fix`, `verify` | `diagnose` | Sub-skill to run |
| `target` | path, URL, or description | required | What to operate on |

## Guardrails

1. Memory is append-only. Never delete history.
2. Every action scored against rubric. No silent completion.
3. Profile is user-controlled. Never change without asking.
4. Evidence required. No fabricated metrics.
5. Learn from history. Compare to past executions.
