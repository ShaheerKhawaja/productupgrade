---
name: writing-plans
description: "Create step-by-step implementation plans with risk assessment, dependency mapping, and effort estimation. Used after brainstorming, before execution."
arguments:
  - name: spec
    description: "Spec or requirements to plan from (default: latest brainstorming output)"
    required: false
---

# /writing-plans — Implementation Planning

Turn approved designs into step-by-step executable plans.

## Step 0: Preamble
Run `templates/PREAMBLE.md`. Read the spec or latest brainstorming output.

## Plan Structure

### 1. Requirements Summary
- What are we building? (1-2 sentences)
- What are the success criteria?
- What are the constraints?

### 2. Task Breakdown
For each task:
```markdown
### Task N: {title}
**Files:** {files to create/modify}
**Dependencies:** {tasks that must complete first}
**Effort:** S | M | L
**Risk:** Low | Medium | High — {why}
**Acceptance criteria:** {how to verify it's done}
```

### 3. Dependency Graph
```
Task 1 (foundation)
  ├── Task 2 (depends on 1)
  ├── Task 3 (depends on 1)
  │   └── Task 5 (depends on 3)
  └── Task 4 (independent)
```

### 4. Execution Strategy
- Which tasks can run in parallel?
- What's the critical path?
- Suggest `/auto-swarm-nth` for parallel tasks

### 5. Risk Matrix
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|

### 6. Verification Plan
How do we know it's done? Tests to write, checks to run, criteria to meet.

## Self-Eval
Run `templates/SELF-EVAL-PROTOCOL.md` on plan quality:
- Are all requirements covered by at least one task?
- Are dependencies mapped correctly?
- Is the critical path identified?
- Are risks realistic, not hand-waved?

## Next Step
After plan approval: dispatch `/auto-swarm-nth` for parallel execution or work through tasks sequentially.
