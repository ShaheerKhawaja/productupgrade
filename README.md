# ProductUpgrade

AI-powered product upgrade pipeline for Claude Code. Orchestrates up to **54 concurrent review agents** in batches of 7 to systematically audit, improve, and validate any product codebase.

## What It Does

1. **Scans** your codebase for architecture, tech debt, security, and performance issues
2. **Scrapes** competitor sites to identify UX/UI improvement opportunities
3. **Reviews** with CEO strategic lens + engineering deep-dive + design audit
4. **Plans** prioritized fixes with TDD specs and migration strategies
5. **Fixes** issues in parallel batches with validation gates
6. **Validates** all changes with code review, QA testing, and before/after grading

## Quick Start

```bash
# Install as Claude Code plugin
echo '{"plugins": ["~/productupgrade"]}' >> .claude/settings.json

# Run full pipeline
/productupgrade

# Run audit only (no changes)
/productupgrade audit

# UX focused with competitor analysis
/productupgrade ux
```

## Pipeline Architecture

```
Phase 1: DISCOVERY ────── 7 parallel agents ──── Scan, audit, scrape
Phase 2: REVIEW ────────── 7 parallel agents ──── CEO + Eng + Design
Phase 3: PLANNING ──────── 7 parallel agents ──── Plan + prioritize
Phase 4: EXECUTION ─────── 7 × 7 = 49 agents ─── Fix in batches
Phase 5: VALIDATION ────── 5 parallel agents ──── Test + grade
                           ─────────────────
                           54 agent slots total
```

## License

MIT
