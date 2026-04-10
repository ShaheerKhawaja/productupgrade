---
name: productionos-auto-swarm
description: "Distributed agent swarm orchestrator — spawns parallel subagent clusters for any task with configurable depth, swarm size, and convergence criteria"
argument-hint: "[task, mode, or depth]"
---

# productionos-auto-swarm


Use this alias when you want the same workflow through a top-level Codex-safe name without the `productionos:` namespace.
Distributed intelligence engine that spawns parallel agent clusters to accomplish any task through recursive convergence. Each swarm wave operates independently, reports findings, and feeds the next wave. The orchestrator maintains a coverage map and converges when coverage is sufficient or returns diminish.

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `task` | natural language description | required | The task to swarm on |
| `depth` | `shallow`, `medium`, `deep`, `ultra` | `deep` | Research/execution depth |
| `swarm_size` | `1` - `7` | `7` | Agents per wave (max 7, Claude Code Agent tool limit) |
| `iterations` | `1` - `11` | `7` | Maximum wave count |
| `mode` | `research`, `build`, `audit`, `fix`, `explore` | auto-detect | Swarm operation mode |

### Depth Configuration

| Depth | Sources/Query | Total Budget | Web Search | Sub-Swarms |
|-------|---------------|-------------|------------|------------|
| shallow | 10 | 30 | No | No |
| medium | 50 | 250 | context7 only | No |
| deep | 500 | 5,000 | Yes | No |
| ultra | 2,000 | 10,000 | Yes | Yes (depth 2) |

---

## Swarm Architecture

```
SWARM MASTER (this orchestrator)
  |
  +-- Wave 1: 7 parallel agents --> findings
  |     +-- Synthesis --> coverage_map
  |
  +-- Wave 2: 7 agents (fill gaps) --> findings
  |     +-- Synthesis --> updated_map
  |
  +-- Wave N: convergence check
  |     +-- IF coverage >= threshold: DONE
  |     +-- IF delta < 5%: CONVERGED
  |     +-- IF N >= max: MAX_REACHED
  |
  +-- FINAL: compile all findings into deliverable
```

---

## Step 1: Task Analysis

Parse the task description and determine:

### Mode Selection (auto-detect rules)
| Keywords | Mode |
|----------|------|
| "research", "find", "learn", "compare", "what is", "how does" | research |
| "build", "create", "implement", "add", "make" | build |
| "audit", "review", "check", "evaluate", "assess" | audit |
| "fix", "repair", "resolve", "patch", "debug" | fix |
| "explore", "understand", "map", "discover", "architecture" | explore |

### Scope Determination
Identify what the swarm will operate on:
- Files: which directories/files are in scope
- Topics: which conceptual areas to cover
- Boundaries: what is explicitly OUT of scope

### Success Criteria
Define what "done" looks like before any agent is dispatched. This prevents endless looping.

### Decomposition
Split the task into 7 independent, non-overlapping subtasks. Each subtask must be completable by a single agent without depending on another agent's output from the same wave.

---

## Step 2: Wave Dispatch

For each wave, follow this protocol:

### Agent Composition
Each agent receives a structured prompt containing:

| Section | Content |
|---------|---------|
| Task | What this specific agent must accomplish |
| Scope | Exact files/topics this agent owns (non-overlapping with other agents) |
| Output format | Structured findings or code changes expected |
| Constraints | Time budget, file limits, read-only vs read-write |
| Context | Synthesis from previous waves (if wave > 1) |

### Dispatch Protocol
1. Define 7 independent subtasks with non-overlapping scope
2. Compose the agent prompt for each subtask
3. Launch all 7 agents in parallel using Agent tool with `run_in_background: true`
4. Wait for all agents to complete
5. Proceed to synthesis

### File Scope Enforcement
Every agent gets an explicit file scope boundary. Agents MUST NOT modify files outside their scope. The orchestrator verifies this after each wave by checking which files were actually touched vs. which were assigned.

### Large File Handling
Before processing any file, check if it exceeds 50K characters. If yes, split by class/function boundaries and process each chunk. This is transparent to the agent.

---

## Step 3: Synthesis

After each wave completes:

1. **Read** all agent outputs from `.productionos/SWARM-WAVE-{N}.md`
2. **Deduplicate** findings -- agents working on adjacent areas may find the same issue
3. **Map coverage** -- what has been addressed vs. what remains
4. **Identify gaps** -- topics/files/issues not yet covered by any agent
5. **Calculate coverage score** -- addressed items / total scope items x 100
6. **Quality gate** -- run self-eval on each agent's output. Scores < 6.0 trigger re-spawn for that subtask.

---

## Step 4: Convergence Check

```
coverage_score = addressed_items / total_scope_items x 100
confidence_avg = mean(agent_confidence_scores)
delta = coverage_score - previous_coverage_score

IF coverage_score >= 100% AND confidence_avg >= 0.7:  --> SUCCESS
IF delta < 5% for 2 consecutive waves:                --> CONVERGED (diminishing returns)
IF wave_count >= max_iterations:                       --> MAX_REACHED
ELSE:                                                   --> CONTINUE (fill gaps)
```

### Convergence Actions

| State | Action |
|-------|--------|
| SUCCESS | Proceed to compilation. Full coverage achieved. |
| CONVERGED | Proceed to compilation. Note remaining gaps. |
| MAX_REACHED | Proceed to compilation. Report what was not covered. |
| CONTINUE | Identify uncovered areas, decompose into 7 new subtasks, dispatch next wave with previous synthesis as context. |

---

## Step 5: Gap-Filling Waves

When continuing past the first wave:

1. Read the coverage map from the previous synthesis
2. Identify all uncovered areas
3. Decompose gaps into 7 new subtasks
4. Include synthesis from ALL previous waves as context for the new agents
5. Dispatch the next wave
6. Return to Step 3 (synthesis)

### Gap Prioritization
- P0 gaps (critical missing coverage) get dedicated agents
- P1 gaps (important but non-critical) share agents
- P2 gaps (nice-to-have) are deferred if budget is constrained

---

## Swarm Modes (detailed agent assignments)

### Research Mode
Each agent researches a different facet:

| Agent | Facet | Focus |
|-------|-------|-------|
| 1 | Core concept | Deep-dive into the primary topic |
| 2 | Alternatives | Alternative approaches and competing solutions |
| 3 | Best practices | Industry best practices and established patterns |
| 4 | Anti-patterns | Known pitfalls, mistakes, and what NOT to do |
| 5 | Implementation | Real-world examples and case studies |
| 6 | Performance | Scaling, benchmarks, and efficiency considerations |
| 7 | Security | Security implications and risk assessment |

Convergence: coverage_score (% of topic space covered) = 100%

### Build Mode
Each agent builds a different component:

| Agent | Component | Focus |
|-------|-----------|-------|
| 1 | Core implementation | Primary feature code |
| 2 | Test suite | TDD specs, unit tests, integration tests |
| 3 | Error handling | Edge cases, error paths, recovery |
| 4 | Documentation | API docs, inline comments, usage examples |
| 5 | Integration | Hooks, events, API endpoints |
| 6 | Performance | Optimization, caching, lazy loading |
| 7 | Security | Input validation, auth checks, hardening |

Convergence: all tests pass + lint clean + type check clean

### Audit Mode
Each agent audits a different dimension:

| Agent | Dimension | Focus |
|-------|-----------|-------|
| 1 | Code quality | Patterns, readability, DRY, SOLID |
| 2 | Security | Vulnerabilities, secrets, auth gaps |
| 3 | Performance | Bottlenecks, N+1 queries, bundle size |
| 4 | UX/UI | Accessibility, responsive, loading states |
| 5 | Test coverage | Missing tests, edge cases, quality |
| 6 | Documentation | Accuracy, completeness, onboarding |
| 7 | Deployment | Observability, rollback, health checks |

Convergence: all dimensions scored with file:line evidence

### Fix Mode
Agents assigned dynamically based on findings:

1. Read the issue list from a prior audit or plan
2. Group issues by category
3. Assign one agent per category (up to 7)
4. Self-healing gate after each wave
5. Automatic rollback on regression (any test that was passing now fails)

Convergence: all P0 + P1 fixes applied, tests passing

### Explore Mode
Agents map architecture and dependencies:

| Agent | Scope | Focus |
|-------|-------|-------|
| 1-N | One top-level directory or module each | Architecture, data flow, entry points, dependencies |

Output: module map with dependency graph, integration points, and boundary documentation.

Convergence: full module map with dependency graph

---

## Step 6: Compilation

Compile all wave outputs into a single deliverable:

| Mode | Deliverable |
|------|------------|
| research | Comprehensive report with citations and confidence levels |
| build | Committed code with tests, changelog, and documentation |
| audit | Scored rubric with file:line evidence for every finding |
| fix | Changelog with before/after scores and regression check |
| explore | Architecture map with dependency graph and boundary docs |

---

## Sub-Swarm Protocol (ultra depth only)

When a single agent encounters a subtopic too large for one agent:

1. Agent signals that the subtopic needs decomposition
2. Master spawns 3 sub-agents for the subtopic
3. Sub-agents report back to the parent agent
4. Parent synthesizes and reports to master

Maximum nesting depth: 2 (swarm --> sub-swarm, no sub-sub-swarms).

---

## Rollback Protocol

### Per-Agent Rollback
If an agent in build/fix mode produces code that breaks tests:
1. Revert that agent's changes: `git checkout -- {agent-scoped-files}`
2. Log the failure
3. Re-assign the subtask to a different agent in the next wave with the failure context

### Per-Wave Rollback
If an entire wave degrades the overall score:
1. Revert all changes from that wave
2. Log which subtasks caused regression
3. Dispatch a targeted fix wave addressing only the regression

### Emergency Stop
If 2 consecutive waves produce no coverage gain AND introduce regressions: HALT. Save state to checkpoint and escalate to human.

---

## Error Handling

| Scenario | Action |
|----------|--------|
| Agent dispatch fails | Log failure, continue with remaining agents |
| Agent exceeds token budget | Terminate that agent, include partial results |
| Agent modifies files outside scope | Revert out-of-scope changes, flag violation |
| Tests fail after build/fix wave | Rollback wave, re-assign with failure context |
| Coverage stalls (< 5% gain x2 waves) | Stop swarming, compile what exists, report gaps |
| Context budget exceeded (80%) | Emergency compression, summarize and conclude |

## Guardrails (Non-Negotiable)

1. Maximum 7 agents per wave (Claude Code Agent tool limit)
2. Maximum 11 waves (77 total agents)
3. Per-agent token budget: 100K
4. Per-wave token budget: 400K
5. Total session budget: 2M tokens
6. Emergency stop if any agent exceeds budget
7. Read-only mode available (append `--readonly` to prevent code changes)
8. All code changes require validation gate before commit
9. Do not parallelize by reflex -- ensure subtasks are truly independent
10. Keep subtask boundaries explicit -- no "also check X while you're there"
11. Stop when additional waves are not producing meaningful coverage gains

## Output Files

```
.productionos/
  SWARM-REPORT.md              # Final compiled deliverable
  SWARM-WAVE-{N}.md            # Per-wave agent outputs
  SWARM-COVERAGE.md            # Coverage map progression
  SWARM-GAPS.md                # Remaining gaps at convergence
  SWARM-METRICS.md             # Performance metrics (tokens, time, agents)
```
