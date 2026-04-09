# ProductionOS Escalation Protocol

## Core Principle
Bad work is worse than no work. Agents are never penalized for escalating.
Shipping broken code wastes more time than pausing to ask.

## When to Escalate

### Automatic Escalation Triggers
1. **3 failed attempts** -- If you've tried 3 approaches and none work, STOP
2. **Security-sensitive changes** -- Auth, payment, credentials, PII = always escalate
3. **Scope exceeds verification** -- If you can't verify correctness, don't ship it
4. **Contradictory requirements** -- If instructions conflict, ask, don't guess
5. **Destructive operations** -- Delete, reset, force-push = confirm first
6. **Cross-project impact** -- Changes that affect other repos or services

### Quality Escalation
- Self-eval score < 6.0 after 3 heal loops -> BLOCK
- Convergence stalled for 3+ iterations -> PIVOT or escalate
- Test failures that can't be resolved -> don't skip, escalate
- Regression detected (any dimension drop > 0.5) -> rollback + escalate

### Context Escalation
- Context usage > 80% with unfinished work -> compress or hand off
- Missing environment variables or credentials -> don't guess values
- Undocumented API behavior encountered -> document finding + escalate
- Dependency version conflict that can't be resolved -> escalate with lockfile diff

### Scope Escalation
- Task requires modifying files outside the agent's focus area -> escalate
- Estimated change touches > 15 files or > 200 lines per file -> break down first
- Change requires coordination across multiple services -> escalate to orchestrator
- Migration or schema change detected -> always escalate (HIGH stakes)

## Escalation Format

```
STATUS: BLOCKED | NEEDS_CONTEXT | DEGRADED
REASON: [1-2 sentences -- what went wrong]
ATTEMPTED: [what approaches were tried]
IMPACT: [what breaks if we proceed without resolution]
RECOMMENDATION: [what the user should do next]
```

### Example Escalations

**BLOCKED -- Security boundary**
```
STATUS: BLOCKED
REASON: Auth middleware change requires modifying JWT validation logic in 3 services.
ATTEMPTED: Isolated change to gateway only, but downstream services reject new token format.
IMPACT: All authenticated API calls will fail if deployed partially.
RECOMMENDATION: Coordinate deployment across gateway + api + worker services simultaneously.
```

**NEEDS_CONTEXT -- Missing information**
```
STATUS: NEEDS_CONTEXT
REASON: Database migration requires knowing whether table X has production data.
ATTEMPTED: Checked schema and migrations, no seed data or row counts available.
IMPACT: DROP COLUMN on a populated table loses data permanently.
RECOMMENDATION: Run `SELECT count(*) FROM table_x` in production before proceeding.
```

**DEGRADED -- Below threshold**
```
STATUS: DEGRADED
REASON: Implementation works but self-eval scores 5.8/10 on test coverage dimension.
ATTEMPTED: 3 heal loops adding tests, but edge cases in async flow are hard to mock.
IMPACT: Happy path works, but error handling in WebSocket reconnection is untested.
RECOMMENDATION: Accept with manual QA, or allocate time for integration test harness.
```

## Completion Status Protocol

Every agent output MUST include one of these statuses:

- **DONE** -- All steps completed. Evidence provided for each claim.
- **DONE_WITH_CONCERNS** -- Completed, but issues the user should know about.
- **BLOCKED** -- Cannot proceed. State what blocks and what was tried.
- **NEEDS_CONTEXT** -- Missing information. State exactly what you need.
- **DEGRADED** -- Completed but quality is below threshold. State which dimensions.

### Status Rules
- DONE requires evidence (test output, screenshot, diff, or verification command)
- DONE_WITH_CONCERNS must list every concern -- no burying issues in prose
- BLOCKED must include at least 2 attempted approaches
- NEEDS_CONTEXT must ask a specific question, not "I need more info"
- DEGRADED must include the self-eval score and which dimensions are below threshold

## Anti-Patterns

### "Swallow and Continue"
Catching errors silently is NEVER acceptable. Every caught exception must either:
- Be logged with operation-specific context (logger.error + re-raise)
- Be handled with an explicit recovery path
- Be escalated if the recovery path is unclear

### "Good Enough"
If you wouldn't trust it at 2am on a Friday, it's not done.
The bar is: would you deploy this knowing YOU get the 2am page?

### "I'll Fix It Later"
Deferred fixes are forgotten fixes. Two options:
- Fix it now, or
- File a TODO with a GitHub issue number, specific description, and severity

### "The Tests Pass"
Passing tests prove the happy path. Always ask:
- What about the sad path? (invalid input, network failure, timeout)
- What about the edge path? (empty list, null, concurrent access, max int)
- What about the security path? (injection, auth bypass, IDOR)

### "It Works on My Machine"
Environment-dependent code is broken code. Check:
- Are paths absolute or relative? (use path.join, not string concat)
- Are env vars present in all environments? (dev, staging, prod)
- Are dependencies pinned? (lockfile committed)
- Does it work with a clean install? (no cached state)

### "Just One More Change"
Scope creep kills quality. If the fix requires touching something unrelated:
- Stop
- Commit what you have
- Open a new task for the unrelated change
- Resume the original task

## Escalation Chain

```
Agent (self-eval < 6.0, 3 failed attempts)
  -> Orchestrator (re-route, provide context, try different agent)
    -> Human (BLOCKED status, clear recommendation)
```

Agents escalate to orchestrators. Orchestrators escalate to humans.
Never skip a level unless the issue is security-critical (then go straight to human).

## Recovery After Escalation

When an escalation is resolved:
1. Document what the resolution was
2. Extract an instinct if the pattern is likely to recur
3. Update the agent's context with the new knowledge
4. Re-run self-eval to confirm the fix meets threshold
