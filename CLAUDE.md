# ProductionOS 1.0.0-beta.1 — Production House

75-agent AI engineering OS with 39 commands, 11 lifecycle hooks, 6 CLI tools, 4 auto-activating skills, continuous learning, and self-evaluation. 4-layer Production House: Smart Router (auto-dispatch agents by goal), Stack Detector (auto-provision tools), Adaptive Learning (dispatch history feeds routing), Dynamic Factory (create ephemeral agents). Built for solo founders who need a 10-person engineering + design team from 1 person + AI.

## What's New in v7.0

### Self-Evaluation (default-on)
- **Self-Eval Protocol** — 7 questions after every agent action: quality, necessity, correctness, dependencies, completeness, learning, honesty
- **Quality Loop Controller** — Self-check → Self-eval → Self-heal → Learn cycle on all outputs
- **Score Gating** — 10.0 is the ONLY passing score. 9.0-9.9 triggers self-heal. < 9.0 blocks and escalates. Best-in-class, bulletproof, 1000/10 mentality.
- **`/self-eval` command** — Standalone evaluation of last output, session, or git diff

### Design & UX
- **`/designer-upgrade`** — Full UI/UX redesign: audit → design system → interactive HTML mockups → browser annotation → implementation plan
- **`/ux-genie`** — User stories from UI guidelines, journey mapping, friction analysis, agent dispatch
- **Mockup Generator** — Self-contained HTML mockups with annotation overlay, dark mode, responsive preview, side-by-side comparison
- **Design System Architect** — Token system creation from codebase analysis

### Session Context Management
- **Progressive context loading** — L0 (always) / L1 (on demand) / L2 (when referenced)
- **Context rot detection** — Monitors for repeated work, contradictions, quality drift
- **Automatic compression** — Triggers at 60% context usage, emergency at 80%
- **Cross-session instinct transfer** — Patterns with confidence > 0.8 persist globally

### v6.0 Foundation (retained)
- **Native Hooks** — 9 hook scripts across SessionStart/PreToolUse/PostToolUse/Stop
- **CLI Tools** — `pos-init`, `pos-config`, `pos-analytics`, `pos-update-check`, `pos-review-log`, `pos-telemetry`
- **Persistent State** — `~/.productionos/` with config, analytics, sessions, instincts, review-log
- **Auto-Activation** — Skills with filePattern/bashPattern metadata trigger on context
- **Security Scanning** — PreToolUse hook detects edits to auth/payment/credential files
- **Continuous Learning** — PostToolUse observation + Stop instinct extraction
- **Stakes Classification** — Each agent tagged LOW/MEDIUM/HIGH (HumanLayer pattern)
- **Red Flags** — Behavioral guardrails on all 75 agents
- **Declarative Agents** — YAML frontmatter with model, tools, subagent_type on all agents

## Commands

### 4 Primary Commands (launch the full suite)
```
/omni-plan-nth [target]        THE orchestrator — chains ALL skills, loops until 10/10
/auto-swarm-nth "task"         Parallel agent swarm — 100% coverage, recursive quality gates
/production-upgrade [mode]     Full codebase audit + iterative fix convergence
/designer-upgrade [target]     UI/UX redesign — audit → design system → HTML mockups → browser review
```

These 4 commands can invoke ANY other command or agent. They are the entry points.

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
/designer-upgrade [target]     UI/UX redesign — audit + design system + HTML mockups
/ux-genie [target]             User stories + journey maps + friction analysis + agent dispatch
```

### Quality & Self-Evaluation
```
/self-eval [target]            Self-evaluate recent work (last|session|diff|path) — enabled by default
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
    ├── /designer-upgrade (UI/UX redesign pipeline)
    │   ├── 5 parallel auditors (ux, design-system, frontend, competitors, perf)
    │   ├── Design system creation (tokens, components, patterns)
    │   ├── HTML mockup generation (interactive, annotatable)
    │   ├── Browser-based review (local server, user annotation)
    │   └── Implementation plan generation
    │
    ├── /ux-genie (User experience improvement pipeline)
    │   ├── Guidelines intake + persona derivation
    │   ├── User story generation (20+ stories, 10 dimensions)
    │   ├── Journey mapping (per-persona emotional tracking)
    │   ├── Friction analysis (8 friction types)
    │   └── Agent dispatch for fixes (3-wave priority)
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
    ├── /self-eval (standalone or embedded in all above)
    └── Any available external skill (/qa, /browse, /review, etc.)

SELF-EVAL PROTOCOL (cross-cutting — embedded in ALL commands above)
    │
    ├── Self-Check (structural validation, < 30s)
    ├── Self-Eval (7 questions, qualitative assessment)
    ├── Self-Heal (targeted remediation loop, max 3 iterations)
    └── Self-Learn (pattern extraction for cross-session instincts)
```

## Agent Loading

Agent definitions live in `agents/` (75 files). All agents have YAML frontmatter with `name`, `description`, `model`, `tools`, `subagent_type`, and `stakes`. Commands load agents on-demand — do NOT preload all agent files.

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
