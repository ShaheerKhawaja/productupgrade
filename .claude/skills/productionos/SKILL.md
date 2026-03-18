---
name: productionos
description: "Agentic development OS V5.1 — 29 agents, 10 commands (/omni-plan, /auto-swarm, /production-upgrade, /deep-research, /agentic-eval, /security-audit, /context-engineer, /logic-mode, /learn-mode, /productionos-update), tri-tiered evaluation, 16 prompt layers, recursive convergence, and cross-run learning."
---

# ProductionOS V5.1 — Agentic Development Operating System

29-agent recursive development OS with 10 commands, tri-tiered judge tribunal, 16 prompt engineering layers, and convergence-driven self-improvement.

## Commands

| Command | Purpose | Agents | Target |
|---------|---------|--------|--------|
| `/omni-plan` | 13-step orchestrative pipeline (flagship) | 21 max | 9.5/10 |
| `/auto-swarm "task"` | Distributed agent swarm for any task | 7/wave | 85% coverage |
| `/production-upgrade` | Recursive product audit | 32 max | 8.0/10 |
| `/deep-research` | 8-phase autonomous research pipeline | 3-7 | 80%+ confidence |
| `/agentic-eval` | CLEAR v2.0 framework evaluator | 1 | scored report |
| `/security-audit` | 7-domain hardening (OWASP/MITRE/NIST) | 1-3 | scored report |
| `/context-engineer` | Token-efficient context construction | 1 | context package |
| `/logic-mode` | Business idea to production plan | 3-7 | execution plan |
| `/learn-mode` | Interactive code tutor | 1 | conversation |
| `/productionos-update` | Self-update from GitHub | 1 | latest version |

### /omni-plan [target] [--focus] [--depth]
13-step orchestrative pipeline: Research → CEO Review → Eng Review → Design Review → CLEAR Eval → Tri-Tiered Judges → Dynamic Plan → Parallel Execution → Self-Healing → Re-Evaluation → Decision Loop → Delivery

### /auto-swarm "task" [--depth] [--swarm_size] [--iterations]
Distributed agent swarm. Spawns 7 parallel agents per wave with convergence tracking.
Modes: `research` | `build` | `audit` | `fix` | `explore` (auto-detected)

### /production-upgrade [mode]
Recursive product audit with validation gates between batches.
Modes: `full` | `audit` | `ux` | `fix` | `validate` | `judge`

### /deep-research "topic" [--depth] [--sources]
8-phase research with 4-layer citation verification.
Depths: `quick` (10) | `standard` (50) | `deep` (500) | `exhaustive` (2000)

### /logic-mode "idea"
Business idea → production plan. Challenges assumptions, researches competitors, identifies flaws, generates phased execution plan.

### /learn-mode [topic]
Interactive code tutor. Auto-detects user level, explains the WHY behind code.

## Agent Roster (29 agents)

### Core Review (11)
`llm-judge` (Opus, read-only) | `deep-researcher` (Opus, read+web) | `code-reviewer` | `ux-auditor` | `dynamic-planner` | `business-logic-validator` | `dependency-scanner` | `api-contract-validator` | `naming-enforcer` | `refactoring-agent` | `database-auditor`

### Advanced Analysis (9)
`adversarial-reviewer` (Opus, read-only) | `thought-graph-builder` (Opus) | `persona-orchestrator` (Opus) | `density-summarizer` | `context-retriever` | `frontend-scraper` | `vulnerability-explorer` | `swarm-orchestrator` | `guardrails-controller`

### Execution (5)
`test-architect` | `performance-profiler` | `migration-planner` | `self-healer` (full access) | `convergence-monitor`

### Intelligence (4 — V4.1+)
`research-pipeline` | `security-hardener` | `decision-loop` | `metaclaw-learner`

### Evaluation (3 — V5.0+)
`agentic-evaluator` | `context-engineer` | `logic-validator`

## Tri-Tiered Evaluation

Runs at TWO points (pre-execution AND post-execution):
- **Judge 1 (Opus):** Correctness + depth — "Is it right?"
- **Judge 2 (Sonnet):** Practicality + cost — "Can it be built?"
- **Judge 3 (Adversarial):** Attack surface — "How would I break it?"

Consensus: agree (within 1pt) → median | 2-agree → majority | all-disagree → DEBATE round

## 16 Prompt Engineering Layers

1. Emotion Prompting (+8-15% accuracy)
2. Meta-Prompting (self-reflection)
3. Context Retrieval (RAG)
4. Chain of Thought
5. Tree of Thought (3-branch)
6. Graph of Thought (causal network)
7. Chain of Density (compression)
8. Step-Back Prompting (abstraction)
9. Contrastive CoT (correct + incorrect)
10. ReAct (reasoning + acting)
11. Cumulative Reasoning (proposer-verifier-reporter)
12. Self-Debugging (iterative repair)
13. LATS (Monte Carlo Tree Search)
14. Self-Consistency (majority voting)
15. Mixture of Agents (ensemble)
16. Constitutional AI (safety checks)

## Context Loading Protocol

ProductionOS uses lazy context loading to prevent context explosion:
- **SessionStart hook** sets workspace-aware env vars
- **Vercel/ECC lexical injection suppressed** via `VERCEL_PLUGIN_LEXICAL_PROMPT=0`
- **Commands load context per-phase**, not all upfront
- **Self-learning hook** captures patterns to `~/.productionos/learned/`
