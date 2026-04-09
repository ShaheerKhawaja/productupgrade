# ProductionOS First-Run Onboarding

## Detection
Check for ~/.productionos/config/settings.json. If it doesn't exist, this is first run.
The session-start.sh hook emits `FIRST_RUN: true` when ~/.productionos/.onboarded is absent.

## Step 1: Welcome

Display on first run:

```
ProductionOS v1.0.0-beta.1 -- your AI engineering OS.
78 agents, 356 skills, 17 hooks. Built for solo founders who need
a 10-person engineering team from 1 person + AI.
```

Key message: ProductionOS is not a linter or a code generator. It is an engineering
organization compressed into a skill suite -- code reviewer, QA engineer, security
auditor, CTO, release manager, and design system architect, all running as agents.

## Step 2: Core Concept

```
ProductionOS is a convergence engine. Instead of one-pass reviews,
it loops: audit -> fix -> re-evaluate -> repeat until quality converges.
The recursive loop is the product.
```

Explain the loop:
1. **Audit** -- Agents analyze the codebase across multiple dimensions (security, UX, performance, architecture)
2. **Fix** -- Targeted agents apply fixes for each finding
3. **Re-evaluate** -- Self-eval scores the result on 7 dimensions
4. **Repeat** -- If score < threshold, loop back. Max 3 heal iterations per cycle.
5. **Learn** -- Patterns with confidence > 0.8 persist as instincts for future sessions

This is how a solo founder gets production-grade output without a 10-person team reviewing their work.

## Step 3: Quick Start (4 entry points)

Present the 4 primary commands:

```
/production-upgrade    Full codebase audit + iterative fix convergence
                       Best for: "Make this codebase production-ready"

/deep-research [topic] 8-phase autonomous research pipeline
                       Best for: "Research X before I build it"

/self-eval             Evaluate the quality of recent work
                       Best for: "How good is what I just built?"

/security-audit        7-domain OWASP/MITRE/NIST security audit
                       Best for: "Find security vulnerabilities"
```

Mention but don't overwhelm:
- `/omni-plan-nth` is the nuclear option -- chains ALL skills, loops until 10/10
- `/auto-swarm-nth` runs parallel agents for maximum coverage
- `/designer-upgrade` handles UI/UX redesign pipelines
- Full command list: `/productionos-help`

## Step 4: Configuration -- Evaluation Threshold

Prompt the user:

```
ProductionOS evaluates all work with a 7-question self-eval protocol.
What quality threshold should gate commits?

A) >= 8.0 (production-ready, recommended)
B) >= 7.0 (faster iteration, more manual review)
C) >= 9.0 (high-stakes environments)
```

Apply selection:
- A: `pos-config set eval_threshold 8.0`
- B: `pos-config set eval_threshold 7.0`
- C: `pos-config set eval_threshold 9.0`

Default if skipped: 8.0

## Step 5: Configuration -- Proactive Mode

Prompt the user:

```
ProductionOS can proactively suggest skills based on context --
like recommending /security-audit when you touch auth code,
or /frontend-audit when editing .tsx files.

A) Keep proactive on (recommended)
B) Turn off -- I'll invoke skills manually
```

Apply selection:
- A: `pos-config set proactive true`
- B: `pos-config set proactive false`

Default if skipped: true

## Step 6: Initialize

Run the initialization sequence:

```bash
pos-init
```

This creates the full state directory:

```
~/.productionos/
  config/settings.json     # User preferences
  analytics/               # Usage tracking (local only)
  sessions/                # Active session markers
  instincts/
    project/               # Per-project learned patterns
    global/                # Cross-project patterns
  review-log/              # Review history
  cache/                   # Temp data, version check snooze
  retro/                   # Retrospective data
```

## Post-Onboarding

Mark onboarding complete:

```bash
touch ~/.productionos/.onboarded
```

This file prevents the onboarding flow from showing again. To re-run onboarding:

```bash
rm ~/.productionos/.onboarded
```

## Onboarding State Machine

```
[No .onboarded file] -> FIRST_RUN emitted by session-start.sh
  -> Step 1: Welcome
  -> Step 2: Core Concept
  -> Step 3: Quick Start
  -> Step 4: AskUser (eval threshold)
  -> Step 5: AskUser (proactive mode)
  -> Step 6: pos-init
  -> touch .onboarded
  -> [Normal session start from now on]
```

## Returning User Context Recovery

For users who HAVE been onboarded but are starting a new session, the session-start.sh
hook provides context recovery by checking for:

1. Recent handoff files (from previous session's stop hook)
2. Recent instincts (patterns learned in the last 2 hours)
3. Recent git commits (work done in the last 12 hours)

This is NOT part of onboarding -- it runs on every session start after onboarding is
complete. See the CONTEXT_RECOVERY block in session-start.sh output.
