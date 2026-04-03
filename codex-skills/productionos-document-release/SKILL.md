---
name: productionos-document-release
description: "Post-ship documentation update — reads all project docs, cross-references the diff, updates README/ARCHITECTURE/CONTRIBUTING/CLAUDE.md to match what shipped."
argument-hint: "[repo path, target, or task context]"
---

# productionos-document-release

## Overview

Top-level Codex alias for the ProductionOS workflow [`document-release`](../../skills/document-release/SKILL.md).

- Source command: [.claude/commands/document-release.md](../../.claude/commands/document-release.md)
- Plugin-local skill: [skills/document-release/SKILL.md](../../skills/document-release/SKILL.md)
- Parity reference: [CODEX-PARITY-HANDOFF.md](../../docs/CODEX-PARITY-HANDOFF.md)

Use this alias when you want a Codex-native entrypoint without the `productionos:` namespace.

## Expected Behavior

- Workflow: `document-release`
- Codex intent: Post-ship documentation update — reads all project docs, cross-references the diff, updates README/ARCHITECTURE/CONTRIBUTING/CLAUDE.md to match what shipped.

## Guardrails

- This alias should preserve the same scope and expectations as the underlying ProductionOS workflow.
- Prefer this alias over namespaced invocation if you want a cleaner Codex skill call path.
