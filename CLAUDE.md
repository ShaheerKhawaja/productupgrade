# ProductionOS 5.3 — Your AI Engineering Team

55-agent AI engineering team with 17 commands that turn Claude Code into a full engineering department. Built for solo founders and small teams who need 10-person team quality from 1 person + AI. Recursive convergence, tri-tiered evaluation, 10-layer prompt composition, executable convergence engine, per-agent cost tracking, and security enforcement.

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
    │   │   └── 7 agents per wave, each can invoke skills
    │   └── /ship (Step 13, external)
    │
    ├── /auto-swarm-nth (parallel execution with recursive quality gates)
    │   └── Each agent can invoke: /deep-research, /security-audit, /qa, etc.
    │
    ├── /max-research (NUCLEAR — 500-1000 agents, single massive wave)
    │   └── ALL agents deployed simultaneously, synthesis wave after
    │
    ├── /production-upgrade (structured single-pass audit)
    ├── /deep-research (research on any topic)
    ├── /security-audit (security-focused audit)
    ├── /agentic-eval (quality evaluation)
    └── Any available external skill (/qa, /browse, /review, etc.)
```

## Mode Comparison

| Feature | /production-upgrade | /auto-swarm | /omni-plan | /omni-plan-nth | /max-research |
|---------|---------------------|-------------|------------|----------------|---------------|
| Purpose | Code audit | Task orchestration | Full pipeline | Recursive perfection | Exhaustive research |
| Target | 10/10 | 100% coverage | 10/10 | 10/10 ALL dimensions | Total topic saturation |
| Pattern | 7 iterations | 11 waves × 7 | 7 loops | 20 iterations | ONE massive wave |
| Can invoke other commands | No | No | Yes (fixed steps) | Yes (ANY command) | No (research only) |
| Convergence | Grade comparison | Coverage delta | PIVOT/REFINE/PROCEED | Strict per-dimension | Single-shot + synthesis |
| Agent limit | 49 | 77 | 147 | 420 (21/iter x 20) | 500-1000 (single wave) |

## Agent Loading

Agent definitions live in `agents/` (55 files). Commands load agents on-demand — do NOT preload all agent files. Only read the specific agent file when a command references it during execution.

## Prompting Architecture

Agents in deep/ultra mode receive 10-layer composed prompts (see `templates/PROMPT-COMPOSITION.md`):
1. **Emotion Prompting** — Stakes calibrated to severity
2. **Meta-Prompting** — Self-reflection before action
3. **Context Retrieval** — RAG from memory + context7
4. **Chain of Thought** — Step-by-step reasoning (+ ES-CoT in budget mode)
5. **Tree of Thought** — 3-branch exploration with scoring
6. **Graph of Thought** — Finding network with edge detection
7. **Chain of Density** — Compression for inter-iteration handoff
8. **Generated Knowledge** — Pre-generate domain best practices before answering
9. **Distractor-Augmented** — Force judges to argue against plausible-but-wrong conclusions

## Guardrails (Non-Negotiable)

- Pre-commit diff review required (unless --auto-commit)
- Pre-push ALWAYS requires approval
- Protected files: .env, keys, certs, production configs
- Max 15 files/batch, 200 lines/file
- Automatic rollback on test failure or score regression
- Scope enforcement: agents cannot modify outside their focus area
- Regression protection: any dimension drop > 0.5 triggers rollback + investigation

## Output Directory

All pipeline outputs go to `.productionos/` in the target project. Artifacts are tracked via manifest for cross-command consumption.

## Attribution

Built on: [superpowers](https://github.com/anthropics/claude-code), [gstack](https://github.com/garry-tan/gstack), [everything-claude-code](https://github.com/shobrook/everything-claude-code), [agents](https://github.com/wshobson/agents), [get-shit-done](https://github.com/gsd-framework), [Fabric](https://github.com/danielmiessler/fabric), [Prompt Engineering Guide](https://github.com/dair-ai/Prompt-Engineering-Guide).
Research: Self-Refine, Reflexion, GoT, EmotionPrompt, CoD, Constitutional AI, LLM-as-Judge.
