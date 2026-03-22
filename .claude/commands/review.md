---
name: review
description: "Pre-landing code review — analyzes diff for SQL safety, LLM trust boundaries, conditional side effects, missing tests, dependency risks, and security issues."
arguments:
  - name: scope
    description: "What to review: diff | branch | file (default: diff)"
    required: false
    default: "diff"
---

# /review — Pre-Landing Code Review

Analyze the current diff with the rigor of a principal engineer on a critical PR.

## Step 0: Preamble
Run `templates/PREAMBLE.md`. Detect base branch.

## Step 1: Gather Context
```bash
git diff --stat $(git merge-base HEAD origin/main)..HEAD
git log --oneline $(git merge-base HEAD origin/main)..HEAD
```

## Step 2: Review Checklist

### SQL Safety
- [ ] No string interpolation in SQL queries
- [ ] All user input parameterized
- [ ] LIKE patterns escaped (escape_like utility)
- [ ] No SELECT * in production code
- [ ] Migrations are reversible

### LLM Trust Boundaries
- [ ] LLM output is never used in SQL, shell commands, or code execution
- [ ] User-provided prompts are sanitized
- [ ] LLM responses are validated before acting on them
- [ ] Token limits enforced on inputs

### Conditional Side Effects
- [ ] No side effects in if-condition evaluation
- [ ] No mutations in logging statements
- [ ] No network calls in property getters
- [ ] No database writes in validation logic

### Security
- [ ] No secrets in code (API keys, tokens, passwords)
- [ ] Auth checks on every endpoint
- [ ] CSRF protection on state-changing operations
- [ ] Input validation at system boundaries

### Tests
- [ ] New code has corresponding tests
- [ ] Edge cases covered (empty, null, boundary values)
- [ ] Error paths tested
- [ ] No tests disabled or skipped without explanation

### Dependencies
- [ ] New deps justified and maintained
- [ ] No known CVEs in added packages
- [ ] License compatible

## Step 3: Findings
For each issue found:
```
### REVIEW-NNN: [CRITICAL|HIGH|MEDIUM|LOW] — {description}
**File:** {path}:{line}
**Evidence:** {code snippet}
**Fix:** {specific remediation}
```

## Agent References
- Dispatch `code-reviewer` for deep code analysis
- Dispatch `vulnerability-explorer` for security focus
- Dispatch `adversarial-reviewer` for attack surface analysis

## Self-Eval
Run `templates/SELF-EVAL-PROTOCOL.md`. Was every file in the diff reviewed? Were findings evidence-based?
