---
name: productionos-deep-research
description: "8-phase autonomous research pipeline with multi-source discovery, 4-layer citation verification, hypothesis generation, and PIVOT/REFINE/PROCEED decision loops. Confidence-gated — loops until 95%+ confidence."
argument-hint: "[topic, depth, or source mix]"
---

# productionos-deep-research


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
Autonomous research pipeline that takes any topic, breaks it into concrete research questions, discovers and verifies sources across multiple channels, synthesizes competing hypotheses, and delivers only evidence-backed claims. Confidence-gated: loops deeper rather than bluffing.

**Core principle:** If confidence < 95% on any finding, loop deeper until satisfied. Never present unverified claims as facts. Say "I don't know" rather than fabricate.

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `topic` | any research question or area | required | The subject to research |
| `depth` | `quick`, `standard`, `deep`, `exhaustive` | `deep` | Controls source count and verification rigor |
| `sources` | `arxiv`, `web`, `docs`, `all` | `all` | Which source channels to search |

### Depth Configuration

| Depth | Sources/Query | Total Budget | Web Search | Sub-Swarms | Verification |
|-------|---------------|-------------|------------|------------|-------------|
| quick | 10 | 30 | No | No | Layer 1-2 only |
| standard | 50 | 250 | context7 only | No | Layer 1-3 |
| deep | 500 | 5,000 | Yes | No | All 4 layers |
| exhaustive | 2,000 | 10,000 | Yes | Yes (depth 2) | All 4 layers + cross-validation |

---

## Phase A: Scoping (mandatory, never skip)

Parse the topic into 3-5 specific, answerable research questions.

For each question, define:
1. **What would a complete answer look like?** (success criteria)
2. **What evidence type is needed?** (empirical data, expert consensus, case studies, benchmarks)
3. **What is the confidence threshold?** (default: 95%)
4. **What are the known unknowns?** (things we know we need to find out)

Output: numbered list of research questions with success criteria.

### Question Decomposition Rules
- Each question must be independently answerable
- Questions should not overlap (no redundant coverage)
- At least one question should challenge the premise ("Is this even the right question?")
- Order questions from most foundational to most specific

---

## Phase B: Literature Discovery

Search across all available channels based on the `sources` parameter.

### Source Channels

| Channel | Tool | When to Use | Priority |
|---------|------|-------------|----------|
| Academic papers | `scripts/arxiv-scraper.sh` or web search for arxiv.org | Technical topics, algorithms, benchmarks | 1 (primary) |
| Documentation | context7 MCP | Library/framework specifics, API behavior | 2 |
| Web search | WebSearch tool | Industry practices, recent developments, blog posts | 3 |
| Codebase analysis | Grep/Read/Glob | Implementation patterns, real-world usage | 4 |
| HuggingFace | HF MCP tools | ML models, datasets, papers | 5 (when relevant) |

### Source Screening Protocol
For each discovered source, apply a 30-second screen:
1. Read title + abstract/summary
2. Relevant to at least one research question? (YES/NO)
3. If NO: discard immediately, do not read further
4. If YES: add to verification queue with preliminary relevance score (1-10)

### Source Prioritization
- **Primary sources** (original research, official docs, source code) > **Secondary** (reviews, tutorials, blog posts) > **Tertiary** (forum posts, social media)
- Prefer recent sources (< 2 years) unless researching historical context
- Prefer peer-reviewed or officially published over self-published

---

## Phase C: Citation Verification (4-Layer)

Every source that passes screening MUST pass this 4-layer verification before being used as evidence. This is the anti-hallucination gate.

### Layer 1: ID Validation
- ArXiv papers: verify the ID format matches `YYMM.NNNNN` or `category/YYMMNNN`
- URLs: verify the domain is real and the page exists (do not fabricate URLs)
- Books/standards: verify ISBN, RFC number, or standard identifier format
- **CRITICAL:** If you cannot verify a source exists, do NOT cite it. Mark as "UNVERIFIED" and exclude from synthesis.

### Layer 2: Title and Content Matching
- Does the title match what was claimed?
- Does the content actually support the claim being attributed to it?
- Is the source being accurately represented, or is context being cherry-picked?

### Layer 3: Author and Authority Verification
- Who wrote/published this? Are they credible on this topic?
- Cross-reference: does the author's other work align?
- Check for retractions, corrections, or superseding publications

### Layer 4: Relevance Scoring
Score each verified source 1-10 on relevance to the research questions:
- 9-10: Directly answers a research question with strong evidence
- 7-8: Provides important supporting context or corroboration
- 5-6: Tangentially relevant, useful for background
- 1-4: Remove from source set -- not relevant enough to justify inclusion

**Remove all sources scoring < 4.** They waste context and dilute synthesis.

---

## Phase D: Knowledge Synthesis

Extract structured knowledge from all verified sources.

### Knowledge Card Format
For each key finding, create a knowledge card:

```
FINDING: {one-sentence claim}
EVIDENCE: {what supports this -- cite source:section}
CONFIDENCE: {high/medium/low}
SOURCES: {list of verified source IDs}
CONTRADICTS: {any conflicting evidence, or "none"}
GAPS: {what is still unknown about this}
```

### Synthesis Dimensions
Organize findings along these axes:
1. **Consensus** -- what do most sources agree on?
2. **Contradictions** -- where do sources disagree? Why?
3. **Gaps** -- what questions remain unanswered?
4. **Trends** -- what direction is the field moving?
5. **Practical implications** -- what does this mean for implementation?

### Contradiction Resolution
When sources conflict:
1. Check recency -- more recent data often supersedes older findings
2. Check methodology -- empirical evidence outweighs theoretical claims
3. Check scope -- findings from similar contexts are more applicable
4. If irresolvable: present both positions with confidence levels, do not pick a side without justification

---

## Phase E: Hypothesis Generation

Generate 3 competing hypotheses that answer the primary research question.

For each hypothesis:

| Field | Description |
|-------|-------------|
| Statement | Clear, falsifiable claim |
| Supporting evidence | Knowledge cards that support this |
| Contradicting evidence | Knowledge cards that argue against this |
| Confidence score | 0-100% based on evidence weight |
| Assumptions | What must be true for this to hold? |
| Testability | How could this be verified further? |

### Hypothesis Selection
Select the hypothesis with the highest confidence score AS LONG AS:
- Confidence >= 70% (otherwise, mark as "uncertain" and explain why)
- No unresolved CRITICAL contradictions
- The hypothesis is internally consistent

If no hypothesis reaches 70% confidence: do NOT select one. Report all three with their evidence and explicitly state that the evidence is insufficient for a firm conclusion.

---

## Phase F: Decision Loop

After synthesis and hypothesis generation, make one of three decisions:

### PROCEED (ship the report)
Criteria:
- 10+ verified sources with Layer 4 relevance >= 7
- Clear consensus or well-characterized disagreement
- Primary hypothesis confidence >= 80%
- All research questions have at least partial answers

### REFINE (targeted follow-up)
Criteria:
- Some questions partially answered, specific gaps remain
- Confidence between 50-80%
- Known where to look for missing information

Action: identify the specific gap, search for targeted sources, re-run Phase C-E on new sources only. Maximum 3 REFINE loops.

### PIVOT (reframe the question)
Criteria:
- Initial hypothesis was wrong or the question was mal-formed
- Evidence consistently points in an unexpected direction
- Confidence < 50% on all hypotheses

Action: reformulate research questions based on what was learned, restart from Phase B with new questions. Maximum 1 PIVOT.

---

## Phase G: Report Generation

Write the final report to `.productionos/RESEARCH-{topic-slug}.md` with this structure:

```markdown
---
producer: deep-research
timestamp: {ISO8601}
topic: {topic}
depth: {depth}
confidence: {overall-percentage}
sources_verified: {count}
decision_loops: {count}
---

# Research Report: {Topic}

## Executive Summary
{3-5 sentences: what was found, confidence level, key insight}

## Research Questions
1. {question} -- {ANSWERED/PARTIAL/UNANSWERED}
2. {question} -- {ANSWERED/PARTIAL/UNANSWERED}
3. {question} -- {ANSWERED/PARTIAL/UNANSWERED}

## Key Findings

### Finding 1: {title}
**Confidence:** {high/medium/low}
**Evidence:** {summary with source citations}
**Caveats:** {limitations or conditions}

### Finding 2: {title}
...

## Competing Hypotheses

### Hypothesis A: {statement} -- SELECTED/REJECTED
**Confidence:** X%
**For:** {evidence summary}
**Against:** {counter-evidence}

### Hypothesis B: {statement} -- SELECTED/REJECTED
...

## Contradictions and Open Questions
- {contradiction 1: source A says X, source B says Y}
- {open question 1: what remains unknown}

## Source Quality Assessment
| Source | Type | Verification | Relevance | Key Contribution |
|--------|------|-------------|-----------|-----------------|
| {id} | {primary/secondary} | {L1-L4 pass} | {X/10} | {what it told us} |

## Explicit Unknowns
{Things we looked for but could not find. Things we know we don't know.}

## Methodology Notes
- Depth: {depth}
- Sources searched: {count}
- Sources verified: {count}
- Decision loops: {PROCEED/REFINE x N/PIVOT}
- Total time: ~{minutes}min
```

---

## Phase H: Knowledge Archival

After report generation, extract reusable research lessons:

```jsonl
{"topic": "{topic}", "lesson": "{insight}", "confidence": 0.X, "date": "{ISO8601}", "sources": N}
```

Save to `~/.productionos/learned/research-lessons.jsonl` for cross-session learning.

---

## Error Handling

| Scenario | Action |
|----------|--------|
| No sources found for a question | Log gap, try alternative search terms (2 retries), if still empty mark as UNANSWERED |
| Source verification fails (Layer 1-4) | Exclude source, do not cite, log as "excluded: verification failed" |
| All hypotheses below 50% confidence | Report findings without selecting a hypothesis, explicitly state uncertainty |
| ArXiv scraper unavailable | Fall back to web search for academic papers |
| context7 MCP unavailable | Fall back to web search for documentation |
| Search returns no results | Try broader terms, then related terms, then report gap |

## Guardrails (Non-Negotiable)

1. Do NOT present weakly supported claims as facts -- qualify with confidence levels
2. Prefer primary sources when available -- do not rely on secondary summaries alone
3. If confidence stays low after 3 REFINE loops, say so and stop rather than pretending certainty
4. NEVER fabricate sources -- if you cannot verify a citation exists, exclude it
5. Every finding must trace back to at least one verified source
6. Distinguish clearly between "evidence shows X" and "I think X based on reasoning"

## Output Files

```
.productionos/
  RESEARCH-{topic-slug}.md    # Final report
~/.productionos/
  learned/research-lessons.jsonl  # Extracted lessons
```
