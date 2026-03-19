# ProductionOS -- Your AI Engineering Team

[![CI](https://github.com/ShaheerKhawaja/ProductionOS/actions/workflows/ci.yml/badge.svg)](https://github.com/ShaheerKhawaja/ProductionOS/actions/workflows/ci.yml)

**The problem:** You're building a production SaaS -- complex backend, frontend, infrastructure, security, billing -- and you need the output of a 10-person engineering team. You have one person.

**The solution:** ProductionOS turns Claude Code into a full engineering department. 55 agents fill the roles you can't hire fast enough: code reviewer, QA engineer, security auditor, solutions architect, CTO-level strategic reviewer, and release manager. One command audits your entire codebase. Another deploys 500 agents to research any topic exhaustively. Another runs recursive improvement loops until every quality dimension hits 10/10.

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
# One command (coming soon)
npx productionos@latest

# Via Claude Code plugin marketplace
claude plugin install productupgrade

# Manual
git clone https://github.com/ShaheerKhawaja/ProductionOS.git ~/.claude/plugins/marketplaces/productupgrade
```

## Commands

### Start Here
```
/production-upgrade          Audit + fix any codebase (the entry point)
/productionos-help           Usage guide and recommended workflows
```

### When You Need More
```
/omni-plan                   Full 13-step pipeline with tri-tiered judging
/auto-swarm "task"           Throw 7-77 parallel agents at any task
/deep-research [topic]       8-phase research with citation verification
/security-audit              7-domain OWASP/MITRE/NIST security sweep
```

### When You Need Everything
```
/omni-plan-nth               Recursive until 10/10 across ALL dimensions
/auto-swarm-nth "task"       Recursive swarm until 100% coverage
/max-research [topic]        500-1000 agents in ONE wave (nuclear option)
```

### Specialized Tools
```
/agentic-eval                CLEAR v2.0 quality framework evaluation
/context-engineer            Token-optimized context packaging
/logic-mode [idea]           Business idea → production-ready validation
/learn-mode [topic]          Interactive code tutor (explain any codebase)
/productionos-update         Self-update from GitHub
```

## 55 Agents

These aren't chat personas -- they're specialized workflows with defined inputs, outputs, tool restrictions, and quality criteria. Read-only agents (judges, auditors) cannot modify code. Execution agents (fixers, healers) cannot evaluate their own work.

| Generation | Count | Agents |
|------------|-------|--------|
| Core | 11 | llm-judge, deep-researcher, code-reviewer, ux-auditor, dynamic-planner, business-logic-validator, dependency-scanner, api-contract-validator, naming-enforcer, refactoring-agent, database-auditor |
| Advanced | 9 | adversarial-reviewer, thought-graph-builder, persona-orchestrator, density-summarizer, context-retriever, frontend-scraper, vulnerability-explorer, swarm-orchestrator, guardrails-controller |
| V4+ | 9 | test-architect, performance-profiler, migration-planner, self-healer, convergence-monitor, decision-loop, metaclaw-learner, research-pipeline, security-hardener |
| V5.1 | 6 | gitops, frontend-designer, asset-generator, comms-assistant, comparative-analyzer, reverse-engineer |
| V5.2 | 5 | debate-tribunal, ecosystem-scanner, gap-analyzer, recursive-orchestrator, verification-gate |
| V5.3 | 9 | discuss-phase, stub-detector, plan-checker, architecture-designer, intake-interviewer, nyquist-filler, prd-generator, requirements-tracer, scaffold-generator |
| V5.3+ | 6 | version-control, e2e-architect, rag-expert, db-creator, aiml-engineer, infra-setup |

## Estimated Costs

| Command | Agents | Estimated Cost |
|---------|--------|---------------|
| /production-upgrade | 7-49 | $1-5 per run |
| /omni-plan | 14-147 | $3-15 per run |
| /auto-swarm | 7-77 | $1-8 per run |
| /max-research | 500-1000 | $15-75 per run |
| /deep-research | 3-10 | $0.50-2 per run |

Costs depend on codebase size, depth setting, and model. Use `--profile budget` for ~40% savings.

## What Makes This Different

**Recursive convergence.** Other tools do one review pass. ProductionOS loops: review → plan → fix → validate → re-score. If quality drops, it rolls back. If progress stalls, it pivots strategy. It doesn't stop until the target is hit or it proves the target is unreachable.

**Evaluators can't grade their own work.** The agents that fix code are different from the agents that judge it. The judge is read-only -- it cannot modify code, only score it. This prevents the self-grading inflation problem that plagues single-pass AI code review.

**Tri-tiered tribunal.** Three independent judges with different perspectives (correctness, practicality, adversarial) must reach consensus. If they disagree, they debate. This catches issues that any single reviewer would miss.

**Observable execution.** Cost estimation before every expensive run. Convergence dashboard showing real-time grade progression. Run history tracking across sessions. You see the machine working, not a black box.

## Built For

- Solo founders and small teams building production SaaS
- Semi-technical CTOs who think in architecture, not syntax
- Anyone who needs 10-person engineering team quality from 1 person + AI
- Hackathon-pace shipping with production-grade rigor

## Validation

```bash
bun run skill:check        # Plugin health score (10/10)
bun run validate           # Agent validation (55/55)
bun test                   # Full test suite (118 tests)
```

## Tech

- 49 agent definitions with research-grounded prompt composition
- 10-layer prompt architecture (Emotion → Meta → Scratchpad → Context → CoT → ToT → GoT → CoD → Generated Knowledge → Distractor-Augmented)
- Executable convergence engine (TypeScript, Algorithm 1 + Algorithm 6 from formal spec)
- Cost tracking and estimation (per-agent, per-run)
- Security hooks (PreToolUse protected file guard)
- CI/CD pipeline (GitHub Actions: validate + lint + convergence check)
- Zero runtime dependencies

## Version

5.3.0

## Author

[Shaheer Khawaja](https://github.com/ShaheerKhawaja) / [EntropyandCo](https://entropyandco.com)

## License

MIT
