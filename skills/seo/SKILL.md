---
name: seo
description: "SEO composite — technical audit, content creation, keyword research, and rank monitoring with persistent domain memory. Replaces 9 fragmented SEO skills."
argument-hint: "[audit|create|research|monitor] [target URL or keyword]"
---

# seo

Domain-aware SEO pipeline with shared memory across sessions. Audits sites for technical and content SEO issues, creates optimized content, researches keywords with competitive analysis, and monitors ranking changes. Learns from past executions — run #10 benefits from everything learned in runs #1-9.

**Replaces:** seo-audit, seo-competitor-analysis, seo-content-writer, seo-ops, agentic-seo, ai-seo, on-page-seo-auditor, programmatic-seo, technical-seo-checker

## Actions

| Action | What | When to Use |
|--------|------|------------|
| `audit [url]` | Full technical + content + competitor SEO audit | Before optimization work. Monthly cadence. |
| `create [type] [keyword]` | Generate SEO-optimized content (article, meta, schema, alt text) | When publishing new content |
| `research [keyword]` | Keyword + competitor + SERP research with intent classification | Before content creation or strategy planning |
| `monitor` | Check rank changes, detect regressions, compare to history | Weekly or after major changes |

## Routing

1. Parse action from first argument. Default to `audit` if ambiguous.
2. Load domain memory from `~/.productionos/domains/seo/`
3. If no profile exists: run first-time setup (ask niche, competitors, target keywords)
4. Dispatch to `sub-skills/{action}.md`
5. After completion: score against `evaluation/rubric.yml`, update memory, log to history

## Domain Memory

Stored at `~/.productionos/domains/seo/`:

| File | What | Updated When |
|------|------|-------------|
| `profile.yml` | Niche, target audience, competitors, preferred tone, tech stack | First run + manual updates |
| `keyword-bank.jsonl` | Researched keywords with volume, difficulty, intent, position | After every `research` action |
| `audit-history.jsonl` | Past audit scores, issues found, issues fixed | After every `audit` action |
| `content-log.jsonl` | Published content with target keywords and performance | After every `create` action |
| `learnings.jsonl` | Patterns that improved rankings, content that performed | Extracted from audit deltas |

### Memory Loading
On invocation, load: profile + last 5 audit scores + top keywords + recent learnings. This gives the sub-skill domain context without overwhelming the context window.

### First-Time Setup
If no `profile.yml` exists, ask (one at a time):
1. "What's your site URL and niche?" (e.g., "entropyandco.com, AI video production")
2. "Who are your top 3 competitors?" (auto-suggest from SERP if possible)
3. "What keywords matter most?" (seed list, expanded via research)

## Evaluation

Every action scored against `evaluation/rubric.yml`. See `evaluation/rubric.yml` for dimensions. Score logged to `audit-history.jsonl` or `content-log.jsonl`.

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `action` | `audit`, `create`, `research`, `monitor` | `audit` | Which sub-skill to run |
| `target` | URL, keyword, or content type | required for audit/research | What to operate on |
| `depth` | `quick`, `standard`, `deep` | `standard` | How thorough |

## Error Handling

| Scenario | Action |
|----------|--------|
| No profile exists | Run first-time setup before proceeding |
| Target URL unreachable | Report error, suggest checking URL |
| No keyword data available | Fall back to competitor analysis to discover keywords |
| Audit finds 0 issues | Suspicious — re-run with deeper checks. Report "clean" with confidence level |
| Memory directory missing | Create it. Initialize with empty files |

## Guardrails

1. **Never fabricate metrics.** All numbers come from tools or declared as estimates.
2. **Cite sources.** Every recommendation links to the evidence (page URL, tool output, competitor example).
3. **Memory is append-only.** Never delete past audit results. History enables trend analysis.
4. **Profile is user-controlled.** Never change niche, competitors, or target keywords without asking.
5. **Evaluation is mandatory.** Every action gets scored. No silent completion.
