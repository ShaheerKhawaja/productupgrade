---
name: pos-build
description: "Build composite — brainstorm, plan, implement, and test with project memory. Replaces 6 fragmented build skills."
argument-hint: "[brainstorm|plan|implement|test] [feature or task]"
---

# pos-build

Build composite — brainstorm, plan, implement, and test with project memory. Replaces 6 fragmented build skills.

**Replaces:** build, build-productionos, tdd, auto-mode, feature-dev, feature-development

## Actions

| Action | What |
|--------|------|
| `brainstorm [idea]` | Explore idea before building (delegates to /pos plan brainstorm) |
| `plan [feature]` | Create step-by-step implementation plan |
| `implement [task]` | Execute implementation with TDD discipline |
| `test [target]` | Write tests for existing code or verify implementation |

## Routing

1. Parse action from first argument
2. Load domain memory from `~/.productionos/domains/pos-build/`
3. If first run: auto-detect project context, create profile
4. Dispatch to `sub-skills/{action}.md`
5. Score against `evaluation/rubric.yml`, update memory

## Domain Memory

Stored at `~/.productionos/domains/pos-build/`:
profile.yml (tech stack, test framework, conventions), build-log.jsonl (past builds with outcomes), test-patterns.jsonl (what test patterns work for this codebase), learnings.jsonl

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `action` | `brainstorm`, `plan`, `implement`, `test` | `brainstorm` | Sub-skill to run |
| `target` | path, URL, or description | required | What to operate on |

## Guardrails

1. Memory is append-only. Never delete history.
2. Every action scored against rubric. No silent completion.
3. Profile is user-controlled. Never change without asking.
4. Evidence required. No fabricated metrics or claims.
5. Learn from history. Compare current output to past executions.
