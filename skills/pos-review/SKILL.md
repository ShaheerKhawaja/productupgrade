---
name: pos-review
description: "Code review composite — PR review, architecture review, and diff analysis with persistent review patterns. Replaces 7 fragmented review skills."
argument-hint: "[pr|code|architecture] [PR number, file path, or branch]"
---

# pos-review

Domain-aware code review pipeline with persistent review patterns. Reviews PRs for bugs and security issues, audits architecture for design flaws, and analyzes diffs for regression risk. Learns from past reviews — common issues in this codebase get flagged faster.

**Replaces:** review, code-review, review-pr, review-delta, unified-review, github-code-review, requesting-code-review

## Actions

| Action | What | When to Use |
|--------|------|------------|
| `pr [number]` | Full PR review with 2-pass (critical + informational) | Before merging any PR |
| `code [path]` | Review specific files or directories | During development |
| `architecture [target]` | Architecture-level review for design patterns and coupling | Before major refactors |

## Routing

1. Parse action. Default to `pr` if a PR number is detected, `code` otherwise.
2. Load review memory from `~/.productionos/domains/review/`
3. If first run: detect codebase patterns, set review profile
4. Dispatch to sub-skill with codebase context
5. Score against rubric, update review history

## Domain Memory

Stored at `~/.productionos/domains/review/`:

| File | What | Updated |
|------|------|---------|
| `profile.yml` | Codebase patterns, common pitfalls, style conventions | First run + auto-updated |
| `review-history.jsonl` | Past reviews with findings, false positives, accepted changes | After every review |
| `patterns.jsonl` | Recurring issues in this codebase (N+1 queries, missing auth, etc.) | Extracted from review history |
| `suppressions.jsonl` | Known acceptable patterns that shouldn't be flagged | Manual + auto-learned |

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `action` | `pr`, `code`, `architecture` | auto-detect | Review type |
| `target` | PR number, file path, or branch | required | What to review |
| `mode` | `strict`, `standard`, `quick` | `standard` | Review depth |

## Sub-Skills

### pr
Two-pass PR review (adapted from code-reviewer agent):

**Pass 1 — CRITICAL (must fix before merge):**
- Security vulnerabilities (injection, XSS, auth bypass)
- Data loss risks (migration without rollback, destructive operations)
- Logic errors (wrong condition, missing null check, race condition)
- Test coverage gaps (new code paths without tests)

**Pass 2 — INFORMATIONAL (improve but don't block):**
- Code style and naming conventions
- Performance suggestions
- Documentation gaps
- Simplification opportunities

Output: findings table with severity, file:line, evidence, and fix suggestion.

### code
Focused file/directory review:
1. Read all files in scope
2. Check against codebase patterns (from memory)
3. Run checklist: error handling, input validation, test coverage, naming
4. Compare to similar files in the codebase for consistency
5. Report findings with specific line references

### architecture
System-level review:
1. Map component dependencies (imports, API calls, data flow)
2. Check coupling (are modules appropriately isolated?)
3. Check for anti-patterns (god objects, circular deps, leaky abstractions)
4. Assess scalability (N+1 queries, missing indexes, blocking operations)
5. Produce architecture diagram + recommendations

## Error Handling

| Scenario | Action |
|----------|--------|
| PR not found | Check number, suggest recent PRs |
| File not found | Search for similar paths |
| No git history | Review files statically without diff context |
| Codebase too large | Focus on changed files + their direct dependencies |
| Finding is a known pattern | Check suppressions — if suppressed, skip silently |

## Guardrails

1. **Findings need evidence.** Every issue includes file:line and what specifically is wrong.
2. **Critical before informational.** Never bury a security issue under style feedback.
3. **Fix-first heuristic.** If you can auto-fix a mechanical issue (formatting, import order), do it.
4. **Respect suppressions.** Learned acceptable patterns don't get re-flagged.
5. **Never approve blindly.** If a review finds 0 issues, state confidence level.
