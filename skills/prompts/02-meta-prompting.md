---
name: meta-prompting
description: "Meta-Prompting layer for ProductUpgrade pipeline. Forces agents to reason about their reasoning before evaluation — assumption inventory, blind spot detection, approach selection, codebase classification, and dynamic strategy adjustment. Layer 2 of 7."
---

# Meta-Prompting — Layer 2 of 7

## Research Foundation

Meta-Prompting draws from three research streams:

1. **Meta-cognition in AI (Didolkar et al., 2024)** — LLMs that explicitly reason about their own reasoning process produce more calibrated, less overconfident outputs. Meta-prompting forces this explicit reasoning.

2. **Self-Refine (Madaan et al., 2023)** — Iterative self-refinement improves output quality by ~20% when the model is asked to critique its own approach before finalizing. Meta-prompting is the first step of this cycle.

3. **Constitutional AI (Bai et al., 2022)** — Models can be guided to self-correct by providing explicit principles to reason against. Meta-prompting provides the principle: "question your own approach before executing it."

## Core Principle

Most evaluation failures come not from wrong answers to right questions, but from asking the wrong questions entirely. Meta-Prompting interrupts the agent's default evaluation approach and forces it to explicitly decide HOW to evaluate before WHAT to evaluate. This prevents:

- **Hammer-nail bias**: Using the same evaluation approach for every codebase regardless of context
- **Confirmation bias**: Looking for expected patterns instead of actual patterns
- **Anchoring bias**: Letting the first finding set the tone for the entire evaluation
- **Availability bias**: Over-weighting recent or memorable patterns over systematic coverage

---

## Phase 1: Codebase Classification Matrix

Before any evaluation begins, the agent must classify the codebase on 8 axes. This classification determines the evaluation strategy.

```
<meta_classify>
Classify this codebase before proceeding. For each axis, select the value that
best describes what you observe in the actual code (not what documentation claims):

AXIS 1 — Architecture Style:
  [ ] Monolith (single deployable unit)
  [ ] Modular Monolith (internal boundaries, single deploy)
  [ ] Microservices (multiple deployable units)
  [ ] Serverless (function-level deployment)
  [ ] Hybrid (mix of styles)
  [ ] Unknown (cannot determine from code)

AXIS 2 — Maturity Stage:
  [ ] Prototype (< 1K LOC, no tests, rapid iteration)
  [ ] Early Product (1-10K LOC, some tests, establishing patterns)
  [ ] Growth Product (10-100K LOC, test suite, established patterns)
  [ ] Mature Product (100K+ LOC, CI/CD, team conventions)
  [ ] Legacy (any size, outdated patterns, maintenance mode)
  [ ] Unknown

AXIS 3 — Primary Concern:
  [ ] Correctness (financial, medical, legal — errors have serious consequences)
  [ ] Performance (real-time, high-throughput — speed is the product)
  [ ] Security (auth, payments, data — breaches are catastrophic)
  [ ] User Experience (consumer-facing — delight is the differentiator)
  [ ] Developer Experience (SDK, API, platform — developer adoption is key)
  [ ] Reliability (infrastructure, SRE — uptime is the contract)
  [ ] Unknown

AXIS 4 — Team Context:
  [ ] Solo Developer (single contributor, all decisions local)
  [ ] Small Team (2-5, informal conventions)
  [ ] Medium Team (5-20, documented standards)
  [ ] Large Team (20+, formal processes, code owners)
  [ ] Open Source (public, contributor diversity)
  [ ] Unknown

AXIS 5 — Tech Stack Complexity:
  [ ] Single Language (one language, one framework)
  [ ] Dual Stack (frontend + backend, e.g., Next.js + Python)
  [ ] Polyglot (3+ languages)
  [ ] Full Platform (frontend + backend + workers + infra)
  [ ] Unknown

AXIS 6 — Data Sensitivity:
  [ ] Public (no user data, open content)
  [ ] Standard (user accounts, preferences)
  [ ] Sensitive (PII, financial, health)
  [ ] Regulated (HIPAA, SOC 2, GDPR compliance required)
  [ ] Unknown

AXIS 7 — Change Velocity:
  [ ] Rapid (multiple deploys/day, feature flags)
  [ ] Standard (weekly releases, PR-based)
  [ ] Slow (monthly/quarterly releases, change boards)
  [ ] Frozen (maintenance only, minimal changes)
  [ ] Unknown

AXIS 8 — Test Infrastructure:
  [ ] None (no tests, no CI)
  [ ] Minimal (some unit tests, basic CI)
  [ ] Standard (unit + integration, CI/CD)
  [ ] Comprehensive (unit + integration + E2E, coverage enforcement)
  [ ] Advanced (property-based, mutation, chaos engineering)
  [ ] Unknown

Record your classification. It will determine your evaluation strategy.
</meta_classify>
```

---

## Phase 2: Assumption Inventory

After classification, the agent must enumerate its assumptions — explicitly making the implicit visible.

```
<meta_assumptions>
Before evaluating, list every assumption you are making about this codebase.
For each assumption, rate your confidence and identify what would change if
the assumption is wrong.

TEMPLATE:
| # | Assumption | Confidence | If Wrong, Changes... |
|---|-----------|-----------|---------------------|
| 1 | "This is a standard REST API" | HIGH/MED/LOW | Evaluation dimensions shift to... |
| 2 | "The test suite catches regressions" | HIGH/MED/LOW | Test coverage score methodology changes |
| 3 | "Error handling follows framework patterns" | HIGH/MED/LOW | Need to check every try/catch individually |
| 4 | "Dependencies are actively maintained" | HIGH/MED/LOW | Supply chain risk assessment needed |
| 5 | ... | ... | ... |

REQUIRED ASSUMPTIONS TO CHECK:
1. "The code I'm reading is the complete picture" — Are there external services, config files, or infrastructure-as-code that affect behavior?
2. "The patterns I see are intentional" — Could inconsistencies be bugs rather than intentional variation?
3. "The framework handles [X] correctly" — Am I trusting the framework without verifying configuration?
4. "This code path is reachable" — Have I verified that the code I'm evaluating is actually executed?
5. "The data model matches my mental model" — Have I read the actual schema or am I inferring it?
6. "Error cases are handled upstream" — Have I traced the full call chain to verify?
7. "Environment variables are set correctly" — Am I assuming configuration that may not exist in production?

After listing assumptions, CHALLENGE the top 3 lowest-confidence ones.
Read code that would prove or disprove each one.
Update your assumption table with evidence.
</meta_assumptions>
```

---

## Phase 3: Blind Spot Detection Protocol

Systematic identification of what the agent might be missing.

```
<meta_blindspots>
Before proceeding, explicitly consider what you might be MISSING.

STRUCTURAL BLIND SPOTS:
1. Files I haven't read: Are there configuration files, middleware, or
   interceptors that modify behavior without appearing in the main code paths?
2. Cross-cutting concerns: Are there aspects (logging, auth, validation) that
   span multiple files and might be partially implemented?
3. Runtime vs static behavior: Are there dynamic features (feature flags,
   A/B tests, environment-specific code) that change behavior at runtime?
4. External dependencies: Are there third-party services whose behavior
   affects this code but isn't visible in the source?
5. Build/deploy pipeline: Are there compilation, bundling, or deployment
   steps that transform the code I'm reading?

COGNITIVE BLIND SPOTS:
1. Recency bias: Am I over-weighting the last few files I read?
2. Familiarity bias: Am I scoring familiar patterns higher just because I
   recognize them?
3. Anchoring: Did my first finding set an expectation that colors subsequent
   evaluation?
4. Completeness illusion: Do I think I've covered everything because I've
   read a lot of code, even though I haven't systematically verified coverage?
5. Framework trust: Am I assuming framework defaults are secure/correct
   without verifying the specific version and configuration?

DOMAIN BLIND SPOTS:
1. What domain-specific requirements might I not know about?
   (e.g., financial calculations need decimal precision, medical data needs
   audit trails, real-time systems need latency guarantees)
2. What regulatory requirements might apply that I haven't checked?
   (e.g., GDPR data residency, CCPA deletion rights, HIPAA access logs)
3. What operational requirements might exist beyond the code?
   (e.g., SLAs, incident response playbooks, disaster recovery plans)

For each blind spot identified, note:
- Is it addressable in this evaluation? (I can read more code)
- Is it structural? (I need information not available in the codebase)
- Should I flag it for the orchestrator? (Needs a different agent type)
</meta_blindspots>
```

---

## Phase 4: Evaluation Strategy Selection

Based on classification, assumptions, and blind spots, the agent selects its evaluation strategy.

```
<meta_strategy>
Based on your codebase classification, select the evaluation strategy that will
produce the most valuable findings for THIS specific codebase.

STRATEGY A — BREADTH-FIRST (for new/unfamiliar codebases):
  Scan widely across all files before diving deep into any one area.
  Best when: First iteration, unknown codebase, unclear architecture.
  Risk: May miss deep issues in favor of surface findings.
  Mitigation: Flag areas needing deeper investigation for next iteration.

STRATEGY B — DEPTH-FIRST (for known problem areas):
  Pick the highest-risk area and trace it completely before moving on.
  Best when: Focused iteration, known problem dimension, security audit.
  Risk: May miss issues in unexplored areas.
  Mitigation: Systematically track which areas remain unevaluated.

STRATEGY C — RISK-WEIGHTED (for production-critical code):
  Evaluate files in order of risk: auth → data → API → UI → docs.
  Best when: Security review, compliance audit, pre-release hardening.
  Risk: May under-evaluate low-risk areas that contain hidden issues.
  Mitigation: Allocate minimum 10% of effort to each dimension.

STRATEGY D — USER-JOURNEY (for UX-critical products):
  Follow user flows from entry to completion, evaluating all code touched.
  Best when: UX audit, accessibility review, onboarding improvement.
  Risk: May miss backend-only code that doesn't touch user flows.
  Mitigation: Also scan for orphaned code, dead endpoints.

STRATEGY E — CHANGE-DRIVEN (for iteration 2+):
  Focus on files modified since last iteration + their dependents.
  Best when: Verification after fixes, regression checking, focused review.
  Risk: May miss pre-existing issues in unchanged code.
  Mitigation: Compare against last iteration's gap list.

STRATEGY F — ADVERSARIAL (for challenging findings):
  Assume every finding from the previous iteration is wrong. Try to disprove them.
  Best when: Wave 4-5 adversarial verification, pre-certification.
  Risk: May be too skeptical, dismissing real findings.
  Mitigation: Require strong counter-evidence to overturn a finding.

STRATEGY G — COMPARATIVE (for multi-service codebases):
  Compare patterns across services/modules for consistency.
  Best when: Microservices, monorepos, multi-package projects.
  Risk: May penalize intentional variation between services.
  Mitigation: Check if variation is documented as intentional.

SELECTION RULES:
  IF iteration == 1 AND classification.maturity == "Unknown":
    USE Strategy A (breadth-first)
  IF focus_dimensions specified:
    USE Strategy B (depth-first) on focus dims + Strategy A on others
  IF classification.primary_concern == "Security":
    USE Strategy C (risk-weighted)
  IF classification.primary_concern == "User Experience":
    USE Strategy D (user-journey)
  IF iteration >= 2:
    USE Strategy E (change-driven) for verified dims + Strategy B for focus
  IF wave_type == "ADVERSARIAL":
    USE Strategy F (adversarial)
  IF classification.architecture == "Microservices":
    ADD Strategy G (comparative) as secondary

Record your selected strategy. Justify the choice.
If uncertain, use Strategy A + C hybrid (breadth with risk-weighting).
</meta_strategy>
```

---

## Phase 5: Dynamic Re-evaluation Triggers

During the evaluation, the agent monitors for conditions that should change its approach mid-stream.

```
<meta_reevaluate>
During evaluation, continuously monitor for these triggers. If any fires,
PAUSE your current approach and adjust.

TRIGGER 1 — ARCHITECTURE SURPRISE:
  Condition: The codebase architecture is fundamentally different from your
  initial classification.
  Action: STOP. Re-classify. Select new strategy. Resume from beginning.
  Example: You classified as "Monolith" but discover it's actually a
  distributed system with message queues and event sourcing.

TRIGGER 2 — SEVERITY ESCALATION:
  Condition: You discover a finding that is significantly more severe than
  anything found so far (e.g., first P0 in a sea of P2s).
  Action: INCREASE emotion intensity by 2 levels. Switch to risk-weighted
  strategy for remaining evaluation. Prioritize finding related issues.

TRIGGER 3 — PATTERN DISCOVERY:
  Condition: The same anti-pattern appears in 3+ independent locations.
  Action: STOP evaluating individual instances. This is a SYSTEMIC issue.
  Trace the pattern to its origin (shared utility, copy-paste, framework misuse).
  Score as a single P1 with systemic fix recommendation.

TRIGGER 4 — EVIDENCE CONFLICT:
  Condition: Two pieces of evidence suggest contradictory conclusions.
  Action: Do NOT pick one arbitrarily. Apply Tree of Thought branching.
  Create explicit branches for each interpretation. Score each. If still
  tied, flag as "CONFLICTING EVIDENCE" for next iteration to resolve.

TRIGGER 5 — COVERAGE GAP:
  Condition: A major area of the codebase has zero findings after evaluation.
  Action: This is suspicious. Verify you actually read code in that area.
  If yes and genuinely clean: score appropriately (no phantom findings).
  If no: you have a coverage gap. Flag for depth-first investigation.

TRIGGER 6 — ASSUMPTION VIOLATION:
  Condition: One of your listed assumptions proved false.
  Action: Review ALL findings that depended on that assumption.
  Re-evaluate affected findings with the correct understanding.
  Update your assumption inventory with evidence.

TRIGGER 7 — CONTEXT WINDOW PRESSURE:
  Condition: Approaching context window limits.
  Action: Produce immediate CoD summary of all findings so far.
  Save to .productupgrade/ITERATIONS/ as checkpoint.
  Alert orchestrator for /compact management.

After adjustment, document what changed and why in a <meta_adjustment> block.
</meta_reevaluate>
```

---

## Phase 6: Quality Dimension Discovery

Meta-prompting doesn't just apply the standard 10 dimensions — it can discover new ones.

```
<meta_discover_dimensions>
The standard evaluation rubric covers 10 dimensions. However, THIS specific
codebase may have quality dimensions that the standard rubric does NOT capture.

DISCOVERY PROTOCOL:
1. Read the project's CLAUDE.md, README, and any architecture documents.
2. Check for domain-specific requirements:
   - Financial: decimal precision, audit trails, reconciliation
   - Medical: HIPAA compliance, access logging, data retention
   - Real-time: latency SLAs, backpressure handling, graceful degradation
   - E-commerce: cart consistency, payment idempotency, inventory locking
   - Multi-tenant: data isolation, tenant-aware queries, resource quotas
   - AI/ML: model versioning, inference latency, bias testing
   - Video/Media: codec handling, streaming performance, DRM
3. If you discover a dimension not in the standard 10:
   - Name it precisely
   - Define what 1/10 and 10/10 look like
   - Evaluate the codebase on this dimension
   - Include it in your findings as "DISCOVERED DIMENSION: {name}"

COMMON DISCOVERED DIMENSIONS:
- Internationalization (i18n): Language support, RTL layout, date formats
- Data Integrity: Transactions, constraints, eventual consistency handling
- Scalability: Horizontal scaling readiness, statelessness, cache strategy
- Developer Onboarding: How quickly can a new developer contribute?
- Operational Playbooks: Runbooks, incident response, rollback procedures
- Cost Efficiency: Cloud resource usage, query optimization, cache hit rates

Report discovered dimensions to the orchestrator for potential rubric expansion.
</meta_discover_dimensions>
```

---

## Phase 7: Confidence Calibration

Before finalizing any evaluation, the agent self-calibrates its confidence.

```
<meta_calibrate>
Before submitting your findings, calibrate your overall confidence:

CALIBRATION CHECKLIST:
[ ] I read actual source code for every finding (not just file names)
[ ] I cited specific file:line evidence for every score
[ ] I challenged at least 3 of my own assumptions
[ ] I identified and documented at least 2 blind spots
[ ] I selected an evaluation strategy deliberately, not by default
[ ] I checked for at least 1 dimension-specific quality aspect
[ ] I did NOT inflate any score to avoid triggering more iterations
[ ] I did NOT deflate any score to force unnecessary iterations
[ ] My severity ratings are consistent (similar issues = similar severity)
[ ] I can explain my methodology if questioned by another agent

CONFIDENCE CALCULATION:
  Items checked / 10 = raw_confidence
  IF any P0 finding lacks 3+ evidence citations: raw_confidence -= 0.2
  IF any dimension has 0 file samples: raw_confidence -= 0.1 per dimension
  IF evaluation took < 5 minutes: raw_confidence -= 0.15 (likely rushed)

  Final confidence = max(0.1, min(1.0, raw_confidence))

CONFIDENCE INTERPRETATION:
  0.9+  — HIGH: Strong evidence, thorough coverage, high certainty
  0.7-0.9 — MEDIUM: Good evidence, some gaps, reasonable certainty
  0.5-0.7 — LOW: Limited evidence, significant gaps, uncertain
  < 0.5 — INSUFFICIENT: Re-evaluation recommended before submitting

If final confidence < 0.5: DO NOT submit findings.
Instead, flag to orchestrator: "INSUFFICIENT CONFIDENCE — need more context"
</meta_calibrate>
```

---

## Composition Interface

This layer is applied SECOND, after Emotion Prompting. It forces the agent to THINK about its approach before DOING the evaluation.

```
COMPOSITION ORDER:
  1. Emotion Prompting → sets stakes
  2. [THIS] Meta-Prompting → forces reflection
  3. Context Retrieval → provides history
  4. (Agent-specific role instructions)
  5. Chain of Thought → structures reasoning
  6. Tree of Thought → enables exploration
  7. Graph of Thought → enables connection
  8. Chain of Density → structures output
```

Input from orchestrator:
- `codebase_path` (target directory)
- `iteration_number` (for strategy selection)
- `focus_dimensions` (if any)
- `previous_classification` (from prior iteration, if available)
- `wave_type` (BROAD, FOCUSED, DEEP, ADVERSARIAL, SYNTHESIS)

Output produced by agent:
- `codebase_classification` (8-axis matrix)
- `assumption_inventory` (table with confidence ratings)
- `blind_spots` (identified gaps)
- `selected_strategy` (A-G with justification)
- `discovered_dimensions` (if any)
- `confidence_score` (calibrated 0-1)

All meta-output is included in the agent's report header, making the reasoning process transparent and auditable.

## Anti-Patterns

1. **Never skip meta-prompting in deep mode.** It's tempting to "just start reviewing" but unchallenged assumptions cause systematic errors across all findings.
2. **Never copy the previous iteration's classification.** Re-classify fresh — your understanding of the codebase improves each iteration.
3. **Never assume your blind spots are the same as last iteration's.** Different focus dimensions reveal different gaps.
4. **Never select Strategy F (adversarial) for iteration 1.** You need findings before you can challenge them.
5. **Never suppress re-evaluation triggers.** If a trigger fires, the approach MUST change. Ignoring triggers produces systematically biased results.
6. **Never report confidence > 0.9 without completing all 10 calibration items.** Uncalibrated high confidence is worse than calibrated low confidence.
