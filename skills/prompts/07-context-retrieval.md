---
name: context-retrieval
description: "Context Retrieval layer for ProductUpgrade pipeline. RAG-in-pipeline protocol for pulling relevant context from 5 sources (file artifacts, reflexion memory, thought graphs, library docs via context7, session memory via mem-search) with staleness detection, conflict resolution, and compaction management. Layer 7 of 7."
---

# Context Retrieval — Layer 7 of 7

## Research Foundation

1. **Retrieval-Augmented Generation (Lewis et al., 2020)** — Combining parametric knowledge (model weights) with non-parametric knowledge (retrieved documents) produces more accurate, more grounded outputs. ProductUpgrade applies RAG WITHIN the pipeline itself.

2. **Reflexion (Shinn et al., 2023, NeurIPS)** — Language agents that reflect on task feedback and maintain reflective text in episodic memory achieve 91% pass@1 on HumanEval, surpassing GPT-4's 80%. ProductUpgrade uses reflexion memory to prevent repeating failed strategies.

3. **Context Engineering (Anthropic, 2024-2025)** — The quality of LLM output is bounded by the quality of its context. Carefully curated, relevant context outperforms brute-force context stuffing. ProductUpgrade retrieves SPECIFIC context for EACH phase rather than dumping everything.

## Core Principle

Without context retrieval, every ProductUpgrade iteration starts from scratch. With it, each iteration builds on everything that came before — what was found, what worked, what failed, and what the current trajectory looks like. Context retrieval is the MEMORY SYSTEM of the pipeline.

The key insight: not all context is equally valuable. Retrieving too much context wastes tokens and dilutes attention. Retrieving too little loses critical learnings. The protocol prioritizes by source reliability and phase relevance.

---

## The 5 Context Sources (Priority Order)

### Source 1: File Artifacts (Fastest, Most Reliable)

```
<context_source_1>
FILE ARTIFACTS — Direct reads from pipeline output files.

Priority: HIGHEST — these are ground truth from previous iterations.
Latency: Instant (local file read)
Reliability: VERY HIGH (written by the pipeline itself)

FILES TO RETRIEVE:
  .productupgrade/ITERATIONS/ITERATION-{N-1}-SUMMARY.md
    → Latest Chain of Density summary
    → Contains: all findings, evidence, fix instructions, density metrics
    → CRITICAL for: knowing what was already found/fixed

  .productupgrade/REFLEXION-MEMORY.md
    → Append-only log of what worked and what failed
    → Contains: strategy outcomes, false positive patterns, effective approaches
    → CRITICAL for: avoiding repeated mistakes

  .productupgrade/CONVERGENCE-LOG.md
    → Grade trajectory across all iterations
    → Contains: per-dimension scores, deltas, verdicts
    → CRITICAL for: knowing the improvement trajectory

  .productupgrade/THOUGHT-GRAPHS/THOUGHT-GRAPH-{N-1}.md
    → Finding relationship network from last iteration
    → Contains: nodes (findings), edges (connections), cycles (systemic issues)
    → CRITICAL for: understanding systemic patterns

  .productupgrade/EXECUTION/UPGRADE-PLAN.md
    → Current fix plan with priorities and batch sequencing
    → Contains: P0/P1/P2/P3 breakdown, effort estimates, dependencies
    → CRITICAL for: knowing what's been planned vs executed

  .productupgrade/LEARNING/DECISION-WEIGHTS.md
    → Agent effectiveness tracking
    → Contains: which agents found real issues, false positive rates
    → CRITICAL for: auto mode agent selection optimization

  .productupgrade/TOOLCHAIN.md
    → Detected build/test/lint commands
    → Contains: project-specific validation commands
    → CRITICAL for: running correct validation gates

RETRIEVAL PROTOCOL:
  1. Check if file exists (Glob)
  2. If exists: Read and inject into agent context
  3. If not exists: Note "No previous context for {source}" and proceed
  4. If file is empty: Note "Empty context for {source}" and proceed

STALENESS DETECTION:
  - Check file modification timestamp vs current iteration start
  - If file is from > 2 iterations ago: flag as STALE
  - Stale context is still useful but should be weighted lower
  - Never treat stale context as current truth
```

### Source 2: Session Memory (/mem-search)

```
<context_source_2>
SESSION MEMORY — Cross-session learnings from the memory MCP.

Priority: HIGH — captures patterns from prior sessions on this codebase.
Latency: Medium (MCP query)
Reliability: HIGH (human-validated observations from past sessions)

QUERIES TO EXECUTE:
  search(query="{project_name} patterns improvements", limit=10)
  search(query="{tech_stack} common issues best practices", limit=10)
  search(query="{project_name} bugs fixes regressions", limit=5)

WHAT TO EXTRACT:
  - Patterns previously discovered in this codebase
  - Fixes that worked in past sessions
  - Known architectural decisions and their rationale
  - Previous evaluation scores for comparison
  - Known technical debt documented in prior reviews

INJECTION FORMAT:
  "SESSION MEMORY CONTEXT:
   Prior sessions found these patterns in this codebase:
   - {pattern_1}: {description}
   - {pattern_2}: {description}
   Prior session scores: {dimension}: {score} (session date)
   Known technical debt: {items from prior reviews}"

FRESHNESS RULES:
  - Observations < 7 days old: HIGH relevance
  - Observations 7-30 days old: MEDIUM relevance (code may have changed)
  - Observations > 30 days old: LOW relevance (verify against current code)
  - Always note observation dates when injecting
```

### Source 3: Library Documentation (context7 MCP)

```
<context_source_3>
LIBRARY DOCS — Live documentation for project dependencies.

Priority: HIGH (for code quality/security dimensions)
Latency: Medium (MCP query)
Reliability: HIGH (official library documentation)

WHEN TO QUERY:
  - Reviewing code that uses a library API
  - Checking if an API pattern is current or deprecated
  - Verifying configuration options are valid
  - Checking for known security issues in specific versions

QUERY PROTOCOL:
  1. resolve-library-id("{library-name}")
     → Get the canonical library identifier

  2. query-docs(library_id="{id}", topic="{specific_api_or_pattern}")
     → Get current documentation for the specific API

WHAT TO CHECK:
  - Is the API call using the current signature? (methods get renamed)
  - Is the configuration option still supported? (options get deprecated)
  - Is there a known security advisory? (CVEs for specific versions)
  - Is there a recommended migration path? (v1 → v2 changes)

INJECTION FORMAT:
  "LIBRARY CONTEXT for {library}@{version}:
   Current API: {method_signature}
   Codebase uses: {actual_usage}
   Status: CURRENT | DEPRECATED | VULNERABLE
   If deprecated: Migration path: {steps}"

EFFICIENCY:
  - Only query for libraries you're UNCERTAIN about
  - Don't query for standard library or language builtins
  - Cache results within the iteration (same library = same docs)
  - Maximum 10 library queries per agent per iteration
```

### Source 4: Reflexion Memory (Specialized)

```
<context_source_4>
REFLEXION MEMORY — The most critical source for preventing repeated failures.

Priority: CRITICAL (for FIX phase)
Latency: Instant (local file read)
Reliability: VERY HIGH (explicitly captured learnings)

FILE: .productupgrade/REFLEXION-MEMORY.md

FORMAT:
  Each entry follows:
  ```
  Iteration {N}, Fix {id}:
    Attempted: {strategy description}
    Outcome: {success | partial | failed}
    What worked: {specific effective approach}
    What failed: {specific ineffective approach}
    Key learning: {actionable insight for future iterations}
  ```

INJECTION RULES:
  - ALWAYS inject before FIX phase
  - For each planned fix, check if a similar fix was attempted before
  - If previous attempt FAILED: inject "DO NOT repeat: {failed_strategy}"
  - If previous attempt SUCCEEDED: inject "BUILD ON: {successful_strategy}"
  - If no previous attempt: proceed normally

ANTI-PATTERNS IN REFLEXION:
  - "Everything worked fine" — Too vague. Specific mechanisms only.
  - "The agent did a bad job" — Not actionable. What specifically failed?
  - "Need to try harder" — Not a learning. What should change?

GOOD REFLEXION ENTRIES:
  - "Adding try/catch without logging the error caused silent failures.
     Key learning: every catch block MUST log with structured context."
  - "Refactoring the component before fixing the logic bug caused regressions.
     Key learning: fix the bug FIRST, refactor SECOND."
  - "Using jest.mock for the database made tests pass but missed the real
     ORM issue. Key learning: use integration tests with test DB for data layer."
```

### Source 5: Previous Iteration Thought Graph

```
<context_source_5>
THOUGHT GRAPH — Finding relationship network from the previous iteration.

Priority: MEDIUM-HIGH (for EVALUATE and CONVERGE phases)
Latency: Instant (local file read)
Reliability: HIGH (structured graph from GoT layer)

FILE: .productupgrade/THOUGHT-GRAPHS/THOUGHT-GRAPH-{N-1}.md

WHAT TO EXTRACT:
  - Clusters: Groups of related findings (are they resolved?)
  - Cycles: Systemic issues (were they addressed architecturally?)
  - Blocking chains: Dependencies (were blockers removed?)
  - High-degree nodes: Findings with many connections (central issues)

INJECTION FORMAT:
  "PREVIOUS GRAPH CONTEXT:
   Clusters from iteration {N-1}:
   - {cluster_theme}: {resolved | partially_resolved | unresolved}
   Cycles from iteration {N-1}:
   - {cycle_description}: {broken | still_present}
   Blocking chains:
   - {blocker}: {removed | still_blocking}"

DELTA ANALYSIS:
  Compare current graph to previous graph:
  - New nodes: Findings discovered this iteration
  - Removed nodes: Findings resolved by fixes
  - New edges: New relationships discovered
  - Removed edges: Dependencies resolved
  - Changed clusters: How the systemic picture evolved
```

---

## Phase-Specific Context Injection

Different pipeline phases need different context:

```
BEFORE UNDERSTAND PHASE:
  Inject: Session memory (what we learned before)
          Previous iteration summary (what was found last time)
          Convergence log (score trajectory)
  Purpose: Ground new research in prior knowledge

BEFORE ENRICH PHASE:
  Inject: Discovery findings (what was just found)
          Thought graph (finding connections)
          Competitor data (if available from prior iteration)
  Purpose: Inform strategic review with current data

BEFORE EVALUATE PHASE:
  Inject: Score trajectory (for delta computation)
          Previous dimension scores (for degradation detection)
          Meta persona feedback (for blind spot awareness)
  Purpose: Calibrate evaluation against history

BEFORE FIX PHASE:
  Inject: REFLEXION MEMORY (CRITICAL — what worked/failed before)
          Upgrade plan (what to fix and in what order)
          Adversarial feedback (what attacks to preempt)
          Blocking dependencies (what must be fixed first)
  Purpose: Prevent repeating failed strategies

BEFORE VERIFY PHASE:
  Inject: What was changed (from upgrade log)
          What regressions to watch (from adversarial review)
          Before-scores (for comparison)
  Purpose: Focused verification on actual changes

BEFORE CONVERGE PHASE:
  Inject: Full convergence log (grade trajectory)
          All dimension scores (for delta computation)
          Reflexion memory (for learning capture)
          Graph health (for systemic assessment)
  Purpose: Accurate convergence decision
```

---

## Conflict Resolution Between Sources

When different sources provide contradictory information:

```
CONFLICT RESOLUTION PROTOCOL:

PRIORITY ORDER (higher wins):
  1. Current code (read it yourself) — ALWAYS WINS
  2. File artifacts from current iteration
  3. File artifacts from previous iteration
  4. Library documentation (context7)
  5. Session memory (/mem-search)

CONFLICT TYPES:

TYPE 1 — Source says "fixed" but code still has issue:
  Trust the CODE. The source is stale.
  Update the source to reflect reality.

TYPE 2 — Memory says "pattern X works here" but library docs say "X is deprecated":
  Trust LIBRARY DOCS. Memory is outdated.
  Note: "Prior session pattern X is now deprecated per {library} docs."

TYPE 3 — Two file artifacts disagree:
  Trust the MORE RECENT artifact.
  If same timestamp: trust the artifact with more evidence.

TYPE 4 — Reflexion says "strategy A failed" but current analysis suggests it should work:
  INVESTIGATE. Re-read the reflexion entry's context.
  If the context was different: strategy A may work NOW.
  If the context is the same: DO NOT repeat strategy A.

RULE: When in doubt, READ THE CODE. Code is ground truth.
```

---

## Compaction Boundary Management

Context retrieval is responsible for making compaction safe:

```
PRE-COMPACTION PROTOCOL:
  1. Verify CoD Pass 3 is saved to file (MANDATORY)
  2. Verify reflexion memory is current (MANDATORY)
  3. Verify convergence log is updated (MANDATORY)
  4. Verify thought graph is saved (RECOMMENDED)
  5. Save checkpoint: .productupgrade/EXECUTION/CHECKPOINT-{iteration}-{timestamp}.md

POST-COMPACTION RECOVERY:
  1. Read CoD Pass 3 summary → establishes findings context
  2. Read reflexion memory → establishes what to avoid/repeat
  3. Read convergence log → establishes trajectory
  4. Read thought graph → establishes systemic patterns
  5. Resume evaluation with reconstructed context

QUALITY CHECK:
  After recovery, verify:
  - Can you list the top 5 findings? → If no, context is insufficient
  - Can you state the current grade? → If no, convergence log is missing
  - Can you name 2 failed strategies? → If no, reflexion memory is missing
  - Can you identify 1 systemic issue? → If no, thought graph is missing

  If any check fails: read additional artifacts until context is sufficient.
```

---

## Token Budget Management

```
CONTEXT INJECTION TOKEN BUDGETS:

Per phase injection: < 3000 tokens total across all sources
  File artifacts:    1500 tokens max
  Session memory:    500 tokens max
  Library docs:      500 tokens max
  Reflexion memory:  300 tokens max
  Graph context:     200 tokens max

IF total exceeds budget:
  1. Prioritize by source priority order
  2. Compress lower-priority sources to titles only
  3. If still over: omit Source 5 (graph), then Source 2 (session)
  4. NEVER omit: reflexion memory (Source 4) for FIX phase
  5. NEVER omit: convergence log for EVALUATE/CONVERGE phases

CONTEXT FRESHNESS DECAY:
  Current iteration artifacts: 100% weight
  Previous iteration artifacts: 80% weight
  2 iterations ago: 50% weight
  3+ iterations ago: 20% weight (titles only, verify before using)
```

---

## Composition Interface

Applied THIRD in the composition order, before agent-specific instructions. Provides historical context that grounds the evaluation.

```
COMPOSITION ORDER:
  1. Emotion Prompting → sets stakes
  2. Meta-Prompting → forces reflection
  3. [THIS] Context Retrieval → provides history
  4. (Agent-specific role instructions)
  5. Chain of Thought → structures reasoning
  6. Tree of Thought → enables exploration
  7. Graph of Thought → enables connection
  8. Chain of Density → structures output
```

Input from orchestrator:
- `iteration_number` (determines which artifacts to read)
- `phase` (determines which context sources to prioritize)
- `focus_dimensions` (filters context to relevant dimensions)
- `codebase_path` (for file artifact locations)
- `project_name` (for session memory queries)

Output injected into agent prompt:
- Phase-specific context block (formatted per phase template)
- Source attribution for each piece of context
- Staleness flags for old context
- Conflict notes (if any sources disagreed)

## Anti-Patterns

1. **Never inject ALL context for every phase.** Each phase needs different context. Injecting everything wastes tokens and dilutes attention.
2. **Never trust context over current code.** If context says "fixed" but the code still has the issue, the code wins.
3. **Never skip reflexion memory for FIX phase.** This is the single most important context source for preventing repeated failures.
4. **Never compact without saving context first.** Pre-compaction saves are mandatory. Post-compaction recovery depends on them.
5. **Never query context7 for every library.** Only for uncertain APIs. Standard library and builtins don't need verification.
6. **Never treat stale context as current.** Always check timestamps and iteration numbers. Context from 3+ iterations ago needs re-verification.
