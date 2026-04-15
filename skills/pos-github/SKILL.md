---
name: pos-github
description: "GitHub composite — PR management, issue triage, release automation, and workflow management with project memory. Replaces 8 GitHub skills."
argument-hint: "[pr|issue|release|workflow] [target]"
---

# pos-github

GitHub composite — PR management, issue triage, release automation, and workflow management with project memory. Replaces 8 GitHub skills.

**Replaces:** github-automation, github-code-review, github-multi-repo, github-project-management, github-release-management, github-workflow-automation, agent-github-pr-manager, agent-github-modes

## Actions

| Action | What |
|--------|------|
| `pr [action]` | PR lifecycle — create, review, merge, close |
| `issue [action]` | Issue triage — create, label, assign, close |
| `release [version]` | Release automation — changelog, tag, publish |
| `workflow [action]` | CI/CD workflow management — create, debug, optimize |

## Routing

1. Parse action from first argument
2. Load domain memory from `~/.productionos/domains/pos-github/`
3. If first run: auto-detect project context, create profile
4. Dispatch to `sub-skills/{action}.md`
5. Score against `evaluation/rubric.yml`, update memory

## Domain Memory

Stored at `~/.productionos/domains/pos-github/`:
repo-config.yml (default branch, labels, reviewers), pr-history.jsonl, release-log.jsonl, learnings.jsonl

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `action` | `pr`, `issue`, `release`, `workflow` | `pr` | Sub-skill to run |
| `target` | path, URL, or description | required | What to operate on |

## Guardrails

1. Memory is append-only. Never delete history.
2. Every action scored against rubric. No silent completion.
3. Profile is user-controlled. Never change without asking.
4. Evidence required. No fabricated metrics.
5. Learn from history. Compare to past executions.
