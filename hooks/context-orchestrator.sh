#!/usr/bin/env bash
# ProductionOS Context Orchestrator
# Runs at SessionStart to prevent context explosion from stacked plugins.
#
# Problem: 36+ enabled plugins inject context simultaneously on every prompt,
# causing 529 overloaded_error when combined context exceeds API limits.
#
# Solution: This hook outputs env vars that suppress heavy injection from
# known plugins (Vercel, ECC) and sets a global context budget.

set -euo pipefail

# Read stdin (hook input) and pass through
INPUT=$(cat)

# Detect workspace type from current directory
CWD="${CLAUDE_CWD:-$(pwd)}"
IS_VERCEL_PROJECT=false
IS_NEXTJS_PROJECT=false
IS_PYTHON_PROJECT=false

# Check for Vercel/Next.js project indicators
if [[ -f "$CWD/vercel.json" ]] || [[ -f "$CWD/.vercel/project.json" ]]; then
  IS_VERCEL_PROJECT=true
fi
if [[ -f "$CWD/next.config.ts" ]] || [[ -f "$CWD/next.config.js" ]] || [[ -f "$CWD/next.config.mjs" ]]; then
  IS_NEXTJS_PROJECT=true
fi
if [[ -f "$CWD/pyproject.toml" ]] || [[ -f "$CWD/requirements.txt" ]] || [[ -f "$CWD/setup.py" ]]; then
  IS_PYTHON_PROJECT=true
fi

# Build suppression env vars based on workspace
ENV_VARS=""

# Always suppress Vercel's aggressive lexical prompt matching
# (it matches keywords in command templates, not actual user intent)
ENV_VARS="${ENV_VARS}VERCEL_PLUGIN_LEXICAL_PROMPT=0\n"

# Reduce Vercel injection budgets unless this IS a Vercel project
if [[ "$IS_VERCEL_PROJECT" == "false" ]] && [[ "$IS_NEXTJS_PROJECT" == "false" ]]; then
  ENV_VARS="${ENV_VARS}VERCEL_PLUGIN_PROMPT_INJECTION_BUDGET=2000\n"
  ENV_VARS="${ENV_VARS}VERCEL_PLUGIN_INJECTION_BUDGET=6000\n"
fi

# Set ProductionOS active flag (other hooks can check this)
ENV_VARS="${ENV_VARS}PRODUCTIONOS_ACTIVE=1\n"

# Detect context profile based on workspace
PROFILE="general"
if [[ "$IS_VERCEL_PROJECT" == "true" ]] || [[ "$IS_NEXTJS_PROJECT" == "true" ]]; then
  PROFILE="web-fullstack"
elif [[ "$IS_PYTHON_PROJECT" == "true" ]]; then
  PROFILE="python-backend"
elif [[ -f "$CWD/.claude-plugin/plugin.json" ]] || [[ -f "$CWD/plugin.json" ]]; then
  PROFILE="plugin-dev"
fi
ENV_VARS="${ENV_VARS}PRODUCTIONOS_CONTEXT_PROFILE=${PROFILE}\n"

# Output the suppression message as additionalContext
cat <<BANNER
ProductionOS v5.0 | Context Profile: ${PROFILE}

Commands:
  /omni-plan             13-step orchestrative pipeline (flagship)
  /auto-swarm "task"     Distributed agent swarm
  /production-upgrade    Recursive code audit
  /deep-research         8-phase autonomous research
  /agentic-eval          CLEAR v2.0 framework evaluation
  /security-audit        7-domain hardening audit
  /context-engineer      Token-efficient context construction
  /logic-mode            Idea -> production plan pipeline
  /learn-mode            Interactive code tutor
  /productionos-update   Self-update from GitHub

Context Budget: Managed | Lexical Injection: Suppressed | Profile: ${PROFILE}
BANNER

# Write env vars to CLAUDE_ENV_FILE if available
if [[ -n "${CLAUDE_ENV_FILE:-}" ]]; then
  printf "%b" "$ENV_VARS" >> "$CLAUDE_ENV_FILE"
fi

echo "$INPUT" >&2
