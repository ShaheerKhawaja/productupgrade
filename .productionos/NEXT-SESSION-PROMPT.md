# ProductionOS v8.0 — Session Handover

## PROMPT START

Resume ProductionOS v8.0 development. This session continues from a massive build session that shipped 5 PRs (all merged, all CI green).

### Context Recovery

```bash
cd ~/productupgrade
git pull origin main
bun test  # Expect 589 pass, 0 fail
bun run validate  # Expect 73/73 agents valid
bun run skill:check  # Expect 9/10 or 10/10
```

Then load prior session context:
```
/mem-search "ProductionOS v8.0 autoresearch worktrees session"
```

Read these files for full context:
- `~/productupgrade/HANDOFF.md` — v7→v8 transition plan
- `~/productupgrade/.productionos/NEXT-SESSION-PROMPT.md` — this file
- `~/productupgrade/.productionos/HANDOFF-OPENSOURCE-SESSION.md` — security session handoff
- `~/productupgrade/.productionos/QA-CHECKLIST-OPENSOURCE.md` — 50+ verification items

### What Was Built (Previous Session)

**5 PRs merged to main, all green CI:**

| PR | What | Lines |
|---|---|---|
| #41 | Repo boundary guard, enriched /retro (69→280 lines), gitleaks secret detection, Docling document parser agent (#66) | +923 |
| #42 | Git worktree isolation (m13v patterns), quality gates (quality-gates.yml), Semgrep scanner agent, Tier 1 test framework (196→589 tests) | +721 |
| #43 | ast-grep analyzer agent, MODEL-ROUTING.md template, 4 new agents (complexity-analyzer, rule-engine, regression-detector, documentation-auditor) | +552 |
| #44 | Security hardening (15 vulnerabilities: 2 CRITICAL JSON injection, 6 HIGH shell injection/path traversal), PII scrub (30+ instances), SECURITY.md, CODE_OF_CONDUCT.md | +379 |
| #45 | Skill renaming (Dialkit→finetune-control, Design Critique→design-evaluator, Storyboard Animation→motion-system), enriched README with persona guides, open-source credits, PR #40 absorbed | +279 |

**Current state:** 73 agents | 35 commands | 11 hooks | 589 tests | v8.0.0-alpha.3

**GitHub issues closed:** #24, #25, #26, #27, #28, #31, #34, #35, #39 (partial), #40

### What to Build Next (Priority Order)

#### P0: Karpathy Autoresearch Integration

Build `/auto-optimize` command — self-improving agent loops inspired by https://github.com/karpathy/autoresearch

The pattern maps directly to ProductionOS:
- **Baseline** = current agent prompt/instructions
- **Challenger** = modified agent with hypothesis-driven changes
- **Metric** = self-eval score, test pass rate, convergence speed
- **Harvest** = compare before/after, keep winner
- **Resource.md** = instincts system (already exists at `~/.productionos/instincts/`)

Implementation:
1. New command: `.claude/commands/auto-optimize.md`
2. New agent: `agents/prompt-optimizer.md` (already partially planned for Sprint 5)
3. Integration with convergence engine for metric tracking
4. Cron-capable via GitHub Actions or `claude -p` loops
5. New command: `.claude/commands/session-validate.md` — end-of-session self-training

Memory reference: `project_autoresearch_integration.md` has full spec.

#### P1: m13v tmux-background-agents Integration

Enhance `scripts/worktree-manager.ts` and `agents/worktree-orchestrator.md` with patterns from https://github.com/m13v/tmux-background-agents:

1. Extend `WorktreeInfo` interface: add `lastActivityTime`, `initDelayMs`, `scopeHint`
2. Add health check loop: detect stalled worktrees (>5 min no activity)
3. Output capture: `.productionos/worktree-logs/{branch}.log` for crash diagnostics
4. Enhanced recovery: auto-stash → recovery branch → PR for human review
5. State machine expansion: add `pending-create`, `stalled`, `recovery-stashed` states
6. Scope hints in branch names: `swarm/wave-1-agent-3-auth-middleware`

Full integration spec available at: `/private/tmp/claude-501/.../tasks/aa3f099b0d6cc9890.output`

#### P2: Remaining v8.0 GitHub Issues

| Issue | Feature | Effort |
|---|---|---|
| #29 | CI-enforceable AI checks (GitHub Actions status checks) | M |
| #30 | tree-sitter codebase indexing with PageRank | L |
| #32 | Mem0 semantic memory (replace flat-file instincts) | L |
| #33 | OpenTelemetry tracing for agent orchestration | L |
| #36 | Event-sourced agent state with deterministic replay | L |
| #37 | DSPy prompt optimization for 73 agents | XL |
| #38 | Formal AgentInterface contract + orchestration swapping | L |
| #39 | Last 4 new agents (cost-tracker-agent, dependency-updater, dast-runner, migration-executor) | M |

#### P3: Production Polish

- Run `/production-upgrade` on ProductionOS itself (eat your own dogfood)
- Run `/retro` for session metrics
- Close the `public-main` orphan branch issue (documented in HANDOFF-OPENSOURCE-SESSION.md Issue #1)
- Add Tier 2 E2E tests (run commands via `claude -p`, ~$3.85/run)
- Add Tier 3 LLM-as-judge evals (~$0.15/run)

### Key Architecture Decisions Made

1. **Repo boundary guard uses single `active-project` file** (not PID-scoped) — hooks spawn as separate processes with different PIDs
2. **Quality gates are YAML-based** (`templates/quality-gates.yml`) with project-level overrides at `.productionos/quality-gates.yml`
3. **Model routing is 3-tier**: opus=planning, sonnet=execution, haiku=validation
4. **Version files must ALL be bumped together**: VERSION, package.json, plugin.json, marketplace.json, pos-init, test expectations
5. **Pin bun version in CI** (currently 1.3.10) — `bun-version: latest` causes 404s when new versions aren't released yet
6. **Security hooks use `jq -n --arg`** for JSON construction and `sys.argv` for Python string passing (prevents injection)
7. **Self-eval threshold set to 10.0** (v8.0 standard, up from 8.0 in v7.0)

### Key Files

| Purpose | Path |
|---------|------|
| ProductionOS repo | `~/productupgrade/` |
| Agents (73) | `~/productupgrade/agents/` |
| Commands (35) | `~/productupgrade/.claude/commands/` |
| Hooks (11) | `~/productupgrade/hooks/` |
| CLI tools (6) | `~/productupgrade/bin/` |
| Scripts (17+) | `~/productupgrade/scripts/` |
| Templates (8) | `~/productupgrade/templates/` |
| Tests (11 files) | `~/productupgrade/tests/` |
| Quality gates | `~/productupgrade/templates/quality-gates.yml` |
| Model routing | `~/productupgrade/templates/MODEL-ROUTING.md` |
| Worktree manager | `~/productupgrade/scripts/worktree-manager.ts` |
| Quality gate checker | `~/productupgrade/scripts/quality-gate-checker.ts` |
| Plugin config | `~/productupgrade/.claude-plugin/plugin.json` |
| Persistent state | `~/.productionos/` |
| Security handoff | `~/productupgrade/.productionos/HANDOFF-OPENSOURCE-SESSION.md` |
| QA checklist | `~/productupgrade/.productionos/QA-CHECKLIST-OPENSOURCE.md` |

### Comparison Context (gstack vs ProductionOS)

A deep comparison was done this session. Key findings:
- **ProductionOS wins**: recursive improvement, self-eval, tri-tiered judging, hooks, guardrails, cross-session learning, design mockups, UX analysis
- **gstack wins**: speed (native Playwright binary), simplicity (13 skills), maturity (2+ years battle-tested)
- **ProductionOS absorbed 14 gstack commands** natively in v7.0
- **Both properly credited** in README.md "Built On" section

### Retro Insights (from /retro output)

- 198 commits in 7 days, 127.8K net LOC, solo
- Test ratio 9.1% — needs to reach 20%+ (actionable: add test agent to every swarm wave)
- Backend has never run — `docker compose up` is highest-ROI 15 min for Entropy Studio
- orchestrator.py touched 29 times — interface needs stabilizing
- Fix ratio 42% — "ship fast, fix fast" cadence, healthy at this stage

### Execution Strategy

Use ProductionOS to build ProductionOS:
1. `/brainstorming` for autoresearch approach
2. `/plan-ceo-review` on scope (is self-improvement the right priority?)
3. `/plan-eng-review` on architecture (how does autoresearch map to convergence engine?)
4. `/auto-swarm-nth` with `--isolation worktree` for parallel execution
5. `/self-eval` after each batch
6. `/retro` at session end
7. `/review` before PR
8. `/ship` to merge

## PROMPT END
