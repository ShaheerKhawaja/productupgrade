---
name: productionos-tdd
description: "Test-driven development workflow that writes failing tests first, implements minimally, and refactors safely."
argument-hint: "[target feature or file]"
---

# productionos-tdd


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
## Overview

Use this as the Codex-first TDD workflow. It should enforce red-green-refactor and keep test-first behavior real instead of decorative.

## Inputs

- target feature or file
- optional coverage target

## Codex Workflow

Source references:
- `.claude/commands/tdd.md`

1. write the failing test first
2. confirm the failure
3. implement the minimum change to pass
4. refactor safely
5. re-run broader validation

## Expected Output

- failing test
- minimal fix
- updated test coverage

## Guardrails

- do not write the implementation first
- keep the change minimal until the failing behavior is covered
