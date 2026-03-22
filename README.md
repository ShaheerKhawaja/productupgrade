# ProductionOS -- Your AI Engineering Team

[![CI](https://github.com/ShaheerKhawaja/ProductionOS/actions/workflows/ci.yml/badge.svg)](https://github.com/ShaheerKhawaja/ProductionOS/actions/workflows/ci.yml)

**The problem:** You're building a production SaaS -- complex backend, frontend, infrastructure, security, billing -- and you need the output of a 10-person engineering team. You have one person.

**The solution:** ProductionOS turns Claude Code into a full engineering department. 73 agents across 35 commands fill the roles you can't hire fast enough: code reviewer, QA engineer, security auditor, solutions architect, CTO-level strategic reviewer, designer, and release manager. One command audits your entire codebase. Another deploys 500 agents to research any topic exhaustively. Another runs recursive improvement loops until every quality dimension hits 10/10. A default-on self-evaluation protocol questions every action before it ships.

Built by a solo founder who needed to ship production-grade code at hackathon pace -- and couldn't afford to ship garbage.

## What It Actually Does

Run `/production-upgrade` on any codebase. It:
1. Discovers your stack, architecture, test coverage, and technical debt
2. Deploys 7 parallel review agents (CEO strategic, engineering architecture, code quality, security, UX, backend patterns, database audit)
3. Scores your codebase across 10 quality dimensions with evidence-backed citations
4. Generates a prioritized fix plan (P0 blockers → P3 polish)
5. Executes fixes in parallel batches with validation gates between each
6. Re-scores and shows your BEFORE → AFTER improvement

Total time: 10-30 minutes. Total cost: ~$1-5.

## Installation

```bash
# Via Claude Code plugin marketplace
claude plugin install productupgrade

# Manual
git clone https://github.com/ShaheerKhawaja/ProductionOS.git ~/.claude/plugins/marketplaces/productupgrade
```

## Commands (35)

### Start Here
```
/build-productionos          Smart router — routes any intent to the right pipeline
/production-upgrade          Audit + fix any codebase (the entry point)
/productionos-help           Usage guide and recommended workflows
```

### Orchestrative (recursive, nth-iteration)
```
/omni-plan-nth               Recursive until 10/10 across ALL dimensions
/auto-swarm-nth "task"       Recursive swarm until 100% coverage + 10/10 quality
```

### Pipeline (structured, single-pass with convergence)
```
/omni-plan                   Full 13-step pipeline with tri-tiered judging
/auto-swarm "task"           Throw 7-77 parallel agents at any task
/frontend-upgrade            CEO vision + parallel swarm frontend transformation
/designer-upgrade            Full UI/UX redesign — audit → design system → HTML mockups
/ux-genie                    User stories + journey maps + friction analysis + agent dispatch
```

### Quality & Self-Evaluation (v7.0)
```
/self-eval                   Self-evaluate recent work (default-on in all flows)
```

### Nuclear Scale
```
/max-research [topic]        500-1000 agents in ONE wave (nuclear option)
```

### Specialized
```
/deep-research [topic]       8-phase research with citation verification
/security-audit              7-domain OWASP/MITRE/NIST security sweep
/agentic-eval                CLEAR v2.0 quality framework evaluation
/context-engineer            Token-optimized context packaging
/logic-mode [idea]           Business idea → production-ready validation
/learn-mode [topic]          Interactive code tutor (explain any codebase)
/auto-mode [idea]            Idea-to-running-code pipeline (10-phase, 5 gates)
```

### Absorbed Skills (v7.0 -- zero external deps)
```
/brainstorming               Idea exploration before building
/writing-plans               Step-by-step implementation plans
/tdd                         Test-driven development workflow
/debug                       Systematic debugging with hypothesis tracking
/plan-ceo-review             CEO/founder-mode strategic review
/plan-eng-review             Engineering architecture review
/review                      Pre-landing code review
/ship                        Merge, test, version, push, create PR
/qa                          Systematic QA testing with health scoring
/qa-only                     Report-only QA (no fixes applied)
/browse                      Headless browser for QA and site inspection
/retro                       Engineering retrospective with trend tracking
/document-release            Post-ship documentation update
```

### Lifecycle
```
/productionos-pause          Save pipeline state for later resumption
/productionos-resume         Resume paused pipeline from checkpoint
/productionos-update         Self-update from GitHub
```

### CLI Tools
```
pos-init                     Initialize ~/.productionos/ state directory
pos-config list|get|set      Manage ProductionOS settings
pos-analytics                Usage dashboard (events, top skills, sessions)
pos-update-check             Version check with snooze
pos-review-log               Append review results to log
pos-telemetry                Log skill usage events
```

## What's New in v7.0 -- The Design Conscience

### Self-Evaluation (default-on)
- **Self-Eval Protocol** -- 7 questions after every agent action: quality, necessity, correctness, dependencies, completeness, learning, honesty
- **Quality Loop Controller** -- Self-check → Self-eval → Self-heal → Learn cycle on all outputs
- **Score Gating** -- >= 8.0 passes, 6.0-7.9 triggers self-heal loop, < 6.0 blocks and escalates
- **`/self-eval` command** -- Standalone evaluation of last output, session, or git diff

### Design & UX (3 new commands, 5 new agents)
- **`/designer-upgrade`** -- Full UI/UX redesign: audit → design system → interactive HTML mockups → browser annotation → implementation plan
- **`/ux-genie`** -- User stories from UI guidelines, journey mapping, friction analysis, agent dispatch
- **Mockup Generator** -- Self-contained HTML mockups with annotation overlay, dark mode, responsive preview
- **Design System Architect** -- Token system creation from codebase analysis

### Skill Absorption (zero external deps)
- **14 commands absorbed** from gstack, superpowers, and ECC -- `/brainstorming`, `/writing-plans`, `/tdd`, `/debug`, `/plan-ceo-review`, `/plan-eng-review`, `/review`, `/ship`, `/qa`, `/qa-only`, `/browse`, `/retro`, `/document-release`, `/build-productionos`
- **Smart router** -- `/build-productionos` routes any intent to the right pipeline automatically
- ProductionOS is now **fully self-contained** -- no external plugin dependencies for core functionality

### Session Context Management
- **Progressive context loading** -- L0 (always) / L1 (on demand) / L2 (when referenced)
- **Context rot detection** -- Monitors for repeated work, contradictions, quality drift
- **Cross-session instinct transfer** -- Patterns with confidence > 0.8 persist globally

### v6.0 Foundation (retained)
- **9 lifecycle hooks** -- SessionStart, PreToolUse security, PostToolUse telemetry/review, Stop handoff
- **4 auto-activating skills** -- Security-scan, frontend-audit, continuous-learning, productionos
- **HumanLayer stakes classification** -- Every agent tagged LOW/MEDIUM/HIGH
- **Persistent state** -- `~/.productionos/` with config, analytics, sessions, instincts

## 65 Agents

These aren't chat personas -- they're specialized workflows with defined inputs, outputs, tool restrictions, and quality criteria. All agents have YAML frontmatter with `model`, `tools`, `subagent_type`, `stakes`, and behavioral `Red Flags`. Read-only agents (judges, auditors) cannot modify code. Execution agents (fixers, healers) cannot evaluate their own work.

| Generation | Count | Agents |
|------------|-------|--------|
| Core | 11 | llm-judge, deep-researcher, code-reviewer, ux-auditor, dynamic-planner, business-logic-validator, dependency-scanner, api-contract-validator, naming-enforcer, refactoring-agent, database-auditor |
| Advanced | 9 | adversarial-reviewer, thought-graph-builder, persona-orchestrator, density-summarizer, context-retriever, frontend-scraper, vulnerability-explorer, swarm-orchestrator, guardrails-controller |
| V4+ | 9 | test-architect, performance-profiler, migration-planner, self-healer, convergence-monitor, decision-loop, metaclaw-learner, research-pipeline, security-hardener |
| V5.1 | 6 | gitops, frontend-designer, asset-generator, comms-assistant, comparative-analyzer, reverse-engineer |
| V5.2 | 5 | debate-tribunal, ecosystem-scanner, gap-analyzer, recursive-orchestrator, verification-gate |
| V5.3 | 9 | discuss-phase, stub-detector, plan-checker, architecture-designer, intake-interviewer, nyquist-filler, prd-generator, requirements-tracer, scaffold-generator |
| V5.3+ | 6 | version-control, e2e-architect, rag-expert, db-creator, aiml-engineer, infra-setup |
| V6.0 | 2 | approval-gate, browser-controller |
| V7.0 | 8 | self-evaluator, designer-upgrade, mockup-generator, design-system-architect, ux-genie, user-story-mapper, quality-loop-controller, session-context-manager |

## Estimated Costs

| Command | Agents | Estimated Cost |
|---------|--------|---------------|
| /production-upgrade | 7-55 | $1-5 per run |
| /omni-plan | 14-147 | $3-15 per run |
| /auto-swarm | 7-77 | $1-8 per run |
| /designer-upgrade | 5-20 | $2-8 per run |
| /max-research | 500-1000 | $15-75 per run |
| /deep-research | 3-10 | $0.50-2 per run |

Costs depend on codebase size, depth setting, and model. Use `--profile budget` for ~40% savings.

## What Makes This Different

**Recursive convergence.** Other tools do one review pass. ProductionOS loops: review → plan → fix → validate → re-score. If quality drops, it rolls back. If progress stalls, it pivots strategy. It doesn't stop until the target is hit or it proves the target is unreachable.

**Self-evaluation by default.** Every action is questioned: Was this necessary? Is this correct? Did I miss dependencies? Am I being honest about quality? Scores below 8.0 trigger automatic self-heal loops. This catches the "looks good but isn't" problem.

**Evaluators can't grade their own work.** The agents that fix code are different from the agents that judge it. The judge is read-only -- it cannot modify code, only score it. This prevents the self-grading inflation problem that plagues single-pass AI code review.

**Tri-tiered tribunal.** Three independent judges with different perspectives (correctness, practicality, adversarial) must reach consensus. If they disagree, they debate. This catches issues that any single reviewer would miss.

**Observable execution.** Cost estimation before every expensive run. Convergence dashboard showing real-time grade progression. Run history tracking across sessions. You see the machine working, not a black box.

**Zero external dependencies.** All 35 commands work out of the box -- no need to install gstack, superpowers, or ECC separately. Core workflows (brainstorming, TDD, debugging, code review, shipping) are absorbed natively.

## Built For

- Solo founders and small teams building production SaaS
- Semi-technical CTOs who think in architecture, not syntax
- Anyone who needs 10-person engineering team quality from 1 person + AI
- Hackathon-pace shipping with production-grade rigor

## Validation

```bash
bun run skill:check        # Plugin health score (10/10)
bun run validate           # Agent validation (65/65)
bun test                   # Full test suite (196+ tests)
```

## Tech

- 65 agent definitions with YAML frontmatter (model routing, tool constraints, stakes classification)
- 35 commands (14 absorbed from gstack/superpowers/ECC)
- 10-layer prompt architecture (Emotion → Meta → Scratchpad → Context → CoT → ToT → GoT → CoD → Generated Knowledge → Distractor-Augmented)
- Default-on self-evaluation protocol (7-question quality gate on all outputs)
- 9 lifecycle hooks (SessionStart, PreToolUse security, PostToolUse telemetry/review, Stop handoff)
- 6 CLI tools for config, analytics, telemetry, version management
- 4 auto-activating skills with file pattern matching
- Executable convergence engine (TypeScript, Algorithm 1 + Algorithm 6)
- Persistent state at ~/.productionos/ (config, analytics, instincts, sessions)
- HumanLayer-inspired approval gate for HIGH-stakes operations
- CI/CD pipeline (GitHub Actions: validate + lint + convergence check)
- Zero runtime dependencies

## Architecture Influences

- [gstack](https://github.com/garry-tan/gstack) -- hooks, CLI tools, preamble pattern, micro-state files
- [superpowers](https://github.com/anthropics/claude-code) -- behavioral gates, red flags, evidence-first
- [everything-claude-code](https://github.com/shobrook/everything-claude-code) -- continuous learning, instinct system
- [12-factor-agents](https://github.com/humanlayer/12-factor-agents) -- small focused agents, unified state
- [HumanLayer](https://github.com/humanlayer/humanlayer) -- stakes classification, approval as tool call
- [get-shit-done](https://github.com/gsd-framework) -- wave-based execution, project management

## Version

8.0.0-alpha.2

## Author

[ProductionOS Contributors](https://github.com/ShaheerKhawaja/ProductionOS)

## License

MIT
