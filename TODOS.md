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

#### ~~Cost ceiling on recursive commands (L-14)~~ DONE
**Status:** Preamble Step 0D-2.5 enforces cost ceiling: reads TOKEN-BUDGET.md, halts at ceiling, warns at 80%, defaults to $50.
**Effort:** S

#### ~~Schema validation on agent output (L-15)~~ DONE
**Status:** Preamble Step 0B now mandates Method 4 MANIFEST validation (from INVOCATION-PROTOCOL.md) on EVERY artifact read. Validation outcomes logged to ARTIFACT-VALIDATION.log. Invalid artifacts skip, pipeline continues degraded.
**Effort:** M

#### ~~Context overflow detection (L-16)~~ DONE
**Status:** Preamble Step 0E-2 now has concrete Bash command for token estimation, decision logic at 600K/750K thresholds, density-summarizer invocation, and HALT with STATE-CHECKPOINT.json.
**Effort:** M

#### ~~Wire orphaned agents to commands (L-21)~~ DONE
**Status:** Original 10 orphans already wired in prior sessions. Remaining 5 (aiml-engineer, guardrails-controller, infra-setup, plan-checker, recursive-orchestrator) wired to production-upgrade Step 1.5.
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

#### ~~Claim Analysis pass on findings~~ DONE
**Status:** Step 9.5 in `omni-plan.md`. A-F evidence rating, F-removed before commit.

#### ~~Nyquist behavioral test gap-filler~~ DONE
**Status:** `agents/nyquist-filler.md` — requirement extraction, coverage mapping, test generation.

#### ~~Session pause/resume~~ DONE
**Status:** `/productionos-pause` + `/productionos-resume` commands. Checkpoint at `.productionos/CHECKPOINT.json`.

#### ~~Model profile flag~~ DONE
**Status:** `--profile quality|balanced|budget` on omni-plan + production-upgrade. Budget enables ES-CoT, reduces layers.

#### ~~Per-agent cost tracking~~ DONE
**Status:** AgentRecord interface + recordAgentStart/End + formatAgentBreakdown in `scripts/cost-tracker.ts`.

#### ~~Export overallGrade from convergence.ts (DRY)~~ DONE
**Status:** convergence.ts exports overallGrade, dashboard imports it.

#### ~~Path traversal protection in security hook~~ DONE
**Status:** PreToolUse/PostToolUse hooks wired in hooks.json.

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

**Done:** 25 items (ALL P0 closed: 3 agents, rollback, cost ceiling L-14, wire orphans L-21, schema validation L-15, context overflow L-16 + scratchpad, generated knowledge, convergence wired, cost wired, security hook, distractor prompting, ES-CoT, DOWN gate, confidence calibration, cross-session learning, doc-release, convergence loop, discuss-phase enforcement, claim analysis, Nyquist filler, pause/resume, model profile, per-agent cost tracking, DRY export)
**Remaining:** 0 P0, 0 P1, 2 P2 (batch limit L-09, pre-commit diff L-10), 6 P3, 7 P4 = 15 items
