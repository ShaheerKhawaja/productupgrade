---
name: context-engineer
description: "Token-optimized context packaging workflow that gathers only the code and docs needed for a task."
argument-hint: "[task, target, or repo path]"
---

# context-engineer

## Overview

Use this as the Codex-first context-packaging workflow. It should gather the smallest high-signal set of files, docs, and artifacts needed to execute a task without wasting context budget.

## Inputs

- target task
- optional repo scope

## Codex Workflow

1. identify the minimum relevant files
2. classify context into essential vs optional
3. package only the high-signal context
4. note what was intentionally left out

## Expected Output

- context package
- included files and artifacts
- excluded low-signal context

## Guardrails

- smaller and sharper beats dumping the whole repo
- do not omit files that change the decision
