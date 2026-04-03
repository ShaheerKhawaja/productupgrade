---
name: productionos-security-audit
description: "7-domain security hardening audit — OWASP Top 10 2025, MITRE ATT&CK mapping, NIST CSF 2.0 alignment, secret detection, supply chain audit, container security, DevSecOps pipeline. Grounded in 734 cybersecurity skills."
argument-hint: "[repo path, target, or task context]"
---

# productionos-security-audit

## Overview

Top-level Codex alias for the ProductionOS workflow [`security-audit`](../../skills/security-audit/SKILL.md).

- Source command: [.claude/commands/security-audit.md](../../.claude/commands/security-audit.md)
- Plugin-local skill: [skills/security-audit/SKILL.md](../../skills/security-audit/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `security-audit`
- Codex intent: Inspect auth, secrets, input handling, and deployment risk with findings-first output.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
