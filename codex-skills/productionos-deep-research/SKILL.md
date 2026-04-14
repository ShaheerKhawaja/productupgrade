---
name: productionos-deep-research
description: "8-phase autonomous research pipeline with multi-source discovery, 4-layer citation verification, hypothesis generation, and PIVOT/REFINE/PROCEED decision loops. Confidence-gated — loops until 95%+ confidence."
argument-hint: "[topic, depth, or source mix]"
---

# productionos-deep-research


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

Use this as the Codex-first research workflow for ProductionOS. It should take a topic, break it into concrete research questions, gather and verify sources, synthesize competing hypotheses, and only deliver claims that are evidence-backed.

Source references:
- `.claude/commands/deep-research.md`
- `scripts/arxiv-scraper.sh`

## Inputs

- `topic`: required research question or area
- `depth`: `quick`, `standard`, `deep`, or `exhaustive`
- `sources`: `arxiv`, `web`, `docs`, or `all`

## Codex Workflow

1. Scope the topic into 3-5 specific research questions.
2. Discover sources appropriate to the selected depth.
3. Verify sources before trusting them.
   - title and author sanity
   - direct relevance
   - source quality
4. Synthesize the evidence.
   - consensus
   - contradictions
   - missing information
5. Generate competing hypotheses and select the best-supported one.
6. If confidence is still low, refine the search instead of bluffing.

## Expected Output

- research questions
- verified source set
- synthesis with contradictions called out
- selected hypothesis with confidence
- explicit unknowns

## Guardrails

- do not present weakly supported claims as facts
- prefer primary sources when available
- if confidence stays low, say so and stop rather than pretending certainty
