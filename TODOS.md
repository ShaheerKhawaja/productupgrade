# TODOS

Organized by priority. P0 = critical, P4 = nice-to-have.
Items marked ~~strikethrough~~ are DONE.

## V5.3 — Current Gaps (from Loophole Audit + Eng Review)

### P0 — Critical (system integrity)

#### ~~Discuss-Phase agent~~ DONE
**Status:** `agents/discuss-phase.md` (358 lines) — pre-pipeline decision capture

#### ~~Stub Detector agent~~ DONE
**Status:** `agents/stub-detector.md` (712 lines) — wired vs placeholder detection

#### ~~Plan Checker agent~~ DONE
**Status:** `agents/plan-checker.md` (474 lines) — pre-execution plan validation

#### ~~Rollback mechanism~~ DONE (L-08)
**Status:** `git stash` rollback added to production-upgrade Step 4 and omni-plan Step 9

#### Cost ceiling on recursive commands (L-14)
**What:** /omni-plan-nth and /auto-swarm-nth have no hard cost limit. User can walk away and burn entire API budget.
**Fix:** Add `--max-cost $X` flag. Preamble checks accumulated cost before each iteration and halts if exceeded.
**Effort:** S

#### Schema validation on agent output (L-15)
**What:** No validation that agent output matches expected format. Malformed output silently passes to downstream agents.
**Fix:** Add MANIFEST block validation (producer, timestamp, status fields) in consuming commands before reading artifacts.
**Effort:** M

#### Context overflow detection (L-16)
**What:** No auto-compaction trigger. Context fills mid-pipeline → Claude auto-compacts → loses iteration state.
**Fix:** Track token accumulation per iteration. When approaching 80% of context limit, trigger density-summarizer to compress.
**Effort:** M

#### Wire 10 orphaned agents to commands (L-21)
**What:** 10 of 48 agents are never invoked by any command. Dead code: density-summarizer, thought-graph-builder, persona-orchestrator, frontend-scraper, convergence-monitor, metaclaw-learner, comms-assistant, asset-generator, ecosystem-scanner (in some commands), performance-profiler.
**Fix:** Add agent dispatch to relevant command phases. E.g., density-summarizer in omni-plan Step 12, persona-orchestrator in agentic-eval.
**Effort:** M

### P1 — High (core value)

#### ~~Scratchpad / Inner Monologue~~ DONE
**Status:** Added as Layer 2.5 in `templates/PROMPT-COMPOSITION.md`

#### ~~Generated Knowledge Prompting~~ DONE
**Status:** Added as Layer 8 in `templates/PROMPT-COMPOSITION.md`

#### ~~Convergence engine wired to commands~~ DONE (L-04)
**Status:** omni-plan Step 12 now calls `bun run scripts/convergence.ts`

#### ~~Cost tracking wired to preamble~~ DONE (L-05)
**Status:** PREAMBLE Step 0D-2 now calls `bun run scripts/cost-tracker.ts`

#### ~~Security hook (fail-closed)~~ DONE
**Status:** `hooks/protected-file-guard.sh` blocks .env/keys, fails closed without jq

#### ~~Distractor-Augmented Prompting~~ DONE
**Status:** Added as Layer 9 in `templates/PROMPT-COMPOSITION.md`. Applied to Judge + Adversarial agents.

#### ~~ES-CoT for cost mode~~ DONE
**Status:** Added as Layer 4 subsection in `templates/PROMPT-COMPOSITION.md` + profile detection in `PREAMBLE.md` Step 0D-3.

#### ~~DOWN (confidence-gated debate)~~ DONE
**Status:** Added confidence-gated fast-path before Tri-Tiered Judge Panel in `omni-plan.md` Step 7. Threshold: 8.5/10.

#### ~~Confidence Calibration in judge~~ DONE
**Status:** All judge scores now `X.X ± Y.Y` with CI-based consensus in `omni-plan.md` Step 7.

#### ~~Cross-session learning (enhance self-learn.sh)~~ DONE
**Status:** `hooks/self-learn.sh` v2 — aggregates across sessions every 100 entries, writes `CROSS-SESSION-PATTERNS.md` with hot files, fail patterns, dispatch frequency. Graceful degradation without jq.

#### ~~Document-release post-pipeline~~ DONE
**Status:** 6-point doc sync added to `omni-plan.md` Step 13 and `production-upgrade.md` Step 6. Auto-fixes count drift, version mismatches.

#### ~~/production-upgrade convergence loop (L-20)~~ DONE
**Status:** `--converge` flag in `production-upgrade.md`. Default target: 10.0 (perfection). Max 5 iterations. Regression detection + diminishing returns halt.

#### ~~Enforce discuss-phase before pipeline (L-17)~~ DONE

### P2 — Medium

#### Max 15 files/batch enforcement (L-09)
**What:** Guardrail is documented but not enforced. No code counts files in a batch.
**Effort:** S

#### Pre-commit diff review enforcement (L-10)
**What:** Guardrail is documented but not enforced by any hook.
**Effort:** S

#### Claim Analysis pass on findings
**What:** Rate each agent finding A-F on evidence quality. Remove D/F rated findings.
**Effort:** M

#### Nyquist behavioral test gap-filler
**What:** Generate tests for requirements that have no automated coverage.
**Effort:** L

#### Session pause/resume
**What:** `/productionos pause` saves state. `/productionos resume` restores.
**Effort:** M

#### Model profile flag
**What:** `--profile budget` downgrades all agents proportionally.
**Effort:** S

#### Per-agent cost tracking
**What:** Track tokens, time, and retries per agent per run. Extend cost-tracker.ts.
**Effort:** M

#### Export overallGrade from convergence.ts (DRY)
**What:** convergence-dashboard.ts duplicates overallGrade. Export and import instead.
**Effort:** S

#### Path traversal protection in security hook
**What:** Security hook only checks basename. `../../.env` bypasses it.
**Effort:** S

### P3 — Low

#### Git worktree isolation per batch
**What:** Each execution batch runs in an isolated worktree.
**Effort:** M

#### 3-tier automated testing
**What:** Static (free) + E2E via `claude -p` (~$4) + LLM-judge (~$0.15).
**Effort:** L

#### Behavioral tests (run commands, verify output)
**What:** Currently 0 tests run actual commands. Add 3+ behavioral tests.
**Source:** RESEARCH-TESTING.md Tier 3
**Effort:** M

#### Template-generated SKILL.md
**Effort:** L

#### TextGrad pipeline self-optimization
**Effort:** XL

#### OPRO rubric self-evolution
**Effort:** L

### P4 — Future

#### RAG/RLM context management library (separate repo)
**What:** Proprietary retrieval + recursive prompt recall. L0/L1/L2 progressive loading.
**Source:** RESEARCH-RAG-RLM.md (57KB spec ready)
**Effort:** XL

#### Frontend skill library (5 new agents + 15 patterns)
**What:** Component generation, design system enforcement, page assembly.
**Source:** RESEARCH-FRONTEND-LIBRARY.md (36KB spec ready)
**Effort:** XL

#### Non-tech bridge (intent-translator agent)
**What:** 4-layer translation from business language to technical spec.
**Source:** RESEARCH-NONTECH-BRIDGE.md (32KB spec ready)
**Effort:** L

#### Domain-Specific Constitutional AI
**Effort:** M

#### Harness self-audit
**Effort:** M

#### Retro with per-agent metrics
**Effort:** M

#### `/productionos stats` command
**Effort:** M

## Score

**Done:** 20 items (4 P0 loopholes, 3 P0 agents, rollback, scratchpad, generated knowledge, convergence wired, cost wired, security hook, distractor prompting, ES-CoT, DOWN gate, confidence calibration, cross-session learning, doc-release, convergence loop)
**Remaining:** 0 P0, 0 P1, 5 P2, 6 P3, 7 P4 = 18 items
