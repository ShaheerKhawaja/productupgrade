# Model Routing Strategy

ProductionOS uses a 3-tier model strategy to optimize cost and quality.

## Tiers

| Tier | Model | Use For | Token Cost |
|------|-------|---------|------------|
| **Architect** | opus | Planning, design, orchestration, judging, adversarial review | Highest |
| **Editor** | sonnet | Implementation, code review, fixing, research, analysis | Medium |
| **Validator** | haiku | Scanning, naming, extraction, density compression, validation | Lowest |

## Agent Classification

### Opus (Architect — 9 agents)
Deep reasoning, multi-step planning, critical judging:
- llm-judge, adversarial-reviewer, debate-tribunal
- deep-researcher, dynamic-planner, architecture-designer
- recursive-orchestrator, decision-loop, designer-upgrade

### Sonnet (Editor — 44 agents)
Balanced execution, code changes, analysis:
- code-reviewer, ux-auditor, refactoring-agent, test-architect
- security-hardener, performance-profiler, self-healer, migration-planner
- business-logic-validator, api-contract-validator, database-auditor
- frontend-designer, comparative-analyzer, vulnerability-explorer
- thought-graph-builder, persona-orchestrator, research-pipeline
- gitops, convergence-monitor, metaclaw-learner, self-evaluator
- mockup-generator, design-system-architect, ux-genie, user-story-mapper
- quality-loop-controller, session-context-manager, worktree-orchestrator
- document-parser, semgrep-scanner, ast-grep-analyzer
- complexity-analyzer, regression-detector, documentation-auditor
- And remaining execution agents...

### Haiku (Validator — 16 agents)
Fast, focused, cheap validation:
- naming-enforcer, density-summarizer, context-retriever
- dependency-scanner, stub-detector, plan-checker
- convergence-monitor, nyquist-filler, scaffold-generator
- asset-generator, comms-assistant, frontend-scraper
- approval-gate, quality-gate-enforcer, rule-engine
- browser-controller

## Routing Rules

1. **Planning phase** → Use opus agents (deep reasoning required)
2. **Execution phase** → Use sonnet agents (balanced quality/cost)
3. **Validation phase** → Use haiku agents (fast, cheap checks)
4. **Budget mode** (`--profile budget`) → Downgrade all agents one tier:
   - opus → sonnet, sonnet → haiku, haiku stays haiku
5. **Quality mode** (`--profile quality`) → Upgrade all agents one tier:
   - haiku → sonnet, sonnet → opus, opus stays opus

## Validation

The `validate-agents.ts` script checks that every agent's `model` field
matches the routing table. Mismatches are flagged as warnings.
