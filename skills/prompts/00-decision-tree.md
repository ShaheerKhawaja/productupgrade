---
name: decision-tree
description: "Dynamic Decision Tree protocol for ProductUpgrade pipeline. Implements the meta-reasoning control plane that classifies codebases, selects execution strategy, routes between modes (/plan, /code-review, /research, /qa), enforces anti-thrash rules, and adapts prompt composition per agent. The 'brain' that makes the pipeline autonomous."
---

# Dynamic Decision Tree — Control Plane Protocol

## Core Principle

The ProductUpgrade decision tree is NOT a static flowchart. It is an **emergent routing system** built by the meta-reasoning layer at runtime. The orchestrator classifies the codebase, selects a strategy, and routes execution through modes — adapting the route as new information is discovered.

Traditional pipelines: Step 1 → Step 2 → Step 3 (fixed).
ProductUpgrade: CLASSIFY → SELECT → ROUTE → EVALUATE → RE-ROUTE (adaptive).

---

## Phase 1: Codebase Classification → Strategy Selection

The decision tree begins with codebase classification (from Meta-Prompting Layer 2).
The classification determines which execution strategy and prompt intensity to use.

```
CLASSIFICATION → STRATEGY MAPPING:

Architecture × Maturity → Mode Selection:
┌──────────────────┬───────────┬──────────┬──────────┬──────────┐
│                  │ Prototype │ Early    │ Growth   │ Mature   │
├──────────────────┼───────────┼──────────┼──────────┼──────────┤
│ Monolith         │ auto(S)   │ auto(M)  │ standard │ deep     │
│ Modular Monolith │ auto(S)   │ standard │ standard │ deep     │
│ Microservices    │ auto(M)   │ standard │ deep     │ deep     │
│ Serverless       │ auto(S)   │ auto(M)  │ standard │ standard │
│ Hybrid           │ standard  │ standard │ deep     │ deep     │
└──────────────────┴───────────┴──────────┴──────────┴──────────┘

Primary Concern → Dimension Priority:
┌──────────────────┬───────────────────────────────────────┐
│ Concern          │ Prioritized Dimensions                 │
├──────────────────┼───────────────────────────────────────┤
│ Correctness      │ Tests > Error Handling > Code Quality  │
│ Performance      │ Performance > Observability > Deploy   │
│ Security         │ Security > Error Handling > Deploy     │
│ User Experience  │ UX/UI > Accessibility > Performance   │
│ Dev Experience   │ Documentation > Code Quality > Tests   │
│ Reliability      │ Deploy > Observability > Error Handling│
└──────────────────┴───────────────────────────────────────┘

Data Sensitivity → Emotion Intensity Floor:
┌──────────────────┬──────────────────────┐
│ Sensitivity      │ Minimum Intensity     │
├──────────────────┼──────────────────────┤
│ Public           │ Level 3               │
│ Standard         │ Level 4               │
│ Sensitive        │ Level 6               │
│ Regulated        │ Level 8               │
└──────────────────┴──────────────────────┘
```

---

## Phase 2: Mode Transition State Machine

The pipeline can transition between 4 execution modes based on what it discovers.

```
STATE MACHINE:

┌──────────────┐     understanding_ok     ┌──────────────┐
│  RESEARCH    │ ────────────────────────→ │   REVIEW     │
│  (understand)│                           │  (enrich)    │
└──────────────┘                           └──────┬───────┘
       ↑                                          │
       │ gaps_found                               │ enrichment_ok
       │                                          ▼
┌──────┴───────┐     fixes_done           ┌──────────────┐
│    LEARN     │ ←─────────────────────── │  EVALUATE    │
│  (persist)   │                           │  (judge)     │
└──────┬───────┘                           └──────┬───────┘
       │                                          │
       │ next_iteration                           │ action_items
       │                                          ▼
       │                                   ┌──────────────┐
       └──────────────────────────────────→│    FIX       │
                                            │ (implement)  │
                                            └──────┬───────┘
                                                   │
                                              ┌────┴────┐
                                              │ PASS?   │
                                              └────┬────┘
                                             yes   │   no
                                        ┌──────┐   │   ┌──────────┐
                                        │LEARN │←──┘──→│SELF-HEAL │
                                        └──────┘       └──────────┘
```

### Mode Transition Rules

```yaml
TRANSITIONS:

  # When to enter RESEARCH mode (deep investigation)
  enter_research:
    triggers:
      - unknown_library_detected: true
      - deprecated_api_in_use: true
      - competitor_comparison_needed: true
      - best_practice_unclear: true
      - confidence_on_any_dimension < 0.5
    actions:
      - query context7 for library documentation
      - query /mem-search for prior learnings
      - if depth >= deep: use WebSearch + WebFetch
      - save findings to .productupgrade/DISCOVERY/

  # When to enter PLAN mode (architectural reasoning)
  enter_plan:
    triggers:
      - architecture_issues_detected: true
      - complexity_score > 7 (from meta-classification)
      - cross_cutting_concern_found: true
      - fix_requires_changes_to > 5 files
      - GoT cycle detected: true
      - Branch C (unexpected) scored highest in ToT
    actions:
      - enter /plan mode for strategic thinking
      - produce architectural recommendation
      - identify dependencies and ordering
      - get plan approval before proceeding to code

  # When to enter CODE-REVIEW mode (implementation)
  enter_code_review:
    triggers:
      - specific_bugs_found: true
      - single_file_fixes_available: true
      - lint_or_type_errors_present: true
      - plan_approved: true
      - fix_complexity <= M
    actions:
      - implement fixes in parallel batches (max 7)
      - run validation gate after each batch
      - commit per batch on pass
      - log to .productupgrade/EXECUTION/UPGRADE-LOG.md

  # When to enter QA mode (testing and verification)
  enter_qa:
    triggers:
      - web_app_detected: true
      - user_facing_changes_made: true
      - after_fix_batch_complete: true
      - regression_risk_high: true (changes to shared code)
    actions:
      - run /qa skill for systematic testing
      - launch frontend-scraper for screenshots
      - compare before/after for regression
      - run performance comparison (Lighthouse)

  # When to CYCLE plan → code
  plan_to_code:
    triggers:
      - plan_approved_by_meta_layer: true
      - independent_fixes_identified: true
      - no_blocking_dependencies_remain: true
    guard: plan must be saved to UPGRADE-PLAN.md first

  # When to CYCLE code → plan
  code_to_plan:
    triggers:
      - fix_revealed_deeper_issue: true
      - scope_creep_detected: true
      - architectural_change_needed: true
      - fix_complexity > L
    guard: current fixes must be committed or stashed first
```

---

## Phase 3: Anti-Thrash Protection

Mode transitions are expensive (context switching, state saving). The decision tree
enforces limits to prevent thrashing.

```
ANTI-THRASH RULES:

RULE 1 — Maximum 3 mode switches per iteration
  Counter: mode_switch_count (reset at start of each iteration)
  If exceeded: commit current state and proceed to VERIFY
  Rationale: More than 3 switches means the issue is too complex
  for the current iteration — defer deeper investigation

RULE 2 — Minimum 2 minutes in each mode before switching
  Guard: timestamp of last mode entry
  If violated: "Stay in current mode. You haven't explored enough."
  Exception: P0 finding discovery triggers immediate switch regardless

RULE 3 — No oscillation (A → B → A → B)
  Detection: track last 4 mode transitions
  If pattern detected: lock into the higher-priority mode
  Priority order: RESEARCH > PLAN > CODE-REVIEW > QA

RULE 4 — Mandatory checkpoint before every switch
  Before switching: save current state to CHECKPOINT file
  Format: .productupgrade/EXECUTION/CHECKPOINT-{iter}-{switch}.md
  Content: what was done, what remains, why switching

RULE 5 — Justify every switch
  Every mode transition must include:
  - trigger_condition: which trigger fired
  - current_state: what was accomplished in current mode
  - expected_benefit: what the new mode will achieve
  - rollback_plan: how to return if the switch was wrong
```

---

## Phase 4: Prompt Composition Routing

The decision tree selects which prompt layers to activate for each agent.

```
PROMPT COMPOSITION BY MODE:

AUTO MODE:
  Layers active: NONE (raw agent prompts for speed)
  Exception: Emotion Level 2 on security-related agents

STANDARD MODE:
  Layers active: Emotion (Level 3-5), CoT, CoD
  Inactive: Meta, ToT, GoT, Context Retrieval
  Rationale: Good quality without the overhead of full composition

DEEP MODE:
  Layers active: ALL 7 layers
  Emotion: Level 5-10 (phase-dependent)
  Meta: Full classification + assumption inventory
  Context: Full 5-source retrieval
  CoT: Mandatory 5-step protocol
  ToT: Conditional (activates on uncertainty)
  GoT: Full graph construction
  CoD: All 3 passes

SWARM MODE:
  Layers active: Emotion, Meta, Context, CoT, CoD
  Inactive: ToT, GoT (swarm-level aggregation replaces these)
  Rationale: Individual swarm agents do linear analysis;
  the swarm orchestrator does branching and graph construction

PROMPT COMPOSITION BY AGENT TYPE:

  Discovery agents (researchers, scanners):
    Emotion: Level 4-5
    Meta: Strategy selection only (no assumption inventory)
    Context: Sources 1, 2, 3 (artifacts, memory, library docs)
    CoT: Steps 1-3 only (observe, analyze, impact — no fix)
    ToT: Inactive (linear research, not evaluation)
    GoT: Edge tagging only (no graph construction)
    CoD: Pass 1 only (skeletal findings)

  Review agents (CEO, engineering, design):
    Emotion: Level 5-7
    Meta: Full classification + blind spots
    Context: All 5 sources
    CoT: All 5 steps
    ToT: Active on P0/P1 findings
    GoT: Edge tagging + cluster detection
    CoD: Pass 1 + Pass 2

  Judge agent:
    Emotion: Level 9 (ACCOUNTABILITY)
    Meta: Full classification + calibration
    Context: Convergence log + reflexion memory
    CoT: All 5 steps with extra validation
    ToT: Active on ALL dimensions
    GoT: Full graph scoring
    CoD: All 3 passes + handoff document

  Fix agents:
    Emotion: Level 4-6
    Meta: Assumption inventory only
    Context: Reflexion memory (CRITICAL) + upgrade plan
    CoT: Steps 1, 2, 5 (observe, analyze, fix — skip impact/severity)
    ToT: Inactive (fix is determined, don't re-evaluate)
    GoT: Check blocking dependencies only
    CoD: Pass 3 only (action summary of what was done)
```

---

## Phase 5: Convergence Decision Protocol

The decision tree's final responsibility: determine whether to continue or stop.

```
CONVERGENCE DECISION TREE:

INPUT:
  - current_grade: float (0-10)
  - target_grade: float (8.0 for standard, 10.0 for deep)
  - delta: float (change from previous iteration)
  - previous_delta: float (change from iteration before that)
  - dimension_scores: dict[str, float]
  - previous_dimension_scores: dict[str, float]
  - iteration: int
  - max_iterations: int

DECISION LOGIC:

  IF current_grade >= target_grade:
    → VERDICT: SUCCESS
    → Action: Produce final report and certification

  ELIF delta < 0.15 AND previous_delta < 0.15:
    → VERDICT: CONVERGED
    → Action: Plateaued. Produce gap analysis for remaining improvements.
    → Note: 2 consecutive iterations with < 0.15 improvement

  ELIF iteration >= max_iterations:
    → VERDICT: MAX_REACHED
    → Action: Produce report with remaining gaps. Request human decision.

  ELIF any(current_dim - prev_dim < -0.5 for dim in dimensions):
    → VERDICT: DEGRADED
    → Action: HALT. Rollback last batch. Investigate regression.
    → Identify which fix caused the regression.
    → Log to reflexion memory: "Fix {id} caused regression in {dimension}"

  ELIF any(dimension_oscillated_3_times(dim) for dim in dimensions):
    → VERDICT: OSCILLATING
    → Action: Lock the oscillating dimension. Focus elsewhere.
    → Log: "Dimension {name} is oscillating — locked at current score"

  ELSE:
    → VERDICT: CONTINUE
    → Action: Identify 2 weakest dimensions for next iteration focus

STUCK PROTOCOLS:
  IF grade stuck at 9.x for 2 iterations:
    → Focus ALL agents on the single lowest dimension
    → Switch all agents to DFS search strategy

  IF grade stuck at 8.x for 2 iterations:
    → Re-run deep research on weakest 2 dimensions
    → Query /mem-search for "how to improve {dimension} in {tech_stack}"

  IF grade stuck at 7.x for 2 iterations:
    → Challenge assumptions — is the rubric right for this codebase?
    → Run meta-discover-dimensions to check for missing quality dimensions

  IF grade stuck at 6.x or below for 2 iterations:
    → Fundamental architecture issues
    → Switch to /plan mode for full architectural review
    → May need to restructure before individual fixes can improve scores
```

---

## Phase 6: Configuration Integration

The decision tree reads from `.productupgrade.yml` for project-specific overrides:

```yaml
# .productupgrade.yml — Project-specific configuration
target: .
mode: deep  # Override default mode

# Convergence tuning
convergence:
  target_grade: 9.0       # Override default (10.0 for deep)
  delta_threshold: 0.15   # Minimum improvement to continue
  max_iterations: 5       # Override max
  consecutive_threshold: 2 # How many low-delta iterations = converged

# Dimension configuration
dimensions:
  focus: [security, performance]    # Only evaluate these (empty = all)
  skip: [accessibility]             # Skip these dimensions
  weights:                          # Custom weights for overall grade
    security: 2.0
    code_quality: 1.5
    performance: 1.5
    deployment_safety: 1.0

# Prompt composition overrides
prompts:
  emotion_floor: 6          # Minimum emotion level (for regulated data)
  skip_tot: false            # Disable Tree of Thought
  skip_got: false            # Disable Graph of Thought
  custom_rubric: ./RUBRIC-CUSTOM.md  # Project-specific rubric

# Agent selection overrides
agents:
  disable: [frontend-scraper]  # Skip agents not relevant
  enable_extra: []              # Add custom agents

# Cost budgets
budgets:
  max_tokens_per_session: 2000000
  max_agents_per_iteration: 14
  max_web_fetches: 500

# Validation gate overrides
validation:
  lint_cmd: "npm run lint"      # Override detected command
  test_cmd: "npm run test:ci"
  type_cmd: "npx tsc --noEmit"
  skip_tests: false             # Emergency override

# Output
output:
  verbose: true                 # Include CoD Pass 1+2+3 (not just Pass 3)
  save_graphs: true             # Save thought graphs
  save_screenshots: true        # Save frontend screenshots
```

---

## Composition Interface

The Decision Tree is not a prompt layer — it is the CONTROL PLANE that selects and composes the layers. It sits ABOVE the 7 layers and decides which ones activate for each agent.

```
HIERARCHY:

  ┌──────────────────────────────────────┐
  │  DECISION TREE (this protocol)        │  ← Control plane
  │  Classifies → Selects → Routes        │
  └──────────────┬───────────────────────┘
                 │
                 │  Selects which layers to activate
                 ▼
  ┌──────────────────────────────────────┐
  │  7-LAYER PROMPT COMPOSITION           │  ← Data plane
  │  1. Emotion  2. Meta  3. Context      │
  │  4. (Role)   5. CoT   6. ToT          │
  │  7. GoT      8. CoD                   │
  └──────────────────────────────────────┘
                 │
                 │  Composed prompt injected into
                 ▼
  ┌──────────────────────────────────────┐
  │  AGENT EXECUTION                      │  ← Execution plane
  │  20 specialized agents                │
  └──────────────────────────────────────┘
```

The decision tree is referenced by the SKILL.md and the orchestrator command. It is the missing link between "what the pipeline can do" and "what it SHOULD do for THIS specific codebase."

## Anti-Patterns

1. **Never use a static mode for all codebases.** A prototype and a mature monolith need fundamentally different evaluation strategies.
2. **Never switch modes without a checkpoint.** Lost state = lost work.
3. **Never exceed 3 mode switches per iteration.** More switches = thrashing, not progress.
4. **Never apply all 7 prompt layers in auto mode.** The overhead defeats the purpose of fast execution.
5. **Never ignore stuck protocols.** If the grade isn't moving, the approach must change. Repeating the same strategy and expecting different results is the definition of the problem.
6. **Never override convergence criteria without explicit human approval.** The thresholds exist to prevent infinite loops.
