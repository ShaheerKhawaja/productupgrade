# Agent Invocation Protocol

How ProductionOS agents invoke other agents and skills. Every agent that references "invoke X" MUST follow this protocol.

## Method 1: Subagent Dispatch (primary)

Use Claude Code's Agent tool to spawn a subagent with the target agent's instructions:

```
1. Read the target agent's definition: agents/{name}.md
2. Extract the <role> and <instructions> content
3. Dispatch via Agent tool:
   - description: "{agent-name}: {1-line task description}"
   - prompt: "You are the {agent-name} agent. {role content}\n\n{instructions content}\n\nTASK: {specific task}\nTARGET: {files/scope}\nOUTPUT: Write findings to .productionos/{OUTPUT-FILE}"
   - run_in_background: true (for parallel dispatch)
4. Wait for completion, read output file
```

## Method 2: Skill Invocation (for external skills)

For skills from other plugins (gstack, superpowers):

```
1. Check if skill exists: attempt to invoke it
2. If available: let it execute, read its output
3. If unavailable: log "SKIP: {skill} not available" and continue
4. Never halt the pipeline because an external skill is missing
```

## Method 3: File-Based Handoff (for sequential agents)

When Agent A produces output consumed by Agent B:

```
1. Agent A writes structured output to .productionos/{ARTIFACT}.md
2. Agent A includes a MANIFEST block at the top:
   ---
   producer: {agent-name}
   timestamp: {ISO8601}
   status: complete
   ---
3. Agent B reads .productionos/{ARTIFACT}.md
4. Agent B verifies the MANIFEST block exists (artifact is valid)
5. If artifact missing: Agent B logs "MISSING: {ARTIFACT}.md from {producer}" and continues with degraded capability
```

## Method 4: Artifact Validation (MANDATORY for all consumers)

Before reading any `.productionos/` artifact, consuming commands MUST run this validation sequence. Skipping validation is a P0 violation.

```
Before reading any .productionos/ artifact:
1. Check file exists (if not: log MISSING, continue with degraded capability)
2. Check first 5 lines contain --- delimiters (if not: log MALFORMED, skip artifact)
3. Check MANIFEST has 'producer' and 'status' fields (if not: log INVALID-MANIFEST, skip)
4. Check 'status' is 'complete' (if 'in-progress' or 'failed': log INCOMPLETE, skip)
```

**Validation outcomes:**
- `VALID` — artifact passes all 4 checks, safe to consume
- `MISSING` — file does not exist. Log `MISSING: {filename}`. Continue with degraded capability. Do NOT halt the pipeline.
- `MALFORMED` — file exists but has no `---` frontmatter delimiters in first 5 lines. Log `MALFORMED: {filename}`. Skip this artifact entirely.
- `INVALID-MANIFEST` — frontmatter exists but missing `producer` or `status` fields. Log `INVALID-MANIFEST: {filename}`. Skip this artifact entirely.
- `INCOMPLETE` — `status` field is `in-progress` or `failed`. Log `INCOMPLETE: {filename} (status={status})`. Skip this artifact entirely.

**Logging:** All validation outcomes MUST be logged to `.productionos/ARTIFACT-VALIDATION.log` with timestamp and consuming command name.

**Why this matters:** Without schema validation, a malformed or incomplete artifact from a crashed agent can silently corrupt downstream commands, causing cascading failures across the entire pipeline.

## Rules

- NEVER assume an agent/skill is available — always check first
- NEVER halt the pipeline because a sub-agent failed — degrade gracefully
- ALWAYS write output to .productionos/ with a consistent filename
- ALWAYS include producer and timestamp in output files
- Subagents get FRESH context — never pass the parent's full conversation
- Maximum subagent nesting depth: 3 (command → agent → sub-agent → skill)
