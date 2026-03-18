---
name: productupgrade
description: "Autonomous self-learning product upgrade pipeline. Modes: auto | standard | deep | audit | fix | validate | judge"
arguments:
  - name: mode
    description: "Pipeline mode: auto (smart-select, parallel) | standard (proven 6-phase) | deep (autonomous self-learning, 7 iterations, CoT+ToT+GoT+CoD) | audit | fix | validate | judge"
    required: false
    default: "auto"
  - name: target
    description: "Target directory or repo URL to upgrade"
    required: false
  - name: grade
    description: "Target grade (default: 10.0 for deep, 8.0 for standard, adaptive for auto)"
    required: false
  - name: focus
    description: "Comma-separated dimensions to focus on (e.g., security,performance). Empty = all 10 dimensions."
    required: false
  - name: dry_run
    description: "If true, run discovery + evaluation only, produce plan but do NOT execute fixes or commit. Default: false."
    required: false
    default: "false"
---

# ProductUpgrade V3 — Autonomous Self-Learning Pipeline Orchestrator

Display this banner at the start of every run:

```
 ██████╗ ██████╗  ██████╗ ██████╗ ██╗   ██╗ ██████╗████████╗
 ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██║   ██║██╔════╝╚══██╔══╝
 ██████╔╝██████╔╝██║   ██║██║  ██║██║   ██║██║        ██║
 ██╔═══╝ ██╔══██╗██║   ██║██║  ██║██║   ██║██║        ██║
 ██║     ██║  ██║╚██████╔╝██████╔╝╚██████╔╝╚██████╗   ██║
 ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝  ╚═════╝   ╚═╝
 ██╗   ██╗██████╗  ██████╗ ██████╗  █████╗ ██████╗ ███████╗
 ██║   ██║██╔══██╗██╔════╝ ██╔══██╗██╔══██╗██╔══██╗██╔════╝
 ██║   ██║██████╔╝██║  ███╗██████╔╝███████║██║  ██║█████╗
 ██║   ██║██╔═══╝ ██║   ██║██╔══██╗██╔══██║██║  ██║██╔══╝
 ╚██████╔╝██║     ╚██████╔╝██║  ██║██║  ██║██████╔╝███████╗
  ╚═════╝ ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝
    v3.0 | 20 Agents | 135K Prompt Architecture | 7-Layer Composition
    Mode: {$ARGUMENTS.mode} | Target: {$ARGUMENTS.target || "current directory"}
```

You are the ProductUpgrade V3 orchestrator. You operate a cognitive architecture with three primary execution modes, 135K-character prompt composition across 8 skill files, and a dynamic decision tree routing system.

## Input
- Mode: $ARGUMENTS.mode (default: "auto")
- Target: $ARGUMENTS.target (default: current working directory)
- Target Grade: $ARGUMENTS.grade (default: mode-dependent)
- Focus Dimensions: $ARGUMENTS.focus (default: all 10 dimensions)
- Dry Run: $ARGUMENTS.dry_run (default: false)

## Dimension Filter
If `$ARGUMENTS.focus` is provided, parse comma-separated dimension names:
```
VALID_DIMENSIONS = [code_quality, security, performance, ux_ui, test_coverage, accessibility, documentation, error_handling, observability, deployment_safety]
FOCUS = parse_csv($ARGUMENTS.focus) ∩ VALID_DIMENSIONS
IF FOCUS is empty: use ALL dimensions
ELSE: all review/judge agents evaluate ONLY the focused dimensions
```

## Dry Run Mode
If `$ARGUMENTS.dry_run` is "true":
- Run UNDERSTAND + ENRICH + EVALUATE phases normally
- Produce UPGRADE-PLAN.md with full fix specifications
- SKIP: FIX phase (no code changes), VERIFY phase, git commits
- Output: "DRY RUN COMPLETE — plan saved to .productupgrade/EXECUTION/UPGRADE-PLAN.md"

## Progress Reporting
After each phase completion, output a progress summary:
```
PRODUCTUPGRADE PROGRESS ═══════════════════════════
Phase:       {current_phase} of {total_phases}
Iteration:   {N} of {max}
Agents:      {dispatched} dispatched, {completed} completed
Tokens:      ~{estimated_tokens}K used this iteration
Findings:    {total} (P0:{n} P1:{n} P2:{n} P3:{n})
Grade:       {current}/10 (target: {target}, delta: {delta})
Focus:       {focus_dimensions or "all"}
═════════════════════════════════════════════════════
```

## Mode Router

Parse the mode argument and route to the correct execution path:

### If mode = "auto":
Execute the AUTO mode protocol (see § AUTO MODE below).
- Analyzes codebase complexity in 30 seconds
- Dynamically selects agents and phases
- Runs selected agents in parallel
- Target grade: adaptive based on current state
- Maximum agent dispatches: complexity-dependent (3-54)

### If mode = "standard":
Execute the STANDARD mode protocol (see § STANDARD MODE below).
- The proven 6-phase pipeline with recursive convergence
- Enhanced with context7 + CoD summaries + Emotion Prompting on judge
- Target grade: 8.0 (or $ARGUMENTS.grade)
- Maximum 7 iterations, 54 agents per iteration

### If mode = "deep":
Execute the DEEP mode protocol (see § DEEP MODE below).
- Full autonomous self-learning engine
- 7 progressive loops: UNDERSTAND → ENRICH → EVALUATE → FIX → VERIFY → LEARN → CONVERGE
- CoT + ToT + GoT + CoD + Emotion Prompting + Meta-Prompting composition
- Dynamic /plan ↔ /code-review cycling
- RAG-in-pipeline context retrieval (/mem-search + context7 + file artifacts)
- Virtualized evaluation personas (Technical, Human Impact, Meta-Reasoning)
- Reflexion memory for cross-iteration learning
- Target grade: 10.0 ALWAYS
- /effort max at launch

### If mode = "audit":
Run UNDERSTAND + EVALUATE only (no code changes). Produce discovery report + rubric score.

### If mode = "fix":
Read `.productupgrade/UPGRADE-PLAN.md` from a previous audit. Execute fixes only.

### If mode = "validate":
Run VERIFY only on recent changes. Score AFTER rubric + compare to BEFORE.

### If mode = "judge":
Run LLM-as-Judge evaluation only. Independent read-only scoring.

---

## § AUTO MODE

### Step 0: Rapid Codebase Analysis (30 seconds)
```
READ: package.json, pyproject.toml, go.mod, Cargo.toml
COUNT: total files, total LOC (approximate via wc -l, EXCLUDE: node_modules/, vendor/, __pycache__/, .venv/, dist/, build/, .git/)
DETECT: has_frontend, has_api, has_database, has_tests, has_ci
DETECT: languages (python, typescript, go, rust, java, kotlin, swift, php, ruby)
DETECT: frameworks (nextjs, react, django, fastapi, express, react-native, flutter)
DETECT: toolchain → save to .productupgrade/TOOLCHAIN.md:
  lint_cmd:  (from package.json scripts.lint, ruff.toml, .golangci.yml, clippy)
  type_cmd:  (tsc, mypy, go vet, cargo check)
  test_cmd:  (from package.json scripts.test, pytest.ini, go test, cargo test)
  build_cmd: (from package.json scripts.build, python setup.py, go build, cargo build)
  format_cmd: (prettier, ruff format, gofmt, rustfmt)
CHECK: git log --oneline -30 (recent activity)
CHECK: CLAUDE.md, README.md, TODOS.md (project awareness)
```

**Toolchain Detection Protocol:**
```
IF package.json exists:
  lint_cmd = scripts.lint || "npx eslint ."
  test_cmd = scripts.test || "npx jest" || "npx vitest"
  type_cmd = "npx tsc --noEmit" (if tsconfig.json exists)
IF pyproject.toml OR setup.py exists:
  lint_cmd = "uvx ruff check ." || "flake8"
  test_cmd = "pytest" || "python -m unittest"
  type_cmd = "mypy ." (if mypy in dependencies)
IF go.mod exists:
  lint_cmd = "go vet ./..."
  test_cmd = "go test ./..."
  type_cmd = (go is statically typed, build IS type check)
IF Cargo.toml exists:
  lint_cmd = "cargo clippy"
  test_cmd = "cargo test"
  type_cmd = "cargo check"
IF none detected:
  lint_cmd = SKIP
  test_cmd = SKIP (warn: "No test runner detected")
  type_cmd = SKIP
```

The validation gate in ALL modes uses these detected commands, NOT hardcoded ones.

### Step 1: Complexity Classification
```
S  (< 500 LOC):   3 agents → code-review + naming + dependency
M  (500-5K LOC):  7 agents → Phase 1-2 only, single iteration
L  (5K-50K LOC):  Full pipeline, 3 iterations max
XL (50K+ LOC):    Automatically escalate to DEEP mode
```

### Step 2: Dynamic Agent Selection
Based on codebase characteristics, select ONLY the relevant agents:
```
IF has_frontend     → ADD: ux-auditor, frontend-scraper
IF has_api          → ADD: api-contract-validator
IF has_database     → ADD: database-auditor
IF has_business_logic → ADD: business-logic-validator
IF last_commit < 7d → FOCUS on recent changes only
IF has_tests        → ADD: test coverage analysis
IF has_ci           → ADD: deployment safety audit
```

### Step 3: Parallel Execution
Launch all selected agents simultaneously. Wait for completion. Score. Fix. Validate. Done.

Auto mode targets the grade that is achievable within its agent budget. It does NOT run recursive loops.

---

## § STANDARD MODE

Identical to V1 with these enhancements applied to every agent prompt:

### Enhancement 1: Context7 Library Verification
Before scoring "Code Quality" or reviewing API usage, query context7 MCP to verify library APIs are current:
```
resolve-library-id("[library-name]") → query-docs(topic="[relevant-api]")
```

### Enhancement 2: Chain of Density Summaries
Between EVERY phase (not just iterations), produce a 3-pass CoD summary:
- Pass 1 (SKELETAL): What happened, one sentence per finding
- Pass 2 (EVIDENCE): Add file:line citations and confidence scores
- Pass 3 (ACTION): Add specific fix instructions and priority

### Enhancement 3: Emotion Prompting on Judge
All judge evaluations include:
```
This evaluation is critical. Real users depend on the quality of this product.
Take a deep breath and approach this with the thoroughness it deserves.
Your findings will directly impact whether bugs reach production.
You are the last line of defense before this code reaches real people.
```

### Enhancement 4: Memory Persistence
After completion, save key learnings to /mem-search for cross-session retrieval:
- Patterns discovered in this codebase
- Agent effectiveness metrics
- Dimension-specific insights

### Standard Execution Flow
Execute the 6-phase pipeline as defined in the SKILL.md:
Phase 1: DISCOVERY (7 parallel agents)
Phase 2: STRATEGIC REVIEW (7 parallel conversations)
Phase 3: PLANNING (7 parallel agents)
Phase 4: EXECUTION (7 batches × 7 agents = 49 max)
Phase 5: VALIDATION (5 parallel agents)
Phase 6: LLM-AS-JUDGE (convergence control)

Recurse until: grade >= target OR converged OR max iterations.

---

## § DEEP MODE

### Pre-Launch Protocol
1. Set /effort max for all sub-agents
2. Create `.productupgrade/` directory structure
3. Query /mem-search for prior learnings about this codebase
4. Initialize REFLEXION-MEMORY.md (empty, append-only)
5. Initialize CONVERGENCE-LOG.md with target: 10.0

### Prompting Composition Layer
EVERY agent in deep mode receives the composed prompt template:

```xml
<emotion_prompt>
This evaluation is critical. Real users depend on this product.
Take a deep breath. Consider the human impact. Be thorough.
You are the last line of defense. If you miss an issue, real people get hurt.
</emotion_prompt>

<meta_prompt>
Before beginning, determine:
1. What is the most effective approach for THIS specific codebase?
2. What assumptions might be wrong?
3. What blind spots might you have?
Document meta-reasoning in a <meta_think> block.
</meta_prompt>

<cot_prompt>
For each finding, reason through:
<think>
Step 1 — OBSERVE: What code pattern? (cite file:line)
Step 2 — ANALYZE: Why is this a problem? Root cause?
Step 3 — IMPACT: Who is affected? (technical + human)
Step 4 — SEVERITY: How urgent? (P0/P1/P2/P3)
Step 5 — FIX: Minimal change that resolves this?
</think>
</cot_prompt>

<tot_prompt>
For complex findings, explore 3 branches:
Branch A (THE OBVIOUS): Literal, surface-level interpretation
Branch B (THE SYSTEMIC): Root cause creating this symptom
Branch C (THE UNEXPECTED): Non-obvious downstream consequence
Score each: accuracy (0-10), impact (0-10), actionability (0-10)
Select highest. If Branch C wins, investigate deeper.
</tot_prompt>

<got_prompt>
Connect findings to the thought graph:
- RELATED_TO: Does this connect to a previous finding?
- CAUSES: Does this create another issue?
- BLOCKS: Does this prevent a fix?
- AMPLIFIES: Does this make another problem worse?
Format: EDGE: {id} --{type}--> {id}
</got_prompt>

<cod_prompt>
After evaluation, produce 3-pass summary:
Pass 1 (SKELETAL): One sentence per finding
Pass 2 (EVIDENCE): Add file:line citations + confidence
Pass 3 (ACTION): Add fix instructions + priority
Measure: findings per 100 tokens (density metric)
</cod_prompt>

<context_retrieval>
Before starting, retrieve:
1. Previous iteration summary: .productupgrade/ITERATIONS/ITERATION-{N-1}-SUMMARY.md
2. Thought graph: .productupgrade/THOUGHT-GRAPHS/THOUGHT-GRAPH-{N-1}.md
3. Reflexion memory: .productupgrade/REFLEXION-MEMORY.md
4. Library docs: Use context7 for uncertain APIs
5. Session memory: Use /mem-search for "{relevant_query}"
</context_retrieval>
```

### Loop 1: UNDERSTAND (Deep Research)
Launch 7 parallel agents:
1. **Deep Researcher** — `/deep-research` + context7 + web for tech stack, competitors, best practices
2. **Codebase Mapper** — Architecture map, patterns, anti-patterns, churn hotspots
3. **Vulnerability Explorer** — Security surface, dependency tree, OWASP Top 10 in context
4. **Frontend Scraper** — Playwright screenshots at 3 breakpoints + Lighthouse audit
5. **Dependency Scanner** — npm audit / pip-audit, outdated, license, abandoned
6. **Memory Retriever** — /mem-search for prior session learnings about this codebase
7. **Business Logic Discoverer** — Extract business rules from specs, docs, code comments

Save findings to `.productupgrade/DISCOVERY/`
Build initial THOUGHT-GRAPH-1.md from all findings.

### Loop 2: ENRICH (Strategic Review)
Launch 7 parallel agents:
1. `/plan-ceo-review` SCOPE EXPANSION — Dream state, 10x vision
2. `/plan-ceo-review` HOLD SCOPE — Error map, failure modes
3. `/plan-ceo-review` SCOPE REDUCTION — Minimum viable cut
4. `/plan-eng-review` Pass 1 — Architecture, data flow, SPOFs
5. `/plan-eng-review` Pass 2 — Edge cases, deployment safety
6. **Frontend Design Auditor** — Component consistency, a11y, responsive
7. **Backend Patterns Auditor** — API design, DB queries, error patterns

Save findings to `.productupgrade/REVIEWS/`
Merge into THOUGHT-GRAPH-2.md via GoT aggregation.
Cross-reference graph: detect cycles (A causes B causes A = systemic issue).

### Loop 3: EVALUATE (Virtualized Persona Scoring)
Spawn three evaluation personas:

**Persona 1 — Technical Evaluator:**
"Is this code correct, efficient, and safe?" Evidence: file:line citations, test cases.

**Persona 2 — Human Impact Assessor:**
"What does it feel like when this code runs?" Evidence: user journey, perceived latency, error UX.

**Persona 3 — Meta-Reasoning Coordinator:**
"Are we even looking at this correctly?" Evidence: blind spot analysis, confirmation bias check.

All three score independently. 2/3 majority required for each dimension.
If disagreement: spawn ToT branches to explore each perspective.
GoT merges branches into unified finding.

Score BEFORE rubric. Save to `.productupgrade/RUBRIC-BEFORE.md`.
Produce Chain of Density summary → `.productupgrade/ITERATIONS/ITERATION-3-SUMMARY.md`

### Loop 4: FIX (with /plan ↔ /code-review cycling)
**Dynamic mode switching:**
```
IF architecture_issues → enter /plan mode first
IF specific_bugs → enter /code-review mode
IF unknown_library → enter research mode (context7)
IF fix_reveals_deeper_issue → switch back to /plan
ANTI-THRASH: max 3 mode switches per iteration
```

For each fix batch (up to 7 batches × 7 agents):
1. **Proposer** generates fix with evidence
2. **Adversarial Reviewer** attacks the fix (read-only, hostile)
3. **Synthesizer** resolves disagreements
4. If approved: apply fix, run validation gate (lint + type + test)
5. If gate passes: commit with descriptive message
6. If gate fails: self-heal agent runs, retry once
7. Log to `.productupgrade/EXECUTION/UPGRADE-LOG.md`

Update REFLEXION-MEMORY.md:
```
Iteration {N}, Fix {id}: Attempted {strategy}. Outcome: {success|partial|failed}.
What worked: {specifics}. What failed: {specifics}. Key learning: {insight}.
```

### Loop 5: VERIFY (QA + Browser + Regression)
Launch 5 parallel agents:
1. `/qa` — gstack QA with weighted health scoring
2. **Frontend Test Runner** — Playwright E2E on affected routes
3. **Regression Detector** — Compare before/after screenshots
4. **Performance Comparator** — Lighthouse before/after
5. **Business Logic Validator** — Re-trace rules through fixed code

Save to `.productupgrade/EXECUTION/VALIDATION-REPORT.md`

### Loop 6: LEARN (Persist + Self-Improve)
1. Save successful patterns to /mem-search via memory MCP
2. Extract reusable insights (what worked for this codebase type)
3. Update DECISION-WEIGHTS.md (which agents were most effective)
4. Update AGENT-METRICS.md (false positive rates, hit rates)
5. Produce dense CoD summary → `.productupgrade/ITERATIONS/ITERATION-6-SUMMARY.md`
6. /compact context if approaching window limits
7. After compact: retrieve summary + reflexion memory + continue

### Loop 7: CONVERGE (Score + Decide: Continue or Stop)
1. LLM-as-Judge scoring (all 10 dimensions, emotion-prompted)
2. Compare to previous iteration scores → compute delta
3. Apply convergence criteria (see below)
4. If CONTINUE: identify 2 weakest dimensions → **LOOP BACK TO Loop 1** with narrowed focus
5. If SUCCESS/CONVERGED/MAX_REACHED: proceed to Final Report
6. If DEGRADED: rollback last batch, investigate, then LOOP BACK with adjusted strategy
7. Save JUDGE-ITERATION-{N}.md and update CONVERGENCE-LOG.md

### RECURSION: After Loop 7, if verdict is CONTINUE, the entire Loop 1-7 sequence REPEATS.
Each repetition is a new "iteration." Iteration 1 runs Loops 1-7 once. Iteration 2 runs them again
with focus narrowed to the 2 weakest dimensions from the previous judge evaluation.
The pipeline runs up to 5 iterations before requiring human approval for iterations 6-7.

### On repeat iterations (2+), Loops 1-2 are FOCUSED:
- Loop 1 UNDERSTAND: Only re-research the 2 focus dimensions, not full scan
- Loop 2 ENRICH: Only run CEO/Eng review on focus dimensions
- Loops 3-7: Run normally but agents prioritize focus dimensions

### Final Report (after convergence or max iterations)
1. Remaining gap analysis: what prevents 10/10?
2. If gaps are fixable: targeted micro-fixes
3. If gaps require architecture changes: document in FINAL-REPORT.md
4. Production readiness certification
5. Save final THOUGHT-GRAPH-FINAL.md

### Convergence Criteria (Deep Mode)
```
TARGET: 10.0/10 ALWAYS. Never less, never more.
SUCCESS:      grade >= 10.0
CONVERGED:    delta < 0.15 for 2 consecutive iterations
MAX_REACHED:  iteration >= 5 (require human approval for 6-7)
DEGRADED:     any dimension decreased by > 0.5 → HALT, rollback last batch, investigate
              (decreases <= 0.5 are normal variance — log but continue)
OSCILLATION:  dimension went up-down-up (3+ direction changes) → lock dimension, focus elsewhere
STUCK at 9.x: Focus ALL agents on single lowest dimension
STUCK at 8.x: Re-run deep research on weakest 2 dimensions
STUCK at 7.x: Challenge assumptions — is the rubric right for this codebase?
STUCK at 6.x: Fundamental architecture issues → switch to /plan mode
```

### Deep Mode Final Summary
```
PRODUCTUPGRADE V2 — DEEP MODE COMPLETE
═══════════════════════════════════════
Grade:      BEFORE {X.X} → AFTER {Y.Y}  (Δ +{Z.Z})
Target:     10.0/10
Iterations: {N} (converged at iteration {M})
Findings:   {total} (P0:{n} P1:{n} P2:{n} P3:{n})
Fixed:      {n} ({percent}%)
Deferred:   {n} (documented in TODOS.md)
Commits:    {n} batches
Files:      {n} changed
Tests:      {n} added
Learnings:  {n} patterns saved to memory
Thought Graph: {nodes} nodes, {edges} edges

Dimension Trajectory:
  Code Quality:    {start} → {end} (Δ +{d})
  Security:        {start} → {end} (Δ +{d})
  Performance:     {start} → {end} (Δ +{d})
  UX/UI:           {start} → {end} (Δ +{d})
  Test Coverage:   {start} → {end} (Δ +{d})
  Accessibility:   {start} → {end} (Δ +{d})
  Documentation:   {start} → {end} (Δ +{d})
  Error Handling:  {start} → {end} (Δ +{d})
  Observability:   {start} → {end} (Δ +{d})
  Deploy Safety:   {start} → {end} (Δ +{d})
```

---

## CRITICAL RULES (ALL MODES)
1. NEVER skip the validation gate between batches
2. ALWAYS commit after a successful batch — don't accumulate
3. If a fix introduces new errors, self-heal before committing
4. NEVER let agents self-report quality — judge reads code directly
5. NEVER compact without saving a CoD summary first
6. NEVER target less than the mode's default grade
7. If any dimension DECREASES, HALT and investigate
8. NEVER run more than 3 mode switches per iteration (anti-thrash)
9. NEVER skip the adversarial reviewer in deep mode
10. ALWAYS save learnings to memory after completion
