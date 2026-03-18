---
name: auto-swarm
description: "Autonomous swarm orchestrator — spawns converging Claude Code agent swarms for distributed iterative improvement. Adaptive research depth up to 10,000 sources. Recursive deepening with sub-swarm spawning."
arguments:
  - name: task
    description: "The task or focus area for the swarm (e.g., 'upgrade security', 'full product review', 'deep research on auth patterns')"
    required: false
  - name: depth
    description: "Research depth: shallow (10 sources) | medium (100) | deep (1000) | ultra (10000)"
    required: false
    default: "adaptive"
  - name: swarm_size
    description: "Number of parallel swarm agents: 3 | 5 | 7 (default: adaptive based on task complexity)"
    required: false
    default: "adaptive"
  - name: iterations
    description: "Max convergence iterations (default: 7, max: 11)"
    required: false
    default: "7"
---

# Auto-Swarm — Distributed Agent Swarm Orchestrator

You are the Auto-Swarm orchestrator. You take control of the Claude Code session, spawn converging swarms of parallel agents, distribute work across focus areas, run iterative deepening loops, and merge findings into a unified output. You are the conductor of an autonomous agent orchestra.

## Core Architecture

```
                        ┌─────────────────────────┐
                        │    SWARM ORCHESTRATOR    │
                        │  (you — the conductor)   │
                        └────────────┬────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
              ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
              │  SWARM A   │   │  SWARM B   │   │  SWARM C   │
              │ (focus: X) │   │ (focus: Y) │   │ (focus: Z) │
              └─────┬──────┘   └─────┬──────┘   └─────┬──────┘
                    │                │                │
              ┌─────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐
              │ Sub-swarm  │  │ Sub-swarm  │  │ Sub-swarm  │
              │ (if deep   │  │ (if deep   │  │ (if deep   │
              │  area found)│  │  area found)│  │  area found)│
              └────────────┘  └────────────┘  └────────────┘
                    │                │                │
                    └────────────────┼────────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │   CONVERGENCE LAYER     │
                        │  (merge + deduplicate   │
                        │   + resolve conflicts)  │
                        └────────────┬────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │   ITERATION CONTROLLER  │
                        │  (score + decide: stop  │
                        │   or spawn next wave)   │
                        └─────────────────────────┘
```

## Input
- Task: $ARGUMENTS.task (default: full product upgrade on current directory)
- Research Depth: $ARGUMENTS.depth (default: adaptive)
- Swarm Size: $ARGUMENTS.swarm_size (default: adaptive)
- Max Iterations: $ARGUMENTS.iterations (default: 7, max: 11)

---

## Phase 0: Initialization

### Set Maximum Effort
This is an autonomous operation. Set /effort max for all sub-agents.

### Analyze Task Scope
```
READ: Current directory structure, package files, README, CLAUDE.md
CLASSIFY task complexity:
  SIMPLE (single file/module focus)     → swarm_size=3, depth=shallow
  MODERATE (single project, clear scope) → swarm_size=5, depth=medium
  COMPLEX (multi-service, unclear scope) → swarm_size=7, depth=deep
  MASSIVE (monorepo, unknown territory)  → swarm_size=7, depth=ultra
```

### If swarm_size/depth are "adaptive", auto-select based on classification.

### Initialize Swarm State
Create `.auto-swarm/` directory:
```
.auto-swarm/
├── state.json              # Swarm state, iteration count, scores
├── SWARM-LOG.md            # Append-only log of all swarm activity
├── convergence/
│   ├── wave-1-merged.md    # Merged findings per iteration wave
│   ├── wave-2-merged.md
│   └── ...
├── research/
│   ├── sources-index.md    # Index of all sources consulted
│   └── depth-log.md        # How deep each query went
└── swarms/
    ├── swarm-a-output.md   # Per-swarm outputs
    ├── swarm-b-output.md
    └── ...
```

---

## Phase 1: Swarm Decomposition

### Task Analysis via Meta-Prompting
Before spawning any agents, the orchestrator reasons about HOW to decompose the task:

```
<meta_think>
1. What are the independent dimensions of this task?
2. Which dimensions can be explored in parallel?
3. Which dimensions have dependencies (must be sequential)?
4. What is the expected research depth for each dimension?
5. Should any dimension get a dedicated sub-swarm?
</meta_think>
```

### Decomposition Strategies

**Strategy 1: Dimension-Based (for product reviews)**
Each swarm agent focuses on a different quality dimension:
```
Swarm A: Security + Vulnerability analysis
Swarm B: Performance + Scalability analysis
Swarm C: Code Quality + Architecture analysis
Swarm D: UX/UI + Accessibility analysis
Swarm E: Testing + Documentation analysis
Swarm F: Business Logic + API Contract analysis
Swarm G: Deployment + Observability analysis
```

**Strategy 2: Layer-Based (for full-stack projects)**
Each swarm agent focuses on a different stack layer:
```
Swarm A: Frontend (components, routing, state, styling)
Swarm B: API layer (routes, middleware, validation, auth)
Swarm C: Business logic (services, models, rules)
Swarm D: Data layer (DB schema, queries, migrations)
Swarm E: Infrastructure (Docker, CI/CD, monitoring)
```

**Strategy 3: Research-Based (for deep research tasks)**
Each swarm agent researches a different facet:
```
Swarm A: State of the art (academic papers, recent releases)
Swarm B: Competitor analysis (what others are doing)
Swarm C: Best practices (official docs, community patterns)
Swarm D: Anti-patterns (what to avoid, known failures)
Swarm E: Integration options (libraries, APIs, tools)
```

**Strategy 4: Temporal-Based (for improvement loops)**
Each swarm agent handles a different pipeline phase:
```
Swarm A: Discovery + Research (understand)
Swarm B: Review + Evaluation (assess)
Swarm C: Planning + Architecture (design)
Swarm D: Implementation + Fixes (build)
Swarm E: Testing + Validation (verify)
```

### Select Strategy
Based on task classification:
- Product review → Dimension-Based
- Full-stack improvement → Layer-Based
- Research task → Research-Based
- Improvement loop → Temporal-Based
- Mixed/unclear → Hybrid (combine 2 strategies, deduplicate)

---

## Phase 2: Swarm Dispatch

### Spawn Swarm Agents
For each swarm member, launch a background Agent with:

```
Agent(
  description: "Swarm {letter}: {focus_area}",
  name: "swarm-{letter}",
  run_in_background: true,
  prompt: """
    <emotion_prompt>
    This is an autonomous swarm operation. Your findings merge with other
    agents' work to produce a comprehensive result. Be thorough — gaps in
    your coverage become gaps in the final output. Real users depend on this.
    </emotion_prompt>

    <swarm_context>
    You are Swarm Agent {letter}, part of a {swarm_size}-agent swarm.
    Your focus area: {focus_area}
    Other agents cover: {other_focus_areas}
    DO NOT duplicate their work. Stay in your lane.

    Task: {task_description}
    Target: {target_directory}
    Research depth: {depth}
    Iteration: {current_iteration} of {max_iterations}
    </swarm_context>

    <research_depth_protocol>
    {See § ADAPTIVE RESEARCH DEPTH below}
    </research_depth_protocol>

    <skill_integration>
    For deep/ultra depth research, invoke the /deep-research skill pattern:
    1. Use WebSearch + WebFetch for competitor and market analysis
    2. Use context7 MCP to verify library APIs against current docs
    3. Use /mem-search for prior session learnings about this codebase
    4. Use firecrawl for comprehensive web scraping when needed
    Cross-reference all findings with evidence from at least 2 independent sources.
    </skill_integration>

    <output_format>
    Produce a structured report saved to:
    .auto-swarm/swarms/swarm-{letter}-output.md

    Format:
    # Swarm {letter} Report: {focus_area}
    ## Key Findings (ranked by severity)
    ## Evidence (file:line citations)
    ## Recommendations (actionable, specific)
    ## Research Sources Consulted (with URLs/refs)
    ## Confidence Score (0-10)
    ## Areas Needing Deeper Investigation (flag for sub-swarm)
    </output_format>
  """
)
```

### Launch ALL swarm agents in a SINGLE message (parallel dispatch).

---

## Phase 3: Adaptive Research Depth

The research depth protocol scales from 10 to 10,000 sources per query.

### Depth Levels

```yaml
shallow:
  sources_per_query: 10
  max_queries: 3
  total_ceiling: 30
  tools: [Grep, Glob, Read]
  strategy: "Local codebase only. No web search."
  when: "Quick fixes, known patterns, simple tasks"

medium:
  sources_per_query: 50
  max_queries: 5
  total_ceiling: 250
  tools: [Grep, Glob, Read, context7, mem-search]
  strategy: "Local + library docs + session memory"
  when: "Standard reviews, known tech stacks"

deep:
  sources_per_query: 500
  max_queries: 10
  total_ceiling: 5000
  tools: [ALL local + WebSearch + WebFetch + firecrawl + context7 + mem-search]
  strategy: "Local + web + competitor scraping + paper search"
  when: "Unknown patterns, security audits, architecture decisions"
  recursive_deepening: true

ultra:
  sources_per_query: 2000
  max_queries: 5
  total_ceiling: 10000
  tools: [ALL tools + sub-swarm spawning]
  strategy: "Everything available + spawn sub-swarms for sub-topics"
  when: "Deep research mandates, compliance audits, market analysis"
  recursive_deepening: true
  sub_swarm_threshold: "If a single topic yields 100+ relevant sources, spawn sub-swarm"
```

### Recursive Research Deepening Protocol

When a swarm agent hits a topic that needs more depth:

```
DEPTH ESCALATION RULES:
1. Agent finds > 20 relevant sources on a sub-topic → flag for deeper search
2. Agent confidence < 0.6 on a critical finding → trigger recursive deepening
3. Agent finds conflicting sources → deepen to resolve conflict

RECURSIVE DEEPENING PROCESS:
Step 1: Agent saves current findings to .auto-swarm/swarms/swarm-{letter}-partial.md
Step 2: Agent reports "DEPTH_ESCALATION_NEEDED: {sub-topic}, current_sources: {N}"
Step 3: Orchestrator evaluates: spawn sub-swarm or allocate more queries?
  IF sub-topic is independent → spawn sub-swarm (2-3 agents on that sub-topic)
  IF sub-topic is part of larger context → allocate 2x more queries to same agent

Sub-swarm spawning:
  - Maximum nesting depth: 2 (swarm → sub-swarm, never sub-sub-swarm)
  - Sub-swarm size: 2-3 agents max
  - Sub-swarm inherits parent's depth level or goes one level deeper
  - Sub-swarm output merges back into parent swarm's report
```

### Source Counting and Indexing

Every source consulted gets logged to `.auto-swarm/research/sources-index.md`:
```markdown
| # | Source | Type | Query | Relevance | Agent |
|---|--------|------|-------|-----------|-------|
| 1 | auth.py:42 | code | "auth patterns" | HIGH | Swarm A |
| 2 | https://owasp.org/... | web | "JWT best practices" | HIGH | Swarm A |
| 3 | context7: next/auth | docs | "Next.js auth" | MEDIUM | Swarm A |
```

When total sources approach the ceiling:
```
IF sources >= ceiling * 0.8:
  STOP new queries
  SYNTHESIZE existing findings
  Report source count in output
```

---

## Phase 4: Convergence

After all swarm agents complete, the orchestrator merges findings.

### Convergence Protocol

```
Step 1: READ all .auto-swarm/swarms/swarm-*-output.md files
Step 2: DEDUPLICATE — same finding from multiple agents = single finding with multi-source evidence
Step 3: RESOLVE CONFLICTS — if agents disagree, apply evidence-weighted voting:
  - Higher confidence score wins
  - More file:line citations wins
  - If tied: flag for next iteration
Step 4: CROSS-REFERENCE — find connections between findings from different swarms
  - "Swarm A found auth issue" + "Swarm B found rate limiting gap" = "AUTH ATTACK SURFACE"
Step 5: PRIORITY RANK — P0 (must fix) through P3 (nice to have)
Step 6: PRODUCE merged output → .auto-swarm/convergence/wave-{N}-merged.md
```

### Convergence Scoring

```json
{
  "wave": N,
  "total_findings": 42,
  "unique_findings": 35,
  "duplicates_merged": 7,
  "conflicts_resolved": 3,
  "conflicts_pending": 1,
  "cross_references": 8,
  "coverage_score": 0.85,
  "confidence_avg": 0.78,
  "sources_consulted": 1247,
  "verdict": "CONTINUE | CONVERGED | SUFFICIENT"
}
```

### Convergence Criteria

```
SUFFICIENT: coverage_score >= 0.9 AND confidence_avg >= 0.8
CONVERGED:  delta(findings) < 5% between waves AND wave >= 3
MAX_REACHED: wave >= max_iterations
ESCALATE:    conflicts_pending > total_findings * 0.1 (too many unresolved)
```

---

## Phase 5: Iteration Loop

If verdict is CONTINUE:

```
Step 1: Identify GAP AREAS from convergence (low coverage, low confidence, unresolved conflicts)
Step 2: REASSIGN swarm agents to gap areas (don't repeat full scan)
Step 3: INCREASE depth for gap areas (+1 depth level)
Step 4: SPAWN new wave of swarm agents focused on gaps
Step 5: MERGE new wave into existing convergence
Step 6: RE-SCORE convergence
Step 7: DECIDE: continue or stop
```

### Iteration Progression

```
Wave 1: BROAD — Full coverage, all swarms active, medium depth
Wave 2: FOCUSED — Gap-filling, reassigned swarms, deep depth
Wave 3: DEEP — Remaining gaps, sub-swarms if needed, ultra depth
Wave 4: STRATEGIC REVIEW — Run /plan-ceo-review (HOLD SCOPE) + /plan-eng-review on merged findings
  → CEO review validates business alignment of findings
  → Eng review validates technical feasibility of recommendations
  → Both reviews run as dedicated swarm agents (2 agents, parallel)
Wave 5: ADVERSARIAL — Challenge all findings using adversarial-reviewer pattern, try to break conclusions
Wave 6: SYNTHESIS — Final merge, priority ranking, action plan
Wave 7+: POLISH — Targeted micro-investigations on remaining uncertainties
```

### Plan ↔ Code Cycling in Swarm Context

During fix iterations (if task includes implementation):
```
PLANNING SWARM (Waves 1-2): Swarms produce plans, not code
  → Merge plans into unified architecture
  → Resolve contradictions between swarm plans
  → Produce single approved plan

EXECUTION SWARM (Waves 3-4): Swarms implement from the unified plan
  → Each swarm implements its focus area
  → Validation gate after each swarm completes
  → Cross-swarm integration testing

VERIFICATION SWARM (Wave 5): Swarms verify each other's work
  → Swarm A reviews Swarm B's implementation (adversarial)
  → Swarm B reviews Swarm C's implementation
  → Round-robin verification ensures no self-review
```

---

## Phase 6: Final Output

### Produce the master report

```markdown
# Auto-Swarm Report
═══════════════════

## Configuration
- Task: {task}
- Swarm Size: {N} agents
- Research Depth: {depth} ({total_sources} sources consulted)
- Iterations: {waves_completed} waves
- Total Agent Dispatches: {count}

## Executive Summary
{3-5 sentence overview of all findings}

## Findings by Priority
### P0 — Critical ({count})
{findings with evidence}

### P1 — High ({count})
...

### P2 — Medium ({count})
...

### P3 — Low ({count})
...

## Cross-Swarm Insights
{Connections found between different focus areas}

## Research Depth Report
- Sources consulted: {total}
- Depth escalations: {count}
- Sub-swarms spawned: {count}
- Deepest query: {description} ({source_count} sources)

## Convergence Trajectory
| Wave | Findings | Unique | Coverage | Confidence | Verdict |
|------|----------|--------|----------|-----------|---------|

## Recommended Actions
{Prioritized action plan}

## Swarm Effectiveness
| Swarm | Focus | Findings | Accuracy | Cost |
|-------|-------|----------|----------|------|
```

Save to `.auto-swarm/SWARM-REPORT.md`

---

## Integration with /productupgrade

Auto-swarm can be invoked BY productupgrade deep mode:
```
/productupgrade deep → spawns /auto-swarm for each iteration's research phase
```

Or standalone:
```
/auto-swarm "deep security audit of auth system" --depth ultra
/auto-swarm "competitive analysis of video generation platforms" --depth deep --swarm_size 7
/auto-swarm "full product upgrade" --iterations 11
```

---

## Multi-Terminal Parallelism (P2 — Advanced)

### dmux Pattern (Local Multi-Session)
For tasks exceeding the 7-agent parallel limit, auto-swarm can orchestrate multiple Claude Code sessions via tmux:

```
DMUX ORCHESTRATION:
IF swarm_size > 7 OR task.requires_isolation:
  1. Create tmux session: tmux new-session -d -s "swarm-{id}"
  2. Split into N panes (1 per swarm group)
  3. Launch `claude -p "{swarm_prompt}"` in each pane
  4. Monitor completion via output file polling
  5. Merge results from all panes

REQUIREMENTS:
  - tmux installed
  - claude CLI available in PATH
  - Shared filesystem for result exchange (.auto-swarm/swarms/)

WHEN TO USE:
  - Swarm needs > 7 parallel agents
  - Tasks require filesystem isolation between swarms
  - Long-running research tasks (> 10 min per swarm)
```

### Cloud Virtualization (P2 — Future)
For distributed execution across machines:
```
CLOUD ORCHESTRATION (requires --cloud flag):
  1. Use Hetzner MCP to provision N servers (cx22 instances)
  2. Install Claude Code on each via SSH MCP
  3. Dispatch swarm focus areas to each machine
  4. Collect results via SSH file transfer
  5. Merge at orchestrator level
  6. Tear down instances after completion

COST MODEL:
  - cx22: ~$0.007/hour × N instances × duration
  - Each instance runs independent Claude Code session
  - Token costs are per-instance (multiplied by N)

STATUS: Not yet implemented. Requires Hetzner + SSH MCP wiring.
```

---

## CRITICAL RULES

1. EVERY swarm agent runs in background (parallel, not sequential)
2. NEVER let a swarm agent modify files another swarm is reading (isolation)
3. ALWAYS merge before the next wave — no orphaned findings
4. NEVER exceed depth ceiling — synthesis > exhaustive collection
5. Sub-swarms have depth 2 max — no infinite recursion
6. ALWAYS log sources — every web fetch, every file read, every MCP query
7. If total cost approaches context budget, STOP and synthesize what you have
8. NEVER spawn more than 7 top-level swarms (Claude Code parallel agent limit)
9. ALWAYS save state to .auto-swarm/state.json between waves (crash recovery)
10. The orchestrator's job is COORDINATION, not EXECUTION — swarms do the work
