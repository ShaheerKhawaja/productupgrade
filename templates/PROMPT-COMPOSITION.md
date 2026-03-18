# 7-Layer Prompt Composition Template

Every agent in `/omni-plan` and `/auto-swarm deep` mode receives a composed prompt built from these 7 layers. Layers are applied selectively based on the agent's role and the current iteration context.

## Layer Architecture

```
┌─────────────────────────────────────────┐
│ Layer 7: Chain of Density (compression) │  ← Inter-iteration handoff
├─────────────────────────────────────────┤
│ Layer 6: Graph of Thought (network)     │  ← Finding relationships
├─────────────────────────────────────────┤
│ Layer 5: Tree of Thought (branching)    │  ← Exploration
├─────────────────────────────────────────┤
│ Layer 4: Chain of Thought (reasoning)   │  ← Step-by-step logic
├─────────────────────────────────────────┤
│ Layer 3: Context Retrieval (RAG)        │  ← Documentation + memory
├─────────────────────────────────────────┤
│ Layer 2: Meta-Prompting (reflection)    │  ← Self-awareness
├─────────────────────────────────────────┤
│ Layer 1: Emotion Prompting (stakes)     │  ← Motivation
└─────────────────────────────────────────┘
```

## Layer 1: Emotion Prompting
Sets the emotional stakes to improve accuracy (+8-15% per Li et al. 2023).

```markdown
This evaluation is CRITICAL. The quality of your analysis directly determines whether
this product ships with or without serious bugs. Real users will encounter every issue
you miss. Your thoroughness protects real people and real businesses.

Calibrate intensity by severity:
- P0/CRITICAL: "Failure here means data loss, security breach, or service outage"
- P1/HIGH: "This directly impacts user experience and business metrics"
- P2/MEDIUM: "This creates technical debt that compounds over time"
- P3/LOW: "This is a polish item that distinguishes good from great"
```

## Layer 2: Meta-Prompting
Forces reflection before action — prevents premature conclusions.

```markdown
Before you begin your analysis, pause and answer these questions:
1. What is the PRIMARY goal of this evaluation? (one sentence)
2. What are the 3 most likely failure modes for this type of analysis?
3. What biases might affect your judgment? (recency bias, anchoring, etc.)
4. What would a SENIOR expert check that a JUNIOR would miss?

<meta_reflection>
{agent fills this section before proceeding}
</meta_reflection>
```

## Layer 3: Context Retrieval
Grounds the agent in authoritative documentation and past decisions.

```markdown
Before analyzing code, retrieve relevant context:
1. Read CLAUDE.md/README.md for project conventions
2. Check .productupgrade/INTEL-CONTEXT.md for tech stack and past decisions
3. Check .productupgrade/DENSITY-CUMULATIVE.md for iteration history
4. Check .productupgrade/REFLEXION-LOG.md for what to avoid

Base your analysis on documented facts, not assumptions.
```

## Layer 4: Chain of Thought
Enforces step-by-step reasoning for complex evaluations.

```markdown
For each finding, reason through these steps:
1. OBSERVE: What specific code pattern did you find? (cite file:line)
2. HYPOTHESIZE: What problem does this create?
3. VERIFY: Is this actually a problem, or a deliberate design choice?
4. IMPACT: What's the severity if this goes to production?
5. REMEDIATE: What's the minimal fix?

Show your reasoning. Do not jump to conclusions.
```

## Layer 5: Tree of Thought
Explores multiple approaches before committing to one.

```markdown
For complex decisions (architecture, strategy, priority ordering):
1. Generate 3 distinct approaches
2. For each approach:
   - List pros (2-3)
   - List cons (2-3)
   - Estimate effort (hours)
   - Rate confidence (1-10)
3. Select the approach with best confidence/effort ratio
4. Justify your selection in one sentence
```

## Layer 6: Graph of Thought
Connects findings into a causal network (used by thought-graph-builder).

```markdown
For each finding, identify relationships:
- What CAUSES this problem? (upstream findings)
- What does this problem CAUSE? (downstream findings)
- What would fixing this UNBLOCK? (dependent improvements)
- What other findings COMPOUND with this one?

Output edges as: FINDING-{A} --{relationship}--> FINDING-{B}
```

## Layer 7: Chain of Density
Compresses findings for inter-iteration handoff.

```markdown
After completing your analysis, compress your output:
Pass 1: Full analysis (no limit)
Pass 2: Compress to 50% — remove filler, merge similar, keep evidence
Pass 3: Compress to 25% — one line per finding, scores inline

The Pass 3 output is what the next iteration reads.
```

## Application Matrix

| Agent Type | L1 | L2 | L3 | L4 | L5 | L6 | L7 |
|-----------|-----|-----|-----|-----|-----|-----|-----|
| Review agents | ✓ | ✓ | ✓ | ✓ | | | |
| Planning agents | ✓ | ✓ | ✓ | | ✓ | | |
| Execution agents | ✓ | | ✓ | ✓ | | | |
| Judge agents | ✓ | ✓ | ✓ | ✓ | | | ✓ |
| Synthesis agents | | | ✓ | | | ✓ | ✓ |
| Adversarial agents | ✓ | ✓ | | ✓ | ✓ | | |

## Composition Function

```python
def compose_prompt(agent_type: str, severity: str, iteration: int) -> str:
    layers = APPLICATION_MATRIX[agent_type]
    prompt_parts = []

    if "L1" in layers:
        prompt_parts.append(emotion_layer(severity))
    if "L2" in layers:
        prompt_parts.append(meta_layer())
    if "L3" in layers:
        prompt_parts.append(context_layer())
    if "L4" in layers:
        prompt_parts.append(cot_layer())
    if "L5" in layers:
        prompt_parts.append(tot_layer())
    if "L6" in layers:
        prompt_parts.append(got_layer())
    if "L7" in layers and iteration > 1:
        prompt_parts.append(cod_layer(iteration - 1))

    return "\n\n".join(prompt_parts)
```
