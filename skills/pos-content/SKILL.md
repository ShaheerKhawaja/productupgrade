---
name: pos-content
description: "Content composite — strategy, writing, audit, and refresh with brand voice memory. Replaces 10 fragmented content skills."
argument-hint: "[strategy|write|audit|refresh] [topic or URL]"
---

# pos-content

Content composite — strategy, writing, audit, and refresh with brand voice memory. Replaces 10 fragmented content skills.

**Replaces:** content-gap-analysis, content-ops, content-quality-auditor, content-refresher, content-research-writer, content-strategy, unified-content, copywriting, copy-editing, social-content

## Actions

| Action | What |
|--------|------|
| `strategy` | Content strategy with audience analysis and calendar planning |
| `write [topic]` | Create content (article, social post, email, landing page) |
| `audit [url]` | Audit existing content for quality, freshness, and SEO alignment |
| `refresh [url]` | Update stale content with current data and improved structure |

## Routing

1. Parse action from first argument
2. Load domain memory from `~/.productionos/domains/pos-content/`
3. If first run: auto-detect project context, create profile
4. Dispatch to `sub-skills/{action}.md`
5. Score against `evaluation/rubric.yml`, update memory

## Domain Memory

Stored at `~/.productionos/domains/pos-content/`:
profile.yml (brand voice, audience, tone, platforms), content-calendar.jsonl (published + planned content), performance.jsonl (what content performed well), learnings.jsonl

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `action` | `strategy`, `write`, `audit`, `refresh` | `strategy` | Sub-skill to run |
| `target` | path, URL, or description | required | What to operate on |

## Guardrails

1. Memory is append-only. Never delete history.
2. Every action scored against rubric. No silent completion.
3. Profile is user-controlled. Never change without asking.
4. Evidence required. No fabricated metrics or claims.
5. Learn from history. Compare current output to past executions.
