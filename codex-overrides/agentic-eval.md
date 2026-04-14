---
name: agentic-eval
description: "Niche-agnostic agentic evaluator using CLEAR v2.0 framework — 6-domain assessment, 8 analysis dimensions, 6-tier source prioritization, evidence strength ratings, and decision trees. Evaluates any plan, codebase, or research output."
argument-hint: "[target or evaluation domain]"
---

# agentic-eval

## Overview

Use this as the Codex-first CLEAR-style evaluation workflow. It should score plans, codebases, or research outputs against the ProductionOS evaluation structure and produce an evidence-backed assessment rather than a vibes-based grade.

Source references:
- `.claude/commands/agentic-eval.md`
- `.productionos/EVAL-CLEAR.md`

## Inputs

- optional evaluation `target`
- optional evaluation `domain`

## Codex Workflow

1. Resolve the evaluation target.
2. Apply the CLEAR lens across the relevant domains.
3. Score using evidence, not broad impressions.
4. Distinguish strong evidence from emerging or missing evidence.
5. End with prioritized recommendations, not just a numeric score.

## Expected Output

- overall score
- per-domain scores
- critical gaps
- prioritized recommendations
- evidence-strength map

## Guardrails

- do not score without evidence
- do not pretend domain confidence is high when the source material is thin
- a high score must still state what prevents a 10 when relevant
