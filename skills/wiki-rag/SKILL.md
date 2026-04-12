---
name: wiki-rag
description: >
  Local RAG and Graph RAG over the SecondBrain wiki vault. Progressive context loading
  (hot cache -> index -> domain -> entity). Graph traversal via wikilink resolution.
  Use when agents need cross-project context, when answering questions that span multiple
  domains, or when building context for planning tasks.
  Triggers on: "wiki context", "cross-project context", "what do we know about",
  "check the wiki", "graph context", "/wiki-rag".
---

# wiki-rag: Local RAG + Graph RAG for SecondBrain

Retrieval-Augmented Generation over the SecondBrain Obsidian vault. Two modes: progressive local RAG (structured drill-down) and graph RAG (wikilink traversal for related context).

---

## Configuration

The vault path comes from ProductionOS config:

```bash
VAULT_PATH=$(python3 -c "
import json, os
cfg = os.path.expanduser('~/.productionos/config/settings.json')
print(json.load(open(cfg)).get('secondbrain_path', os.path.expanduser('~/SecondBrain')))
" 2>/dev/null || echo "$HOME/SecondBrain")
```

If the vault doesn't exist, suggest running `/setup-secondbrain`.

---

## Mode 1: Local RAG (Progressive Loading)

Structured 4-level drill-down. Each level adds ~200-400 tokens. Stop as soon as you have enough context.

### Level 0: Hot Cache (always load first)
```
Read: $VAULT_PATH/wiki/hot.md
Cost: ~500 tokens
Contains: Recent context, active threads, latest changes
```

### Level 1: Index Scan
```
Read: $VAULT_PATH/wiki/index.md
Cost: ~300 tokens additional
Contains: Full catalog of domains, entities, concepts with one-line summaries
Use: When hot cache doesn't answer the question
```

### Level 2: Domain/Category Drill
```
Read: $VAULT_PATH/wiki/domains/<relevant>.md
  OR: $VAULT_PATH/wiki/entities/_index.md
  OR: $VAULT_PATH/wiki/concepts/_index.md
Cost: ~300 tokens per file
Use: When you know which domain but need specifics
```

### Level 3: Individual Page
```
Read: $VAULT_PATH/wiki/entities/<entity>.md
  OR: $VAULT_PATH/wiki/concepts/<concept>.md
Cost: ~300-500 tokens per page
Use: When you need full detail on a specific entity/concept
```

### Decision Logic

```
question = user's query

if question is about recent work:
    return Level 0 (hot cache)

if question mentions a specific product/project:
    load Level 0 + Level 3 (direct entity lookup)

if question spans multiple domains:
    load Level 0 + Level 1 + relevant Level 2 pages

if question is exploratory ("what do we know about X"):
    load Level 0 + Level 1, then Graph RAG for related nodes
```

### Token Budget

| Scenario | Levels | Est. Tokens |
|----------|--------|-------------|
| Quick context | L0 only | ~500 |
| Specific entity | L0 + L3 | ~1,000 |
| Domain overview | L0 + L1 + L2 | ~1,100 |
| Full drill-down | L0 + L1 + L2 + L3 | ~1,500 |
| Multi-domain | L0 + L1 + 2xL2 + 2xL3 | ~2,500 |

---

## Mode 2: Graph RAG (Wikilink Traversal)

Follow `[[wikilinks]]` to discover related context. This finds connections that keyword search misses.

### Algorithm

```
1. Start at the target page (e.g., wiki/entities/entropy-studio.md)
2. Extract all [[wikilinks]] from that page
3. For each linked page that exists:
   a. Read its title and first paragraph (not full content)
   b. Extract ITS wikilinks (depth 2)
4. Return a context graph: {node: summary, edges: [linked_nodes]}
5. Agent decides which nodes to read fully based on relevance
```

### Implementation

```python
import re, os

def extract_wikilinks(content):
    """Extract [[Link Name]] from markdown content."""
    return re.findall(r'\[\[([^\]|#]+?)(?:\|[^\]]+?)?\]\]', content)

def build_context_graph(vault_path, start_page, max_depth=2):
    """Build a context graph from wikilinks starting at a page."""
    # Build file index
    file_index = {}
    for root, dirs, files in os.walk(os.path.join(vault_path, "wiki")):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for f in files:
            if f.endswith(".md"):
                name = f.replace(".md", "")
                file_index[name.lower()] = os.path.join(root, f)

    # BFS traversal
    visited = set()
    graph = {}
    queue = [(start_page, 0)]

    while queue:
        page, depth = queue.pop(0)
        if page.lower() in visited or depth > max_depth:
            continue
        visited.add(page.lower())

        # Resolve to file
        slug = page.lower().replace(" ", "-")
        filepath = file_index.get(page.lower()) or file_index.get(slug)
        if not filepath or not os.path.exists(filepath):
            continue

        with open(filepath) as f:
            content = f.read()

        # Extract summary (first non-frontmatter paragraph)
        parts = content.split("---", 2)
        body = parts[2] if len(parts) >= 3 else content
        lines = [l.strip() for l in body.strip().split("\n") if l.strip() and not l.startswith("#")]
        summary = lines[0] if lines else ""

        links = extract_wikilinks(content)
        graph[page] = {"summary": summary[:200], "links": links, "path": filepath}

        for link in links:
            if link.lower() not in visited:
                queue.append((link, depth + 1))

    return graph
```

### Usage Pattern

When an agent needs context about a topic:

1. **Identify start node** from the query (entity name, domain, concept)
2. **Build graph** with depth=2 (start page + direct links + their links)
3. **Present graph summary** to the agent (node names + summaries + edges)
4. **Agent selects** which nodes to read fully
5. **Load selected pages** at Level 3

This is ~2x more context-efficient than loading all pages, because the agent sees the graph shape first and only loads what's relevant.

---

## Integration with ProductionOS Agents

### For Planning Agents (omni-plan, dynamic-planner)
```
Before planning: Load L0 + L1 to understand project landscape
During planning: Graph RAG from relevant entities to find constraints/decisions
After planning: Update wiki/hot.md with new plan context
```

### For Review Agents (code-reviewer, self-evaluator)
```
Before review: Load L0 to check for recent relevant decisions
If reviewing cross-cutting change: Graph RAG from affected entities
After review: File significant findings in wiki/questions/ or wiki/concepts/
```

### For Research Agents (deep-researcher, context-retriever)
```
Before research: Full L0+L1+L2 scan to avoid re-researching known topics
During research: Check wiki/sources/ for already-processed documents
After research: Ingest findings as new wiki pages, update index and hot cache
```

---

## Maintenance

### Hot Cache Update Rules
- Update after every ingest operation
- Update after significant query exchanges
- Update at session end IF meaningful work was done (>3 commits or >5 edits)
- NEVER update with sparser content than what's already there
- Keep under 500 words

### Wiki Lint (run periodically)
1. Find orphan pages (no incoming wikilinks)
2. Find broken wikilinks (link target doesn't exist)
3. Find stale pages (not updated in 30+ days)
4. Find missing frontmatter fields
5. Find pages with no outgoing links (isolation)
6. Report as scored health check

---

## Security

- Never include API keys, tokens, or secrets in wiki pages
- PII scan before any commit to vault repo
- Vault should be private if pushed to remote
- Session logs may contain sensitive context -- review before sharing
