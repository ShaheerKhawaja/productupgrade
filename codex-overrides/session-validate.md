---
name: session-validate
description: "End-of-session self-training — captures session metrics, extracts patterns via metaclaw-learner, updates instincts, and generates optimization hypotheses for the next run."
argument-hint: "[mode or session scope]"
---

# session-validate

## Overview

Use this as the Codex-first end-of-session learning workflow. It should summarize the session, extract useful lessons, and prepare the next run to be better instead of letting the session context evaporate.

Source references:
- `.claude/commands/session-validate.md`
- `agents/metaclaw-learner.md`

## Inputs

- optional `mode`: `quick`, `standard`, or `deep`

## Codex Workflow

1. Read the session artifacts and metrics.
2. Summarize what happened.
3. Extract lessons and patterns worth keeping.
4. In deeper mode, generate optimization hypotheses for future runs.
5. Write a session report and update the learning store.

## Expected Output

- session metrics
- extracted lessons
- optimization hypotheses where applicable
- end-of-session report

## Guardrails

- do not modify source code
- keep the learning artifacts additive and traceable
- if the signal is weak, avoid pretending there were meaningful lessons
