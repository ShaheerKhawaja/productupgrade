---
name: productionos
description: "ProductionOS — dual-target AI engineering operating system for repo-wide audits, upgrade plans, code reviews, strategic product reviews, security sweeps, UX audits, and recursive quality improvement."
argument-hint: "[goal, command name, or repo path]"
---

# ProductionOS

ProductionOS is a dual-target AI engineering operating system with 80 agents, 41 commands, and 18 hooks.

Use this skill to translate the Claude-oriented workflow specs in this repo into Codex-native execution.

## Start Here

1. Read `README.md` for the product overview and `CLAUDE.md` for the current command catalog.
2. Treat `.claude/commands/*.md` as workflow specs, not literal Codex slash commands.
3. Use `docs/CODEX-PARITY-HANDOFF.md` as the source of truth for target support and parity coverage.
4. Load only the agent files in `agents/` that matter for the chosen workflow.
5. Use `templates/` and `prompts/` only when the selected command or agent points to them.

## Codex Workflow Mapping

- `production-upgrade` — Run a repo audit, prioritize high-leverage defects, implement bounded fixes, then validate before reporting.
- `review` — Use Codex in review mode and report concrete findings before summaries.
- `plan-ceo-review` — Challenge scope, tighten user value, and surface expansion opportunities explicitly.
- `plan-eng-review` — Lock architecture, trust boundaries, error paths, and test coverage before implementation.
- `security-audit` — Inspect auth, secrets, input handling, and deployment risk with findings-first output.
- `designer-upgrade` — Build a UX audit and redesign plan, then route into interface work when needed.
- `ux-genie` — Map user flows, identify friction, and translate findings into concrete improvements.
- `auto-swarm` — Run the workflow serially by default in Codex, or delegate only when the user explicitly wants parallel work.
- `auto-swarm-nth` — Repeat swarm-style execution until gaps close, while translating agent waves into Codex-native orchestration.
- `omni-plan` — Chain the major review and execution patterns in a Codex-native sequence without Claude-only assumptions.
- `omni-plan-nth` — Iterate the full orchestration loop until quality targets are met or clearly plateau.

## Guardrails

- Do not claim Claude-only hooks, slash commands, or marketplace flows can run directly in Codex.
- Keep work scoped; do not emulate large multi-agent swarms unless the user explicitly wants that overhead.
- Respect the repo's guardrails in `hooks/`, `.claude-plugin/`, `.codex-plugin/`, and `templates/`.
- For packaging or install questions, inspect `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.codex-plugin/plugin.json`, `package.json`, and `README.md`.

## Output Expectations

- Explain which ProductionOS workflow you are mapping.
- Use Codex-native tools for implementation, review, planning, or validation.
- Verify with the smallest relevant tests or checks before concluding.
- Summarize what changed, what was verified, and what still needs human approval.
