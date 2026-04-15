---
name: pos-research
description: "Research composite — quick lookup, deep investigation, and exhaustive multi-source research with citation memory. Replaces 5 research skills."
argument-hint: "[quick|deep|exhaustive] [topic]"
---

# pos-research

Research composite — quick lookup, deep investigation, and exhaustive multi-source research with citation memory. Replaces 5 research skills.

**Replaces:** deep-research, max-research, research, research-and-plan, autoresearch

## Actions

| Action | What |
|--------|------|
| `quick [topic]` | Fast lookup — 10 sources, context7 docs, < 5 min |
| `deep [topic]` | 8-phase pipeline — 500 sources, citation verification, 10-20 min |
| `exhaustive [topic]` | Multi-agent swarm — 2000+ sources, cross-validation, 30-60 min |

## Routing

1. Parse action from first argument
2. Load domain memory from `~/.productionos/domains/pos-research/`
3. If first run: auto-detect project context, create profile
4. Dispatch to `sub-skills/{action}.md`
5. Score against `evaluation/rubric.yml`, update memory

## Domain Memory

Stored at `~/.productionos/domains/pos-research/`:
research-log.jsonl (past research with topics and key findings), source-quality.jsonl (trusted vs unreliable sources), learnings.jsonl

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `action` | `quick`, `deep`, `exhaustive` | `quick` | Sub-skill to run |
| `target` | path, URL, or description | required | What to operate on |

## Guardrails

1. Memory is append-only. Never delete history.
2. Every action scored against rubric. No silent completion.
3. Profile is user-controlled. Never change without asking.
4. Evidence required. No fabricated metrics.
5. Learn from history. Compare to past executions.
