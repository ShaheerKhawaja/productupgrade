---
name: productionos
description: "ProductionOS — AI engineering operating system for repo-wide audits, upgrade plans, code reviews, strategic product reviews, security sweeps, UX audits, and recursive quality improvement. Use when the user wants a production-grade audit/fix loop or wants to apply ProductionOS command patterns in Codex."
argument-hint: "[goal, command name, or repo path]"
---

# ProductionOS

Use this skill to adapt the ProductionOS repo's Claude-oriented workflows to Codex.

## Start Here

1. Read `README.md` for the product overview and `CLAUDE.md` for the current command catalog.
2. Treat `.claude/commands/*.md` as workflow specs, not literal Codex slash commands.
3. Load only the agent files in `agents/` that matter for the chosen workflow.
4. Use `templates/` and `prompts/` only when the selected command or agent points to them.
5. For interface polish, motion, or design critique, route into `skills/interface-craft/SKILL.md`.

## Codex Mapping

- `production-upgrade`: run a repo-wide audit, identify the highest-leverage defects, make a fix plan, implement bounded improvements, then validate.
- `review`: do a findings-first code review.
- `plan-ceo-review`: rethink scope and user value before implementation.
- `plan-eng-review`: focus on architecture, trust boundaries, edge cases, and test coverage.
- `designer-upgrade` or `ux-genie`: build a UX audit or redesign plan, then use `skills/interface-craft/` for detailed interface work.
- `security-audit`: inspect secrets handling, auth, trust boundaries, and deployment risk.
- `auto-swarm` or `omni-plan*`: emulate the workflow serially in Codex unless the user explicitly asks for delegated or parallel sub-agents.

## Workflow

1. Clarify the requested outcome and choose the closest ProductionOS command pattern.
2. Open the matching file in `.claude/commands/` and only the agent docs it references.
3. Execute the review, plan, or fix loop with Codex-native tools and the repo's own guardrails.
4. Verify with the smallest relevant tests or checks before concluding.
5. Summarize what changed, what was verified, and what still needs human approval.

## Guardrails

- Do not claim Claude-only hooks, slash commands, or marketplace flows can run directly in Codex.
- Keep work scoped; do not emulate large multi-agent swarms unless the user explicitly wants that overhead.
- Respect the repo's existing guardrails in `hooks/`, `.claude-plugin/`, and `templates/`.
- If the task is mainly design critique or animation tuning, load `skills/interface-craft/SKILL.md` instead of the full ProductionOS stack.
- For packaging or install questions, inspect `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `package.json`, and `README.md`.
