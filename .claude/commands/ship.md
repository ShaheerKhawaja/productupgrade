---
name: ship
description: "Ship workflow — detect base branch, merge, run tests, review diff, bump VERSION, update CHANGELOG, commit, push, create PR."
arguments:
  - name: version_bump
    description: "Version bump: patch | minor | major (default: auto-detect from commits)"
    required: false
    default: "auto"
---

# /ship — Ship Workflow

Merge base, test, review, version, changelog, commit, push, PR. One command to ship.

## Step 0: Preamble
Run `templates/PREAMBLE.md`. Detect base branch.

## Step 1: Merge Base Branch
```bash
git fetch origin
git merge origin/$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@') --no-edit
```
If conflicts: resolve or abort and report.

## Step 2: Run Tests
```bash
bun test 2>&1 || npm test 2>&1 || pytest 2>&1
```
If tests fail: STOP. Do not ship broken code. Report failures.

## Step 3: Review Diff
Run `/review` on the current branch diff. If CRITICAL issues found: STOP and report.

## Step 4: Bump VERSION
Auto-detect bump type from commit messages:
- `feat:` → minor
- `fix:` → patch
- `BREAKING` → major
- Override with $ARGUMENTS.version_bump

Update VERSION file, package.json version, plugin.json version.

## Step 5: Update CHANGELOG
Append entry with date, version, and summary of changes from git log.

## Step 6: Self-Eval Gate
Run `templates/SELF-EVAL-PROTOCOL.md`. Score must be >= 8.0 to proceed.
Questions: Are tests passing? Is the diff clean? Are there uncommitted changes?

## Step 7: Commit
```bash
git add -A
git commit -m "release: v{new_version} — {summary}"
```

## Step 8: Push + PR
```bash
git push origin HEAD
gh pr create --title "release: v{new_version}" --body "{changelog entry}"
```

## Guardrails
- NEVER push to main directly
- NEVER ship with failing tests
- NEVER ship with CRITICAL review findings
- Self-eval must pass before push
