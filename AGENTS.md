# AGENTS.md

Instructions for Codex agents operating on repositories managed by Shaheer Khawaja. ProductionOS is your engineering toolkit -- use it to audit, plan, build, test, and ship code.

## Repository Classification
- Visibility: [PUBLIC / PRIVATE]
- Owner: ShaheerKhawaja

## Identity
- Author: Shaheer Khawaja
- Email: ShaheerKhawaja@users.noreply.github.com
- No Co-Authored-By lines. No AI attribution. Single author on all commits.
- No personal email in commits. No IP addresses, hostnames, or local paths in code.

---

## Your Toolkit: ProductionOS

You have access to ProductionOS, an 80-agent AI engineering OS installed as a Claude Code plugin. It provides commands, quality gates, and self-evaluation. Use it -- do not reinvent what it already does.

### 10 Entry Points (Use These, Not Individual Skills)

| When You Need To | Run | What Happens |
|-------------------|-----|-------------|
| Plan a feature | `/plan-ceo-review` | CEO vision review -> eng architecture review |
| Build something | `/build` | TDD, guided, or orchestrated build |
| Review code | `/unified-review` | 6 review approaches (adversarial, graph, delta) |
| Debug a bug | `/unified-debug` | Reproduce -> hypothesize -> test -> fix |
| Test the app | `/qa` | Headless browser QA, health score 0-100 |
| Ship to production | `/ship` | Self-eval -> review -> PR -> deploy |
| Security audit | `/unified-security` | OWASP, STRIDE, attack trees, SAST |
| Research a topic | `/research` | 8-phase pipeline with citation verification |
| Write content | `/unified-content` | Strategy -> research -> write -> audit |
| Review your session | `/retro` | Metrics, action items, retrospective |

Never browse the full 367 skill list. These 10 route to the right sub-skill automatically.

### Quality System (Auto-Enforced)

ProductionOS runs quality checks automatically. You do not need to invoke them manually.

**Self-Eval Protocol** (runs after every action):
1. Quality -- was the work actually good? (1-10 with evidence)
2. Necessity -- was this work needed? Any scope creep?
3. Correctness -- re-read output. Errors? Regressions?
4. Dependencies -- what else does this touch?
5. Completeness -- edge cases handled? TODOs resolved?
6. Learning -- patterns to remember?
7. Honesty -- inflating the score?

**Score Gating:** >= 8.0 PASS | 6.0-7.9 triggers self-heal (max 3 loops) | < 6.0 blocks and escalates.

**Quality Gates (thresholds):**
- Self-eval minimum: 8.0
- Max files per commit: 15
- Max lines per file change: 200
- Convergence: delta < 0.1 for 2 iterations = done
- Regression halt: dimension drop > 0.5 = STOP
- Cost ceiling: $20 USD per invocation

### Hooks (Auto-Enforced, Do Not Disable)

These run automatically on every tool use:
- **Pre-edit:** Scope enforcement, protected file guard (.env/keys/certs), security scan
- **Post-edit:** Self-learning, telemetry, review hints after 10+ edits, eval gate
- **Pre-bash:** Gitleaks secret detection on staged files
- **Session end:** Auto-handoff doc, instinct extraction, session eval

### Escalation Protocol

Escalate (do not push through) when:
- 3 failed attempts at the same fix
- Security-sensitive changes (auth, payment, credentials)
- Scope exceeds what you can verify
- Contradictory requirements

Format:
```
STATUS: BLOCKED | NEEDS_CONTEXT
REASON: {what went wrong}
ATTEMPTED: {what was tried}
RECOMMENDATION: {what to do next}
```

---

## Commits
- Conventional Commits: `type(scope): description`
- Types: feat, fix, refactor, docs, test, chore, ci, security, audit, session, perf, build, revert
- Branch: `<type>/<slug>` (e.g. `feat/user-auth`, `fix/email-parser`)
- Subject < 72 chars, imperative mood
- Stage specific files only. Never `git add -A` or `git add .`
- Run tests before committing. Never commit with failures.
- Reference issues: `fix: #4 migrate HTTPException`
- Use HEREDOC for multi-line messages

## Branch Strategy
- Feature: `feat/<slug>` | Bugfix: `fix/<slug>` | Docs: `docs/<slug>`
- One branch per issue. Squash merge to main via PR.
- Never push directly to main.

## Pull Requests
- Title < 70 chars, descriptive
- Body: Summary (what + why) + Test plan (checklist)
- Always use `--repo ShaheerKhawaja/<repo>` with gh commands
- CI must pass before merge
- Close stale PRs with explanation

## Worktrees
- One branch per worktree, one session per worktree
- Naming: `wt-<issue-number>-<slug>`
- Remove after merge. Never force-remove dirty worktrees.
- Copy `.env*` from main repo to new worktrees.

## Issue Tracking
- Start session: select issue (P0/P1/P2), self-assign, post plan
- During: reference issues in commits, post milestones
- End session: post "What landed" + "Next steps", close or update
- Labels: P0-critical, P1-high, P2-medium, P3-low, security, session-handoff

## Secrets (Non-Negotiable)
- NEVER commit API keys, tokens, passwords, or private keys
- NEVER echo, cat, or print .env files
- NEVER use --no-verify to skip hooks
- Secrets in .env.local (gitignored) or deployment secret manager only
- If Gitleaks flags your commit, remove the secret

## Upstream Protection
- NEVER interact with Entropy-Co upstream repos
- Only use ShaheerKhawaja forks with explicit --repo flag

## Completion Standard
100% completion required. No 80% work.

Self-review before every push:
1. Re-read every changed file line by line
2. Verify tests pass (run them, do not assume)
3. Check edge cases (empty, null, boundary values)
4. Verify the fix works (run it, see it work)
5. Review for security (XSS, injection, secrets, PII)
6. Check for regressions (did fixing X break Y?)

If self-review takes 2 hours for a 10-minute fix, that is acceptable.

## Session Protocol
- Start: read handoff docs, review open issues, `git log --oneline -10`
- During: reference issues in commits, post milestones
- End: handoff auto-generated by ProductionOS stop hooks
