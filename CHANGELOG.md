# Changelog

## [7.0.0] - 2026-03-21

### Added — The Design Conscience
- **Self-Evaluation Protocol (default-on)** — 7-question self-eval after every agent action: quality, necessity, correctness, dependencies, completeness, learning, honesty
- **Quality Loop Controller** — Self-check → Self-eval → Self-heal → Learn cycle with score gating (>= 8.0 pass, 6.0-7.9 self-heal, < 6.0 block)
- **`/self-eval` command** — Standalone evaluation of last output, session, or git diff
- **`/designer-upgrade` command** — Full UI/UX redesign pipeline: audit → design system → interactive HTML mockups → browser annotation → implementation plan
- **`/ux-genie` command** — User stories from UI guidelines, journey mapping, friction analysis, agent dispatch
- **`/build-productionos` command** — Smart router that routes any intent to the right pipeline
- **8 new agents** — self-evaluator, designer-upgrade, mockup-generator, design-system-architect, ux-genie, user-story-mapper, quality-loop-controller, session-context-manager
- **14 absorbed commands** — brainstorming, writing-plans, tdd, debug, plan-ceo-review, plan-eng-review, review, ship, qa, qa-only, browse, retro, document-release (from gstack, superpowers, ECC)
- **Session context management** — L0/L1/L2 progressive loading, context rot detection, cross-session instinct transfer
- **SELF-EVAL-PROTOCOL.md template** — Embedded in PREAMBLE postamble for all flows

### Changed
- Agent count: 56 → 65
- Command count: 21 → 35
- Zero external dependencies — all core workflows absorbed natively
- CLAUDE.md, ARCHITECTURE.md, PREAMBLE.md, INVOCATION-PROTOCOL.md rewritten for v7
- VERSION: 6.3.0 → 7.0.0

## [6.0.0] - 2026-03-20

### Added — Native Embedding Architecture
- **Hook infrastructure** — 9 hook scripts across SessionStart/PreToolUse/PostToolUse/Stop (was: 1 banner)
- **PreToolUse security scan** — Detects edits to auth/payment/credential files, emits advisory
- **PostToolUse telemetry** — Logs all edits and bash commands to analytics JSONL
- **PostToolUse review hints** — Suggests code review after 10+ edits per session
- **Stop session handoff** — Auto-generates session summary with event counts and security edits
- **Stop instinct extraction** — Extracts patterns from session analytics at session end
- **CLI tools (bin/)** — `pos-init`, `pos-config`, `pos-analytics`, `pos-update-check`, `pos-review-log`, `pos-telemetry`
- **Persistent state (~/.productionos/)** — Config, analytics, sessions, instincts, review-log, cache
- **Auto-activating skills** — 4 skills with filePattern/bashPattern metadata (security-scan, productionos, frontend-audit, continuous-learning)
- **Declarative agents** — All 55 agents with YAML frontmatter (model, tools, subagent_type, stakes)
- **Stakes classification** — HumanLayer-inspired LOW/MEDIUM/HIGH on all agents
- **Red Flags** — Behavioral guardrails (anti-patterns) on all 55 agents
- **Preamble pattern** — Universal init template for all skills (config, sessions, analytics)
- **`/frontend-upgrade`** — CEO vision + eng review + parallel swarm execution pipeline
- **Continuous learning skill** — Instinct-based learning with confidence scoring and auto-promotion

### Changed
- **hooks.json** — From inline echo banner to 4 hook types with 8 entries referencing script files
- **CLAUDE.md** — Rewritten for v6.0 with hook architecture, CLI tools, auto-activation, stakes
- **plugin.json** — Updated description and version to 6.0.0

### Architecture (12-Factor-Agents + HumanLayer)
- Small, focused hooks (not monolithic orchestration)
- Stakes classification on every agent (HIGH/MEDIUM/LOW)
- Human contact via tools pattern (approval as tool call)
- Unified state at ~/.productionos/ (not per-project only)
- Session awareness via PID tracking

## [5.3.0] - 2026-03-19

### Added
- **10-layer prompt composition** — Added Layer 9 (Distractor-Augmented Prompting, +460% accuracy on judge agents) and ES-CoT early stopping for budget mode (~41% token savings)
- **DOWN confidence-gated debate** — Single-judge fast-path when confidence >= 8.5, skips full 3-judge panel (6x efficiency)
- **Confidence calibration** — All judge scores now X.X ± Y.Y with CI-based consensus protocol
- **`/productionos-pause` + `/productionos-resume`** — Pipeline state checkpointing and resumption
- **`--converge` flag** on /production-upgrade — Recursive convergence loop, default target 10.0 (perfection)
- **`--profile` flag** on /omni-plan + /production-upgrade — quality | balanced | budget model profiles
- **Claim Analysis (Step 9.5)** — A-F evidence rating on every agent finding, F-rated removed before commit
- **Per-agent cost tracking** — AgentRecord interface with tokens/cost/retries/status per agent
- **Cross-session learning v2** — Aggregates patterns across sessions, writes CROSS-SESSION-PATTERNS.md
- **Nyquist filler agent** — Test gap analysis with requirement extraction and coverage mapping
- **6 new agents** — discuss-phase, stub-detector, plan-checker, architecture-designer, intake-interviewer, nyquist-filler, prd-generator, requirements-tracer, scaffold-generator

### Fixed
- **P0: Cost ceiling** — `--max_cost` flag on /omni-plan-nth + /auto-swarm-nth with mandatory Phase 0 check
- **P0: Schema validation** — MANIFEST Method 4 artifact validation in INVOCATION-PROTOCOL
- **P0: Context overflow** — density-summarizer trigger at 75%/93% thresholds in PREAMBLE
- **P0: Orphan agents** — Wired performance-profiler, persona-orchestrator, comms-assistant, density-summarizer
- **P1: Discuss-phase enforcement** — Auto-invoke if DECISIONS-LOCKED.md missing
- **P1: Batch limits** — 15-file enforcement in production-upgrade Step 4
- **P1: Pre-commit diff review** — git diff --stat display before commit
- **P2: DRY** — Export overallGrade from convergence.ts, import in dashboard
- **P2: Path traversal** — PreToolUse/PostToolUse hooks for protected-file-guard
- **Document-release post-pipeline** — 6-point doc sync in omni-plan Step 13 + production-upgrade Step 6

### Stats
- 49 agents (was 43), 17 commands (was 14), 10 prompt layers (was 9)
- 118 tests passing, 0 failures
- All P0 + P1 + P2 loophole audit items closed (25/25)

## [5.2.0] - 2026-03-18

### Added

- **`/max-research` command** — Nuclear-scale autonomous research pipeline that deploys 500-1000 agents in ONE massive simultaneous wave for exhaustive topic saturation. Features:
  - Single massive dispatch: all agents launched simultaneously via background Agent tool calls
  - 10-25 domain decomposition with orthogonal research tracks
  - Per-agent 9-layer prompt composition (Emotion → Meta → Context → CoT → ToT → GoT → CoD → Scratchpad → Generated Knowledge)
  - Deep-research 8-phase methodology compressed into per-agent instructions
  - Hierarchical synthesis: per-domain → cross-domain → master report
  - Mandatory usage warning with resource consumption estimates
  - Quality gates: 4-layer citation verification, confidence scoring, deduplication
  - Knowledge archival with reusable context packages for future research
  - Scale tiers: 500 / 750 / 1000 agents (configurable)

### Changed

- Updated CLAUDE.md to v5.2 with `/max-research` in command registry, orchestration hierarchy, and mode comparison table
- Added "Nuclear Scale" command category above Specialized commands
- Updated agent limit comparison: `/max-research` supports 500-1000 agents (single wave) vs `/omni-plan-nth` 420 agents (iterative)

## [5.1.0] - 2026-03-18

### Added

- **6 new agents (29 → 35):**
  - `gitops` (690 lines) — Git workflow orchestrator with pre-contribution analysis, branch management, commit hygiene, PR creation, issue tracking, and sub-agent coordination with code-reviewer and self-healer
  - `frontend-designer` (571 lines) — Design system generation, component architecture, empathy mapping (Think/Feel/Say/Do), user journey mapping, time-to-first-value analysis, motion design, responsive/accessibility audit
  - `asset-generator` (523 lines) — AI image generation via Nano Banana 2, FAL AI, Replicate APIs; asset storage pipeline with semantic naming and responsive variants; frontend integration for Next.js/CSS/OG
  - `comms-assistant` (562 lines) — README/CHANGELOG/PR description generation with code accuracy cross-referencing; documentation accuracy audit; release notes
  - `comparative-analyzer` (516 lines) — Side-by-side codebase comparison, architecture A/B analysis, competitive analysis, before/after delta analysis, technology evaluation
  - `reverse-engineer` (812 lines) — Architecture extraction, decision archaeology via git blame, design pattern recognition, API surface mapping, security model extraction, replication guides

- **TypeScript infrastructure (0 → 8 files, 1,483 lines):**
  - `package.json` with Bun build system (9 scripts)
  - `scripts/gen-skill-docs.ts` — validates version/agent/command consistency
  - `scripts/skill-check.ts` — 10-check health dashboard (10/10 passing)
  - `scripts/validate-agents.ts` — frontmatter validation for all 48 agents
  - `scripts/context-audit.ts` — token budget tracking and overload detection
  - `scripts/review-dashboard.ts` — review readiness dashboard (gstack pattern)
  - `scripts/artifact-manifest.ts` — cross-command artifact flow tracking
  - `tests/skill-validation.test.ts` — 19 automated tests

- **Shared preamble template** (`templates/PREAMBLE.md`) — universal Step 0 protocol for all commands
- **Review Readiness Dashboard** — tracks which reviews passed per branch, gates delivery
- **Artifact manifest system** — tracks cross-command data flow (.productionos/manifest.json)
- **gstack deep reverse engineering report** (`.productionos/GSTACK-REVERSE-ENGINEER.md`)

### Changed

- **CLAUDE.md** — rewritten for V5.1 (48 agents, 13 commands, on-demand agent loading, cost budgets)
- **SKILL.md** — updated with V5.1 agent roster (4 categories: Core, Advanced, V4+, V5.1)
- **All 29 existing agents** — branding updated from "ProductUpgrade" to "ProductionOS", output paths from `.productupgrade/` to `.productionos/`
- **hooks/hooks.json** — simplified to clean text banner (removed 268KB ASCII art), removed PostToolUse overhead
- **marketplace.json** — updated from V1 (1.0.0, "54 agents") to V5.1 (5.1.0, "48 agents")
- **plugin.json** — version 5.1.0, updated description
- **All commands** — stale references fixed (.productupgrade → .productionos, /ultra-upgrade → /omni-plan)

### Removed

- **`skills-bundle/` directory** (268KB) — all 22 bundled skills were duplicates of already-installed plugins (gstack, superpowers, everything-claude-code). Removal eliminated the root cause of 529 API overloaded errors.
- **PostToolUse `self-learn.sh` hook** from hooks.json — fired on every Edit/Write/Bash/Agent call, adding overhead without actionable output
- **ASCII art banner** (2KB per session) — replaced with clean text banner

### Fixed

- **529 `overloaded_error`** — root cause was 466KB of context injection (268KB skills-bundle + 164KB agent preloading + PostToolUse hook overhead). Auto-loaded context reduced from ~140K tokens to 6.4KB.
- **97 CRITICAL consistency issues** — version drift (V1/V4/V5 mixed), stale command names (/ultra-upgrade, /productupgrade), wrong agent counts (25/32/54), wrong output directories
- **All stale `.productupgrade/` references** across 29 agent files → `.productionos/`

## [5.0.0] - 2026-03-18

### Added

- **Rebrand from ProductUpgrade to ProductionOS** — evolved from code audit tool to full agentic development OS
- **7 new commands:** `/omni-plan` (13-step pipeline), `/deep-research` (8-phase research), `/agentic-eval` (CLEAR v2.0), `/security-audit` (7-domain), `/context-engineer`, `/logic-mode` (business validation), `/learn-mode` (code tutor)
- **Command renames:** `/productupgrade` → `/production-upgrade`, `/productupgrade-update` → `/productionos-update`
- **Tri-tiered evaluation architecture** — Judge 1 (Opus/correctness), Judge 2 (Sonnet/practicality), Judge 3 (Adversarial/attack surface)

### Removed

- `/ultra-upgrade` command — functionality merged into `/omni-plan`

## [4.1.0] - 2026-03-18

### Added

- `research-pipeline` agent — 8-phase autonomous research with citation verification
- `security-hardener` agent — 734 cybersecurity skills, 7-domain audit
- `decision-loop` agent — autonomous PIVOT/REFINE/PROCEED decisions
- `metaclaw-learner` agent — cross-run learning with 30-day time-decay

### Changed

- `self-healer` agent — 10-round iterative healing (up from 3)
- Plugin version bumped to 4.1.0 (29 agents)

## [4.0.0] - 2026-03-18

### Added

- `/auto-swarm` — distributed agent orchestration (5 modes, configurable depth)
- 14 new agents (adversarial-reviewer through convergence-monitor)
- 9-layer prompt composition (CoT, ToT, GoT, CoD, Emotion, Meta, Context, Scratchpad, Generated Knowledge)
- Self-learning PostToolUse hook
- ARCHITECTURE.md, CONTRIBUTING.md, CHANGELOG.md, TODOS.md

### Changed

- Plugin version bumped from 1.0.0 to 4.0.0
- SKILL.md and CLAUDE.md rewritten for V4

## [3.0.0] - 2026-03-17

- V3 ASCII banner and marketplace metadata

## [2.1.0] - 2026-03-17

- Auto-swarm and guardrails design (not yet committed)

## [1.0.0] - 2026-03-17

- Initial release: 11 core agents, `/productupgrade` command, 10-dimension rubric
