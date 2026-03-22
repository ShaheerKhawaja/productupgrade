# ProductionOS v7.0 → v8.0 Session Handoff

**Date:** March 21, 2026 | **Duration:** ~2.5 hours | **Model:** Opus 4.6 (1M context)

---

## What This Session Accomplished

### v7.0 Shipped (PRs #15, #16 merged to main)

**8 new agents:**
- `self-evaluator` — 7-question self-eval, score gating, self-heal loops
- `designer-upgrade` — UI/UX redesign orchestrator (5-phase pipeline)
- `mockup-generator` — Self-contained HTML mockups with annotation overlay
- `design-system-architect` — Token system creation from codebase analysis
- `ux-genie` — User stories, journey maps, friction analysis
- `user-story-mapper` — Story map organization (backbone → walking skeleton → iterations)
- `quality-loop-controller` — Self-check → self-eval → self-heal → learn cycle
- `session-context-manager` — L0/L1/L2 progressive loading, context rot detection

**3 new commands:**
- `/self-eval` — Standalone self-evaluation (also default-on in all flows)
- `/designer-upgrade` — Full UI/UX redesign pipeline
- `/ux-genie` — User stories + journey improvement pipeline

**1 new template:**
- `SELF-EVAL-PROTOCOL.md` — 7-question protocol embedded in PREAMBLE postamble

**Infrastructure updates:**
- PREAMBLE.md — Added postamble with self-eval integration
- INVOCATION-PROTOCOL.md — Added design/UX/quality sections
- CLAUDE.md — Full v7 rewrite (4 primary commands, new features)
- ARCHITECTURE.md — Full v7 rewrite with ALL original sections preserved
- hooks.json, package.json, plugin.json, marketplace.json, VERSION — Updated to v7.0
- pos-init — Added self_eval config option
- Tests — All 196 pass, 0 fail

**Score: 7.8/10** (from consolidated CEO + Eng + Deep Research review)

---

## What v8.0 Should Do (User's Direction)

### Primary Goal: Full Skill Absorption

Make ProductionOS **100% self-contained** — no external plugin dependencies for core functionality. Absorb gstack, superpowers, and ECC skills natively.

### External Skills to Audit and Absorb

#### Gstack (22 skills at ~/repos/gstack/)
| Skill | Priority | ProductionOS Equivalent | Action |
|-------|----------|------------------------|--------|
| `/browse` | P0 | None — critical for QA | ABSORB as agent |
| `/qa` | P0 | Partial via ux-auditor | ABSORB as command |
| `/qa-only` | P0 | None | ABSORB as command |
| `/review` | P0 | code-reviewer agent | MERGE — enhance existing |
| `/ship` | P0 | gitops agent | MERGE — enhance existing |
| `/plan-ceo-review` | P0 | None — critical for vision | ABSORB as command |
| `/plan-eng-review` | P0 | None — critical for architecture | ABSORB as command |
| `/plan-design-review` | P1 | designer-upgrade covers this | SKIP — already covered |
| `/design-review` | P1 | designer-upgrade | SKIP — already covered |
| `/design-consultation` | P1 | design-system-architect | SKIP — already covered |
| `/document-release` | P1 | None | ABSORB as command |
| `/retro` | P1 | None | ABSORB as command |
| `/setup-browser-cookies` | P2 | None | ABSORB as utility |
| `/gstack-upgrade` | P2 | productionos-update | SKIP — not needed |

#### Superpowers (14 skills at ~/.claude/skills/)
| Skill | Priority | ProductionOS Equivalent | Action |
|-------|----------|------------------------|--------|
| `/brainstorming` | P0 | None — critical for feature work | ABSORB as command |
| `/writing-plans` | P0 | dynamic-planner agent | ABSORB as command |
| `/test-driven-development` | P0 | test-architect agent | ABSORB as command |
| `/systematic-debugging` | P0 | self-healer agent (partial) | ABSORB as command |
| `/dispatching-parallel-agents` | P0 | auto-swarm-nth (covers this) | SKIP — already covered |
| `/subagent-driven-development` | P0 | auto-swarm-nth | SKIP — already covered |
| `/requesting-code-review` | P1 | code-reviewer agent | MERGE |
| `/receiving-code-review` | P1 | None | ABSORB as protocol |
| `/using-git-worktrees` | P1 | None | ABSORB as utility |
| `/verification-before-completion` | P1 | self-evaluator (covers this) | SKIP — v7 covers |
| `/executing-plans` | P1 | auto-swarm-nth | SKIP |
| `/finishing-a-development-branch` | P2 | gitops agent | MERGE |
| `/code-review` | P1 | code-reviewer | MERGE |
| `/review-pr` | P1 | code-reviewer | MERGE |

#### ECC Notable Skills
| Skill | Priority | Action |
|-------|----------|--------|
| `/tdd-workflow` | P1 | Already have test-architect — MERGE |
| `/security-review` | P1 | Already have security-hardener — MERGE |
| `/python-review` | P2 | Already have code-reviewer — SKIP |
| `/go-review` | P2 | SKIP unless Go projects |
| `/continuous-learning-v2` | P0 | ABSORB instinct system |

### Absorption Strategy

**Phase 1: P0 Skills (10 skills)**
```
/auto-swarm-nth "Absorb P0 skills into ProductionOS:
1. /browse → agents/browser-controller.md + .claude/commands/browse.md
2. /qa → .claude/commands/qa.md
3. /qa-only → .claude/commands/qa-only.md
4. /plan-ceo-review → .claude/commands/plan-ceo-review.md
5. /plan-eng-review → .claude/commands/plan-eng-review.md
6. /brainstorming → .claude/commands/brainstorming.md
7. /writing-plans → .claude/commands/writing-plans.md
8. /test-driven-development → .claude/commands/tdd.md
9. /systematic-debugging → .claude/commands/debug.md
10. /continuous-learning-v2 instinct system → hooks/stop-extract-instincts.sh upgrade"
```

**Phase 2: P1 Merges (8 skills)**
Enhance existing agents with capabilities from external skills.

**Phase 3: /pos Smart Router**
Single command that routes to the right pipeline based on intent.

### Copy-Paste Prompt for Next Session

```
Resume ProductionOS v7.0 → v8.0 (Full Skill Absorption).

Context:
1. /mem-search "ProductionOS v7 skill absorption"
2. Read ~/.claude/plugins/marketplaces/productupgrade/HANDOFF.md
3. cd ~/productupgrade && bun test (expect 196+ pass)

This session: Built v7.0 with 8 new agents, 3 new commands, self-eval protocol.
PRs #15-#16 merged. Score: 7.8/10. 196 tests pass.

Next session goal: Absorb gstack + superpowers + ECC skills natively.
10 P0 skills to absorb, 8 P1 skills to merge.

Sources:
- Gstack: ~/repos/gstack/ (22 skills)
- Superpowers: ~/.claude/skills/ (14 skills)
- ECC: ~/.claude/plugins/cache/everything-claude-code/

Strategy: /auto-swarm-nth parallel absorption.

Run: /auto-swarm-nth "Absorb P0 skills from gstack/superpowers into ProductionOS" --depth ultra
```

---

## Directories to Access

| Purpose | Path |
|---------|------|
| ProductionOS repo | `~/.claude/plugins/marketplaces/productupgrade/` |
| Agents (65) | `~/.claude/plugins/marketplaces/productupgrade/agents/` |
| Commands (35) | `~/.claude/plugins/marketplaces/productupgrade/.claude/commands/` |
| Skills (4) | `~/.claude/plugins/marketplaces/productupgrade/.claude/skills/` |
| Hooks (10) | `~/.claude/plugins/marketplaces/productupgrade/hooks/` |
| CLI tools (6) | `~/.claude/plugins/marketplaces/productupgrade/bin/` |
| Templates (7) | `~/.claude/plugins/marketplaces/productupgrade/templates/` |
| Tests (9 files) | `~/.claude/plugins/marketplaces/productupgrade/tests/` |
| Plugin cache | `~/.claude/plugins/cache/productupgrade/productupgrade/3.0.0/` |
| Persistent state | `~/.productionos/` |
| Gstack source | `~/repos/gstack/` |
| Superpowers skills | `~/.claude/skills/` |
| ECC source | `~/.claude/plugins/cache/everything-claude-code/everything-claude-code/1.8.0/` |
| Consolidated review | `~/.claude/plugins/marketplaces/productupgrade/.productionos/V7-CONSOLIDATED-REVIEW.md` |

---

## Score Trajectory

```
v5.3: 4.1/10 (orchestration only, 1 hook, 0 CLI tools)
v6.0: 9.7/10 (9 hooks, 6 CLI, native embedding)
v7.0: 7.8/10* (self-eval, design, UX — but score dropped because new dimensions added)
v8.0: target 10/10 (fully self-contained, no external deps)
```

*v7.0 score is lower than v6.0 because the review added new dimensions (ease-of-use, documentation) that weren't scored before. The actual capabilities increased significantly.
