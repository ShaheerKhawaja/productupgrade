---
name: audit-and-fix
description: "Composite: security audit -> production upgrade -> self-evaluation. Use when user says 'audit', 'check the codebase', 'find and fix issues', or 'is this production-ready'."
argument-hint: "[target path or scope]"
---

# audit-and-fix

Composite skill that chains security-audit, production-upgrade, and self-eval into a single audit-then-remediate pipeline. Each step consumes the previous step's artifacts and gates the next step based on severity.

## Chain Overview

```
security-audit -> production-upgrade -> self-eval
     |                   |                  |
     v                   v                  v
  AUDIT-SECURITY.md   UPGRADE.md      EVAL-RESULT.md
```

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `target` | path, `.`, `changed-files` | `.` | What to audit |
| `scope` | `full`, `changed-files` | `full` | Breadth of analysis |

---

## Step 1: Security Audit

**Invokes:** `/security-audit` with framework=all, scope={scope}

**What it does:**
- 7-domain scan: OWASP Top 10, MITRE ATT&CK, NIST CSF 2.0, secret detection, supply chain, container, DevSecOps
- Every finding cites file:line evidence with severity (CRITICAL/HIGH/MEDIUM/LOW)
- Cross-maps all findings across all three frameworks

**Produces:** `.productionos/AUDIT-SECURITY.md`

**Gate to Step 2:**
- If CRITICAL findings > 0: **ESCALATE.** Do not proceed to production-upgrade. Print escalation report with CRITICAL findings and halt. The user must acknowledge CRITICAL issues before remediation begins.
- If HIGH findings > 5: Print warning, proceed with `--mode=audit` (read-only upgrade analysis, no code changes).
- Otherwise: Proceed normally to Step 2.

---

## Step 2: Production Upgrade

**Invokes:** `/production-upgrade --mode=audit`

**What it does:**
- Reads AUDIT-SECURITY.md as input baseline
- Runs full codebase quality audit: code style, error handling, test coverage, dependency health, API design
- Identifies upgrade opportunities beyond security (performance, maintainability, correctness)
- Generates prioritized fix plan with effort estimates

**Produces:** `.productionos/UPGRADE.md`

**Gate to Step 3:**
- Proceeds unconditionally. Production-upgrade is advisory in audit mode.

---

## Step 3: Self-Evaluation

**Invokes:** `/self-eval last`

**What it does:**
- Evaluates the combined audit + upgrade analysis against 7 quality dimensions
- Scores: quality, necessity, correctness, dependencies, completeness, learning, honesty
- Overall score >= 8.0 is PASS, 6.0-7.9 triggers self-heal loop (max 3), < 6.0 blocks

**Produces:** `.productionos/EVAL-RESULT.md`

---

## Escalation Protocol

When security-audit finds CRITICAL severity issues:

```
STATUS: BLOCKED
REASON: {N} CRITICAL security findings require immediate attention
FINDINGS:
  1. {finding_id}: {description} at {file}:{line} — {framework_mapping}
  ...
RECOMMENDATION: Fix CRITICAL issues manually, then re-run /audit-and-fix
```

Do NOT attempt automated fixes for CRITICAL security issues. Authentication bypasses, exposed secrets, and RCE vectors require human review.

---

## Output Format

Final composite report written to `.productionos/AUDIT-AND-FIX.md`:

```markdown
# Audit & Fix Report

## Summary
- **Security Posture:** X/10
- **Production Readiness:** X/10
- **Self-Eval Score:** X/10
- **Findings:** N security, M upgrade opportunities
- **Status:** PASS | BLOCKED | NEEDS_ATTENTION

## Security Findings (from Step 1)
{top 10 findings by severity, full list in AUDIT-SECURITY.md}

## Upgrade Opportunities (from Step 2)
{prioritized list with effort estimates}

## Evaluation (from Step 3)
{7-dimension score breakdown}

## Next Actions
1. {highest priority action}
2. {second priority action}
...
```

---

## When to Use

- "Audit this codebase" -- runs full pipeline
- "Is this production-ready?" -- runs full pipeline
- "Find and fix security issues" -- runs full pipeline
- "Check the code quality" -- runs full pipeline

## When NOT to Use

- Active debugging of a specific bug -- use `/debug` instead
- Shipping a PR -- use `/ship-safe` instead
- Full project lifecycle -- use `/full-cycle` instead
