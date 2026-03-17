# ProductUpgrade

AI-powered product upgrade pipeline that orchestrates up to 54 concurrent review agents to systematically audit, improve, and validate any product codebase.

## Installation

Add to any project's `.claude/settings.json`:
```json
{
  "plugins": ["~/productupgrade"]
}
```

Or copy the skill to your global skills:
```bash
cp -r .claude/skills/productupgrade ~/.claude/skills/
cp -r .claude/commands/productupgrade.md ~/.claude/commands/
```

## Usage

```
/productupgrade              # Full pipeline
/productupgrade audit        # Audit only (no code changes)
/productupgrade ux           # UX/UI focused with competitor scraping
/productupgrade fix          # Fix findings from previous audit
/productupgrade validate     # Validate recent changes
```

## Architecture

5-phase pipeline: Discovery → Strategic Review → Planning → Execution → Validation

- **Phase 1** (7 agents): Codebase scan, dependency audit, competitor scrape, type safety, API contracts, performance, security
- **Phase 2** (7 agents): CEO review (3 modes), engineering review (2 passes), design review (2 passes)
- **Phase 3** (7 agents): Plan writing, test specs, migration planning, UX design, backend patterns, frontend design, priority ranking
- **Phase 4** (7 batches × 7 agents): Execute fixes in parallel with validation gates
- **Phase 5** (5 agents): Code review, QA, regression, performance comparison, final grade

## Tools

- `scripts/scrape-competitor.sh` — Playwright-based competitor UX scraper
- `scripts/pull-source.sh` — Clone and analyze any repo
- `scripts/gui-audit.sh` — Screenshot all routes + Lighthouse + a11y check
- `templates/RUBRIC.md` — 10-dimension evaluation rubric template

## Dependencies

- Playwright (for screenshots and GUI audit)
- Lighthouse (for performance/a11y scoring)
- Firecrawl MCP (for web scraping)
- gstack skills (for QA testing)

## Integrated Skills

Orchestrates: `/plan-ceo-review`, `/plan-eng-review`, `/superpowers:write-plan`, `/code-review`, `/frontend-design`, `/backend-patterns`, `/gstack qa`, `/browse`, `/ux-browse`, `/ux-analyze`
