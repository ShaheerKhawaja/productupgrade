---
name: productionos-debug
description: "Systematic debugging with hypothesis tracking — reproduce, hypothesize, test, narrow, fix. Never guess-and-check."
argument-hint: "[bug, failing behavior, or repro path]"
---

# productionos-debug


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

Use this as the Codex-first debugging workflow. It should reproduce the problem, gather evidence, rank hypotheses, test them one by one, and only fix the bug once the root cause is actually identified.

Source references:
- `.claude/commands/debug.md`
- `agents/self-healer.md`
- `agents/test-architect.md`

## Inputs

- required bug description or failing behavior
- optional reproduction command or failing test
- optional `max_hypotheses`

## Codex Workflow

1. Reproduce the issue first.
   - if you cannot reproduce it, say so and stop
2. Gather evidence.
   - recent changes
   - logs
   - failing commands or tests
3. Generate ranked, testable hypotheses.
4. Test the hypotheses in order.
5. Once the root cause is confirmed:
   - make the smallest effective fix
   - re-run the original reproduction
   - add or update a regression test

## Expected Output

- confirmed reproduction
- ranked hypotheses with evidence
- identified root cause
- targeted fix
- regression-proof verification

## Guardrails

- never guess-and-check blindly
- never claim a fix before reproducing and re-testing
- do not confuse symptom suppression with root-cause repair
