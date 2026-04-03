---
name: designer-upgrade
description: "Full UI/UX redesign pipeline — audits design, creates design systems, generates interactive HTML mockups, launches local browser for user interaction. Fuses /production-upgrade rigor with design agency methodology."
argument-hint: "[target frontend, focus, or grade]"
---

# designer-upgrade

## Overview

Use this as the Codex-first design transformation workflow. It should audit the current UI, create or refine the design system, generate artifacts the user can react to, and then convert the audit into an implementation plan.

Source references:
- `.claude/commands/designer-upgrade.md`
- `agents/designer-upgrade.md`
- `agents/design-system-architect.md`
- `agents/frontend-designer.md`

## Inputs

- target frontend path or repo
- optional `focus`
- optional `grade`
- optional `mockup_views`

## Codex Workflow

1. Audit the current interface.
2. Synthesize the major visual and UX problems.
3. Build or refine the design system.
4. Generate mockups or other concrete design artifacts.
5. Collect or simulate review feedback.
6. Turn the result into an implementation plan.

## Expected Output

- design audit synthesis
- design system output
- mockups or equivalent reviewable artifact
- implementation plan

## Guardrails

- do not reduce the workflow to text-only commentary if visual artifacts are feasible
- keep backend and infrastructure changes out of scope
- keep the output grounded in the current product, not generic redesign advice
