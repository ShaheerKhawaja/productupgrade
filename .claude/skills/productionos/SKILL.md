---
name: productionos
description: "ProductionOS 5.3 — Your AI engineering team. 55 agents that fill roles you can't hire fast enough: code reviewer, QA engineer, security auditor, solutions architect, CTO reviewer, release manager. Built by a solo founder shipping a complex SaaS at hackathon pace."
---

# ProductionOS 5.3 — Your AI Engineering Team

## The Problem

You're building a production SaaS — complex backend, frontend, infrastructure, security, billing — and you need the output of a 10-person engineering team. You have one person. You think in architecture and systems, not syntax. You need someone to review your code, find your security holes, validate your business logic, and ship without breaking things.

## The Solution

ProductionOS turns Claude Code into a full engineering department. 55 agents fill the roles you can't hire fast enough:

| Role | What It Does | Key Agents |
|------|-------------|------------|
| **Code Reviewer** | Finds bugs, patterns, tech debt across your codebase | code-reviewer, adversarial-reviewer, naming-enforcer |
| **QA Engineer** | Validates features WORK (not just that files exist), detects stubs and mock data | stub-detector, verification-gate, test-architect |
| **Security Auditor** | OWASP Top 10, MITRE ATT&CK, dependency vulns, secret exposure | security-hardener, vulnerability-explorer |
| **Solutions Architect** | Reviews architecture, identifies SPOFs, scales your design | dynamic-planner, comparative-analyzer, migration-planner |
| **CTO Reviewer** | Challenges your own decisions with adversarial thinking, strategic review | llm-judge, debate-tribunal, business-logic-validator |
| **Release Manager** | Ships with guardrails — pre-commit review, test gates, rollback on regression | guardrails-controller, self-healer, gitops |
| **Research Analyst** | Deep-dives any topic with citation verification before you build | deep-researcher, research-pipeline, ecosystem-scanner |

## Origin Story

Born from a CEO Strategic Review of Entropy Studio (an AI video production SaaS) that found:
- "Extraordinary engine wrapped in ordinary interface"
- 11 fake-data code paths masquerading as working features
- 5 of 12 agents were YAML stubs
- Silent failure mode where billing doesn't fire but API costs accrue
- Verdict: DO NOT LAUNCH. Fix quality first.

ProductionOS was built to systematically find and fix quality gaps at a scale one person can't do manually. The recursive convergence loop mirrors how the founder works — iterate, self-critique honestly, loop until 10/10 or prove it's unreachable.

## How To Use It

### Just starting? Run this:
```
/production-upgrade
```
Discovers your stack → deploys 7 review agents → scores 10 dimensions → generates fix plan → executes fixes → shows BEFORE→AFTER. Takes 10-30 min, costs ~$1-5.

### Need deeper analysis?
```
/omni-plan                   Full 13-step pipeline with CEO + Engineering + Design review
/deep-research [topic]       Research anything with 8 phases and citation verification
/security-audit              7-domain security sweep (OWASP/MITRE/NIST)
```

### Need maximum power?
```
/omni-plan-nth               Recursive until 10/10 across ALL dimensions
/auto-swarm-nth "task"       Recursive parallel swarm — 100% coverage
/max-research [topic]        500-1000 agents in ONE wave (extreme resource usage)
```

### Utility commands:
```
/auto-swarm "task"           7-77 parallel agents for any task
/agentic-eval                CLEAR v2.0 quality evaluation
/context-engineer            Optimize context for downstream agents
/logic-mode [idea]           Validate a business idea end-to-end
/learn-mode [topic]          Interactive tutor — explain any codebase
/productionos-update         Self-update from GitHub
/productionos-help           Full usage guide
```

## What Makes This Different

**Recursive convergence.** Other tools do one review pass. ProductionOS loops: review → plan → fix → validate → re-score. If quality drops, it rolls back. If progress stalls, it pivots strategy. Executable TypeScript convergence engine with Algorithm 1 (score-based) + Algorithm 6 (EMA velocity).

**Evaluators can't grade their own work.** Agents that fix code are different from agents that judge it. The judge is read-only — no Write or Edit tools. This prevents the self-grading inflation that plagues single-pass AI code review.

**Stub detection.** The stub-detector agent (born from finding 11 fake-data paths in Entropy Studio) distinguishes "file exists" from "feature works" — catches placeholder components, mock data, `NotImplementedError`, hardcoded arrays, and decorative integrations.

**Pre-pipeline user decisions.** The discuss-phase agent captures what you actually want BEFORE 55 agents start optimizing. Prevents the pipeline from running in the wrong direction.

**Observable execution.** Cost estimation before every run. Terminal convergence dashboard showing real-time grade progression. Security hooks blocking writes to .env, keys, certs.

## The 55 Agents

Organized by the role they fill, not the version they were added in:

**Your Engineering Team (28 agents that do the work):**
code-reviewer, adversarial-reviewer, ux-auditor, database-auditor, api-contract-validator, dependency-scanner, naming-enforcer, business-logic-validator, security-hardener, vulnerability-explorer, test-architect, performance-profiler, stub-detector, refactoring-agent, self-healer, frontend-designer, asset-generator, gitops, deep-researcher, research-pipeline, reverse-engineer, comms-assistant, aiml-engineer, db-creator, e2e-architect, infra-setup, scaffold-generator, rag-expert

**Your Quality Gates (12 agents that evaluate and decide):**
llm-judge, debate-tribunal, discuss-phase, plan-checker, verification-gate, gap-analyzer, convergence-monitor, decision-loop, persona-orchestrator, comparative-analyzer, intake-interviewer, nyquist-filler

**Your Infrastructure (15 agents that coordinate and optimize):**
dynamic-planner, swarm-orchestrator, recursive-orchestrator, guardrails-controller, context-retriever, density-summarizer, thought-graph-builder, ecosystem-scanner, metaclaw-learner, migration-planner, frontend-scraper, architecture-designer, prd-generator, requirements-tracer, version-control

## Tech Under The Hood

- **10-layer prompt composition:** Emotion → Meta → Scratchpad → Context → CoT → ToT → GoT → CoD → Generated Knowledge → Distractor-Augmented
- **Executable convergence engine:** TypeScript implementation of score-based + EMA velocity algorithms
- **Cost tracking:** Per-run token estimation and USD cost tracking with terminal dashboard
- **Security hooks:** PreToolUse guard blocks writes to .env, keys, certs, production configs
- **CI/CD:** GitHub Actions pipeline (validate + lint + convergence check)
- **118 tests passing** across 5 test files
- **Zero runtime dependencies**

## Validation

```bash
cd ~/.claude/plugins/marketplaces/productupgrade
bun run skill:check    # 10/10 health score
bun run validate       # 55/55 agents valid
bun test               # 118 tests passing
```

## Installation

```bash
# One command (when published)
npx productionos@latest

# Plugin marketplace
claude plugin install productupgrade

# Manual
git clone https://github.com/ShaheerKhawaja/ProductionOS.git \
  ~/.claude/plugins/marketplaces/productupgrade
```
