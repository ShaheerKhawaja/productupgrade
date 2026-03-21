---
name: productionos-help
description: "Show how to use ProductionOS — explains commands, recommended workflows, best flows to run, and usage guidelines."
---

# ProductionOS — Usage Guide

## Getting Started

ProductionOS v6.0 is your AI engineering team — 55 agents, 18 commands, 15+ hooks, 6 CLI tools, always present. Here's how to use it effectively.

## What's New in v6.0

- **Always-present hooks** — Security scan on auth/payment files, telemetry on every edit, review hints after 10+ changes, session handoff on exit
- **CLI tools** — `pos-init`, `pos-config`, `pos-analytics`, `pos-update-check`
- **Auto-activating skills** — Skills trigger based on file patterns (auth → security-scan, .tsx → frontend-audit)
- **Continuous learning** — Extracts patterns from sessions, builds instincts with confidence scoring
- **`/frontend-upgrade`** — CEO vision + parallel swarm for frontend transformation

## Step 0: Preamble

All ProductionOS commands run the shared preamble (`templates/PREAMBLE.md`) before execution. This includes environment check, prior work discovery, agent resolution, cost estimation, and prompt injection defense.

## Quick Reference

```
COMMAND                          WHEN TO USE
/production-upgrade              Audit and improve any codebase (start here)
/omni-plan                       Full 13-step pipeline for major work
/omni-plan-nth                   Recursive perfection — loops until 10/10
/auto-swarm "task"               Throw agents at any task in parallel
/auto-swarm-nth "task"           Recursive swarm until 100% coverage
/max-research "topic"            500-1000 agents — exhaustive research (nuclear)
/deep-research "topic"           Research anything before building
/agentic-eval                    Evaluate quality with CLEAR framework
/security-audit                  7-domain security deep-dive
/context-engineer                Build token-optimized context packages
/logic-mode "idea"               Validate a business idea
/learn-mode "topic"              Interactive code tutor
/productionos-pause              Save pipeline state for later
/productionos-resume             Resume from checkpoint
/productionos-update             Update to latest version
/frontend-upgrade                CEO-enriched frontend transformation
/productionos-help               This guide
```

### CLI Tools (v6.0)

```
pos-init                         Initialize ~/.productionos/ state
pos-config list|get|set          Manage settings
pos-analytics                    Usage dashboard
pos-update-check                 Version check
```

## Recommended Workflows

### Flow 1: "I want to improve an existing codebase"
```
Step 1: /production-upgrade              Run a baseline audit
Step 2: Review the findings in .productionos/
Step 3: /omni-plan-nth                   Recursive improvement until 10/10
```
This is the most common flow. `/production-upgrade` gives you a quick health score, then `/omni-plan-nth` iterates until every dimension is perfect.

### Flow 2: "I'm starting a new project/feature"
```
Step 1: /logic-mode "describe your idea"     Validate the concept
Step 2: /deep-research "relevant domain"     Research best practices
Step 3: /omni-plan --focus=architecture      Plan the architecture
Step 4: /auto-swarm-nth "build the feature"  Execute with parallel agents
Step 5: /production-upgrade validate         Final validation pass
```

### Flow 3: "I need to research something first"
```
Step 1: /deep-research "your topic"          Deep 8-phase research
Step 2: /omni-plan                           Plan using research findings
```
The research artifacts in `.productionos/RESEARCH-*.md` are automatically consumed by `/omni-plan` — no duplicate work.

### Flow 4: "I want maximum quality on everything"
```
/omni-plan-nth                              Just run this
```
`/omni-plan-nth` is the top-level orchestrator. It will invoke `/deep-research`, `/auto-swarm-nth`, `/plan-ceo-review`, `/plan-eng-review`, `/security-audit`, and any other skill it needs. It loops until every dimension scores 10/10.

### Flow 5: "Quick security check"
```
/security-audit                             7-domain OWASP/MITRE/NIST audit
```

### Flow 6: "Understand a codebase I didn't write"
```
Step 1: /learn-mode "walkthrough"            Interactive guided tour
   — or —
Step 1: /auto-swarm "reverse-engineer this codebase" --mode explore
```

### Flow 7: "Prepare for a code review / PR"
```
Step 1: /production-upgrade validate         Quick validation pass
Step 2: Review .productionos/ output
Step 3: Fix any findings
Step 4: Commit and push
```

## How Commands Connect

Commands produce artifacts in `.productionos/` that downstream commands consume:

```
/deep-research ──→ RESEARCH-*.md ──→ /omni-plan (skips re-research)
/production-upgrade ──→ AUDIT-DISCOVERY.md ──→ /omni-plan (skips discovery)
/omni-plan ──→ OMNI-PLAN.md ──→ /auto-swarm (task decomposition)
/security-audit ──→ AUDIT-SECURITY.md ──→ /production-upgrade (security context)
```

**Rule: Never redo work.** If a prior command already produced findings, the next command should consume them.

## The Orchestration Hierarchy

```
/omni-plan-nth (TOP — can invoke ANY command, loops until 10/10)
    |
    ├── /omni-plan (13-step pipeline per iteration)
    │   └── /auto-swarm-nth (execution engine within iterations)
    │       └── Each agent can invoke skills within its scope
    |
    ├── /deep-research (on-demand investigation)
    ├── /security-audit (on-demand security check)
    ├── /agentic-eval (on-demand quality evaluation)
    └── External: /plan-ceo-review, /plan-eng-review, /qa, /browse, /ship
```

## Tips

1. **Start with `/production-upgrade`** if you're unsure — it's the lightest pipeline
2. **Use `/omni-plan-nth`** when you want maximum quality — it runs everything
3. **Check `.productionos/`** after any command — all findings go there
4. **Run `bun run skill:check`** to verify ProductionOS itself is healthy (10/10)
5. **Run `bun run dashboard`** to see which reviews have been completed
6. **Use `/learn-mode`** to understand unfamiliar code before auditing it
7. **The `-nth` variants** run until perfect — standard variants run once
8. **External skills** (gstack, superpowers) enhance capabilities but aren't required

## Validation Commands

```bash
bun run skill:check      # 10-check health dashboard (should be 10/10)
bun run validate          # Agent frontmatter validation (55/55)
bun run audit:context     # Token budget tracking
bun run dashboard         # Review readiness per branch
bun test                  # Automated test suite (118 tests)
```

## Getting Help

- **CLAUDE.md** — Auto-loaded instructions and command reference
- **ARCHITECTURE.md** — Why decisions were made (with implementation status)
- **CONTRIBUTING.md** — How to add agents and commands
- **CHANGELOG.md** — What changed in each version
- **TODOS.md** — Known gaps and planned improvements
