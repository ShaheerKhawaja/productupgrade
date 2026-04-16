---
name: seo-audit
description: "Full technical + content + competitor SEO audit with scoring rubric"
---

# SEO Audit

Comprehensive SEO audit that examines technical health, on-page optimization, content quality, and competitive positioning. Produces a scored report with prioritized fix recommendations.

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `url` | site URL | required | Target site to audit |
| `depth` | `quick`, `standard`, `deep` | `standard` | Audit thoroughness |

### Depth Configuration

| Depth | Pages | Checks | Time |
|-------|-------|--------|------|
| `quick` | Homepage + 5 key pages | Technical only | 2-5 min |
| `standard` | Up to 50 pages | Technical + content + basic competitor | 10-20 min |
| `deep` | Full crawl | Technical + content + competitor + backlink + schema | 30-60 min |

## Phase 1: Technical Audit

Check these for every page:

| Check | Tool | Pass Criteria |
|-------|------|--------------|
| Page loads | curl/browser | HTTP 200, < 3s |
| Mobile responsive | Lighthouse | Score > 90 |
| Core Web Vitals | Lighthouse | LCP < 2.5s, CLS < 0.1, INP < 200ms |
| HTTPS | curl | Valid SSL, no mixed content |
| Canonical tags | HTML parse | Present and correct on every page |
| Robots.txt | curl | Exists, not blocking important pages |
| Sitemap.xml | curl | Exists, all URLs valid, recently updated |
| Structured data | Schema.org validation | Valid JSON-LD on key pages |
| Internal links | Crawl | No broken links, logical hierarchy |
| Image optimization | HTML parse | Alt text present, images compressed |
| Meta tags | HTML parse | Title (50-60 chars), description (150-160 chars) on every page |

## Phase 2: Content Audit (standard + deep)

For each key page:

| Dimension | What to Check |
|-----------|--------------|
| Keyword targeting | Primary keyword in title, H1, first paragraph, URL slug |
| Content depth | Word count competitive with SERP top 5 for target keyword |
| E-E-A-T signals | Author byline, expertise indicators, citations, freshness date |
| Internal linking | Links to/from related pages, anchor text relevant |
| Content gaps | Topics covered by competitors but missing here |
| Duplicate content | Check for near-duplicate pages cannibalizing each other |

## Phase 3: Competitor Analysis (standard + deep)

1. Identify top 3 SERP competitors for primary keywords (use profile.yml if available)
2. Compare: content depth, page count, backlink profile, keyword coverage
3. Find gaps: keywords competitors rank for that target site doesn't
4. Find advantages: keywords target site owns that competitors don't

## Phase 4: Score and Report

### Scoring Rubric

| Category | Weight | Score 1-10 | Criteria |
|----------|--------|-----------|----------|
| Technical health | 25% | | Page speed, mobile, SSL, structured data |
| On-page SEO | 25% | | Meta tags, headings, keyword targeting |
| Content quality | 25% | | Depth, E-E-A-T, freshness, uniqueness |
| Competitive position | 25% | | Keyword coverage vs competitors |

### Report Output

Write to `.productionos/domains/seo/reports/audit-{date}.md`:

```
# SEO Audit Report — {url}
Date: {date}
Score: {X}/10

## Technical ({X}/10)
| Issue | Severity | Page | Fix |
|-------|----------|------|-----|

## On-Page ({X}/10)
| Issue | Severity | Page | Fix |

## Content ({X}/10)
| Gap | Competitor Has | Priority |

## Competitive ({X}/10)
| Keyword | Our Position | Top Competitor | Gap |

## Priority Fixes
1. {highest impact fix with specific instructions}
2. ...
3. ...
```

## Phase 5: Update Memory

1. Append to `audit-history.jsonl`: {date, url, score, issues_count, top_issues}
2. Update `keyword-bank.jsonl` with any new keywords discovered
3. Extract learnings: compare to last audit — what improved? what regressed?
4. Append learnings to `learnings.jsonl`

## Error Handling

| Scenario | Action |
|----------|--------|
| Site unreachable | Report error, check DNS/SSL/hosting |
| Robots.txt blocks crawler | Report restriction, audit accessible pages only |
| No competitors in profile | Auto-discover from SERP results |
| All scores high | Flag as "healthy" with confidence. Suggest monitoring cadence |

## Guardrails

1. Never fabricate metrics. All scores backed by evidence.
2. Prioritize fixes by impact, not by category order.
3. Compare to previous audit (if in history) to show trend.
4. Specific fixes: "Add alt text to hero image on /about" not "improve images."
