---
name: security-audit
description: "7-domain security hardening audit — OWASP Top 10 2025, MITRE ATT&CK mapping, NIST CSF 2.0 alignment, secret detection, supply chain audit, container security, DevSecOps pipeline. Grounded in 734 cybersecurity skills."
argument-hint: "[repo path, target, or task context]"
---

# security-audit

## Overview

This is the Codex-native workflow wrapper for [.claude/commands/security-audit.md](../../.claude/commands/security-audit.md).

Use it when the user wants this exact ProductionOS workflow, not just the umbrella `productionos` router.

## Source of Truth

1. Read the source command spec at [.claude/commands/security-audit.md](../../.claude/commands/security-audit.md).
2. Use [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md) to confirm runtime support and parity expectations.
3. Preserve the source workflow's guardrails, scope, artifacts, and verification intent.
4. Translate Claude-only slash-command and hook semantics into Codex-native execution instead of copying them literally.

## Codex Behavior

- Summary: OWASP/MITRE/NIST-oriented security sweep across the codebase.
- Expected behavior: Inspect auth, secrets, input handling, and deployment risk with findings-first output.
- Validation: tests/runtime-targets.test.ts

## Inputs

- `framework` — owasp | mitre | nist | all (default: all) Default: `all` Optional.
- `scope` — full | changed-files (default: full) Default: `full` Optional.

## Execution Outline

1. Preamble

## Agents And Assets

- Agents: `security-hardener`
- Templates: `INVOCATION-PROTOCOL.md`, `PREAMBLE.md`
- Artifacts: `.productionos/AUDIT-SECURITY.md`

## Workflow

1. Load only the agents, templates, prompts, and docs referenced by the source command.
2. Execute the workflow intent with Codex-native tools.
3. If the source command implies parallel agent work, only delegate when the user explicitly wants that overhead.
4. Verify with the smallest relevant checks before concluding.
5. Summarize what changed, what was verified, and what still needs human approval.

## Guardrails

- Do not claim that Claude-only marketplace, hook, or slash-command behavior runs directly in Codex.
- Keep the scope faithful to the source command rather than broadening into a generic repo audit.
- Prefer concrete outputs and validation over describing the workflow abstractly.
- Preserve the scope and stop conditions from the source command rather than broadening into a generic repo audit.
