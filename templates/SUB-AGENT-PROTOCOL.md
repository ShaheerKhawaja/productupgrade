# Sub-Agent Orchestration Protocol

Any ProductionOS agent can invoke specialist sub-agents. This protocol defines how.

## Agent Registry

Specialist sub-agents available for invocation by any parent agent:

| Sub-Agent | Capability | When to Invoke |
|-----------|------------|---------------|
| `version-control` | Cross-session context persistence | After completing work, before session end |
| `e2e-architect` | Architecture observation and validation | At pipeline start (background) |
| `rag-expert` | RAG pipeline design and audit | When target needs retrieval system |
| `db-creator` | Schema design, migration, audit | When data layer work needed |
| `nyquist-filler` | Test gap analysis and generation | After implementation, before ship |
| `density-summarizer` | Context compression | When context exceeds 600K tokens |
| `stub-detector` | Fake/mock detection | After implementation, before validation |

## Invocation Protocol

### Step 1: Check Capability

Before invoking a sub-agent, verify it exists:
```
Check if agents/{sub-agent-name}.md exists
If YES → proceed to Step 2
If NO → log "SUB-AGENT-UNAVAILABLE: {name}" and continue without it
```

### Step 2: Prepare Context Package

Build a focused context package for the sub-agent:
```markdown
## Sub-Agent Dispatch: {sub-agent-name}

### Parent Agent
{your agent name}

### Task
{what you need the sub-agent to do — be specific}

### Scope
{files, directories, or artifacts the sub-agent should focus on}

### Context
{relevant findings from your own analysis that the sub-agent needs}

### Expected Output
{what artifact(s) the sub-agent should produce}
```

### Step 3: Dispatch

Use the Agent tool with `run_in_background: true`:
```
Agent(
  description: "{sub-agent-name}: {brief task}",
  prompt: "{context package from Step 2}",
  run_in_background: true
)
```

### Step 4: Consume Output

After the sub-agent completes:
1. Read the artifact it produced in `.productionos/`
2. Validate the artifact using Method 4 (INVOCATION-PROTOCOL.md)
3. Integrate findings into your own output
4. Log: `[SUB-AGENT] {name} completed: {artifact path}`

## Chain-of-Experts Pattern

When a complex task requires multiple specialists in sequence:

```
Parent Agent
  ├── 1. Dispatch e2e-architect (background: observe)
  ├── 2. Dispatch db-creator (if data layer work)
  │   └── db-creator invokes version-control (save schema decisions)
  ├── 3. Dispatch rag-expert (if retrieval needed)
  │   └── rag-expert invokes version-control (save RAG design)
  ├── 4. Do own work (informed by sub-agent outputs)
  ├── 5. Dispatch nyquist-filler (verify test coverage)
  └── 6. Dispatch version-control (save final state)
```

## Nesting Rules

- Maximum depth: parent → sub-agent → sub-sub-agent (depth 3)
- Sub-agents SHOULD NOT dispatch other sub-agents except `version-control`
- `version-control` is the ONE sub-agent that can be invoked at any depth
- If a sub-agent needs another specialist, it writes a RECOMMENDATION to `.productionos/ARCHITECT-RECOMMENDATIONS.md` instead of dispatching directly

## Niche Learning Integration

Sub-agents accumulate domain expertise through `version-control`:

1. After each invocation, `version-control` captures the sub-agent's findings
2. Before the next invocation, `version-control` recalls prior findings for that sub-agent
3. Over time, the sub-agent's recall context grows richer:
   - `db-creator` learns the project's schema patterns
   - `rag-expert` learns the project's retrieval needs
   - `e2e-architect` builds an increasingly accurate architecture map

This is how agents become "domain experts" in a specific codebase without permanent state.
