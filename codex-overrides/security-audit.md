---
name: security-audit
description: "7-domain security hardening audit — OWASP Top 10 2025, MITRE ATT&CK mapping, NIST CSF 2.0 alignment, secret detection, supply chain audit, container security, DevSecOps pipeline. Grounded in 734 cybersecurity skills."
argument-hint: "[framework, scope, or repo path]"
---

# security-audit

## Overview

Use this as the Codex-first security audit workflow. It is detection-first and evidence-first: find concrete security issues, map them to frameworks, and never cross into exploit behavior.

Source references:
- `.claude/commands/security-audit.md`
- `agents/security-hardener.md`

## Inputs

- `framework`: `owasp`, `mitre`, `nist`, or `all`
- `scope`: `full` or `changed-files`
- repository path or current checkout

## Codex Workflow

1. Resolve scope and prior audit context.
2. Audit the codebase across the main security domains:
   - access control
   - crypto and secrets handling
   - injection risk
   - security misconfiguration
   - dependency and supply-chain risk
   - auth/session weaknesses
   - logging, monitoring, and SSRF-style outbound risk
3. Map every real finding to a framework category where possible.
4. Classify severity and explain exploitability and impact.
5. End with an actionable posture summary, not just a list of grep hits.

## Expected Output

- findings with severity, evidence, and framework mapping
- overall security posture summary
- concrete remediations

## Guardrails

- never attempt live exploitation
- never expose secret values in output
- every finding must be backed by file and line evidence
