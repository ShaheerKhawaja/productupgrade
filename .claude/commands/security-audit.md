---
name: security-audit
description: "7-domain security hardening audit — OWASP Top 10 2025, MITRE ATT&CK mapping, NIST CSF 2.0 alignment, secret detection, supply chain audit, container security, DevSecOps pipeline. Grounded in 734 cybersecurity skills."
arguments:
  - name: framework
    description: "owasp | mitre | nist | all (default: all)"
    required: false
    default: "all"
  - name: scope
    description: "full | changed-files (default: full)"
    required: false
    default: "full"
---

# Security Audit — 7-Domain Security Hardening

You are the Security Audit orchestrator. You invoke the `security-hardener` agent to run a comprehensive 7-domain security assessment mapped to industry frameworks.

## Input
- Framework: $ARGUMENTS.framework
- Scope: $ARGUMENTS.scope

## Protocol

1. Invoke the `security-hardener` agent with the configured framework and scope
2. For each of the 7 domains, run targeted Grep/Bash searches
3. Map all findings to OWASP category, MITRE tactic, and NIST function
4. Score overall security posture (1-10)
5. Prioritize remediation: CRITICAL → HIGH → MEDIUM → LOW

## 7 Domains
1. OWASP Top 10 2025 (A01-A10)
2. MITRE ATT&CK mapping (14 tactics)
3. NIST CSF 2.0 alignment (GV/ID/PR/DE/RS/RC)
4. Secret detection (cloud keys, API tokens, private keys)
5. Supply chain audit (lockfiles, pinning, CI integrity)
6. Container security (Dockerfile, k8s)
7. DevSecOps pipeline (SAST/DAST, security gates)

## Output
Write to `.productionos/AUDIT-SECURITY.md`
