---
name: build-productionos
description: "ProductionOS smart router — single entry point that routes to the right pipeline based on intent. The ONLY command new users need to know."
arguments:
  - name: intent
    description: "What you want to do. Natural language or keyword. Examples: 'audit this project', 'fix the frontend', 'research authentication', 'review my PR', 'ship it', 'debug the login bug'"
    required: true
  - name: target
    description: "Target directory, file, or URL (default: current directory)"
    required: false
---

# /build-productionos — ProductionOS Smart Router

You are the ProductionOS entry point. You receive a natural language intent and route to the right command.

**This is the ONLY command a new user needs to know.** Everything else is discoverable through this.

## Step 0: Preamble

Run the shared ProductionOS preamble (`templates/PREAMBLE.md`).

## Step 0.5: Smart Agent Routing (Production House Layer 1)

Before static intent classification, run the agent index for intelligent agent selection:

```bash
bun run "${CLAUDE_PLUGIN_ROOT}/scripts/agent-index.ts" --goal "$ARGUMENTS.intent" 2>/dev/null
```

Parse the JSON output. If `lowConfidence` is `false`, the router has high-confidence agent matches:
- Display: `ProductionOS Router → ${agents.length} agents matched (confidence: ${agents[0].confidence})`
- Use the matched agents to inform which command to route to (security agents → /production-upgrade, design agents → /designer-upgrade, etc.)
- Pass the agent roster to the routed command so it knows which agents to dispatch

If `lowConfidence` is `true` or the script fails, fall through to static keyword matching below.

### Stack Detection

Also detect the project stack for tool provisioning:
```bash
bun run "${CLAUDE_PLUGIN_ROOT}/scripts/stack-detector.ts" 2>/dev/null
```

Use the detected stack to inform tool selection in the routed command.

## Step 1: Intent Classification (Static Fallback)

Classify `$ARGUMENTS.intent` into one of these categories:

### Category: AUDIT (code quality)
**Triggers:** "audit", "review", "check", "scan", "grade", "score", "how good is"
**Route to:** `/production-upgrade $ARGUMENTS.target`

### Category: DESIGN (UI/UX)
**Triggers:** "design", "redesign", "mockup", "UI", "UX", "frontend", "look", "feel", "ugly", "beautiful"
**Route to:** `/designer-upgrade $ARGUMENTS.target`

### Category: UX (user experience)
**Triggers:** "user story", "journey", "friction", "experience", "onboarding", "flow", "persona"
**Route to:** `/ux-genie $ARGUMENTS.target`

### Category: FIX (targeted improvement)
**Triggers:** "fix", "improve", "upgrade", "make better", "optimize", "refactor"
**Route to:** `/auto-swarm-nth "$ARGUMENTS.intent" --target $ARGUMENTS.target`

### Category: PLAN (strategic)
**Triggers:** "plan", "architect", "design system", "strategy", "roadmap", "vision"
**Route to:** `/omni-plan-nth $ARGUMENTS.target`

### Category: BUILD (feature development)
**Triggers:** "build", "create", "add", "implement", "feature", "new"
**Route to:** `/brainstorming $ARGUMENTS.intent` → then `/writing-plans` → then `/auto-swarm-nth`

### Category: DEBUG (fix bug)
**Triggers:** "debug", "bug", "broken", "error", "crash", "failing", "not working"
**Route to:** `/debug $ARGUMENTS.intent`

### Category: TEST (quality assurance)
**Triggers:** "test", "QA", "verify", "check", "regression", "e2e"
**Route to:** `/qa $ARGUMENTS.target`

### Category: REVIEW (code review)
**Triggers:** "review PR", "review code", "review changes", "review diff"
**Route to:** `/review`

### Category: SHIP (deploy)
**Triggers:** "ship", "deploy", "release", "merge", "push", "PR"
**Route to:** `/ship`

### Category: RESEARCH (deep investigation)
**Triggers:** "research", "investigate", "explore", "find out", "compare", "what is"
**Route to:** `/deep-research $ARGUMENTS.intent`

### Category: EVAL (self-assessment)
**Triggers:** "evaluate", "self-eval", "how did I do", "score my work", "rate"
**Route to:** `/self-eval session`

### Category: HELP (guidance)
**Triggers:** "help", "how do I", "what can you do", "list commands", "getting started"
**Route to:** `/productionos-help`

## Step 2: Confirm Route

Before executing, confirm:
```
ProductionOS → Detected intent: {CATEGORY}
Routing to: /{command} {arguments}
Target: {target or "current directory"}
```

If the classification is ambiguous, ask the user to clarify:
```
I'm not sure if you want:
A) /production-upgrade (audit and fix code quality)
B) /designer-upgrade (audit and fix design/UI)
C) /auto-swarm-nth (parallel targeted fixes)

Which fits better?
```

## Step 3: Execute

Invoke the selected command via the Skill tool or by executing its protocol directly.

## Step 4: Post-Route Self-Eval

After the routed command completes, run self-eval:
```
/self-eval last
```

## Quick Reference (shown on /pos help)

```
/build-productionos "audit this project"        → Full codebase audit (/production-upgrade)
/build-productionos "fix the frontend"          → UI/UX redesign (/designer-upgrade)
/build-productionos "research auth patterns"    → Deep research (/deep-research)
/build-productionos "review my PR"              → Code review (/review)
/build-productionos "ship it"                   → Ship workflow (/ship)
/build-productionos "debug login bug"           → Systematic debugging (/debug)
/build-productionos "plan the new feature"      → Strategic planning (/omni-plan-nth)
/build-productionos "test everything"           → QA testing (/qa)
/build-productionos "build user profiles"       → Feature development (brainstorm → plan → build)
/build-productionos "how did I do"              → Self-evaluation (/self-eval session)
/build-productionos "help"                      → Usage guide (/productionos-help)
```
