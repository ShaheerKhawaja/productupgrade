---
name: pos-ship
description: "Ship composite — PR creation, deployment, canary monitoring, and rollback with release memory. Replaces 4 ship skills."
argument-hint: "[pr|deploy|canary|rollback] [branch or target]"
---

# pos-ship

Ship composite — PR creation, deployment, canary monitoring, and rollback with release memory. Replaces 4 ship skills.

**Replaces:** ship, ship-safe, land-and-deploy, setup-deploy

## Actions

| Action | What |
|--------|------|
| `pr [branch]` | Self-eval -> review -> create PR with test plan |
| `deploy [target]` | Push to production with pre-flight checks |
| `canary` | Monitor deployment for errors, performance regression |
| `rollback` | Revert last deployment with verification |

## Routing

1. Parse action from first argument
2. Load domain memory from `~/.productionos/domains/pos-ship/`
3. If first run: auto-detect project context, create profile
4. Dispatch to `sub-skills/{action}.md`
5. Score against `evaluation/rubric.yml`, update memory

## Domain Memory

Stored at `~/.productionos/domains/pos-ship/`:
release-log.jsonl (past releases with outcomes), deploy-config.yml (targets, environments), incident-log.jsonl (past deployment issues), learnings.jsonl

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `action` | `pr`, `deploy`, `canary`, `rollback` | `pr` | Sub-skill to run |
| `target` | path, URL, or description | required | What to operate on |

## Guardrails

1. Memory is append-only. Never delete history.
2. Every action scored against rubric. No silent completion.
3. Profile is user-controlled. Never change without asking.
4. Evidence required. No fabricated metrics.
5. Learn from history. Compare to past executions.
