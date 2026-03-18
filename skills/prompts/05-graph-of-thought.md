---
name: graph-of-thought
description: "Graph of Thought layer for ProductUpgrade pipeline. Connects findings into a causal network with 5 edge types, cycle detection for systemic issues, merge operations for overlapping findings, graph scoring, and aggregation protocol. Surfaces emergent risks invisible to individual analysis. Layer 5 of 7."
---

# Graph of Thought (GoT) — Layer 5 of 7

## Research Foundation

1. **Graph of Thoughts (Besta et al., 2024, AAAI)** — Models LLM reasoning as arbitrary graphs, not just chains or trees. Improved sorting quality by 62% over ToT while reducing costs by 31%. Key innovation: thoughts can merge, split, and form cycles.

2. **Knowledge Graph Theory** — Findings connected by typed edges form a queryable knowledge structure. Edge types (CAUSES, BLOCKS, AMPLIFIES) enable causal reasoning about the codebase.

3. **Systems Thinking (Meadows, 2008)** — Complex systems exhibit emergent behavior that cannot be understood by analyzing components in isolation. GoT captures the RELATIONSHIPS between findings, revealing system-level risks.

## Core Principle

Individual findings are necessary but insufficient for understanding codebase quality. A codebase with 20 isolated P2 findings is different from a codebase with 20 P2 findings that form 3 causal chains. GoT transforms a flat list of findings into a connected graph that reveals:

- **Causal chains**: A causes B causes C (fix A and B+C may resolve)
- **Blocking dependencies**: Fix B is impossible until A is fixed
- **Amplification loops**: A makes B worse, B makes C worse
- **Systemic cycles**: A causes B causes C causes A (unfixable at node level)
- **Compound risks**: 3 low-severity findings that together create a high-severity risk

---

## Edge Type Definitions

### CAUSES (Directed)
```
DEFINITION: Finding A directly creates the conditions for Finding B to exist.
  If A is fixed, B may disappear or become less severe.

EVIDENCE STANDARD:
  - Show the code path where A's behavior produces B's input
  - Demonstrate that A's fix would change B's conditions

NOTATION: FIND-A --CAUSES--> FIND-B

EXAMPLES:
  - Missing input validation (A) CAUSES SQL injection (B)
  - No rate limiting (A) CAUSES brute force vulnerability (B)
  - N+1 query pattern (A) CAUSES slow page load (B)
  - Missing error handling (A) CAUSES silent data corruption (B)

WEIGHT: The probability that fixing A resolves B
  HIGH (0.8-1.0): Direct causation, fixing A eliminates B
  MEDIUM (0.5-0.8): Contributing cause, fixing A reduces B
  LOW (0.2-0.5): Indirect cause, fixing A may or may not affect B
```

### BLOCKS (Directed)
```
DEFINITION: Finding A must be fixed before Finding B can be fixed.
  B's fix depends on infrastructure, API, or state that A's fix provides.

EVIDENCE STANDARD:
  - Show that B's proposed fix requires functionality that A currently lacks
  - Demonstrate that attempting B's fix without fixing A would fail or regress

NOTATION: FIND-A --BLOCKS--> FIND-B

EXAMPLES:
  - Missing database migration framework (A) BLOCKS schema optimization (B)
  - Missing CI pipeline (A) BLOCKS test coverage requirements (B)
  - Broken auth middleware (A) BLOCKS API authorization audit (B)
  - Missing TypeScript config (A) BLOCKS type safety enforcement (B)

WEIGHT: Always HIGH — blocking is binary
```

### AMPLIFIES (Directed)
```
DEFINITION: Finding A makes Finding B worse than it would be in isolation.
  B exists independently, but A increases its severity.

EVIDENCE STANDARD:
  - Show B exists independently of A
  - Demonstrate that A's presence increases B's impact/likelihood

NOTATION: FIND-A --AMPLIFIES--> FIND-B

EXAMPLES:
  - Missing logging (A) AMPLIFIES debugging difficulty (B)
  - No input validation (A) AMPLIFIES XSS risk in output rendering (B)
  - Missing test coverage (A) AMPLIFIES regression risk from refactor (B)
  - No rate limiting (A) AMPLIFIES cost of N+1 queries under load (B)

WEIGHT: The multiplier A adds to B's severity
  HIGH (2x+): A dramatically worsens B
  MEDIUM (1.5x): A noticeably worsens B
  LOW (1.2x): A slightly worsens B
```

### RELATED_TO (Undirected)
```
DEFINITION: Findings A and B are connected but neither causes, blocks,
  or amplifies the other. They share context, code location, or theme.

EVIDENCE STANDARD:
  - Show shared code path, module, or architectural decision
  - Demonstrate thematic connection (both relate to same design decision)

NOTATION: FIND-A --RELATED_TO-- FIND-B

EXAMPLES:
  - Missing CORS config (A) RELATED_TO missing CSP headers (B) — both are HTTP security
  - Inconsistent naming in models (A) RELATED_TO inconsistent naming in API (B) — same root convention gap
  - Unused dependency (A) RELATED_TO outdated dependency (B) — both are supply chain

WEIGHT: Not applicable — used for grouping, not causal reasoning
```

### CONTRADICTS (Undirected)
```
DEFINITION: The recommended fix for Finding A conflicts with the
  recommended fix for Finding B. Both cannot be applied simultaneously.

EVIDENCE STANDARD:
  - Show that Fix-A and Fix-B modify the same code in incompatible ways
  - Or show that Fix-A's design direction is opposite to Fix-B's

NOTATION: FIND-A --CONTRADICTS-- FIND-B

EXAMPLES:
  - "Add caching for performance" (A) CONTRADICTS "Always query fresh data for consistency" (B)
  - "Extract to microservice for isolation" (A) CONTRADICTS "Consolidate for simplicity" (B)
  - "Add strict typing" (A) CONTRADICTS "Support dynamic plugin interface" (B)

RESOLUTION PROTOCOL:
  1. Identify the shared constraint
  2. Evaluate which finding has higher composite score
  3. If scores are close: escalate to /plan mode for architectural decision
  4. Document the trade-off in the graph
```

---

## Graph Construction Protocol

### Step 1: Node Registration
```
For each finding from CoT/ToT, create a node:

NODE FORMAT:
  {
    "id": "FIND-{agent}-{N}",
    "title": "{one-line summary}",
    "dimension": "{quality dimension}",
    "severity": "P0|P1|P2|P3",
    "confidence": 0.0-1.0,
    "file": "{primary file:line}",
    "fix_complexity": "S|M|L|XL"
  }
```

### Step 2: Edge Discovery
```
For EACH pair of findings in your evaluation, check:

EDGE DISCOVERY CHECKLIST:
  □ Does A's code produce input consumed by B's code? → CAUSES
  □ Does fixing B require fixing A first? → BLOCKS
  □ Does A's existence make B's impact worse? → AMPLIFIES
  □ Are A and B in the same module/function/flow? → RELATED_TO
  □ Do A's fix and B's fix conflict? → CONTRADICTS

NOTE: Not every pair has edges. Most pairs are unconnected.
Only create edges with evidence. Forced connections are worse than no connections.

EFFICIENCY: For N findings, there are N*(N-1)/2 possible pairs.
  If N > 20: Use SAMPLED edge discovery (check all P0/P1 pairs + random 30% of P2/P3)
  If N <= 20: Check all pairs
```

### Step 3: Cycle Detection
```
After all edges are created, scan for cycles:

CYCLE DETECTION ALGORITHM:
  1. Start from each node with CAUSES or AMPLIFIES outgoing edges
  2. Follow CAUSES chains: A → B → C → ...
  3. If you return to a previously visited node: CYCLE DETECTED

CYCLE INTERPRETATION:
  - CAUSES cycle (A causes B causes A): SYSTEMIC ISSUE
    The problem cannot be resolved by fixing any single node.
    Requires architectural intervention that breaks the cycle.
    → Flag as: "SYSTEMIC: Circular dependency requiring /plan mode"

  - AMPLIFIES cycle (A amplifies B amplifies A): FEEDBACK LOOP
    The problems reinforce each other, making both progressively worse.
    → Flag as: "FEEDBACK LOOP: Fix the node with highest actionability first"

  - Mixed cycle: Combine interpretations

CYCLE SEVERITY: Always P1 or higher, regardless of individual node severities.
  Three P3 nodes in a cycle = P1 systemic issue.
```

### Step 4: Cluster Detection
```
GROUP findings into clusters based on connectivity:

CLUSTER DEFINITION: A group of 3+ findings connected by any edge type.

CLUSTER ANALYSIS:
  1. Identify the cluster's CENTER (node with most edges)
  2. Identify the cluster's THEME (shared dimension or code area)
  3. Assess cluster SEVERITY (highest node severity + cycle bonus)
  4. Recommend cluster FIX ORDER:
     - Fix BLOCKING nodes first (unblocks others)
     - Fix CAUSES root nodes second (may resolve children)
     - Fix remaining nodes third

CLUSTER REPORTING:
  "CLUSTER: {theme} ({N} findings, {M} edges)
   Center: FIND-{id}
   Fix order: FIND-{a} → FIND-{b} → FIND-{c}
   Estimated effort: {sum of complexities}
   Cluster severity: {severity}"
```

---

## Graph Scoring

The graph itself has a quality score that reflects the codebase's systemic health:

```
GRAPH HEALTH METRICS:

1. CONNECTEDNESS = edges / nodes
   - < 0.5: Findings are mostly isolated (good — no systemic issues)
   - 0.5-1.5: Moderate connections (some patterns, manageable)
   - 1.5-3.0: High connectivity (systemic issues likely)
   - > 3.0: Densely connected (fundamental architectural problems)

2. CYCLE_COUNT = number of detected cycles
   - 0: No circular dependencies (ideal)
   - 1-2: Isolated systemic issues (addressable)
   - 3+: Structural problems (requires architectural review)

3. MAX_CHAIN_LENGTH = longest CAUSES chain
   - 1-2: Short chains, isolated issues
   - 3-4: Moderate chains, some cascading risk
   - 5+: Deep dependency chains, high cascade risk

4. CONTRADICTION_COUNT = number of CONTRADICTS edges
   - 0: No conflicting recommendations
   - 1-2: Minor trade-offs (normal)
   - 3+: Fundamental design tensions (requires /plan mode)

GRAPH HEALTH SCORE = 10 - (connectedness * 1.5) - (cycle_count * 2) - (max_chain * 0.5) - (contradictions * 1)
  Capped to [1, 10]

INTERPRETATION:
  8-10: Clean graph, mostly isolated findings
  5-7: Some systemic patterns, manageable
  3-4: Significant systemic issues
  1-2: Fundamental architectural problems
```

---

## Merge Operations

When findings from multiple agents overlap, GoT merges them:

```
MERGE PROTOCOL:

DETECTION: Two findings are merge candidates if:
  - They reference the same file:line (exact overlap)
  - They reference the same function/class with similar descriptions
  - They have identical root causes (from CoT Step 2)

MERGE RULES:
  1. Keep the finding with MORE evidence citations
  2. Combine evidence from both (deduplicate)
  3. Use the HIGHER severity
  4. Average the confidence scores (multi-source = higher trust)
  5. Credit both source agents in the merged node
  6. Preserve all edges from both original nodes

MERGE OUTPUT:
  "MERGED: FIND-{a} + FIND-{b} → FIND-{merged-id}
   Sources: Agent-{x}, Agent-{y}
   Evidence: {combined citations}
   Severity: {higher of the two}
   Confidence: {average, boosted by multi-source}"

ANTI-MERGE: Do NOT merge findings that:
  - Have different root causes (same symptom, different diseases)
  - Are in different dimensions (security issue vs performance issue)
  - Have contradicting fix recommendations
```

---

## Cross-Agent Graph Aggregation

The thought-graph-builder agent aggregates graphs from multiple evaluation agents:

```
AGGREGATION PROTOCOL:

1. COLLECT individual agent graphs
2. NORMALIZE node IDs to global namespace: FIND-{agent}-{N}
3. MERGE overlapping nodes (same file:line, similar description)
4. DISCOVER CROSS-AGENT EDGES:
   - Does Agent A's finding CAUSE Agent B's finding?
   - Does Agent A's finding BLOCK Agent B's fix?
   - Does Agent A's finding AMPLIFY Agent B's finding?
5. DETECT CROSS-AGENT CYCLES (most valuable discovery)
   Example: Security agent finds "no rate limiting" → Performance agent
   finds "N+1 queries" → combined = "rate limiting gap + N+1 = DDoS via
   expensive queries" — a compound vulnerability neither agent found alone.
6. PRODUCE unified graph with all nodes, edges, clusters, and cycles

CROSS-AGENT EDGES are flagged as:
  "CROSS-AGENT DISCOVERY: {edge description}
   Source agents: {A}, {B}
   Combined severity: {escalated if compound risk}"
```

---

## Composition Interface

This layer is applied SEVENTH, after Tree of Thought. It connects individual findings into a relational structure.

```
COMPOSITION ORDER:
  1. Emotion Prompting → sets stakes
  2. Meta-Prompting → forces reflection
  3. Context Retrieval → provides history
  4. (Agent-specific role instructions)
  5. Chain of Thought → structures reasoning
  6. Tree of Thought → enables exploration
  7. [THIS] Graph of Thought → enables connection
  8. Chain of Density → structures output
```

Input from previous layers:
- All findings with CoT 5-step chains
- ToT branch selections and scores
- Previous iteration's graph (for delta analysis)

Output:
- Node registry (all findings as nodes)
- Edge registry (all connections with evidence)
- Cycle report (systemic issues)
- Cluster report (grouped findings)
- Graph health score (1-10)
- Cross-reference discoveries
- Merge report (deduplicated findings)

## Anti-Patterns

1. **Never force edges.** If two findings aren't connected, they aren't connected. Forced edges create false systemic narratives.
2. **Never skip cycle detection.** Cycles are the most valuable GoT discovery. A cycle of P3s is more important than an isolated P1.
3. **Never merge findings with different root causes.** Same symptom ≠ same finding.
4. **Never ignore CONTRADICTS edges.** Contradictions reveal design tensions that must be resolved explicitly.
5. **Never build the graph from memory.** Re-read the actual findings. Memory-based graph construction introduces phantom edges.
6. **Never report graph health score without evidence.** The score is computed from metrics, not estimated.
