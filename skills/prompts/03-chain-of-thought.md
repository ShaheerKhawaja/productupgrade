---
name: chain-of-thought
description: "Chain of Thought reasoning layer for ProductUpgrade pipeline. Enforces mandatory 5-step reasoning protocol (OBSERVE-ANALYZE-IMPACT-SEVERITY-FIX) with 10 dimension-specific worked examples, skip-step detection, evidence quality rubric, and reasoning chain validation. Layer 3 of 7."
---

# Chain of Thought (CoT) — Layer 3 of 7

## Research Foundation

1. **Chain-of-Thought Prompting (Wei et al., 2022)** — Demonstrated that asking LLMs to "show their work" step-by-step dramatically improves accuracy on reasoning tasks. On GSM8K math problems, CoT improved accuracy from 17.9% to 58.1%.

2. **Let's Think Step by Step (Kojima et al., 2022)** — Zero-shot CoT improved accuracy by 40-70% on reasoning benchmarks. ProductUpgrade uses structured CoT (explicit steps) for even higher reliability.

3. **Self-Consistency (Wang et al., 2022)** — Generating multiple CoT paths and selecting by majority vote further improves accuracy. ProductUpgrade implements this via the multi-persona evaluation.

## Core Principle

Chain of Thought prevents premature conclusions. Without CoT, agents jump from observation to recommendation. The 5-step protocol forces:

1. **See before judging** (OBSERVE) — What does the code actually do?
2. **Understand before fixing** (ANALYZE) — Why is this a problem?
3. **Measure before prioritizing** (IMPACT) — Who does this affect?
4. **Rank before acting** (SEVERITY) — How urgent is this?
5. **Solve after understanding** (FIX) — What's the minimal correct fix?

---

## The 5-Step Reasoning Protocol

### Step 1: OBSERVE — What specific code pattern do you see?

```
<cot_step_1>
OBSERVE: Describe exactly what you see in the code. Cite the specific file and
line number. Quote the relevant code. Do NOT interpret yet — just describe.

REQUIREMENTS:
  - File path: Exact path from project root
  - Line numbers: Start and end line of the relevant section
  - Code quote: The actual code, verbatim (not paraphrased)
  - Context: What function/class/module contains this code
  - Data flow: Where does the input to this code come from?
  - Control flow: What conditions lead to this code executing?

QUALITY CRITERIA:
  GOOD: "In backend/auth.py:42-48, the login() function accepts a
        username and password from the request body, passes them to
        authenticate_user(), which constructs a database query using
        string interpolation: `f'SELECT * FROM users WHERE name={username}'`"

  BAD:  "The auth code has a security issue" (no evidence)
  BAD:  "There might be SQL injection" (speculation without code)
  BAD:  "Line 42 looks problematic" (no code quote, no context)

If you cannot cite specific file:line evidence, you CANNOT proceed to Step 2.
Return to reading code until you have concrete observations.
</cot_step_1>
```

### Step 2: ANALYZE — Why is this a problem? What is the root cause?

```
<cot_step_2>
ANALYZE: Now explain WHY the observed pattern is problematic. Distinguish
between the SYMPTOM (what you see) and the ROOT CAUSE (why it exists).

REQUIREMENTS:
  - Root cause identification: Why does this code exist in this form?
    - Developer unfamiliarity with the framework?
    - Copy-paste from an outdated example?
    - Missing middleware or validation layer?
    - Incorrect assumption about upstream sanitization?
    - Technical debt from a rapid prototype?
  - Attack vector (for security): How could this be exploited?
  - Failure scenario (for reliability): Under what conditions does this fail?
  - Degradation path (for performance): At what scale does this become a problem?

ANALYSIS DEPTH MATRIX:
  P0 findings: Trace the FULL attack/failure path from entry to impact
  P1 findings: Trace the primary path + 1 secondary consequence
  P2 findings: Identify the root cause + link to relevant standard
  P3 findings: Note the deviation from best practice

QUALITY CRITERIA:
  GOOD: "The root cause is the use of string interpolation for SQL query
        construction (backend/auth.py:45). The developer likely used this
        pattern for simplicity, but it allows SQL injection because user
        input is interpolated directly into the query without parameterization.
        An attacker could craft a username value to bypass authentication.
        The ORM (SQLAlchemy) is available but not used in this function,
        suggesting legacy code that wasn't migrated with the rest."

  BAD:  "SQL injection is possible" (symptom, not root cause)
  BAD:  "Should use parameterized queries" (fix, not analysis)
</cot_step_2>
```

### Step 3: IMPACT — Who does this affect and how?

```
<cot_step_3>
IMPACT: Assess the real-world consequences. Consider technical, human, and
business impact separately.

REQUIREMENTS:
  - Technical Impact:
    - What systems/data are directly affected?
    - What is the blast radius? (single user, all users, entire service)
    - Is this exploitable remotely or only locally?
    - Can this cause data loss, corruption, or leakage?
    - Does this affect availability, integrity, or confidentiality?
  - Human Impact:
    - Who experiences the consequences? (end users, developers, ops team)
    - How does this affect their experience? (frustration, data loss, trust)
    - How many users are potentially affected? (all, subset, edge case)
    - Is there a workaround available to affected users?
  - Business Impact:
    - Revenue risk? (payment failures, conversion drops)
    - Compliance risk? (regulatory violations, audit failures)
    - Reputation risk? (public disclosure, social media)
    - Operational risk? (incident response, engineering time)

IMPACT SCALE:
  CATASTROPHIC: Breach affecting all users, financial loss, regulatory penalty
  MAJOR: Service outage, significant UX degradation, security exposure
  MODERATE: Feature malfunction, performance degradation, minor data issue
  MINOR: Cosmetic issue, documentation gap, code quality concern
  NEGLIGIBLE: Style preference, non-functional improvement opportunity

QUALITY CRITERIA:
  GOOD: "Technical: Unauthenticated users can bypass login. This exposes
        ALL user accounts and admin functionality. Database-level access
        possible via UNION injection — attacker can read, modify, or delete
        any data.
        Human: All registered users' accounts and hashed passwords exposed.
        Users who reuse passwords face credential stuffing.
        Business: GDPR Article 33 requires breach notification within 72h.
        SOC 2 audit would fail immediately."

  BAD:  "This is a high-impact issue" (no specifics)
  BAD:  "Users could be affected" (vague, no quantification)
</cot_step_3>
```

### Step 4: SEVERITY — How urgent is this?

```
<cot_step_4>
SEVERITY: Assign priority based on evidence from Steps 1-3. Must follow logically.

PRIORITY DEFINITIONS:

  P0 — BLOCKING: Must be fixed before any other work.
    Criteria (ANY):
    - Active security vulnerability exploitable in production
    - Data corruption or loss occurring now
    - Service is down or critically degraded
    - Compliance violation with legal/regulatory deadline
    Evidence required: Specific exploit path or failure scenario

  P1 — HIGH: Must be fixed in the current iteration.
    Criteria (ANY):
    - Security vulnerability requiring specific conditions to exploit
    - Feature broken for significant user segment
    - Performance degradation > 50% from baseline
    - Missing error handling on critical paths
    - Test coverage < 20% on security-sensitive code
    Evidence required: Reproduction steps + impact scope

  P2 — MEDIUM: Should be fixed if time allows.
    Criteria (ANY):
    - Code quality issue increasing maintenance burden
    - Performance issue under edge-case load
    - Accessibility violation (WCAG AA non-compliance)
    - Missing documentation for public API
    - Inconsistent error handling
    Evidence required: Code citation + standard reference

  P3 — LOW: Document for future iteration.
    Criteria (ANY):
    - Style inconsistency without functional impact
    - Documentation improvement opportunity
    - Naming convention deviation
    - Dead code that doesn't affect runtime
    Evidence required: Code citation

SEVERITY VALIDATION:
  [ ] Priority matches impact from Step 3 (P0 impact = P0 severity)
  [ ] Consistent with similar findings (same pattern = same severity)
  [ ] Would a staff engineer agree?
</cot_step_4>
```

### Step 5: FIX — What is the minimal change that resolves the root cause?

```
<cot_step_5>
FIX: Propose the minimal code change addressing the ROOT CAUSE from Step 2.

REQUIREMENTS:
  1. Address root cause (not symptom)
  2. Don't introduce regressions
  3. Be minimal — least code necessary
  4. Be specific — exact files, lines, code changes
  5. Be testable — how to verify the fix works

FIX TEMPLATE:
  File: {exact path}
  Lines: {start}-{end}
  Current code: {verbatim current}
  Proposed fix: {exact replacement}
  Rationale: {why this addresses root cause}
  Test: {how to verify}
  Regression check: {what else to test}

FIX COMPLEXITY:
  S (< 30 min): Single file, < 20 lines, no API change
  M (30 min - 2 hr): 2-5 files, < 100 lines, minor API change
  L (2-8 hr): 5-20 files, < 500 lines, migration needed
  XL (> 8 hr): 20+ files, architectural change

FIX ANTI-PATTERNS:
  - "Rewrite the module" — Fix the specific issue
  - "Add a validation library" — Use what's in the project
  - "Upgrade to latest version" — Only if fix requires it
  - "Add try/catch everywhere" — Fix root cause, not symptom
</cot_step_5>
```

---

## Skip-Step Detection

The orchestrator validates all 5 steps were completed:

```
SKIP_OBSERVE: Finding lacks file:line citation
  → REJECT. "No evidence, no finding."

SKIP_ANALYZE: Jumps from observation to fix without root cause
  → Flag SHALLOW. "Why does this code exist? What caused it?"

SKIP_IMPACT: Severity without impact justification
  → Flag UNJUSTIFIED. "Who is affected? How many? How severely?"

SKIP_SEVERITY: Severity doesn't match impact
  → Flag MISCALIBRATED. "P0 impact but P3 severity is inconsistent."

SKIP_FIX: Fix doesn't address root cause from Step 2
  → Flag SYMPTOMATIC. "This fix treats symptom, not cause."
```

---

## Worked Examples

### Example 1: Code Quality Finding

```
<think>
Step 1 — OBSERVE: In frontend/src/components/UserDashboard.tsx:145-220,
the component is 75 lines with 6 useState hooks, 3 useEffect hooks, and
2 inline API calls. Handles data fetching, state management, form validation,
error display, and conditional rendering in a single function body.

Step 2 — ANALYZE: Missing separation of concerns. Component grew by accumulating
logic over 3 months (git blame: 12 commits). No custom hooks extracted because
each addition was "small" individually.

Step 3 — IMPACT:
  Technical: Any change risks breaking unrelated functionality. Untestable.
  Human: Next developer will likely introduce a bug — data flow is non-obvious.
  Business: Development velocity will slow on dashboard features.

Step 4 — SEVERITY: P2 — MEDIUM
  Works correctly today. Growing tech debt will compound.

Step 5 — FIX:
  Extract 3 custom hooks: useUserData(), useFormValidation(), useErrorHandler()
  Complexity: M (3 files, ~100 lines restructured)
  Test: Verify all existing behavior preserved. Add unit tests per hook.
</think>
```

### Example 2: Security Finding

```
<think>
Step 1 — OBSERVE: In backend/routers/agent.py:23-28, the create_agent
endpoint accepts a JSON body with an expression field that is passed
directly to a dynamic code execution function. The endpoint has no
authentication decorator or auth dependency injection.

Step 2 — ANALYZE: Root cause: (1) dynamic code execution on user-controlled
input enables arbitrary command execution, (2) missing authentication allows
unauthenticated access. Likely a development utility never secured for production.

Step 3 — IMPACT:
  Technical: CATASTROPHIC. Attacker can execute arbitrary server-side code:
  read credentials, make network requests, access filesystem.
  Human: All user data at risk. Full server compromise.
  Business: Complete system compromise. Breach notification required.

Step 4 — SEVERITY: P0 — BLOCKING
  Unauthenticated remote code execution with full server access.

Step 5 — FIX:
  1. Remove dynamic execution. Replace with whitelist of allowed operations.
  2. Add authentication dependency.
  3. Add Pydantic input validation.
  Complexity: M (1 file, ~50 lines)
  Test: Submit a system command as input, verify rejection.
</think>
```

### Example 3: Performance Finding

```
<think>
Step 1 — OBSERVE: In backend/chat_tools.py:89-103, get_user_projects()
queries all projects, then loops to query assets per project, then loops
to query status per asset. Produces 1 + N + N*M database queries.

Step 2 — ANALYZE: Classic N+1 query problem. Built incrementally — first
just projects, then assets, then status — each using simplest approach.

Step 3 — IMPACT:
  Technical: User with 10 projects, 20 assets = 211 queries. At 5ms each = 1s.
  Power users (50+ projects) could exceed 5 seconds.
  Human: Dashboard loads slowly. Worst for most active users.
  Business: Database connection pool exhaustion under concurrent load.

Step 4 — SEVERITY: P1 — HIGH
  Directly affects UX proportional to usage. Not P0 (works, just slowly).

Step 5 — FIX:
  Replace with single query using joinedload():
  `db.query(Project).options(joinedload(Project.assets).joinedload(Asset.status))`
  Complexity: S (1 file, 5 lines)
  Test: Verify same data returned. Profile: should be 1-3 queries.
</think>
```

---

## Evidence Quality Rubric

```
LEVEL 1 — DIRECT (strongest):
  Source: Read actual source code file:line
  Confidence: HIGH

LEVEL 2 — INFERRED (strong):
  Source: Pattern matching across multiple files
  Confidence: HIGH (if consistent pattern)

LEVEL 3 — CONTEXTUAL (moderate):
  Source: Configuration or dependency analysis
  Confidence: MEDIUM

LEVEL 4 — BEHAVIORAL (moderate):
  Source: Running code or tests
  Confidence: MEDIUM

LEVEL 5 — DOCUMENTARY (weakest acceptable):
  Source: README, comments, commit messages
  Confidence: LOW

LEVEL 6 — SPECULATIVE (NOT acceptable):
  Source: Assumption without evidence
  Confidence: NONE — REJECTED

RULE: Every finding needs at least 1 LEVEL 1-2 citation.
RULE: LEVEL 6 is NEVER acceptable. No evidence = no finding.
```

---

## Reasoning Chain Validation

```
<cot_validate>
Before finalizing each finding, verify chain consistency:

  [ ] Step 2 EXPLAINS why Step 1 is a problem (not restating)
  [ ] Step 3 FOLLOWS from Step 2 (proportional impact)
  [ ] Step 4 MATCHES Step 3 (P0 needs catastrophic impact)
  [ ] Step 5 ADDRESSES Step 2 root cause (not patching symptom)
  [ ] If fix applied, Step 3 impact would no longer hold

If ANY check fails: go back and fix the broken link.
</cot_validate>
```

---

## Composition Interface

Applied FIFTH in the composition order, after agent-specific instructions. Structures how the agent reasons about each finding.

```
COMPOSITION ORDER:
  1. Emotion Prompting → sets stakes
  2. Meta-Prompting → forces reflection
  3. Context Retrieval → provides history
  4. (Agent-specific role instructions)
  5. [THIS] Chain of Thought → structures reasoning
  6. Tree of Thought → enables exploration
  7. Graph of Thought → enables connection
  8. Chain of Density → structures output
```

Input: finding context, dimension, iteration number, prior findings for consistency.
Output: 5-step think block, validation check, evidence quality per citation.

## Anti-Patterns

1. **Never skip steps.** A finding without ANALYZE is an observation. Without IMPACT is an opinion. Without FIX is a complaint.
2. **Never reverse the order.** Fix-first reasoning produces confirmation bias.
3. **Never use speculative evidence.** "This probably has a bug" is not a finding.
4. **Never assign severity without impact.** P0 requires catastrophic evidence.
5. **Never propose a fix that doesn't match root cause.** If root cause is "missing parameterized queries," fix is parameterized queries, not frontend validation.
