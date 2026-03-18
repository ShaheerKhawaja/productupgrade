---
name: tree-of-thought
description: "Tree of Thought exploration layer for ProductUpgrade pipeline. Enables multi-branch reasoning with BFS/DFS strategies, branch scoring rubrics, backtracking triggers, pruning rules, and 5 worked examples. Surfaces systemic issues that linear reasoning misses. Layer 4 of 7."
---

# Tree of Thought (ToT) — Layer 4 of 7

## Research Foundation

1. **Tree of Thoughts (Yao et al., 2023, NeurIPS)** — Enables deliberate decision-making by exploring multiple reasoning paths, self-evaluating choices, and backtracking when necessary. Improved GPT-4's success on Game of 24 from 4% (CoT) to 74% (ToT).

2. **Search Algorithm Theory** — ToT maps naturally to classical search: BFS for comprehensive coverage, DFS for deep investigation, and beam search for resource-constrained exploration.

3. **Cognitive Dual-Process Theory (Kahneman, 2011)** — System 1 (fast, intuitive) corresponds to CoT's linear reasoning. System 2 (slow, deliberate) corresponds to ToT's branching exploration. Code evaluation benefits from System 2 when findings are ambiguous.

## Core Principle

Linear reasoning (Chain of Thought) follows a single path from observation to conclusion. This works well for clear-cut issues but fails for ambiguous findings where multiple interpretations are possible. Tree of Thought branches the reasoning into multiple parallel paths, scores each, and selects the best — or discovers that the problem is more complex than any single path suggests.

**When to use ToT:** Any time the CoT Step 2 (ANALYZE) produces uncertainty. If you're not sure whether an observation is a bug, a feature, or a design decision — branch.

---

## The Three Standard Branches

Every ToT exploration starts with three mandatory branches. Additional branches can be spawned if needed.

### Branch A — THE OBVIOUS (Surface Interpretation)

```
<tot_branch_a>
BRANCH A: THE OBVIOUS
Interpret this finding at face value. What does the code literally do wrong?

Reasoning path:
  1. What does the code do? (literal behavior)
  2. What should it do instead? (expected behavior)
  3. What is the gap? (specific deviation)
  4. Is this gap intentional or accidental?
  5. If accidental: what is the simplest fix?

Scoring criteria:
  - Accuracy: How confident are you that this interpretation is correct?
  - Impact: How much does this specific issue matter to users?
  - Actionability: How easy is the fix if this interpretation is correct?

This branch catches: Typos, logical errors, missing checks, wrong defaults,
copy-paste bugs, off-by-one errors, null pointer risks, type mismatches.

Strength: Direct, specific, actionable.
Weakness: May miss the bigger picture. May treat symptoms, not causes.
</tot_branch_a>
```

### Branch B — THE SYSTEMIC (Root Cause)

```
<tot_branch_b>
BRANCH B: THE SYSTEMIC
Look beyond the surface. What architectural or design decision created the
conditions for this issue to exist?

Reasoning path:
  1. Why does this code exist in this form? (origin analysis)
  2. Is this an isolated incident or part of a pattern? (pattern check)
     → Search for similar patterns in other files
     → Count occurrences: 1 = isolated, 3+ = systemic
  3. What design decision enabled this? (root cause)
     → Missing abstraction? Wrong abstraction? Unclear responsibility?
  4. If the root cause is fixed, how many symptoms disappear? (blast radius)
  5. What is the systemic fix? (architecture change, not patch)

Scoring criteria:
  - Accuracy: How confident are you that this is the actual root cause?
  - Impact: How many downstream issues does fixing this resolve?
  - Actionability: How feasible is the systemic fix? (higher effort but higher value)

This branch catches: Architectural anti-patterns, missing abstractions,
responsibility confusion, pattern inconsistencies, framework misuse.

Strength: Addresses root causes. One fix resolves multiple symptoms.
Weakness: Higher effort. May propose changes beyond the current scope.
</tot_branch_b>
```

### Branch C — THE UNEXPECTED (Downstream Consequences)

```
<tot_branch_c>
BRANCH C: THE UNEXPECTED
What non-obvious consequences does this issue create? What OTHER things
break because of this? What cascade does it trigger?

Reasoning path:
  1. Who/what DEPENDS on the code containing this issue? (dependency map)
  2. If this code behaves incorrectly, what downstream effects occur?
     → Data corruption in dependent services?
     → Incorrect state that propagates?
     → Security boundary violation that enables further exploitation?
  3. What is the WORST-CASE scenario if this issue is exploited/triggered?
  4. Is there a time-bomb aspect? (works today, fails under future conditions)
  5. What compound effect emerges when combined with OTHER findings?

Scoring criteria:
  - Accuracy: How likely is this downstream consequence to actually occur?
  - Impact: How severe is the downstream consequence?
  - Actionability: Can the downstream risk be mitigated? How?

This branch catches: Cascade failures, time bombs, compound vulnerabilities,
data corruption chains, emergent security risks from combined low-severity issues.

Strength: Surfaces hidden risks that no other analysis finds.
Weakness: May produce speculative findings. Requires stronger evidence standard.

SPECIAL RULE: If Branch C scores highest on Impact, this finding likely
requires /plan mode for architectural intervention. Flag for escalation.
</tot_branch_c>
```

---

## Branch Scoring Rubric

Each branch is scored on three dimensions (0-10 each). The scoring must be evidence-based.

```
ACCURACY (0-10): How confident are you that this interpretation is correct?
  10: Proven by code execution or test output
  8-9: Strong evidence from multiple file:line citations
  6-7: Evidence from 1-2 file:line citations + pattern matching
  4-5: Reasonable inference with partial evidence
  2-3: Plausible but largely speculative
  0-1: Guess without meaningful evidence

IMPACT (0-10): How much does this matter to users/business/developers?
  10: System-wide security breach or complete data loss
  8-9: Service outage or significant data corruption
  6-7: Feature broken for many users or performance severely degraded
  4-5: Feature partially broken or performance moderately degraded
  2-3: Minor UX issue or code quality concern
  0-1: Cosmetic issue or personal preference

ACTIONABILITY (0-10): How feasible and well-defined is the fix?
  10: One-line change with clear verification
  8-9: Small, well-defined change (< 30 min)
  6-7: Moderate change with clear scope (30 min - 2 hr)
  4-5: Significant change with some ambiguity (2-8 hr)
  2-3: Large change requiring architectural decision
  0-1: Requires external dependency or organizational change

COMPOSITE SCORE = (Accuracy * 0.4) + (Impact * 0.35) + (Actionability * 0.25)
```

---

## Search Strategy Selection

The orchestrator selects the search strategy based on context.

### Breadth-First Search (BFS)
```
USE BFS WHEN:
  - First iteration (exploring unfamiliar codebase)
  - Multiple independent findings need evaluation
  - Comparing patterns across the codebase
  - Resource budget is sufficient for full exploration

BFS PROTOCOL:
  1. Generate all 3 branches for the finding
  2. Score each branch completely
  3. Select highest-scoring branch
  4. If top 2 branches are within 1 point: explore both
  5. If all 3 branches score < 4: this may not be a real finding — reconsider
```

### Depth-First Search (DFS)
```
USE DFS WHEN:
  - Following a specific issue chain (A causes B causes C)
  - Security investigation (trace exploit path to completion)
  - Branch C scored highest (unexpected consequences need deep tracing)
  - Performance investigation (trace bottleneck to root allocation)

DFS PROTOCOL:
  1. Start with the highest-scoring branch
  2. If that branch suggests a deeper issue, spawn 3 NEW branches from it
  3. Continue until: leaf node (no further branching) OR depth limit (3 levels)
  4. Backtrack if current path scores below parent
  5. Maximum DFS depth: 3 levels (branch → sub-branch → sub-sub-branch)
```

### Beam Search (Resource-Constrained)
```
USE BEAM SEARCH WHEN:
  - Context window is limited
  - Many findings need ToT but budget is constrained
  - Iteration 4+ where focus is narrow

BEAM SEARCH PROTOCOL:
  beam_width = 2  (keep top 2 branches at each level)
  1. Generate all 3 branches
  2. Score all 3, keep top 2
  3. For each surviving branch, generate 2 sub-branches
  4. Score all 4 sub-branches, keep top 2
  5. Return the highest-scoring path
```

---

## Backtracking Triggers

During DFS exploration, these conditions trigger backtracking:

```
BACKTRACKING RULES:

TRIGGER 1 — SCORE DROP:
  Current branch scores 3+ points below parent branch
  → BACKTRACK. This path is unpromising.
  → Try the next unexplored sibling branch.

TRIGGER 2 — EVIDENCE FAILURE:
  Cannot find file:line evidence to support the current branch
  → BACKTRACK. Speculation without evidence is not analysis.
  → Return to parent and note "Branch X: insufficient evidence"

TRIGGER 3 — CIRCULAR REASONING:
  Current branch's conclusion is the same as its premise
  → BACKTRACK. You're reasoning in circles.
  → Try a fundamentally different interpretation.

TRIGGER 4 — SCOPE EXPLOSION:
  Current branch requires investigating > 20 files
  → BACKTRACK. This branch is too broad for a single finding.
  → Flag as "SYSTEMIC — requires dedicated investigation" and return.

TRIGGER 5 — CONTRADICTION:
  Current branch contradicts evidence from a previous branch
  → DO NOT BACKTRACK. This is valuable.
  → Flag as "CONFLICTING EVIDENCE" — both branches are capturing
    real complexity. Report both interpretations.
```

---

## Pruning Rules

Not every finding needs full ToT exploration. Prune to conserve resources.

```
PRUNING CRITERIA:

SKIP ToT (use CoT only) WHEN:
  - Finding is P3 severity (low impact, clear fix)
  - Finding is a known pattern (already seen 3+ times this iteration)
  - Finding has Level 1 evidence with > 0.9 confidence
  - CoT Step 2 (ANALYZE) produced high certainty (no ambiguity)

REQUIRE ToT WHEN:
  - Finding is P0 or P1 (high stakes demand thorough analysis)
  - CoT Step 2 produced uncertainty or multiple possible root causes
  - Finding involves security (wrong interpretation = wrong fix)
  - Finding contradicts expectations (classified as X but behaves as Y)
  - Finding spans multiple dimensions (code quality + security)

ABORT ToT WHEN:
  - All 3 branches score < 3 composite (not a real finding)
  - 2 branches produce identical conclusions (no value in branching)
  - Evidence for all branches is Level 5+ (insufficient for any path)
```

---

## Worked Example: Performance vs Architecture Finding

```
<tot_example>
OBSERVATION: API endpoint /api/projects returns all projects with all nested
data in a single response. Response size averages 2.4 MB for active users.

BRANCH A — THE OBVIOUS:
  The endpoint returns too much data. Fix: add pagination.
  Accuracy: 9 (clearly returns all data without limits)
  Impact: 6 (slow for large responses, but works)
  Actionability: 8 (pagination is straightforward)
  COMPOSITE: 7.75

BRANCH B — THE SYSTEMIC:
  The API design lacks resource boundaries. No endpoint separates project
  listing from project details from asset listing. This "mega-endpoint"
  pattern exists because the frontend was built first and the API was
  shaped to match the frontend's data needs rather than resource modeling.
  Other endpoints (GET /api/dashboard, GET /api/recent) show the same pattern.
  Accuracy: 7 (pattern confirmed in 3 endpoints)
  Impact: 8 (affects API scalability, mobile performance, caching)
  Actionability: 5 (requires API redesign, multiple endpoints)
  COMPOSITE: 6.85

BRANCH C — THE UNEXPECTED:
  The 2.4 MB response includes base64-encoded thumbnail images inline.
  This means: (1) images are re-transferred on every API call, (2) images
  are not CDN-cacheable because they're embedded in dynamic JSON, (3) the
  database stores images as BLOBs rather than URLs, meaning DB backup size
  grows with image count. The performance issue is actually a data architecture
  issue — the image storage pattern is wrong.
  Accuracy: 8 (verified: thumbnails are base64 in response, stored as BLOBs)
  Impact: 9 (affects storage costs, backup time, response size, CDN strategy)
  Actionability: 4 (requires data migration: BLOBs → object storage + URL)
  COMPOSITE: 7.35

WINNER: Branch A (7.75) — but Branch C (7.35) reveals a deeper issue.
RECOMMENDATION: Fix Branch A (pagination) as P1 in current iteration.
  Flag Branch C (image storage architecture) as P1 for next iteration's
  UNDERSTAND phase with dedicated deep-research investigation.
</tot_example>
```

---

## Branch Merging Protocol

When multiple branches score within 1 point, merge their insights:

```
MERGE PROTOCOL:

IF |branch_A.composite - branch_B.composite| <= 1.0:
  → MERGE: Combine the insights from both branches into a single finding
  → The finding has TWO aspects: the surface issue (A) and the systemic issue (B)
  → The fix should address BOTH: quick fix for A + plan for B
  → Severity: use the HIGHER of the two branches

IF all 3 branches score within 2 points:
  → This is a COMPLEX FINDING that cannot be reduced to a single interpretation
  → Report as: "Multi-aspect finding requiring phased resolution"
  → Phase 1: Address Branch A (quickest, most actionable)
  → Phase 2: Address Branch B (root cause)
  → Phase 3: Address Branch C (downstream protection)

IF branch scores are spread (> 3 point gap between highest and lowest):
  → CLEAR WINNER. Use highest-scoring branch.
  → Note the losing branches as "considered but rejected"
  → Include rejection rationale (future agents can skip re-evaluating)
```

---

## Composition Interface

This layer is applied SIXTH, after Chain of Thought. It activates when CoT produces uncertainty.

```
COMPOSITION ORDER:
  1. Emotion Prompting → sets stakes
  2. Meta-Prompting → forces reflection
  3. Context Retrieval → provides history
  4. (Agent-specific role instructions)
  5. Chain of Thought → structures reasoning
  6. [THIS] Tree of Thought → enables exploration (conditional)
  7. Graph of Thought → enables connection
  8. Chain of Density → structures output
```

ACTIVATION CONDITION:
- CoT Step 2 (ANALYZE) confidence < 0.7, OR
- Finding severity >= P1, OR
- Finding involves security dimension, OR
- Orchestrator explicitly requests ToT for this finding

Input from Chain of Thought:
- The 5-step reasoning chain (with uncertainty at Step 2)
- Evidence citations from Step 1
- Dimension context

Output:
- 3+ scored branches with evidence
- Selected branch (or merged branches) with justification
- Backtracking log (if any paths were abandoned)
- Escalation flags (if Branch C won or systemic issue found)

## Anti-Patterns

1. **Never apply ToT to P3 findings.** It wastes resources on issues that don't merit exploration.
2. **Never select a branch without scoring all three.** The whole point is comparison.
3. **Never go deeper than 3 DFS levels.** Diminishing returns beyond level 3.
4. **Never merge branches that contradict each other.** Report both as separate findings with a conflict flag.
5. **Never skip Branch C.** The unexpected consequences are often the most valuable discovery. Skipping C makes ToT equivalent to just doing CoT twice.
6. **Never use ToT as a substitute for evidence.** Branching without file:line citations is just organized speculation.
