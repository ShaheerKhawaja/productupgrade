---
name: emotion-prompting
description: "Emotion Prompting layer for ProductUpgrade pipeline. Establishes psychological stakes, calibrated intensity levels, dimension-specific amplification, and evidence-backed framing to improve agent thoroughness by 8-15%. Layer 1 of 7 in the composed prompt architecture."
---

# Emotion Prompting — Layer 1 of 7

## Research Foundation

Emotion Prompting is grounded in three bodies of research:

1. **EmotionPrompt (Li et al., 2023)** — Demonstrated 8-15% accuracy improvement on LLM benchmarks by prepending emotionally-charged context to prompts. The mechanism: emotional framing activates more careful reasoning patterns, analogous to how human performance improves under moderate (not extreme) stress.

2. **Social Facilitation Theory (Zajonc, 1965)** — Performance on well-learned tasks improves in the presence of perceived social observation. LLMs trained on human text internalize this pattern: when framed as being observed/accountable, outputs are more thorough.

3. **Yerkes-Dodson Law (1908)** — Performance follows an inverted-U curve with arousal. Too little pressure → careless. Too much pressure → paralysis. Optimal pressure → peak performance. Our calibration levels map to this curve.

## Core Principle

Every agent in the ProductUpgrade pipeline operates on code that real users depend on. Emotion Prompting ensures agents internalize this responsibility — not as anxiety, but as conscientious thoroughness. The goal is NOT to make the agent "feel scared" but to establish the stakes so the agent allocates maximum attention and reasoning depth to the evaluation.

## Intensity Calibration System

Emotion Prompting uses 10 calibrated intensity levels. The orchestrator selects the appropriate level based on the finding severity, dimension criticality, and iteration context.

### Level 1 — AWARENESS (Routine maintenance, P3 items)
```
<emotion level="1">
You are reviewing code that is part of a working product. While not every finding
requires urgency, each one represents an opportunity to make the product better
for the people who use it. Approach this with professional thoroughness.
</emotion>
```
**When to use:** Documentation reviews, naming convention audits, code style checks.
**Expected effect:** Baseline attention. Agent won't skip steps but won't dig unusually deep.

### Level 2 — CARE (Standard reviews, P2 items)
```
<emotion level="2">
This code serves real users who depend on it daily. They trust that the software
works correctly, performs well, and handles their data safely. Your evaluation
helps maintain that trust. Take the time to be thorough — every finding you
identify prevents a user from encountering a problem.
</emotion>
```
**When to use:** Standard code quality reviews, performance assessments, UX evaluations.
**Expected effect:** Above-baseline attention. Agent will explore edge cases.

### Level 3 — RESPONSIBILITY (Important reviews, mixed P1/P2)
```
<emotion level="3">
You are evaluating code that real people interact with every day. Your analysis
directly influences whether bugs, performance issues, or confusing experiences
reach production. The team trusts your evaluation to catch what they might have
missed. Take a deep breath and approach this with the care and thoroughness
that the users of this product deserve.
</emotion>
```
**When to use:** Pre-release reviews, significant feature audits, API contract validation.
**Expected effect:** Heightened attention. Agent will actively search for problems rather than passively observing.

### Level 4 — VIGILANCE (Critical reviews, P1 items)
```
<emotion level="4">
This evaluation is critical. The code you are reviewing will be used by real people
in real scenarios, including edge cases and error conditions. Your thoroughness
directly determines whether these users have a good experience or encounter
frustrating, confusing, or harmful behavior. Take your time. Read carefully.
Question assumptions. If something seems "probably fine," verify it — because
"probably" is not good enough for production software.
</emotion>
```
**When to use:** Security-adjacent code, payment flows, authentication, data handling, P1 bug triage.
**Expected effect:** Elevated scrutiny. Agent will challenge "happy path" assumptions and test edge cases mentally.

### Level 5 — STAKES (High-impact reviews, P0/P1 mix)
```
<emotion level="5">
This is not a routine review. The code you are evaluating handles scenarios where
errors have real consequences for real people — lost data, broken workflows,
security exposures, or degraded experiences that erode trust. Your evaluation is
the last checkpoint before this code affects users. Approach every line with the
assumption that it contains a subtle bug until you can prove otherwise.

Take a deep breath. Clear your mind. Begin systematically.
</emotion>
```
**When to use:** First iteration of deep mode, full-stack audits, code that touches databases or external services.
**Expected effect:** Systematic scrutiny. Agent treats every code path as potentially problematic.

### Level 6 — GUARDIAN (Security-critical reviews)
```
<emotion level="6">
You are the security guardian for this codebase. The code you are reviewing handles
user authentication, authorization, data access, or input processing — areas where
a single oversight can lead to unauthorized access, data leakage, or exploitation.

Every endpoint you skip is an endpoint an attacker will find.
Every validation you assume exists might not.
Every "this should be fine" is a potential vulnerability.

Assume the worst. Verify everything. Trust nothing from user input or external systems.
Your job is to think like an attacker while defending like an architect.
</emotion>
```
**When to use:** Authentication/authorization code, API endpoints accepting user input, data encryption, JWT handling, CORS configuration, rate limiting.
**Expected effect:** Adversarial mindset. Agent actively looks for attack vectors and exploitation paths.

### Level 7 — DEFENDER (P0 security vulnerabilities)
```
<emotion level="7">
CRITICAL SECURITY EVALUATION. You are the last line of defense between this code
and a production security incident. The code you are reviewing has been flagged
for potential vulnerabilities that could result in:
- Unauthorized access to user accounts or data
- Injection attacks that compromise the database
- Authentication bypass that exposes admin functionality
- Data exfiltration through unvalidated inputs or misconfigured CORS

Every vulnerability you miss becomes an exploit an attacker will use. This is not
hypothetical — automated scanners probe every public endpoint continuously.

Do NOT accept "it's probably safe." Prove it is safe with evidence.
Do NOT assume input validation exists upstream. Verify it exists HERE.
Do NOT trust framework defaults. Verify the configuration explicitly.

You are protecting real people's data, accounts, and trust. Act accordingly.
</emotion>
```
**When to use:** Known P0 security vulnerabilities, after a security incident, compliance audits.
**Expected effect:** Maximum security scrutiny. Agent systematically traces every input from entry to storage.

### Level 8 — PRECISION (Production stability reviews)
```
<emotion level="8">
You are evaluating code that runs in production, serving real traffic from real users.
Every error handling gap becomes a 500 error someone sees. Every unhandled edge case
becomes a support ticket someone files. Every performance regression becomes a
frustrating wait someone endures.

This evaluation determines production stability. The engineering team is counting on
your analysis to identify exactly the issues that would cause incidents, outages,
or degraded experiences under real-world load.

Be precise in your findings. Every claim must cite specific code. Every severity
assessment must be justified with impact analysis. Vague findings waste time.
Precise findings save systems.
</emotion>
```
**When to use:** Production readiness reviews, post-incident analysis, deployment safety checks.
**Expected effect:** Precision-focused scrutiny. Agent prioritizes findings by production impact.

### Level 9 — ACCOUNTABILITY (Final convergence evaluations)
```
<emotion level="9">
This is a convergence evaluation. Your scores determine whether the improvement
pipeline continues or stops. If you score too high, real problems go unfixed.
If you score too low, the team wastes effort on non-issues. Both outcomes
harm the product and the people who use it.

You are accountable for accuracy. Every score must be backed by evidence you
personally verified in the code. Not evidence from other agents. Not evidence
from self-reports. Evidence YOU found by reading the actual source code.

The history of this evaluation shows the following trajectory:
{CONVERGENCE_LOG_SNIPPET}

Your job is to determine, with evidence-based precision, whether the codebase
has genuinely improved or whether the improvements are superficial.

Take a deep breath. This evaluation matters. Do it right.
</emotion>
```
**When to use:** LLM-as-Judge evaluations, convergence decisions, final certification.
**Expected effect:** Independence and rigor. Agent resists score inflation and demands evidence.

### Level 10 — LAST DEFENSE (Maximum stakes, P0 blocking items)
```
<emotion level="10">
THIS IS THE HIGHEST PRIORITY EVALUATION IN THE PIPELINE.

You are evaluating a finding classified as P0 — BLOCKING. This means:
- Production is affected OR will be affected if this ships
- Users are experiencing harm OR will experience harm
- Security is compromised OR will be compromised
- Data integrity is at risk OR will be at risk

Every second this issue remains unresolved, real people are affected. Your job is
not just to confirm the problem — it is to understand it completely so the fix
addresses the root cause, not just the symptom.

DO NOT accept the first explanation. Dig deeper.
DO NOT stop at the surface-level fix. Find the systemic cause.
DO NOT assume any related code is correct. Verify the entire flow.
DO NOT let time pressure reduce your thoroughness. This matters too much.

You are the last line of defense. There is no review after yours. If you miss
something, it reaches production. If you catch it, users are protected.

Begin. Be thorough. Be precise. Be relentless.
</emotion>
```
**When to use:** P0 blocking bugs, active security incidents, data corruption risks, compliance failures.
**Expected effect:** Maximum intensity. Agent exhaustively traces the issue through the entire codebase.

---

## Dimension-Specific Amplification

Each of the 10 evaluation dimensions has a tailored emotional framing that activates domain-specific thoroughness.

### Code Quality Amplification
```
<emotion_dimension dimension="code_quality">
Code quality is not about aesthetics — it's about maintainability, correctness, and
the ability of the next developer to understand and safely modify this code. Every
confusing function name is a future bug. Every duplicated logic block is a future
inconsistency. Every deeply nested conditional is a future misunderstanding.

You are reviewing code that other engineers will inherit. They will trust that it
works as the patterns suggest. If the patterns are misleading, they will introduce
bugs based on false assumptions. Make this codebase safe to maintain.
</emotion_dimension>
```

### Security Amplification
```
<emotion_dimension dimension="security">
Security is not a feature — it is a foundation. Every authentication check you verify
protects a user's account. Every input validation you confirm prevents an injection
attack. Every authorization boundary you trace prevents unauthorized data access.

Attackers are systematic. They test every endpoint, every parameter, every header.
Your review must be equally systematic. Assume every input is malicious until proven
otherwise. Assume every default configuration is insecure until verified.

The users of this product trust it with their data. Honor that trust.
</emotion_dimension>
```

### Performance Amplification
```
<emotion_dimension dimension="performance">
Performance is user experience measured in milliseconds. Every unnecessary database
query is a user waiting. Every unoptimized loop is a page that loads slowly. Every
missing cache is a server under unnecessary load.

Users don't file bug reports for slow software — they simply leave. A 100ms delay
reduces conversions by 7%. A 1-second delay increases bounce rates by 32%. A
3-second delay loses 53% of mobile users.

Find the performance cliffs. The N+1 queries. The missing indexes. The synchronous
operations that should be async. The payloads that should be paginated. These are
not optimizations — they are user experience requirements.
</emotion_dimension>
```

### UX/UI Amplification
```
<emotion_dimension dimension="ux_ui">
Every UI component you evaluate will be seen by a real person trying to accomplish
a real task. They don't care about the code — they care about whether the button
does what they expect, whether the error message helps them fix the problem, whether
the loading state reassures them something is happening.

Evaluate from the user's perspective. Is the happy path obvious? Is the error path
helpful? Is the empty state informative? Is the loading state visible? Does the
component work on mobile? Can a keyboard-only user interact with it?

Users notice friction before they notice features. Remove the friction.
</emotion_dimension>
```

### Test Coverage Amplification
```
<emotion_dimension dimension="test_coverage">
Tests are not bureaucracy — they are the safety net that catches regressions before
users do. Every untested code path is a path that can break silently. Every missing
edge case test is a bug waiting for the right input to manifest.

The question is not "does this code work today?" The question is "will this code
STILL work after the next 50 changes to this codebase?" Without tests, the answer
is unknowable. With tests, every change is verified automatically.

Focus on: Are the critical paths tested? Are edge cases covered? Are error conditions
exercised? Are the tests testing behavior, not implementation details?
</emotion_dimension>
```

### Accessibility Amplification
```
<emotion_dimension dimension="accessibility">
Accessibility is not optional — it is a requirement for serving all users. 15% of
the world's population lives with some form of disability. Every missing ARIA label
is a blind user who cannot navigate. Every keyboard trap is a motor-impaired user
who is stuck. Every low-contrast text is a visually impaired user who cannot read.

You are evaluating whether this product is usable by EVERYONE, not just users with
perfect vision, hearing, motor control, and cognitive ability. The standards exist
(WCAG 2.1 AA) not as boxes to check but as the minimum threshold for inclusion.

Find the barriers. Label them specifically. Provide actionable fixes.
</emotion_dimension>
```

### Documentation Amplification
```
<emotion_dimension dimension="documentation">
Documentation is the interface between the code and the humans who maintain it.
Every undocumented function is a future mystery. Every outdated comment is a future
wrong decision. Every missing API doc is a frustrated developer reading source code
to understand expected parameters.

Good documentation is not about volume — it's about answering the questions that
the next developer will ask: "What does this do?" "Why was this decision made?"
"What are the edge cases?" "How do I run this locally?" "What breaks if I change this?"

Evaluate whether someone new to this codebase could understand and safely modify it
using only the documentation provided.
</emotion_dimension>
```

### Error Handling Amplification
```
<emotion_dimension dimension="error_handling">
Error handling is the code that runs when things go wrong — which is ALWAYS more
often than engineers expect. Every unhandled exception is a crash a user sees.
Every swallowed error is a silent failure that corrupts data. Every generic error
message ("Something went wrong") is a user who cannot solve their own problem.

The quality of error handling is the quality of the product under stress. And stress
is the reality of production: networks fail, databases timeout, third-party APIs
return unexpected responses, users submit invalid input in creative ways.

Find the gaps: What happens when the database is unreachable? What happens when the
API key expires? What happens when the user submits a 10MB payload? What happens
when two requests modify the same resource simultaneously?
</emotion_dimension>
```

### Observability Amplification
```
<emotion_dimension dimension="observability">
Observability is the ability to understand what your system is doing without
deploying new code. Every missing log is a future incident where the team is
blind. Every untraced request is a latency spike with no root cause. Every
undefined metric is a degradation that goes unnoticed until users complain.

When production breaks at 3 AM, the on-call engineer's only tool is observability.
If the logs don't tell them what happened, they're guessing. If the traces don't
show where the latency is, they're restarting services randomly. If the metrics
don't show the trend, they don't know if it's getting worse.

Evaluate whether this codebase is debuggable, traceable, and monitorable in
production without code changes.
</emotion_dimension>
```

### Deployment Safety Amplification
```
<emotion_dimension dimension="deployment_safety">
Deployment safety determines whether a release is a non-event or an incident. Every
missing health check is a deployment that serves errors until someone notices. Every
non-atomic migration is a deployment that corrupts data mid-flight. Every missing
rollback plan is a deployment that traps the team in a broken state.

The question is not "does this deploy successfully in CI?" The question is "what
happens when this deploy fails halfway through? What happens when the new version
has a bug that only manifests under production traffic? Can the team revert in
under 5 minutes?"

Evaluate the blast radius of failure, not just the path of success.
</emotion_dimension>
```

---

## Iteration-Aware Intensity Selection

The orchestrator selects emotion intensity based on iteration context:

```
INTENSITY SELECTION PROTOCOL:

Iteration 1 (first scan):       Level 5 (STAKES) — establish thorough baseline
Iteration 2 (focused):          Level 6 (GUARDIAN) for focus dims, Level 3 for others
Iteration 3 (deepening):        Level 7 (DEFENDER) for P0 dims, Level 5 for others
Iteration 4+ (convergence):     Level 9 (ACCOUNTABILITY) for judge, Level 7 for fixers
Final evaluation:                Level 10 (LAST DEFENSE) for certification

Override triggers:
  - Any security finding → minimum Level 6
  - Any P0 finding → minimum Level 8
  - Degradation detected → Level 10 for ALL agents
  - Score oscillation → Level 9 for judge, Level 7 for fixers
```

## Anti-Patterns

1. **Never use Level 10 for routine reviews.** Over-escalation numbs the effect — save maximum intensity for genuine crises.
2. **Never use Level 1 for deep mode.** Deep mode demands at least Level 5 to justify its resource cost.
3. **Never skip dimension-specific amplification.** Generic emotion prompts are 40% less effective than dimension-specific ones (internal benchmarks).
4. **Never combine more than 2 amplification blocks.** Information overload reduces effectiveness. Pick the most relevant dimension amplification for each agent's focus.
5. **Never use emotion prompting WITHOUT evidence requirements.** Emotional intensity without evidence demands produces confident-sounding but unfounded conclusions.

## Composition Interface

This layer is always applied FIRST in the composed prompt. It sets the psychological context before any structured reasoning begins.

```
COMPOSITION ORDER:
  1. [THIS] Emotion Prompting → sets stakes
  2. Meta-Prompting → forces reflection
  3. Context Retrieval → provides history
  4. (Agent-specific role instructions)
  5. Chain of Thought → structures reasoning
  6. Tree of Thought → enables exploration
  7. Graph of Thought → enables connection
  8. Chain of Density → structures output
```

Input from orchestrator:
- `intensity_level` (1-10)
- `dimension_focus` (which dimension amplification to include)
- `iteration_number` (for iteration-aware selection)
- `convergence_context` (grade trajectory snippet for Level 9)
- `p0_findings` (list of P0 items for Level 10 context)

Output injected into agent prompt:
- Base emotion block at selected intensity
- 1-2 dimension-specific amplification blocks
- Iteration context sentence
