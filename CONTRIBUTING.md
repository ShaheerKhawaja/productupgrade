# Contributing to ProductUpgrade

## Structure

```
productupgrade/
├── .claude-plugin/plugin.json  # Plugin manifest
├── commands/                   # Slash commands (/productupgrade, /auto-swarm)
├── skills/                     # Skill definitions (SKILL.md files)
├── agents/                     # Agent definitions (20 agents)
├── hooks/hooks.json            # Hook configuration
├── scripts/                    # Utility scripts
├── templates/                  # Prompt and rubric templates
├── docs/                       # Design documentation
```

## Adding a New Agent

1. Create `agents/{name}.md` with YAML frontmatter:
   ```yaml
   ---
   name: agent-name
   description: What this agent does and when to use it
   model: opus  # optional, for agents needing strongest model
   tools:
     - Read
     - Glob
     - Grep
   ---
   ```
2. Add the agent to the roster in `skills/productupgrade/SKILL.md`
3. Reference it in `commands/productupgrade.md` in the appropriate phase

## Adding a Prompt Skill

1. Create `skills/prompts/{NN}-{name}.md` with frontmatter
2. Follow the composition interface pattern from existing prompt skills
3. Register it in `skills/prompts/00-decision-tree.md`

## Conventions

- YAML frontmatter for all .md component files
- `$CLAUDE_PLUGIN_ROOT` for paths in hooks/scripts
- kebab-case for file names
- Convergence threshold: 0.15 for 2 consecutive iterations
- Target grade: 10.0 (deep), 8.0 (standard), adaptive (auto)
