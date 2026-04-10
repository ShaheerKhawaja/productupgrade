# ProductionOS Skill Registry

Maps every skill to its canonical source. When multiple systems provide the same skill, the canonical source is the one ProductionOS routes to by default.

## Routing Priority

| Skill | Canonical Source | Why | Alternatives |
|-------|-----------------|-----|-------------|
| /review | gstack | Battle-tested PR review with adversarial + Codex | productionos:review, code-review:code-review |
| /ship | gstack | 10-step merge→test→version→PR pipeline | productionos:ship, commit-commands:commit-push-pr |
| /qa | gstack | Visual QA with headless browser | productionos:qa |
| /browse | gstack | Compiled Playwright binary | productionos:browse |
| /brainstorming | superpowers | Original implementation with constraints | productionos:brainstorming |
| /plan-ceo-review | gstack | Deep multi-section review with CEO persona | productionos:plan-ceo-review |
| /plan-eng-review | gstack | Architecture + tests + perf review | productionos:plan-eng-review |
| /retro | gstack | Weekly retrospective with metrics | productionos:retro |
| /security-audit | productionos | 7-domain OWASP/MITRE/NIST (deepest) | everything-claude-code:security-scan |
| /production-upgrade | productionos | Recursive convergence loop (unique) | N/A |
| /auto-swarm | productionos | Wave management + convergence + rollback | ruflo swarm:swarm |
| /self-eval | productionos | 7-question protocol + self-heal | N/A |
| /deep-research | productionos | 8-phase pipeline + citation verification | everything-claude-code:deep-research |
| /designer-upgrade | productionos | HTML mockup generation + browser review | N/A |
| /omni-plan-nth | productionos | Recursive orchestration (unique) | N/A |
| /tdd | superpowers | TDD workflow | productionos:tdd, everything-claude-code:tdd |

## Composite Skills (ProductionOS Exclusive)
| Skill | Chain | Category |
|-------|-------|----------|
| /audit-and-fix | security-audit → production-upgrade → self-eval | Quality |
| /growth-audit | SEO → content → ads → analytics | Marketing |
| /ship-safe | self-eval → review → ship | Deployment |
| /research-and-plan | deep-research → CEO review → eng review | Planning |
| /full-cycle | 7-step nuclear pipeline | Everything |

## Category Index

### Orchestration (ProductionOS)
omni-plan-nth, auto-swarm-nth, production-upgrade, full-cycle, auto-mode

### Quality (ProductionOS + gstack)
self-eval, qa (gstack), review (gstack), audit-and-fix, agentic-eval

### Security (ProductionOS)
security-audit, security-scan, security-hardening

### Design (ProductionOS + gstack + impeccable)
designer-upgrade, plan-design-review (gstack), impeccable, frontend-design

### Marketing (standalone skills)
98 marketing skills across: CRO (6), SEO (20), ads (17), content (15), growth (15), social (5), outbound (10), analytics (10)

### Research (ProductionOS)
deep-research, research-and-plan, last30days, autoresearch

### Learning (ProductionOS)
self-eval, continuous-learning, learn-mode

### n8n (standalone plugin)
n8n-architect, n8n-workflow-patterns, n8n-code-javascript, n8n-code-python, n8n-expression-syntax, n8n-node-configuration, n8n-validation-expert

### Knowledge (standalone skills)
graphify, code-review-graph (build-graph, review-delta, review-pr), agency-agents, karpathy-guidelines
