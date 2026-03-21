# ProductionOS v7.0 Architecture

This document explains **why** ProductionOS is built the way it is. For setup and commands, see CLAUDE.md.

## Implementation Status

| Capability | Status | Notes |
|------------|--------|-------|
| 65 agent definitions | IMPLEMENTED | All with YAML frontmatter, stakes, Red Flags |
| 35 commands | IMPLEMENTED | All pipeline commands have Step 0 preambles (14 absorbed from gstack/superpowers/ECC) |
| 9 hook scripts | IMPLEMENTED | SessionStart, PreToolUse, PostToolUse, Stop |
| 6 CLI tools | IMPLEMENTED | pos-init, pos-config, pos-analytics, pos-update-check, pos-review-log, pos-telemetry |
| 4 auto-activating skills | IMPLEMENTED | security-scan (p95), productionos (p90), frontend-audit (p80), continuous-learning (p70) |
| Self-Eval Protocol | IMPLEMENTED | 7-question evaluation, default-on in all flows |
| Quality Loop Controller | IMPLEMENTED | self-check → self-eval → self-heal → learn |
| Designer-Upgrade Pipeline | IMPLEMENTED | Audit → design system → HTML mockups → browser annotation |
| UX-Genie Pipeline | IMPLEMENTED | User stories → journey maps → friction analysis → agent dispatch |
| Session Context Management | IMPLEMENTED | L0/L1/L2 progressive loading, context rot detection |
| Convergence engine | IMPLEMENTED | PIVOT/REFINE/PROCEED with tri-tiered judging |
| Persistent state | IMPLEMENTED | ~/.productionos/ with config, analytics, sessions, instincts |
| Stakes classification | IMPLEMENTED | LOW/MEDIUM/HIGH on all 65 agents (HumanLayer pattern) |

## Design Philosophy

1. **Self-questioning by default** — Every agent's output runs through the 7-question Self-Eval Protocol before it's accepted. Was the work good? Was it needed? Did it break anything?
2. **State machine, not tools** — Commands produce artifacts consumed by downstream commands via `.productionos/`
3. **Agents load on-demand** — Only read agent definitions when a command references them
4. **Tri-tiered evaluation** — Judge 1 (correctness), Judge 2 (practicality), Judge 3 (adversarial)
5. **Recursive convergence** — Loop until quality target met, with PIVOT/REFINE/PROCEED
6. **Fix-first** — Auto-fix mechanical issues, only ask about ambiguous ones
7. **Design is code** — UI/UX auditing produces the same structured output as code auditing

## The Core Idea

ProductionOS gives Claude Code a recursive self-improvement engine. Most code review tools run once and produce a report. ProductionOS runs in a **convergence loop** — it audits, fixes, re-evaluates, and repeats until the codebase reaches a target quality grade.

The key insight: a single review pass catches ~60% of issues. A second pass catches another ~20%. By the third pass, you're finding systemic patterns that no single-pass tool ever surfaces. The recursive loop is the product.

```
Codebase (grade: 4.2)
        |
        v
  +-----------------------------------------------------+
  |  CONVERGENCE LOOP                                     |
  |                                                       |
  |  DISCOVER --> REVIEW --> PLAN --> EXECUTE --> VALIDATE |
  |       ^                                    |          |
  |       |         JUDGE (independent)        |          |
  |       |              |                     |          |
  |       |         grade >= target? --YES--> EXIT        |
  |       |              |                                |
  |       +--------- NO (feed gaps back) ----------------+
  +-----------------------------------------------------+
        |
        v
Codebase (grade: 9.7)
```

## The 4 Primary Commands

ProductionOS has 35 commands, but users need to know only 4:

```
/omni-plan-nth     THE orchestrator. Chains ALL skills. Loops until 10/10.
/auto-swarm-nth    Parallel agent swarm. 100% coverage. Recursive quality.
/production-upgrade Full codebase audit + iterative fix convergence.
/designer-upgrade  UI/UX redesign + HTML mockups + browser annotation.
```

These 4 can invoke ANY other command or agent. They are the entry points. All other commands (`/self-eval`, `/ux-genie`, `/deep-research`, etc.) are specialist — invoked by the primaries or used standalone.

## Command Pipeline

```
PREAMBLE (templates/PREAMBLE.md — runs before every skill)
    |
    v
COMMAND (21 available, 4 primary)
    |
    +-- resolves relevant AGENTS from agents/ (64 total)
    |
    +-- produces ARTIFACTS to .productionos/
    |
    +-- runs SELF-EVAL (templates/SELF-EVAL-PROTOCOL.md — default-on)
    |
    +-- runs CONVERGENCE ENGINE (parameterized per command)
    |
    +-- logs to PERSISTENT STATE (~/.productionos/)
    |
    v
POSTAMBLE (self-eval score gating, instinct extraction)
```

## Self-Evaluation Architecture (v7.0)

The signature feature of v7.0. Every agent action is questioned:

```
               ┌──────────────┐
               │ AGENT OUTPUT │
               └──────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │  SELF-CHECK   │  Quick structural validation (< 30s)
              └──────┬────────┘
                     │
              PASS?──┤──FAIL → IMMEDIATE REJECT
                     │
                     ▼
              ┌───────────────┐
              │  SELF-EVAL    │  7 Questions: Quality, Necessity, Correctness,
              │  (7 questions)│  Dependencies, Completeness, Learning, Honesty
              └──────┬────────┘
                     │
         >= 8.0 ────┤──── < 8.0
              │           │
              ▼           ▼
        ┌──────────┐ ┌──────────────┐
        │  ACCEPT  │ │  SELF-HEAL   │  Targeted fix loop (max 3 iterations)
        └────┬─────┘ └──────┬───────┘
             │              │
             ▼              ▼
        ┌──────────┐  RE-EVAL → still < 8.0? → ESCALATE TO HUMAN
        │  LEARN   │       │
        │(instinct)│  >= 8.0? → ACCEPT → LEARN
        └──────────┘
```

### Score Thresholds
- **>= 8.0** — PASS. Log and proceed.
- **6.0 - 7.9** — CONDITIONAL. Self-heal loop (max 3 iterations).
- **< 6.0** — FAIL. Block commit. Escalate to human.

## Designer-Upgrade Architecture (v7.0)

```
PHASE 1: DESIGN AUDIT (5 parallel agents)
├── ux-auditor: WCAG + interaction audit
├── design-system-architect: Token system evaluation
├── frontend-designer: Visual hierarchy analysis
├── comparative-analyzer: 5 competitor products
└── performance-profiler: Design-impacting metrics
    │
    ▼
PHASE 2: DESIGN SYSTEM CREATION
├── Color tokens (primitive + semantic + surface + text)
├── Typography scale (font families, sizes, weights)
├── Spacing system (4px grid)
├── Motion tokens (durations, easings)
└── Component inventory (all variants documented)
    │
    ▼
PHASE 3: HTML MOCKUP GENERATION
├── Self-contained HTML files (no external deps)
├── Dark mode toggle
├── Responsive preview (mobile/tablet/desktop)
├── Side-by-side comparison (current vs proposed)
├── Click-to-annotate overlay
└── Export annotations as JSON
    │
    ▼
PHASE 4: INTERACTIVE BROWSER REVIEW
├── Local HTTP server (python3 -m http.server)
├── User clicks elements to annotate issues
├── Priority tagging (must-fix / nice-to-have / keep)
└── Structured feedback export
    │
    ▼
PHASE 5: IMPLEMENTATION PLAN
├── Priority-ordered fix list (P0/P1/P2)
├── Token update specifications
├── Component rewrite list
└── Migration steps
```

## UX-Genie Architecture (v7.0)

```
PHASE 1: GUIDELINES INTAKE
├── Read existing design docs
├── Extract RBAC roles from code
└── Derive 3-5 user personas
    │
    ▼
PHASE 2: USER STORY GENERATION (20+ stories)
├── 10 dimensions: Onboarding, Core Workflow, Navigation,
│   Data Management, Collaboration, Settings, Error Recovery,
│   Empty States, Power User, Accessibility
└── Each story: As a {persona}, I want to {action}, So that {value}
    + Testable acceptance criteria
    │
    ▼
PHASE 3: JOURNEY MAPPING
├── Per-persona journey with emotional tracking
├── Code path tracing (file:line references)
└── Emotion curve plotting
    │
    ▼
PHASE 4: FRICTION ANALYSIS (8 types)
├── Cognitive, Visual, Interaction, Wait,
│   Error, Navigation, Context Switch, Trust
└── Friction score per journey
    │
    ▼
PHASE 5: AGENT DISPATCH (if fix mode)
├── Wave 1: Critical friction (P0)
├── Wave 2: High friction (P1)
└── Wave 3: Polish (P2)
    │
    ▼
PHASE 6: VERIFICATION
├── Story acceptance criteria validation
├── Journey replay
└── Self-eval on fix effectiveness
```

## Agent Architecture

### Why 65 agents instead of 1 big prompt

A single prompt covering security, UX, performance, design, accessibility, database, API, business logic, and deployment would be 50K+ tokens. The model attends to all weakly instead of any strongly.

Each agent has one job, one rubric, and focused tools. Evaluators can only Read. Executors can Edit. The self-evaluator questions everything.

### Agent Categories (64 total)

| Category | Count | Model | Access | Purpose |
|----------|-------|-------|--------|---------|
| Core Review | 11 | Default | Read-only | Code, security, UX, DB, naming, API, deps |
| Advanced Analysis | 9 | Opus (judges) | Read-only | Adversarial, persona, density, context, thought-graph |
| Execution | 9 | Default | Read+Write | Planning, profiling, healing, convergence, migration |
| Design & UX (v7) | 7 | Opus/Sonnet | Read+Write | Designer-upgrade, mockups, design system, UX-genie, stories |
| Quality (v7) | 2 | Sonnet | Read+Write | Self-evaluator, quality-loop-controller |
| Infrastructure (v7) | 1 | Sonnet | Read+Write | Session-context-manager |
| Orchestrative | 6 | Default | Varies | GitOps, frontend design, asset gen, comms, comparison |
| Foundation | 19 | Default | Varies | Scaffold, RAG, research, intake, requirements, etc. |

### Agent Independence Rule

**Agents that evaluate must never modify code. Agents that modify code must never evaluate themselves.** The self-evaluator is the bridge — it evaluates others but never evaluates itself.

```
EVALUATORS (read-only):           EXECUTORS (read-write):
  llm-judge                         refactoring-agent
  adversarial-reviewer               self-healer
  persona-orchestrator               dynamic-planner
  convergence-monitor                 designer-upgrade (v7)
  self-evaluator (v7)                 ux-genie (v7)

ORCHESTRATIVE (varies):
  gitops                             reverse-engineer
  frontend-designer                  comms-assistant
  comparative-analyzer               asset-generator
  quality-loop-controller (v7)       session-context-manager (v7)
```

This prevents the fox-guarding-henhouse problem where a fix agent reports its own fix as successful.

## Artifact Flow

Commands produce artifacts consumed by downstream commands — this is what makes ProductionOS a state machine, not a collection of isolated tools:

| Producer | Artifact | Consumer |
|----------|----------|----------|
| /deep-research | RESEARCH-*.md | /omni-plan Step 1 |
| /production-upgrade | AUDIT-DISCOVERY.md | /omni-plan Step 2 |
| /omni-plan | REVIEW-CEO.md, REVIEW-ENG.md | /auto-swarm (task context) |
| /omni-plan | OMNI-PLAN.md | /auto-swarm (task decomposition) |
| /auto-swarm | SWARM-REPORT.md | /omni-plan Step 9 |
| /agentic-eval | EVAL-CLEAR.md | /omni-plan Step 6 |
| /security-audit | AUDIT-SECURITY.md | /production-upgrade |
| /designer-upgrade | DESIGN-SYSTEM.md, mockups/ | /ux-genie, /frontend-upgrade |
| /ux-genie | USER-STORIES.md, FRICTION-REPORT.md | /designer-upgrade Phase 5 |
| /self-eval | self-eval/*.md | All commands (convergence scoring) |

## Hook Architecture (v7.0)

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

EVERY AGENT ACTION (v7.0 — protocol-level, not hook-level)
  ↓ SELF-EVAL-PROTOCOL.md (7 questions, score gating, self-heal loop)
```

## Session Context Management (v7.0)

```
L0: ALWAYS LOADED (< 2K tokens)
├── Project identity (name, stack, purpose)
├── Current branch and last commit
├── Session goals
└── Critical constraints

L1: LOADED ON DEMAND (2K-10K per item)
├── Relevant handoff documents
├── Recent self-eval results
├── Active TODO items
└── Architecture decisions (if applicable)

L2: LOADED WHEN REFERENCED (10K+)
├── Full audit reports
├── Complete design system spec
├── Full user story collection
└── Historical convergence logs
```

Context rot detection monitors for: repeated work, contradictions, score regression, scope drift, token pressure. Compression triggers at 60% window usage.

## The 10-Layer Prompt Composition

| Layer | Addresses | Research |
|-------|-----------|----------|
| L1: Emotion Prompting | Low effort on "boring" tasks | Li 2023: +8-15% accuracy |
| L2: Meta-Prompting | Premature conclusions | Forces reflection before action |
| L2.5: Scratchpad | Surface-level reasoning | Private inner monologue |
| L3: Context Retrieval | Hallucinated assumptions | Grounds in actual docs/history |
| L4: Chain of Thought | Skipped reasoning steps | Wei 2022: +20-30% on complex |
| L4+: ES-CoT (budget mode) | Token waste on convergent findings | arXiv 2509.14004: ~41% savings |
| L5: Tree of Thought | Single-path fixation | Yao 2023: +70% on planning |
| L6: Graph of Thought | Missed systemic connections | Besta 2024: +51% on synthesis |
| L7: Chain of Density | Context rot across iterations | Adams 2023: 3x compression |
| L8: Generated Knowledge | Missing domain context | Pre-generate best practices |
| L9: Distractor-Augmented | Anchoring bias in judges | Chhikara 2025: +460% accuracy |
| L10: 12-Factor Agent | Monolithic agents | Small focused agents, unified state |

## Persistent State (~/.productionos/)

```
~/.productionos/
├── config/settings.json     # User settings (proactive, telemetry, auto_review, self_eval)
├── analytics/
│   ├── skill-usage.jsonl    # Append-only event log
│   └── review-log.jsonl     # Review results history
├── sessions/
│   ├── {PID}                # Active session markers
│   ├── edit-count-{PID}     # Per-session edit counter
│   ├── checkpoint-{ts}.md   # Context checkpoints (v7)
│   └── handoff-{date}.md    # Auto-generated handoff docs
├── instincts/
│   ├── project/{hash}/      # Project-scoped learned patterns
│   └── global/              # Cross-project patterns (confidence > 0.8)
├── self-eval/               # Self-evaluation logs (v7)
├── review-log/              # Detailed review artifacts
└── cache/                   # Version check snooze, temp data
```

## Security Model

- Protected files: .env, keys, certs, production configs (PreToolUse hook)
- Max 15 files per batch, 200 lines per file
- Pre-commit diff review required
- Pre-push ALWAYS requires approval
- Automatic rollback on test failure or score regression
- Stakes classification on all 65 agents (LOW/MEDIUM/HIGH)
- Red Flags behavioral guardrails on all agents
- Self-eval catches scope creep and untested claims

## Dependencies

### Required
- **Claude Code CLI** — the runtime environment
- **Bun** (>=1.0.0) — for TypeScript validation scripts

### Recommended
- **gstack** — /plan-ceo-review, /plan-eng-review, /qa, /browse, /ship, /review
- **superpowers** — /brainstorming, /writing-plans, /test-driven-development
- **everything-claude-code** — 65+ additional skills

### Without Recommended Plugins
Commands that reference gstack/superpowers skills skip those steps gracefully. The core pipeline works without external plugins.

## Convergence Engine

### Why convergence, not iteration count

A fixed iteration count wastes money on codebases that converge early and underserves those that need more passes. The convergence engine stops when improvement plateaus:

| Command | Success | Converged | Max | Decision |
|---------|---------|-----------|-----|----------|
| /production-upgrade | grade = 10/10 | delta < 0.1 x2 | 7 iter | grade comparison |
| /omni-plan | grade = 10/10 | delta < 0.1 x2 | 7 loops | PIVOT/REFINE/PROCEED |
| /auto-swarm | coverage = 100% | delta < 2% x2 | 11 waves | gap analysis |
| /deep-research | confidence >= 95% | - | 3 loops | PIVOT/REFINE/PROCEED |
| /designer-upgrade | design score = 10/10 | delta < 0.5 x2 | 7 iter | dimension scoring |
| /ux-genie | friction score = 10/10 | stories done | 5 iter | acceptance criteria |

### Why focus narrowing

After each iteration, the judge identifies the 2 lowest-scoring dimensions. The next iteration focuses exclusively on those. Without this, the pipeline thrashes — fixing security breaks performance, fixing performance breaks error handling.

### Why the judge is independent

The judge runs as a separate agent with read-only access. It reads the actual codebase, not agent self-reports. Without this independence, fix agents would always report success. The v7 self-evaluator adds another layer — it questions whether the judge itself was thorough.

## Self-Learning System

The `hooks/self-learn.sh` PostToolUse hook silently captures:
- Which files are modified most (churn hotspots)
- Which validation commands fail (recurring issues)
- Which agent dispatches happen (workflow patterns)

This data accumulates in `~/.productionos/instincts/` as structured patterns. The v7 self-eval protocol adds a Learning question that extracts patterns after every agent action, feeding the instinct system continuously.

## Error Architecture

What happens when things fail:

| Failure | Detection | Response | User Impact |
|---------|-----------|----------|-------------|
| Agent times out | Claude Code 120s default | Log timeout, skip agent, continue | Warning in report, reduced coverage |
| Judge can't parse response | Malformed JSON/markdown | Retry once, then use raw text | Degraded scoring |
| Convergence stalls (delta < threshold 2x) | convergence-monitor | CONVERGED exit — accept current grade | Grade below target but plateau reached |
| Convergence degrades (dimension drops >0.5) | convergence-monitor | HALT — rollback last batch | Explicit regression warning |
| Context window fills | Claude Code auto-compacts | session-context-manager compresses (v7) | Context checkpointed before compression |
| External plugin missing | Command invocation fails | Graceful degradation — skip step | Reduced depth, documented in output |
| Test suite fails after fix | Validation gate | self-healer (10 rounds), then rollback | Fix deferred to TODOS.md |
| Git conflict during commit | gitops agent pre-check | Abort commit, suggest resolution | Manual resolution required |
| Self-eval score < 6.0 (v7) | self-evaluator | BLOCK commit, escalate to human | Work paused until human reviews |

### Graceful Degradation

Commands reference external skills (/plan-ceo-review, /qa, /browse from gstack). When not installed:
- The command logs "SKIP: /{skill} not available" and continues
- Review depth is reduced but the pipeline doesn't crash
- Final report notes which reviews were skipped

## TypeScript Infrastructure

| Script | Purpose | Lines |
|--------|---------|-------|
| `gen-skill-docs.ts` | Validate version/agent/command consistency | ~230 |
| `skill-check.ts` | 10-check health dashboard | ~360 |
| `validate-agents.ts` | Frontmatter validation for all agents | ~250 |
| `context-audit.ts` | Token budget tracking | ~190 |
| `review-dashboard.ts` | Review readiness dashboard | ~160 |
| `skill-validation.test.ts` | 19 automated tests | ~410 |

## Installation

```bash
# Option 1: Clone to Claude Code plugins directory
git clone https://github.com/ShaheerKhawaja/ProductionOS.git \
  ~/.claude/plugins/marketplaces/productupgrade

# Install TypeScript dependencies
cd ~/.claude/plugins/marketplaces/productupgrade && bun install

# Initialize persistent state
bash bin/pos-init

# Verify installation
bun run skill:check    # Should show 10/10
bun run validate       # Should show 64/64 valid
bun test               # Should show 196+ pass
```

Minimum requirements: Claude Code 2.0+, Bun 1.0+, macOS or Linux.

## Comparison with gstack

| Dimension | gstack | ProductionOS |
|-----------|--------|-------------|
| Architecture | 22 skills (sequential) | 65 agents (parallel swarm) |
| Multi-model | Eval-only | Tri-tiered tribunal with DOWN gate |
| Prompt layers | Implicit (latent-space) | Explicit 12-layer composition |
| Convergence | hyper-plan (10 dims) | Parameterized per command |
| Research | None | /deep-research (8-phase), /max-research (500+ agents) |
| Security | Section-level | OWASP/MITRE/NIST agents |
| Design | /design-review (visual only) | /designer-upgrade (audit + mockups + annotation) |
| UX | None | /ux-genie (stories + journeys + friction) |
| Self-evaluation | None | 7-question protocol, default-on (v7) |
| Cross-run learning | None | Instincts + self-learn + context management |
| Browser automation | Compiled Playwright daemon | Via gstack /browse integration |

## What's Intentionally Not Here

- **No MCP server.** ProductionOS orchestrates existing tools; it doesn't need to be one.
- **No GUI/dashboard.** Output is Markdown files in `.productionos/`. (Dashboard is on the roadmap.)
- **No cloud backend.** Everything runs locally. No data leaves the machine.
- **No bundled skills.** External plugins (gstack, superpowers, ECC) are referenced when available, not duplicated. This solved the 529 overloaded_error from bundling 268KB of duplicate skills.
