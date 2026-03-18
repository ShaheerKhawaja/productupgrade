# Omni-Plan Pipeline — Extended Reference

This file supplements the `/omni-plan` command with extended details for each phase.
The command itself is self-contained — this file provides additional depth for agents
that need more specific instructions during execution.

## Phase A: Intelligence — Extended Protocols

### Step 1: Research Depth Levels

| Depth | Web Fetches | Source Types | Citation Rigor |
|-------|-------------|-------------|----------------|
| quick | 20 | Docs + README | 2-layer (source + cross-ref) |
| standard | 100 | Docs + README + blog + arxiv | 3-layer (+ timestamp) |
| deep | 200 | All + competitor analysis | 4-layer (+ reproducer) |
| exhaustive | 500 | All + academic + patent | 4-layer + expert peer review |

### Step 2: Token Budget Allocation

Default budget plan for downstream agents:
- Research output: max 5,000 tokens
- CEO review: max 3,000 tokens per mode
- Eng review: max 4,000 tokens per pass
- Each judge: max 2,000 tokens
- Execution agents: max 1,500 tokens each
- Density compression: reduce all handoffs to 25% of original

## Phase B: Strategic Review — Extended Protocols

### CEO Review Mode Transitions

```
SCOPE EXPANSION (dream state, unbounded)
    ↓ read output
HOLD SCOPE (error map, failure modes against expanded vision)
    ↓ read output
SCOPE REDUCTION (minimum viable cut from held scope)
    ↓ output = actionable spec
```

Each mode MUST read the previous mode's output. The sequence deliberately narrows.

### Eng Review Cross-References

The engineering review should explicitly check:
- Does the architecture support the CEO review's expanded features?
- Can the minimum viable scope actually be built with the stated tech stack?
- What SPOFs exist in the proposed architecture?
- What's the deployment rollback plan if this fails?

## Phase C: Evaluation — Extended Protocols

### CLEAR v2.0 Domain Weights

| Domain | Weight | What It Measures |
|--------|--------|-----------------|
| Foundations | 20% | Technical soundness, constraint satisfaction |
| Psychology | 10% | User mental model alignment |
| Segmentation | 15% | Problem decomposition quality |
| Maturity | 15% | Solution readiness for production |
| Methodology | 20% | Process rigor, evidence quality |
| Validation | 20% | Test coverage, edge case handling |

### Judge Debate Protocol

When all 3 judges disagree (no two within 1 point):

**Round 1: Cross-Read**
- Each judge reads the other two judges' full reasoning
- Each judge identifies the strongest counter-argument to their position

**Round 2: Re-Score**
- Each judge re-scores with explicit acknowledgment of counter-arguments
- If convergence achieved: done
- If not: proceed to weighted average

**Weighted Average:**
- Opus (Correctness): 40% weight
- Sonnet (Practicality): 30% weight
- Opus (Adversarial): 30% weight

## Phase D: Execution — Extended Protocols

### Batch Size Optimization

| Codebase Size | Recommended Batch | Max Parallel Agents |
|---------------|-------------------|---------------------|
| < 50 files | 3-5 fixes | 5 |
| 50-200 files | 5-7 fixes | 7 |
| 200+ files | 7-10 fixes | 7 (throttled) |

### Self-Healer Escalation

Round 1-3: Auto-fix (lint, type errors, import fixes)
Round 4-6: Targeted repair (read error context, apply surgical fix)
Round 7-9: Alternative approach (try different implementation strategy)
Round 10: Rollback and defer (mark as DEFERRED in plan)

## Phase E: Convergence — Extended Protocols

### Convergence Patterns

| Pattern | Meaning | Action |
|---------|---------|--------|
| Score ↑ each loop | Healthy convergence | Continue |
| Score ↑ then plateau | Diminishing returns | REFINE with narrower scope |
| Score oscillating | Conflicting fixes | PIVOT strategy |
| Score ↓ | Regression | Immediate ROLLBACK + PIVOT |
| Score flat × 2 loops | Stagnation | PIVOT |

### PIVOT vs REFINE Decision Tree

```
Is grade improving? ─── Yes ─── Is grade >= 9.5? ─── Yes ─── PROCEED
                   │                              │
                   │                              └── No ─── REFINE (narrow scope)
                   │
                   └── No ─── Has grade improved in last 2 loops? ─── Yes ─── REFINE
                                                                  │
                                                                  └── No ─── PIVOT
```

## Phase F: Delivery — Checklist

- [ ] All tests passing
- [ ] No linter errors
- [ ] Type checker clean
- [ ] CHANGELOG.md updated
- [ ] VERSION bumped
- [ ] Architecture docs match implementation
- [ ] Commit messages follow imperative mood
- [ ] PR description includes test plan
- [ ] No hardcoded secrets or credentials
- [ ] Final judge panel score documented
