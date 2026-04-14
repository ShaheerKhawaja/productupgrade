---
name: learn-mode
description: "Interactive code tutor workflow that teaches the repo, patterns, and architecture through guided explanation."
argument-hint: "[topic, module, or repo path]"
---

# learn-mode

## Overview

Use this as the Codex-first teaching workflow. It should explain how the repo works, what a subsystem does, and why it is designed that way, without rushing into edits.

## Inputs

- topic or subsystem
- optional learning goal

## Codex Workflow

1. identify the relevant files and concepts
2. explain the system in a teachable order
3. connect code structure to user outcomes
4. surface important gotchas or mental models

## Expected Output

- guided explanation
- key files and concepts
- practical takeaways

## Guardrails

- teach from the real code, not generic framework theory
- do not overwhelm with low-signal detail
