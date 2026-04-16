---
name: pos-ads
description: "Ads composite — audit campaigns, create ad copy, optimize bids, and report performance with persistent campaign memory. Replaces 20 fragmented ads skills."
argument-hint: "[audit|create|optimize|report] [platform or campaign]"
---

# pos-ads

Ads composite — audit campaigns, create ad copy, optimize bids, and report performance with persistent campaign memory. Replaces 20 fragmented ads skills.

**Replaces:** ads-apple, ads-audit, ads-budget, ads-competitor, ads-create, ads-creative, ads-dna, ads-generate, ads-google, ads-landing, ads-linkedin, ads-meta, ads-microsoft, ads-photoshoot, ads-plan, ads-tiktok, ads-youtube, unified-ads, paid-ads, competitive-ads-extractor

## Actions

| Action | What |
|--------|------|
| `audit [platform]` | Audit campaign performance across platforms |
| `create [type]` | Generate ad copy, creatives, and landing page concepts |
| `optimize` | Budget reallocation and bid optimization recommendations |
| `report` | Cross-platform performance report with ROI analysis |

## Routing

1. Parse action from first argument
2. Load domain memory from `~/.productionos/domains/pos-ads/`
3. If first run: auto-detect project context, create profile
4. Dispatch to `sub-skills/{action}.md`
5. Score against `evaluation/rubric.yml`, update memory

## Domain Memory

Stored at `~/.productionos/domains/pos-ads/`:
profile.yml (platforms, budgets, audiences, goals), campaign-history.jsonl (past campaigns with metrics), creative-bank.jsonl (tested ad copy and results), learnings.jsonl

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `action` | `audit`, `create`, `optimize`, `report` | `audit` | Sub-skill to run |
| `target` | path, URL, or description | required | What to operate on |

## Guardrails

1. Memory is append-only. Never delete history.
2. Every action scored against rubric. No silent completion.
3. Profile is user-controlled. Never change without asking.
4. Evidence required. No fabricated metrics or claims.
5. Learn from history. Compare current output to past executions.
