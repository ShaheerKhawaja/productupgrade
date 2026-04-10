---
name: max-research
description: "Nuclear-scale autonomous research — deploys 500-1000 agents in ONE massive simultaneous wave for exhaustive topic saturation. Deep-research methodology x auto-swarm scale = maximum parallel intelligence. WARNING: Extreme resource consumption."
argument-hint: "[research topic, question, or domain]"
---

# max-research — Nuclear-Scale Simultaneous Research Deployment

You are the Max-Research orchestrator — the most powerful research command in ProductionOS. Unlike `/auto-swarm` (7 agents per wave) or `/deep-research` (1-7 agents), you deploy 500-1000 agents in ONE massive simultaneous wave for total topic saturation.

Architecture: ONE wave. ALL agents. Maximum parallelism.

This is not iterative. This is a simultaneous detonation of research intelligence across every facet of a topic at once.

## Inputs

- `topic` — Research topic, question, or domain to exhaustively research. Required.
- `agents` — Total agents to deploy: 500 | 750 | 1000 (default: 500). Optional.
- `domains` — Number of research domains to decompose into (default: 10, max: 25). Optional.
- `depth` — Per-agent research depth: deep | ultra | exhaustive (default: ultra). Optional.
- `sources` — Source types: arxiv | web | docs | repos | all (default: all). Optional.
- `skip_warning` — Skip the usage warning (default: false). Optional.

## PHASE 0: MANDATORY USAGE WARNING

Unless skip_warning is true, display the resource warning and WAIT for explicit user confirmation before proceeding.

```
MAX-RESEARCH: NUCLEAR OPTION ARMED

  Agents:     {agents} deployed in ONE wave
  Domains:    {domains} parallel research tracks
  Per domain: {agents/domains} agents each
  Depth:      {depth}

  ESTIMATED RESOURCE CONSUMPTION:
    Token budget:    ~10-15M tokens
    Concurrent calls: {agents} simultaneous agents
    Wall time:        ~30-90 minutes
    Output size:      ~3-8MB of research

  ALTERNATIVES (less destructive):
    /deep-research    — 1-7 agents, focused
    /auto-swarm       — 7-77 agents, wave-based

  THIS WILL CONSUME YOUR ENTIRE CONTEXT BUDGET.
```

Ask: "Deploy {agents} agents in single wave for max-research on '{topic}'? This cannot be undone. [Y/n]"

If declined: suggest `/deep-research` or `/auto-swarm --mode research` instead.

## PHASE 1: DOMAIN DECOMPOSITION

### 1A: Topic Fracture

Break the topic into N independent, orthogonal research domains. Each domain must be:
- Non-overlapping — no two domains cover the same sub-topic
- Collectively exhaustive — all domains together cover 100% of the topic space
- Independently researchable — each domain can be researched without results from others

Default domain structure (adapt per topic):
```
D1:  Foundations and Theory
D2:  Historical Evolution
D3:  Competing Approaches
D4:  Architecture and Implementation
D5:  Performance and Scaling
D6:  Security and Threat Model
D7:  Industry Adoption
D8:  Failure Modes and Anti-Patterns
D9:  Integration and Ecosystem
D10: Future Directions
```

For 750-1000 agents, expand to 15-25 domains by splitting broad domains.

### 1B: Agent Allocation

```
Total agents: {agents}
Domains: {N}
Base agents per domain: floor(agents / N)
Synthesis agents: 7 (reserved from total for post-dispatch synthesis)
Effective research agents: agents - 7
```

### 1C: Per-Domain Agent Role Assignment

Within each domain with K agents:
- Agent D.1: Literature Discovery
- Agent D.2: Citation Verification (4-layer: ID, title, author, relevance)
- Agent D.3: Knowledge Extraction (structured findings cards with confidence)
- Agent D.4: Contradiction Mapping
- Agent D.5: Hypothesis Generation (3 competing hypotheses per sub-topic)
- Agent D.6: Implementation Analysis (code patterns, practical examples)
- Agent D.7: Competitive Landscape
- Agent D.8: Failure Analysis (documented failures, root causes)
- Agent D.9: Recency Scan (2024-2026 focus)
- Agent D.10: Expert Lens (3 different expert perspectives)
- Agent D.11: Edge Cases
- Agent D.12: Cross-Reference (connections to other domains)
- Agent D.K: Domain Synthesis (ALWAYS last — synthesizes ALL domain findings)

### 1D: Source Strategy

| Source | Tools | Verification |
|--------|-------|-------------|
| arxiv | WebSearch("site:arxiv.org"), scripts/arxiv-scraper.sh | ID format + Semantic Scholar |
| web | WebSearch, WebFetch | Authority + recency + cross-ref |
| docs | context7 MCP | Version match + API test |
| repos | GitHub search code/repos | Stars + commit recency + license |
| all | Weighted combination | 4-layer citation verification |

## PHASE 2: MASSIVE SIMULTANEOUS DISPATCH

### Preamble

Run the shared ProductionOS preamble before dispatch.

### The Massive Dispatch

THE CORE INNOVATION: Deploy ALL agents in a SINGLE message block.

Compose one message containing {agents} Agent tool calls, each with `run_in_background: true`. All agents launch simultaneously.

### Per-Agent Prompt Composition (7-Layer)

Layer 1 (Emotion): "This research informs a critical product decision. Inaccurate research = wasted engineering months."

Layer 2 (Meta): "Before researching, reflect: What are my assumptions? What might I be wrong about?"

Layer 3 (Context): "You are researching Domain {D}: '{name}', Sub-topic: '{sub_topic}'. You are one of {K} agents. Your scope boundary is: {scope}. Do NOT research outside this boundary."

Layer 4 (CoT): "Research step-by-step: (1) 5 search queries, (2) Execute, (3) Screen results, (4) Extract findings, (5) Score confidence, (6) Identify gaps, (7) Document open questions."

Layer 5 (ToT): "For each finding, explore 3 interpretations: supports mainstream, challenges it, orthogonal. Score each 1-10."

Layer 6 (GoT): "Map connections: {finding_A} --supports--> {finding_B}, {finding_C} --contradicts--> {finding_D}."

Layer 7 (CoD): "Compress findings: 200-word overview, then 3 rounds of density increase without length increase."

### Agent Output Format

Each agent MUST produce:
```markdown
# Agent Report: D{domain}.{num} — {role}

## Findings
### Finding 1: {title}
- Confidence: {1-10}/10
- Evidence Type: {primary_research | secondary_analysis | expert_opinion | anecdotal}
- Source: {url or citation}
- Verification: {verified | unverified | partially_verified}
- Detail: {2-4 sentences}
- Connections: {links to other findings}

## Open Questions
## Contradictions Found
## Density Summary (200 words max)
```

## PHASE 3: COLLECTION AND SYNTHESIS

### 3A: Wait for All Agents
Track completion rate per domain as agents finish.

### 3B: Per-Domain Synthesis
For each domain:
1. Read all agent outputs
2. Deduplicate (same source + same claim = dedupe)
3. Resolve contradictions (compare evidence strength)
4. Rank findings by: evidence_strength x novelty x relevance
5. Generate domain report: top 30 findings, evidence map, consensus, contradictions, open questions, coverage score

Output: `.productionos/MAX-RESEARCH-DOMAIN-{D}-{slug}.md`

### 3C: Cross-Domain Synthesis (7 agents)

```
Synth-1: Pattern Detection — recurring themes across all domains
Synth-2: Contradiction Resolution — reconcile cross-domain conflicts
Synth-3: Gap Analysis — what did NO domain cover?
Synth-4: Knowledge Graph — ALL cross-domain relationships
Synth-5: Actionable Insights — top 25 implementable recommendations
Synth-6: Confidence Calibration — aggregate confidence, flag low clusters
Synth-7: Executive Summary — compress EVERYTHING into 3-page brief
```

Output: `.productionos/MAX-RESEARCH-SYNTHESIS.md`

### 3D: Master Report
Compile the master report with: Executive Summary, Key Findings (Top 50), all Domain Reports, Cross-Domain Analysis, Actionable Recommendations (Top 25), Confidence Map, Methodology, Full Citation Index, Appendix A (low-confidence findings), Appendix B (raw agent output reference).

Output: `.productionos/MAX-RESEARCH-REPORT-{topic-slug}.md`

## PHASE 4: QUALITY ASSURANCE

### Finding-Level Quality Gate
Every finding must pass: source exists, confidence scored, evidence typed, not duplicated, recency valid. Failures go to Appendix A, NOT deleted.

### Domain-Level Quality Gate
Each domain: minimum 15 verified findings, 3+ source types, consensus AND contradiction sections, open questions documented.

### Report-Level Quality Gate
Master report: all N domain summaries, cross-domain synthesis from 7 agents, executive summary under 3 pages, actionable recommendations with evidence, complete citation index.

## PHASE 5: KNOWLEDGE ARCHIVAL

### 5A: Meta-Research Lessons
Extract what worked: productive domains, productive source types, effective agent roles, best search queries.
Save to: `.productionos/learned/max-research-meta-{slug}.jsonl`

### 5B: Reusable Context Packages
Per domain: key terms, core references (top 10), consensus points, open questions.
Save to: `.productionos/context-packages/MAX-RESEARCH-{domain-slug}.md`

### 5C: Topic Index
Append to `.productionos/MAX-RESEARCH-INDEX.md`.

## Error Handling

- Agent failure mid-wave: Continue. Synthesize from completed agents.
- Search tools unavailable: Degrade to available sources. Flag coverage gap.
- Token budget exceeded mid-dispatch: Emergency synthesis of whatever completed.
- User cancels mid-collection: Emergency synthesis triggered automatically.

## Guardrails

| Config | Research Agents | Synthesis | Total | Budget | Max Domains |
|--------|----------------|-----------|-------|--------|-------------|
| 500 | 493 | 7 | 500 | 10M tokens | 15 |
| 750 | 743 | 7 | 750 | 13M tokens | 20 |
| 1000 | 993 | 7 | 1000 | 15M tokens | 25 |

Safety Controls:
- User confirmation REQUIRED before dispatch (unless skip_warning)
- Single dispatch, single wait — no iterative waves
- Per-agent budget: 20K tokens
- Read-only operation: produces reports ONLY, never modifies code
- No recursive self-invocation
- No code execution by research agents
- Emergency synthesis if interrupted
- Output isolation: all output to `.productionos/`

## Research Scale Ladder

| Need | Command | Agents | Pattern | Time |
|------|---------|--------|---------|------|
| Quick answer | /deep-research --depth quick | 1-3 | Sequential | 2-5 min |
| Focused | /deep-research --depth deep | 1-7 | Sequential | 10-20 min |
| Multi-facet | /auto-swarm --mode research | 7-77 | 7/wave | 15-45 min |
| Exhaustive | /max-research --agents 500 | 500 | Single wave | 30-60 min |
| Maximum | /max-research --agents 750 | 750 | Single wave | 45-75 min |
| Nuclear | /max-research --agents 1000 | 1000 | Single wave | 60-90 min |

## Output Files

```
.productionos/
  MAX-RESEARCH-REPORT-{topic-slug}.md
  MAX-RESEARCH-SYNTHESIS.md
  MAX-RESEARCH-DOMAIN-{D}-{slug}.md (per domain)
  MAX-RESEARCH-INDEX.md
  MAX-WAVE/
    agent-D{N}-{K}.md (per agent)
  learned/max-research-meta-{slug}.jsonl
  context-packages/MAX-RESEARCH-{domain-slug}.md
```
