---
name: ux-replicator
description: >
  A Claude Code skill that uses Playwright browser automation to visit any website,
  simulate real user journeys, capture full-page and element-level screenshots, then
  analyze and replicate best UX practices into new code. Supports multiple AI vision
  models (Claude, OpenAI GPT-4o, Gemini) for screenshot analysis, and can work fully
  locally or delegate heavy analysis to OpenClaw. Use this skill whenever the user wants
  to: clone or replicate a website's UX/UI, analyze a live site's design patterns,
  capture screenshots of web pages for design reference, build a new frontend inspired
  by an existing site, compare UX patterns across multiple sites, generate a component
  library from screenshots, simulate user flows and record interactions, or reverse-engineer
  any visual design from a URL. Also trigger when users mention "screenshot a site",
  "browse and capture", "replicate this design", "clone this UX", "Playwright screenshots",
  "browser automation for design", or "visual audit". Even if they just paste a URL and say
  "make something like this" — use this skill.
---

# UX Replicator

> Browse any site. Capture what matters. Rebuild it better.

## Overview

This skill turns Claude Code into a **UX research and replication engine**. It connects
Playwright browser automation with multi-model AI vision analysis to let you:

1. **Browse** — Navigate to any URL, simulate real user interactions (click, scroll, hover, type)
2. **Capture** — Take full-page screenshots, element-level crops, and interaction recordings
3. **Analyze** — Feed screenshots to vision models that extract UX patterns, spacing, colors, typography, layout grids, and interaction patterns
4. **Replicate** — Generate production-ready code (React/Next.js/HTML) that faithfully reproduces the best UX practices found

## Quick Start

When a user gives you a URL and wants to replicate or analyze it:

```
1. Run: node scripts/browse.mjs <url> --full-page --viewport 1440x900
2. Run: node scripts/analyze.mjs ./captures/<site>/ --model claude
3. Run: node scripts/generate.mjs ./analysis/<site>.json --framework react
```

## Architecture

```
User provides URL(s)
        │
        ▼
┌─────────────────────┐
│   BROWSE PHASE      │  Playwright headless browser
│   browse.mjs        │  - Navigate to URL
│                     │  - Simulate user flows (scroll, click, hover)
│                     │  - Capture screenshots + DOM snapshots
│                     │  - Record network requests (fonts, assets)
└────────┬────────────┘
         │ ./captures/<site>/
         ▼
┌─────────────────────┐
│   ANALYZE PHASE     │  Multi-model vision analysis
│   analyze.mjs       │  - Claude Sonnet/Opus (default)
│                     │  - OpenAI GPT-4o (optional)
│                     │  - Gemini Pro Vision (optional)
│                     │  - OpenClaw (optional, remote)
│                     │  - Extracts: layout, colors, typography,
│                     │    spacing, components, interactions
└────────┬────────────┘
         │ ./analysis/<site>.json
         ▼
┌─────────────────────┐
│   GENERATE PHASE    │  Code generation
│   generate.mjs      │  - React / Next.js / HTML+CSS
│                     │  - Tailwind / CSS Modules / Styled Components
│                     │  - Component decomposition
│                     │  - Responsive breakpoints
│                     │  - Accessibility (a11y) built-in
└────────┬────────────┘
         │ ./output/<site>/
         ▼
    Production-ready code
```

## Phase 1: Browse & Capture

### Setup

The browse script requires Playwright. Install on first use:

```bash
npm init -y
npm install playwright
npx playwright install chromium
```

### Basic Usage

```bash
# Full-page screenshot at desktop viewport
node scripts/browse.mjs https://example.com --full-page

# Multiple viewports (responsive audit)
node scripts/browse.mjs https://example.com --viewports 375x812,768x1024,1440x900

# Simulate a user flow
node scripts/browse.mjs https://example.com --flow scripts/flows/signup-flow.json

# Capture specific elements
node scripts/browse.mjs https://example.com --selectors "nav,.hero,footer,.pricing"

# Full interaction recording (scroll, hover states, animations)
node scripts/browse.mjs https://example.com --record --scroll --hover-targets "button,a,.card"
```

### User Flow Files

Define multi-step user journeys as JSON:

```json
{
  "name": "signup-flow",
  "steps": [
    { "action": "goto", "url": "https://example.com" },
    { "action": "screenshot", "name": "landing" },
    { "action": "click", "selector": ".cta-button" },
    { "action": "wait", "ms": 1000 },
    { "action": "screenshot", "name": "signup-modal" },
    { "action": "type", "selector": "#email", "text": "test@example.com" },
    { "action": "click", "selector": "button[type=submit]" },
    { "action": "wait", "selector": ".success-message" },
    { "action": "screenshot", "name": "success" }
  ]
}
```

### Capture Output Structure

```
captures/
└── example-com/
    ├── meta.json              # Site metadata, fonts, colors from CSS
    ├── full-page-1440x900.png
    ├── full-page-768x1024.png
    ├── full-page-375x812.png
    ├── elements/
    │   ├── nav.png
    │   ├── hero.png
    │   ├── pricing.png
    │   └── footer.png
    ├── interactions/
    │   ├── hover-cta.png
    │   ├── scroll-50.png
    │   └── scroll-100.png
    └── dom-snapshot.json       # Serialized DOM for structure analysis
```

## Phase 2: Analyze

### Model Selection

The analysis phase supports multiple vision models. Choose based on your needs:

| Model | Flag | Best For | Requires |
|-------|------|----------|----------|
| Claude Sonnet | `--model claude` (default) | Overall UX analysis, component identification | `ANTHROPIC_API_KEY` |
| Claude Opus | `--model claude-opus` | Deep design system extraction | `ANTHROPIC_API_KEY` |
| GPT-4o | `--model gpt4o` | Color/typography precision | `OPENAI_API_KEY` |
| Gemini Pro | `--model gemini` | Layout grid detection | `GOOGLE_API_KEY` |
| OpenClaw | `--model openclaw` | Distributed heavy analysis | `OPENCLAW_ENDPOINT` |
| All | `--model all` | Consensus across models | All keys |
| Local (LLaVA) | `--model local` | Offline / air-gapped use | Ollama running locally |

### Multi-Model Consensus

When `--model all` is used, the analyzer runs all available models and produces a
**consensus report** that merges findings, flags disagreements, and picks the highest-confidence
extraction for each design attribute. This is the gold standard for accuracy.

### Analysis Output

The analysis produces a structured JSON design spec:

```json
{
  "site": "example.com",
  "analyzed_at": "2026-03-15T12:00:00Z",
  "models_used": ["claude-sonnet", "gpt4o"],
  "design_system": {
    "colors": {
      "primary": "#2563EB",
      "secondary": "#7C3AED",
      "background": "#FFFFFF",
      "surface": "#F8FAFC",
      "text_primary": "#0F172A",
      "text_secondary": "#64748B"
    },
    "typography": {
      "font_families": ["Inter", "system-ui"],
      "scale": { "h1": "48px/56px 700", "h2": "36px/44px 600", "body": "16px/24px 400" }
    },
    "spacing": { "unit": 8, "scale": [4, 8, 12, 16, 24, 32, 48, 64, 96] },
    "border_radius": { "sm": "6px", "md": "8px", "lg": "12px", "full": "9999px" },
    "shadows": ["0 1px 3px rgba(0,0,0,0.1)", "0 4px 6px rgba(0,0,0,0.07)"]
  },
  "layout": {
    "type": "single-column-centered",
    "max_width": "1280px",
    "grid": "12-column",
    "breakpoints": { "sm": "640px", "md": "768px", "lg": "1024px", "xl": "1280px" }
  },
  "components": [
    {
      "name": "HeroSection",
      "description": "Full-width hero with headline, subtext, and dual CTA buttons",
      "screenshot_ref": "elements/hero.png",
      "patterns": ["gradient-background", "centered-text", "dual-cta"],
      "accessibility": { "contrast_ratio": 7.2, "passes_wcag_aa": true }
    }
  ],
  "interactions": {
    "animations": ["fade-in-up on scroll", "hover-scale on cards"],
    "transitions": "200ms ease-in-out"
  },
  "ux_patterns": [
    "sticky-nav-with-blur",
    "progressive-disclosure-pricing",
    "social-proof-carousel",
    "floating-cta-on-mobile"
  ]
}
```

## Phase 3: Generate

### Code Generation

```bash
# Generate React + Tailwind (default)
node scripts/generate.mjs ./analysis/example-com.json

# Generate Next.js App Router
node scripts/generate.mjs ./analysis/example-com.json --framework nextjs

# Generate plain HTML + CSS
node scripts/generate.mjs ./analysis/example-com.json --framework html

# Generate with specific component library
node scripts/generate.mjs ./analysis/example-com.json --ui shadcn

# Generate only specific components
node scripts/generate.mjs ./analysis/example-com.json --components "Hero,Navbar,Pricing"
```

### Output Structure

```
output/
└── example-com/
    ├── package.json
    ├── tailwind.config.js
    ├── src/
    │   ├── styles/
    │   │   └── design-tokens.css    # CSS custom properties from analysis
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── Hero.jsx
    │   │   ├── Features.jsx
    │   │   ├── Pricing.jsx
    │   │   └── Footer.jsx
    │   └── App.jsx
    └── public/
        └── assets/                  # Placeholder images
```

## Configuration

### Environment Variables

```bash
# Required (at least one)
export ANTHROPIC_API_KEY="sk-ant-..."

# Optional — enable additional models
export OPENAI_API_KEY="sk-..."
export GOOGLE_API_KEY="AIza..."

# Optional — OpenClaw remote analysis
export OPENCLAW_ENDPOINT="https://your-openclaw-instance.com"
export OPENCLAW_API_KEY="..."

# Optional — local model via Ollama
export OLLAMA_HOST="http://localhost:11434"
```

### Config File (ux-replicator.config.json)

```json
{
  "defaults": {
    "viewport": "1440x900",
    "framework": "react",
    "styling": "tailwind",
    "model": "claude",
    "screenshotFormat": "png",
    "quality": 90
  },
  "playwright": {
    "headless": true,
    "timeout": 30000,
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)..."
  },
  "analysis": {
    "extractColors": true,
    "extractTypography": true,
    "extractSpacing": true,
    "extractAnimations": true,
    "accessibilityAudit": true
  },
  "generation": {
    "typescript": false,
    "cssModules": false,
    "includeTests": false,
    "includeStorybook": false
  }
}
```

## Workflow Recipes

### Recipe 1: "Clone this landing page"
```bash
node scripts/browse.mjs https://stripe.com --full-page --selectors "nav,.hero,.features,.pricing,footer"
node scripts/analyze.mjs ./captures/stripe-com/ --model claude
node scripts/generate.mjs ./analysis/stripe-com.json --framework react --ui shadcn
```

### Recipe 2: "Audit UX across competitors"
```bash
# Capture all competitors
for url in "https://site-a.com" "https://site-b.com" "https://site-c.com"; do
  node scripts/browse.mjs "$url" --full-page --viewports 1440x900,375x812
done
# Compare
node scripts/analyze.mjs ./captures/ --model all --compare
```

### Recipe 3: "Replicate this user flow"
```bash
node scripts/browse.mjs https://app.example.com --flow flows/onboarding.json
node scripts/analyze.mjs ./captures/app-example-com/ --model claude --focus interactions
node scripts/generate.mjs ./analysis/app-example-com.json --components "OnboardingWizard"
```

### Recipe 4: "Use OpenClaw for heavy lifting"
```bash
node scripts/browse.mjs https://complex-app.com --full-page --record
node scripts/analyze.mjs ./captures/complex-app-com/ --model openclaw --parallel
node scripts/generate.mjs ./analysis/complex-app-com.json --framework nextjs
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Playwright not installed | `npx playwright install chromium` |
| Screenshots blank/white | Add `--wait 3000` to let JS render |
| Auth-walled pages | Use `--cookies cookies.json` or `--auth user:pass` |
| Rate-limited by model API | Use `--delay 2000` between analysis calls |
| Large pages OOM | Use `--viewport 1440x900 --no-full-page` and capture sections |
| OpenClaw connection failed | Check `OPENCLAW_ENDPOINT` and network access |

## Reference Files

- [📜 scripts/browse.mjs](./scripts/browse.mjs) — Playwright browser automation & capture
- [📜 scripts/analyze.mjs](./scripts/analyze.mjs) — Multi-model vision analysis engine
- [📜 scripts/generate.mjs](./scripts/generate.mjs) — Code generation from design specs
- [📖 references/ux-patterns.md](./references/ux-patterns.md) — Catalog of 50+ UX patterns the analyzer recognizes
- [📖 references/model-prompts.md](./references/model-prompts.md) — Vision model prompt templates for each analysis type
