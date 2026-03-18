---
name: chain-of-density
description: "Chain of Density compression layer for ProductUpgrade pipeline. Produces 3-pass summaries (skeletal-evidence-action) for inter-iteration handoff, context window management, and information-dense output. Includes density metrics, token budgets, compression techniques, and cross-iteration format. Layer 6 of 7."
---

# Chain of Density (CoD) — Layer 6 of 7

## Research Foundation

1. **Chain of Density Summarization (Adams et al., 2023)** — Demonstrated that iterative compression (5 passes, each denser) produces summaries that are more informative, more entity-dense, and more preferred by human evaluators than single-pass summaries. Each pass adds missing salient entities while maintaining the same length.

2. **Information Theory (Shannon, 1948)** — The optimal encoding of information maximizes bits per token. CoD operationalizes this by measuring findings-per-100-tokens as a density metric.

3. **Context Engineering** — In multi-iteration pipelines where context compaction is necessary, the quality of the compressed summary determines the quality of subsequent iterations. CoD ensures minimal information loss during compression.

## Core Principle

Every ProductUpgrade iteration generates thousands of tokens of findings. Between iterations, this must be compressed to fit context windows while preserving the information that matters for the NEXT iteration. CoD produces summaries at three density levels — each one adding evidence and actionability while keeping token count controlled.

The key insight: density is not about removing content. It's about increasing the RATIO of useful information to total tokens. A 500-token summary with 10 findings is denser than a 2000-token summary with 8 findings.

---

## The 3-Pass Protocol

### Pass 1: SKELETAL (Maximum compression)

```
<cod_pass_1>
TARGET: < 200 tokens total. One sentence per finding. No evidence. Just facts.

PURPOSE: This is the "tweet-length" summary. If the entire evaluation were
compressed to a single screen, what would it say? Used for:
- Quick status checks between phases
- Emergency context after compaction
- Progress reporting to orchestrator

FORMAT:
  [P0] {finding title} — {one-sentence description}
  [P1] {finding title} — {one-sentence description}
  ...grouped by severity, descending

RULES:
  - No file:line citations (too expensive in tokens)
  - No fix recommendations (that's Pass 3)
  - No confidence scores (that's Pass 2)
  - Every word must carry information — no filler
  - Use abbreviations: auth, config, DB, API, deps, a11y, perf, UX

EXAMPLE:
  [P0] SQL injection in login — auth endpoint uses string interpolation for DB queries
  [P0] Unauthenticated code exec — agent endpoint accepts dynamic expressions without auth
  [P1] N+1 queries — dashboard loads 200+ queries for active users
  [P1] Missing rate limiting — all API endpoints accept unlimited requests
  [P2] 75-line component — UserDashboard mixes concerns (fetch, validate, render)
  [P2] No ARIA labels — interactive elements lack accessibility attributes
  [P3] Inconsistent naming — snake_case in models, camelCase in serializers

  Density: 7 findings / 77 tokens = 9.1 per 100 tokens [EXCELLENT]

QUALITY GATE:
  > 5 findings/100 tokens: GOOD — proceed to Pass 2
  3-5 findings/100 tokens: ACCEPTABLE — try to compress further
  < 3 findings/100 tokens: POOR — rewrite with tighter language
</cod_pass_1>
```

### Pass 2: EVIDENCE (Add citations and confidence)

```
<cod_pass_2>
TARGET: < 500 tokens total. Add file:line evidence and confidence to Pass 1.

PURPOSE: This is the "traceable" summary. Every claim has a source citation.
Used for:
- Judge evaluation (needs evidence to verify scores)
- Cross-iteration comparison (same file, different scores?)
- Audit trail (which files had issues?)

FORMAT:
  [P0] {finding} — {description}
    Evidence: {file:line}, {file:line}, {file:line}
    Confidence: HIGH|MEDIUM|LOW
    Delta: {+/-X from previous iteration, or NEW}

RULES:
  - Minimum 2 evidence citations per finding
  - P0/P1 findings require 3+ citations
  - Confidence must reflect actual evidence quality (see Evidence Rubric)
  - Delta is required for iteration 2+ (compare to previous scores)
  - Still no fix recommendations (that's Pass 3)

EXAMPLE:
  [P0] SQL injection — auth uses string interpolation for queries
    Evidence: auth.py:42, auth.py:45, auth.py:67
    Confidence: HIGH (directly observed in code)
    Delta: NEW (first iteration)

  [P1] N+1 queries — dashboard generates 1+N+NM queries
    Evidence: chat_tools.py:89, chat_tools.py:95, chat_tools.py:101
    Confidence: HIGH (traced full query chain)
    Delta: NEW

  [P2] Oversized component — 75 lines, 6 useState, 3 useEffect
    Evidence: UserDashboard.tsx:145-220
    Confidence: MEDIUM (subjective threshold)
    Delta: NEW

  Density: 3 findings / 120 tokens = 2.5 per 100 tokens
  (Lower density than Pass 1 is expected — evidence costs tokens)

QUALITY GATE:
  Every P0/P1 has 3+ citations: REQUIRED
  Every finding has confidence: REQUIRED
  Every finding has delta (iteration 2+): REQUIRED
</cod_pass_2>
```

### Pass 3: ACTION (Add fix instructions and priority)

```
<cod_pass_3>
TARGET: < 1000 tokens total. A developer could execute fixes from this alone.

PURPOSE: This is the "actionable" summary. Contains everything needed to
start fixing without reading the full evaluation. Used for:
- Fix agent context injection (what to fix and how)
- Plan generation (scope and effort estimation)
- Post-compaction recovery (enough detail to resume)

FORMAT:
  [P0] {finding} — {description}
    Evidence: {file:line citations}
    Fix: {specific action to take}
    Effort: S|M|L|XL
    Test: {how to verify the fix}
    Blocks: {what this blocks, if anything}

RULES:
  - Fix must be specific enough to implement without reading the full report
  - Effort must be classified (S/M/L/XL)
  - Test must be concrete (not "verify it works")
  - Blocks lists which other findings depend on this fix
  - Order by severity, then by effort (quick wins first within each tier)

EXAMPLE:
  [P0] SQL injection — string interpolation in auth queries
    Evidence: auth.py:42, auth.py:45, auth.py:67
    Fix: Replace string interpolation with parameterized queries using %s placeholders
    Effort: S (3 lines, same file)
    Test: Submit crafted SQL in username field, verify query fails safely
    Blocks: FIND-SEC-002 (auth hardening depends on this)

  [P1] N+1 queries — 211 queries for dashboard load
    Evidence: chat_tools.py:89-103
    Fix: Replace loop with joinedload() ORM pattern
    Effort: S (5 lines)
    Test: Profile query count before/after, verify 1-3 queries
    Blocks: none

  [P2] Oversized component — mixed concerns in UserDashboard
    Evidence: UserDashboard.tsx:145-220
    Fix: Extract useUserData(), useFormValidation(), useErrorHandler() hooks
    Effort: M (3 new files)
    Test: All existing E2E tests on dashboard page still pass
    Blocks: none

  Density: 3 findings / 200 tokens = 1.5 per 100 tokens
  (Lowest density — action content is expensive but necessary)

QUALITY GATE:
  Every fix is implementable: REQUIRED (not vague "improve this")
  Every fix has effort: REQUIRED
  Every fix has test: REQUIRED
  Blocking dependencies noted: REQUIRED
</cod_pass_3>
```

---

## Density Metrics and Targets

```
DENSITY FORMULA:
  density = (findings_captured / tokens_used) * 100

TARGETS BY PASS:
  Pass 1 (SKELETAL):  > 5.0 findings/100 tokens  (target: 8+)
  Pass 2 (EVIDENCE):  > 2.0 findings/100 tokens  (target: 3+)
  Pass 3 (ACTION):    > 1.0 findings/100 tokens  (target: 1.5+)

TARGETS BY MODE:
  Auto mode:    Only Pass 1 (maximum speed)
  Standard mode: Pass 1 + Pass 2 (traceable)
  Deep mode:     All 3 passes (full actionability)

DENSITY IMPROVEMENT TECHNIQUES:
  1. Use abbreviations: auth, config, DB, API, deps, a11y, perf, UX, FE, BE
  2. Omit articles: "the", "a", "an" in finding descriptions
  3. Use dash notation: "auth — uses string interpolation" not "the auth module uses string interpolation for building database queries"
  4. Group related findings: "Missing validation in auth.py:42, user.py:67, api.py:23" not three separate findings
  5. Use severity as prefix: "[P0]" is 4 tokens vs "Priority: Critical" is 6 tokens
  6. Reference by ID: "Blocks: FIND-003" not "This finding blocks the resolution of the SQL injection finding discovered by the security review agent"
```

---

## Cross-Iteration Handoff Format

When a summary is used to transfer context between iterations (especially after compaction):

```
HANDOFF FORMAT:

# Iteration {N} Summary — {ISO date}
Grade: {X.X}/10 (delta: {+/-Y.Y} from iteration {N-1})
Focus: {dimension_a}, {dimension_b}
Status: {CONTINUE|CONVERGED|SUCCESS|DEGRADED|MAX_REACHED}

## Findings ({total})
{Pass 3 content — all findings with fix instructions}

## What Worked This Iteration
- {strategy or fix that improved scores}
- {approach that found real issues}

## What Failed This Iteration
- {strategy that produced false positives}
- {fix that didn't change the score}
- {approach that wasted resources}

## Focus for Next Iteration
- Dimension: {weakest_dimension_1} (score: {X}/10)
- Dimension: {weakest_dimension_2} (score: {Y}/10)
- Unresolved: {FIND-IDs that need continued work}

## Graph Summary
- Nodes: {count}, Edges: {count}
- Clusters: {count} ({themes})
- Cycles: {count} ({descriptions if any})
- Graph health: {X}/10

TOKEN BUDGET: This handoff must be < 2000 tokens.
If findings exceed token budget, keep all P0/P1 and trim P2/P3 to titles only.
```

---

## Compaction Protocol Integration

CoD is the critical layer that enables context window management:

```
PRE-COMPACTION CHECKLIST:
  [ ] Pass 3 summary saved to .productupgrade/ITERATIONS/ITERATION-{N}-SUMMARY.md
  [ ] Reflexion memory updated with what worked/failed
  [ ] Convergence log updated with current grade
  [ ] Thought graph saved to .productupgrade/THOUGHT-GRAPHS/
  [ ] All file artifacts are up to date

POST-COMPACTION RECOVERY:
  1. Read ITERATION-{N}-SUMMARY.md (Pass 3 = full context)
  2. Read REFLEXION-MEMORY.md (what to avoid)
  3. Read CONVERGENCE-LOG.md (grade trajectory)
  4. Read THOUGHT-GRAPH-{N}.md (finding relationships)
  5. Resume from handoff context

QUALITY GUARANTEE:
  If the Pass 3 summary is well-written, post-compaction recovery
  should produce the same evaluation quality as pre-compaction.
  This is the ONLY layer that makes compaction safe.
  Without CoD, compaction = context loss = quality regression.
```

---

## Multi-Agent Density Aggregation

When multiple agents produce CoD summaries, the density-summarizer aggregates:

```
AGGREGATION PROTOCOL:

1. COLLECT Pass 1 summaries from all agents
2. DEDUPLICATE same findings from different agents
3. MERGE evidence from duplicates (more sources = higher confidence)
4. RE-ORDER by severity, then by effort
5. PRODUCE unified Pass 1 → Pass 2 → Pass 3

TOKEN BUDGET PER AGGREGATION LEVEL:
  Per-agent Pass 1: < 200 tokens
  Per-agent Pass 2: < 500 tokens
  Per-agent Pass 3: < 1000 tokens
  Aggregated Pass 1: < 400 tokens (all agents combined)
  Aggregated Pass 2: < 1000 tokens
  Aggregated Pass 3: < 2000 tokens
  Iteration handoff: < 2000 tokens

TOTAL INTER-ITERATION CONTEXT: < 4000 tokens
  (handoff + reflexion memory + convergence log)
  This is < 5% of a 100K context window = sustainable for 7+ iterations
```

---

## Composition Interface

Applied EIGHTH and LAST in the composition order. Structures the output format.

```
COMPOSITION ORDER:
  1. Emotion Prompting → sets stakes
  2. Meta-Prompting → forces reflection
  3. Context Retrieval → provides history
  4. (Agent-specific role instructions)
  5. Chain of Thought → structures reasoning
  6. Tree of Thought → enables exploration
  7. Graph of Thought → enables connection
  8. [THIS] Chain of Density → structures output
```

Input from all previous layers:
- All findings with CoT chains, ToT branches, GoT edges
- Agent's evaluation results

Output:
- Pass 1 summary (skeletal, < 200 tokens)
- Pass 2 summary (evidence, < 500 tokens)
- Pass 3 summary (action, < 1000 tokens)
- Density metrics per pass
- Handoff document (if end of iteration)

## Anti-Patterns

1. **Never skip CoD in deep mode.** Without density summaries, context compaction destroys evaluation quality.
2. **Never produce Pass 3 without Pass 1 and 2.** Each pass builds on the previous. Jumping to action without compression produces bloated, unfocused summaries.
3. **Never exceed token budgets.** A 3000-token "summary" is not a summary — it's a report. Compress further.
4. **Never omit density metrics.** If you can't measure density, you can't improve it.
5. **Never use CoD as a substitute for full evaluation.** CoD compresses findings AFTER they're discovered. It doesn't discover findings.
6. **Never compact without saving Pass 3 first.** Compaction without CoD = permanent information loss.
