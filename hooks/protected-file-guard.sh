#!/usr/bin/env bash
# protected-file-guard.sh — PreToolUse hook that blocks writes to sensitive files
# Returns JSON: {"decision":"block","reason":"..."} or {"decision":"allow"}
set -euo pipefail

# Fail CLOSED if jq is not available — block everything rather than allow everything
if ! command -v jq >/dev/null 2>&1; then
  echo '{"decision":"block","reason":"Security guard requires jq but it is not installed. Blocking all writes as safety measure. Install jq: brew install jq"}'
  exit 0
fi

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.command // ""' 2>/dev/null || echo "")

# No file path detected — allow (non-file operations)
if [ -z "$FILE_PATH" ]; then
  echo '{"decision":"allow"}'
  exit 0
fi

# Normalize path to prevent traversal attacks
FILE_PATH=$(realpath -m "$FILE_PATH" 2>/dev/null || echo "$FILE_PATH")

BASENAME=$(basename "$FILE_PATH" 2>/dev/null || echo "")

# Allow .env.example explicitly
if echo "$BASENAME" | grep -qE '\.env\.example$'; then
  echo '{"decision":"allow"}'
  exit 0
fi

# Check blocked patterns — basename match
BLOCKED=false
REASON=""

case "$BASENAME" in
  .env*)          BLOCKED=true; REASON="Environment file '$BASENAME' contains secrets" ;;
  *.key)          BLOCKED=true; REASON="Private key file: $BASENAME" ;;
  *.pem)          BLOCKED=true; REASON="Certificate/key file: $BASENAME" ;;
  *.cert)         BLOCKED=true; REASON="Certificate file: $BASENAME" ;;
  *.p12)          BLOCKED=true; REASON="PKCS12 keystore: $BASENAME" ;;
  id_rsa*)        BLOCKED=true; REASON="SSH private key: $BASENAME" ;;
esac

# Check blocked patterns — full path match (catches traversal and nested paths)
if [ "$BLOCKED" = false ]; then
  if echo "$FILE_PATH" | grep -qE '(/\.env($|[^.])|/\.env\.[^e])'; then
    # Matches /.env, /.env.local, /.env.production, etc. but NOT /.env.example
    BLOCKED=true; REASON="Environment file detected in path: $FILE_PATH"
  elif echo "$FILE_PATH" | grep -qE '/id_rsa'; then
    BLOCKED=true; REASON="SSH private key detected in path: $FILE_PATH"
  elif echo "$FILE_PATH" | grep -qE '/\.(key|pem|cert|p12)$'; then
    BLOCKED=true; REASON="Sensitive credential file detected in path: $FILE_PATH"
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
