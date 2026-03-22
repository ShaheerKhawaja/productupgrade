# Layer 09: Step-Back Prompting

**Research:** Zheng et al. 2023 — "Take a Step Back: Evoking Reasoning via Abstraction"
**Impact:** +15% on domain-specific problems requiring underlying principles

## Technique

Before tackling the specific problem, first consider the higher-level principle or abstraction that governs it. This prevents getting lost in details without understanding the framework.

## Application Template

```markdown
Before analyzing {specific_finding}:

1. STEP BACK: What is the general principle at play here?
   - What category of problem is this? (architecture, security, performance, UX, ...)
   - What are the established best practices for this category?
   - What would a textbook solution look like?

2. APPLY: Now examine the specific code through that lens.
   - How does the actual implementation compare to the ideal?
   - What specific deviations from the principle are present?
   - Which deviations are intentional (documented trade-offs) vs. accidental (bugs)?

3. PRESCRIBE: Recommend changes that move toward the principle.
   - What's the minimum change to align with the principle?
   - What's the ideal change if we could start fresh?
```

## When to Use
- Domain-specific audits (database design, security, accessibility)
- Architectural reviews (stepping back to consider patterns before details)
- Performance optimization (stepping back to consider algorithms before micro-optimization)
- Any finding where the root cause is a misunderstood principle
