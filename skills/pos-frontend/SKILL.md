---
name: pos-frontend
description: "Frontend composite — UI audit, design system upgrade, and UX analysis with design token memory. Replaces 10 frontend skills."
argument-hint: "[audit|upgrade|design] [target]"
---

# pos-frontend

Frontend composite — UI audit, design system upgrade, and UX analysis with design token memory. Replaces 10 frontend skills.

**Replaces:** frontend-audit, frontend-design, frontend-upgrade, designer-upgrade, ux-genie, ux-replicator, interface-craft, design-consultation, design-review, plan-design-review

## Actions

| Action | What |
|--------|------|
| `audit [url]` | Full UI/UX audit — accessibility, responsive, interactions, performance |
| `upgrade [target]` | Design system upgrade — tokens, components, patterns |
| `design [feature]` | UX design — user stories, journey maps, mockups |

## Routing

1. Parse action from first argument
2. Load domain memory from `~/.productionos/domains/pos-frontend/`
3. If first run: auto-detect project context, create profile
4. Dispatch to `sub-skills/{action}.md`
5. Score against `evaluation/rubric.yml`, update memory

## Domain Memory

Stored at `~/.productionos/domains/pos-frontend/`:
design-system.yml (tokens, colors, typography, spacing), component-inventory.jsonl (tracked components), audit-history.jsonl, learnings.jsonl

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `action` | `audit`, `upgrade`, `design` | `audit` | Sub-skill to run |
| `target` | path, URL, or description | required | What to operate on |

## Guardrails

1. Memory is append-only. Never delete history.
2. Every action scored against rubric. No silent completion.
3. Profile is user-controlled. Never change without asking.
4. Evidence required. No fabricated metrics.
5. Learn from history. Compare to past executions.
