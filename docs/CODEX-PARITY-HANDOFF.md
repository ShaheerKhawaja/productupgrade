# ProductionOS Codex Parity Handoff

This document is generated from the runtime-neutral registry in [scripts/lib/runtime-targets.ts](../scripts/lib/runtime-targets.ts).

Current snapshot: 78 agents, 41 commands, 17 hooks, 11 templates, 24 tests.

## Runtime Targets

| Target | Artifact | Purpose |
|--------|----------|---------|
| Claude plugin | [.claude-plugin/plugin.json](../.claude-plugin/plugin.json) | Claude-native plugin manifest |
| Claude marketplace | [.claude-plugin/marketplace.json](../.claude-plugin/marketplace.json) | Marketplace metadata and discovery |
| Codex CLI | [SKILL.md](../SKILL.md) + [agents/openai.yaml](../agents/openai.yaml) | Direct Codex skill contract |
| Codex app/plugin | [.codex-plugin/plugin.json](../.codex-plugin/plugin.json) + [skills/productionos/SKILL.md](../skills/productionos/SKILL.md) | Native Codex app/plugin surface |

## Workflow Parity Map

| Workflow | Source Spec | Targets | Codex Behavior | Validation |
|----------|-------------|---------|----------------|------------|
| `production-upgrade` | [.claude/commands/production-upgrade.md](../.claude/commands/production-upgrade.md) | claude-plugin, codex-cli, codex-app | Run a repo audit, prioritize high-leverage defects, implement bounded fixes, then validate before reporting. | tests/runtime-targets.test.ts, tests/behavioral.test.ts |
| `review` | [.claude/commands/review.md](../.claude/commands/review.md) | claude-plugin, codex-cli, codex-app | Use Codex in review mode and report concrete findings before summaries. | tests/runtime-targets.test.ts |
| `plan-ceo-review` | [.claude/commands/plan-ceo-review.md](../.claude/commands/plan-ceo-review.md) | claude-plugin, codex-cli, codex-app | Challenge scope, tighten user value, and surface expansion opportunities explicitly. | tests/runtime-targets.test.ts |
| `plan-eng-review` | [.claude/commands/plan-eng-review.md](../.claude/commands/plan-eng-review.md) | claude-plugin, codex-cli, codex-app | Lock architecture, trust boundaries, error paths, and test coverage before implementation. | tests/runtime-targets.test.ts |
| `security-audit` | [.claude/commands/security-audit.md](../.claude/commands/security-audit.md) | claude-plugin, codex-cli, codex-app | Inspect auth, secrets, input handling, and deployment risk with findings-first output. | tests/runtime-targets.test.ts |
| `designer-upgrade` | [.claude/commands/designer-upgrade.md](../.claude/commands/designer-upgrade.md) | claude-plugin, codex-cli, codex-app | Build a UX audit and redesign plan, then route into interface work when needed. | tests/runtime-targets.test.ts |
| `ux-genie` | [.claude/commands/ux-genie.md](../.claude/commands/ux-genie.md) | claude-plugin, codex-cli, codex-app | Map user flows, identify friction, and translate findings into concrete improvements. | tests/runtime-targets.test.ts |
| `auto-swarm` | [.claude/commands/auto-swarm.md](../.claude/commands/auto-swarm.md) | claude-plugin, codex-cli, codex-app | Run the workflow serially by default in Codex, or delegate only when the user explicitly wants parallel work. | tests/runtime-targets.test.ts |
| `auto-swarm-nth` | [.claude/commands/auto-swarm-nth.md](../.claude/commands/auto-swarm-nth.md) | claude-plugin, codex-cli, codex-app | Repeat swarm-style execution until gaps close, while translating agent waves into Codex-native orchestration. | tests/runtime-targets.test.ts |
| `omni-plan` | [.claude/commands/omni-plan.md](../.claude/commands/omni-plan.md) | claude-plugin, codex-cli, codex-app | Chain the major review and execution patterns in a Codex-native sequence without Claude-only assumptions. | tests/runtime-targets.test.ts |
| `omni-plan-nth` | [.claude/commands/omni-plan-nth.md](../.claude/commands/omni-plan-nth.md) | claude-plugin, codex-cli, codex-app | Iterate the full orchestration loop until quality targets are met or clearly plateau. | tests/runtime-targets.test.ts |

## Notes

- `.claude/commands/*.md` remain workflow specs, not the cross-runtime source of truth.
- The runtime-neutral registry owns target support, shared descriptions, and generated manifests.
- Claude-only concepts must be translated to Codex-native execution, not copied verbatim.
