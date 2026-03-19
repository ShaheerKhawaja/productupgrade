# ProductionOS Architecture

This document explains **why** ProductionOS is built the way it is. For setup and commands, see CLAUDE.md. For contributing, see CONTRIBUTING.md.

## Implementation Status

| Capability | Status | Notes |
|------------|--------|-------|
| 49 agent definitions | IMPLEMENTED | Quality ranges from 60-line stubs to 800-line production protocols |
| 17 commands | IMPLEMENTED | All pipeline commands have Step 0 preambles |
| TypeScript validation (skill-check, validate-agents) | IMPLEMENTED | 10/10 checks passing |
| Artifact flow between commands | IMPLEMENTED | Method 4 validation in INVOCATION-PROTOCOL.md; preamble checks .productionos/ |
| Convergence loop for /omni-plan | IMPLEMENTED | Full PIVOT/REFINE/PROCEED with tri-tiered judging |
| Convergence loop for /production-upgrade | IMPLEMENTED | --converge flag, max 5 iterations, target 10.0 |
| Self-learning hook | IMPLEMENTED | self-learn.sh v2 wired in hooks.json PostToolUse, cross-session aggregation |
| Review Readiness Dashboard | IMPLEMENTED | scripts/review-dashboard.ts works, log subcommand available |
| Artifact manifest tracking | IMPLEMENTED | INVOCATION-PROTOCOL.md Method 4 with MANIFEST block validation |
| Fix-first heuristic | PARTIAL | code-reviewer + stub-detector implement AUTO-FIX/ASK |

## Design Philosophy

1. **State machine, not isolated tools** — commands produce artifacts consumed by downstream commands via `.productionos/` [DESIGNED — artifact checking not yet enforced]
2. **Agents load on-demand** — only read agent definitions when a command references them [GUIDELINE — no lazy-loading mechanism enforces this]
3. **Tri-tiered evaluation** — Judge 1 (Opus/correctness), Judge 2 (Sonnet/practicality), Judge 3 (Adversarial/attack surface) [IMPLEMENTED in /omni-plan]
4. **Recursive convergence** — loop until quality target met, with PIVOT/REFINE/PROCEED decision logic [IMPLEMENTED in /omni-plan, DESIGNED for others]
5. **Fix-first** — auto-fix mechanical issues, only ask about ambiguous ones [PARTIAL — code-reviewer only]

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
Codebase (grade: 8.1)
```

## Command Pipeline

Commands chain through a shared architecture:

```
SHARED PREAMBLE (templates/PREAMBLE.md)
    |
    v
COMMAND (17 available)
    |
    +-- resolves relevant AGENTS from agents/ (49 total)
    |
    +-- produces ARTIFACTS to .productionos/
    |
    +-- runs CONVERGENCE ENGINE (parameterized per command)
    |
    +-- logs to REVIEW DASHBOARD (scripts/review-dashboard.ts)
    |
    v
DELIVERY (commit, push, PR via gitops agent)
```

The commands exist on a spectrum of depth and agent orchestration:

```
Depth:    STANDARD             DEEP               EXHAUSTIVE
          /production-upgrade  /auto-swarm         /omni-plan
Target:   10/10               100% coverage       10/10
Agents:   7/phase (49 max)    7/wave (77 max)     14/phase (147 max)
```

All commands target maximum quality. The convergence loop runs until the target is met or improvement plateaus — there is no reason to accept less when iterations are cheap. The depth tiers control how many agents and iterations are deployed, not what quality bar is acceptable.

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

## Agent Architecture

### Why 49 agents instead of 1 big prompt

A single prompt covering security, UX, performance, naming, accessibility, database design, API contracts, business logic, and deployment safety would be 50K+ tokens of instructions. The model would attend to all of them weakly instead of any of them strongly.

Each agent has one job, one rubric, and a focused set of tools. The `llm-judge` can only Read (never Edit). The `self-healer` can Edit (but only lint/type errors). The `adversarial-reviewer` thinks like an attacker. The `persona-orchestrator` evaluates from three perspectives simultaneously.

### Agent independence

The critical design rule: **agents that evaluate must never modify code, and agents that modify code must never evaluate themselves.**

```
EVALUATORS (read-only):           EXECUTORS (read-write):
  llm-judge                         refactoring-agent
  adversarial-reviewer               self-healer
  persona-orchestrator               dynamic-planner
  convergence-monitor

ORCHESTRATIVE (varies):
  gitops                             reverse-engineer
  frontend-designer                  comms-assistant
  comparative-analyzer               asset-generator
```

This prevents the fox-guarding-henhouse problem where a fix agent reports its own fix as successful.

### Agent Categories (49 total)

| Category | Count | Model | Access | Purpose |
|----------|-------|-------|--------|---------|
| Core Review | 11 | Default | Read-only | Code, security, UX, DB, naming, API, deps |
| Advanced Analysis | 9 | Opus (judges) | Read-only | Adversarial, persona, density, context, thought-graph |
| Execution | 9 | Default | Read+Write | Planning, profiling, healing, convergence, migration |
| V5.1 Orchestrative | 6 | Default | Varies | GitOps, frontend design, asset gen, comms, comparison, reverse engineering |

### Why Opus for judges and researchers

Model assignment follows the principle: **reasoning quality matters most where errors compound.**

- A wrong judge score propagates through the convergence loop and can add 2-3 unnecessary iterations ($10-20 wasted)
- A missed research finding means the pipeline optimizes in the wrong direction
- A slightly imperfect code fix gets caught by the validation gate anyway

So judges and researchers get Opus (highest reasoning). Executors use the session's default model.

## The 10-Layer Prompt Composition

Every technique has published research showing measurable accuracy improvement. They're not decorative — each layer addresses a specific failure mode:

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

Layers are applied selectively via the application matrix in `templates/PROMPT-COMPOSITION.md`. Not every agent gets every layer.

## Convergence Engine

### Why convergence, not iteration count

A fixed iteration count wastes money on codebases that converge early and underserves those that need more passes. The convergence engine stops when improvement plateaus:

| Command | Success | Converged | Max | Decision |
|---------|---------|-----------|-----|----------|
| /production-upgrade | grade = 10/10 | delta < 0.1 x2 | 7 iter | grade comparison |
| /omni-plan | grade = 10/10 | delta < 0.1 x2 | 7 loops | PIVOT/REFINE/PROCEED |
| /auto-swarm | coverage = 100% | delta < 2% x2 | 11 waves | gap analysis |
| /deep-research | confidence >= 95% | - | 3 loops | PIVOT/REFINE/PROCEED |

The convergence engine accepts a plateau (CONVERGED) as the practical exit — if two consecutive iterations show delta < 0.1 with no improvement, the codebase has reached its ceiling for this pass. The MAX limit prevents infinite loops. But the TARGET is always perfection.

### Why focus narrowing

After each iteration, the judge identifies the 2 lowest-scoring dimensions. The next iteration focuses exclusively on those. Without this, the pipeline thrashes — fixing security breaks performance, fixing performance breaks error handling.

Focus narrowing creates a monotonic improvement trajectory:

```
Iteration 1: All 10 dimensions --> identifies weak spots
Iteration 2: Focus on Tests + Security --> those improve
Iteration 3: Focus on Performance + Accessibility --> those improve
```

### Why the judge is independent

The judge runs as a separate agent with read-only access. It reads the actual codebase, not agent self-reports. Without this independence, fix agents would always report success.

## Self-Learning System

The `hooks/self-learn.sh` PostToolUse hook silently captures:
- Which files are modified most (churn hotspots)
- Which validation commands fail (recurring issues)
- Which agent dispatches happen (workflow patterns)

This data accumulates in `~/.productionos/learned/` as JSONL. Every 50 events, patterns are extracted into a summary.

## TypeScript Infrastructure

| Script | Purpose | Lines |
|--------|---------|-------|
| `gen-skill-docs.ts` | Validate version/agent/command consistency | ~230 |
| `skill-check.ts` | 10-check health dashboard | ~360 |
| `validate-agents.ts` | Frontmatter validation for all agents | ~250 |
| `context-audit.ts` | Token budget tracking | ~190 |
| `review-dashboard.ts` | Review readiness dashboard | ~160 |
| `skill-validation.test.ts` | 19 automated tests | ~410 |

## Security Model

- Protected files: .env, keys, certs, production configs
- Max 15 files per batch, 200 lines per file
- Pre-commit diff review required (unless --auto-commit)
- Pre-push ALWAYS requires approval
- Automatic rollback on test failure or score regression
- Cost threshold ($10 / 1M tokens) triggers pause

## Error Architecture

What happens when things fail:

| Failure | Detection | Response | User Impact |
|---------|-----------|----------|-------------|
| Agent times out | Claude Code 120s default | Log timeout, skip agent, continue with remaining | Warning in report, reduced coverage |
| Judge can't parse response | Malformed JSON/markdown | Retry once with explicit format instruction, then use raw text | Degraded scoring (text-based, not structured) |
| Convergence stalls (delta < threshold 2x) | convergence-monitor agent | CONVERGED exit — accept current grade, report plateau | Grade below target but no further improvement possible |
| Convergence degrades (dimension drops >0.5) | convergence-monitor | HALT — rollback last batch, flag regression | Explicit regression warning with rollback |
| Context window fills | Claude Code auto-compacts | density-summarizer compresses prior context | Possible context loss on iterations 5+ |
| External plugin missing (gstack, superpowers) | Command invocation fails | Graceful degradation — skip that step, note in report | Reduced review depth, documented in output |
| Test suite fails after fix batch | Validation gate in Step 10 | self-healer (10 rounds), then rollback if unresolvable | Fix deferred to TODOS.md |
| Git conflict during commit | gitops agent pre-check | Abort commit, report conflict, suggest resolution | Manual resolution required |

### Graceful Degradation

Commands reference external skills (/plan-ceo-review, /qa, /browse from gstack). If these aren't installed:
- The command logs "SKIP: /plan-ceo-review not available" and continues
- The review depth is reduced but the pipeline doesn't crash
- The final report notes which reviews were skipped

This is not yet implemented — currently, missing skills cause a silent failure where the step produces no output and downstream consumers get no input.

## Dependencies

### Required
- **Claude Code CLI** — the runtime environment
- **Bun** (>=1.0.0) — for TypeScript validation scripts (`bun run skill:check`)

### Recommended (enhance capabilities)
- **gstack** — provides /plan-ceo-review, /plan-eng-review, /qa, /browse, /ship, /review
- **superpowers** — provides /brainstorming, /writing-plans, /test-driven-development
- **everything-claude-code** — provides 65+ additional skills for specialized tasks

### Without Recommended Plugins
Commands that reference gstack/superpowers skills will skip those steps. The core audit pipeline (/production-upgrade Steps 0-6) works without external plugins but loses the CEO/Eng review depth and browser-based QA.

## Installation

```bash
# Clone to Claude Code plugins directory
git clone https://github.com/ShaheerKhawaja/productupgrade.git \
  ~/.claude/plugins/marketplaces/productupgrade

# Install TypeScript dependencies
cd ~/.claude/plugins/marketplaces/productupgrade && bun install

# Verify installation
bun run skill:check    # Should show 10/10
bun run validate       # Should show 49/49 valid
```

Minimum requirements: Claude Code 2.0+, Bun 1.0+, macOS or Linux.

## What's Intentionally Not Here

- **No MCP server.** ProductionOS orchestrates existing tools; it doesn't need to be one.
- **No GUI/dashboard.** Output is Markdown files in `.productionos/`. Any Markdown viewer works.
- **No cloud backend.** Everything runs locally. No data leaves the machine.
- **No bundled skills.** External plugins (gstack, superpowers, ECC) are referenced when available, not duplicated. This solved the 529 overloaded_error from bundling 268KB of duplicate skills.

## Comparison with gstack

| Dimension | gstack | ProductionOS |
|-----------|--------|-------------|
| Architecture | 16 skills (sequential) | 49 agents (parallel swarm) |
| Multi-model | Eval-only | Tri-tiered tribunal with DOWN gate |
| Prompt layers | Implicit (latent-space) | Explicit 10-layer composition |
| Convergence | hyper-plan (10 dims) | Parameterized per command |
| Research | None | /deep-research (8-phase) |
| Security | Section-level | OWASP/MITRE/NIST agents |
| Build system | Bun + compiled binary | Bun (scripts only) |
| Testing | 3-tier (static + E2E + LLM-judge) | Tier 1 (static) |
| Cross-run learning | None | MetaClaw + self-learn |
| Browser automation | Compiled Playwright daemon | Via gstack /browse integration |
