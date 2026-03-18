# Contributing to ProductionOS

## Quick Setup

```bash
git clone https://github.com/ShaheerKhawaja/productupgrade.git
cd productupgrade
bun install
bun run skill:check    # Must pass 10/10
bun run validate       # Must show 35/35 valid
bun test               # Must pass all tests
```

## Project Structure

```
productupgrade/
├── .claude-plugin/           # Plugin manifest + marketplace listing
├── .claude/commands/         # 10 command definitions (.md)
├── .claude/skills/           # Skill definition (SKILL.md)
├── agents/                   # 35 agent definitions (.md)
├── templates/                # Shared templates (preamble, rubric, convergence)
├── prompts/                  # Prompt engineering technique files
├── scripts/                  # TypeScript infrastructure (Bun)
├── tests/                    # Automated test suite
├── hooks/                    # Claude Code hooks
├── CLAUDE.md                 # Auto-loaded instructions
├── ARCHITECTURE.md           # Design decisions
├── CHANGELOG.md              # Release history
├── TODOS.md                  # Prioritized backlog
├── VERSION                   # Semver source of truth
└── package.json              # Bun build system
```

## Development Workflow

1. Create feature branch: `git checkout -b feat/your-feature`
2. Make changes
3. Validate: `bun run skill:check && bun run validate && bun test`
4. Commit: `feat: add new capability` (conventional commits)
5. Push and create PR

## Adding a New Agent

Create `agents/your-agent.md`:
```yaml
---
name: your-agent
description: "What the agent does"
color: blue
tools:
  - Read
  - Glob
  - Grep
---
```

Add `<role>` and `<instructions>` XML tags. Requirements:
- Use `.productionos/` for output paths
- Use "ProductionOS" branding
- Minimum 50 lines of instructions
- Include sub-agent coordination section
- Run `bun run validate` to verify

## Adding a New Command

Create `.claude/commands/your-command.md` with YAML frontmatter. Include:
- Step 0 preamble (read target, check memory, resolve agents)
- Convergence criteria
- Output files in `.productionos/`
- Guardrails (token budget, agent limits, rollback)

## Code Standards

- Output paths: `.productionos/` (not `.productupgrade/`)
- Branding: "ProductionOS" (not "ProductUpgrade")
- No hardcoded user paths
- TypeScript: strict mode, use `execFileSync` (not shell interpolation)
- Agent files: YAML frontmatter + XML tags

## Versioning

VERSION file is source of truth. Update VERSION, plugin.json, and marketplace.json together.
