---
name: pos-qa
description: "QA composite — browser testing, health scoring, and evaluation with test result memory. Replaces 5 QA skills."
argument-hint: "[test|audit|browse] [url or path]"
---

# pos-qa

QA composite — browser testing, health scoring, and evaluation with test result memory. Replaces 5 QA skills.

**Replaces:** qa, qa-only, browse, agentic-eval, self-eval

## Actions

| Action | What |
|--------|------|
| `test [url]` | Full QA — browser testing, health score 0-100, bug detection |
| `audit [path]` | Code quality audit without browser (static analysis + tests) |
| `browse [url]` | Headless browser interaction — navigate, screenshot, inspect |

## Routing

1. Parse action from first argument
2. Load domain memory from `~/.productionos/domains/pos-qa/`
3. If first run: auto-detect project context, create profile
4. Dispatch to `sub-skills/{action}.md`
5. Score against `evaluation/rubric.yml`, update memory

## Domain Memory

Stored at `~/.productionos/domains/pos-qa/`:
test-history.jsonl (health scores over time), known-bugs.jsonl (tracked issues with status), baseline-screenshots/ (visual regression reference), learnings.jsonl

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `action` | `test`, `audit`, `browse` | `test` | Sub-skill to run |
| `target` | path, URL, or description | required | What to operate on |

## Guardrails

1. Memory is append-only. Never delete history.
2. Every action scored against rubric. No silent completion.
3. Profile is user-controlled. Never change without asking.
4. Evidence required. No fabricated metrics.
5. Learn from history. Compare to past executions.
