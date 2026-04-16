---
name: pos-security
description: "Security composite — OWASP audit, dependency scan, secret detection, and hardening with persistent vulnerability memory. Replaces 9 fragmented security skills."
argument-hint: "[audit|scan|harden] [target path or URL]"
---

# pos-security

Domain-aware security pipeline with shared vulnerability memory across sessions. Audits codebases against OWASP Top 10, scans dependencies for known CVEs, detects secrets in code, and applies hardening fixes. Learns from past audits — tracks which vulnerabilities recur and which fixes stick.

**Replaces:** security-audit, security-requirement-extraction, security-scan, security-sast, security-hardening, security-dependencies, unified-security, attack-tree-construction, sast-configuration

## Actions

| Action | What | When to Use |
|--------|------|------------|
| `audit [path]` | Full OWASP/MITRE/NIST security audit | Before releases. After auth/payment changes. |
| `scan` | Dependency vulnerability scan + secret detection | Before every PR. Weekly cadence. |
| `harden [finding]` | Apply security fixes for specific findings | After audit identifies issues |

## Routing

1. Parse action. Default to `audit` if ambiguous.
2. Load security memory from `~/.productionos/domains/security/`
3. If first run: detect tech stack, set default scan profiles
4. Dispatch to `sub-skills/{action}.md`
5. Score against `evaluation/rubric.yml`, update vulnerability memory

## Domain Memory

Stored at `~/.productionos/domains/security/`:

| File | What | Updated |
|------|------|---------|
| `profile.yml` | Tech stack, auth framework, deployment target, compliance requirements | First run + manual |
| `vuln-history.jsonl` | Past findings with status (open/fixed/accepted-risk) | After every audit |
| `dependency-audit.jsonl` | Dependency scan results with CVE IDs and severity | After every scan |
| `learnings.jsonl` | Patterns: recurring vulns, fixes that stuck, false positive suppressions | Extracted from audit deltas |

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `action` | `audit`, `scan`, `harden` | `audit` | Which sub-skill |
| `target` | file path, directory, or URL | cwd | What to audit |
| `compliance` | `owasp`, `soc2`, `hipaa`, `pci`, `all` | `owasp` | Which framework |

## Sub-Skills

### audit
7-domain OWASP/MITRE/NIST sweep:
1. **Authentication** — Session management, token handling, password policy, MFA
2. **Authorization** — RBAC/ABAC, privilege escalation, IDOR
3. **Input validation** — SQL injection, XSS, command injection, path traversal
4. **Data protection** — Encryption at rest/transit, PII handling, secret storage
5. **Configuration** — Default credentials, debug mode, CORS, security headers
6. **Dependencies** — Known CVEs, outdated packages, license risks
7. **Logging** — Audit trail, error handling (no stack traces leaked), monitoring

Each domain scored independently. Overall score = weighted average.

### scan
Fast checks without full audit:
- `npm audit` / `pip-audit` / `bundle audit` for known CVEs
- Gitleaks for secrets in staged/committed files
- Semgrep for SAST patterns (if installed)
- License compatibility check

### harden
Apply specific fixes from audit findings:
1. Read the finding from vuln-history.jsonl
2. Read the affected file
3. Apply minimum fix (don't refactor)
4. Re-run the specific check to verify
5. Mark finding as `fixed` in vuln-history.jsonl

## Error Handling

| Scenario | Action |
|----------|--------|
| No code to audit | Check path, suggest correct target |
| npm/pip audit unavailable | Skip dependency scan, note in report |
| Gitleaks not installed | Fall back to regex patterns |
| Semgrep not installed | Skip SAST, note in report |
| All findings are false positives | Log suppressions to learnings.jsonl with justification |
| Finding already known | Check vuln-history — if accepted-risk, skip. If recurrence, flag |

## Guardrails

1. **Never suppress findings silently.** Every suppression requires justification logged to learnings.
2. **Severity drives priority.** CRITICAL before HIGH before MEDIUM. No exceptions.
3. **Verify fixes.** Re-run the check after hardening. Don't trust the change worked.
4. **Compliance is additive.** SOC2 checks include OWASP. HIPAA includes SOC2 + health data.
5. **Memory prevents regression.** Fixed vulns that recur are flagged as regression, not new finding.
