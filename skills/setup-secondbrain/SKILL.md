---
name: setup-secondbrain
description: >
  Scaffold and wire a persistent SecondBrain (Obsidian vault + LLM wiki) for cross-session
  knowledge management. Creates PARA structure, wiki domains/entities/concepts, cross-project
  references, and RAG integration. Runs once per user, then the wiki compounds over time.
  Triggers on: "setup secondbrain", "create knowledge base", "setup wiki", "persistent memory",
  "second brain", "/setup-secondbrain".
---

# setup-secondbrain: Persistent Knowledge Layer

Scaffold a SecondBrain vault that persists knowledge across all Claude Code sessions and projects. Uses the PARA method (Projects, Areas, Resources, Archive) combined with an LLM-powered wiki layer.

The wiki is the product. Chat is just the interface.

---

## Prerequisites

- Obsidian installed (optional but recommended for graph view)
- `git` available (for vault version control)

---

## Setup Flow

### Step 1: Gather User Context (no PII stored in code)

Ask the user these questions (one at a time, adapt based on answers):

1. **"Where should the vault live?"** Default: `~/SecondBrain`
2. **"What are your active projects?"** (names + one-line descriptions)
3. **"What domains do you work in?"** (e.g., AI/ML, web dev, consulting, marketing)
4. **"Any areas of ongoing responsibility?"** (e.g., engineering, clients, ops)

Derive user identity from git config (NEVER hardcode):
```bash
USERNAME=$(git config --global user.name 2>/dev/null || echo "User")
EMAIL=$(git config --global user.email 2>/dev/null || echo "")
```

### Step 2: Scaffold Vault Structure

```
$VAULT_PATH/
  .raw/               # Immutable source documents (hidden in Obsidian)
  .obsidian/          # Obsidian config
    snippets/
  wiki/               # LLM-generated knowledge base
    index.md          # Master catalog
    log.md            # Chronological operation log
    hot.md            # Hot cache (~500 words, recent context)
    overview.md       # Executive summary
    sources/          # One summary per raw source
    entities/         # Products, people, orgs, repos
      _index.md
    concepts/         # Patterns, frameworks, mental models
      _index.md
    domains/          # Top-level topic areas
      _index.md
    comparisons/      # Side-by-side analyses
    questions/        # Filed answers
    meta/             # Dashboards, lint reports
  00-Inbox/           # PARA: temporary capture
  01-Projects/        # PARA: active initiatives (one folder per project)
  02-Areas/           # PARA: ongoing responsibilities
  03-Resources/       # PARA: reference materials
  04-Archive/         # PARA: completed/inactive
  05-Templates/       # Note templates
  Daily/              # Daily notes
  Sessions/           # Claude Code session logs
  Handoffs/           # Session handoff documents
  _attachments/       # Images, PDFs
```

### Step 3: Create CLAUDE.md in Vault

Use this template (substitute user values):

```markdown
# $VAULT_NAME: LLM Wiki + PARA Second Brain

Mode: D (Personal) + C (Business)
Purpose: Persistent knowledge base for $USERNAME
Owner: $USERNAME
Created: $TODAY

## Structure
[paste folder map]

## Conventions
- All notes use YAML frontmatter: type, status, created, updated, tags (minimum)
- Wikilinks use [[Note Name]] format: filenames are unique, no paths needed
- .raw/ contains source documents: never modify them
- wiki/index.md is the master catalog: update on every ingest
- wiki/log.md is append-only: never edit past entries
- New log entries go at the TOP of the file

## Operations
- Ingest: drop source in .raw/, say "ingest [filename]"
- Query: ask any question -- Claude reads index first, then drills in
- Lint: say "lint the wiki" to run a health check
- Save: "/save" to file current conversation as a wiki note
```

### Step 4: Create Domain Pages

For each domain the user listed, create `wiki/domains/<slug>.md`:

```markdown
---
type: domain
title: "$DOMAIN_NAME"
created: $TODAY
updated: $TODAY
tags: [domain, $TAG1, $TAG2]
status: active
---

# $DOMAIN_NAME

[User's description]

## Products
- [[Product 1]] -- description
- [[Product 2]] -- description

## Key Architecture
[Populated from user's answers or left as TODO]
```

### Step 5: Create Entity Pages

For each project/product, create `wiki/entities/<slug>.md`:

```markdown
---
type: entity
title: "$ENTITY_NAME"
created: $TODAY
updated: $TODAY
tags: [entity, product, $TAG1]
status: active
entity_type: product
---

# $ENTITY_NAME

## Overview
| Field | Value |
|-------|-------|
| Repo | $REPO_PATH |
| Stack | $STACK |
| Domain | [[$DOMAIN]] |
| Status | $STATUS |
```

### Step 6: Create PARA Notes

- `02-Areas/<area>.md` for each ongoing responsibility
- `03-Resources/<resource>.md` for reference materials
- `01-Projects/<project>/` folder for each active project

### Step 7: Create Templates

Create `05-Templates/` with: entity.md, concept.md, domain.md, source.md, question.md, comparison.md, daily-note.md, session-log.md, handoff.md, research-note.md, project.md

### Step 8: Wire Cross-Project References

For EACH project that has a CLAUDE.md, append:

```markdown
## Wiki Knowledge Base
Path: $VAULT_PATH

When you need context not already in this project:
1. Read wiki/hot.md first (recent context, ~500 words)
2. If not enough, read wiki/index.md (full catalog)
3. If you need domain specifics, read wiki/domains/<relevant-domain>.md
4. Only then read individual wiki pages

Do NOT read the wiki for:
- General coding questions or language syntax
- Things already in this project's files or conversation
- Tasks unrelated to the current project
```

### Step 9: Wire ProductionOS Integration

Register the vault path in ProductionOS config:

```bash
# In ~/.productionos/config/settings.json
{
  "secondbrain_path": "$VAULT_PATH",
  "secondbrain_auto_session_log": true,
  "secondbrain_hot_cache_update": "session_end"
}
```

Update `stop-session-handoff.sh` to:
1. Copy session summary to `$VAULT_PATH/Sessions/`
2. Update `wiki/hot.md` ONLY if session produced meaningful work (>3 commits or >5 file edits)
3. Copy handoff to `$VAULT_PATH/Handoffs/`

### Step 10: Initialize Git

```bash
cd $VAULT_PATH
git init
echo ".obsidian/workspace.json" >> .gitignore
echo ".obsidian/cache/" >> .gitignore  
echo ".trash/" >> .gitignore
git add -A
git commit -m "chore: scaffold SecondBrain vault"
```

### Step 11: Validate

Run these checks:
1. All frontmatter is valid YAML with required fields (type, title)
2. All wikilinks resolve to real files (exclude templates)
3. Cross-project CLAUDE.md refs point to existing paths
4. Read path simulation: hot.md -> index.md -> domain -> entity (measure tokens)
5. No PII patterns in committed files (emails, IPs, API keys, tokens)

Report results as pass/fail table.

---

## Post-Setup Operations

After initial scaffold, the wiki grows through:

- **Ingest**: Drop documents in `.raw/`, say "ingest [filename]"
- **Query**: Ask questions -- answers get filed in `wiki/questions/`
- **Session logs**: Auto-captured at session end
- **Hot cache**: Updated after every meaningful session
- **Lint**: Say "lint the wiki" to find orphans, dead links, gaps

---

## Security Rules

- NEVER store API keys, tokens, passwords, or secrets in the vault
- User identity comes from `git config`, not hardcoded values
- Vault `.gitignore` excludes workspace state and cache
- PII scan runs during validation step
- If vault is pushed to remote, ensure repo is PRIVATE
