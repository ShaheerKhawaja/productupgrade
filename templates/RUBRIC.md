# ProductionOS Evaluation Rubric

**Project:** {{PROJECT_NAME}}
**Date:** {{DATE}}
**Phase:** {{BEFORE|AFTER}}

## Scores (1-10)

| Dimension | Score | Evidence | Notes |
|-----------|-------|----------|-------|
| **Code Quality** | /10 | | |
| **Security** | /10 | | |
| **Performance** | /10 | | |
| **UX/UI** | /10 | | |
| **Test Coverage** | /10 | | |
| **Accessibility** | /10 | | |
| **Documentation** | /10 | | |
| **Error Handling** | /10 | | |
| **Observability** | /10 | | |
| **Deployment Safety** | /10 | | |

## Overall Grade: /10

## Scoring Guide

### Code Quality
- 1-2: Frequent bugs, no patterns, copy-paste code
- 3-4: Works but messy, inconsistent patterns
- 5-6: Clean, follows patterns, some rough edges
- 7-8: Elegant, well-structured, minimal tech debt
- 9-10: Exemplary — would show to new hires as reference

### Security
- 1-2: Known CVEs, hardcoded secrets, no auth
- 3-4: Basic auth, some input validation gaps
- 5-6: OWASP top 10 addressed, secrets in env vars
- 7-8: Penetration-test ready, audit logging, CSP
- 9-10: Hardened — rate limiting, WAF, SOC 2 compliant

### Performance
- 1-2: > 5s page load, N+1 queries, no caching
- 3-4: Functional but slow, obvious bottlenecks
- 5-6: Fast happy path, some edge case perf issues
- 7-8: Optimized — lazy loading, caching, CDN, indexes
- 9-10: Edge-optimized — p99 < 200ms, preloading, streaming

### UX/UI
- 1-2: Confusing navigation, broken interactions, ugly
- 3-4: Functional but generic, default styling
- 5-6: Good layout, consistent design, clear flows
- 7-8: Polished — animations, loading states, empty states
- 9-10: Delightful — users say "oh nice, they thought of that"

### Test Coverage
- 1-2: 0% — no tests at all
- 3-4: < 30% — some happy path unit tests
- 5-6: 50-70% — unit + integration tests
- 7-8: 70-90% — unit + integration + E2E, edge cases
- 9-10: 95%+ — mutation testing, property-based, chaos

### Accessibility
- 1-2: No ARIA, no alt text, no keyboard nav
- 3-4: Some ARIA labels, partial keyboard support
- 5-6: WCAG 2.1 AA compliant, screen reader tested
- 7-8: AAA compliant, comprehensive a11y testing
- 9-10: AAA + professional audit + remediation plan

### Documentation
- 1-2: No README, no comments, no docs
- 3-4: Basic README, some inline comments
- 5-6: README + API docs + architecture overview
- 7-8: Full docs — setup, API, architecture, decisions
- 9-10: Interactive docs, tutorials, onboarding guide

### Error Handling
- 1-2: Crashes on errors, unhandled promises
- 3-4: Basic try/catch, generic error messages
- 5-6: Named exceptions, user-friendly error messages
- 7-8: Recovery actions, retry logic, graceful degradation
- 9-10: Self-healing — automatic retry, fallback, alerting

### Observability
- 1-2: No logging, no metrics, "it works on my machine"
- 3-4: Console.log sprinkled around
- 5-6: Structured logging, basic error tracking
- 7-8: Metrics + traces + alerting + dashboards
- 9-10: Full observability — Grafana/Datadog, runbooks, SLOs

### Deployment Safety
- 1-2: Manual deploy, no rollback, push to main and pray
- 3-4: CI pipeline, but no staging
- 5-6: CI/CD with staging, basic health checks
- 7-8: Canary deploys, feature flags, automated rollback
- 9-10: Blue-green with traffic shifting, chaos engineering
