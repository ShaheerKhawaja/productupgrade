---
name: auto-optimize
description: "Self-improving agent optimization — generates challenger variants, benchmarks them, promotes winners, and logs learnings."
argument-hint: "[target workflow, benchmark, or hypothesis]"
---

# auto-optimize

## Overview

Use this as the Codex-first optimization loop for ProductionOS itself. It should compare workflow variants against a fixed benchmark and only keep changes that materially improve quality or efficiency.

## Inputs

- target workflow or agent
- optional benchmark
- optional hypothesis

## Codex Workflow

1. capture the current baseline
2. generate challenger variants
3. benchmark each variant against the same task
4. compare results and choose a winner
5. log learnings and promote only real improvements

## Expected Output

- baseline metrics
- challenger comparison
- winner selection
- optimization learnings

## Guardrails

- no benchmark drift between variants
- do not promote changes without measurable improvement
