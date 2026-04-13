---
name: document-release
description: "Post-ship documentation update — reads all project docs, cross-references the diff, updates README/ARCHITECTURE/CONTRIBUTING/CLAUDE.md to match what shipped."
argument-hint: "[scope or repo path]"
---

# document-release

Post-ship documentation update — reads all project docs, cross-references the diff, updates README/ARCHITECTURE/CONTRIBUTING/CLAUDE.md to match what shipped.

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `scope` | string | all | What to update: all | readme | architecture | changelog (default: all) |

# /document-release — Post-Ship Documentation Update

After shipping, update all documentation to match what actually shipped.

## Step 0: Preamble
Run `templates/PREAMBLE.md`. Read the latest git diff.

## Step 1: Diff Analysis
```bash
# What changed since last release
git log --oneline $(git describe --tags --abbrev=0 2>/dev/null || echo HEAD~10)..HEAD
git diff --stat $(git describe --tags --abbrev=0 2>/dev/null || echo HEAD~10)..HEAD
```

## Step 2: Read Current Docs
Read ALL documentation files: README.md, ARCHITECTURE.md, CONTRIBUTING.md, CLAUDE.md, CHANGELOG.md.

## Step 3: Cross-Reference
For each doc, check:
- Do counts match reality? (agent count, command count, test count)
- Do version numbers match VERSION file?
- Are new features documented?
- Are removed features cleaned up?
- Are code examples still accurate?

## Step 4: Update
For each discrepancy found, update the doc with accurate information. Keep the doc's existing style and tone.

## Step 5: Self-Eval
Run `templates/SELF-EVAL-PROTOCOL.md`. Are all docs now accurate? Did we miss any?

## Error Handling

| Scenario | Action |
|----------|--------|
| No target provided | Ask for clarification with examples |
| Target not found | Search for alternatives, suggest closest match |
| Agent dispatch fails | Fall back to manual execution, report the error |
| Ambiguous input | Present options, ask user to pick |
| Execution timeout | Save partial results, report what completed |

## Guardrails

1. Do not silently change scope or expand beyond the user request.
2. Prefer concrete outputs and verification over abstract descriptions.
3. Keep scope faithful to the user intent.
4. Preserve existing workflow guardrails and stop conditions.
5. Verify results before concluding. Run self-eval on output quality.
