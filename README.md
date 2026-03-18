# ProductionOS

Agentic development operating system for Claude Code — 35 agents, 10 commands, recursive convergence, tri-tiered evaluation, and cross-command artifact flow.

## Quick Start

```bash
# Install
git clone https://github.com/ShaheerKhawaja/productupgrade.git ~/.claude/plugins/marketplaces/productupgrade

# Verify
cd ~/.claude/plugins/marketplaces/productupgrade && bun install && bun run skill:check

# Use any command
/production-upgrade          # Audit any codebase
/omni-plan                   # Full 13-step pipeline
/auto-swarm "research X"     # Distributed agent swarm
```

## Commands

| Command | Purpose | Agents | Target |
|---------|---------|--------|--------|
| `/production-upgrade` | Recursive product audit | 7/phase | 8.0/10 grade |
| `/omni-plan` | 13-step pipeline with tri-tiered judging | 14/phase | 9.5/10 grade |
| `/auto-swarm "task"` | Distributed agent swarm | 7/wave | 85% coverage |
| `/deep-research` | 8-phase research pipeline | 5/phase | 80%+ confidence |
| `/agentic-eval` | CLEAR v2.0 evaluation | 3 judges | Scored report |
| `/security-audit` | OWASP/MITRE/NIST audit | 7 domains | Threat map |
| `/context-engineer` | Token-optimized context | 1 | Budget plan |
| `/logic-mode` | Business idea validation | 5 phases | Go/no-go |
| `/learn-mode` | Interactive code tutor | 1 | Understanding |
| `/productionos-update` | Self-update from GitHub | 1 | Latest version |

## Agents (35)

**Core (11):** llm-judge, deep-researcher, code-reviewer, ux-auditor, dynamic-planner, business-logic-validator, dependency-scanner, api-contract-validator, naming-enforcer, refactoring-agent, database-auditor

**Advanced (9):** adversarial-reviewer, thought-graph-builder, persona-orchestrator, density-summarizer, context-retriever, frontend-scraper, vulnerability-explorer, swarm-orchestrator, guardrails-controller

**V4+ (9):** test-architect, performance-profiler, migration-planner, self-healer, convergence-monitor, decision-loop, metaclaw-learner, research-pipeline, security-hardener

**V5.1 (6):** gitops, frontend-designer, asset-generator, comms-assistant, comparative-analyzer, reverse-engineer

## Architecture

Commands produce artifacts in `.productionos/` consumed by downstream commands:

```
/deep-research --> RESEARCH-*.md --+
                                   v
/production-upgrade --> AUDIT-DISCOVERY.md --> /omni-plan (13 steps)
                                                  |
                                     REVIEW-CEO + REVIEW-ENG + JUDGE-PANEL
                                                  |
                                     /auto-swarm (execution engine)
                                                  |
                                     /ship (document + push + PR)
```

## Validation

```bash
bun run skill:check      # 10-check health dashboard
bun run validate          # Agent frontmatter validation (35/35)
bun run audit:context     # Token budget tracking
bun run dashboard         # Review readiness dashboard
bun test                  # Automated test suite
```

## Requirements

- [Claude Code](https://claude.com/claude-code) CLI
- [Bun](https://bun.sh) runtime (for TypeScript scripts)
- Recommended: [gstack](https://github.com/garry-tan/gstack), [superpowers](https://github.com/anthropics/claude-code)

## License

MIT
