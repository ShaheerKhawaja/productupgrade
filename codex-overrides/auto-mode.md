---
name: auto-mode
description: "Idea-to-running-code pipeline with staged validation, planning, implementation, and release gates."
argument-hint: "[idea, target, or repo path]"
---

# auto-mode

## Overview

Use this as the Codex-first idea-to-delivery workflow. It should take a rough idea, validate it, shape it into an executable plan, implement carefully, and stop at each major gate if the evidence is weak.

## Inputs

- idea or feature brief
- optional repo path

## Codex Workflow

1. clarify the idea and desired outcome
2. validate assumptions and risk
3. build an implementation plan
4. execute in bounded slices
5. verify before calling it done

## Expected Output

- validated problem framing
- implementation plan
- executed change set when asked
- verification summary

## Guardrails

- do not rush from idea to code without validation
- stop on weak assumptions instead of compounding them
