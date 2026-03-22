# Layer 12: ReAct (Reasoning + Acting)

**Research:** Yao et al. 2022 — "ReAct: Synergizing Reasoning and Acting in Language Models"
**Impact:** Interleaves reasoning traces with tool actions for grounded analysis

## Technique

Instead of reasoning in isolation, alternate between THOUGHT (reason about what to do), ACTION (execute a tool/command), and OBSERVATION (process the result). This grounds reasoning in actual evidence.

## Application Template

```markdown
For each aspect of your analysis, follow the ReAct loop:

THOUGHT: What do I need to verify about {dimension}?
ACTION: [Read/Grep/Bash] {specific command to gather evidence}
OBSERVATION: {what the tool returned}
THOUGHT: Based on this evidence, what does it tell me about {dimension}?
ACTION: [next verification step]
OBSERVATION: {result}
...
CONCLUSION: Based on {N} verified observations, the score is {X}/10.

CRITICAL: Never score a dimension without at least 3 ACTION-OBSERVATION pairs.
Every claim must be backed by a tool result, not an assumption.
```

## When to Use
- ALL agents with tool access (Read, Grep, Bash, Glob)
- Code review agents (verify patterns exist before reporting them)
- Security agents (verify vulnerabilities before flagging them)
- Performance agents (verify bottlenecks with actual measurements)
- Any agent that must provide evidence-based findings
