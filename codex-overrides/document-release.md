---
name: document-release
description: "Post-ship documentation update — reads all project docs, cross-references the diff, updates README/ARCHITECTURE/CONTRIBUTING/CLAUDE.md to match what shipped."
argument-hint: "[scope or repo path]"
---

# document-release

## Overview

Use this as the Codex-first documentation sync workflow after code changes land. It should compare the shipped diff against the current docs, fix drift, and leave the repo’s public docs truthful.

Source references:
- `.claude/commands/document-release.md`

## Inputs

- optional `scope`: `all`, `readme`, `architecture`, or `changelog`
- current diff or release range

## Codex Workflow

1. Read the shipped diff or release range.
2. Read the current repo docs.
3. Cross-check:
   - counts
   - versions
   - feature descriptions
   - examples and command references
4. Update only the docs that are actually stale.
5. Re-read the updated docs to verify they match the code and manifests.

## Expected Output

- list of drift found
- docs updated
- remaining doc debt if any

## Guardrails

- keep the existing doc voice and structure
- do not invent features or counts
- prefer precise sync over broad doc rewrites
