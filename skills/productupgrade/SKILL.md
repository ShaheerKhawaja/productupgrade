---
name: productupgrade
description: "Autonomous self-learning product upgrade pipeline with 20 agents, 3 execution modes (auto/standard/deep), 7-layer prompt composition (CoT+ToT+GoT+CoD+Emotion+Meta+Context), distributed swarm orchestration, and LLM-as-Judge convergence engine. Use when upgrading, auditing, fixing, or improving any product codebase."
---

# ProductUpgrade V2.1 — Autonomous Self-Learning Pipeline

A cognitive architecture that takes any codebase from current state to production-ready using 20 specialized agents, recursive convergence with LLM-as-Judge evaluation, 7-layer composed prompting, and RAG-powered context retrieval across iteration boundaries.

## When to Use

- `/productupgrade` — Auto mode: smart agent selection based on codebase complexity
- `/productupgrade standard` — Proven 6-phase pipeline, recursive convergence, target 8.0
- `/productupgrade deep` — Full autonomous self-learning engine, 7 loops, target 10.0
- `/productupgrade audit` — Discovery + evaluation only (no code changes)
- `/productupgrade fix` — Execute fixes from a previous audit
- `/productupgrade validate` — Validate recent changes, score AFTER vs BEFORE
- `/productupgrade judge` — LLM-as-Judge evaluation only (independent, read-only)
- `/auto-swarm "task"` — Distributed agent swarm for any research or improvement task

## Architecture Overview

### 20 Agents

| Agent | Role | Model | Access |
|-------|------|-------|--------|
| llm-judge | Independent quality evaluator, convergence control | opus | Read-only |
| deep-researcher | Techstack/competitor/library research | opus | Read + Web |
| code-reviewer | Systematic code review with confidence scoring | — | Read-only |
| ux-auditor | UX/UI audit with a11y and competitor comparison | — | Read + Bash |
| dynamic-planner | Finding synthesis + prioritized batch planning | — | Read + Write |
| business-logic-validator | Business rule validation | — | Read-only |
| dependency-scanner | CVE/license/abandonment scanning | — | Read + Bash |
| api-contract-validator | Frontend↔Backend contract validation | — | Read-only |
| naming-enforcer | Cross-layer naming convention audit | — | Read-only |
| refactoring-agent | Dead code, complexity, duplication | — | Read + Edit |
| database-auditor | Schema, query, migration audit | — | Read + Bash |
| adversarial-reviewer | Red-team hostile critique (no code changes) | — | Read-only |
| thought-graph-builder | Graph of Thought aggregation across iterations | opus | Read + Write |
| persona-orchestrator | 3-persona evaluation (Technical/Human/Meta) | — | Read-only |
| density-summarizer | Chain of Density inter-iteration summaries | — | Read + Write |
| context-retriever | RAG-in-pipeline context management | — | Read + Write |
| frontend-scraper | Playwright screenshot + Lighthouse capture | — | Read + Bash |
| vulnerability-explorer | OWASP Top 10 + attack surface mapping | — | Read + Bash |
| swarm-orchestrator | Distributed swarm coordination | — | All |
| guardrails-controller | Safety + human-in-the-loop enforcement | — | Read-only |

### 7-Layer Prompt Composition (Deep/Swarm Mode)

Every agent in deep mode receives composed prompts with all 7 layers:

1. **Emotion Prompting** — Sets stakes and thoroughness (+8-15% accuracy, Li et al. 2023)
2. **Meta-Prompting** — Forces reflection on approach and blind spots before action
3. **Context Retrieval** — RAG from /mem-search + context7 MCP + file artifacts
4. **Chain of Thought (CoT)** — Step-by-step reasoning: OBSERVE → ANALYZE → IMPACT → SEVERITY → FIX
5. **Tree of Thought (ToT)** — 3-branch exploration: THE OBVIOUS / THE SYSTEMIC / THE UNEXPECTED
6. **Graph of Thought (GoT)** — Finding network with edges: CAUSES / BLOCKS / AMPLIFIES / RELATED_TO
7. **Chain of Density (CoD)** — 3-pass compression: skeletal → evidence-rich → action-loaded

### Convergence Engine

The pipeline runs in a recursive loop controlled by the LLM-as-Judge:

```
Iteration N → UNDERSTAND → ENRICH → EVALUATE → FIX → VERIFY → LEARN → CONVERGE
  │
  ├── SUCCESS:      grade >= target_grade
  ├── CONVERGED:    delta < 0.15 for 2 consecutive iterations
  ├── MAX_REACHED:  iteration >= max_iterations
  ├── DEGRADED:     any dimension decreased by > 0.5 → HALT, rollback, investigate
  │                 (decreases <= 0.5 are normal variance — log but continue)
  ├── OSCILLATION:  dimension went up-down-up (3+ direction changes) → lock, focus elsewhere
  └── CONTINUE:     feed 2 weakest dimensions to next iteration
```

## Three Execution Modes

### Auto Mode (`/productupgrade` or `/productupgrade auto`)
- Analyzes codebase in 30 seconds (tech stack, LOC, complexity)
- Dynamically selects only relevant agents
- No recursive loops — single pass with parallel execution
- Complexity classification: S (<500 LOC) → 3 agents, M (500-5K) → 7 agents, L (5K-50K) → full pipeline 3 iterations, XL (50K+) → escalate to deep

### Standard Mode (`/productupgrade standard`)
- Proven 6-phase pipeline: DISCOVER → REVIEW → PLAN → EXECUTE → VALIDATE → JUDGE
- Enhanced with context7 library verification, CoD summaries, and Emotion Prompting on judge
- Target grade: 8.0/10 (configurable)
- Max 7 iterations, up to 54 agent dispatches per iteration

### Deep Mode (`/productupgrade deep`)
- Full autonomous self-learning engine
- 7 progressive loops: UNDERSTAND → ENRICH → EVALUATE → FIX → VERIFY → LEARN → CONVERGE
- All 7 prompt composition layers active on every agent
- Virtualized evaluation personas (Technical, Human Impact, Meta-Reasoning)
- Reflexion memory for cross-iteration learning
- Dynamic /plan ↔ /code-review cycling with anti-thrash (max 3 switches)
- Target grade: 10.0 ALWAYS
- Iterations 6-7 require human approval

### Sub-Modes
- `audit` — UNDERSTAND + EVALUATE only (no code changes)
- `fix` — Execute fixes from `.productupgrade/EXECUTION/UPGRADE-PLAN.md`
- `validate` — VERIFY only on recent changes
- `judge` — Independent LLM-as-Judge scoring only

## 10-Dimension Evaluation Rubric

| Dimension | 1-2 | 3-4 | 5-6 | 7-8 | 9-10 |
|-----------|-----|-----|-----|-----|------|
| Code Quality | Bugs | Works | Clean | Elegant | Exemplary |
| Security | CVEs | Basic | OWASP | Pen-tested | Hardened |
| Performance | Slow | OK | Fast | Optimized | Edge-optimized |
| UX/UI | Ugly | Functional | Good | Polished | Delightful |
| Test Coverage | 0% | 30% | 60% | 80% | 95%+ |
| Accessibility | None | Some | AA | AAA | AAA+Audit |
| Documentation | None | README | API docs | Full | Interactive |
| Error Handling | Crash | Catch | Log | Recovery | Self-heal |
| Observability | None | Logs | Metrics | Tracing | Dashboards |
| Deployment Safety | YOLO | CI | CD | Canary | Blue-green |

## Adaptive Toolchain Detection

The validation gate uses detected commands, NOT hardcoded ones:

```
IF package.json:  lint=scripts.lint, test=scripts.test, type=tsc --noEmit
IF pyproject.toml: lint=ruff check, test=pytest, type=mypy
IF go.mod:        lint=go vet, test=go test, type=(build IS type check)
IF Cargo.toml:    lint=cargo clippy, test=cargo test, type=cargo check
IF none:          SKIP (warn: "No toolchain detected")
```

LOC counting excludes: `node_modules/`, `vendor/`, `__pycache__/`, `.venv/`, `dist/`, `build/`, `.git/`

## Output File Structure (V2)

```
.productupgrade/
├── DISCOVERY/
│   ├── AUDIT-DISCOVERY.md
│   ├── AUDIT-COMPETITORS.md
│   ├── AUDIT-DEPENDENCIES.md
│   └── AUDIT-VULNERABILITIES.md
├── REVIEWS/
│   ├── REVIEW-CEO-EXPAND.md
│   ├── REVIEW-CEO-HOLD.md
│   ├── REVIEW-CEO-REDUCE.md
│   ├── REVIEW-ENGINEERING-ARCH.md
│   ├── REVIEW-ENGINEERING-ROBUST.md
│   ├── REVIEW-CODE.md
│   ├── REVIEW-UX.md
│   └── REVIEW-BUSINESS-LOGIC.md
├── THOUGHT-GRAPHS/
│   ├── THOUGHT-GRAPH-{N}.md
│   └── THOUGHT-GRAPH-FINAL.md
├── ITERATIONS/
│   └── ITERATION-{N}-SUMMARY.md (CoD dense summaries)
├── JUDGEMENTS/
│   ├── JUDGE-ITERATION-{N}.md
│   └── JUDGE-FINAL.md
├── EXECUTION/
│   ├── UPGRADE-PLAN.md
│   ├── UPGRADE-LOG.md
│   └── CHECKPOINT-*.md
├── LEARNING/
│   ├── AGENT-METRICS.md
│   ├── DECISION-WEIGHTS.md
│   ├── CONTEXT-METRICS.md
│   └── LEARNINGS-*.md
├── SCREENSHOTS/
│   ├── before/
│   └── after/
├── RUBRIC-BEFORE.md
├── RUBRIC-AFTER.md
├── REFLEXION-MEMORY.md
├── CONVERGENCE-LOG.md
├── TOOLCHAIN.md
└── FINAL-REPORT.md
```

## Integrated Skills

Orchestrates these existing skills in the pipeline:
- `/plan-ceo-review` — CEO strategic review (3 modes: expansion/hold/reduction)
- `/plan-eng-review` — Engineering deep-dive (architecture + robustness)
- `/code-review` — Code review on all changes
- `/qa` — Automated QA testing with health scoring
- `/browse` — Headless browser for screenshots and testing
- `/ux-browse` / `/ux-analyze` — UX screenshot capture and vision analysis
- `/test-driven-development` — TDD spec generation
- `/deployment-patterns` — Migration and deployment planning
- `/dispatching-parallel-agents` — Parallel agent dispatch coordination

### MCP Integrations
- `context7` — Live library doc verification (every phase)
- `sequential-thinking` — Structured reasoning (EVALUATE, CONVERGE)
- `memory` — Persistent knowledge graph across sessions (LEARN, UNDERSTAND)
- `playwright` — Frontend screenshots and E2E testing (VERIFY)

## /auto-swarm Integration

For tasks requiring distributed research across many sources:
```
/auto-swarm "task description" --depth ultra --swarm_size 7 --iterations 11
```

Research depth scaling:
- `shallow`: 10 sources/query, 30 total — local codebase only
- `medium`: 50 sources/query, 250 total — + library docs + memory
- `deep`: 500 sources/query, 5K total — + web + competitors + papers
- `ultra`: 2000 sources/query, 10K total — + sub-swarms for sub-topics

## Anti-Patterns (What NOT to Do)

1. **Never skip the judge.** Every iteration must be scored independently.
2. **Never let fix agents self-report quality.** The judge reads code directly.
3. **Never continue if a dimension decreased by > 0.5.** HALT and investigate.
4. **Never batch more than 7 fixes.** Larger batches cause merge conflicts.
5. **Never skip the validation gate.** Broken code must not be committed.
6. **Never run the judge with the same model context as the fixer.** Independence is critical.
7. **Never compact without saving a CoD summary first.** Context loss is permanent.
8. **Never skip the adversarial reviewer in deep mode.** Every fix must survive challenge.
9. **Never ignore the Human Impact persona.** Technical correctness without user benefit is waste.
10. **Never target less than the mode's default grade.** Auto adapts, standard=8.0, deep=10.0.
11. **Never hardcode validation commands.** Use adaptive toolchain detection.
12. **Never run more than 3 mode switches per iteration.** Anti-thrash protection.

## Guardrails (Non-Negotiable)

### Human-in-the-Loop Checkpoints
- Pre-launch approval for autonomous operations
- Pre-commit diff review (unless --auto-commit)
- Pre-push ALWAYS requires approval
- Security-critical changes ALWAYS flagged
- Iteration 3 and 5 checkpoints in deep mode
- Cost threshold ($5 / 500K tokens) triggers pause

### Safety Boundaries
- Protected files: .env, keys, certs, production configs
- Max 15 files per batch, 200 lines per file
- Automatic rollback on test failure or score regression
- Scope enforcement: agents cannot modify outside their focus area

### Cost Budgets
- Session: 2M tokens, 100 agents, 500 web fetches
- Per iteration: 400K tokens, 14 agents
- Per swarm agent: 100K tokens, 50 web fetches
