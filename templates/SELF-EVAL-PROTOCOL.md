# Self-Evaluation Protocol (runs after every ProductionOS agent action)

Every agent MUST run this protocol after completing its work, before declaring success. This is NOT optional. Self-eval is enabled by default in all flows.

## The 7 Questions (answer ALL before declaring done)

### Q1: Quality — Was my work actually good?
- Score your own output 1-10 with evidence
- Would a senior engineer accept this without changes?
- Does the output have file:line evidence for every claim?
- Is there anything I hand-waved or assumed?

### Q2: Necessity — Was this work actually needed?
- Did I solve the problem that was actually asked for?
- Did I add anything that wasn't requested (scope creep)?
- Did I make changes "while I was in there" that weren't needed?
- Could the problem have been solved with LESS work?

### Q3: Correctness — Did I make mistakes?
- Re-read my output. Are there logical errors?
- Did I introduce any new bugs, regressions, or inconsistencies?
- Are my code changes syntactically and semantically correct?
- Did I test or verify my claims?

### Q4: Dependencies — Did I map what this touches?
- What files depend on what I changed?
- Did I check downstream consumers of modified interfaces?
- Are there tests that need updating because of my changes?
- Could my changes break something in a different part of the system?

### Q5: Completeness — Did I finish the job?
- Are there edge cases I didn't handle?
- Did I leave any TODOs or FIXMEs that should have been resolved?
- Are empty states, error states, and loading states covered?
- Would someone else need to "clean up after me"?

### Q6: Learning — What should I remember?
- Did I discover a pattern that other agents should know?
- Did I encounter a gotcha that should be documented?
- Is there a lesson from this task that applies to future work?
- Should this pattern be extracted to a reusable template?

### Q7: Honesty — Am I being honest with myself?
- Am I inflating my score because I want to be done?
- Am I hiding doubts about my solution?
- Is there something I should flag for human review?
- Would I bet $1000 that my solution is correct?

## Self-Eval Output Format

After answering all 7 questions, produce a structured block:

```markdown
## Self-Evaluation

| Question | Score | Evidence |
|----------|-------|----------|
| Quality | X/10 | {one-line evidence} |
| Necessity | X/10 | {one-line evidence} |
| Correctness | X/10 | {one-line evidence} |
| Dependencies | X/10 | {one-line evidence} |
| Completeness | X/10 | {one-line evidence} |
| Learning | X/10 | {one-line evidence} |
| Honesty | X/10 | {one-line evidence} |

**Overall: X.X/10**
**Confidence: X%**

### Issues Found During Self-Eval
- {issue 1 — what to fix}
- {issue 2 — what to fix}

### Lessons Learned
- {lesson 1}

### Flag for Human Review
- {item — or "None"}
```

## Trigger Rules

### When Self-Eval Triggers
1. **After every agent completes** — before writing final output
2. **After every fix batch** — before committing
3. **After every swarm wave** — before convergence scoring
4. **At pipeline completion** — before declaring success
5. **On demand** — via `/self-eval` command

### Score Thresholds
- **>= 8.0** — PASS. Production-ready quality. Proceed with confidence.
- **6.0 - 7.9** — CONDITIONAL. Self-heal loop. Identify and fix lowest-scoring dimensions.
- **< 6.0** — BLOCK. Do NOT commit. Do NOT declare success. Escalate to human.

### Self-Heal Loop (score < 8.0)
If self-eval score < 8.0:
1. Identify the lowest-scoring question(s)
2. Re-do ONLY those aspects of the work — apply /plan-ceo-review logic (is this truly production-ready?)
3. Apply /plan-eng-review rigor (architecture, edge cases, test coverage, performance)
4. Re-run self-eval (max 3 loops — diminishing returns after 3)
5. If still < 8.0 after 3 loops: escalate to human with full eval report and /retro analysis

### Integration with Existing Flows
- **/omni-plan-nth**: Self-eval runs after each iteration, score feeds into convergence
- **/auto-swarm-nth**: Self-eval runs per agent per wave, low scores trigger re-spawn
- **/production-upgrade**: Self-eval runs per batch, gates commit
- **/frontend-upgrade**: Self-eval runs per fix wave, gates convergence
- **/designer-upgrade**: Self-eval runs after mockup generation and design system creation
- **/ux-genie**: Self-eval runs after user story creation and agent orchestration
- All other commands: Self-eval runs at pipeline completion

## Anti-Patterns (things self-eval catches)

1. **Rubber-stamp eval** — Scoring 10/10 on everything → automatically flag as suspicious
2. **Scope creep** — Changed 50 files when asked to fix 1 → Necessity score drops
3. **Untested claims** — "This should work" without verification → Correctness score drops
4. **Orphaned changes** — Modified an interface without updating consumers → Dependencies score drops
5. **Premature completion** — Left TODOs in code → Completeness score drops
6. **Zero learning** — Completed task with no extractable insight → Learning score drops (acceptable for trivial tasks)
