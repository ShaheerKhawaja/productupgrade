---
name: security-scan
description: "ProductionOS security scanner. Auto-activates when editing auth, payment, credential, or admin files. Runs OWASP Top 10 checks, dependency audit, and secret detection."
metadata:
  filePattern:
    - "**/auth/**"
    - "**/authentication/**"
    - "**/payment/**"
    - "**/billing/**"
    - "**/admin/**"
    - "**/*secret*"
    - "**/*credential*"
    - "**/*password*"
    - "**/*token*"
    - "**/.env*"
    - "**/middleware/**"
    - "**/security/**"
  bashPattern:
    - "security-audit"
    - "owasp"
    - "npm audit"
    - "pip audit"
  priority: 95
---

# ProductionOS Security Scan

<HARD-GATE>
You are editing a security-sensitive file. ProductionOS requires:
1. Review all changes for OWASP Top 10 vulnerabilities
2. Check for hardcoded secrets or credentials
3. Verify input validation on all user-facing endpoints
4. Confirm authentication/authorization checks are present
Do NOT skip any of these checks.
</HARD-GATE>

## Auto-Triggered Checklist

When this skill activates on a security-sensitive file:

1. **Secret Detection** — Scan for hardcoded API keys, tokens, passwords, connection strings
2. **Input Validation** — Verify all user inputs are validated and sanitized
3. **Auth Checks** — Confirm endpoint has proper authentication and authorization
4. **SQL Injection** — Check for parameterized queries (no string concatenation)
5. **XSS Prevention** — Verify output encoding for user-generated content
6. **CSRF Protection** — Confirm CSRF tokens on state-changing operations
7. **Dependency CVEs** — Flag if file imports packages with known vulnerabilities

## Red Flags — STOP If You See These

- Hardcoded secrets (API keys, passwords, tokens in source code)
- Missing authentication on new endpoints
- User input passed directly to database queries
- Unsafe HTML rendering without sanitization
- Disabled CSRF protection
- Overly permissive CORS configuration
- Catch-all error handlers that swallow security exceptions
