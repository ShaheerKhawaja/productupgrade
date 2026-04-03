---
name: productionos-plan-ceo-review
description: "CEO/founder-mode plan review — rethink the problem, find the 10-star product, challenge premises. Four modes: SCOPE EXPANSION, SELECTIVE EXPANSION, HOLD SCOPE, SCOPE REDUCTION."
argument-hint: "[plan, feature, or repo path]"
---

# productionos-plan-ceo-review


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

Use this as the Codex-first strategic plan review. It should question whether the team is solving the right problem, whether the proposed scope is ambitious enough, and what the smallest or best version of the work should be.

Source references:
- `.claude/commands/plan-ceo-review.md`
- `templates/SELF-EVAL-PROTOCOL.md`

## Inputs

- target plan or feature
- `mode`: `expansion`, `selective`, `hold`, or `reduction`
- optional product context and user constraints

## Codex Workflow

1. Restate the problem and user outcome.
2. Select the review posture.
   - `expansion`: push toward the 10-star version
   - `selective`: show high-value optional expansions
   - `hold`: bulletproof the current scope
   - `reduction`: cut to the minimum viable version
3. Review the plan across:
   - user value
   - ambition and differentiation
   - risks and failure modes
   - simplicity versus overbuild
4. Present concrete recommendations and tradeoffs.
5. End with a verdict on what would make the plan stronger.

## Expected Output

- direct restatement of the product problem
- 10-star framing or reduction path
- highest-risk gaps
- recommended scope decisions

## Guardrails

- Do not silently change scope; present scope changes explicitly.
- Tie recommendations back to user value, not just architecture taste.
- Prefer complete solutions over shortcuts when the delta is small in AI time.
