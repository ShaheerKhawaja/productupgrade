# Composite Skill Specification

A composite skill collapses multiple fragmented skills into a single domain-aware pipeline with shared memory, evaluation rubrics, and cross-session learning.

## Directory Structure

```
skills/{domain}/
  SKILL.md                    # Router — dispatches to sub-skills based on action
  sub-skills/
    audit.md                  # Full audit runbook for this domain
    create.md                 # Creation/generation pipeline
    research.md               # Domain-specific research protocol
    monitor.md                # Tracking and regression detection (optional)
  evaluation/
    rubric.yml                # Scoring dimensions per action
    checklist.yml             # Mandatory pre-completion checks
  memory/
    schema.yml                # What to persist across sessions
```

## Router SKILL.md Pattern

```markdown
---
name: {domain}
description: "{domain} composite — routes to audit, create, research, monitor sub-skills with shared domain memory"
argument-hint: "[action] [target or args]"
---

# {domain}

{One-paragraph description of what this composite does and why it exists.}

## Actions

| Action | What | Sub-skill |
|--------|------|-----------|
| `audit` | Full domain audit with scoring | sub-skills/audit.md |
| `create` | Generate domain-specific output | sub-skills/create.md |
| `research` | Deep domain research | sub-skills/research.md |
| `monitor` | Track changes, detect regressions | sub-skills/monitor.md |

## Routing

1. Parse the action from the first argument
2. Load domain memory from `~/.productionos/domains/{domain}/`
3. Dispatch to the matching sub-skill
4. After completion: update memory, run evaluation rubric, log result

## Memory

Domain memory is loaded before every action and updated after:
- `profile.yml` — Domain configuration (niche, preferences, constraints)
- `history.jsonl` — Past executions with scores and timestamps
- `learnings.jsonl` — Patterns that worked or failed
- `cache/` — Reusable research, analysis, templates

## Evaluation

Every action is scored against `evaluation/rubric.yml`. Score >= 8.0 passes.
Score < 6.0 triggers escalation. Scores are logged to `history.jsonl`.
```

## Sub-Skill Pattern

Each sub-skill follows the standard dense runbook format:
- YAML frontmatter (name, description)
- Inputs table
- Numbered phases with protocols
- Domain memory integration (read on start, write on complete)
- Error handling table
- Guardrails

## Evaluation Rubric Pattern (rubric.yml)

```yaml
domain: {domain}
version: 1

actions:
  audit:
    passing_score: 8.0
    dimensions:
      - name: coverage
        description: "Percentage of relevant areas examined"
        weight: 0.3
        passing: 80
      - name: actionability
        description: "Percentage of findings with specific fix instructions"
        weight: 0.3
        passing: 90
      - name: accuracy
        description: "Percentage of real issues vs false positives"
        weight: 0.4
        passing: 85

  create:
    passing_score: 8.0
    dimensions:
      - name: quality
        description: "Output meets domain-specific quality standards"
        weight: 0.4
        passing: 85
      - name: completeness
        description: "All required elements present"
        weight: 0.3
        passing: 90
      - name: originality
        description: "Not duplicating existing content"
        weight: 0.3
        passing: 80
```

## Memory Schema Pattern (schema.yml)

```yaml
domain: {domain}
version: 1

profile:
  fields:
    - name: niche
      type: string
      description: "Industry or topic focus"
    - name: tech_stack
      type: list
      description: "Relevant technologies"
    - name: preferences
      type: object
      description: "Domain-specific user preferences"

history:
  format: jsonl
  fields: [timestamp, action, target, score, duration, findings_count]

learnings:
  format: jsonl
  fields: [timestamp, pattern, confidence, context, applicable_actions]
```

## How Memory Works

### On Composite Invocation
1. Check `~/.productionos/domains/{domain}/profile.yml` exists
2. If not: run first-time setup (ask 2-3 domain questions, save profile)
3. Load profile + last 10 history entries + all learnings with confidence > 0.7
4. Pass as context to the sub-skill

### On Completion
1. Score the output against rubric.yml
2. Append to history.jsonl: {timestamp, action, target, score, duration}
3. Extract learnings: what worked? what didn't? what to try next?
4. Append learnings with confidence score to learnings.jsonl
5. Optionally write to Obsidian: ~/SecondBrain/wiki/domains/{domain}/

## Composites Defined

| Composite | Absorbs | Actions |
|-----------|---------|---------|
| `/seo` | 9 SEO skills | audit, create, research, monitor |
| `/ads` | 20 ads skills | audit, create, optimize, report |
| `/content` | 10 content skills | strategy, write, audit, refresh |
| `/security` | 9 security skills | audit, scan, harden |
| `/frontend` | 10 frontend skills | audit, upgrade, design |
| `/review` | 7 review skills | pr, code, architecture |
| `/plan` | 8 planning skills | ceo, eng, design, brainstorm |
| `/build` | 6 build skills | brainstorm, plan, implement, test |
| `/debug` | 4 debug skills | diagnose, fix, verify |
| `/research` | 5 research skills | quick, deep, exhaustive |
| `/ship` | 4 shipping skills | pr, deploy, canary |
| `/qa` | 5 QA skills | test, audit, browse |
| `/github` | 8 GitHub skills | pr, issue, release, workflow |
| `/n8n` | 33 n8n skills | create, import, debug, monitor |
