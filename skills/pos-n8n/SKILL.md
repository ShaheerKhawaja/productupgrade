---
name: pos-n8n
description: "n8n composite — workflow creation, import, debugging, and monitoring with workflow memory. Replaces 33 n8n skills."
argument-hint: "[create|import|debug|monitor] [workflow or node]"
---

# pos-n8n

n8n composite — workflow creation, import, debugging, and monitoring with workflow memory. Replaces 33 n8n skills.

**Replaces:** n8n-architect + 32 n8n-cli-* skills

## Actions

| Action | What |
|--------|------|
| `create [description]` | Generate n8n workflow from natural language description |
| `import [source]` | Import workflow from template, JSON, or URL |
| `debug [workflow]` | Debug failing workflow — trace execution, fix nodes |
| `monitor` | Check workflow health, execution stats, error rates |

## Routing

1. Parse action from first argument
2. Load domain memory from `~/.productionos/domains/pos-n8n/`
3. If first run: auto-detect project context, create profile
4. Dispatch to `sub-skills/{action}.md`
5. Score against `evaluation/rubric.yml`, update memory

## Domain Memory

Stored at `~/.productionos/domains/pos-n8n/`:
instance-config.yml (n8n URL, credentials, version), workflow-registry.jsonl (known workflows with status), node-patterns.jsonl (reusable node configurations), learnings.jsonl

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `action` | `create`, `import`, `debug`, `monitor` | `create` | Sub-skill to run |
| `target` | path, URL, or description | required | What to operate on |

## Guardrails

1. Memory is append-only. Never delete history.
2. Every action scored against rubric. No silent completion.
3. Profile is user-controlled. Never change without asking.
4. Evidence required. No fabricated metrics.
5. Learn from history. Compare to past executions.
