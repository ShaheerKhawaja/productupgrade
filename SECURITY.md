# Security Policy

## Reporting a Vulnerability

ProductionOS takes security seriously. If you discover a security vulnerability, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

### How to Report

Email your findings to the maintainers via GitHub's private vulnerability reporting:

1. Go to [Security Advisories](https://github.com/ShaheerKhawaja/ProductionOS/security/advisories)
2. Click "Report a vulnerability"
3. Provide a clear description of the vulnerability, steps to reproduce, and potential impact

### What to Expect

- **Acknowledgment**: Within 48 hours of your report
- **Assessment**: Within 7 days, we will confirm the vulnerability and its severity
- **Fix timeline**: Critical vulnerabilities will be patched within 14 days

### Scope

The following are in scope for security reports:

- **Hook scripts** (`hooks/`) — command injection, path traversal, code injection
- **CLI tools** (`bin/`) — arbitrary code execution, privilege escalation
- **Install script** (`bin/install.cjs`) — supply chain risks, path traversal
- **Agent definitions** (`agents/`) — prompt injection that could affect host systems
- **Scripts** (`scripts/`) — SSRF, file access, command injection

### Out of Scope

- Issues in Claude Code itself (report to [Anthropic](https://github.com/anthropics/claude-code))
- Denial of service via large inputs (this is a local tool)
- Issues requiring physical access to the machine

## Security Architecture

ProductionOS hooks execute in the user's shell environment. Key security properties:

- **No network calls**: No hook or script makes outbound network requests
- **Local-only analytics**: All telemetry is written to `~/.productionos/` locally
- **Fail-closed guards**: The `protected-file-guard.sh` blocks writes to sensitive files (`.env`, keys, certs) and fails closed if `jq` is unavailable
- **Input sanitization**: All hook JSON output uses `jq -n --arg` for parameterized construction
- **Path validation**: The installer validates `CLAUDE_CONFIG_DIR` is within the home directory
- **URL validation**: Scraper scripts only accept `https://` URLs

## Supported Versions

| Version | Supported |
|---------|-----------|
| 8.x     | Yes       |
| < 8.0   | No        |
