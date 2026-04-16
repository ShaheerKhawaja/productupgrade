---
name: pos-plan
description: "Planning composite — CEO vision review, engineering architecture review, design review, and brainstorming with decision memory. Replaces 8 fragmented planning skills."
argument-hint: "[ceo|eng|design|brainstorm] [target plan or feature]"
---

# pos-plan

Planning composite — CEO vision review, engineering architecture review, design review, and brainstorming with decision memory. Replaces 8 fragmented planning skills.

**Replaces:** plan-ceo-review, plan-eng-review, plan-design-review, plan-my-day, brainstorming, writing-plans, omni-plan, omni-plan-nth

## Actions

| Action | What |
|--------|------|
| `ceo [target]` | CEO/founder strategic review — 10-star framework, scope decisions |
| `eng [target]` | Engineering architecture review — data flow, error paths, test matrix |
| `design [target]` | Design review — UI/UX, design system, accessibility |
| `brainstorm [idea]` | Idea exploration — understand, propose, design, approve |

## Routing

1. Parse action from first argument
2. Load domain memory from `~/.productionos/domains/pos-plan/`
3. If first run: auto-detect project context, create profile
4. Dispatch to `sub-skills/{action}.md`
5. Score against `evaluation/rubric.yml`, update memory

## Domain Memory

Stored at `~/.productionos/domains/pos-plan/`:
profile.yml (project vision, constraints, team size), decision-log.jsonl (past scope decisions with rationale), architecture-snapshots.jsonl (system diagrams over time), learnings.jsonl

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `action` | `ceo`, `eng`, `design`, `brainstorm` | `ceo` | Sub-skill to run |
| `target` | path, URL, or description | required | What to operate on |

## Guardrails

1. Memory is append-only. Never delete history.
2. Every action scored against rubric. No silent completion.
3. Profile is user-controlled. Never change without asking.
4. Evidence required. No fabricated metrics or claims.
5. Learn from history. Compare current output to past executions.
