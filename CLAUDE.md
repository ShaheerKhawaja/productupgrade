# ProductUpgrade — Claude Code Plugin

AI-powered product upgrade pipeline that orchestrates up to 54 concurrent review agents to systematically audit, improve, and validate any product codebase.

## Plugin Structure

```
productupgrade/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest (name, version, author)
├── .claude/
│   ├── skills/
│   │   └── productupgrade/
│   │       └── SKILL.md          # Core skill: 54-agent recursive pipeline
│   └── commands/
│       └── productupgrade.md     # /productupgrade slash command
├── agents/
│   ├── llm-judge.md             # Independent quality evaluator (read-only, Opus)
│   ├── deep-researcher.md       # Techstack/competitor/library researcher (Opus)
│   ├── code-reviewer.md         # Systematic code review with confidence scoring
│   ├── ux-auditor.md            # UX/UI audit with a11y and competitor comparison
│   └── dynamic-planner.md       # Finding synthesis + prioritized batch planning
├── skills-bundle/               # 22 bundled reference skills for self-contained operation
├── scripts/
│   ├── scrape-competitor.sh     # Playwright competitor UX scraper
│   ├── pull-source.sh           # Git clone + repo analysis
│   └── gui-audit.sh             # Screenshots + Lighthouse + a11y
├── templates/
│   └── RUBRIC.md                # 10-dimension evaluation rubric template
├── CLAUDE.md                    # This file
└── README.md
```

## Installation

```bash
# As Claude Code plugin
claude plugins add ~/productupgrade

# Or add to settings
echo '{"plugins": ["~/productupgrade"]}' >> .claude/settings.json
```

## Usage

```
/productupgrade              # Full recursive pipeline (up to 7 iterations)
/productupgrade audit        # Audit only (no code changes)
/productupgrade ux           # UX focused + competitor scraping
/productupgrade fix          # Fix findings from previous audit
/productupgrade validate     # Validate recent changes
/productupgrade judge        # Run LLM-as-Judge evaluation only
```

## Agent Architecture

All agents use structured XML role definitions inspired by VERA/Gigawatt prompt patterns:
- `<role>` — Identity, capabilities, boundaries
- `<context>` — Operating environment, inputs, coordination
- `<instructions>` — Step-by-step protocols with `<think>`, `<scratchpad>`, `<answer>` blocks
- `<criteria>` — Measurable quality standards and failure modes
- `<error_handling>` — Edge case management and recovery

## Key Features

- **Recursive convergence loop**: Runs until target grade reached or improvement converges
- **LLM-as-Judge**: Independent read-only evaluator with confidence calibration
- **Deep research**: Techstack, competitor, library, and niche research before implementation
- **Dynamic planning**: Synthesizes all findings into prioritized execution batches
- **Self-consistency validation**: Multi-path reasoning for complex evaluations
- **22 bundled skills**: Self-contained — no external skill dependencies required

## Attribution

Bundles skills from:
- [superpowers](https://github.com/anthropics/claude-code) — Anthropic's core skills
- [gstack](https://github.com/garry-tan/gstack) — Garry Tan's skill suite
- [UX Replicator](https://github.com/ShaheerKhawaja/UX-Replicator) — Shaheer Khawaja
- Prompt engineering patterns inspired by Gigawatt, VERA, and Market Garden Router architectures
