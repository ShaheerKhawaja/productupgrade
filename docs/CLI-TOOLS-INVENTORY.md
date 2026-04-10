# CLI Tools Inventory — ProductionOS Harness

This inventory is loaded at session start so agents know their capabilities.
Updated: 2026-04-10.

## AI / LLM CLIs
| Tool | Command | Status | What it does |
|------|---------|--------|-------------|
| Claude Code | `claude` | Installed | Anthropic's coding agent (primary) |
| Codex CLI | `codex` | Installed | OpenAI's coding agent (second opinion) |
| Ollama | `ollama` | Installed | Local LLM inference |
| ruflo | `claude-flow` | Installed (v3.5.78) | Agent orchestration, swarm, MCP server |

## Web & Data Tools
| Tool | Command | Status | What it does |
|------|---------|--------|-------------|
| Firecrawl | `firecrawl` | Installed | Scrape websites to markdown |
| curl | `curl` | Installed | HTTP requests |
| jq | `jq` | Installed | JSON processing |
| yq | `yq` | Installed | YAML processing |
| ripgrep | `rg` | Installed | Fast code search |
| GitHub CLI | `gh` | Installed | GitHub operations |

## Media Tools
| Tool | Command | Status | What it does |
|------|---------|--------|-------------|
| yt-dlp | `yt-dlp` | Installed | Download YouTube videos/audio/captions |
| ffmpeg | `ffmpeg` | Installed | Audio/video processing |
| pandoc | `pandoc` | Installed | Document format conversion |

## Build Tools
| Tool | Command | Status | What it does |
|------|---------|--------|-------------|
| Node.js | `node` | Installed | JavaScript runtime |
| npm | `npm` | Installed | Node package manager |
| bun | `bun` | Installed | Fast JS runtime + package manager |
| Python 3 | `python3` | Installed | Python runtime |
| pip3 | `pip3` | Installed | Python package manager |
| Docker | `docker` | Installed | Container runtime |
| Homebrew | `brew` | Installed | macOS package manager |

## Database Tools
| Tool | Command | Status | What it does |
|------|---------|--------|-------------|
| SQLite | `sqlite3` | Installed | Embedded SQL database |
| PostgreSQL (via MCP) | `mcp__postgres__query` | Configured | Remote PostgreSQL queries |
| Redis (via MCP) | `mcp__redis__*` | Configured | Redis cache operations |

## Usage Patterns

### Web Research
```bash
# Scrape a webpage to markdown
firecrawl scrape --url "https://example.com" --format markdown

# Download YouTube transcript for research
yt-dlp --write-auto-sub --sub-lang en --skip-download -o "%(title)s" "URL"

# Convert PDF to markdown
pandoc input.pdf -t markdown -o output.md
```

### Data Processing
```bash
# Parse JSON API responses
curl -s "https://api.example.com/data" | jq '.results[] | {name, status}'

# Process YAML configs
yq '.services.web.ports' docker-compose.yml

# Fast codebase search
rg "TODO|FIXME|HACK" --type ts --glob '!node_modules'
```

### Media Processing
```bash
# Extract audio from video
ffmpeg -i input.mp4 -vn -acodec libmp3lame output.mp3

# Download and extract YouTube audio
yt-dlp -x --audio-format mp3 "URL"
```

### Multi-Agent Dispatch
```bash
# Get second opinion from Codex
codex exec "Review this code for security issues" -C . -s read-only

# Run local LLM for classification
ollama run llama3 "Classify this text: ..."

# Orchestrate agent swarm via ruflo
claude-flow swarm init --topology hierarchical --agents 5
```
