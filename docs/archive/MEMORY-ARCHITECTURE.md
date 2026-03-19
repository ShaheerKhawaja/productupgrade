# ProductionOS Memory Architecture

A complete memory system for recursive LLM agents enabling cross-level and cross-session knowledge persistence.

## Design Rationale

ProductionOS runs recursive convergence loops where agents spawn subagents across multiple levels. The fundamental problem: each recursion level and each session starts with zero knowledge of what came before. Without memory, run #5 repeats all the mistakes from runs #1-4, and a subagent at depth 3 has no idea what its parent at depth 1 already discovered.

This architecture solves that by implementing a three-tier memory system inspired by:
- **MemGPT** (Packer et al. 2023) -- OS-style tiered memory management with main context vs. external storage
- **A-MEM** (Xu et al. 2025, NeurIPS) -- Zettelkasten-inspired agentic memory with dynamic linking and memory evolution
- **Meta-Policy Reflexion** (MPR, 2025) -- Consolidating reflections into structured predicate-like rules instead of discarding them
- **Reflexion** (Shinn et al. 2023) -- Verbal reinforcement learning with episodic reflection buffers
- **AgeMem** (2026) -- Unified long/short-term memory with RL-trained store/retrieve/evict policies

## Architecture Overview

```
                         PRODUCTIONOS MEMORY HIERARCHY

    +-----------------------------------------------------------------+
    |                    TIER 1: SHORT-TERM MEMORY                     |
    |              (within-session, within-recursion)                   |
    |                                                                   |
    |   .productionos/                                                  |
    |   +-- STM-CONTEXT.md          Working context for current run     |
    |   +-- STM-HANDOFF-{depth}.md  Cross-level handoff artifacts       |
    |   +-- DENSITY-ITERATION-{N}.md  Compressed iteration summaries    |
    |   +-- STM-INBOX/              Message queue between agents        |
    |       +-- {agent}-to-{agent}.md                                   |
    |       +-- BROADCAST.md        System-wide announcements           |
    +---------------------------------+---------------------------------+
                                      | consolidation (every iteration)
    +---------------------------------+---------------------------------+
    |                   TIER 2: MEDIUM-TERM MEMORY                      |
    |                 (within-session, cross-iteration)                  |
    |                                                                   |
    |   .productionos/                                                  |
    |   +-- REFLEXION-LOG.md         What worked / what failed          |
    |   +-- CONVERGENCE-LOG.md       Grade trajectory across iterations |
    |   +-- THOUGHT-GRAPH.md         Causal finding network             |
    |   +-- DENSITY-CUMULATIVE.md    Running compressed summary         |
    |   +-- DECISION-{N}.md         PIVOT/REFINE/PROCEED decisions      |
    |   +-- MTM-SESSION-STATE.md     Session-level learning index       |
    +---------------------------------+---------------------------------+
                                      | graduation (end of session)
    +---------------------------------+---------------------------------+
    |                    TIER 3: LONG-TERM MEMORY                       |
    |                (cross-session, cross-project)                     |
    |                                                                   |
    |   ~/.productionos/learned/                                        |
    |   +-- rules.yaml               Active rules (injected into runs)  |
    |   +-- lessons/                  Raw lesson extractions             |
    |   |   +-- {date}-{project}.jsonl                                  |
    |   +-- patterns/                 Tech-stack-specific patterns       |
    |   |   +-- django.md                                               |
    |   |   +-- nextjs.md                                               |
    |   |   +-- fastapi.md                                              |
    |   +-- metrics.jsonl            Run-over-run performance data      |
    |   +-- index.yaml               Semantic index for retrieval       |
    |   +-- archived/                Expired rules and lessons          |
    |       +-- expired-rules.yaml                                      |
    +-----------------------------------------------------------------+
```

---

## 1. Short-Term Memory: Cross-Level Handoff

### Problem

When `/omni-plan-nth` dispatches `/auto-swarm-nth` which dispatches 7 parallel agents, each level operates in isolation. The parent has findings the child needs. The child discovers things the parent should know. Sibling agents duplicate work because they cannot see each other's progress.

### Design

Short-term memory lives in `.productionos/` within the target project. It is created at the start of a command invocation and consumed within that same session. It has three subsystems.

#### 1A: Working Context (`STM-CONTEXT.md`)

A single file that maintains the current execution state. Every agent reads this before starting work. Updated after every phase completion.

```markdown
# STM Working Context

## Current State
- command: /omni-plan-nth
- iteration: 3
- phase: EXECUTE
- recursion_depth: 1
- grade: 6.5/10
- focus_dimensions: [Security, Test Coverage]

## Active Constraints
- regression_floor: {Security: 5.5, Performance: 7.0}
- token_budget_remaining: 420K
- agents_deployed_this_iteration: 14

## Hot Findings (last 5)
1. [SEC] RLS policy missing on video_assets table (models/video.py:42)
2. [TEST] No integration tests for payment webhook (api/webhooks.py)
3. [PERF] N+1 query in project listing (views/projects.py:89)
4. [SEC] JWT refresh token has no expiry (auth/tokens.py:23)
5. [UX] Empty state missing on dashboard (components/Dashboard.tsx:67)

## Deferred Items (carry forward)
- [P2] Lighthouse score optimization -- blocked by SSR migration
- [P3] OpenAPI spec generation -- low ROI this iteration
```

**Update protocol:** After each agent completes, append its top 3 findings to "Hot Findings" (capped at 20, oldest evicted). After each phase completes, update "Current State."

#### 1B: Cross-Level Handoff (`STM-HANDOFF-{depth}.md`)

When a command spawns a subcommand or agent at a deeper recursion level, it writes a handoff document that provides the child with exactly the context it needs -- no more, no less.

```markdown
# Handoff: Depth 1 -> Depth 2

## Parent
- command: /omni-plan-nth (iteration 3)
- invoking: /auto-swarm-nth "fix all P0 security findings"

## Context for Child
### What you need to know
- 4 P0 security findings identified (see list below)
- RLS is the root cause pattern (fixing RLS fixes 3 of 4)
- Django ORM is the codebase standard -- no raw SQL fixes
- Tests exist in tests/ using pytest + factory_boy

### What has already been tried
- Iteration 2 attempted middleware-based auth fix -- caused regression in Performance (-1.2)
- Self-healer succeeded on import errors but failed on type errors in this codebase

### Your scope boundary
- MODIFY: models/, api/, middleware/ only
- READ: anything
- DO NOT MODIFY: frontend/, settings/, migrations/

### Your deliverable
Write results to: .productionos/SWARM-NTH-REPORT.md
Format: standard coverage map with file:line evidence

### Regression floor
Security must not drop below 5.5 (current: 5.8)
Performance must not drop below 7.0 (current: 7.2)
```

**Rules for handoff documents:**
- Maximum 2000 tokens (enforced by density-summarizer compression)
- Must include: scope boundary, regression floor, what was already tried, deliverable path
- Must NOT include: full iteration history (that belongs in medium-term memory)
- Parent writes the handoff BEFORE dispatching the child
- Child reads the handoff BEFORE starting any work
- Child appends a "## Child Report" section BEFORE returning control to parent

#### 1C: Inter-Agent Message Queue (`STM-INBOX/`)

For parallel agents within the same wave that need to communicate without blocking each other.

```
.productionos/STM-INBOX/
+-- security-hardener-to-code-reviewer.md    # "I found raw SQL in api/legacy.py -- flag it"
+-- test-architect-to-self-healer.md         # "tests/conftest.py needs this fixture first"
+-- BROADCAST.md                              # "RLS is confirmed root cause -- all agents adjust"
+-- CLAIM-REGISTRY.md                         # Prevents two agents from modifying the same file
```

**CLAIM-REGISTRY.md** is the critical coordination artifact:

```markdown
# File Claim Registry

| File | Claimed By | Wave | Status |
|------|-----------|------|--------|
| models/video.py | security-hardener | W3 | LOCKED |
| api/webhooks.py | test-architect | W3 | LOCKED |
| views/projects.py | performance-profiler | W3 | LOCKED |
```

**Protocol:**
1. Before modifying a file, an agent checks CLAIM-REGISTRY.md
2. If the file is unclaimed, the agent adds a LOCKED entry and proceeds
3. If the file is claimed by another agent, the agent writes a message to `STM-INBOX/{self}-to-{claimer}.md` requesting coordination
4. After completing modifications, the agent changes status to RELEASED
5. The swarm-orchestrator clears the registry between waves

**Message format:**

```markdown
---
from: security-hardener
to: code-reviewer
priority: high
timestamp: 2026-03-18T14:32:00Z
---

Found raw SQL query in api/legacy.py:67. This is in your review scope.
Recommend flagging as P0 security finding (SQL injection vector).
I cannot modify this file -- it is outside my scope boundary.
```

---

## 2. Medium-Term Memory: Session-Level Learning

### Problem

Within a single session, ProductionOS may run 7+ iterations. By iteration 5, the context window is saturated. Earlier findings get compacted away by Claude Code's auto-compaction. The system forgets what it already tried and repeats failed approaches.

### Design

Medium-term memory lives in `.productionos/` alongside the short-term artifacts but is structured for persistence across iterations within the same session. It consists of six interconnected documents.

#### 2A: Reflexion Log (`REFLEXION-LOG.md`)

Verbal reinforcement learning following Reflexion (Shinn et al. 2023). After each iteration, the agent writes a structured self-reflection.

```markdown
# Reflexion Log

## Iteration 1
### What worked
- Parallel dispatch of 7 review agents covered 60% of codebase in one wave
- thought-graph-builder correctly identified RLS as root cause (out-degree: 7)

### What failed
- Attempting to fix all 10 dimensions simultaneously caused thrashing
- security-hardener and vulnerability-explorer produced 70% overlapping findings

### What to try differently
- Focus on 2-3 dimensions per iteration (focus narrowing)
- Merge security-hardener and vulnerability-explorer scope to eliminate duplication

### Reflexion rule (for injection into next iteration)
"When batch_failure_rate > 30%, reduce batch size from 5 to 3 files before retrying."

---

## Iteration 2
### What worked
- Focus narrowing to Security + Tests improved both by +1.5
- Smaller batch size (3 files) reduced failure rate from 40% to 12%
...
```

**Evolution from standard Reflexion:** Standard Reflexion uses a sliding window that discards older reflections. ProductionOS retains ALL reflections within a session but applies Chain of Density compression -- iteration 1's reflection is full, iteration 5's reflection of iteration 1 is a single line.

#### 2B: Convergence Log (`CONVERGENCE-LOG.md`)

Already exists as a template. The memory architecture adds two enhancements:

**Enhancement 1: Velocity tracking**

```markdown
## Velocity Analysis
| Window | Avg Delta | Acceleration | Predicted Convergence |
|--------|-----------|-------------|----------------------|
| I1-I2 | +1.3/iter | -- | Iteration 8 at 9.1 |
| I2-I3 | +0.8/iter | -0.5 (decelerating) | Iteration 10 at 8.7 |
| I3-I4 | +0.3/iter | -0.5 (decelerating) | Plateau at ~7.5 |
```

**Enhancement 2: Per-dimension memory**

For each stuck dimension, record what has been tried and what remains:

```markdown
## Dimension Memory: Security (stuck at 6/10 for 2 iterations)

### Attempted approaches
1. Iteration 2: Middleware-based auth check -- caused Performance regression (-1.2)
2. Iteration 3: Per-route decorator approach -- fixed 3 of 7 findings
3. Iteration 4: RLS policy addition -- blocked by missing org_id column

### Remaining blockers
- org_id denormalization required before RLS can be applied (DB migration needed)
- 3 API routes still lack rate limiting

### Recommended next approach
- Run migration-planner to design org_id migration
- Then re-attempt RLS with the column available
```

#### 2C: Session State Index (`MTM-SESSION-STATE.md`)

A machine-readable index of everything the session has produced, enabling efficient retrieval without scanning all files.

```markdown
# Session State Index

## Metadata
- session_id: 2026-03-18-omni-nth-entropy
- started: 2026-03-18T09:00:00Z
- command: /omni-plan-nth
- target: ~/Video-Generation/
- baseline_grade: 4.2/10
- current_grade: 6.5/10
- iterations_completed: 4
- total_agents_deployed: 56
- total_fixes_applied: 34

## Artifact Manifest
| Artifact | Producer | Iteration | Status | Size |
|----------|----------|-----------|--------|------|
| SCORE-BASELINE.md | llm-judge | 0 | CONSUMED | 1.2K |
| ITERATION-1.md | omni-plan-nth | 1 | CONSUMED | 4.8K |
| ITERATION-2.md | omni-plan-nth | 2 | CONSUMED | 3.1K |
| SWARM-NTH-REPORT.md | auto-swarm-nth | 2 | ACTIVE | 6.2K |
| DECISION-3.md | decision-loop | 3 | ACTIVE | 1.4K |
| THOUGHT-GRAPH.md | thought-graph-builder | 1 | STALE | 5.7K |

## Agent Dispatch Log
| Iteration | Wave | Agent | Task | Duration | Output |
|-----------|------|-------|------|----------|--------|
| 1 | 1 | code-reviewer | Full scan | 45s | REVIEW-CODE.md |
| 1 | 1 | security-hardener | OWASP top 10 | 52s | AUDIT-SECURITY.md |
| 2 | 1 | refactoring-agent | P0 fixes | 38s | 5 files modified |

## Dimension Progress Tracker
| Dimension | I0 | I1 | I2 | I3 | I4 | Approaches Tried | Stuck? |
|-----------|----|----|----|----|----|--------------------|--------|
| Security | 3 | 4 | 5.5 | 5.5 | 5.8 | middleware, decorator, RLS | YES (I2-I3) |
| Tests | 2 | 2 | 3.5 | 5 | 6 | bootstrap, generate, coverage | NO |
```

#### 2D: Thought Graph Evolution

The thought-graph-builder agent produces a static graph per iteration. The medium-term memory system maintains a **living graph** that evolves across iterations.

```markdown
# Living Thought Graph

## Root Causes (persistent across iterations)
| RC | Title | Discovered | Status | Impact |
|----|-------|-----------|--------|--------|
| RC-1 | Missing org_id on 4 tables | I1 | OPEN | Blocks RLS on video_assets, projects, templates, exports |
| RC-2 | No test infrastructure | I1 | RESOLVED (I3) | Was blocking all test-related improvements |
| RC-3 | Auth middleware gap | I2 | PARTIAL | 3/7 routes fixed, 4 remaining |

## Edge Evolution
| Edge | Iteration Added | Iteration Resolved | Notes |
|------|----------------|-------------------|-------|
| RC-1 -> F-3 (no RLS) | I1 | -- | Still active |
| RC-2 -> F-8 (0% coverage) | I1 | I3 | conftest.py + fixtures resolved this |
| RC-2 -> F-12 (no CI tests) | I1 | I3 | GitHub Actions workflow added |
```

**Why this matters:** Without a living graph, each iteration rebuilds the causal network from scratch. With it, iteration 5 knows that RC-1 was identified in iteration 1 and is still the root blocker for 4 downstream findings, rather than rediscovering this.

---

## 3. Long-Term Memory: Cross-Session Persistence

### Problem

ProductionOS sessions end. The next session starts fresh. The handover document (`HANDOVER-OMNI-NTH.md`) is a manual workaround -- someone has to copy-paste it into the next session. Learned patterns about Django codebases, common failure modes, agent calibration data -- all lost.

### Design

Long-term memory lives in `~/.productionos/learned/` (user-global, not project-specific). It persists across sessions, projects, and commands.

#### 3A: File Structure

```
~/.productionos/learned/
+-- rules.yaml                    # Active rules (injected at session start)
+-- lessons/
|   +-- 2026-03-18-entropy.jsonl  # Raw lesson extractions per session
|   +-- 2026-03-15-website.jsonl
|   +-- 2026-03-10-docs.jsonl
+-- patterns/
|   +-- django.md                 # Tech-stack-specific learned patterns
|   +-- nextjs.md
|   +-- fastapi.md
|   +-- monorepo.md
+-- calibration/
|   +-- judge-bias.yaml           # Per-model scoring bias corrections
|   +-- agent-perf.yaml           # Per-agent success rate and failure modes
+-- metrics.jsonl                 # Run-over-run performance metrics
+-- index.yaml                   # Semantic index for fast retrieval
+-- archived/
    +-- expired-rules.yaml        # Rules past TTL (kept for audit)
    +-- superseded-patterns.md    # Patterns replaced by newer versions
```

#### 3B: Rule System (Enhanced from metaclaw-learner)

Rules are the primary unit of cross-session knowledge. Each rule is a structured predicate following Meta-Policy Reflexion (MPR) format.

```yaml
# ~/.productionos/learned/rules.yaml

rules:
  - id: "rule-001"
    trigger: "when target uses Django ORM"
    action: "check for missing RLS policies on all models with tenant data"
    category: "findings"
    confidence: 0.92
    source_lessons:
      - "lesson-2026-03-18-001"  # Entropy Studio: RLS was root cause for 7 findings
      - "lesson-2026-03-12-004"  # Other project: same pattern
    applied_count: 3
    confirmed_count: 2           # Times the rule led to a real finding
    last_applied: "2026-03-18"
    created: "2026-03-12"
    decay_date: "2026-04-11"     # 30 days from creation
    tags: ["django", "security", "rls", "multi-tenant"]

  - id: "rule-002"
    trigger: "when batch_failure_rate > 30%"
    action: "reduce batch size to 3 files and retry before escalating"
    category: "experiments"
    confidence: 0.85
    source_lessons:
      - "lesson-2026-03-18-003"
    applied_count: 5
    confirmed_count: 4
    last_applied: "2026-03-18"
    created: "2026-03-15"
    decay_date: "2026-04-14"
    tags: ["convergence", "batch-size", "failure-recovery"]

  - id: "rule-003"
    trigger: "when Sonnet judges UX dimension"
    action: "apply -1.5 correction to Sonnet UX scores (Sonnet inflates UX by ~1.5 vs Opus)"
    category: "reviews"
    confidence: 0.78
    source_lessons:
      - "lesson-2026-03-15-007"
      - "lesson-2026-03-18-009"
    applied_count: 4
    confirmed_count: 3
    last_applied: "2026-03-18"
    created: "2026-03-15"
    decay_date: "2026-04-14"
    tags: ["calibration", "sonnet", "ux", "judge-bias"]
```

**Rule lifecycle:**

```
EXTRACTION                ACTIVATION              CONFIRMATION              DECAY

Lesson found   -->   Rule generated    -->   Rule injected into   -->   30-day TTL
(from session         (confidence:0.6)        agent prompts              starts
 artifacts)
                      If confirmed:           If rule leads to           effective_conf =
                      confidence += 0.1       good outcome:              conf * (1 - days/30)
                      decay_date reset        confirmed_count++
                                              confidence += 0.1          If eff_conf < 0.3:
                      If disconfirmed:                                   archive the rule
                      confidence -= 0.15      If rule leads to
                                              bad outcome:
                                              confidence -= 0.15
```

#### 3C: Pattern Files (Tech-Stack Knowledge)

Patterns are higher-level than rules. They capture recurring architectural insights about specific technology stacks.

```markdown
# ~/.productionos/learned/patterns/django.md
# Auto-generated from rules and lessons. Last updated: 2026-03-18.

## Django Projects: Learned Patterns

### Security (from 4 projects, 12 sessions)
1. **Always check RLS policies** on models with org_id/tenant_id fields.
   Missing RLS is the #1 root cause in multi-tenant Django apps. (confidence: 0.92)
2. **CSRF exemptions** on API views need explicit rate limiting as compensation.
   APIs exempt from CSRF are vulnerable to replay attacks. (confidence: 0.78)
3. **Django admin** is usually exposed without IP restriction in early-stage projects.
   Check ALLOWED_HOSTS and admin URL randomization. (confidence: 0.71)

### Performance (from 3 projects, 8 sessions)
1. **select_related/prefetch_related** missing on queryset chains is the #1 N+1 source.
   Check all views that iterate over querysets. (confidence: 0.88)
2. **Celery task format** -- Django projects using JSON for task arguments lose datetime
   precision. Use msgpack or signed binary format instead. (confidence: 0.65)

### Testing (from 3 projects, 6 sessions)
1. **Factory_boy + pytest** is the dominant pattern. If no conftest.py exists,
   bootstrapping test infrastructure should be the FIRST fix. (confidence: 0.85)
2. **Django migrations** need explicit test coverage -- test that migrations can
   run forward AND backward without data loss. (confidence: 0.72)
```

**Pattern generation:** After every 5 sessions involving the same tech stack, the metaclaw-learner agent regenerates the pattern file by aggregating all rules tagged with that stack, grouping by category, and ranking by confidence.

#### 3D: Calibration Data

Records per-model and per-agent performance data for systematic bias correction.

```yaml
# ~/.productionos/learned/calibration/judge-bias.yaml

models:
  claude-opus-4:
    scoring_bias:
      security: +0.0      # Opus is well-calibrated on security
      ux_ui: -0.3          # Opus is slightly harsh on UX
      documentation: +0.5  # Opus is lenient on documentation
    sample_size: 12
    last_updated: "2026-03-18"

  claude-sonnet-4:
    scoring_bias:
      security: -0.5       # Sonnet underscores security
      ux_ui: +1.5          # Sonnet overscores UX significantly
      performance: +0.3    # Sonnet is slightly lenient on perf
    sample_size: 8
    last_updated: "2026-03-18"

# ~/.productionos/learned/calibration/agent-perf.yaml

agents:
  security-hardener:
    success_rate: 0.72
    common_failures:
      - "middleware-based fixes cause performance regression (3/8 times)"
      - "fails on Python type errors during self-heal (2/8 times)"
    best_for: ["OWASP top 10", "RLS audit", "dependency CVE check"]
    worst_for: ["custom auth schemes", "WebSocket security"]
    avg_duration: 48s
    sample_size: 8

  self-healer:
    success_rate: 0.65
    common_failures:
      - "circular imports in Python (4/12 times)"
      - "TypeScript generic type errors (3/12 times)"
    recovery_strategies:
      circular_import: "split file into two modules before re-attempting heal"
      ts_generics: "add explicit type annotations to function signatures first"
    avg_duration: 22s
    sample_size: 12
```

#### 3E: Metrics Log

Append-only JSONL tracking run-over-run performance. Enables trend analysis across weeks and months.

```jsonl
{"run_id":"run-2026-03-18-001","date":"2026-03-18","target":"entropy-studio","stack":"django+nextjs","mode":"omni-plan-nth","grade_start":4.2,"grade_end":6.5,"iterations":4,"agents_deployed":56,"fixes_applied":34,"lessons_extracted":8,"rules_generated":3,"rules_injected":12,"rules_confirmed":7,"pivot_count":1,"refine_count":2,"batch_failure_rate":0.18,"self_heal_rate":0.65,"total_tokens":2800000,"duration_minutes":45}
{"run_id":"run-2026-03-15-001","date":"2026-03-15","target":"entropy-website","stack":"nextjs","mode":"production-upgrade","grade_start":5.0,"grade_end":7.8,"iterations":3,"agents_deployed":21,"fixes_applied":18,"lessons_extracted":5,"rules_generated":2,"rules_injected":8,"rules_confirmed":5,"pivot_count":0,"refine_count":1,"batch_failure_rate":0.12,"self_heal_rate":0.80,"total_tokens":1200000,"duration_minutes":22}
```

---

## 4. Memory Consolidation: Merging Recursion Branches

### Problem

When `/auto-swarm-nth` dispatches 7 agents in parallel, each agent produces findings independently. Agent 2 discovers that `models/video.py` has an N+1 query. Agent 5 discovers that the same file has a missing RLS policy. Agent 7 discovers that the same file has no error handling on the `save()` method. These are three separate findings that share a common location and may have causal relationships. Without consolidation, the next iteration treats them as independent issues and may attempt conflicting fixes.

### Consolidation Protocol

Consolidation runs at three boundaries: wave completion (within a swarm), iteration completion (within a command), and session completion (before exit).

#### 4A: Wave-Level Consolidation (density-summarizer + thought-graph-builder)

Triggered: After all agents in a wave complete.
Responsibility: swarm-orchestrator invokes density-summarizer then thought-graph-builder.

```
WAVE COMPLETE
    |
    +-- Step 1: COLLECT all agent output files
    |   +-- Read .productionos/SWARM-WAVE-{N}-AGENT-{M}.md for all M
    |
    +-- Step 2: DEDUPLICATE (density-summarizer)
    |   +-- Extract all findings into normalized format:
    |   |   {id, title, dimension, severity, file, line, description, source_agent}
    |   +-- For each pair of findings:
    |   |   +-- Same file + same issue = MERGE (keep higher severity, cite both agents)
    |   |   +-- Same file + different issue = LINK (add to thought graph as co-located)
    |   |   +-- Different file + same pattern = GROUP (systemic pattern)
    |   +-- Output: deduplicated finding list with provenance
    |
    +-- Step 3: LINK (thought-graph-builder)
    |   +-- Build causal edges between merged findings
    |   +-- Update the Living Thought Graph (MTM)
    |   +-- Identify new root causes
    |   +-- Output: updated THOUGHT-GRAPH.md
    |
    +-- Step 4: COMPRESS (density-summarizer, Chain of Density)
    |   +-- Pass 1: Full merged findings (no limit)
    |   +-- Pass 2: Compress to 50% (remove redundancy, keep evidence)
    |   +-- Pass 3: Compress to 25% (one line per finding, scores inline)
    |   +-- Output: DENSITY-ITERATION-{N}.md (the handoff artifact)
    |
    +-- Step 5: UPDATE working context
        +-- Refresh STM-CONTEXT.md with latest findings
        +-- Clear STM-INBOX/ message queue
        +-- Reset CLAIM-REGISTRY.md
```

#### 4B: Iteration-Level Consolidation (convergence-monitor + decision-loop)

Triggered: After a full iteration completes (all waves done, judge has scored).
Responsibility: convergence-monitor produces analysis, decision-loop produces the decision.

```
ITERATION COMPLETE
    |
    +-- Step 1: TRAJECTORY ANALYSIS (convergence-monitor)
    |   +-- Read all DENSITY-ITERATION-{1..N}.md
    |   +-- Compute per-dimension velocity and acceleration
    |   +-- Detect patterns: plateau, oscillation, diminishing returns, drag
    |   +-- Output: trajectory analysis appended to CONVERGENCE-LOG.md
    |
    +-- Step 2: REFLEXION (agent self-reflection)
    |   +-- What worked this iteration (with evidence)
    |   +-- What failed (with evidence)
    |   +-- What to try differently
    |   +-- Output: new entry appended to REFLEXION-LOG.md
    |
    +-- Step 3: DIMENSION MEMORY UPDATE
    |   +-- For each stuck dimension:
    |   |   +-- Record what approach was tried
    |   |   +-- Record whether it succeeded or failed
    |   |   +-- Recommend next approach
    |   +-- Output: dimension memory section in CONVERGENCE-LOG.md
    |
    +-- Step 4: CUMULATIVE DENSITY UPDATE
    |   +-- Read previous DENSITY-CUMULATIVE.md
    |   +-- Append this iteration's compressed summary
    |   +-- Re-compress the full cumulative to fit in 3000 tokens
    |   +-- Output: updated DENSITY-CUMULATIVE.md
    |
    +-- Step 5: DECISION (decision-loop)
        +-- Read all consolidated evidence
        +-- Apply decision matrix (PROCEED/REFINE/PIVOT)
        +-- Output: DECISION-{N}.md with rationale and next actions
```

#### 4C: Session-Level Consolidation (metaclaw-learner)

Triggered: At session end (final iteration complete or user exits).
Responsibility: metaclaw-learner extracts lessons and graduates them to long-term memory.

```
SESSION ENDING
    |
    +-- Step 1: LESSON EXTRACTION
    |   +-- Read ALL medium-term memory artifacts:
    |   |   +-- REFLEXION-LOG.md (what worked/failed across all iterations)
    |   |   +-- CONVERGENCE-LOG.md (grade trajectory + stuck dimensions)
    |   |   +-- DECISION-*.md (strategic decisions and outcomes)
    |   |   +-- THOUGHT-GRAPH.md (root causes and systemic patterns)
    |   |
    |   +-- For each significant event, create a lesson:
    |   |   {id, category, severity, trigger, lesson, rule, evidence, created, decay_date}
    |   |
    |   +-- Filter: only extract lessons with severity >= "warning"
    |         Maximum 10 lessons per session
    |
    +-- Step 2: RULE GENERATION
    |   +-- For each lesson with severity "critical" or with confirming evidence:
    |   |   +-- Generate a predicate-form rule (trigger -> action)
    |   |   +-- Set initial confidence to 0.6
    |   |   +-- Tag with tech stack and dimension
    |   |   +-- Check for existing rules with similar triggers:
    |   |       +-- If duplicate: increase existing rule confidence by 0.1
    |   |       +-- If new: append to rules.yaml
    |   |
    |   +-- Maximum 5 new rules per session (prevent rule bloat)
    |
    +-- Step 3: CALIBRATION UPDATE
    |   +-- Compare judge scores across models used this session
    |   +-- Update judge-bias.yaml with any systematic discrepancies
    |   +-- Update agent-perf.yaml with success/failure rates
    |   +-- Compute per-agent duration averages
    |
    +-- Step 4: PATTERN REFRESH (every 5th session for a tech stack)
    |   +-- Read all rules tagged with this project's tech stack
    |   +-- Group by category (security, performance, testing, etc.)
    |   +-- Rank by confidence
    |   +-- Generate human-readable pattern file
    |   +-- Write to ~/.productionos/learned/patterns/{stack}.md
    |
    +-- Step 5: METRICS LOG
    |   +-- Compute session metrics (grade start/end, iterations, agents, etc.)
    |   +-- Append to ~/.productionos/learned/metrics.jsonl
    |
    +-- Step 6: HANDOVER GENERATION
        +-- Generate .productionos/HANDOVER-{COMMAND}.md
        +-- Include: current state, remaining work, priority matrix
        +-- Include: rules that should be injected into next session
        +-- Include: exact prompt for continuing in a new session
```

#### 4D: Branch Merge Protocol (for parallel recursion branches)

When `/omni-plan-nth` dispatches multiple parallel sub-commands (e.g., `/auto-swarm-nth` for fixes AND `/deep-research` for investigation simultaneously), their results must be merged before the parent can proceed.

```
PARALLEL BRANCHES COMPLETE
    |
    +-- Step 1: COLLECT branch outputs
    |   +-- Branch A: .productionos/SWARM-NTH-REPORT.md (fixes applied)
    |   +-- Branch B: .productionos/RESEARCH-{topic}.md (new knowledge)
    |
    +-- Step 2: CONFLICT DETECTION
    |   +-- Did Branch A modify files that Branch B's findings reference?
    |   +-- Did Branch B discover something that invalidates Branch A's fixes?
    |   +-- Are there contradictory recommendations?
    |
    +-- Step 3: RESOLUTION
    |   +-- If no conflicts: merge both into parent's context
    |   +-- If conflict on file modifications: prefer the branch with test coverage
    |   +-- If conflict on recommendations: escalate to tri-tiered judge
    |   +-- If research invalidates fixes: rollback fixes, re-plan with new knowledge
    |
    +-- Step 4: UNIFIED CONTEXT
        +-- Merge both branch summaries into STM-CONTEXT.md
        +-- Update THOUGHT-GRAPH.md with new edges from both branches
        +-- Log the merge in MTM-SESSION-STATE.md
```

---

## 5. Memory Eviction: Pruning Stale Knowledge

### Problem

Without eviction, memory grows unbounded. Stale rules get injected into future runs and cause wrong decisions. Old lessons about deprecated frameworks pollute the retrieval space. The system needs to forget strategically.

### Eviction Strategies

ProductionOS uses a hybrid eviction strategy combining time-based decay, utility-based pruning, and capacity-based limits.

#### 5A: Time-Based Decay (TTL)

Every memory unit has a `decay_date` set 30 days from creation.

```
effective_confidence = base_confidence * (1 - days_since_creation / 30)
```

**Decay timeline:**
- Day 0-10: Full confidence (effective = base)
- Day 10-20: Gradual decline (effective = 0.66 * base)
- Day 20-30: Steep decline (effective = 0.33 * base)
- Day 30+: Archive threshold (effective < 0.3 * base)

**Decay reset:** When a rule is confirmed (applied and led to a good outcome), its `decay_date` resets to 30 days from now and its confidence increases by 0.1 (capped at 1.0).

**Implementation:**

```bash
# Run at session start (added to hooks.json SessionStart)
# Scan rules.yaml, archive any with effective_confidence < 0.3

RULES_FILE="${HOME}/.productionos/learned/rules.yaml"
ARCHIVE_FILE="${HOME}/.productionos/learned/archived/expired-rules.yaml"

if [ -f "$RULES_FILE" ]; then
  # The metaclaw-learner agent handles actual YAML parsing and archival
  # This hook just triggers the check by writing a flag file
  touch "${HOME}/.productionos/learned/.eviction-check-needed"
fi
```

#### 5B: Utility-Based Pruning

Rules that are applied but consistently lead to bad outcomes (false positives, wasted iterations) are actively demoted.

```yaml
# Demotion triggers:
demotion_events:
  - type: "false_positive"
    description: "Rule triggered but the finding it predicted did not exist"
    confidence_penalty: -0.15

  - type: "regression_caused"
    description: "Rule's recommended action caused a dimension regression"
    confidence_penalty: -0.25

  - type: "redundant_with_higher"
    description: "Another rule with higher confidence covers the same trigger"
    confidence_penalty: -0.20
    action: "merge into the higher-confidence rule"
```

**Promotion triggers:**
- Rule confirmed by finding: +0.10
- Rule prevented a known failure mode: +0.15
- Rule referenced by a pattern file: +0.05 (endorsement)

#### 5C: Capacity-Based Limits

Hard limits prevent unbounded growth:

| Store | Max Capacity | Eviction Policy |
|-------|-------------|-----------------|
| rules.yaml | 100 active rules | Evict lowest effective_confidence first |
| lessons/ per file | 200 entries | Oldest entries archived after 200 |
| patterns/ per file | 5000 tokens | Re-compress when exceeded |
| metrics.jsonl | 1000 entries | Oldest entries moved to metrics-archive.jsonl |
| calibration/ | No limit | Small files, grows slowly |
| STM-INBOX/ | 50 messages | Auto-cleared between waves |
| STM-CONTEXT.md Hot Findings | 20 entries | Oldest evicted when new ones arrive |

#### 5D: Semantic Deduplication

Before adding a new rule, check for semantic similarity with existing rules.

Since ProductionOS runs within Claude Code (no external embedding service), semantic similarity is approximated by tag overlap:

```
tag_overlap = len(rule_a.tags & rule_b.tags) / len(rule_a.tags | rule_b.tags)
keyword_overlap = len(trigger_words_a & trigger_words_b) / len(trigger_words_a | trigger_words_b)
similarity = 0.6 * tag_overlap + 0.4 * keyword_overlap
```

**Thresholds:**
- similarity > 0.85: MERGE -- keep higher confidence, combine evidence, discard duplicate
- similarity > 0.65: FLAG -- log near-duplicate for review at next session
- similarity < 0.65: KEEP BOTH -- genuinely distinct rules

#### 5E: Session-Level STM Eviction

Short-term memory is aggressive about eviction because it only needs to last one session.

```
After each iteration:
  - Clear STM-INBOX/ completely
  - Reset CLAIM-REGISTRY.md
  - Keep only the 2 most recent STM-HANDOFF-{depth}.md files
  - Compress STM-CONTEXT.md Hot Findings to top 20

At session end:
  - Delete all STM-* files (they served their purpose)
  - Keep MTM files (they are inputs to consolidation)
  - Run session-level consolidation (Section 4C) before deletion
```

---

## 6. Memory Indexing: Efficient Retrieval

### Problem

At session start, the context-retriever agent needs to find relevant rules, patterns, and lessons from long-term memory. With 100 rules and 50 lessons across 10 sessions, scanning everything is wasteful and slow. The agent needs to retrieve only what is relevant to the current project, tech stack, and focus area.

### Indexing Strategy

ProductionOS uses a three-layer retrieval system that narrows from broad to specific.

#### 6A: Tag-Based Primary Index

The primary index is a YAML file that maps tags to memory locations. It is rebuilt every 5 sessions by the metaclaw-learner.

```yaml
# ~/.productionos/learned/index.yaml

# Last rebuilt: 2026-03-18
# Total indexed: 87 rules, 42 lessons, 6 patterns

by_stack:
  django:
    rules: [rule-001, rule-004, rule-015, rule-023, rule-045]
    patterns: ["patterns/django.md"]
    lessons: ["2026-03-18-entropy.jsonl#L1-L4", "2026-03-12-other.jsonl#L2"]
  nextjs:
    rules: [rule-002, rule-008, rule-019, rule-031]
    patterns: ["patterns/nextjs.md"]
    lessons: ["2026-03-15-website.jsonl#L1-L7"]
  fastapi:
    rules: [rule-003, rule-011, rule-028]
    patterns: ["patterns/fastapi.md"]
    lessons: ["2026-03-10-api.jsonl#L1-L3"]

by_dimension:
  security:
    rules: [rule-001, rule-003, rule-005, rule-012, rule-034]
    high_confidence: [rule-001, rule-003]  # confidence >= 0.85
  performance:
    rules: [rule-007, rule-015, rule-022]
    high_confidence: [rule-015]
  test_coverage:
    rules: [rule-009, rule-018, rule-025, rule-033]
    high_confidence: [rule-009, rule-025]

by_category:
  decisions: [rule-010, rule-020, rule-030]
  experiments: [rule-002, rule-011, rule-021]
  findings: [rule-001, rule-003, rule-005, rule-008]
  reviews: [rule-003, rule-013, rule-023]
  failures: [rule-006, rule-016, rule-026]
  patterns: [rule-004, rule-014, rule-024]

by_recency:
  last_7_days: [rule-001, rule-002, rule-003, rule-087]
  last_30_days: [rule-001, rule-002, rule-065]

hot_rules:  # Top 10 by (confidence * applied_count)
  - rule-001  # Django RLS check (0.92 conf, applied 3x)
  - rule-002  # Batch size reduction (0.85 conf, applied 5x)
  - rule-009  # Test bootstrap first (0.85 conf, applied 4x)
  - rule-015  # N+1 select_related (0.88 conf, applied 3x)
```

#### 6B: Retrieval Protocol (context-retriever enhanced)

At session start, the context-retriever agent uses the index to load relevant memories in three stages.

```
STAGE 1: BROAD MATCH (stack + project type)
    |
    +-- Detect tech stack from project files (package.json, pyproject.toml, etc.)
    +-- Look up by_stack[{detected_stack}] in index.yaml
    +-- Load the pattern file for that stack
    +-- Load all rules listed under that stack
    +-- Result: ~15-25 rules, 1 pattern file

STAGE 2: NARROW MATCH (focus dimensions + command type)
    |
    +-- From the command being run, identify focus dimensions
    |   (/security-audit -> security, /production-upgrade -> all)
    +-- Cross-reference by_dimension[{focus}] with Stage 1 results
    +-- Prioritize high_confidence rules
    +-- Result: ~8-12 rules most relevant to this specific run

STAGE 3: RECENCY BOOST
    |
    +-- Check by_recency.last_7_days for any rules not in Stage 2 results
    +-- Recently created rules get priority even if lower confidence
    |   (new insights may be highly relevant to ongoing work)
    +-- Check hot_rules for any globally popular rules not yet included
    +-- Result: Final set of ~10-15 rules for injection
```

#### 6C: Injection Protocol

Rules are injected into agent prompts at the start of each iteration, following Layer 3 (Context Retrieval) of the 9-layer prompt composition.

```markdown
## Learned Rules (from previous ProductionOS sessions)
The following rules were extracted from past runs and confirmed effective.
Apply them where relevant to your analysis:

### High Confidence (0.85+)
1. [SECURITY] When target uses Django ORM: check for missing RLS policies
   on all models with tenant data. (confidence: 0.92, confirmed 2x)
2. [CONVERGENCE] When batch_failure_rate > 30%: reduce batch size to 3 files
   and retry before escalating. (confidence: 0.85, confirmed 4x)

### Medium Confidence (0.60-0.84)
3. [CALIBRATION] When Sonnet judges UX dimension: apply -1.5 correction
   to Sonnet UX scores. (confidence: 0.78, confirmed 3x)
4. [TESTING] When no conftest.py exists in Python project: bootstrap test
   infrastructure BEFORE writing any tests. (confidence: 0.72, confirmed 2x)
```

**Injection constraints:**
- Maximum 15 rules injected per agent prompt
- Only rules with `effective_confidence >= 0.6` (after decay)
- Sorted by relevance (Stage 2 match) then by confidence
- Each rule must fit in one sentence (30 tokens max)
- Total injection block must fit in 500 tokens

#### 6D: Retrieval for Handoff Documents

When generating cross-level handoff documents (STM-HANDOFF-{depth}.md), the system retrieves from medium-term memory using a different strategy: recency-first.

```
HANDOFF RETRIEVAL:
    |
    +-- Read DENSITY-CUMULATIVE.md (most recent 3 iterations only)
    +-- Read REFLEXION-LOG.md (most recent 2 entries only)
    +-- Read CONVERGENCE-LOG.md dimension memory (stuck dimensions only)
    +-- Read Living Thought Graph (root causes only, not full edge list)
    +-- Compress all retrieved context to fit 2000 token handoff budget
```

#### 6E: Retrieval Performance Tracking

Every retrieval event is logged to enable future optimization of the index.

```jsonl
{"event":"retrieval","session":"2026-03-18-001","stage":"broad","stack":"django","rules_matched":22,"duration_ms":150}
{"event":"retrieval","session":"2026-03-18-001","stage":"narrow","dimensions":["security","tests"],"rules_matched":10,"duration_ms":80}
{"event":"retrieval","session":"2026-03-18-001","stage":"injection","rules_injected":12,"tokens_used":380}
{"event":"retrieval_outcome","session":"2026-03-18-001","rules_confirmed":7,"rules_false_positive":1,"rules_not_triggered":4}
```

---

## Integration with Existing ProductionOS Components

### Modified Agent: context-retriever

The context-retriever agent gains a new Layer 2.5: Long-Term Memory Query.

```markdown
### Layer 2.5: Long-Term Memory Query (NEW)
After checking local project docs and before checking dependency docs:

1. Read ~/.productionos/learned/index.yaml
2. Match by detected tech stack
3. Load matching pattern file (e.g., patterns/django.md)
4. Load matching rules (filtered by stack + dimension)
5. Load calibration data (judge-bias.yaml, agent-perf.yaml)
6. Include in INTEL-CONTEXT.md under "## Learned Context (from previous runs)"
```

### Modified Agent: metaclaw-learner

Already designed for this role. Enhancements:

1. Add semantic deduplication before rule insertion (Section 5D)
2. Add calibration data extraction (Section 3D)
3. Add pattern file regeneration trigger (every 5th session for a stack)
4. Add handover document generation (Section 4C, Step 6)

### Modified Agent: density-summarizer

Add wave-level consolidation responsibility (Section 4A):

1. After wave completion, collect all agent outputs
2. Deduplicate findings across parallel agents
3. Produce compressed handoff for next wave/iteration

### Modified Agent: convergence-monitor

Add dimension memory tracking (Section 2B enhancements):

1. Track per-dimension approaches tried and outcomes
2. Recommend next approach for stuck dimensions based on what has NOT been tried
3. Feed dimension memory into handoff documents

### Modified Command: Preamble (`templates/PREAMBLE.md`)

Add Step 0G: Memory Initialization.

```markdown
### Step 0G: Memory Initialization (NEW)

1. Check if ~/.productionos/learned/ exists
   - If YES: run context-retriever with long-term memory query
   - If NO: create directory structure, proceed without learned context

2. Check for eviction flag
   - If ~/.productionos/learned/.eviction-check-needed exists:
     - Run metaclaw-learner eviction scan
     - Archive expired rules
     - Remove flag file

3. Check for prior session handover
   - If .productionos/HANDOVER-*.md exists:
     - Read handover document
     - Resume from documented state (DO NOT redo completed work)
     - Log "RESUMING from iteration {N}" in STM-CONTEXT.md
```

### Modified Hook: self-learn.sh

Add memory consolidation trigger at session end.

```bash
# Addition to self-learn.sh:
# When session is ending (detected by consecutive idle periods),
# trigger metaclaw-learner consolidation

# Track consecutive idle periods
IDLE_FILE="${LEARN_DIR}/.idle-count"
if [ "$TOOL_NAME" = "unknown" ]; then
  IDLE=$(cat "$IDLE_FILE" 2>/dev/null || echo "0")
  IDLE=$((IDLE + 1))
  echo "$IDLE" > "$IDLE_FILE"
  if [ "$IDLE" -ge 3 ]; then
    # Session likely ending -- trigger consolidation flag
    touch "${LEARN_DIR}/.consolidation-needed"
    echo "0" > "$IDLE_FILE"
  fi
else
  echo "0" > "$IDLE_FILE"
fi
```

### New Hook: hooks.json Addition

```json
{
  "PostToolUse": [
    {
      "matcher": ".*",
      "hooks": [
        {
          "type": "command",
          "command": "bash hooks/self-learn.sh"
        }
      ]
    }
  ]
}
```

---

## Data Flow Summary

```
SESSION START
    |
    +-- Preamble Step 0G: Memory Initialization
    |   +-- Read ~/.productionos/learned/index.yaml
    |   +-- Load relevant rules, patterns, calibration
    |   +-- Check for handover document
    |   +-- Run eviction if flagged
    |
    +-- ITERATION LOOP
    |   |
    |   +-- WAVE LOOP (within auto-swarm)
    |   |   +-- Agents read STM-CONTEXT.md + injected rules
    |   |   +-- Agents write to STM-INBOX/ for coordination
    |   |   +-- Agents claim files in CLAIM-REGISTRY.md
    |   |   +-- Wave completes -> WAVE CONSOLIDATION (Section 4A)
    |   |   +-- Handoff to next wave via DENSITY-ITERATION-{N}.md
    |   |
    |   +-- Iteration completes -> ITERATION CONSOLIDATION (Section 4B)
    |   |   +-- Update REFLEXION-LOG.md
    |   |   +-- Update CONVERGENCE-LOG.md with dimension memory
    |   |   +-- Update DENSITY-CUMULATIVE.md
    |   |   +-- Produce DECISION-{N}.md
    |   |
    |   +-- Cross-level dispatch -> HANDOFF (Section 1B)
    |       +-- Parent writes STM-HANDOFF-{depth}.md
    |       +-- Child reads handoff, executes, appends report
    |       +-- Parent reads child report, merges into context
    |
    +-- SESSION END -> SESSION CONSOLIDATION (Section 4C)
        +-- Extract lessons from all session artifacts
        +-- Generate rules (max 5 new)
        +-- Update calibration data
        +-- Refresh pattern files (if 5th session for stack)
        +-- Append to metrics.jsonl
        +-- Generate HANDOVER-{COMMAND}.md for next session
```

---

## Implementation Priority

| Priority | Component | Effort | Impact |
|----------|-----------|--------|--------|
| P0 | STM-CONTEXT.md (working context) | Low | Immediate: agents share state within iterations |
| P0 | STM-HANDOFF-{depth}.md (cross-level handoff) | Low | Immediate: recursion levels communicate |
| P0 | CLAIM-REGISTRY.md (file conflict prevention) | Low | Immediate: parallel agents stop conflicting |
| P1 | Preamble Step 0G (memory initialization) | Medium | Rules get loaded at session start |
| P1 | metaclaw-learner enhancements (consolidation) | Medium | Lessons survive across sessions |
| P1 | index.yaml (tag-based retrieval) | Medium | Fast memory lookup |
| P2 | calibration/ (judge and agent performance) | Medium | Scoring accuracy improves over time |
| P2 | Dimension memory (stuck dimension tracking) | Low | Convergence speed improves |
| P2 | Living Thought Graph (graph evolution) | High | Root cause tracking across iterations |
| P3 | Semantic deduplication | High | Prevents rule bloat long-term |
| P3 | metrics.jsonl trend analysis | Low | Enables cross-session performance monitoring |
| P3 | Pattern file auto-generation | Medium | Tech-stack knowledge compounds |

---

## Research References

- [MemGPT: Towards LLMs as Operating Systems](https://arxiv.org/abs/2310.08560) -- Tiered memory hierarchy (main context vs. external storage)
- [A-MEM: Agentic Memory for LLM Agents](https://arxiv.org/abs/2502.12110) -- Zettelkasten-inspired dynamic linking and memory evolution (NeurIPS 2025)
- [Meta-Policy Reflexion](https://arxiv.org/abs/2509.03990) -- Consolidating reflections into structured reusable rules
- [Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/abs/2303.11366) -- Episodic self-reflection buffers
- [Memoria: Scalable Agentic Memory](https://arxiv.org/abs/2512.12686) -- Scalable memory framework for personalized AI
- [Memory for Autonomous LLM Agents](https://arxiv.org/html/2603.07670) -- Survey of mechanisms, evaluation, and frontiers
- [Multi-Agent Memory from a Computer Architecture Perspective](https://arxiv.org/html/2603.10062) -- Shared memory for multi-agent systems
- [ICLR 2026 Workshop on Memory for LLM-Based Agentic Systems](https://openreview.net/forum?id=U51WxL382H) -- Latest research frontier
- [Agent Memory: How to Build Agents that Learn and Remember](https://www.letta.com/blog/agent-memory) -- Practical guide from Letta
- [Memory Mechanisms in LLM Agents](https://www.emergentmind.com/topics/memory-mechanisms-in-llm-based-agents) -- Comprehensive topic overview
