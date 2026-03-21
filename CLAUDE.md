# ProductionOS 6.0 — The Nervous System

56-agent AI engineering team with 18 commands, 15+ lifecycle hooks, 6 CLI tools, 4 auto-activating skills, and continuous learning. Native embedding into Claude Code — PreToolUse security scanning, PostToolUse telemetry and code review hints, Stop session handoff, and cross-session instinct extraction. Built for solo founders who need a 10-person engineering team from 1 person + AI.

## What's New in v6.0

- **Native Hooks** — 9 hook scripts across SessionStart/PreToolUse/PostToolUse/Stop (was: 1 banner)
- **CLI Tools** — `pos-init`, `pos-config`, `pos-analytics`, `pos-update-check`, `pos-review-log`, `pos-telemetry`
- **Persistent State** — `~/.productionos/` with config, analytics, sessions, instincts, review-log
- **Auto-Activation** — Skills with filePattern/bashPattern metadata trigger on context
- **Security Scanning** — PreToolUse hook detects edits to auth/payment/credential files
- **Continuous Learning** — PostToolUse observation + Stop instinct extraction
- **Session Handoff** — Auto-generated handoff docs on session end
- **Review Hints** — After 10+ edits, suggests code review
- **Stakes Classification** — Each agent tagged LOW/MEDIUM/HIGH (HumanLayer pattern)
- **Red Flags** — Behavioral guardrails on all 56 agents
- **Declarative Agents** — YAML frontmatter with model, tools, subagent_type on all agents
- **Frontend Upgrade** — New `/frontend-upgrade` command (CEO vision + parallel swarm)

## Commands

### Orchestrative (recursive, nth-iteration)
```
/omni-plan-nth [target]        Recursive orchestration — chains ALL skills, loops until 10/10
/auto-swarm-nth "task"         Recursive swarm — 100% coverage, 10/10 quality per item
```

### Pipeline (structured, single-pass with convergence)
```
/omni-plan [target]            13-step pipeline with tri-tiered judging
/auto-swarm "task" [--depth]   Distributed agent swarm (shallow|medium|deep|ultra)
/production-upgrade [mode]     Recursive product audit (full|audit|ux|fix|validate|judge)
/frontend-upgrade [target]     CEO-enriched frontend transformation pipeline
```

### Nuclear Scale
```
/max-research [topic]          500-1000 agents in ONE massive wave — exhaustive research
```

### Lifecycle
```
/auto-mode [idea]              Idea-to-running-code pipeline (10-phase, 5 decision gates)
```

### Specialized
```
/deep-research [topic]         8-phase autonomous research pipeline
/agentic-eval [target]         CLEAR v2.0 framework evaluation
/security-audit [target]       7-domain OWASP/MITRE/NIST security audit
/context-engineer [target]     Token-optimized context packaging
/logic-mode [idea]             Business idea validation pipeline
/learn-mode [topic]            Interactive code tutor
/productionos-pause            Save pipeline state for later resumption
/productionos-resume           Resume paused pipeline from checkpoint
/productionos-update           Self-update from GitHub
/productionos-help             Usage guide and workflows
```

## Hook Architecture (v6.0)

```
SESSION START
  ↓ session-start.sh (init state, track session, display banner)

EVERY EDIT/WRITE
  ↓ protected-file-guard.sh (block writes to .env, keys, certs)
  ↓ pre-edit-security.sh (advisory on auth/payment/credential files)
  ↓ [TOOL EXECUTES]
  ↓ self-learn.sh (cross-session pattern capture)
  ↓ post-edit-telemetry.sh (log file edits)
  ↓ post-edit-review-hint.sh (suggest review after 10+ edits)

EVERY BASH COMMAND
  ↓ protected-file-guard.sh (block shell writes to sensitive files)
  ↓ [TOOL EXECUTES]
  ↓ post-bash-telemetry.sh (log commands)

SESSION END
  ↓ stop-session-handoff.sh (summary doc + instinct extraction)
```

## CLI Tools

```bash
pos-init            # Initialize ~/.productionos/ state directory
pos-config list     # Show all settings
pos-config get key  # Get a setting
pos-config set k v  # Set a setting
pos-analytics       # Usage dashboard (events, top skills, sessions)
pos-update-check    # Version check with snooze support
pos-review-log      # Append review results to log
pos-telemetry       # Log skill usage events
```

## Auto-Activating Skills

| Skill | Triggers On | Priority |
|-------|------------|----------|
| security-scan | `**/auth/**`, `**/payment/**`, `**/.env*`, `**/credential*` | 95 |
| productionos | `**/package.json`, `**/CLAUDE.md`, `**/.productionos/**` | 90 |
| frontend-audit | `**/*.tsx`, `**/*.vue`, `**/components/**`, `**/*.css` | 80 |
| continuous-learning | `**/.productionos/instincts/**` | 70 |

## Agent Stakes Classification (HumanLayer)

| Stakes | Agents | Approval Required |
|--------|--------|-------------------|
| HIGH | llm-judge, adversarial-reviewer, deep-researcher, guardrails-controller, vulnerability-explorer, migration-planner, gitops | Yes — destructive or high-impact |
| MEDIUM | code-reviewer, database-auditor, dynamic-planner, architecture-designer, ux-auditor, refactoring-agent, frontend-designer | Advisory — flag concerns |
| LOW | naming-enforcer, density-summarizer, context-retriever, comms-assistant, dependency-scanner, convergence-monitor | Auto — safe read-only ops |

## Persistent State (~/.productionos/)

```
~/.productionos/
├── config/settings.json     # User settings (proactive, telemetry, auto_review)
├── analytics/
│   ├── skill-usage.jsonl    # Append-only event log
│   └── review-log.jsonl     # Review results history
├── sessions/
│   ├── {PID}                # Active session markers
│   ├── edit-count-{PID}     # Per-session edit counter
│   └── handoff-{date}.md    # Auto-generated handoff docs
├── instincts/
│   ├── project/{hash}/      # Project-scoped learned patterns
│   └── global/              # Cross-project patterns (confidence > 0.8)
├── review-log/              # Detailed review artifacts
└── cache/                   # Version check snooze, temp data
```

## Orchestration Hierarchy

```
/omni-plan-nth (TOP LEVEL — invokes anything, loops until 10/10)
    │
    ├── /omni-plan (13-step pipeline within each iteration)
    │   ├── /deep-research (Step 1)
    │   ├── /plan-ceo-review (Step 3, external)
    │   ├── /plan-eng-review (Step 4, external)
    │   ├── /agentic-eval (Step 6)
    │   ├── /auto-swarm-nth (Step 9 — execution engine)
    │   └── /ship (Step 13, external)
    │
    ├── /frontend-upgrade (CEO vision + parallel swarm execution)
    │   ├── Deep research (competitive parity)
    │   ├── CEO vision (dream state)
    │   ├── Eng architecture review
    │   └── Parallel swarm fix waves
    │
    ├── /auto-swarm-nth (parallel execution with recursive quality gates)
    ├── /max-research (NUCLEAR — 500-1000 agents, single massive wave)
    ├── /production-upgrade (structured single-pass audit)
    └── Any available external skill (/qa, /browse, /review, etc.)
```

## Agent Loading

Agent definitions live in `agents/` (55 files). All agents have YAML frontmatter with `name`, `description`, `model`, `tools`, `subagent_type`, and `stakes`. Commands load agents on-demand — do NOT preload all agent files.

## Prompting Architecture

Agents in deep/ultra mode receive 10-layer composed prompts (see `templates/PROMPT-COMPOSITION.md`):
1. **Emotion Prompting** — Stakes calibrated to severity
2. **Meta-Prompting** — Self-reflection before action
3. **Context Retrieval** — RAG from memory + context7
4. **Chain of Thought** — Step-by-step reasoning
5. **Tree of Thought** — 3-branch exploration with scoring
6. **Graph of Thought** — Finding network with edge detection
7. **Chain of Density** — Compression for inter-iteration handoff
8. **Generated Knowledge** — Pre-generate domain best practices
9. **Distractor-Augmented** — Force judges to argue against plausible-but-wrong conclusions
10. **12-Factor Agent** — Small focused agents, unified state, human contact via tools

## Guardrails (Non-Negotiable)

- Pre-commit diff review required (unless --auto-commit)
- Pre-push ALWAYS requires approval
- Protected files: .env, keys, certs, production configs (enforced by PreToolUse hook)
- Max 15 files/batch, 200 lines/file
- Automatic rollback on test failure or score regression
- Scope enforcement: agents cannot modify outside their focus area
- Regression protection: any dimension drop > 0.5 triggers rollback
- Security-sensitive files flagged by PreToolUse security scan
- Review hint after 10+ edits per session

## Output Directory

All pipeline outputs go to `.productionos/` in the target project. Artifacts are tracked via manifest for cross-command consumption.

## Attribution

Built on: [superpowers](https://github.com/anthropics/claude-code), [gstack](https://github.com/garry-tan/gstack), [everything-claude-code](https://github.com/shobrook/everything-claude-code), [agents](https://github.com/wshobson/agents), [get-shit-done](https://github.com/gsd-framework), [Fabric](https://github.com/danielmiessler/fabric), [12-factor-agents](https://github.com/humanlayer/12-factor-agents), [HumanLayer](https://github.com/humanlayer/humanlayer).
Research: Self-Refine, Reflexion, GoT, EmotionPrompt, CoD, Constitutional AI, LLM-as-Judge.
