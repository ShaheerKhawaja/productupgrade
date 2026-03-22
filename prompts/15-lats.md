# Layer 15: LATS (Language Agent Tree Search)

**Research:** Koh et al. 2024 — "Language Agent Tree Search" (ICML 2024)
**Impact:** 94.4% on HumanEval (GPT-4), +14% over baseline

## Technique

Monte Carlo Tree Search applied to LLM reasoning. Explores multiple solution paths with backtracking, evaluation, and reflection. The most powerful (and expensive) technique — use only in /omni-plan mode.

## LATS Protocol

```markdown
SELECTION: Choose the most promising unexplored path
  - Use UCB1: score = value + C * sqrt(ln(parent_visits) / visits)
  - Favor paths with high value AND low exploration

EXPANSION: Generate 3 candidate next steps from the selected node
  - Candidate A: Conservative approach (minimal change)
  - Candidate B: Standard approach (best practice)
  - Candidate C: Creative approach (novel solution)

EVALUATION: Score each candidate (LLM self-evaluation)
  - Correctness: Does this solve the problem? (0-1)
  - Completeness: Does it handle edge cases? (0-1)
  - Quality: Is this maintainable? (0-1)
  - Combined: weighted average

SIMULATION: For the best candidate, project the outcome
  - What would the codebase look like after this fix?
  - What new problems might this introduce?
  - What's the test coverage impact?

BACKPROPAGATION: Update all ancestor nodes with the result
  - If simulation succeeds: increase value up the tree
  - If simulation fails: decrease value, try next candidate

REFLECTION: On any failure, generate verbal feedback
  "This approach failed because {reason}. Next attempt should {guidance}."
  Store reflection for future iterations.
```

## When to Use
- /omni-plan mode ONLY (too expensive for basic mode)
- Complex architectural decisions (multiple valid approaches)
- Difficult bug fixes (unclear root cause, multiple suspects)
- Performance optimization (multiple optimization strategies to evaluate)

## Cost Warning
LATS uses 3-10x more tokens than standard CoT.
Budget: ~50K tokens per LATS exploration.
Maximum 3 LATS explorations per iteration.
