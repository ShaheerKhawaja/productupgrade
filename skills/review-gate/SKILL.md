---
name: review-gate
description: >
  Enforces code review quality before commits and pushes across ALL projects.
  6-gate sequence: diff size, PII/secrets, conventions, cross-project boundaries,
  completeness, self-review reminder. Only PII gate blocks; rest are advisory.
  Triggers on: "review before push", "pre-commit review", "quality gate",
  "/review-gate".
---

# review-gate: Quality Enforcement for Every Push

Automated quality gate that catches issues tests miss: secrets, convention violations,
incomplete implementations, and cross-project context leaks.

## Gate Sequence

### Gate 1: Diff Size Check
Max 15 files, 200 lines/file. **Advisory** — warns, does not block.

### Gate 2: PII and Secrets Scan
Scans diff for email addresses (except noreply), API keys (`sk-`, `ghp_`, `xoxb-`, `AKIA`),
IP addresses, absolute home paths, hardcoded passwords.
**BLOCKS on any match.** No exceptions.

### Gate 3: Convention Compliance
Per-project rules loaded from SecondBrain wiki entity pages via `secondbrain_path` config.
- Python: ruff format, no `print()` in production
- Frontend: no `console.log` in production
- All: conventional commit format, no TODO without issue number
**Advisory.**

### Gate 4: Cross-Project Boundary Check
Detects files outside current git root, imports with absolute paths to other projects.
**Advisory** — user must confirm intent.

### Gate 5: Completeness Check
Scans for `TODO`/`FIXME` without issue ref, empty function bodies, commented-out code
blocks (>3 lines), debugging statements, skipped tests without explanation.
**Advisory.**

### Gate 6: Self-Review Reminder
If >5 files changed and no `/review` or `/unified-review` invoked this session,
reminds the user. **Advisory.**

## Output Format

```
  [1/6] Diff size .............. PASS (7 files, max 45 lines)
  [2/6] PII/secrets scan ....... PASS (0 findings)
  [3/6] Convention compliance .. WARN (2 findings)
  [4/6] Cross-project boundary . PASS
  [5/6] Completeness check ..... WARN (1 finding)
  [6/6] Self-review reminder ... PASS

  Result: PASS with 3 advisory warnings
```

## Blocking Rules

Only Gate 2 (PII/secrets) blocks. Everything else is advisory. The goal is to
surface issues without slowing the developer down.
