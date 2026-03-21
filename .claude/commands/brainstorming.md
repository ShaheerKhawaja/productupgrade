---
name: brainstorming
description: "Idea exploration before building — understand the problem, propose approaches, present design, get approval. HARD-GATE: no implementation until design is approved."
arguments:
  - name: idea
    description: "The idea or feature to brainstorm"
    required: true
---

# /brainstorming — Idea Exploration

Turn ideas into fully formed designs through collaborative dialogue.

## Step 0: Preamble
Run `templates/PREAMBLE.md`.

<HARD-GATE>
Do NOT write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it. Every project goes through this process, even "simple" ones.
</HARD-GATE>

## Process

### Phase 1: Understand
1. Check current project context (files, docs, git log)
2. Ask clarifying questions **one at a time**
3. Prefer multiple choice when possible
4. Focus on: purpose, constraints, success criteria, users

### Phase 2: Explore Approaches
1. Propose **2-3 different approaches** with trade-offs
2. Lead with your recommendation and reasoning
3. Present options conversationally
4. Include effort estimates (human time vs AI time)

### Phase 3: Present Design
1. Present the design section by section
2. Scale each section to its complexity (few sentences if simple, detailed if nuanced)
3. Ask after each section: "Does this look right so far?"
4. Cover: architecture, components, data flow, error handling, testing

### Phase 4: Self-Eval on Design
Run `templates/SELF-EVAL-PROTOCOL.md` on the design:
- Is it specific enough to implement?
- Does it address all requirements?
- Are edge cases covered?
- Is it the simplest solution that works?

### Phase 5: Transition
Once approved, invoke `/writing-plans` to create the implementation plan. The design becomes the spec.

## Key Principles
- **One question at a time** — Don't overwhelm
- **YAGNI ruthlessly** — Remove unnecessary features
- **Incremental validation** — Get approval before moving on
- **Design for isolation** — Each unit has one clear purpose
