---
name: research-and-plan
description: "Composite: deep research -> CEO review -> eng review. Use when user says 'research', 'plan', 'design', 'architect', or 'spec out'."
argument-hint: "[topic or feature description]"
---

# research-and-plan

Composite skill that chains deep research, CEO-perspective review, and engineering architecture review into a complete planning pipeline. Each step consumes the previous step's artifacts, progressively refining from raw research into an actionable engineering spec.

## Chain Overview

```
deep-research -> plan-ceo-review -> plan-eng-review
      |                |                  |
      v                v                  v
  RESEARCH.md     CEO-REVIEW.md     ENG-REVIEW.md
  (raw findings)  (vision + scope)  (architecture + tasks)
```

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `topic` | free text | required | What to research and plan |

---

## Step 1: Deep Research

**Invokes:** `/deep-research`

**What it does:**
- 8-phase autonomous research pipeline:
  1. Scope definition and question framing
  2. Broad search across documentation, repos, papers
  3. Source evaluation and credibility scoring
  4. Pattern extraction across sources
  5. Contradiction identification
  6. Synthesis into structured findings
  7. Gap analysis (what is still unknown)
  8. Recommendation formulation
- Cross-references `~/repos/` for existing implementations
- Checks context7 for current library documentation
- Produces structured research with confidence levels per finding

**Produces:** `.productionos/RESEARCH.md`

**Artifacts passed to Step 2:**
- Key findings with evidence and confidence scores
- Existing implementations found in reference repos
- Technology options with trade-off analysis
- Open questions and knowledge gaps

**Gate to Step 2:** Proceeds unconditionally. Even incomplete research is valuable for CEO review.

---

## Step 2: CEO Review

**Invokes:** `/plan-ceo-review`

**What it does:**
- Reads RESEARCH.md as input context
- Applies founder/CEO lens: what is the 10-star version of this?
- Identifies the core user story and success metric
- Scope expansion: what adjacent features make this 10x more valuable?
- Risk assessment: what kills this project?
- Prioritization: what ships first for maximum learning?

**Produces:** `.productionos/CEO-REVIEW.md`

**CEO review output structure:**
- Vision statement (one sentence)
- 10-star feature definition
- Scope expansions accepted/rejected with reasoning
- Priority stack: Phase 1 (MVP) -> Phase 2 (Growth) -> Phase 3 (Scale)
- Kill criteria: conditions under which to abandon this direction
- Success metrics: measurable outcomes per phase

**Artifacts passed to Step 3:**
- Approved scope (from CEO review)
- Priority ordering
- Phase definitions
- Non-functional requirements (performance, security, scale targets)

**Gate to Step 3:** Proceeds unconditionally. CEO review is advisory.

---

## Step 3: Engineering Review

**Invokes:** `/plan-eng-review`

**What it does:**
- Reads RESEARCH.md + CEO-REVIEW.md as input context
- Architecture design: system components, data flow, API contracts
- Technology selection: justified by research findings
- Edge case enumeration: what breaks, what is weird, what is expensive
- Test matrix: what must be tested and how
- Task decomposition: ordered list of implementable units
- Effort estimation: time estimates per task with dependency graph

**Produces:** `.productionos/ENG-REVIEW.md`

**Engineering review output structure:**
- Architecture diagram (text-based)
- Component breakdown with ownership
- Data model changes
- API contract definitions
- Migration plan (if applicable)
- Test matrix (unit, integration, e2e)
- Task list with estimates and dependencies
- Risk register with mitigations

---

## Output Format

Final composite report written to `.productionos/RESEARCH-AND-PLAN.md`:

```markdown
# Research & Plan: {topic}

## Research Summary (from Step 1)
- **Sources analyzed:** N
- **Key findings:** {top 5}
- **Confidence:** X/10
- **Knowledge gaps:** {list}

## CEO Vision (from Step 2)
- **Vision:** {one sentence}
- **Phase 1 scope:** {MVP definition}
- **Success metric:** {measurable outcome}
- **Scope expansions:** {accepted items}

## Engineering Plan (from Step 3)
- **Architecture:** {summary}
- **Components:** {count}
- **Estimated effort:** {total hours/days}
- **Critical path:** {ordered list}

## Implementation Roadmap
| Phase | Tasks | Effort | Dependencies |
|-------|-------|--------|-------------|
| 1 (MVP) | ... | ... | ... |
| 2 (Growth) | ... | ... | Phase 1 |
| 3 (Scale) | ... | ... | Phase 2 |

## Open Questions
{questions that could not be resolved through research}

Plan completed: {timestamp}
```

---

## When to Use

- "Research how to add X" -- full pipeline
- "Plan the authentication system" -- full pipeline
- "Architect the new API" -- full pipeline
- "Spec out the billing feature" -- full pipeline
- "Design the data model for X" -- full pipeline

## When NOT to Use

- Already have a plan and want to execute -- use `/auto-swarm` directly
- Just need quick information -- use `/deep-research` standalone
- Reviewing existing code -- use `/review` or `/audit-and-fix`
