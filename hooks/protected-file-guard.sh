#!/usr/bin/env bash
# protected-file-guard.sh — PreToolUse hook that blocks writes to sensitive files
# Returns JSON: {"decision":"block","reason":"..."} or {"decision":"allow"}
# Handles Edit, Write, AND Bash tools (detects file writes in shell commands)
set -euo pipefail
# Resolve plugin root — works for both marketplace install and git clone
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"

# Fail CLOSED if jq is not available — block everything rather than allow everything
if ! command -v jq >/dev/null 2>&1; then
  echo '{"decision":"block","reason":"Security guard requires jq but it is not installed. Blocking all writes as safety measure. Install jq: brew install jq"}'
  exit 0
fi

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null || echo "")

# For Bash tool: extract file paths from shell redirection patterns
if [ "$TOOL_NAME" = "Bash" ]; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null || echo "")
  # Detect shell write patterns: >, >>, tee, cp, mv targeting sensitive files
  # Extract target paths from common write patterns
  FILE_PATH=""
  if echo "$COMMAND" | grep -qE '>\s*\S+\.(env|key|pem|cert|p12)'; then
    FILE_PATH=$(echo "$COMMAND" | grep -oE '>\s*\S+' | tail -1 | sed 's/^>\s*//')
  elif echo "$COMMAND" | grep -qE '(>|tee|cp|mv)\s+\S*\.env'; then
    FILE_PATH=$(echo "$COMMAND" | grep -oE '(>|tee|cp|mv)\s+\S+' | tail -1 | awk '{print $NF}')
  elif echo "$COMMAND" | grep -qE '(>|tee|cp|mv)\s+\S*(id_rsa|credentials\.json|\.secrets|secrets\.ya?ml|\.pgpass|\.netrc|terraform\.tfvars)'; then
    FILE_PATH=$(echo "$COMMAND" | grep -oE '(>|tee|cp|mv)\s+\S+' | tail -1 | awk '{print $NF}')
  fi
  # If no sensitive write detected in Bash command, allow
  if [ -z "$FILE_PATH" ]; then
    echo '{"decision":"allow"}'
    exit 0
  fi
else
  # Edit/Write tool: extract file_path directly
  FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""' 2>/dev/null || echo "")
fi

# No file path detected — allow (non-file operations)
if [ -z "$FILE_PATH" ]; then
  echo '{"decision":"allow"}'
  exit 0
fi

# Normalize path — macOS compatible (no -m flag, use Python fallback)
if command -v realpath >/dev/null 2>&1; then
  # Try GNU realpath -m first, fall back to realpath without -m, fall back to raw path
  FILE_PATH=$(realpath -m "$FILE_PATH" 2>/dev/null || realpath "$FILE_PATH" 2>/dev/null || echo "$FILE_PATH")
else
  # C-2 fix: Pass path via sys.argv to prevent code injection via file path
  FILE_PATH=$(python3 -c "import sys, os; print(os.path.realpath(sys.argv[1]))" "$FILE_PATH" 2>/dev/null || echo "$FILE_PATH")
fi

BASENAME=$(basename "$FILE_PATH" 2>/dev/null || echo "")

# Allow .env.example explicitly
if echo "$BASENAME" | grep -qE '\.env\.example$'; then
  echo '{"decision":"allow"}'
  exit 0
fi

# Check blocked patterns — basename match (comprehensive list)
BLOCKED=false
REASON=""

case "$BASENAME" in
  .env*)              BLOCKED=true; REASON="Environment file '$BASENAME' contains secrets" ;;
  *.key)              BLOCKED=true; REASON="Private key file: $BASENAME" ;;
  *.pem)              BLOCKED=true; REASON="Certificate/key file: $BASENAME" ;;
  *.cert)             BLOCKED=true; REASON="Certificate file: $BASENAME" ;;
  *.p12)              BLOCKED=true; REASON="PKCS12 keystore: $BASENAME" ;;
  *.pfx)              BLOCKED=true; REASON="Windows certificate store: $BASENAME" ;;
  *.jks)              BLOCKED=true; REASON="Java keystore: $BASENAME" ;;
  *.keystore)         BLOCKED=true; REASON="Keystore file: $BASENAME" ;;
  *.keyring)          BLOCKED=true; REASON="Keyring file: $BASENAME" ;;
  id_rsa*)            BLOCKED=true; REASON="SSH private key: $BASENAME" ;;
  id_ed25519*)        BLOCKED=true; REASON="SSH private key: $BASENAME" ;;
  id_ecdsa*)          BLOCKED=true; REASON="SSH private key: $BASENAME" ;;
  credentials.json)   BLOCKED=true; REASON="GCP/cloud credentials: $BASENAME" ;;
  .secrets)           BLOCKED=true; REASON="Secrets file: $BASENAME" ;;
  secrets.yaml)       BLOCKED=true; REASON="Secrets config: $BASENAME" ;;
  secrets.yml)        BLOCKED=true; REASON="Secrets config: $BASENAME" ;;
  .pgpass)            BLOCKED=true; REASON="PostgreSQL password file: $BASENAME" ;;
  .netrc)             BLOCKED=true; REASON="Network credentials: $BASENAME" ;;
  .htpasswd)          BLOCKED=true; REASON="HTTP auth credentials: $BASENAME" ;;
  terraform.tfvars)   BLOCKED=true; REASON="Terraform variables (may contain secrets): $BASENAME" ;;
  kubeconfig)         BLOCKED=true; REASON="Kubernetes config: $BASENAME" ;;
esac

# Check blocked patterns — full path match
if [ "$BLOCKED" = false ]; then
  if echo "$FILE_PATH" | grep -qE '(/\.env($|[^.])|/\.env\.[^e])'; then
    BLOCKED=true; REASON="Environment file detected in path: $FILE_PATH"
  elif echo "$FILE_PATH" | grep -qE '/id_(rsa|ed25519|ecdsa)'; then
    BLOCKED=true; REASON="SSH private key detected in path: $FILE_PATH"
  elif echo "$FILE_PATH" | grep -qE '/\.(key|pem|cert|p12|pfx|jks|keystore)$'; then
    BLOCKED=true; REASON="Sensitive credential file detected in path: $FILE_PATH"
  elif echo "$FILE_PATH" | grep -qE '/\.kube/config'; then
    BLOCKED=true; REASON="Kubernetes config detected in path: $FILE_PATH"
  elif echo "$FILE_PATH" | grep -qE '/service-account.*\.json$'; then
    BLOCKED=true; REASON="Service account credentials: $FILE_PATH"
  fi
fi

# docker-compose.prod.* (yml, yaml, etc.)
if echo "$BASENAME" | grep -qE '^docker-compose\.prod\.'; then
  BLOCKED=true; REASON="Production Docker config: $BASENAME"
fi

if [ "$BLOCKED" = true ]; then
  echo "{\"decision\":\"block\",\"reason\":\"Protected file write blocked. $REASON. Requires explicit user approval.\"}"
else
  echo '{"decision":"allow"}'
fi
