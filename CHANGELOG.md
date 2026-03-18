# Changelog

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
  - `scripts/validate-agents.ts` — frontmatter validation for all 35 agents
  - `scripts/context-audit.ts` — token budget tracking and overload detection
  - `scripts/review-dashboard.ts` — review readiness dashboard (gstack pattern)
  - `scripts/artifact-manifest.ts` — cross-command artifact flow tracking
  - `tests/skill-validation.test.ts` — 19 automated tests

- **Shared preamble template** (`templates/PREAMBLE.md`) — universal Step 0 protocol for all commands
- **Review Readiness Dashboard** — tracks which reviews passed per branch, gates delivery
- **Artifact manifest system** — tracks cross-command data flow (.productionos/manifest.json)
- **gstack deep reverse engineering report** (`.productionos/GSTACK-REVERSE-ENGINEER.md`)

### Changed

- **CLAUDE.md** — rewritten for V5.1 (35 agents, 10 commands, on-demand agent loading, cost budgets)
- **SKILL.md** — updated with V5.1 agent roster (4 categories: Core, Advanced, V4+, V5.1)
- **All 29 existing agents** — branding updated from "ProductUpgrade" to "ProductionOS", output paths from `.productupgrade/` to `.productionos/`
- **hooks/hooks.json** — simplified to clean text banner (removed 268KB ASCII art), removed PostToolUse overhead
- **marketplace.json** — updated from V1 (1.0.0, "54 agents") to V5.1 (5.1.0, "35 agents")
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
- 7-layer prompt composition (CoT, ToT, GoT, CoD, Emotion, Meta, Context)
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
