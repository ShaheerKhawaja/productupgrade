# Recursive Prompt Patterns for ProductionOS

**Research Foundation:** Recursive Language Models (Zhang et al. 2025), ReCAP (Li et al. 2025), Promptbreeder (Fernando et al. 2023), Self-Refine (Madaan et al. 2023), Chain-of-Verification (Dhuliawala et al. 2023), Chain of Density (Adams et al. 2023), Plan-and-Act (Wang et al. 2025)

**Purpose:** Six recursive prompt patterns that extend ProductionOS's existing 16 layers (00-15) and 9-layer composition stack. Each pattern uses self-reference, depth-bounded recursion, and convergence criteria to produce outputs that single-pass prompting cannot achieve.

**Integration:** These become Layers 16-21 in the `prompts/` directory and extend the composition function in `templates/PROMPT-COMPOSITION.md`.

---

## Table of Contents

1. [Pattern 1: Recursive Task Decomposition (Layer 16)](#pattern-1-recursive-task-decomposition)
2. [Pattern 2: Self-Referential Prompt Improvement (Layer 17)](#pattern-2-self-referential-prompt-improvement)
3. [Pattern 3: Recursive Summarization Chain (Layer 18)](#pattern-3-recursive-summarization-chain)
4. [Pattern 4: Recursive Verification Stack (Layer 19)](#pattern-4-recursive-verification-stack)
5. [Pattern 5: Recursive Plan-Execute-Evaluate-Replan (Layer 20)](#pattern-5-recursive-plan-execute-evaluate-replan)
6. [Pattern 6: Recursive Prompt Evolution (Layer 21)](#pattern-6-recursive-prompt-evolution)
7. [Integration with 9-Layer Composition](#integration-with-9-layer-composition)
8. [Updated Application Matrix](#updated-application-matrix)
9. [Cost and Depth Budgets](#cost-and-depth-budgets)
10. [Sources](#sources)

---

## Pattern 1: Recursive Task Decomposition

**Layer 16: RecDecomp**
**Research:** Recursive Language Models (MIT, 2025) — handles prompts 100x longer than base LLMs via recursive sub-invocation
**Impact:** Transforms unbounded tasks into bounded, independently solvable subtasks with guaranteed termination

### Core Idea

The LLM decomposes a task into subtasks, then applies itself recursively to each subtask. Subtasks that are still too complex get decomposed further. Recursion terminates when a subtask is "atomic" -- solvable in a single step without further breakdown.

### Prompt Template

```markdown
## Recursive Task Decomposition Protocol

You are solving: {TASK}

### Step 1: Atomicity Check
Ask: "Can I solve this task completely and correctly in a single response
without breaking it into parts?"

If YES → solve it directly and output the result. STOP recursion.
If NO → proceed to Step 2.

### Step 2: Decompose
Break the task into 2-5 subtasks where:
- Each subtask is INDEPENDENT (can be solved without the others' results)
  OR has explicit DEPENDENCIES (requires output of subtask N before starting)
- Each subtask is SMALLER than the parent task (progress guarantee)
- The union of all subtasks EQUALS the parent task (completeness guarantee)
- No subtask is a restatement of the parent (non-trivial decomposition)

Format:
```
SUBTASK-1: {description} [INDEPENDENT | DEPENDS-ON: SUBTASK-N]
SUBTASK-2: {description} [INDEPENDENT | DEPENDS-ON: SUBTASK-N]
...
```

### Step 3: Recursive Solve
For each subtask, apply this ENTIRE protocol from Step 1.
Track depth: current_depth = {DEPTH}, max_depth = {MAX_DEPTH}

If current_depth >= max_depth:
  FORCE atomic resolution — solve as-is, note any incompleteness.

### Step 4: Compose
Combine subtask results into the parent solution.
Verify: does the composed result actually solve the original task?
If NO → identify the gap and create ONE additional subtask to fill it.

### Recursion Metadata
```
DEPTH: {current} / {max}
PARENT: {parent_task_id or ROOT}
SUBTASK-COUNT: {N}
ATOMICITY: {ATOMIC | DECOMPOSED}
```
```

### Depth Limits by Context

| Context | Max Depth | Rationale |
|---------|-----------|-----------|
| /production-upgrade | 3 | Single-pass audit, moderate complexity |
| /auto-swarm | 4 | Parallel execution, tasks can be deep |
| /omni-plan | 5 | Full pipeline, maximum decomposition |
| /deep-research | 6 | Research tasks benefit from deep breakdown |

### When to Use
- dynamic-planner agent decomposing multi-step improvement plans
- /omni-plan Step 7 (task decomposition for swarm)
- /deep-research breaking broad topics into focused investigations
- Any task where the agent says "this is too complex to handle at once"

### Anti-Pattern: Infinite Decomposition
The model sometimes decomposes every task regardless of complexity. The atomicity check in Step 1 is the guard. If an agent produces more than 5 subtasks, challenge it: "Can any of these subtasks be merged? A subtask list longer than 5 usually means the decomposition granularity is wrong."

---

## Pattern 2: Self-Referential Prompt Improvement

**Layer 17: SelfRefine**
**Research:** Self-Refine (Madaan et al. 2023) — +20% human preference; Promptbreeder (Fernando et al. 2023) — self-referential mutation of both task-prompts and mutation-prompts
**Impact:** Prompts evolve through self-critique, producing responses that improve with each pass without external feedback

### Core Idea

The LLM generates output, then critiques its own output, then uses the critique to produce an improved version. The key: the critique prompt itself can be improved by a meta-critique. This creates two levels of recursion -- content improvement and prompt improvement.

### Prompt Template

```markdown
## Self-Referential Improvement Protocol

### Phase 1: Generate (depth = 0)
Produce your initial response to: {TASK}

Tag your output:
<draft depth="0">
{initial response}
</draft>

### Phase 2: Critique (depth = 0)
Now switch roles. You are a CRITIC reviewing the draft above.
Evaluate against these dimensions:
1. CORRECTNESS — Are all facts and claims accurate?
2. COMPLETENESS — Are there gaps or missing considerations?
3. CLARITY — Is the reasoning clear and followable?
4. ACTIONABILITY — Can the reader act on this immediately?
5. CONCISENESS — Is there unnecessary filler or repetition?

For each dimension, provide:
- Score (1-10)
- Specific weakness (cite exact text)
- Concrete improvement instruction

<critique depth="0">
| Dimension | Score | Weakness | Improvement |
|-----------|-------|----------|-------------|
| ... | ... | ... | ... |
</critique>

### Phase 3: Refine (depth = 1)
Using ONLY the critique above (not general knowledge), produce an improved version.
Every change must trace to a specific critique point.

Rules:
- Do NOT discard correct content from depth 0
- Do NOT introduce new errors while fixing old ones
- Track what changed: [CHANGED: {what}, REASON: {critique point}]

<draft depth="1">
{improved response}
[CHANGES: ...]
</draft>

### Phase 4: Convergence Check
Compare depth 0 and depth 1:
- If improvement delta < {THRESHOLD} across all dimensions → STOP, output depth 1
- If any dimension REGRESSED → revert that dimension to depth 0's version
- If improvement delta >= {THRESHOLD} → go to Phase 2 with depth += 1

### Termination
Maximum depth: {MAX_DEPTH} (default: 3)
Convergence threshold: average improvement < 0.5 points across dimensions
Regression guard: NEVER accept a version where any dimension dropped > 1 point

### Meta-Refinement (optional, for prompt engineering tasks only)
After the content converges, refine the CRITIQUE PROMPT itself:
"Looking at my critique from Phase 2, what did I fail to catch?
What critique dimensions should I ADD for this type of task?
What dimensions were unhelpful and should be REMOVED?"

Update the critique rubric for next invocation.
```

### Self-Bias Mitigation

Research (Huang et al. 2024) shows LLMs tend to rate their own output favorably. Countermeasures built into this template:
- The critique MUST cite specific text (not general praise/criticism)
- The critique MUST produce at least one weakness per dimension (no perfect scores on depth 0)
- Regression guard prevents the refinement from degrading output through over-correction

### When to Use
- llm-judge agent improving its own evaluation rubrics
- comms-assistant refining documentation drafts
- /omni-plan Step 3-4 improving the plan itself before execution
- Any output that will be read by humans (refinement catches awkward phrasing, gaps)

### When NOT to Use
- Code generation (use Layer 14: Self-Debugging instead -- it executes and observes, which is stronger than self-critique for code)
- Time-critical paths (each refinement pass adds latency)

---

## Pattern 3: Recursive Summarization Chain

**Layer 18: RecSumm**
**Research:** Chain of Density (Adams et al. 2023) — entity-dense summaries preferred at step 3; extends ProductionOS's existing Layer 06 (CoD) with true recursion and cross-level coherence tracking
**Impact:** Produces summaries with 3-5x higher information density than single-pass, while maintaining readability

### Core Idea

Unlike standard CoD (Layer 06) which runs 3 passes on a single document, Recursive Summarization applies CoD hierarchically: first summarize individual components, then summarize the summaries, then summarize those. Each level produces a denser representation. A coherence check at each level ensures information is compressed, not lost.

### Prompt Template

```markdown
## Recursive Summarization Chain

### Input
Source material: {DOCUMENTS — list of files, reports, or prior iteration artifacts}

### Level 0: Leaf Summaries (one per source document)
For EACH source document, produce a summary using CoD:

Pass 0a: Extract all salient entities (people, concepts, decisions, metrics, findings)
Pass 0b: Write a summary of EXACTLY {TARGET_LENGTH} words
Pass 0c: Identify 1-3 entities MISSING from your summary. Rewrite at SAME length,
         fusing new entities in by compressing existing text.
Pass 0d: Repeat 0c until no missing salient entities remain (max 5 passes)

Output:
<summary level="0" source="{document_name}" entities="{count}" words="{count}">
{dense summary}
</summary>

### Level 1: Branch Summaries (group related Level 0 summaries)
Group Level 0 summaries by theme/dimension. For each group:

1. Concatenate all Level 0 summaries in the group
2. Apply CoD (passes a-d above) to the concatenated text
3. Target length: 60% of combined Level 0 length (compression)
4. COHERENCE CHECK: For each entity in the Level 0 summaries,
   verify it appears in Level 1 OR was correctly identified as non-salient.

<summary level="1" group="{theme}" sources="{list}" entities="{count}">
{branch summary}
</summary>

Entity loss report:
- Retained: {count} entities
- Dropped (non-salient): {list with justification}
- ALERT — lost (should have been retained): {list} ← fix these

### Level 2: Root Summary (single ultra-dense summary)
1. Concatenate all Level 1 summaries
2. Apply CoD to produce the final summary
3. Target length: 50% of combined Level 1 length
4. COHERENCE CHECK: All P0/P1 findings from ANY level must appear here
5. Add structural metadata: dimension scores, trends, recommendations

<summary level="2" type="root" total_sources="{count}" total_entities="{count}">

## {Project} — Recursive Summary (Iteration {N})

### Grade: {X.X}/10 | Delta: {+/-Y.Y}
### Dimensions: CQ:{X} SEC:{X} PERF:{X} UX:{X} TEST:{X} A11Y:{X} DOC:{X} ERR:{X} OBS:{X} DEP:{X}

### Critical Findings (P0-P1)
{one line per finding with file:line citations}

### Decisions Made
{one line per decision with rationale}

### Carry-Forward
{what the next iteration must know}

</summary>

### Recursion Depth
| Source Count | Levels | Rationale |
|-------------|--------|-----------|
| 1-3 docs | 1 (leaf only) | Not enough to justify hierarchy |
| 4-10 docs | 2 (leaf + root) | Standard inter-iteration handoff |
| 11+ docs | 3 (leaf + branch + root) | Full hierarchical compression |
```

### Difference from Existing Layer 06 (CoD)

Layer 06 is a single-document, 3-pass compression. Layer 18 is multi-document, hierarchical, with coherence tracking. They compose well: Layer 06 runs WITHIN each level of Layer 18.

| Feature | Layer 06 (CoD) | Layer 18 (RecSumm) |
|---------|----------------|---------------------|
| Input | Single document | Multiple documents |
| Structure | Linear (3 passes) | Hierarchical (2-3 levels) |
| Coherence tracking | None | Entity loss report per level |
| Cross-document synthesis | No | Yes (branch grouping) |
| Use case | Per-agent output compression | Cross-iteration handoff |

### When to Use
- density-summarizer agent (replaces current simple 3-pass with hierarchical recursion)
- /omni-plan-nth inter-iteration handoffs (10+ artifacts per iteration)
- /deep-research consolidating findings from multiple sources
- Any context where more than 3 artifacts need to be compressed into a single handoff

---

## Pattern 4: Recursive Verification Stack

**Layer 19: RecVerify**
**Research:** Chain-of-Verification (Dhuliawala et al. 2023), Self-Verification (Weng et al. 2023), ConVerTest (2025) — combining self-consistency, chain-of-verification, and dual execution agreement
**Impact:** Each verification level catches errors the previous level missed; 3-level stacks reduce hallucination by ~60% vs single-pass verification

### Core Idea

Verify the output. Then verify the verification. Then verify THAT verification. Each level operates on a different axis: Level 1 checks factual correctness, Level 2 checks the verification methodology, Level 3 checks for systematic blind spots. This prevents the common failure where a verifier has the same biases as the generator.

### Prompt Template

```markdown
## Recursive Verification Stack

### Input
Claim to verify: {CLAIM — an output, finding, fix, score, or decision from any agent}

### Level 1: Factual Verification (verify the CONTENT)
For each discrete sub-claim within the claim:

1. QUESTION: Generate a specific, falsifiable question that would disprove this sub-claim
   Example: Claim "Fixed N+1 query" → Question: "Does a loop with individual DB calls
   still exist in the function?"

2. INVESTIGATE: Answer the question using tools (Read, Grep, Bash)
   - Do NOT answer from memory or assumption
   - Do NOT trust the claimant's report
   - Collect at least 2 independent pieces of evidence

3. VERDICT-L1: For each sub-claim:
   CONFIRMED — evidence supports the claim
   REFUTED — evidence contradicts the claim
   INDETERMINATE — insufficient evidence either way

<verification level="1">
| Sub-Claim | Question | Evidence | Verdict |
|-----------|----------|----------|---------|
| ... | ... | ... | CONFIRMED/REFUTED/INDETERMINATE |
</verification>

### Level 2: Methodological Verification (verify the VERIFICATION)
Now examine your Level 1 verification for flaws:

1. COVERAGE: Did I check ALL sub-claims, or did I skip any?
   - List any sub-claims not covered in Level 1
   - For each, explain why it was skipped and whether that's acceptable

2. EVIDENCE QUALITY: Was my evidence sufficient?
   - For each CONFIRMED verdict: Would a skeptic accept this evidence?
   - For each REFUTED verdict: Could I be wrong? Is there an alternative interpretation?
   - For each INDETERMINATE: What additional evidence would resolve this?

3. BIAS CHECK: Did I verify with equal rigor in both directions?
   - Confirmation bias: Did I search harder for evidence that CONFIRMS the claim?
   - Anchoring: Did the claimant's framing influence what I looked for?
   - Availability: Did I only check the most obvious places?

4. VERDICT-L2: Assessment of Level 1's reliability
   HIGH — Level 1 methodology is sound, all claims adequately checked
   MEDIUM — Level 1 has gaps but core conclusions are likely correct
   LOW — Level 1 has significant methodological flaws, re-verify

<verification level="2">
Coverage gaps: {list or NONE}
Evidence quality: {HIGH/MEDIUM/LOW per sub-claim}
Bias assessment: {findings}
Overall L1 reliability: {HIGH/MEDIUM/LOW}
</verification>

### Level 3: Systematic Blind Spot Check (verify the VERIFIER)
This level looks for what BOTH the original claim AND the verification might have missed:

1. FRAME CHALLENGE: Is the claim even asking the right question?
   Example: Claim "API response time is 200ms" might be verified as TRUE,
   but the real question is "Is 200ms acceptable for this use case?"

2. ASSUMPTION AUDIT: What assumptions did both the claimant and the verifier share?
   - Technology assumptions (e.g., both assumed single-threaded execution)
   - Scope assumptions (e.g., both only checked the happy path)
   - Environment assumptions (e.g., both assumed production-like conditions)

3. ADVERSARIAL PROBE: What would an attacker, an angry user, or a
   production outage expose that this verification did not check?

4. VERDICT-L3: Final assessment
   VALIDATED — claim holds up under all three levels of scrutiny
   QUALIFIED — claim is true but with caveats identified at L2/L3
   CHALLENGED — claim has significant issues identified at L2/L3
   INVALIDATED — claim fails at L1 (factual) level

<verification level="3">
Frame challenges: {list}
Shared assumptions: {list}
Adversarial gaps: {list}
FINAL VERDICT: {VALIDATED/QUALIFIED/CHALLENGED/INVALIDATED}
Confidence: {0-100%}
</verification>

### Recursion Termination
- Standard: 3 levels (factual → methodological → blind spots)
- Lightweight (for low-stakes claims): Level 1 only
- Extended (for P0/security claims): Add Level 4 — cross-model verification
  (invoke a different model via /agentic-eval to independently verify)

### Level Selection by Claim Severity
| Severity | Levels | Rationale |
|----------|--------|-----------|
| P3 (polish) | L1 only | Low risk, fast verification |
| P2 (debt) | L1 + L2 | Moderate risk, check methodology |
| P1 (impact) | L1 + L2 + L3 | High risk, check blind spots |
| P0 (critical) | L1 + L2 + L3 + cross-model | Maximum rigor |
```

### Relationship to Existing verification-gate Agent

The verification-gate agent (already in ProductionOS) performs Level 1 verification (FCA: Fresh, Complete, Accurate). Layer 19 extends this with Levels 2 and 3. The composition:

```
verification-gate agent
    └── uses Layer 19 (RecVerify) as its prompt technique
        ├── L1: existing FCA protocol (unchanged)
        ├── L2: NEW — methodological self-check
        └── L3: NEW — blind spot detection
```

### When to Use
- verification-gate agent (extend from L1-only to L1-L3)
- llm-judge scoring (verify that scores are justified, not inflated)
- /security-audit findings (P0 findings get full L1-L3 stack)
- convergence-monitor decisions (verify PIVOT/REFINE/PROCEED rationale)
- Any claim where being wrong has outsized consequences

---

## Pattern 5: Recursive Plan-Execute-Evaluate-Replan

**Layer 20: PEER (Plan-Execute-Evaluate-Replan)**
**Research:** Plan-and-Act (Wang et al. 2025), ReCAP (Li et al. 2025), BrainBody-LLM (2025)
**Impact:** Transforms brittle sequential plans into adaptive, self-correcting execution loops

### Core Idea

Instead of planning once and executing linearly, the agent plans, executes ONE step, evaluates the result against expectations, and then either continues with the plan, adjusts the plan, or replans entirely. This is the agentic equivalent of gradient descent with adaptive learning rate.

### Prompt Template

```markdown
## PEER: Plan-Execute-Evaluate-Replan Protocol

### Input
Goal: {GOAL}
Constraints: {time, tokens, files, scope}
Context: {prior iteration results, reflexion insights}

### Phase 1: PLAN
Produce an ordered plan of 3-7 steps. For each step:

```
STEP-{N}:
  ACTION: {what to do}
  EXPECTED-OUTCOME: {what success looks like, measurable}
  FAILURE-CONDITION: {what would indicate this step failed}
  DEPENDENCIES: {which prior steps must succeed}
  ROLLBACK: {how to undo this step if it fails}
```

Attach a PLAN-CONFIDENCE score (0-100%):
- 90-100%: Well-understood task, clear path
- 70-89%: Some uncertainty, plan may need adjustment
- 50-69%: Significant unknowns, expect replanning
- <50%: Exploratory, plan is a hypothesis

### Phase 2: EXECUTE (one step at a time)
Execute STEP-{N}. Capture the actual outcome.

```
EXECUTION-{N}:
  ACTION-TAKEN: {what you actually did}
  ACTUAL-OUTCOME: {what happened}
  MATCH: {YES — outcome matches expected | PARTIAL — partially matches | NO — diverged}
  ARTIFACTS: {files created/modified, commands run, evidence collected}
```

### Phase 3: EVALUATE (after each step)
Compare ACTUAL-OUTCOME to EXPECTED-OUTCOME:

```
EVALUATION-{N}:
  OUTCOME-MATCH: {YES/PARTIAL/NO}
  IMPACT-ON-PLAN: {NONE — proceed as planned |
                    ADJUST — modify remaining steps |
                    REPLAN — plan is invalidated, need new plan |
                    ABORT — goal is unachievable with current approach}
  CONFIDENCE-DELTA: {how PLAN-CONFIDENCE changed}
  INSIGHT: {what we learned that the original plan did not account for}
```

### Phase 4: REPLAN (conditional)

IF OUTCOME-MATCH == YES and IMPACT-ON-PLAN == NONE:
  → Continue to STEP-{N+1}. No changes.

IF OUTCOME-MATCH == PARTIAL and IMPACT-ON-PLAN == ADJUST:
  → Modify remaining steps to account for the partial result.
  → Insert bridge steps if needed to fill the gap.
  → Update PLAN-CONFIDENCE.
  → Continue to next step (modified).

IF OUTCOME-MATCH == NO and IMPACT-ON-PLAN == REPLAN:
  → ROLLBACK STEP-{N} if the action was destructive.
  → Generate a NEW plan from the current state (not from the original state).
  → Incorporate the INSIGHT from the failed step.
  → Restart from Phase 1 with replan_count += 1.
  → Max replans: {MAX_REPLANS} (default: 3)

IF IMPACT-ON-PLAN == ABORT:
  → ROLLBACK all steps.
  → Report: "Goal {GOAL} is not achievable because {REASON}."
  → Recommend alternative goal or escalate to human.

### Recursion Metadata
```
PLAN-VERSION: {V} (increments on each REPLAN)
STEP: {N} / {TOTAL}
REPLAN-COUNT: {R} / {MAX_REPLANS}
CUMULATIVE-CONFIDENCE: {aggregated from step evaluations}
INSIGHTS-LOG:
  - Step {X}: learned {insight}
  - Step {Y}: learned {insight}
```

### Termination Conditions
1. All steps executed with OUTCOME-MATCH == YES → SUCCESS
2. replan_count >= MAX_REPLANS → CONVERGED (best effort)
3. CONFIDENCE drops below 20% → ABORT
4. ABORT triggered at any step → ABORT with rollback

### PEER vs. Existing decision-loop Agent

| Feature | decision-loop (existing) | PEER (Layer 20) |
|---------|--------------------------|------------------|
| Granularity | Per-iteration (coarse) | Per-step (fine) |
| Replanning | 3 options (PIVOT/REFINE/PROCEED) | 4 options + rollback |
| Confidence tracking | Grade-based | Step-level + cumulative |
| Insight capture | Via reflexion-log | Inline per-step |
| When | Between iterations | During execution |

PEER operates WITHIN an iteration. decision-loop operates BETWEEN iterations. They compose:
```
Iteration N:
  decision-loop decides REFINE
    → dynamic-planner creates plan using PEER
      → PEER executes step by step with evaluation
      → PEER replans if needed
    → results feed back to decision-loop for Iteration N+1
```
```

### When to Use
- dynamic-planner agent (replaces linear planning with adaptive planning)
- /auto-swarm wave execution (each wave evaluates and adjusts)
- /omni-plan Step 9 execution engine (per-step evaluation within the swarm)
- refactoring-agent (plan refactoring, execute one change, evaluate, adjust)
- migration-planner (migration plans need frequent adjustment as reality differs from plan)

---

## Pattern 6: Recursive Prompt Evolution

**Layer 21: PromptEvo**
**Research:** Promptbreeder (Fernando et al. 2023) — evolves both task-prompts AND mutation-prompts; Meta-Prompting (Suzgun & Kalai 2024)
**Impact:** The system improves its own prompt templates over time, creating a self-optimizing prompt layer

### Core Idea

Instead of static prompt templates, the system tracks which prompt formulations produce the best agent outputs and evolves the prompts accordingly. This is the meta-recursive pattern: prompts that improve the prompts that improve the prompts.

### Prompt Template

```markdown
## Prompt Evolution Protocol

### Context
This protocol runs AFTER a convergence loop completes (not during).
It examines which prompt layers produced the best results and mutates them.

### Step 1: Performance Extraction
From the completed convergence loop, extract prompt-to-outcome mappings:

```
PROMPT-PERFORMANCE:
  Layer 01 (Emotion): applied to {N} agents, avg score improvement: {X}
  Layer 03 (CoT): applied to {N} agents, avg score improvement: {X}
  Layer 05 (ToT): applied to {N} agents, avg score improvement: {X}
  ...
```

Identify:
- TOP-PERFORMING: layers with highest score improvement
- UNDER-PERFORMING: layers with <0.5 avg improvement
- NEGATIVE: layers that correlated with score DECREASE

### Step 2: Mutation Generation
For each UNDER-PERFORMING or NEGATIVE layer, generate 3 mutations:

MUTATION-A (conservative): Rephrase the prompt while keeping the same structure.
  - Change word choice, adjust emphasis, reorder instructions
  - Preserve the core technique (e.g., CoT still does step-by-step reasoning)

MUTATION-B (structural): Change the prompt structure while keeping the technique.
  - Add/remove steps, change the output format, add examples
  - The technique is the same but the scaffolding changes

MUTATION-C (radical): Replace the technique with an alternative.
  - If CoT underperformed, try analogical reasoning or abstraction-first
  - If Emotion underperformed, try role assignment ("You are the world's expert in...")
  - Document the alternative's research basis

### Step 3: Meta-Mutation (evolve the mutation strategy)
Examine your mutation history:

"Looking at past mutations I've generated:
- Which mutation TYPE (A/B/C) has historically produced the best results?
- Am I over-indexing on conservative mutations when radical ones work better?
- Am I generating mutations that are too similar to each other?"

Adjust mutation strategy for next evolution cycle.

### Step 4: Selection
Score each mutation on:
- CLARITY: Is the mutated prompt clearer than the original? (1-10)
- SPECIFICITY: Does it give the agent more actionable guidance? (1-10)
- NOVELTY: Does it offer a genuinely different approach? (1-10)
- COMPATIBILITY: Does it compose well with other layers? (1-10)

Select the mutation with the highest composite score.
If no mutation scores higher than the original, keep the original (elitism).

### Step 5: Record
Write to `.productionos/PROMPT-EVOLUTION.md`:

```
## Evolution Cycle {N} — {date}

### Layer: {layer_name}
Original: {original prompt text, truncated to 200 chars}
Mutation type: {A/B/C}
Mutated: {new prompt text, truncated to 200 chars}
Selection scores: CLARITY:{X} SPECIFICITY:{X} NOVELTY:{X} COMPATIBILITY:{X}
Decision: {ADOPTED / KEPT-ORIGINAL}
Rationale: {one sentence}
```

### Recursion Depth
- Evolution cycles run BETWEEN convergence loops, never during
- Maximum 1 evolution cycle per convergence loop completion
- Maximum 3 layers mutated per cycle (focus, not thrashing)
- After 5 evolution cycles, run a meta-evaluation:
  "Are the evolved prompts actually better? Compare iteration-1 performance
  with current performance using the same codebase."
```

### Safety Rails

Prompt evolution is powerful but dangerous. Without guards, it can drift prompts into adversarial territory or strip essential constraints.

```
EVOLUTION CONSTRAINTS:
1. Constitutional layer (Layer 11) is NEVER mutated. Safety constraints are fixed.
2. Mutations must preserve the layer's RESEARCH-BACKED core technique.
   CoT must still involve step-by-step reasoning. ToT must still branch.
3. Guardrail instructions (max file counts, protected files, approval gates)
   are NEVER subject to evolution. Only reasoning/analysis prompts evolve.
4. Every mutation is diffed against the original and logged.
5. If an evolved prompt produces WORSE results for 2 consecutive loops,
   automatic rollback to the previous version.
```

### When to Use
- metaclaw-learner agent (this IS its core function, formalized)
- Post-/omni-plan-nth completion (evolve prompts between major runs)
- When convergence plateaus at <8/10 (existing prompts may be the bottleneck)
- NOT during active execution (evolution is a between-runs activity)

---

## Integration with 7-Layer Composition

### Extended Architecture (7 + 6 = 13 composable layers)

```
┌──────────────────────────────────────────────────────────┐
│ Layer 21: Prompt Evolution (meta — between runs only)     │  ← Self-improvement
├──────────────────────────────────────────────────────────┤
│ Layer 20: PEER (plan-execute-evaluate-replan)             │  ← Adaptive execution
├──────────────────────────────────────────────────────────┤
│ Layer 19: Recursive Verification Stack                    │  ← Multi-level verification
├──────────────────────────────────────────────────────────┤
│ Layer 18: Recursive Summarization Chain                   │  ← Hierarchical compression
├──────────────────────────────────────────────────────────┤
│ Layer 17: Self-Referential Improvement                    │  ← Output self-refinement
├──────────────────────────────────────────────────────────┤
│ Layer 16: Recursive Task Decomposition                    │  ← Divide and conquer
├──────────────────────────────────────────────────────────┤
│ ─ ─ ─ ─ ─ EXISTING 7-LAYER STACK (unchanged) ─ ─ ─ ─ ─ │
├──────────────────────────────────────────────────────────┤
│ Layer 7: Chain of Density (compression)                   │  ← Inter-iteration handoff
├──────────────────────────────────────────────────────────┤
│ Layer 6: Graph of Thought (network)                       │  ← Finding relationships
├──────────────────────────────────────────────────────────┤
│ Layer 5: Tree of Thought (branching)                      │  ← Exploration
├──────────────────────────────────────────────────────────┤
│ Layer 4: Chain of Thought (reasoning)                     │  ← Step-by-step logic
├──────────────────────────────────────────────────────────┤
│ Layer 3: Context Retrieval (RAG)                          │  ← Documentation + memory
├──────────────────────────────────────────────────────────┤
│ Layer 2: Meta-Prompting (reflection)                      │  ← Self-awareness
├──────────────────────────────────────────────────────────┤
│ Layer 1: Emotion Prompting (stakes)                       │  ← Motivation
└──────────────────────────────────────────────────────────┘
```

### Composition Rules (extending existing rules from prompts/README.md)

Existing rules 1-8 remain unchanged. New rules:

```
9.  Layer 16 (RecDecomp) for any task the agent cannot solve atomically.
    Applied BEFORE Layer 4 (CoT) — decompose first, then reason through each piece.

10. Layer 17 (SelfRefine) for human-facing outputs only (docs, reports, plans).
    Applied AFTER the agent produces its initial output. Never applied to code.

11. Layer 18 (RecSumm) replaces Layer 7 (CoD) when source count > 3.
    Layer 7 still handles single-document compression within RecSumm levels.

12. Layer 19 (RecVerify) extends verification-gate agent with L2/L3.
    Severity-based: P3=L1, P2=L1+L2, P1/P0=L1+L2+L3.

13. Layer 20 (PEER) replaces linear planning for execution agents.
    Applied to dynamic-planner, refactoring-agent, migration-planner.

14. Layer 21 (PromptEvo) runs ONLY between convergence loops, never during.
    Maximum 3 layers mutated per cycle. Constitutional layer is immutable.
```

### Composition Function Update

```python
def compose_prompt(agent_type: str, severity: str, iteration: int,
                   task_complexity: str = "standard",
                   source_count: int = 1,
                   output_audience: str = "system") -> str:
    layers = APPLICATION_MATRIX[agent_type]
    prompt_parts = []

    # --- Existing layers (1-7) ---
    if "L1" in layers:
        prompt_parts.append(emotion_layer(severity))
    if "L2" in layers:
        prompt_parts.append(meta_layer())
    if "L3" in layers:
        prompt_parts.append(context_layer())
    if "L4" in layers:
        prompt_parts.append(cot_layer())
    if "L5" in layers:
        prompt_parts.append(tot_layer())
    if "L6" in layers:
        prompt_parts.append(got_layer())
    if "L7" in layers and iteration > 1:
        prompt_parts.append(cod_layer(iteration - 1))

    # --- Recursive layers (16-21) ---
    if "L16" in layers and task_complexity in ("deep", "ultra"):
        depth = {"deep": 4, "ultra": 5}.get(task_complexity, 3)
        prompt_parts.append(rec_decomp_layer(max_depth=depth))

    if "L17" in layers and output_audience == "human":
        prompt_parts.append(self_refine_layer(max_depth=3, threshold=0.5))

    if "L18" in layers and source_count > 3:
        prompt_parts.append(rec_summ_layer(source_count))
    elif "L7" in layers and iteration > 1:
        pass  # Already added L7 above

    if "L19" in layers:
        level = {"P3": 1, "P2": 2, "P1": 3, "P0": 3}.get(severity, 2)
        prompt_parts.append(rec_verify_layer(max_level=level))

    if "L20" in layers:
        prompt_parts.append(peer_layer(max_replans=3))

    # L21 (PromptEvo) is NEVER composed into agent prompts.
    # It runs as a separate between-loops process.

    return "\n\n".join(prompt_parts)
```

---

## Updated Application Matrix

| Agent Type | L1 | L2 | L3 | L4 | L5 | L6 | L7 | L16 | L17 | L18 | L19 | L20 | L21 |
|-----------|-----|-----|-----|-----|-----|-----|-----|------|------|------|------|------|------|
| Review agents | Y | Y | Y | Y | | | | | | | | | |
| Planning agents | Y | Y | Y | | Y | | | Y | | | | Y | |
| Execution agents | Y | | Y | Y | | | | Y | | | | Y | |
| Judge agents | Y | Y | Y | Y | | | Y | | | | Y | | |
| Synthesis agents | | | Y | | | Y | Y | | Y | Y | | | |
| Adversarial agents | Y | Y | | Y | Y | | | | | | Y | | |
| Orchestrative agents | | | Y | | | | Y | Y | | Y | | | |
| Meta agents | | Y | | | | | | | | | | | Y |

### New Agent Type: Meta Agents
Agents that operate on the prompt system itself: metaclaw-learner, prompt evolution processes. They receive Layer 21 and are the only agents that can modify prompt templates.

---

## Cost and Depth Budgets

Recursive patterns consume more tokens than single-pass. Budget enforcement prevents runaway costs.

### Token Multipliers

| Layer | Multiplier vs. Single-Pass | Notes |
|-------|---------------------------|-------|
| L16 (RecDecomp) | 1.5-3x | Depends on decomposition depth |
| L17 (SelfRefine) | 2-4x | Each refinement pass is ~1x |
| L18 (RecSumm) | 1.5-2x | Compression offsets some cost |
| L19 (RecVerify) | 2-3x | Each verification level is ~0.7x |
| L20 (PEER) | 1.5-5x | Depends on replan count |
| L21 (PromptEvo) | 3-5x | Runs offline, amortized across loops |

### Budget Caps by Mode

| Mode | Max Recursive Layers Active | Max Total Depth (sum of all) | Token Budget |
|------|----------------------------|------------------------------|-------------|
| /production-upgrade | 2 | 6 | 100K per iteration |
| /auto-swarm medium | 2 | 8 | 150K per wave |
| /auto-swarm deep | 3 | 12 | 250K per wave |
| /omni-plan | 4 | 16 | 500K per iteration |
| /omni-plan-nth | 5 | 20 | 1M per iteration |

### Depth Safeguards

Every recursive template includes these non-negotiable guards:

```markdown
## Recursion Safety (applied to all recursive layers)

1. MAX_DEPTH is a HARD LIMIT. When reached, force resolution at current depth.
   Never increase MAX_DEPTH dynamically.

2. PROGRESS GUARANTEE: Each recursive step must be STRICTLY SMALLER than its parent.
   If a subtask is the same size as the parent, recursion has failed — abort and solve directly.

3. CONVERGENCE CHECK: If depth > 2 and improvement delta < threshold,
   stop early. More recursion will not help.

4. INFINITE LOOP DETECTION: If the same content appears at two different depths
   (output of depth N matches output of depth N-2), halt recursion.

5. TOKEN BUDGET: Track cumulative token usage. If recursive processing exceeds
   the mode's budget, force completion at current depth.
```

---

## Implementation Plan for ProductionOS

### New Files to Create

| File | Purpose |
|------|---------|
| `prompts/16-recursive-decomposition.md` | Layer 16 template |
| `prompts/17-self-refine.md` | Layer 17 template |
| `prompts/18-recursive-summarization.md` | Layer 18 template |
| `prompts/19-recursive-verification.md` | Layer 19 template |
| `prompts/20-peer.md` | Layer 20 template |
| `prompts/21-prompt-evolution.md` | Layer 21 template |
| `.productionos/PROMPT-EVOLUTION.md` | Artifact for Layer 21 tracking |

### Files to Update

| File | Change |
|------|--------|
| `prompts/README.md` | Add layers 16-21 to the index table |
| `templates/PROMPT-COMPOSITION.md` | Extend architecture diagram, composition function, application matrix |
| `CLAUDE.md` | Update prompt layer count (16 → 22), update layer list |
| `ARCHITECTURE.md` | Update 9-layer references to 13-layer |
| `agents/verification-gate.md` | Reference Layer 19 for L2/L3 verification |
| `agents/density-summarizer.md` | Reference Layer 18 for hierarchical mode |
| `agents/dynamic-planner.md` | Reference Layer 20 for PEER protocol |
| `agents/metaclaw-learner.md` | Reference Layer 21 for prompt evolution |
| `agents/decision-loop.md` | Document composition with Layer 20 |

---

## Sources

- [Recursive Language Models — MIT (2025)](https://arxiv.org/html/2512.24601v1)
- [ReCAP: Recursive Context-Aware Reasoning and Planning](https://arxiv.org/html/2510.23822)
- [MIT's Recursive Language Models Improve Performance on Long-Context Tasks](https://www.infoq.com/news/2026/01/mit-recursive-lm/)
- [Recursive Language Models: The Paradigm of 2026](https://www.primeintellect.ai/blog/rlm)
- [Self-Refine: Iterative Refinement with Self-Feedback](https://learnprompting.org/docs/advanced/self_criticism/self_refine)
- [Promptbreeder: Self-Referential Self-Improvement Via Prompt Evolution](https://arxiv.org/abs/2309.16797)
- [Recursive Introspection: Teaching Language Model Agents How to Self-Improve (NeurIPS 2024)](https://proceedings.neurips.cc/paper_files/paper/2024/file/639d992f819c2b40387d4d5170b8ffd7-Paper-Conference.pdf)
- [Chain of Density: GPT-4 Summarization](https://arxiv.org/abs/2309.04269)
- [Chain-of-Verification Reduces Hallucination in LLMs](https://arxiv.org/pdf/2309.11495)
- [Self-Verification Prompting](https://learnprompting.org/docs/advanced/self_criticism/self_verification)
- [Plan-and-Act: Improving Planning of Agents for Long-Horizon Tasks](https://arxiv.org/html/2503.09572v3)
- [Plan-and-Execute Agents — LangChain](https://blog.langchain.com/planning-agents/)
- [Planner-Executor Agentic Framework](https://www.emergentmind.com/topics/planner-executor-agentic-framework)
- [Advanced Decomposition Techniques for Improved Prompting in LLMs](https://learnprompting.org/docs/advanced/decomposition/introduction)
- [Meta Prompting Guide: Automated LLM Prompt Engineering](https://intuitionlabs.ai/articles/meta-prompting-automated-llm-prompt-engineering)
- [Introduction to Self-Criticism Prompting Techniques](https://learnprompting.org/docs/advanced/self_criticism/introduction)
- [Better Summarization with Chain of Density Prompting](https://www.prompthub.us/blog/better-summarization-with-chain-of-density-prompting)
