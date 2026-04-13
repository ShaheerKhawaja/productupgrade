# AGENTS.md

Instructions for AI agents (Claude Code, Codex, Gemini, Copilot) working in this repository.

## Repository Classification
- Visibility: PUBLIC
- Owner: ShaheerKhawaja
- Project: ProductionOS — AI engineering OS for Claude Code
- Stack: TypeScript (Bun), Ink (React TSX for terminal UI), shell hooks
- Test runner: `bun test` (967+ tests across 28 files)
- Type checker: `tsc --noEmit` (strict mode, zero errors required)

## Identity
- Author: Shaheer Khawaja
- Email: ShaheerKhawaja@users.noreply.github.com
- No Co-Authored-By lines. No AI attribution. Single author on all commits.
- No personal email (shaheerkhwaja@gmail.com) in any commit.
- No IP addresses, machine hostnames, or local paths in committed code.

## Commits
- Use Conventional Commits: `type(scope): description`
- Allowed types: feat, fix, refactor, docs, test, chore, ci, security, audit, session, perf, build, revert
- Branch naming: `<type>/<slug>` (e.g. `feat/user-auth`, `fix/email-parser`)
- Keep subject lines under 72 characters, imperative mood
- Never use `git add -A` or `git add .` — stage only files relevant to the change
- Run tests and type check before committing:
  ```bash
  bun test          # 967+ pass, 0 fail
  npx tsc --noEmit  # 0 errors
  ```
- Never push directly to `main` or `master` — use PR workflow
- Reference issue numbers in commit messages: `fix: #4 migrate HTTPException`
- Use HEREDOC format for multi-line commit messages
- Pre-commit hook enforces: email check, PII/secret scan, Gitleaks, tsc type check

## Branch Strategy
- Feature branches: `feat/<slug>`
- Bug fixes: `fix/<slug>`
- Docs/session: `docs/<slug>`, `session/<date>`
- Audit/review: `audit/<slug>`
- One branch per unique issue; reuse same branch for related work
- Squash merge to main via PR

## Pull Requests
- PRs must target main unless specified otherwise
- PR title: under 70 characters, descriptive
- PR body must include: Summary (what + why), Test plan (checklist)
- Always use `--repo ShaheerKhawaja/ProductionOS` with gh commands
- CI must pass all 4 checks before merge: validate, lint, eval-gate, convergence-check
- Close stale PRs with explanation

## Code Standards (This Repo)

### TypeScript
- Strict mode (`tsconfig.json` with `strict: true`)
- `tsc --noEmit` must pass with zero errors — CI enforces this
- No unused variables (TS6133), no unused imports, no implicit any
- Bun runtime — use `bun:test` for tests, `Bun.file()` for I/O

### Skills (skills/*/SKILL.md)
- Every skill must have YAML frontmatter: `name`, `description`, `argument-hint`
- Dense skills (HAND_CRAFTED) must include: `## Inputs` table, `## Guardrails` section
- Auto-generated skills are produced by `scripts/gen-targets.ts` — do not edit them manually
- To upgrade a skill from auto-generated to hand-crafted:
  1. Add to `HAND_CRAFTED_SKILLS` in `scripts/lib/runtime-targets.ts`
  2. Add to `HAND_CRAFTED_SKILLS` in `tests/runtime-targets.test.ts`
  3. Move from `autoGenCoreSkills` to `handCraftedCoreSkills` in the test
  4. Run `bun run scripts/gen-targets.ts` to regenerate
  5. Run `bun test` to verify

### Agents (agents/*.md)
- YAML frontmatter required: `name`, `description`, `model`, `tools`, `subagent_type`, `stakes`
- `stakes` must be lowercase: `low`, `medium`, or `high`
- 78 agents total — the count in CLAUDE.md must match `ls agents/*.md | wc -l`

### Hooks (hooks/*.sh)
- All hooks must have `#!/usr/bin/env bash` shebang
- All hooks must be executable (`chmod +x`)
- TTY detection required: `[ -t 1 ]` for styled output vs ASCII fallback in pipes/tests
- Hooks are registered in `hooks/hooks.json` — update both when adding/removing

### Generated Files
- `scripts/gen-targets.ts` generates: SKILL.md files, plugin manifests, codex-skills aliases, CODEX-PARITY-HANDOFF.md
- Never edit generated files manually — edit the generator or add to HAND_CRAFTED_SKILLS
- Run `bun run scripts/gen-targets.ts` after any change to runtime-targets.ts

## Test Gates (Must Pass Before Commit)
```bash
bun test                                          # 967+ pass, 0 fail
npx tsc --noEmit                                  # 0 TypeScript errors
bun run scripts/skill-router.ts "audit security"  # valid chain returned
```

## What NOT to Modify
- `CLAUDE.md` composites-first structure — locked
- `scripts/skill-router.ts` intent chains — test all 5 router queries before changing
- `convergence.ts` TARGET_GRADE (8.0) — locked
- Hooks TTY detection (`[ -t 1 ]`) — tests depend on ASCII fallback
- Agent `stakes` field values — must stay lowercase

## Worktrees
- One branch per worktree, one agent session per worktree
- Naming: `wt-<issue-number>-<slug>`
- Keep `.worktrees/` in `.gitignore`
- Remove worktrees after merge; run cleanup scan weekly
- Never force-remove dirty worktrees
- Copy `.env*` files from main repo to new worktrees

## Issue Tracking (GitHub Issues)
- Begin session: select issue (P0/P1/P2), self-assign, post session plan
- During: post brief updates at milestones, update labels
- End session: post "What landed" summary with "Next steps", close or update
- Labels: P0-critical, P1-high, P2-medium, P3-low, security, session-handoff, audit-finding
- All issues must be atomic and linked to roadmap items
- Architecture/behavior changes: update docs in the same commit

## Secrets (Non-Negotiable)
- NEVER commit real API keys, tokens, passwords, or private keys
- Real secrets live in .env.local (gitignored) or deployment secret manager
- Sample config files must use obviously fake placeholders
- Never echo, cat, or print .env files
- Never print secrets to terminal output
- If Gitleaks pre-commit hook flags your commit, remove the secret — do not bypass
- NEVER use --no-verify to skip hooks

## Upstream Protection
- NEVER interact with upstream Entropy-Co repos
- Only use ShaheerKhawaja forks with explicit --repo flag
- Always verify target repo before gh pr/issue commands

## Completion Standard
- 100% completion required. No 80% work, no "good enough."
- Every change must be self-reviewed before push
- Self-review includes: re-read every changed file, verify tests pass, check edge cases
- If self-review takes 2 hours for a 10 minute fix, that is acceptable
- No partial implementations. Finish what you start or document what remains as issues.
- Verify the fix actually works — don't trust assumptions

## Session Protocol
- Start: read session handoff issue, review open issues, check `git log --oneline -10`
- During: reference issues in commits, post milestones
- End: create/update handoff docs, close completed issues
- Handoff artifacts: `.productionos/sessions/handoff-{date}.md`, `~/SecondBrain/Sessions/`

## Hook Architecture (Auto-Enforced)

This repo has 15 hooks across 4 lifecycle events. They run automatically — do not disable them.

| Event | Hook | What It Does |
|-------|------|-------------|
| SessionStart | session-start.sh | Init state, display banner, load instincts |
| PreToolUse (Edit/Write) | scope-enforcement.sh | Block out-of-scope edits |
| PreToolUse (Edit/Write) | protected-file-guard.sh | Block writes to .env, keys, certs |
| PreToolUse (Edit/Write) | pre-edit-security.sh | Advisory on auth/payment files |
| PreToolUse (Bash) | pre-commit-gitleaks.sh | Secret detection in staged files |
| PostToolUse (Edit/Write) | self-learn.sh | Cross-session pattern capture |
| PostToolUse (Edit/Write) | post-edit-telemetry.sh | Log file edits |
| PostToolUse (Edit/Write) | post-edit-review-hint.sh | Suggest review after 10+ edits |
| PostToolUse (Edit/Write) | eval-gate.sh | Quality gate check |
| PostToolUse (Bash) | post-bash-telemetry.sh | Log commands |
| Stop | stop-session-handoff.sh | Summary doc + session log |
| Stop | stop-extract-instincts.sh | Pattern extraction |
| Stop | stop-eval-gate.sh | Session-end evaluation |

## CI Pipeline (4 Jobs)

All must pass for PR merge:

| Job | What | Blocks On |
|-----|------|-----------|
| validate | `bun run skill:check` + `bun run validate` + `bun test` | Any test failure |
| lint | `tsc --noEmit` | Any TypeScript error |
| eval-gate | `bun run eval` — deep eval report | Any CRITICAL finding |
| convergence-check | `bun run scripts/convergence.ts --test` | Convergence failure |

## Quick Start for New Agents

```bash
cd ~/repos/skill-analysis/ProductionOS
cat VERSION                        # Current version
bun test                           # Verify clean state
npx tsc --noEmit                   # Verify types
git checkout -b feat/<your-task>   # Create feature branch
# ... make changes ...
bun test && npx tsc --noEmit      # Verify before commit
git add <specific files>           # Stage only relevant files
git commit -m "type(scope): description"
git push -u origin feat/<your-task> --repo ShaheerKhawaja/ProductionOS
gh pr create --repo ShaheerKhawaja/ProductionOS --title "type(scope): description" --body "..."
```
