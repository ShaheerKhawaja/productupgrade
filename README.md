# ProductionOS

[![CI](https://github.com/ShaheerKhawaja/ProductionOS/actions/workflows/ci.yml/badge.svg)](https://github.com/ShaheerKhawaja/ProductionOS/actions/workflows/ci.yml)

**One command. Your entire codebase reviewed, scored, and improved.**

ProductionOS is a dual-target AI engineering OS for Claude Code and Codex with 80 agents, 41 commands, 51 skills, and 15 hooks. It deploys specialized agents that review your code, find issues, fix them, and keep improving until every quality dimension hits the target. Smart routing dispatches the right workflow for your goal automatically.

## Quick Start

```bash
# Step 1: Add the marketplace (one time)
claude plugin marketplace add ShaheerKhawaja/ProductionOS

# Step 2: Install the plugin
claude plugin install productionos

# Step 3: Restart Claude Code, then run on any codebase
/production-upgrade
```

**Alternative: Manual install (if marketplace commands fail)**

```bash
# Clone directly into the plugins directory
git clone https://github.com/ShaheerKhawaja/ProductionOS.git \
  ~/.claude/plugins/marketplaces/productionos

# Restart Claude Code — hooks, commands, and agents load automatically
```

**Verify installation:**

```bash
# Check the plugin is recognized
claude plugin list

# Validate the plugin schema
claude plugin validate ~/.claude/plugins/marketplaces/productionos/.claude-plugin/marketplace.json
```

That's it. ProductionOS discovers your stack, deploys 7 review agents in parallel, scores your code across 10 dimensions, and generates a fix plan. Run it again — the score goes up.

### Codex CLI Skill Install

```bash
npx productionos@latest --codex
```

This installs:
- `~/.codex/skills/productionos`
- `~/.codex/plugins/productionos`
- `~/.codex/skills/productionos-<workflow>` aliases for every ProductionOS workflow

Restart Codex to pick up the new skill and plugin.

### Install For Claude + Codex Together

```bash
npx productionos@latest --all-targets
```

### Codex App / Plugin Surface

ProductionOS now ships a native Codex plugin manifest at `.codex-plugin/plugin.json` plus a plugin skill at `skills/productionos/SKILL.md`.

Recommended Codex usage:
- `$productionos` for the umbrella workflow router
- `$productionos-review`, `$productionos-plan-eng-review`, `$productionos-production-upgrade`, etc. for direct workflow entrypoints

## What It Does

### The Core Loop

```
DISCOVER → REVIEW → PLAN → FIX → VALIDATE → repeat until 10/10
```

1. **`/production-upgrade`** — Audit + fix any codebase. Deploys 7 parallel agents (CEO strategic, engineering, code quality, security, UX, backend, database). Shows BEFORE → AFTER scores.

2. **`/omni-plan-nth`** — The recursive orchestrator. Chains every available skill, loops until every quality dimension scores 10/10. No shortcuts, no "good enough."

3. **`/auto-swarm-nth`** — Throw 7 parallel agents at any task. Each wave covers gaps the last missed. Supports worktree isolation for zero-conflict parallel execution.

4. **`/designer-upgrade`** — Full UI/UX redesign: audit → design system → interactive HTML mockups → browser annotation → implementation plan.

### Safety & Guardrails

Every action runs through these checks:

- **Self-Eval Protocol** — 7 questions after every agent action (quality, necessity, correctness, dependencies, completeness, learning, honesty). Score gating: pass, self-heal, or block.
- **Repo Boundary Guard** — Prevents agents from editing files outside your project. Hard-blocks git operations in wrong repos.
- **Secret Detection** — gitleaks + regex fallback blocks commits containing API keys, tokens, passwords.
- **Protected Files** — `.env`, credentials, keys, certs blocked from writes.
- **Approval Gate** — High-stakes actions (deploy, auth changes, push) require explicit approval.

### For Different Users

#### Solo Founders / Small Teams
You need the output of a 10-person team but have 1-2 people. ProductionOS fills the roles:

| Role | ProductionOS Equivalent |
|------|------------------------|
| Code Reviewer | `code-reviewer` agent (2-pass: critical + informational) |
| QA Engineer | `/qa` command + `ux-auditor` agent |
| Security Auditor | `security-hardener` + `semgrep-scanner` + gitleaks hook |
| Solutions Architect | `architecture-designer` + `/plan-eng-review` |
| CTO / Strategic | `/plan-ceo-review` (rethink the problem, find the 10-star product) |
| Designer | `/designer-upgrade` (audit → design system → mockups) |
| Release Manager | `/ship` (merge → test → version → push → PR) |

**Start with:** `/production-upgrade` to see where you stand, then `/omni-plan-nth` to fix everything.

#### Open Source Maintainers
You need consistent code quality across contributors. ProductionOS provides:

- **Quality Gates** — Configurable thresholds in `quality-gates.yml` (test ratio, complexity, security)
- **CI Integration** — GitHub Actions workflow validates agents, runs convergence checks
- **`/review`** — Pre-landing code review that catches SQL safety, LLM trust boundaries, enum completeness
- **`/retro`** — Weekly retrospective with commit analysis, test health, shipping velocity

**Start with:** `/review` on incoming PRs, `/retro` weekly.

#### Agencies / Consultants
You work across many codebases and need fast, repeatable quality audits:

- **`/production-upgrade`** — Drop into any codebase, get a scored report in 10 minutes
- **`/deep-research`** — 8-phase autonomous research on any technology or pattern
- **`/auto-swarm-nth`** — Throw up to 77 parallel agents at any task (research, build, audit, fix)
- **`/max-research`** — Nuclear option: 500+ agents for exhaustive topic coverage

**Start with:** `/production-upgrade` for client audits, `/deep-research` for technology evaluation.

#### AI Engineers
You're building AI-powered products and need agent orchestration patterns:

- **78 agent definitions** with YAML frontmatter (model routing, tool constraints, stakes classification)
- **10-layer prompt composition** (Emotion → Meta → Context → CoT → ToT → GoT → CoD → Generated Knowledge → Distractor-Augmented)
- **Tri-tiered judging** (3 independent judges with debate on disagreement)
- **Convergence engine** (recursive improvement with regression detection)
- **Worktree isolation** (parallel agents in isolated git worktrees)

**Start with:** Read `ARCHITECTURE.md` for the agent orchestration patterns.

## Commands (41)

### Start Here
```
/build-productionos          Smart router — routes any intent to the right pipeline
/production-upgrade          Audit + fix any codebase (the entry point)
/productionos-help           Usage guide
```

### Recursive (loops until target met)
```
/omni-plan-nth               Recursive until 10/10 across ALL dimensions
/auto-swarm-nth "task"       Recursive swarm until 100% coverage
```

### Pipeline (single-pass with convergence)
```
/omni-plan                   13-step pipeline with tri-tiered judging
/auto-swarm "task"           parallel agent waves
/frontend-upgrade            CEO vision + parallel swarm transformation
/designer-upgrade            UI/UX redesign — audit → design system → mockups
/ux-genie                    User stories + journey maps + friction analysis
```

### Quality
```
/self-eval                   Self-evaluate recent work (default-on in all flows)
/security-audit              7-domain OWASP/MITRE/NIST sweep
/retro                       Engineering retrospective with trend tracking
```

### Research
```
/deep-research [topic]       8-phase autonomous research
/max-research [topic]        500+ agents (nuclear option)
```

### Development
```
/brainstorming               Idea exploration before building
/writing-plans               Step-by-step implementation plans
/tdd                         Test-driven development
/debug                       Systematic debugging with hypothesis tracking
/plan-ceo-review             CEO/founder strategic review
/plan-eng-review             Engineering architecture review
/review                      Pre-landing code review
/ship                        Merge → test → version → push → PR
/qa                          QA testing with health scoring
/browse                      Headless browser for inspection
```

### Lifecycle
```
/productionos-pause          Save pipeline state
/productionos-resume         Resume from checkpoint
/productionos-update         Self-update from GitHub
/auto-mode [idea]            Idea-to-running-code pipeline
/logic-mode [idea]           Business idea validation
/learn-mode [topic]          Interactive code tutor
```

## Architecture

```
80 agents (declarative YAML frontmatter, 3-tier model routing)
41 commands (orchestrate agents, loop until convergence)
51 skills (34 hand-crafted dense runbooks + 17 auto-generated wrappers)
15 hooks (SessionStart, PreToolUse security, PostToolUse telemetry, Stop handoff)
11 templates (PREAMBLE, SELF-EVAL, INVOCATION, PROMPT-COMPOSITION, MODEL-ROUTING, etc.)
10 CLI tools (pos-init, pos-config, pos-analytics, pos-sync, pos-timeline-log, etc.)
```

### Agent Model
Every agent has:
- **Model tier** — opus (planning), sonnet (execution), haiku (validation)
- **Tool constraints** — exactly which tools each agent can use
- **Stakes classification** — LOW (auto), MEDIUM (warn), HIGH (block until approved)
- **Red flags** — behavioral guardrails specific to each agent's role

### Execution Model
```
Command invoked
  → Preamble runs (context load, security scan, session tracking)
  → Agents dispatched (parallel where possible, sequential where needed)
  → Self-eval runs on each output (7-question protocol)
  → Score gating (pass / self-heal / block)
  → Convergence check (continue / pivot / deliver)
  → Postamble (instinct extraction, telemetry, handoff)
```

### Hooks
```
SESSION START → init state, detect project, show banner
EVERY EDIT    → repo boundary guard → protected file guard → security scan
AFTER EDIT    → self-learn → telemetry → review hint (after 10+ edits)
GIT COMMIT    → gitleaks secret scan
SESSION END   → mini-retro → handoff doc → instinct extraction
```

## Estimated Costs

| Command | Agents | Cost |
|---------|--------|------|
| /production-upgrade | 7-55 | $1-5 |
| /omni-plan-nth | 14-147 | $3-15 |
| /auto-swarm-nth | 7-77 | $1-8 |
| /designer-upgrade | 5-20 | $2-8 |
| /max-research | 500-1000 | $15-75 |

Use `--profile budget` for ~40% savings.

## Installation

### Recommended: via Claude Code marketplace

```bash
# 1. Add the marketplace
claude plugin marketplace add ShaheerKhawaja/ProductionOS

# 2. Install the plugin from the marketplace
claude plugin install productionos

# 3. Restart Claude Code
```

### Alternative: manual git clone

```bash
git clone https://github.com/ShaheerKhawaja/ProductionOS.git \
  ~/.claude/plugins/marketplaces/productionos
```

### Verify

```bash
# Confirm plugin is loaded
claude plugin list

# Validate schema (should show 0 errors)
claude plugin validate ~/.claude/plugins/marketplaces/productionos/.claude-plugin/marketplace.json
```

Restart Claude Code after install. Hooks, commands, and agents load on session start.

### Update

```bash
claude plugin update productionos
```

### Uninstall

```bash
claude plugin uninstall productionos
```

## Validation

```bash
cd ~/.claude/plugins/marketplaces/productionos
bun install && bun test   # 967+ pass, 1 skip, 0 fail
bun run validate          # 80 agents valid
bun run skill:check       # Health dashboard
npx tsc --noEmit          # 0 TypeScript errors
```

## What Makes This Different

**Recursive, not single-pass.** Other tools review once and stop. ProductionOS loops: review → plan → fix → validate → re-score. It doesn't stop until the target is hit or proves it's unreachable.

**Self-evaluating by default.** Every action is questioned: Was this necessary? Is this correct? Did I miss dependencies? Scores below threshold trigger automatic self-heal loops.

**Separated concerns.** Judges cannot modify code. Fixers cannot evaluate their own work. Three independent judges must reach consensus — if they disagree, they debate.

**Observable.** Cost estimation before every run. Convergence dashboard showing real-time progress. Run history tracking across sessions. You see the machine working.

**Guarded.** Repo boundary detection, secret scanning, protected file blocking, stakes-based approval gates. Guardrails you can't forget because they're hooks, not habits.

## Agent Families

These aren't chat personas. They're specialized workflows with defined inputs, outputs, tool restrictions, and quality criteria. All agents have YAML frontmatter with `model`, `tools`, `subagent_type`, `stakes`, and behavioral `Red Flags`.

ProductionOS currently ships 80 agent definitions spanning:

- Review and judging
- Planning and orchestration
- Refactoring and execution
- Security and compliance
- Design and UX
- Research and context retrieval
- Worktree and release operations

Representative agents:

- Review: `llm-judge`, `deep-researcher`, `code-reviewer`, `ux-auditor`, `dynamic-planner`, `business-logic-validator`, `dependency-scanner`
- Architecture: `api-contract-validator`, `naming-enforcer`, `refactoring-agent`, `database-auditor`, `test-architect`, `performance-profiler`, `migration-planner`
- Orchestration: `self-healer`, `convergence-monitor`, `decision-loop`, `metaclaw-learner`, `research-pipeline`, `security-hardener`, `gitops`
- Design: `frontend-designer`, `comparative-analyzer`, `reverse-engineer`, `design-system-architect`, `designer-upgrade`, `ux-genie`, `user-story-mapper`
- Coordination: `quality-loop-controller`, `session-context-manager`, `browser-controller`, `version-control`, `e2e-architect`, `document-parser`, `worktree-orchestrator`
- Quality: `quality-gate-enforcer`, `semgrep-scanner`, `regression-detector`, `documentation-auditor`, `rag-expert`, `db-creator`, `aiml-engineer`

The exact current roster lives in [`agents/`](/Users/muhammadshaheerkhawaja/ProductionOS/agents) and the generated handoff in [`docs/CODEX-PARITY-HANDOFF.md`](/Users/muhammadshaheerkhawaja/ProductionOS/docs/CODEX-PARITY-HANDOFF.md).

### Agent Stakes Classification (HumanLayer Pattern)

| Stakes | Approval | Example Agents |
|--------|----------|----------------|
| HIGH | Block until explicit approval | llm-judge, adversarial-reviewer, deep-researcher, guardrails-controller, vulnerability-explorer, migration-planner, gitops, worktree-orchestrator |
| MEDIUM | Warn with context, proceed | code-reviewer, database-auditor, dynamic-planner, architecture-designer, ux-auditor, refactoring-agent |
| LOW | Auto-approve | naming-enforcer, density-summarizer, context-retriever, comms-assistant, dependency-scanner |

## CLI Tools

```bash
pos-init            # Initialize ~/.productionos/ state directory
pos-config list     # Show all settings
pos-config get key  # Get a setting (proactive, telemetry, auto_review, self_eval)
pos-config set k v  # Set a setting
pos-analytics       # Usage dashboard (events, top skills, sessions)
pos-update-check    # Version check with snooze
pos-review-log      # Append review results to log
pos-telemetry       # Log skill usage events
```

## Persistent State (~/.productionos/)

```
~/.productionos/
├── config/settings.json     # User settings
├── analytics/
│   ├── skill-usage.jsonl    # Append-only event log
│   └── review-log.jsonl     # Review results history
├── sessions/
│   ├── active-project       # Current git repo root (repo boundary guard)
│   └── handoff-{date}.md    # Auto-generated session summaries
├── instincts/
│   ├── project/{hash}/      # Project-scoped learned patterns
│   └── global/              # Cross-project patterns (confidence > 0.8)
├── retro/                   # Retrospective JSON snapshots + session mini-retros
├── worktrees.json           # Active worktree registry
├── review-log/              # Detailed review artifacts
└── cache/                   # Version check snooze, temp data
```

## Tech

- 80 agent definitions with YAML frontmatter (model routing, tool constraints, stakes classification)
- 41 commands (including recursive orchestrators and imported workflow surfaces)
- 51 skills (34 hand-crafted dense runbooks + 17 auto-generated wrappers)
- 10-layer prompt architecture (Emotion, Meta, Scratchpad, Context, CoT, ToT, GoT, CoD, Generated Knowledge, Distractor-Augmented)
- Default-on self-evaluation protocol (7-question quality gate on all outputs)
- 15 hooks (SessionStart, PreToolUse security + boundary + gitleaks, PostToolUse telemetry/review, Stop handoff)
- 10 CLI tools (pos-init, pos-config, pos-analytics, pos-sync, pos-timeline-log, etc.)
- 4 auto-activating skills with file pattern matching
- Executable convergence engine (TypeScript, EMA tracking, TARGET_GRADE 8.0)
- Configurable quality gates (quality-gates.yml with per-project overrides)
- Worktree isolation for parallel agent execution
- Persistent state at ~/.productionos/ (config, analytics, instincts, sessions, retro)
- HumanLayer-inspired approval gate for HIGH-stakes operations
- CI/CD pipeline (GitHub Actions: validate + lint + eval-gate + convergence-check)
- Secret detection via gitleaks + regex fallback + pre-commit tsc type check
- Zero runtime dependencies beyond Claude Code or Codex + Bun

## Built On

ProductionOS stands on the shoulders of these open-source projects:

- [gstack](https://github.com/garry-tan/gstack) — hooks, CLI tools, preamble pattern, micro-state files
- [superpowers](https://github.com/anthropics/claude-code) — behavioral gates, red flags, evidence-first
- [everything-claude-code](https://github.com/shobrook/everything-claude-code) — continuous learning, instinct system
- [12-factor-agents](https://github.com/humanlayer/12-factor-agents) — small focused agents, unified state
- [HumanLayer](https://github.com/humanlayer/humanlayer) — stakes classification, approval as tool call
- [get-shit-done](https://github.com/gsd-framework) — wave-based execution, project management
- [Fabric](https://github.com/danielmiessler/fabric) — AI prompt patterns, YouTube extraction
- [tmux-background-agents](https://github.com/m13v/tmux-background-agents) — worktree isolation, crash recovery patterns

Research foundations: Self-Refine, Reflexion, Graph of Thought, EmotionPrompt, Chain of Density, Constitutional AI, LLM-as-Judge, DSPy.

## Version

1.2.0-beta.1

## License

MIT
