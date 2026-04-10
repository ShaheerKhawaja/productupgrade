---
name: growth-audit
description: "Composite: SEO -> content -> ads -> analytics audit for marketing and growth. Use when user mentions 'marketing', 'SEO', 'growth', 'ads', 'conversion', or 'traffic'."
argument-hint: "[website URL or project path]"
---

# growth-audit

Composite skill that chains 4 marketing audit stages through the 98 installed marketing skills. Routes intelligently based on what the target has (paid ads, content, tracking) and produces a unified growth report.

## Chain Overview

```
seo-audit -> content-strategy -> ads-audit -> analytics-tracking
    |              |                 |               |
    v              v                 v               v
  SEO.md      CONTENT.md       ADS.md (cond.)   ANALYTICS.md
                                    |
                            (skipped if no paid ads)
```

## Inputs

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `target` | URL or path | `.` | Website URL or local project path |
| `has_paid_ads` | `true`, `false` | auto-detect | Whether to run ads audit |

---

## Step 1: SEO Audit

**Invokes:** `/seo-audit`, `/keyword-research`, `/technical-seo-checker`

**What it does:**
- Technical SEO: meta tags, structured data, robots.txt, sitemap, canonical URLs, mobile-friendliness
- On-page SEO: title tags, headings hierarchy, alt text, internal linking structure
- Keyword analysis: current rankings, gap analysis, opportunity scoring
- Core Web Vitals: LCP, FID, CLS measurements if URL provided

**Sub-skills activated:**
- `seo-audit` -- primary audit engine
- `keyword-research` -- opportunity identification
- `technical-seo-checker` -- crawlability and indexing
- `on-page-seo-auditor` -- content optimization signals
- `schema-markup-generator` -- structured data validation

**Produces:** `.productionos/GROWTH-SEO.md`

**Gate to Step 2:** Proceeds unconditionally. SEO findings inform content strategy.

---

## Step 2: Content Strategy

**Invokes:** `/content-strategy`, `/content-gap-analysis`

**What it does:**
- Audits existing content: quality scores, freshness, topical coverage
- Identifies content gaps based on keyword research from Step 1
- Competitor content analysis: what they rank for that you do not
- Content calendar recommendations with effort/impact matrix

**Sub-skills activated:**
- `content-strategy` -- strategic content planning
- `content-gap-analysis` -- coverage gap identification
- `content-quality-auditor` -- existing content scoring
- `seo-content-writer` -- content brief generation for gaps

**Produces:** `.productionos/GROWTH-CONTENT.md`

**Gate to Step 3:** Check if paid ads exist. Auto-detect by searching for:
- Google Ads / GTM tags in HTML
- Meta Pixel / Facebook SDK
- Ad platform API keys in env
- Ad spend references in code

If no paid ads detected, skip Step 3 and proceed to Step 4.

---

## Step 3: Ads Audit (Conditional)

**Condition:** `has_paid_ads = true` (explicit or auto-detected)

**Invokes:** `/ads-audit`, platform-specific skills

**What it does:**
- Cross-platform ad account health: structure, naming, targeting
- Landing page alignment: ad copy vs landing page message match
- Budget efficiency: CPA, ROAS, wasted spend identification
- Creative analysis: ad fatigue, format optimization

**Sub-skills activated (per detected platform):**
- `ads-google` -- Google Ads account audit
- `ads-meta` -- Meta/Facebook ads audit
- `ads-tiktok` -- TikTok ads audit
- `ads-linkedin` -- LinkedIn ads audit
- `ads-audit` -- cross-platform summary
- `ads-budget` -- budget allocation analysis
- `ads-creative` -- creative performance audit

**Produces:** `.productionos/GROWTH-ADS.md`

---

## Step 4: Analytics Tracking

**Invokes:** `/analytics-tracking`

**What it does:**
- Tracking implementation audit: GA4, GTM, Meta Pixel, conversion events
- Data layer validation: required events firing correctly
- Attribution model assessment: cross-channel attribution gaps
- Funnel analysis: drop-off identification at each conversion stage

**Sub-skills activated:**
- `analytics-tracking` -- implementation audit
- `conversion-ops` -- conversion funnel analysis
- `rank-tracker` -- ranking monitoring setup

**Produces:** `.productionos/GROWTH-ANALYTICS.md`

---

## Output Format

Final composite report written to `.productionos/GROWTH-AUDIT.md`:

```markdown
# Growth Audit Report

## Executive Summary
- **SEO Score:** X/10
- **Content Coverage:** X% of target keywords
- **Ads Efficiency:** X ROAS (or "N/A -- no paid ads")
- **Analytics Health:** X/10
- **Overall Growth Score:** X/10

## Quick Wins (implement this week)
1. {highest impact, lowest effort action}
2. ...

## SEO Findings
{top issues from GROWTH-SEO.md}

## Content Gaps
{top opportunities from GROWTH-CONTENT.md}

## Ads Optimization (if applicable)
{top recommendations from GROWTH-ADS.md}

## Analytics Gaps
{missing tracking from GROWTH-ANALYTICS.md}

## 90-Day Growth Roadmap
| Week | Action | Expected Impact | Effort |
|------|--------|----------------|--------|

Audit completed: {timestamp} | Score: {X}/10
```

---

## When to Use

- "Run a marketing audit" -- full 4-step pipeline
- "How's our SEO?" -- full pipeline (SEO step will dominate)
- "Audit our ad spend" -- full pipeline with ads emphasis
- "What content should we create?" -- full pipeline, content step dominates

## When NOT to Use

- Writing specific ad copy -- use `/ads-creative` directly
- Building a single landing page -- use `/ads-landing` directly
- Technical code audit -- use `/audit-and-fix` instead
