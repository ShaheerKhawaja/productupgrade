# ProductUpgrade V2 — Autonomous Self-Learning Pipeline

## Design Specification
**Author:** Shaheer Khawaja / EntropyandCo
**Date:** 2026-03-17
**Version:** 2.0.0

---

## Executive Summary

ProductUpgrade V2 transforms from a linear 54-agent pipeline into an **autonomous self-learning cognitive architecture** with three execution modes, advanced prompting composition (CoT + ToT + GoT + CoD + Emotion Prompting), dynamic decision tree routing, and RAG-powered context retrieval across iteration boundaries.

The core innovation: the decision tree is not pre-defined — it is **emergent**. Meta-prompting within Tree of Thought reasoning creates dynamic reasoning chains. The system virtualizes multiple evaluation personas (technical, human-impact, meta-reasoning) that spawn and merge thought graphs based on what they discover.

---

## Three Execution Modes

### Mode 1: `/auto` — Intelligent Auto-Selector
**Purpose:** Fastest path to improvement. Zero configuration.

**Behavior:**
1. Analyzes codebase in 30 seconds (tech stack, size, complexity, test coverage)
2. Dynamically selects which agents/phases are needed based on findings
3. Runs selected agents in parallel — skips irrelevant phases entirely
4. Produces focused improvement with minimum agent dispatches

**Decision Logic:**
```
ANALYZE codebase → CLASSIFY complexity (S/M/L/XL)
  S (< 500 LOC): Run 3 agents (code-review, naming, dependency)
  M (500-5K LOC): Run 7 agents (Phase 1-2 only, no recursion)
  L (5K-50K LOC): Run full pipeline, 3 iterations max
  XL (50K+ LOC): Run deep mode automatically

IF has_frontend → ADD ux-auditor, gui-audit
IF has_api → ADD api-contract-validator
IF has_database → ADD database-auditor
IF has_business_logic → ADD business-logic-validator
IF last_commit < 7_days → FOCUS on recent changes only
```

**When to use:** Quick improvements, CI/CD integration, daily code hygiene.

---

### Mode 2: `/standard` — Current Pipeline (Enhanced)
**Purpose:** The proven 6-phase pipeline with recursive convergence.

**Behavior:** Identical to current V1 with these enhancements:
- Context7 MCP integration for live library doc verification during code review
- Chain of Density summaries between phases (not just between iterations)
- Memory persistence via `/mem-search` — learnings carry across sessions
- Emotion Prompting on all judge evaluations (+8-15% accuracy boost)

**When to use:** Standard product upgrades, sprint-end cleanup, pre-release hardening.

---

### Mode 3: `/deep` — Autonomous Self-Learning Engine
**Purpose:** Maximum depth. The system teaches itself how to improve.

**Architecture:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DEEP MODE — COGNITIVE ARCHITECTURE                    │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  META-REASONING LAYER (Orchestrator)                              │  │
│  │  - Dynamic decision tree (emergent, not pre-defined)              │  │
│  │  - Mode switching: /plan ↔ /code-review ↔ /research ↔ /qa       │  │
│  │  - Context retrieval: /mem-search + context7 + file artifacts     │  │
│  │  - Compaction management: /compact between heavy iterations       │  │
│  │  - /effort max at launch                                          │  │
│  └────────────────────────┬─────────────────────────────────────────┘  │
│                           │                                             │
│  ┌────────────────────────▼─────────────────────────────────────────┐  │
│  │  ITERATION LAYER (7 loops with progressive deepening)             │  │
│  │                                                                    │  │
│  │  Loop 1: UNDERSTAND                                                │  │
│  │    ├─ Deep Research (/deep-research + context7 + web)             │  │
│  │    ├─ Codebase Mapping (architecture, patterns, anti-patterns)    │  │
│  │    ├─ Vulnerability Exploration (security, dependency, logic)     │  │
│  │    ├─ Frontend Scraping (Playwright screenshots + Lighthouse)     │  │
│  │    └─ Memory Retrieval (/mem-search for prior session learnings)  │  │
│  │                                                                    │  │
│  │  Loop 2: ENRICH                                                    │  │
│  │    ├─ /plan-ceo-review (3 modes: expand/hold/reduce)              │  │
│  │    ├─ /plan-eng-review (architecture + robustness)                │  │
│  │    ├─ Competitor Analysis (scrape + compare)                      │  │
│  │    ├─ Library Doc Verification (context7 for every dependency)    │  │
│  │    └─ Cross-Reference Graph (GoT: merge findings into network)   │  │
│  │                                                                    │  │
│  │  Loop 3: EVALUATE                                                  │  │
│  │    ├─ LLM-as-Judge (10 dimensions, evidence-based)                │  │
│  │    ├─ Adversarial Review (agent critiques judge's findings)       │  │
│  │    ├─ Human Impact Assessment (perceived benefit scoring)         │  │
│  │    ├─ Technical Debt Quantification (hours-to-fix estimation)     │  │
│  │    └─ Chain of Density summary → saved as retrievable artifact    │  │
│  │                                                                    │  │
│  │  Loop 4: FIX (with /plan ↔ /code-review cycling)                 │  │
│  │    ├─ /plan mode: Strategic fix planning for P0/P1 items          │  │
│  │    ├─ /code-review mode: Implement fixes in parallel batches      │  │
│  │    ├─ Self-healing gate: lint + type + test after each batch      │  │
│  │    ├─ Cross-evaluation: separate agent verifies each fix          │  │
│  │    └─ Commit per batch with validation                            │  │
│  │                                                                    │  │
│  │  Loop 5: VERIFY                                                    │  │
│  │    ├─ /qa (gstack QA with health scoring)                         │  │
│  │    ├─ Frontend test runs (Playwright E2E on affected routes)      │  │
│  │    ├─ Regression detection (compare before/after screenshots)     │  │
│  │    ├─ Performance comparison (Lighthouse before/after)            │  │
│  │    └─ Business logic validation (rules traced through code)       │  │
│  │                                                                    │  │
│  │  Loop 6: LEARN                                                     │  │
│  │    ├─ Save successful patterns to /mem-search                     │  │
│  │    ├─ Extract reusable insights (continuous-learning skill)       │  │
│  │    ├─ Update decision tree weights based on what worked           │  │
│  │    ├─ /compact context + retrieve dense summaries                 │  │
│  │    └─ Feed learnings into next iteration focus                    │  │
│  │                                                                    │  │
│  │  Loop 7: CONVERGE                                                  │  │
│  │    ├─ Final LLM-as-Judge scoring (target: 10/10)                  │  │
│  │    ├─ Remaining gap analysis (what prevents 10/10?)               │  │
│  │    ├─ Targeted micro-fixes for remaining gaps                     │  │
│  │    ├─ Production readiness certification                          │  │
│  │    └─ Final report with convergence trajectory                    │  │
│  │                                                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  PROMPTING COMPOSITION LAYER                                       │  │
│  │                                                                    │  │
│  │  Every agent prompt composes these techniques:                     │  │
│  │                                                                    │  │
│  │  1. Chain of Thought (CoT)                                         │  │
│  │     └─ Step-by-step reasoning before conclusions                  │  │
│  │     └─ <think> blocks for intermediate reasoning                  │  │
│  │     └─ "First work out your own solution, then evaluate"          │  │
│  │                                                                    │  │
│  │  2. Tree of Thought (ToT)                                         │  │
│  │     └─ Minimum 3 branches per evaluation dimension                │  │
│  │     └─ Branch A: THE OBVIOUS (literal finding)                    │  │
│  │     └─ Branch B: THE SYSTEMIC (root cause analysis)               │  │
│  │     └─ Branch C: THE UNEXPECTED (non-obvious implication)         │  │
│  │     └─ Score each branch, select highest, backtrack if needed     │  │
│  │                                                                    │  │
│  │  3. Graph of Thought (GoT)                                        │  │
│  │     └─ Findings from multiple agents form a thought GRAPH         │  │
│  │     └─ Nodes = individual findings (with file:line evidence)      │  │
│  │     └─ Edges = relationships (causes, blocks, amplifies)          │  │
│  │     └─ Aggregation: merge overlapping findings                    │  │
│  │     └─ Cycle detection: finding A causes B which causes A         │  │
│  │                                                                    │  │
│  │  4. Chain of Density (CoD)                                        │  │
│  │     └─ 3-pass summary refinement between iterations               │  │
│  │     └─ Pass 1: Skeletal (what happened)                           │  │
│  │     └─ Pass 2: Evidence-rich (file:line citations)                │  │
│  │     └─ Pass 3: Action-loaded (what to do about it)                │  │
│  │     └─ Density metric: findings-per-100-tokens                    │  │
│  │                                                                    │  │
│  │  5. Emotion Prompting                                              │  │
│  │     └─ Applied to ALL judge evaluations                           │  │
│  │     └─ "This evaluation determines the quality of a product       │  │
│  │        that real users depend on. Take a deep breath, consider    │  │
│  │        the human impact, and be thorough."                        │  │
│  │     └─ "You are the last line of defense. If you miss a           │  │
│  │        security issue, real people get hurt."                     │  │
│  │     └─ Research shows 8-15% accuracy improvement                  │  │
│  │                                                                    │  │
│  │  6. Meta-Prompting                                                 │  │
│  │     └─ Reasoning about reasoning                                  │  │
│  │     └─ "Before evaluating, decide WHICH evaluation approach       │  │
│  │        is most appropriate for this specific codebase"            │  │
│  │     └─ Dynamic persona spawning based on what's discovered        │  │
│  │     └─ The decision tree itself is a prompt output                │  │
│  │                                                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  CONTEXT RETRIEVAL LAYER (RAG-in-Pipeline)                         │  │
│  │                                                                    │  │
│  │  Before each major phase, retrieve relevant context:               │  │
│  │                                                                    │  │
│  │  1. /mem-search — Pull learnings from prior sessions               │  │
│  │     └─ "What did we learn about this codebase last time?"         │  │
│  │     └─ "What patterns have worked for similar codebases?"         │  │
│  │                                                                    │  │
│  │  2. context7 MCP — Live library documentation                      │  │
│  │     └─ Verify every API call against current docs                 │  │
│  │     └─ Check for deprecated patterns                              │  │
│  │     └─ Validate configuration against latest best practices       │  │
│  │                                                                    │  │
│  │  3. File Artifacts — Dense summaries from previous iterations      │  │
│  │     └─ .productupgrade/ITERATION-{N}-SUMMARY.md                   │  │
│  │     └─ .productupgrade/THOUGHT-GRAPH-{N}.md                       │  │
│  │     └─ .productupgrade/LEARNINGS-{N}.md                           │  │
│  │                                                                    │  │
│  │  4. /compact — Context window management                           │  │
│  │     └─ Compact after iterations 2, 4, 6                           │  │
│  │     └─ Before compaction: save dense CoD summary                  │  │
│  │     └─ After compaction: retrieve summary + continue              │  │
│  │                                                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Dynamic Decision Tree

The decision tree is not a static flowchart — it's an **emergent graph** built by the meta-reasoning layer at runtime. Here's the state machine that governs transitions:

```
┌──────────────┐     understanding_complete     ┌──────────────┐
│  UNDERSTAND  │ ─────────────────────────────→ │   ENRICH     │
│  (research)  │                                 │  (review)    │
└──────────────┘                                 └──────┬───────┘
       ↑                                                │
       │ gaps_found                                     │ enrichment_complete
       │                                                ▼
┌──────┴───────┐     fixes_implemented          ┌──────────────┐
│    LEARN     │ ←───────────────────────────── │  EVALUATE    │
│  (persist)   │                                 │  (judge)     │
└──────┬───────┘                                 └──────┬───────┘
       │                                                │
       │ ready_for_next                                 │ action_items_found
       │                                                ▼
       │                                         ┌──────────────┐
       └────────────────────────────────────────→│    FIX       │
                                                  │ (implement)  │
                                                  └──────┬───────┘
                                                         │
                                                         │ fixes_complete
                                                         ▼
                                                  ┌──────────────┐
                                                  │   VERIFY     │
                                                  │  (test/qa)   │
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

### Mode Switching Logic

The meta-reasoning layer decides which mode to enter based on findings:

```yaml
# Dynamic mode switching rules
mode_transitions:
  # When to enter /plan mode
  enter_plan:
    - architecture_issues_detected: true
    - complexity_score > 7
    - cross_cutting_concern_found: true
    - fix_requires_multiple_files > 5

  # When to enter /code-review mode
  enter_code_review:
    - specific_bugs_found: true
    - single_file_fixes_available: true
    - lint_type_errors_present: true
    - after_plan_approved: true

  # When to enter /research mode
  enter_research:
    - unknown_library_detected: true
    - deprecated_api_in_use: true
    - competitor_comparison_needed: true
    - best_practice_unclear: true

  # When to enter /qa mode
  enter_qa:
    - web_app_detected: true
    - after_fix_batch_complete: true
    - user_facing_changes_made: true
    - regression_risk_high: true

  # When to cycle /plan → /code-review
  plan_to_code:
    - plan_approved_by_meta_layer: true
    - independent_fixes_identified: true
    - no_blocking_dependencies: true

  # When to cycle /code-review → /plan
  code_to_plan:
    - fix_revealed_deeper_issue: true
    - scope_creep_detected: true
    - architectural_change_needed: true
```

---

## Virtualized Evaluation Personas

Each evaluation spawns **three virtual personas** that assess from different angles:

### Persona 1: Technical Evaluator
```
<persona type="technical">
You are a senior staff engineer with 15 years of experience.
You evaluate code for correctness, efficiency, security, and maintainability.
Your question: "Is this code correct, efficient, and safe?"
Your evidence standard: file:line citations, reproducible test cases.
</persona>
```

### Persona 2: Human Impact Assessor
```
<persona type="human_impact">
You are a product manager who deeply understands user experience.
You evaluate code for its effect on real users — not just "does it work"
but "what does it feel like when this code runs?"
Your question: "Does this make the user's life better?"
Your evidence standard: User journey mapping, perceived latency, error UX.
</persona>
```

### Persona 3: Meta-Reasoning Coordinator
```
<persona type="meta">
You are the reasoning-about-reasoning layer.
You don't evaluate code directly — you evaluate whether the OTHER personas
are asking the right questions and using the right methods.
Your question: "Are we even looking at this correctly?"
Your evidence standard: Are evaluations covering blind spots?
Are we victim to confirmation bias? What are we NOT checking?
</persona>
```

### Persona Interaction Protocol
```
1. Technical Evaluator produces findings with CoT reasoning
2. Human Impact Assessor reframes findings through user lens
3. Meta-Reasoning Coordinator checks for blind spots and bias
4. All three vote on final score (2/3 majority required)
5. If disagreement: spawn ToT branches to explore each perspective
6. GoT merges the resulting thought branches into unified finding
```

---

## New Sub-Agents

### Agent: `thought-graph-builder.md`
Builds and maintains the Graph of Thought across iterations.
- Ingests findings from all review agents
- Creates nodes (findings) with edges (relationships)
- Detects cycles (A causes B causes A → systemic issue)
- Merges overlapping findings (deduplication)
- Produces `.productupgrade/THOUGHT-GRAPH-{N}.md`

### Agent: `context-retriever.md`
RAG-in-pipeline agent that manages context retrieval.
- Queries /mem-search for prior session learnings
- Fetches library docs via context7 MCP
- Reads file artifacts from previous iterations
- Produces context injection payload for each phase
- Manages /compact boundaries and summary persistence

### Agent: `persona-orchestrator.md`
Manages the three virtualized evaluation personas.
- Spawns Technical, Human Impact, and Meta personas
- Coordinates voting protocol
- Resolves disagreements via ToT branching
- Merges persona findings via GoT aggregation
- Tracks persona accuracy across iterations (which persona catches more real issues?)

### Agent: `adversarial-reviewer.md`
Red-team agent that challenges all findings.
- Receives fix proposals from planning agents
- Attempts to find flaws, regressions, or unintended consequences
- Uses "assume this fix is wrong" framing
- Produces counter-evidence that must be addressed before fix is applied
- Inspired by Constitutional AI self-critique pattern

### Agent: `density-summarizer.md`
Chain of Density specialist for inter-iteration summaries.
- 3-pass refinement: skeletal → evidence-rich → action-loaded
- Measures information density (findings per 100 tokens)
- Produces retrievable artifacts for post-compaction context
- Maintains CONVERGENCE-LOG with grade trajectory

### Agent: `frontend-scraper.md`
Local frontend capture and test agent.
- Launches dev server if not running
- Captures screenshots at 3 breakpoints (mobile/tablet/desktop)
- Runs Lighthouse audits (performance, a11y, best practices, SEO)
- Compares before/after screenshots for visual regression
- Produces `.productupgrade/screenshots/` directory

### Agent: `vulnerability-explorer.md`
Deep security and vulnerability analysis.
- Uses /deep-research for known vulnerability patterns
- Scans for OWASP Top 10 in application context
- Checks dependency tree for transitive vulnerabilities
- Tests authentication and authorization boundaries
- Produces attack surface map

---

## Prompt Composition Templates

### Base Template (Applied to ALL Agents)

```markdown
<system_prompt>
<emotion_prompt>
This evaluation is critical. Real users depend on the quality of this product.
Take a deep breath and approach this with the thoroughness it deserves.
Your findings will directly impact whether bugs reach production.
</emotion_prompt>

<meta_prompt>
Before beginning your evaluation, first determine:
1. What is the most effective approach for THIS specific codebase?
2. What assumptions are you making that could be wrong?
3. What blind spots might you have given your evaluation angle?
Document your meta-reasoning in a <meta_think> block.
</meta_prompt>

<cot_prompt>
For each finding, use this reasoning chain:
<think>
Step 1: OBSERVE — What specific code pattern do you see? (cite file:line)
Step 2: ANALYZE — Why is this a problem? What's the root cause?
Step 3: IMPACT — Who does this affect and how? (technical + human)
Step 4: SEVERITY — How urgent is this? (P0/P1/P2/P3)
Step 5: FIX — What's the minimal change that resolves this?
</think>
</cot_prompt>

<tot_prompt>
For complex findings, explore multiple evaluation branches:
Branch A (THE OBVIOUS): The literal, surface-level interpretation
Branch B (THE SYSTEMIC): The root cause that creates this symptom
Branch C (THE UNEXPECTED): The non-obvious downstream consequence

Score each branch on: accuracy (0-10), impact (0-10), actionability (0-10)
Select highest-scoring branch. If Branch C scores highest, investigate deeper.
</tot_prompt>

<got_prompt>
Connect your findings to the thought graph:
- Does this finding RELATE to any previous finding? (edge: related_to)
- Does this finding CAUSE another issue? (edge: causes)
- Does this finding BLOCK a fix? (edge: blocks)
- Does this finding AMPLIFY another problem? (edge: amplifies)
Record edges in format: EDGE: {finding_id} --{type}--> {finding_id}
</got_prompt>

<cod_prompt>
After completing your evaluation, produce a 3-pass summary:
Pass 1 (SKELETAL): What you found, in one sentence per finding
Pass 2 (EVIDENCE): Add file:line citations and confidence scores
Pass 3 (ACTION): Add specific fix instructions and priority
Each pass must be denser than the previous. Measure: findings per 100 tokens.
</cod_prompt>

<context_retrieval>
Before starting, check these context sources:
1. Previous iteration summary: .productupgrade/ITERATION-{N-1}-SUMMARY.md
2. Thought graph: .productupgrade/THOUGHT-GRAPH-{N-1}.md
3. Memory: Use /mem-search for "{relevant_query}"
4. Library docs: Use context7 for any library you're unsure about
</context_retrieval>
</system_prompt>
```

---

## Convergence Criteria (Target: 10/10)

The target is ALWAYS 10/10. Never less, never more.

```yaml
convergence:
  target_grade: 10.0
  max_iterations: 7

  # What 10/10 means for each dimension
  ten_out_of_ten:
    code_quality: "Exemplary — would show to new hires as reference. Zero dead code,
                   consistent patterns, every function < 30 lines, no TODO/FIXME."
    security: "Hardened — rate limiting, WAF-ready, SOC 2 patterns, no secrets in code,
               all inputs validated, CSRF/XSS/SQLi impossible."
    performance: "Edge-optimized — p99 < 200ms, lazy loading everywhere, CDN-cached,
                  zero N+1 queries, bundle < 200KB gzipped."
    ux_ui: "Delightful — users say 'oh nice, they thought of that'. Loading states,
            empty states, error recovery, animations purposeful not decorative."
    test_coverage: "95%+ with mutation testing. Unit + integration + E2E + property-based.
                    Every edge case tested. Chaos engineering for critical paths."
    accessibility: "AAA + professional audit. Screen reader tested, keyboard navigable,
                    4.5:1 contrast, 44px touch targets, reduced motion supported."
    documentation: "Interactive — onboarding guide, API playground, architecture decisions
                    documented with 'why' not just 'what', runbooks for ops."
    error_handling: "Self-healing — automatic retry with backoff, circuit breakers,
                     graceful degradation, alerting before users notice."
    observability: "Full stack — structured logging, distributed tracing, SLOs defined,
                    dashboards for every service, runbooks linked to alerts."
    deployment_safety: "Blue-green with traffic shifting, feature flags, canary analysis,
                        automated rollback on error rate spike, chaos tested."

  # Stopping rules
  stop_conditions:
    - grade >= 10.0  # SUCCESS — perfect score achieved
    - delta < 0.15 for 2 consecutive iterations  # CONVERGED — plateaued
    - iteration >= 7  # MAX_REACHED — budget exhausted
    - any_dimension_decreased  # DEGRADED — investigate immediately

  # What to do when stuck below 10
  stuck_protocol:
    - If stuck at 9.x: Focus ALL agents on the single lowest dimension
    - If stuck at 8.x: Re-run deep research on weakest 2 dimensions
    - If stuck at 7.x: Challenge assumptions — is the rubric wrong for this codebase?
    - If stuck at 6.x or below: Fundamental architecture issues — switch to /plan mode
```

---

## /plan ↔ /code-review Cycling Protocol

```
┌─────────────────────────────────────────────────────────────────┐
│                 PLAN ↔ CODE-REVIEW CYCLE                         │
│                                                                   │
│  ┌──────────┐     architecture_ok      ┌──────────────┐         │
│  │  /plan   │ ──────────────────────→  │ /code-review │         │
│  │  mode    │                          │    mode       │         │
│  └────┬─────┘                          └──────┬───────┘         │
│       │                                        │                 │
│       │ deeper_issue_found                     │ all_fixes_done  │
│       │                                        │                 │
│       │     ┌──────────────┐                   │                 │
│       └────→│  /plan mode  │←──────────────────┘                │
│             │  (re-evaluate│  scope_creep_detected               │
│             │   strategy)  │                                     │
│             └──────────────┘                                     │
│                                                                   │
│  ANTI-THRASH RULE: Maximum 3 mode switches per iteration.        │
│  If exceeded: commit what you have and proceed to VERIFY.        │
│                                                                   │
│  CHECKPOINT: After each mode switch, save state to:              │
│  .productupgrade/CHECKPOINT-{iteration}-{switch_count}.md        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Self-Learning Feedback Loop

After each iteration, the LEARN phase persists insights:

```markdown
## What Gets Saved

1. **Pattern Learnings** (to /mem-search)
   - "In Django + FastAPI codebases, the orchestrator is always the bottleneck"
   - "React components > 200 lines always have accessibility issues"
   - "Pydantic schemas with Optional fields often have None-handling bugs"

2. **Agent Effectiveness** (to .productupgrade/AGENT-METRICS.md)
   - Which agents found the most critical issues?
   - Which agents produced the most false positives?
   - Which prompting techniques yielded the best scores?

3. **Decision Tree Weights** (to .productupgrade/DECISION-WEIGHTS.md)
   - "For Python codebases, business-logic-validator is 3x more effective than naming-enforcer"
   - "For React codebases, ux-auditor finds 2x more issues than code-reviewer"
   - "After iteration 3, deep-researcher yields diminishing returns"

4. **Dense Summaries** (to .productupgrade/ITERATION-{N}-SUMMARY.md)
   - CoD 3-pass summary of all findings
   - Retrievable after /compact for context continuity
```

---

## Integration with Existing Skills

### Skills Orchestrated in Deep Mode

| Phase | Skills Used | Purpose |
|-------|------------|---------|
| UNDERSTAND | `/deep-research`, `/browse`, `/mem-search` | Research + scrape + retrieve |
| ENRICH | `/plan-ceo-review`, `/plan-eng-review` | Strategic + engineering review |
| EVALUATE | LLM-as-Judge, `/code-review` | Score + review |
| FIX | `/plan`, `/code-review`, TDD agents | Plan + implement + test |
| VERIFY | `/qa`, `/browse`, `/review` | QA + browser + code review |
| LEARN | `/mem-search`, continuous-learning | Persist + learn |
| CONVERGE | LLM-as-Judge, `/plan-ceo-review` | Final score + certification |

### MCP Integrations

| MCP | Usage | Phase |
|-----|-------|-------|
| context7 | Live library doc verification | ALL phases |
| sequential-thinking | Structured reasoning for complex decisions | EVALUATE, CONVERGE |
| memory | Persistent knowledge graph across sessions | LEARN, UNDERSTAND |
| playwright | Frontend screenshots and E2E testing | VERIFY |
| github | PR creation, issue tracking | CONVERGE |

---

## Output Files (Deep Mode)

```
.productupgrade/
├── DISCOVERY/
│   ├── AUDIT-DISCOVERY.md           # Codebase scan results
│   ├── AUDIT-COMPETITORS.md         # Competitor UX analysis
│   ├── AUDIT-DEPENDENCIES.md        # Dependency health
│   └── AUDIT-VULNERABILITIES.md     # Security surface map
│
├── REVIEWS/
│   ├── REVIEW-CEO-EXPAND.md         # CEO scope expansion
│   ├── REVIEW-CEO-HOLD.md           # CEO hold scope
│   ├── REVIEW-CEO-REDUCE.md         # CEO scope reduction
│   ├── REVIEW-ENGINEERING-ARCH.md   # Architecture review
│   ├── REVIEW-ENGINEERING-ROBUST.md # Robustness review
│   ├── REVIEW-CODE.md               # Code review findings
│   ├── REVIEW-UX.md                 # UX audit findings
│   └── REVIEW-BUSINESS-LOGIC.md     # Business logic validation
│
├── THOUGHT-GRAPHS/
│   ├── THOUGHT-GRAPH-1.md           # Iteration 1 finding network
│   ├── THOUGHT-GRAPH-2.md           # Iteration 2 (refined)
│   └── THOUGHT-GRAPH-FINAL.md       # Merged final graph
│
├── ITERATIONS/
│   ├── ITERATION-1-SUMMARY.md       # CoD dense summary
│   ├── ITERATION-2-SUMMARY.md
│   ├── ...
│   └── ITERATION-7-SUMMARY.md
│
├── JUDGEMENTS/
│   ├── JUDGE-ITERATION-1.md         # Per-iteration scores
│   ├── JUDGE-ITERATION-2.md
│   └── JUDGE-FINAL.md               # Final certification
│
├── EXECUTION/
│   ├── UPGRADE-PLAN.md              # Prioritized fix plan
│   ├── UPGRADE-LOG.md               # Batch execution log
│   └── CHECKPOINT-*.md              # Mode switch checkpoints
│
├── LEARNING/
│   ├── AGENT-METRICS.md             # Agent effectiveness tracking
│   ├── DECISION-WEIGHTS.md          # Decision tree calibration
│   └── LEARNINGS-*.md               # Per-iteration learnings
│
├── SCREENSHOTS/
│   ├── before/                      # Pre-upgrade captures
│   └── after/                       # Post-upgrade captures
│
├── RUBRIC-BEFORE.md                 # Initial scores
├── RUBRIC-AFTER.md                  # Final scores
├── CONVERGENCE-LOG.md               # Grade trajectory
└── FINAL-REPORT.md                  # Executive summary
```

---

## Implementation Sequence

1. **Update `plugin.json`** — bump version to 2.0.0, add new keywords
2. **Rewrite `commands/productupgrade.md`** — 3-mode dispatcher with argument parsing
3. **Rewrite `skills/productupgrade/SKILL.md`** — Full V2 spec with all modes
4. **Create new agents:**
   - `agents/thought-graph-builder.md`
   - `agents/context-retriever.md`
   - `agents/persona-orchestrator.md`
   - `agents/adversarial-reviewer.md`
   - `agents/density-summarizer.md`
   - `agents/frontend-scraper.md`
   - `agents/vulnerability-explorer.md`
5. **Update existing agents** — Add prompt composition templates to all
6. **Update `CLAUDE.md`** — Document V2 architecture
7. **Create `templates/PROMPT-COMPOSITION.md`** — Reusable prompt template
8. **Update `scripts/`** — Add new automation scripts

---

## Anti-Patterns

1. **Never use a static decision tree.** The tree must be emergent from meta-reasoning.
2. **Never skip the meta-reasoning persona.** It catches blind spots the other two miss.
3. **Never compact without saving a CoD summary first.** Context loss is permanent.
4. **Never let agents self-report quality.** Independent judge with read-only access only.
5. **Never run more than 3 mode switches per iteration.** Anti-thrash protection.
6. **Never target less than 10/10.** The goal is perfection. Settle for convergence, not mediocrity.
7. **Never skip the adversarial reviewer.** Every fix must survive challenge.
8. **Never ignore the Human Impact persona.** Technical correctness without user benefit is waste.
9. **Never run iteration 7 without saving learnings.** The whole point is self-improvement.
10. **Never assume the rubric is complete.** Meta-reasoning may discover new dimensions.
