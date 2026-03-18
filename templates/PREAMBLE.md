# ProductionOS Shared Preamble

Every command should run this preamble before executing. It provides:
1. Version check
2. Context assessment
3. Memory query for prior work
4. Agent resolution

## Preamble Protocol

### Step 0A: Environment Check

```bash
# Read version
VERSION=$(cat "${CLAUDE_PLUGIN_ROOT}/VERSION" 2>/dev/null || echo "unknown")
echo "ProductionOS ${VERSION}"

# Count available agents
AGENT_COUNT=$(ls "${CLAUDE_PLUGIN_ROOT}/agents/"*.md 2>/dev/null | wc -l | tr -d ' ')
echo "Agents: ${AGENT_COUNT}"

# Check workspace type
if [ -f "package.json" ]; then
  echo "Stack: Node.js/TypeScript"
elif [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
  echo "Stack: Python"
elif [ -f "go.mod" ]; then
  echo "Stack: Go"
elif [ -f "Cargo.toml" ]; then
  echo "Stack: Rust"
else
  echo "Stack: Unknown"
fi
```

### Step 0B: Prior Work Check

Before executing any pipeline, check for existing ProductionOS output:
- Read `.productionos/` directory if it exists
- Check for prior audit reports, convergence logs, judge iterations
- If prior work exists, build on it rather than starting from scratch

### Step 0C: Agent Resolution

Based on the detected stack and the command being run, identify which agents from `agents/` are relevant. Only load agent definitions that will actually be used — do NOT read all 35 agent files upfront.

### Step 0D: Context Budget

Set token/agent/time budgets before execution:
- Read the command's guardrails section
- Estimate cost based on target codebase size
- Warn the user if the estimated cost exceeds $5

### Step 0E: Success Criteria

State what "done" looks like for this command invocation:
- Target grade (if rubric-based)
- Coverage threshold (if swarm-based)
- Deliverables (which output files will be produced)
