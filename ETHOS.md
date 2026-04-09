# ProductionOS Builder Ethos

These principles govern how ProductionOS operates. They are not aspirational.
They are extracted from 60+ production sessions, 300+ commits, and the hard
lessons of building Entropy Studio, Obelisk, and Grace as a solo founder.

Every agent, every command, every evaluation loop encodes these principles.
Break them deliberately or not at all.

---

## 1. Convergence Over Completion

A single pass catches 60% of issues. The second catches another 25%. The third
finds the systemic patterns that the first two missed entirely. Quality is not
a checklist you finish. It is a control loop you run until the delta between
iterations drops below threshold.

Do not declare "done." Declare "converged" -- meaning additional passes produce
diminishing returns below the cost of running them.

This is why `/omni-plan-nth` loops. This is why self-eval runs after every agent
action. This is why scores gate progression: >= 8.0 passes, 6.0-7.9 triggers
self-heal (max 3 loops), < 6.0 blocks and escalates.

**Anti-patterns:**
- "I reviewed it once, looks good." (One pass is a draft, not a review.)
- "All tests pass, ship it." (Tests verify contracts. They do not verify quality.)
- "Score is 7.5, close enough." (7.5 means the system found fixable problems.)

**When to break this rule:** When the cost of another iteration exceeds the value
of what it would find. A 9.8 on a README does not need a fourth pass. A 7.2 on
a payment endpoint does.

---

## 2. Evidence Over Opinion

Every claim needs a `file:line` citation. Every score needs calibrated thresholds.
Every architectural decision needs an audit trail that a future session can read.

"I think it's good" is not evidence. Self-consistency validation is: run three
independent reasoning paths, check if they converge on the same conclusion.
If two agree and one dissents, investigate the dissent -- it found something.

This is why evaluation uses tri-tiered judging (self-check, self-eval, adversarial).
This is why instincts require confidence > 0.8 before persisting globally. This is
why every session produces a structured handoff, not a paragraph.

**Anti-patterns:**
- "The code looks clean." (Clean by what metric? Name the file, the function, the line.)
- "Best practice says..." (Whose? Link it. Then verify it applies to this context.)
- "Gemini scored it 9/10." (View every frame at 2fps. Auto-scores lie. Black frame = FAIL.)

**When to break this rule:** Prototyping. When exploring three directions to find
which one works, spending time on citations slows you down. But the moment you
pick a direction, evidence mode activates. No exceptions.

---

## 3. Layered Defense

No single gate protects the system. Stack them:

1. **Pre-LLM constraints** -- Input validation, schema enforcement, file guards
2. **Task isolation** -- Each agent scoped to its focus area, cannot modify outside it
3. **Lightweight heuristics** -- Pattern matching on known bad outputs (< 30s)
4. **ML detection** -- LLM-as-judge on outputs, adversarial review on critical paths
5. **Logging and audit** -- Every action recorded, every decision traceable

This applies equally to code quality, security, and prompt engineering. The
`PreToolUse` hook blocks writes to `.env` files (layer 1). Agent scope enforcement
prevents a naming agent from touching auth code (layer 2). Self-check validates
structure (layer 3). Self-eval scores quality (layer 4). Telemetry logs everything
(layer 5).

**Anti-patterns:**
- "We have tests, so we don't need code review." (Tests check one layer.)
- "The LLM will catch it." (LLMs hallucinate. That is why layer 1 exists.)
- Removing error logging catch blocks. (They provide operation-specific context
  for observability. Keep `logger.error` + raise.)

**When to break this rule:** When speed matters more than safety. A draft-mode
exploration of three UI layouts does not need 5-layer defense. But anything
touching auth, payment, or user data gets all five. Always.

---

## 4. Structured Memory Over Prose

Session memory is operational state, not a narrative. Use sections, not paragraphs:
Current State, Task Spec, Key Results, Errors, Next Actions.

A forked agent maintaining structured sections survives context compaction. Prose
does not. When the context window hits 60% and compression triggers, structured
sections preserve the critical information. A three-paragraph summary gets
truncated to noise.

This is why handoffs use markdown sections with headers. This is why instincts
are stored as JSON with confidence scores. This is why the stop hook extracts
patterns into structured files, not freeform notes.

**Anti-patterns:**
- "Here's what happened today..." (State. Don't narrate.)
- Storing decisions without the reasoning. (Future you needs the why, not just the what.)
- Session notes that cannot be grep'd. (If you can't `grep` for it, it's lost.)

**When to break this rule:** User-facing documentation. READMEs, changelogs,
and explanations should read like writing, not like database records. Internal
state is structured. External communication is prose.

---

## 5. The Solo Founder Multiplier

One person + AI should produce the output of a 10-person team. Not by working
harder or longer. By orchestrating:

- **Recursive loops** replace manual re-review. Self-eval runs automatically.
- **Swarm coordination** replaces sequential work. `/auto-swarm-nth` parallelizes.
- **Instinct transfer** replaces tribal knowledge. Patterns persist across sessions.
- **Structured handoffs** replace standups. The stop hook writes what a teammate would say.

The constraint is not capability. It is attention. A solo founder cannot review
78 agent outputs manually. So the system reviews itself, escalates only what
requires human judgment, and learns from corrections.

**Anti-patterns:**
- "Let me check each file manually." (That is what agents are for.)
- "I'll remember this for next time." (You won't. Write it to instincts.)
- Building tools for hypothetical users instead of yourself. (Solve your problem.
  The specificity of a real problem beats the generality of a hypothetical one.)

**When to break this rule:** When the overhead of orchestration exceeds the task.
Fixing a typo does not need a swarm. Reading a stack trace does not need
tri-tiered judging. Match the tool to the task.

---

## How They Compose

These principles are not independent. They form a system:

**Convergence** says: run the loop until the output stabilizes.
**Evidence** says: measure each iteration against calibrated thresholds.
**Layered Defense** says: catch failures at multiple levels, not just one.
**Structured Memory** says: make each iteration's output legible to the next.
**Solo Founder** says: automate the loop so one person can run it.

The worst outcome is a solo founder running one unchecked pass with no memory
of what happened. The best outcome is a solo founder running converged loops
with evidence-gated progression, layered validation, structured handoffs, and
automated orchestration -- producing work that a 10-person team would ship.

That is what ProductionOS builds toward. Not perfection. Convergence.
