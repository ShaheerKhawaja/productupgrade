---
name: productionos-self-eval
description: "Run self-evaluation on recent work — questions quality, necessity, correctness, dependencies, completeness, learning, and honesty. Enabled by default in all flows. Standalone invocation for on-demand evaluation."
argument-hint: "[target, depth, or evaluation scope]"
---

# productionos-self-eval


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

Use this as the Codex-first self-evaluation workflow. It should inspect recent work, score it against the ProductionOS self-eval questions, and if enabled route the result into a repair loop rather than letting low-quality output drift forward.

Source references:
- `.claude/commands/self-eval.md`
- `agents/self-evaluator.md`
- `agents/adversarial-reviewer.md`

## Inputs

- optional `target`
- optional `depth`
- optional `heal`

## Codex Workflow

1. Resolve the evaluation target: last artifact, session, diff, or explicit path.
2. Run the self-eval questions against that target.
3. Classify the result:
   - pass
   - conditional
   - fail
4. If healing is enabled and the result is conditional, route into a focused repair loop.
5. In deep mode, challenge the evaluation with an adversarial second pass.

## Expected Output

- score
- question-by-question weaknesses
- heal recommendation or action
- session summary when the scope is broader than one artifact

## Guardrails

- self-eval itself should remain read-only
- do not blur evaluation and repair in the same step
- low scores should block progress when they indicate real correctness or completeness gaps
