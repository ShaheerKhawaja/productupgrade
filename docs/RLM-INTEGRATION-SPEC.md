# RLM (Recursive LLM) Integration Specification for ProductionOS

**Version:** 1.0.0
**Date:** 2026-03-18
**Author:** Synthesized from ProductionOS 5.1.0 architecture, RECURSIVE-PATTERNS.md (Layers 16-21), convergence-monitor algorithms, and existing command/agent structure
**Status:** SPECIFICATION — not yet implemented

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [New Components](#3-new-components)
4. [Modified Components](#4-modified-components)
5. [File-Based Recursion Protocol](#5-file-based-recursion-protocol)
6. [Constraints and Workarounds](#6-constraints-and-workarounds)
7. [Implementation Roadmap](#7-implementation-roadmap)

---

## 1. Executive Summary

### What RLM Adds to ProductionOS

ProductionOS already operates recursive convergence loops: `/omni-plan-nth` iterates until 10/10, `/auto-swarm-nth` re-swarms until 100% coverage, and the convergence-monitor runs 6 detection algorithms to decide CONTINUE/CONVERGED/PIVOT. These are **iteration-level recursion** -- the same process repeats with updated inputs.

RLM adds **depth-level recursion** -- the ability for any single step within an iteration to recursively invoke itself on sub-problems, verify its own output through recursive verification stacks, and compress context hierarchically for cross-depth handoff. This is the difference between a loop and a tree.

### Concrete Value

| Capability | Without RLM | With RLM |
|------------|-------------|----------|
| Task decomposition | Manual, flat | Recursive, depth-bounded, atomic-checked |
| Output quality | Single-pass per agent | Self-refined through generate-critique-refine loops |
| Context handoff | Linear CoD (3 passes) | Hierarchical RecSumm (multi-level, coherence-tracked) |
| Verification | L1 only (FCA) | L1-L3 recursive stack (factual + methodological + blind spots) |
| Plan execution | Linear, fails on surprise | PEER adaptive (plan-execute-evaluate-replan) |
| Prompt quality | Static templates | Self-evolving via PromptEvo between runs |
| Gap detection | Manual per-wave | Automated recursive gap-analyze-scan-close loop |

### Design Principle

RLM does not replace ProductionOS's existing iteration loops. It operates **within** each iteration, making every individual step more thorough. The existing convergence-monitor continues to operate at the iteration level. RLM operates at the step level. They compose:

```
/omni-plan-nth (iteration-level recursion, existing)
    Iteration N:
        Step 3: Plan (uses PEER -- depth-level recursion, NEW)
            Plan V1 -> Execute Step 1 -> Evaluate -> Replan -> ...
        Step 7: Execute (uses RecDecomp -- depth-level recursion, NEW)
            Task -> Subtask A -> Subtask A1 (atomic) -> solve
                               -> Subtask A2 (atomic) -> solve
                  -> Subtask B (atomic) -> solve
        Step 8: Judge (uses RecVerify -- depth-level recursion, NEW)
            Score -> Verify score -> Verify verification -> Check blind spots
    convergence-monitor: CONTINUE/REFINE/PIVOT (iteration-level, existing)
    Iteration N+1: ...
```

---

## 2. Architecture Overview

### 2.1 System Layer Map

```
+===========================================================================+
|                      ORCHESTRATION LAYER (existing)                         |
|  /omni-plan-nth: iteration loop, skill chaining, convergence monitoring     |
|  /auto-swarm-nth: wave loop, parallel dispatch, coverage tracking           |
+===========================================================================+
        |                           |                           |
        v                           v                           v
+-------------------+  +-------------------+  +-------------------+
| PLANNING LAYER    |  | EXECUTION LAYER   |  | EVALUATION LAYER  |
| (modified)        |  | (modified)        |  | (modified)        |
|                   |  |                   |  |                   |
| dynamic-planner   |  | refactoring-agent |  | llm-judge         |
|  + PEER (L20)     |  |  + RecDecomp(L16) |  |  + RecVerify(L19) |
|  + RecDecomp(L16) |  |  + SelfRefine(L17)|  |  + SelfRefine(L17)|
|                   |  |                   |  |                   |
+-------------------+  +-------------------+  +-------------------+
        |                           |                           |
        +---------------------------+---------------------------+
                                    |
                                    v
+===========================================================================+
|                      RLM RECURSION LAYER (NEW)                              |
|                                                                             |
|  /recursive-refine: manual recursive refinement of any artifact             |
|  /autoloop: autonomous recursive improvement loop for a single target       |
|                                                                             |
|  recursive-orchestrator: manages recursion depth, state, and convergence    |
|  gap-analyzer: detects gaps in artifacts and produces targeted sub-tasks     |
|  ecosystem-scanner: scans repos/ for patterns before recursive improvement  |
|                                                                             |
|  FILE STATE: .productionos/RECURSION-STATE.md                               |
|  DEPTH LOG:  .productionos/RECURSION-DEPTH-{N}.md                           |
|  CONTEXT:    density-summarizer (extended with RecSumm L18)                 |
+===========================================================================+
        |
        v
+===========================================================================+
|                      LEARNING LAYER (existing, extended)                     |
|  metaclaw-learner: extracts lessons, including recursion-specific patterns  |
|  PromptEvo (L21): evolves recursive prompt templates between runs           |
+===========================================================================+
```

### 2.2 How RLM Fits Into Existing Command Structure

The existing command hierarchy does not change. RLM introduces two new commands at the **specialized** tier and three new agents. The existing commands gain new capabilities through prompt layer injection (Layers 16-21) and agent augmentation.

```
COMMAND HIERARCHY (updated)
============================

Orchestrative (recursive, nth-iteration):
  /omni-plan-nth     [MODIFIED] -- adds RLM depth within iterations
  /auto-swarm-nth    [MODIFIED] -- adds recursive sub-swarms

Pipeline (structured, single-pass with convergence):
  /omni-plan         [unchanged]
  /auto-swarm        [unchanged]
  /production-upgrade [unchanged]

Specialized:
  /deep-research     [unchanged]
  /agentic-eval      [unchanged]
  /security-audit    [unchanged]
  /context-engineer  [unchanged]
  /logic-mode        [unchanged]
  /learn-mode        [unchanged]
  /recursive-refine  [NEW] -- single-artifact recursive refinement
  /autoloop          [NEW] -- autonomous recursive improvement loop

Utility:
  /productionos-update [unchanged]
  /productionos-help   [unchanged]
```

### 2.3 Agent Count Update

Current: 48 agents (43 existing + 5 auto-mode agents)
After RLM: 48 existing + 3 new = 51 agents

| Category | Count | New |
|----------|-------|-----|
| Core Review | 11 | 0 |
| Advanced Analysis | 9 | 0 |
| Execution | 9 | 0 |
| Orchestrative | 6 | 0 |
| RLM-Specific | 0 -> 3 | recursive-orchestrator, gap-analyzer, ecosystem-scanner |

### 2.4 Prompt Layer Count Update

Current: 7 base layers (L1-L7) + 7 extended layers (prompts/09-15) + 6 recursive patterns (L16-L21, designed in RECURSIVE-PATTERNS.md but not implemented as files)
After RLM: same layer count, but L16-L21 formalized into individual prompt files and wired into the composition function.

---

## 3. New Components

### 3.1 /recursive-refine Command

**Purpose:** Apply recursive self-refinement to a single artifact (document, plan, evaluation, codebase file). This is the user-facing wrapper around Layer 17 (SelfRefine) and Layer 19 (RecVerify).

**When to use:** When a specific output needs to be polished to production quality -- a README, an architecture document, a security audit report, or a complex function.

**File:** `.claude/commands/recursive-refine.md`

```yaml
---
name: recursive-refine
description: "Recursively refine any artifact through generate-critique-refine loops until convergence. Applies SelfRefine (L17) for quality and RecVerify (L19) for correctness."
arguments:
  - name: target
    description: "Path to the artifact to refine (file path or .productionos/ artifact name)"
    required: true
  - name: max_depth
    description: "Maximum refinement depth (default: 3, max: 5)"
    required: false
    default: "3"
  - name: rubric
    description: "Evaluation rubric: code | document | plan | security | custom"
    required: false
    default: "auto-detect"
  - name: verify
    description: "Enable recursive verification stack after refinement (L1/L2/L3)"
    required: false
    default: "true"
---
```

**Protocol:**

```
RECURSIVE-REFINE PROTOCOL
==========================

Step 0: Preamble (standard ProductionOS preamble)

Step 1: CLASSIFY the artifact
  - Code artifact: apply Layer 14 (Self-Debugging) instead of Layer 17
  - Document artifact: apply Layer 17 (SelfRefine)
  - Plan artifact: apply Layer 17 + Layer 20 (PEER)
  - Security finding: apply Layer 19 at full L1-L3 depth

Step 2: LOAD the recursive-orchestrator agent
  - Read agents/recursive-orchestrator.md
  - Pass: target artifact, max_depth, rubric, verification flag
  - The orchestrator manages depth tracking and convergence

Step 3: GENERATE initial assessment (depth 0)
  - Read the artifact
  - Produce structured evaluation against rubric
  - Tag as <draft depth="0">

Step 4: CRITIQUE (depth 0)
  - Switch to critic role
  - Score 5 dimensions: correctness, completeness, clarity, actionability, conciseness
  - MUST identify at least one weakness per dimension (no perfect depth-0 scores)
  - Tag as <critique depth="0">

Step 5: REFINE (depth 1)
  - Apply critique to produce improved version
  - Every change must trace to a specific critique point
  - Regression guard: never drop a dimension by more than 1 point
  - Tag as <draft depth="1">

Step 6: CONVERGENCE CHECK
  - Compare depth N-1 and depth N scores
  - If average improvement < 0.5 across all dimensions: STOP
  - If any dimension regressed > 1.0: REVERT that dimension
  - If depth >= max_depth: FORCE STOP
  - If improvement >= 0.5: return to Step 4 with depth += 1

Step 7: VERIFY (optional, if --verify=true)
  - Run RecVerify (L19) on the final refined artifact
  - L1: factual verification of claims
  - L2: methodological check of the verification itself
  - L3: blind spot detection (frame challenges, assumption audits)
  - Severity-based depth: P3=L1, P2=L1+L2, P1/P0=L1+L2+L3

Step 8: DELIVER
  - Write refined artifact to original path (overwrite)
  - Write refinement log to .productionos/REFINE-LOG-{artifact-name}.md
  - Include: depth reached, per-depth scores, convergence reason, changes made
```

**Guardrails:**
- Max depth: 5 (hard limit, configurable down to 1)
- Max token budget: 200K per refinement session
- Regression protection: no dimension can drop more than 1 point between depths
- Infinite loop detection: if depth N output matches depth N-2, halt
- Code artifacts use Self-Debugging (L14) not SelfRefine (L17) -- code needs execution feedback, not self-critique

**Output:**
```
.productionos/
  REFINE-LOG-{artifact-name}.md    # Refinement trace with per-depth scores
```

---

### 3.2 /autoloop Command

**Purpose:** Autonomous recursive improvement loop for a specific subsystem, file, or capability. Unlike `/omni-plan-nth` which targets the entire codebase, `/autoloop` focuses on one thing and makes it perfect through recursive depth.

**When to use:** When a single component needs intensive improvement -- a critical API endpoint, a complex algorithm, a key UI flow, a security-sensitive module.

**File:** `.claude/commands/autoloop.md`

```yaml
---
name: autoloop
description: "Autonomous recursive improvement loop for a single target. Combines gap analysis, recursive refinement, ecosystem scanning, and convergence detection to drive a focused subsystem to 10/10."
arguments:
  - name: target
    description: "The subsystem to improve (file path, directory, or description)"
    required: true
  - name: goal
    description: "What 'perfect' looks like for this target (natural language)"
    required: false
    default: "10/10 across all applicable quality dimensions"
  - name: max_iterations
    description: "Maximum outer iterations (default: 10)"
    required: false
    default: "10"
  - name: max_depth
    description: "Maximum recursion depth per iteration (default: 3)"
    required: false
    default: "3"
  - name: scan_repos
    description: "Scan ~/repos/ for reference implementations before improving (default: true)"
    required: false
    default: "true"
---
```

**Protocol:**

```
AUTOLOOP PROTOCOL
==================

PRELIMINARY:
  P1: Run shared preamble (templates/PREAMBLE.md)
  P2: Load recursive-orchestrator agent
  P3: If --scan_repos=true, run ecosystem-scanner agent
      - Scan ~/repos/ for implementations matching the target's domain
      - Extract patterns, approaches, quality bars from reference repos
      - Write findings to .productionos/ECOSYSTEM-SCAN-{target}.md
  P4: Load gap-analyzer agent
      - Analyze the target for gaps against the goal
      - Produce a structured gap map with severity and effort estimates
      - Write to .productionos/GAP-ANALYSIS-{target}.md

ITERATION LOOP:
  For iteration = 1 to max_iterations:

    PHASE 1: GAP ANALYSIS
      - gap-analyzer reads current state of target
      - Compares against goal definition
      - Identifies top 3 gaps (severity-ranked)
      - Checks ecosystem scan for reference solutions to each gap

    PHASE 2: RECURSIVE REFINEMENT
      For each gap (top 3):
        - Apply RecDecomp (L16) to decompose the fix into atomic subtasks
        - For each atomic subtask:
          - Execute the fix
          - Apply SelfRefine (L17) to the fix output
          - Apply RecVerify (L19) to verify correctness
        - Compose subtask results into gap closure
        - Validate: run tests, lint, type-check

    PHASE 3: EVALUATE
      - Run llm-judge on the modified target
      - Score against goal dimensions
      - Compare to previous iteration

    PHASE 4: CONVERGE
      - Run convergence-monitor (6 algorithms)
      - Decision:
        SUCCESS: all dimensions meet goal -> DELIVER
        CONTINUE: improvement detected -> next iteration
        PIVOT: stalled -> change approach (different agents, different decomposition)
        CONVERGED: plateau accepted -> DELIVER with gap report
        DEGRADED: regression detected -> ROLLBACK, investigate

    PHASE 5: COMPRESS CONTEXT
      - density-summarizer compresses iteration artifacts using RecSumm (L18)
      - Produces handoff document for next iteration
      - Prevents context rot across iterations

  END LOOP

DELIVERY:
  - Write final state assessment to .productionos/AUTOLOOP-REPORT-{target}.md
  - Include: iterations run, per-iteration scores, final gaps, ecosystem patterns used
  - If within /omni-plan-nth: report back to the orchestrator
```

**Guardrails:**
- Max iterations: 10 (configurable, hard cap 20)
- Max recursion depth per iteration: 3 (configurable, hard cap 5)
- Max total agent spawns: 100 (10 iterations x 10 agents/iteration)
- Token budget: 500K total (50K/iteration average)
- Regression rollback: any dimension drop > 0.5 triggers immediate rollback
- Stall detection: 2 iterations with < 0.1 improvement triggers PIVOT
- Emergency stop: ask user every 5 iterations

**Output:**
```
.productionos/
  ECOSYSTEM-SCAN-{target}.md       # Reference implementations found
  GAP-ANALYSIS-{target}.md         # Gap map with severity
  AUTOLOOP-ITERATION-{N}.md        # Per-iteration results
  AUTOLOOP-REPORT-{target}.md      # Final delivery report
```

---

### 3.3 recursive-orchestrator Agent

**Purpose:** Central coordinator for all depth-level recursion. Manages recursion state, depth tracking, convergence detection within depths (as opposed to convergence-monitor which tracks across iterations), and context compression between depth levels.

**File:** `agents/recursive-orchestrator.md`

```yaml
---
name: recursive-orchestrator
description: "Manages depth-level recursion state, enforces depth limits, detects convergence within recursive stacks, and coordinates context compression between depth levels. The brain of RLM."
color: red
tools:
  - Read
  - Glob
  - Grep
  - Write
  - Bash
---
```

**Role and Instructions:**

```
RECURSIVE ORCHESTRATOR
=======================

You manage all recursive operations within ProductionOS. You are NOT the
iteration-level orchestrator (that is /omni-plan-nth and convergence-monitor).
You are the DEPTH-level orchestrator -- you manage recursion WITHIN a single
step of a single iteration.

RESPONSIBILITIES:

1. DEPTH TRACKING
   Maintain .productionos/RECURSION-STATE.md with:
   - Current recursion context (which command/agent initiated)
   - Current depth (0 = root)
   - Maximum depth for this context
   - Stack trace: ROOT -> depth-1-task -> depth-2-task -> ...
   - Token budget remaining
   - Convergence signals at each depth

2. DEPTH LIMIT ENFORCEMENT
   Hard limits by context:
   | Context                | Max Depth | Rationale                         |
   |------------------------|-----------|-----------------------------------|
   | /recursive-refine      | 5         | User-initiated, controlled scope  |
   | /autoloop per-gap      | 3         | Nested within iteration loop      |
   | RecDecomp (L16)        | 5         | Task decomposition can go deep    |
   | SelfRefine (L17)       | 3         | Diminishing returns past 3        |
   | RecSumm (L18)          | 3         | 3 levels: leaf, branch, root      |
   | RecVerify (L19)        | 3         | 3 levels: factual, method, blind  |
   | PEER (L20)             | 3 replans | Replanning has diminishing value  |
   | Within /omni-plan-nth  | 3         | Claude Code nesting limit         |
   | Within /auto-swarm-nth | 2         | Already nested under command      |

   When max depth is reached: FORCE resolution at current depth.
   Never dynamically increase max depth.

3. CONVERGENCE DETECTION (WITHIN DEPTH)
   At each depth level, check:
   - PROGRESS: Is the output at depth N strictly better than depth N-1?
     If not: halt recursion, return depth N-1 output.
   - SIZE: Is the sub-problem at depth N strictly smaller than depth N-1?
     If not: recursion is degenerate, halt and solve directly.
   - CYCLE: Does depth N output match depth N-2 output?
     If so: oscillation detected, halt and return the better of the two.
   - BUDGET: Has cumulative token usage exceeded the depth budget?
     If so: force resolution at current depth.

4. CONTEXT COMPRESSION BETWEEN DEPTHS
   When passing context from depth N to depth N+1:
   - Apply Chain of Density (Layer 7) to compress the parent context
   - Strip tool invocation history (actions taken, not relevant to child)
   - Preserve: task definition, constraints, quality bar, relevant findings
   - Target: <2000 tokens of context per depth transition

   When returning results from depth N+1 to depth N:
   - Include: solution, confidence score, evidence citations
   - Exclude: intermediate reasoning (unless explicitly requested)
   - Target: <1000 tokens of results per depth return

5. STATE FILE MANAGEMENT
   Write .productionos/RECURSION-STATE.md at each depth transition.
   Write .productionos/RECURSION-DEPTH-{N}.md at each depth level.
   On completion: write final summary to RECURSION-STATE.md with status COMPLETE.

DECISION PROTOCOL (at each depth):

  IF task is ATOMIC (solvable in single step):
    -> Solve directly, return result
    -> Do not recurse further

  IF depth >= max_depth:
    -> Force atomic resolution
    -> Log "FORCED-ATOMIC at depth {N}: {reason task is not naturally atomic}"
    -> Return best-effort result

  IF progress_check FAILS (no improvement):
    -> Return previous depth's output
    -> Log "CONVERGENCE at depth {N}: no improvement over depth {N-1}"

  IF cycle_detected:
    -> Return better of depth N and depth N-2
    -> Log "OSCILLATION at depth {N}: output matches depth {N-2}"

  IF budget_exceeded:
    -> Force resolution at current depth
    -> Log "BUDGET-EXCEEDED at depth {N}: {tokens_used}/{budget} tokens"

  ELSE:
    -> Decompose into sub-problems
    -> Pass compressed context to each sub-problem
    -> Recurse (depth += 1)
    -> Compose results
    -> Return composed result
```

---

### 3.4 gap-analyzer Agent

**Purpose:** Systematic gap detection for any artifact, codebase, or plan. Produces structured gap maps that drive recursive refinement. Works with the recursive-orchestrator to create targeted sub-tasks for each gap.

**File:** `agents/gap-analyzer.md`

```yaml
---
name: gap-analyzer
description: "Systematic gap detection agent -- analyzes artifacts against quality targets and produces structured gap maps with severity, effort estimates, and reference solutions from ecosystem scans."
color: orange
tools:
  - Read
  - Glob
  - Grep
  - Write
---
```

**Role and Instructions:**

```
GAP ANALYZER
=============

You detect what is MISSING, INCOMPLETE, or BELOW-STANDARD in any target.
You do not fix gaps -- you map them with enough precision that execution
agents can close them.

ANALYSIS PROTOCOL:

Step 1: UNDERSTAND THE TARGET
  - Read the target artifact/codebase/plan
  - Identify what it is supposed to do (from README, docstrings, comments, context)
  - Identify the quality bar (from /autoloop goal or /omni-plan-nth dimensions)

Step 2: DIMENSIONAL ANALYSIS
  For each applicable dimension from the ProductionOS rubric:
  1. Code Quality: naming, structure, patterns, DRY, SOLID
  2. Security: auth, injection, encryption, secrets, RBAC
  3. Performance: N+1, indexes, caching, memory, latency
  4. UX/UI: states, loading, errors, empty, accessibility
  5. Test Coverage: unit, integration, edge cases, mocks
  6. Accessibility: WCAG, keyboard, screen reader, contrast
  7. Documentation: README, inline, API docs, examples
  8. Error Handling: try/catch, error types, user messages, recovery
  9. Observability: logging, tracing, metrics, alerts
  10. Deployment Safety: CI/CD, rollback, migrations, health checks

  For each dimension, identify:
  - PRESENT: what exists and meets the quality bar
  - PARTIAL: what exists but is incomplete or below standard
  - MISSING: what does not exist at all
  - EXCESS: what exists but should not (dead code, unused deps)

Step 3: GAP MAP CONSTRUCTION

  Output format:
  ```markdown
  # Gap Analysis: {target}
  ## Quality Bar: {goal description}
  ## Overall Completeness: {X}%

  | ID | Dimension | Type | Description | Severity | Effort | Reference |
  |----|-----------|------|-------------|----------|--------|-----------|
  | G-01 | Security | MISSING | No input validation on /api/upload | P0 | 2h | ~/repos/InsForge auth middleware |
  | G-02 | Tests | PARTIAL | 3/12 API routes have tests | P1 | 4h | ~/repos/LibreChat test patterns |
  | G-03 | Docs | MISSING | No API documentation | P2 | 2h | ~/repos/n8n-docs structure |
  | ... | | | | | | |

  ## Gap Clusters (root causes)
  - CLUSTER-A: "{root cause}" -> affects G-01, G-04, G-07
  - CLUSTER-B: "{root cause}" -> affects G-02, G-03

  ## Recommended Fix Order
  1. G-01 (P0, blocks G-04)
  2. G-04 (P0, depends on G-01)
  3. G-02 (P1, highest ROI)
  ...

  ## Ecosystem References
  - {repo}: {what pattern to study} (applies to G-{N})
  ```

Step 4: SUB-TASK GENERATION
  For each gap, generate an atomic sub-task definition:
  ```
  SUBTASK for G-{N}:
    ACTION: {what to do, specific enough to execute}
    FILES: {which files to create/modify}
    ACCEPTANCE: {how to verify the gap is closed}
    DEPENDENCIES: {other gaps that must close first}
    DEPTH-HINT: {ATOMIC | NEEDS-DECOMPOSITION}
  ```

  These sub-tasks feed into RecDecomp (L16) or directly into execution agents.

INTEGRATION:
  - /autoloop: Phase 1 invokes gap-analyzer at each iteration
  - /recursive-refine: Step 1 may invoke gap-analyzer to identify what needs refining
  - /omni-plan-nth: Phase 2 (Plan) can invoke gap-analyzer for focused analysis
  - /auto-swarm-nth: Phase 1 (Gap Analysis) uses gap-analyzer per wave
```

---

### 3.5 ecosystem-scanner Agent

**Purpose:** Scans reference repositories in `~/repos/` (41 repos per CLAUDE.md) for existing implementations that match the current improvement target. Prevents reinventing patterns that already exist in the ecosystem.

**File:** `agents/ecosystem-scanner.md`

```yaml
---
name: ecosystem-scanner
description: "Scans ~/repos/ reference repositories for existing implementations, patterns, and quality benchmarks relevant to the current improvement target. Implements CLAUDE.md rule: 'scan repos first before building.'"
color: blue
tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Write
---
```

**Role and Instructions:**

```
ECOSYSTEM SCANNER
==================

You implement the CLAUDE.md Auto-Enrichment Protocol: "Before building any
new feature, check ~/repos/ for existing implementations." You are the
automated version of this manual step.

SCAN PROTOCOL:

Step 1: TARGET ANALYSIS
  - Read the improvement target description
  - Extract keywords: technology, pattern, domain, framework
  - Map to repo categories from CLAUDE.md:
    INFRA (9 repos), PROMPT (13 repos), CLAUDE_SKILL (11 repos), WORKFLOW (8 repos)

Step 2: REPO SEGMENTATION
  - Read the project's repo-segmentation reference document
  - Identify which repos are most likely to contain relevant patterns
  - Rank repos by relevance (top 5)

Step 3: TARGETED SCAN
  For each top-5 repo:
  1. Read README.md for architecture overview
  2. Grep for keywords related to the target
  3. Glob for file patterns matching the target domain
  4. Read the most relevant 3-5 files (not the entire repo)
  5. Extract:
     - Implementation patterns (how they solved similar problems)
     - Quality benchmarks (what "good" looks like in this repo)
     - Reusable code snippets (if directly applicable)
     - Architecture decisions (ADRs, design docs)

Step 4: SYNTHESIS
  Produce a structured scan report:

  ```markdown
  # Ecosystem Scan: {target}
  ## Repos Scanned: {count}

  ### Pattern: {pattern-name}
  - Found in: {repo} ({file path})
  - Relevance: {HIGH/MEDIUM/LOW}
  - Summary: {2-3 sentences}
  - Applicable to: {which gap from gap-analyzer}
  - Adaptation needed: {what to change for this codebase}

  ### Pattern: {pattern-name}
  ...

  ## Quality Benchmarks
  | Dimension | Best-in-Ecosystem | Where | Our Current | Gap |
  |-----------|-------------------|-------|-------------|-----|
  | Test coverage | 85% | LibreChat | 15% | 70% |
  | Auth pattern | JWT + RBAC + RLS | InsForge | JWT only | middleware + RLS |

  ## Recommended Imports
  - {pattern}: copy from {repo}/{path}, adapt {what}
  ```

CONSTRAINTS:
  - Maximum 5 repos per scan (focus, not breadth)
  - Maximum 20 files read per repo (targeted, not exhaustive)
  - Never copy code verbatim without noting the license
  - Scan time budget: 2 minutes maximum
  - Write output to .productionos/ECOSYSTEM-SCAN-{target}.md
```

---

## 4. Modified Components

### 4.1 /omni-plan-nth -- Adding Recursive Refinement

**Current state:** `/omni-plan-nth` runs a 5-phase iteration loop (Assess, Plan, Execute, Evaluate, Decide) with convergence monitoring. Each phase is a single-pass operation.

**Modification:** Inject RLM depth within three phases.

#### Phase 2 (Plan) Modification

Current behavior: Select skills/commands for weak dimensions, produce a flat fix list.

New behavior: Apply PEER (L20) to make planning adaptive.

```
PHASE 2 (PLAN) -- MODIFIED
============================

Before (single-pass):
  Identify weak dimensions -> select skills -> produce fix list

After (PEER-enabled):
  Step 1: gap-analyzer produces structured gap map for weak dimensions
  Step 2: RecDecomp (L16) decomposes each gap into atomic sub-tasks
  Step 3: PEER produces an adaptive plan:
    PLAN V1 -> execute step 1 -> evaluate -> adjust or replan
  Step 4: If ecosystem-scanner finds reference implementations,
          inject them as context for execution agents

Integration point in omni-plan-nth.md:
  After "### Phase 2: Plan -- Skill Selection", add:

  ```markdown
  ### Phase 2b: Recursive Plan Enhancement (RLM)

  Before executing the selected skills, enhance the plan:

  1. Invoke gap-analyzer on the weak dimensions identified in Phase 1
     - Read agents/gap-analyzer.md
     - Dispatch with: target dimensions, current scores, goal=10/10
     - Output: .productionos/GAP-ANALYSIS-ITER-{N}.md

  2. For each gap with DEPTH-HINT=NEEDS-DECOMPOSITION:
     - Apply RecDecomp (L16) to break into atomic sub-tasks
     - Max depth: 3 (within /omni-plan-nth context)

  3. Wrap the execution plan in PEER (L20):
     - Each step has EXPECTED-OUTCOME and FAILURE-CONDITION
     - If a step fails: evaluate and replan (max 2 replans per iteration)

  4. If --scan_repos was specified or this is iteration > 3 and stalled:
     - Invoke ecosystem-scanner for stuck dimensions
     - Inject reference patterns into execution agent prompts
  ```
```

#### Phase 3 (Execute) Modification

Current behavior: Invoke selected skills/commands, apply fixes, validate, self-heal, commit.

New behavior: Add RecDecomp for complex fixes and SelfRefine for human-facing outputs.

```
PHASE 3 (EXECUTE) -- MODIFIED
===============================

For each fix in the plan:

  IF fix is a code change AND complexity > THRESHOLD:
    Apply RecDecomp (L16):
      - Decompose into atomic code changes
      - Execute each atomically
      - Validate after each (test, lint, type-check)
      - Compose results
    Max decomposition depth: 3

  IF fix produces a document (README, API docs, architecture):
    Apply SelfRefine (L17) after generation:
      - Generate -> Critique -> Refine -> Convergence check
      - Max refinement depth: 2 (within execution context)

  AFTER all fixes applied:
    Apply RecVerify (L19) to the batch:
      - L1: verify each fix claim (did the code actually change?)
      - L2: verify the verification methodology
      - Depth based on batch severity (P0 = full L1-L3)
```

#### Phase 4 (Evaluate) Modification

Current behavior: Tri-tiered judge panel scores all 10 dimensions.

New behavior: Judge outputs pass through RecVerify to catch self-bias.

```
PHASE 4 (EVALUATE) -- MODIFIED
================================

After tri-tiered judge panel produces scores:

  For each dimension where score increased by >= 2 points (suspicious jump):
    Apply RecVerify (L19) at L1+L2:
      L1: Is the score justified? Check evidence citations.
      L2: Did the judge's methodology adequately cover this dimension?

  For each dimension where score == 10 (perfect claim):
    Apply RecVerify (L19) at L1+L2+L3:
      L1: factual verification of the 10/10 claim
      L2: methodological verification
      L3: blind spot check -- what could break this 10?

  This prevents score inflation from the convergence loop.
```

---

### 4.2 /auto-swarm-nth -- Adding Recursive Sub-Swarms

**Current state:** `/auto-swarm-nth` deploys waves of 7 agents, each covering assigned scope items. Agents can invoke skills but cannot spawn sub-swarms.

**Modification:** Allow agents to flag items for recursive sub-swarm treatment.

```
RECURSIVE SUB-SWARM PROTOCOL
==============================

Current constraint (from auto-swarm-nth.md):
  "Agents cannot invoke /auto-swarm-nth recursively
   (no sub-swarms of sub-swarms)."

Modified constraint:
  "Agents can flag items for RECURSIVE TREATMENT via the recursive-orchestrator.
   This is NOT a sub-swarm -- it is depth-level recursion within the agent's scope."

How it works:

  Wave N, Agent 3 encounters a complex item:
    Agent 3 flags: NEEDS-RECURSIVE-TREATMENT: {item description}

  After the wave completes, the swarm orchestrator:
    1. Collects all NEEDS-RECURSIVE-TREATMENT flags
    2. For each flagged item:
       a. Invokes recursive-orchestrator with the item
       b. recursive-orchestrator applies RecDecomp (L16):
          - Decomposes the item into 2-5 sub-items
          - Solves each sub-item (depth + 1)
          - Composes results
       c. Results are added to the wave's coverage map
    3. Flagged items count as "covered via recursive treatment"

  Depth limit: 2 (agent -> recursive-orchestrator -> sub-item resolution)
  This respects the existing "max depth 3" constraint:
    command (1) -> agent (2) -> recursive treatment (3)

  Token budget: recursive treatment draws from the wave's 400K budget.
  If budget insufficient: flag item as "DEFERRED-RECURSIVE" for next wave.
```

**Integration point in auto-swarm-nth.md:**

After "### Phase 4: Synthesis", add:

```markdown
### Phase 4b: Recursive Treatment (RLM)

After merging agent findings, check for NEEDS-RECURSIVE-TREATMENT flags:

1. Collect all flagged items from this wave's agent outputs
2. If any items flagged AND wave token budget allows:
   a. For each flagged item (max 3 per wave):
      - Load recursive-orchestrator agent
      - Apply RecDecomp (L16) with max_depth=2
      - Execute each atomic sub-item
      - Add results to coverage map
   b. Update coverage: flagged items marked as COVERED-RECURSIVE
3. If budget exhausted: defer to next wave as priority items
```

---

### 4.3 convergence-monitor -- Adding Recursive Convergence Detection

**Current state:** The convergence-monitor runs 6 algorithms (score-based, semantic, diminishing returns, oscillation, plateau+pivot, EMA velocity) at the iteration level.

**Modification:** Add a 7th algorithm for recursive depth convergence, and make the monitor callable at any recursion level.

```
ALGORITHM 7 -- Recursive Depth Convergence (NEW)
==================================================

Purpose: Detect convergence WITHIN a recursive stack, not across iterations.

Input: sequence of outputs at depths 0, 1, 2, ..., N

Metrics:
  depth_delta(d) = quality(d) - quality(d-1)
  depth_similarity(d) = textual_overlap(output_d, output_{d-1})
  depth_efficiency = depth_delta(d) / tokens_consumed_at_depth_d

Signals:
  DEPTH-CONVERGED when:
    depth_delta < 0.3 for 2 consecutive depths
    OR depth_similarity > 0.90

  DEPTH-DIMINISHING when:
    depth_efficiency < 0.1 (improvement per token is negligible)

  DEPTH-OSCILLATING when:
    output at depth N closely matches output at depth N-2
    AND output at depth N differs from output at depth N-1

  DEPTH-IMPROVING when:
    depth_delta > 0.3 AND depth_efficiency > 0.1

Decision at each depth:
  DEPTH-IMPROVING   -> continue to depth+1 (if budget allows)
  DEPTH-CONVERGED   -> stop, return current depth output
  DEPTH-DIMINISHING -> stop, return current depth output (log warning)
  DEPTH-OSCILLATING -> stop, return better of last two depths

Integration:
  The recursive-orchestrator invokes convergence-monitor with:
    mode="depth" (not "iteration")
    data=[depth-0-scores, depth-1-scores, ...]
  convergence-monitor returns the depth-level verdict.

Modified convergence-monitor output format:
  Add section:
  ```markdown
  ## Depth Convergence (if recursive context)
  | Depth | Quality | Delta | Similarity | Efficiency | Signal |
  |-------|---------|-------|------------|------------|--------|
  | 0     | 6.2     | -     | -          | -          | ROOT   |
  | 1     | 7.8     | +1.6  | 0.45       | 0.32       | IMPROVING |
  | 2     | 8.1     | +0.3  | 0.82       | 0.08       | DIMINISHING |
  | 3     | 8.2     | +0.1  | 0.91       | 0.02       | CONVERGED |

  Depth verdict: STOP at depth 2 (diminishing returns)
  Recommended output: depth 2 (quality 8.1, best efficiency)
  ```
```

**Integration point in convergence-monitor.md:**

Add to Step 2 (after Algorithm 6):

```markdown
**Algorithm 7 -- Recursive Depth Convergence** (only when mode="depth")
```
depth_delta(d) = quality(d) - quality(d-1)
depth_sim(d) = overlap(output_d, output_{d-1})
depth_eff(d) = depth_delta(d) / tokens_at_depth(d)
DEPTH-CONVERGED when: depth_delta < 0.3 x2 OR depth_sim > 0.90
DEPTH-DIMINISHING when: depth_eff < 0.1
DEPTH-OSCILLATING when: output(N) ~ output(N-2) AND output(N) != output(N-1)
```

And add to Step 3 (Unified Decision):

```markdown
When mode="depth", the priority order is:
1. DEPTH-OSCILLATING  -> return better of last two depths
2. DEPTH-CONVERGED    -> stop, return current depth
3. DEPTH-DIMINISHING  -> stop with warning
4. DEPTH-IMPROVING    -> continue if budget allows
```

---

## 5. File-Based Recursion Protocol

### 5.1 .productionos/RECURSION-STATE.md

**Purpose:** Single source of truth for the current recursion context. Written by recursive-orchestrator at every depth transition. Read by any agent that needs to know where it sits in the recursion tree.

**Format:**

```markdown
# Recursion State

## Context
- Initiated by: {command or agent name}
- Target: {what is being recursively processed}
- Started: {ISO timestamp}
- Status: {ACTIVE | COMPLETE | HALTED | ERROR}

## Current Position
- Depth: {N} / {max_depth}
- Branch: {which subtask at this depth}
- Token budget: {remaining} / {total}

## Stack Trace
```
depth-0: ROOT -- {top-level task description}
  depth-1: {subtask A description} [COMPLETE: score 8.5]
  depth-1: {subtask B description} [ACTIVE]
    depth-2: {subtask B1 description} [COMPLETE: score 9.0]
    depth-2: {subtask B2 description} [IN-PROGRESS]
  depth-1: {subtask C description} [PENDING]
```

## Convergence Signals
| Depth | Quality | Delta | Signal | Action |
|-------|---------|-------|--------|--------|
| 0 | 5.0 | - | ROOT | decomposed into 3 subtasks |
| 1 | 7.2 | +2.2 | IMPROVING | continued |
| 2 | 7.8 | +0.6 | DIMINISHING | monitoring |

## Halted Branches (if any)
- depth-2, branch C1: FORCED-ATOMIC (budget exceeded)
- depth-1, branch D: OSCILLATION (depth-3 matched depth-1)
```

### 5.2 .productionos/RECURSION-DEPTH-{N}.md

**Purpose:** Detailed log for each depth level. Contains the full context that was passed down, the work done, and the results returned up.

**Format:**

```markdown
# Recursion Depth {N} — {task description}

## Metadata
- Parent: depth-{N-1}, branch {X}
- Initiated: {timestamp}
- Completed: {timestamp}
- Token usage: {count}

## Context Received (compressed from depth N-1)
{CoD-compressed context from parent, <2000 tokens}

## Atomicity Assessment
- Can solve in single step? {YES/NO}
- If NO, decomposed into {M} subtasks
- Subtasks:
  1. {description} [INDEPENDENT/DEPENDS-ON: ...]
  2. {description} [INDEPENDENT/DEPENDS-ON: ...]

## Work Done
{detailed log of actions taken at this depth}

## Results (returned to depth N-1)
- Solution: {summary}
- Confidence: {0-100%}
- Evidence: {file:line citations}
- Quality: {score}/10

## Convergence at This Depth
- Depth delta: {quality_improvement from parent task}
- Signal: {IMPROVING/CONVERGED/DIMINISHING/OSCILLATING}
- Recommendation: {continue/stop/return-previous}
```

### 5.3 Context Compression Format Between Levels

**Purpose:** Prevent context explosion across recursion depths. Each depth transition compresses context using a standardized format.

**Downward compression (parent -> child):**

```markdown
## CONTEXT FOR DEPTH {N+1}

TASK: {one-line description of what this subtask must solve}
PARENT-TASK: {one-line description of the parent task}
QUALITY-BAR: {target score or acceptance criteria}
CONSTRAINTS: {budget, depth limit, scope boundaries}
RELEVANT-FINDINGS: {3-5 bullet points of what the parent learned}
AVAILABLE-TOOLS: {which tools this depth level may use}
ANTI-PATTERNS: {what NOT to do, from reflexion insights}
```

Target: <2000 tokens. Enforced by density-summarizer if context exceeds limit.

**Upward compression (child -> parent):**

```markdown
## RESULT FROM DEPTH {N+1}

STATUS: {SOLVED | PARTIAL | FAILED}
SOLUTION: {1-3 sentences describing what was done}
CONFIDENCE: {0-100%}
EVIDENCE: {file:line citations, max 5}
TOKENS-USED: {count}
CHILD-DEPTHS: {how many further recursion levels were used}
GAPS: {anything this depth could not resolve}
```

Target: <1000 tokens.

**Hierarchical RecSumm (L18) for multi-source compression:**

When a depth level produces multiple outputs (e.g., 5 subtask results), RecSumm kicks in:

```
5 subtask results (depth N+1)
    |
    v
Level 0: Leaf summaries (one per subtask result, CoD-compressed)
    |
    v
Level 1: Branch summaries (grouped by theme, 60% compression)
    |
    v
Level 2: Root summary (single ultra-dense handoff, 50% compression)
    |
    v
Returned to depth N as composed result
```

Coherence tracking at each level ensures no critical findings are lost during compression.

---

## 6. Constraints and Workarounds

### 6.1 Claude Code Depth-3 Limit

**Constraint:** Claude Code's Agent tool supports a maximum nesting depth of 3: command -> agent -> sub-agent -> skill. Beyond this, agent dispatch fails or becomes unreliable.

**Impact on RLM:**
- RecDecomp (L16) can decompose tasks to depth 5 or 6 conceptually, but only 3 levels can use separate Agent tool invocations
- /omni-plan-nth -> /auto-swarm-nth -> agent already consumes all 3 levels

**Workarounds:**

```
WORKAROUND 1: SERIALIZED DEPTH (primary approach)
====================================================

Instead of nesting agents, serialize recursive steps within a single agent.

Example: RecDecomp at depth 4 within a single agent:

  Agent receives task at depth 1 (dispatched by command at depth 0).
  Agent internally manages depths 2, 3, 4 WITHOUT spawning sub-agents:

  ```
  # Inside the agent's execution (single Agent tool invocation)
  Step 1: Decompose task (depth 2)
  Step 2: For each subtask:
    Step 2a: Check atomicity (depth 3)
    Step 2b: If not atomic, decompose again (depth 4) -- but solve WITHIN this agent
    Step 2c: Solve atomic pieces
  Step 3: Compose results
  ```

  This uses the agent's own context window for recursion rather than
  spawning sub-agents. Cost: larger context window usage within one agent.
  Benefit: no depth limit from Agent tool nesting.


WORKAROUND 2: FILE-BASED CONTINUATION
========================================

When an agent hits depth 3 and needs to go deeper:
1. Agent writes current state to .productionos/RECURSION-CONTINUE-{id}.md
2. Agent returns to the parent with status: NEEDS-CONTINUATION
3. Parent command reads the continuation file
4. Parent dispatches a NEW agent (not nested) with the continuation context
5. New agent starts at depth 1 but with the logical depth being 4+

This resets the nesting counter while preserving logical recursion depth.

  Command (depth 0)
    -> Agent A (depth 1) works on task, hits depth limit
    -> Agent A writes RECURSION-CONTINUE-001.md, returns NEEDS-CONTINUATION
    -> Command reads continuation file
    -> Command dispatches Agent B (depth 1) with continuation context
    -> Agent B continues the recursive work at logical depth 4+

  Constraint: context compression between Agent A and Agent B must be
  aggressive (target <3000 tokens) to avoid blowing Agent B's context window.


WORKAROUND 3: PROMPT-INTERNAL RECURSION
==========================================

For SelfRefine (L17) and RecVerify (L19), recursion happens WITHIN
a single prompt response -- no agent spawning needed.

The agent generates output, then critiques it, then refines it, all
in one response. This is recursion in the prompt, not in the tool call
hierarchy. No depth limit applies.

Cost: longer single responses.
Benefit: no nesting constraints.
Best for: refinement and verification (L17, L19) where each depth
level is a continuation of the same task, not a new sub-problem.
```

**Depth limit enforcement table (final):**

| Recursion Type | Agent Nesting Depth | Prompt-Internal Depth | Total Logical Depth |
|----------------|---------------------|-----------------------|---------------------|
| RecDecomp (L16) | 2 (max) | 3 (serialized) | 5 |
| SelfRefine (L17) | 0 (all prompt-internal) | 3 | 3 |
| RecSumm (L18) | 1 (leaf agents) | 2 (CoD within) | 3 |
| RecVerify (L19) | 0 (all prompt-internal) | 3 | 3 |
| PEER (L20) | 1 (execution agent) | 3 (replans) | 4 |
| /autoloop | 2 (command + gap-analyzer + executor) | 3 (within executor) | 5 |
| /recursive-refine | 1 (recursive-orchestrator) | 3 (refinement depths) | 4 |

### 6.2 Single-Model Constraint

**Constraint:** Claude Code runs a single model per session. The tri-tiered judge panel (Opus/Sonnet/Haiku) described in ARCHITECTURE.md is aspirational -- in practice, all judges run on the same model.

**Impact on RLM:**
- RecVerify (L19) cannot use cross-model verification at Level 4
- Self-bias in SelfRefine (L17) cannot be broken by model diversity
- Judge scores may inflate consistently (same model, same biases)

**Workarounds:**

```
WORKAROUND 1: ROLE DIVERSITY (instead of model diversity)
===========================================================

Since we cannot use different models, we use aggressively different ROLES:

Judge 1 prompt: "You are a pedantic correctness auditor. You ONLY care about
whether the code is functionally correct. You ignore style, naming, and
documentation. A function that works but is ugly gets a 10."

Judge 2 prompt: "You are a pragmatic team lead reviewing a PR. You care about
maintainability, readability, and whether a junior dev could understand this
code. You penalize clever tricks and reward boring, readable code."

Judge 3 prompt: "You are a hostile attacker. Your ONLY goal is to find ways
to break this code. You think about malicious inputs, race conditions, resource
exhaustion, and privilege escalation. Everything is suspicious."

These produce meaningfully different evaluations despite using the same model.


WORKAROUND 2: STRUCTURAL ANTI-BIAS FOR SELFREFINE
====================================================

SelfRefine (L17) tends toward self-congratulation. Countermeasures:

1. FORCED WEAKNESS: "You MUST identify at least one weakness per dimension.
   A critique with zero weaknesses is invalid."

2. EXTERNAL GROUNDING: Before critiquing, re-read the original requirements.
   Critique against requirements, not against your own output.

3. REGRESSION GUARD: If any dimension score INCREASES by more than 2 points
   between depth N and depth N+1, flag for manual review. Large jumps are
   likely inflation, not genuine improvement.

4. ADVERSARIAL INJECTION: Before the refinement step, inject:
   "What would a skeptical reviewer say is WRONG with this output?
    List 3 things before proceeding."


WORKAROUND 3: STATISTICAL SMOOTHING FOR RECVERIFY
====================================================

RecVerify (L19) at Level 2 checks whether Level 1 verification was adequate.
Without a different model, this is the same model checking itself.

Mitigation: Use DIFFERENT EVIDENCE for L2 than L1 used.
- L1 reads the specific files cited in the claim
- L2 reads SURROUNDING files, git history, and test files
- L3 reads documentation, deployment configs, and external constraints

This ensures each level has a different information base even if
the model is the same.
```

### 6.3 Context Window Management

**Constraint:** Claude Code compresses context automatically when the window fills. ProductionOS iterations 5+ already suffer from context rot (documented in ARCHITECTURE.md error table). RLM recursion makes this worse -- each depth level consumes context.

**Workarounds:**

```
WORKAROUND 1: AGGRESSIVE COMPRESSION BETWEEN DEPTHS
======================================================

The context compression format (Section 5.3) enforces:
- Downward: <2000 tokens (parent -> child context)
- Upward: <1000 tokens (child -> parent results)

With max depth 5, worst case is:
  5 levels x 2000 tokens downward = 10,000 tokens for context stack
  5 levels x 1000 tokens upward = 5,000 tokens for result stack
  Total recursion overhead: ~15,000 tokens

This is manageable within a 200K context window.


WORKAROUND 2: DEPTH-PROPORTIONAL CONTEXT BUDGETS
===================================================

Deeper recursion levels get smaller context budgets:
  depth 0: up to 50K tokens (full context)
  depth 1: up to 20K tokens (compressed)
  depth 2: up to 8K tokens (highly compressed)
  depth 3: up to 3K tokens (ultra-compressed, task + constraints only)
  depth 4+: up to 1.5K tokens (task definition only)

This prevents deep recursion from consuming all available context.


WORKAROUND 3: EARLY FLUSH PATTERN
====================================

When an agent completes a depth level:
1. Write ALL results to .productionos/RECURSION-DEPTH-{N}.md (file)
2. Compress results to <1000 tokens for parent
3. The full results are preserved on disk, not in context

If a parent needs to re-read detailed results from a child depth,
it reads the file -- not the in-context memory. This offloads context
to the filesystem.


WORKAROUND 4: RECSUMM (L18) FOR MULTI-ITERATION RLM
======================================================

When /autoloop runs 10 iterations, each with recursion depth 3:
  10 iterations x ~15K recursion overhead = 150K tokens of state

RecSumm (L18) compresses this hierarchically:
  Level 0: Per-depth summaries (10 x 15K = 150K)
  Level 1: Per-iteration summaries (10 x 2K = 20K)
  Level 2: Cumulative summary (1 x 3K = 3K)

The cumulative summary at Level 2 is what carries forward.
Individual depth/iteration details are on disk if needed.
```

### 6.4 Cost Control

**Constraint:** Recursive patterns multiply token consumption. Without controls, RLM could make a single /autoloop invocation cost $50+ in API tokens.

**Controls:**

```
COST GOVERNANCE
================

1. PER-DEPTH TOKEN CAPS
   | Context | Per-Depth Budget | Total Budget |
   |---------|-----------------|--------------|
   | /recursive-refine | 40K | 200K |
   | /autoloop per-iteration | 50K | 500K |
   | RecDecomp (L16) | 30K per level | 150K |
   | SelfRefine (L17) | 25K per pass | 75K |
   | RecVerify (L19) | 20K per level | 60K |
   | PEER (L20) | 50K per replan | 200K |

2. COST ESTIMATION BEFORE RECURSION
   Before entering any recursive pattern, the recursive-orchestrator
   estimates cost:
   estimated_tokens = base_cost x depth_multiplier x branch_count
   If estimated_tokens > budget: reduce max_depth or branch_count

3. EARLY TERMINATION
   The recursive-orchestrator monitors cumulative token usage.
   At 80% of budget: log WARNING, tighten convergence thresholds
   At 95% of budget: force resolution at current depth
   At 100% of budget: halt, return best result so far

4. USER CONFIRMATION
   /autoloop asks for user confirmation:
   - Before starting (estimated cost)
   - Every 5 iterations
   - When pivoting strategy (may extend cost)

5. COST TRACKING
   Append to .productionos/COST-LOG.md:
   | Timestamp | Command | Depth | Tokens | Est. Cost |
   |-----------|---------|-------|--------|-----------|
```

---

## 7. Implementation Roadmap

### P0 — Foundation (implement first, blocks everything else)

**Timeline:** 1 session (2-4 hours)
**Dependencies:** None

| # | Task | Files | Effort |
|---|------|-------|--------|
| 1 | Create recursive-orchestrator agent | `agents/recursive-orchestrator.md` | 200 lines |
| 2 | Create RECURSION-STATE.md template | `templates/RECURSION-STATE-TEMPLATE.md` | 50 lines |
| 3 | Create RECURSION-DEPTH template | `templates/RECURSION-DEPTH-TEMPLATE.md` | 40 lines |
| 4 | Formalize Layer 16 (RecDecomp) as standalone prompt file | `prompts/16-recursive-decomposition.md` | 80 lines (extract from RECURSIVE-PATTERNS.md) |
| 5 | Formalize Layer 17 (SelfRefine) as standalone prompt file | `prompts/17-self-refine.md` | 100 lines (extract from RECURSIVE-PATTERNS.md) |
| 6 | Formalize Layer 19 (RecVerify) as standalone prompt file | `prompts/19-recursive-verification.md` | 120 lines (extract from RECURSIVE-PATTERNS.md) |
| 7 | Add Algorithm 7 (depth convergence) to convergence-monitor | `agents/convergence-monitor.md` (modify) | +40 lines |
| 8 | Add Algorithm 7 to convergence-detection.md | `algorithms/convergence-detection.md` (modify) | +60 lines |
| 9 | Update PROMPT-COMPOSITION.md with extended composition function | `templates/PROMPT-COMPOSITION.md` (modify) | +30 lines |
| 10 | Update ARCHITECTURE.md implementation status table | `ARCHITECTURE.md` (modify) | +20 lines |

**Validation:**
- `bun run skill:check` passes with 38 agents detected
- `bun run validate` passes with new agents validated
- recursive-orchestrator agent has valid frontmatter
- Layers 16, 17, 19 exist as individual prompt files

---

### P1 — Commands and Agents (implement second, builds on P0)

**Timeline:** 1-2 sessions (4-8 hours)
**Dependencies:** P0 complete

| # | Task | Files | Effort |
|---|------|-------|--------|
| 11 | Create /recursive-refine command | `.claude/commands/recursive-refine.md` | 150 lines |
| 12 | Create /autoloop command | `.claude/commands/autoloop.md` | 250 lines |
| 13 | Create gap-analyzer agent | `agents/gap-analyzer.md` | 150 lines |
| 14 | Create ecosystem-scanner agent | `agents/ecosystem-scanner.md` | 130 lines |
| 15 | Formalize Layer 18 (RecSumm) as standalone prompt file | `prompts/18-recursive-summarization.md` | 100 lines (extract) |
| 16 | Formalize Layer 20 (PEER) as standalone prompt file | `prompts/20-peer.md` | 130 lines (extract) |
| 17 | Formalize Layer 21 (PromptEvo) as standalone prompt file | `prompts/21-prompt-evolution.md` | 120 lines (extract) |
| 18 | Update CLAUDE.md command list (13 -> 15 commands) | `CLAUDE.md` (modify) | +15 lines |
| 19 | Update CLAUDE.md agent count (35 -> 38) | `CLAUDE.md` (modify) | +5 lines |
| 20 | Update CLAUDE.md prompt layer description | `CLAUDE.md` (modify) | +10 lines |

**Validation:**
- All 15 commands listed in CLAUDE.md
- All 38 agents pass frontmatter validation
- /recursive-refine produces REFINE-LOG on test artifact
- /autoloop produces GAP-ANALYSIS + AUTOLOOP-REPORT on test target

---

### P2 — Integration (implement third, wires RLM into existing commands)

**Timeline:** 1-2 sessions (4-8 hours)
**Dependencies:** P1 complete

| # | Task | Files | Effort |
|---|------|-------|--------|
| 21 | Add Phase 2b (recursive plan enhancement) to /omni-plan-nth | `.claude/commands/omni-plan-nth.md` (modify) | +40 lines |
| 22 | Add Phase 3 RecDecomp/SelfRefine to /omni-plan-nth | `.claude/commands/omni-plan-nth.md` (modify) | +30 lines |
| 23 | Add Phase 4 RecVerify to /omni-plan-nth | `.claude/commands/omni-plan-nth.md` (modify) | +25 lines |
| 24 | Add Phase 4b (recursive treatment) to /auto-swarm-nth | `.claude/commands/auto-swarm-nth.md` (modify) | +35 lines |
| 25 | Update density-summarizer to support RecSumm (L18) mode | `agents/density-summarizer.md` (modify) | +60 lines |
| 26 | Update dynamic-planner to use PEER (L20) | `agents/dynamic-planner.md` (modify) | +40 lines |
| 27 | Update verification-gate to use RecVerify L2/L3 | `agents/verification-gate.md` (modify) | +50 lines |
| 28 | Update metaclaw-learner to track recursion patterns | `agents/metaclaw-learner.md` (modify) | +30 lines |
| 29 | Update decision-loop to compose with PEER | `agents/decision-loop.md` (modify) | +20 lines |
| 30 | Update application matrix in PROMPT-COMPOSITION.md | `templates/PROMPT-COMPOSITION.md` (modify) | +15 lines |
| 31 | Create COST-LOG template | `templates/COST-LOG-TEMPLATE.md` | 30 lines |
| 32 | Update prompts/README.md with layers 16-21 | `prompts/README.md` (modify) | +30 lines |
| 33 | Add RLM section to ARCHITECTURE.md | `ARCHITECTURE.md` (modify) | +80 lines |
| 34 | Update VERSION to 6.0.0 | `VERSION` (modify) | 1 line |
| 35 | Update CHANGELOG.md with RLM release notes | `CHANGELOG.md` (modify) | +40 lines |

**Validation:**
- /omni-plan-nth with RLM on a test codebase produces RECURSION-STATE.md and RECURSION-DEPTH-*.md files
- /auto-swarm-nth handles NEEDS-RECURSIVE-TREATMENT flags
- convergence-monitor produces depth convergence analysis when mode="depth"
- density-summarizer produces hierarchical RecSumm output when source_count > 3
- Full test suite passes: `bun run test`
- Skill check passes: `bun run skill:check` shows 15 commands, 38 agents

---

### Implementation Dependency Graph

```
P0-1 (recursive-orchestrator) ──┐
P0-2 (RECURSION-STATE template) ┤
P0-3 (RECURSION-DEPTH template) ┤
P0-4 (L16 prompt file) ─────────┤
P0-5 (L17 prompt file) ─────────┼── P0 Foundation
P0-6 (L19 prompt file) ─────────┤
P0-7 (convergence-monitor mod)  ┤
P0-8 (convergence-detection mod)┤
P0-9 (PROMPT-COMPOSITION mod)   ┤
P0-10 (ARCHITECTURE mod) ───────┘
                                 │
                                 v
P1-11 (/recursive-refine) ──────┐
P1-12 (/autoloop) ──────────────┤
P1-13 (gap-analyzer) ───────────┤
P1-14 (ecosystem-scanner) ──────┼── P1 Commands & Agents
P1-15 (L18 prompt file) ────────┤
P1-16 (L20 prompt file) ────────┤
P1-17 (L21 prompt file) ────────┤
P1-18-20 (CLAUDE.md updates) ───┘
                                 │
                                 v
P2-21-23 (/omni-plan-nth mod) ──┐
P2-24 (/auto-swarm-nth mod) ────┤
P2-25-29 (agent modifications) ─┼── P2 Integration
P2-30-33 (doc updates) ─────────┤
P2-34-35 (version + changelog) ─┘
```

### Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Depth-3 limit makes serialized recursion unreliable | Medium | High | File-based continuation (Workaround 2 in 6.1) as fallback |
| Self-bias in SelfRefine produces inflated quality claims | High | Medium | Forced weakness rule + regression guard (6.2) |
| Context explosion in deep recursion crashes agent | Medium | High | Depth-proportional context budgets (6.3) + early flush pattern |
| Cost overrun from recursive patterns | High | Medium | Per-depth token caps + user confirmation gates (6.4) |
| RECURSIVE-PATTERNS.md already documents L16-L21 but in single file | Low | Low | P0 extracts into individual files, keeping RECURSIVE-PATTERNS.md as the reference |
| ECC security hook blocks writes to recursion state files | Medium | High | Disable ECC hook before RLM implementation session (documented blocker) |
| ecosystem-scanner reads too much from ~/repos/ and blows context | Medium | Medium | Hard cap: 5 repos, 20 files/repo, 2-minute timeout |
| gap-analyzer produces too many gaps, causing recursive explosion | Medium | Medium | Max 10 gaps per analysis, top 3 selected for treatment per iteration |

### Success Metrics

| Metric | Baseline (no RLM) | Target (with RLM) | Measurement |
|--------|-------------------|-------------------|-------------|
| Single-pass quality (score after 1 iteration) | 4-5/10 | 6-7/10 | llm-judge score |
| Iterations to 8/10 | 4-5 iterations | 2-3 iterations | convergence-monitor log |
| Context retention at iteration 5+ | Significant degradation | <10% information loss | RecSumm coherence tracking |
| Fix verification reliability | L1 only (~60% catch rate) | L1-L3 (~90% catch rate) | RecVerify false-negative rate |
| Wasted iterations (no improvement) | 1-2 per run | 0-1 per run | PIVOT count in decision-loop |
| Plan accuracy (steps that need replanning) | 40-60% need adjustment | 20-30% need adjustment | PEER replan count |

---

## Appendix A: Full File Manifest

### New Files (15)

| File | Lines (est.) | Category |
|------|-------------|----------|
| `agents/recursive-orchestrator.md` | 200 | Agent |
| `agents/gap-analyzer.md` | 150 | Agent |
| `agents/ecosystem-scanner.md` | 130 | Agent |
| `.claude/commands/recursive-refine.md` | 150 | Command |
| `.claude/commands/autoloop.md` | 250 | Command |
| `prompts/16-recursive-decomposition.md` | 80 | Prompt Layer |
| `prompts/17-self-refine.md` | 100 | Prompt Layer |
| `prompts/18-recursive-summarization.md` | 100 | Prompt Layer |
| `prompts/19-recursive-verification.md` | 120 | Prompt Layer |
| `prompts/20-peer.md` | 130 | Prompt Layer |
| `prompts/21-prompt-evolution.md` | 120 | Prompt Layer |
| `templates/RECURSION-STATE-TEMPLATE.md` | 50 | Template |
| `templates/RECURSION-DEPTH-TEMPLATE.md` | 40 | Template |
| `templates/COST-LOG-TEMPLATE.md` | 30 | Template |
| `docs/RLM-INTEGRATION-SPEC.md` | 800+ | Documentation |

### Modified Files (14)

| File | Change | Lines Added (est.) |
|------|--------|-------------------|
| `agents/convergence-monitor.md` | Algorithm 7 | +40 |
| `agents/density-summarizer.md` | RecSumm mode | +60 |
| `agents/dynamic-planner.md` | PEER reference | +40 |
| `agents/verification-gate.md` | RecVerify L2/L3 | +50 |
| `agents/metaclaw-learner.md` | Recursion patterns | +30 |
| `agents/decision-loop.md` | PEER composition | +20 |
| `.claude/commands/omni-plan-nth.md` | Phases 2b, 3 mod, 4 mod | +95 |
| `.claude/commands/auto-swarm-nth.md` | Phase 4b | +35 |
| `algorithms/convergence-detection.md` | Algorithm 7 | +60 |
| `templates/PROMPT-COMPOSITION.md` | Extended matrix + function | +45 |
| `prompts/README.md` | Layers 16-21 index | +30 |
| `CLAUDE.md` | Commands, agents, layers | +30 |
| `ARCHITECTURE.md` | RLM section + status | +100 |
| `CHANGELOG.md` | v6.0.0 release notes | +40 |

### Total Impact
- New files: 15
- Modified files: 14
- Estimated new lines: ~2,870
- Version bump: 5.1.0 -> 6.0.0

---

## Appendix B: Research References

| Pattern | Paper | Year | Key Finding |
|---------|-------|------|-------------|
| Recursive LLMs | Zhang et al. (MIT) | 2025 | Handle prompts 100x longer via recursive sub-invocation |
| ReCAP | Li et al. | 2025 | Recursive context-aware reasoning improves planning |
| Self-Refine | Madaan et al. | 2023 | +20% human preference via self-critique loops |
| Promptbreeder | Fernando et al. | 2023 | Self-referential mutation of task + mutation prompts |
| Chain-of-Verification | Dhuliawala et al. | 2023 | Multi-level verification reduces hallucination ~60% |
| Chain of Density | Adams et al. | 2023 | 3x compression with entity-dense summaries |
| Plan-and-Act | Wang et al. | 2025 | Adaptive replanning for long-horizon tasks |
| Recursive Introspection | NeurIPS | 2024 | Teaching LLMs to self-improve through recursion |
| Self-Verification | Weng et al. | 2023 | Verification prompting improves reasoning accuracy |
| EmotionPrompt | Li et al. | 2023 | +8-15% accuracy from emotional stakes calibration |

---

*This specification was synthesized from ProductionOS 5.1.0 (commit 6c522ef), including CLAUDE.md, ARCHITECTURE.md, all 13 command definitions, all 37 agent definitions, RECURSIVE-PATTERNS.md (Layers 16-21), convergence-detection.md (6 algorithms), PROMPT-COMPOSITION.md (9-layer stack + extended matrix), INVOCATION-PROTOCOL.md, PREAMBLE.md, and project memory files documenting the evolution from ProductionOS V2.1 through V4.0 to ProductionOS 5.1.0.*
