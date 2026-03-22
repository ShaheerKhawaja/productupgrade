---
name: designer-upgrade
description: "Full UI/UX redesign pipeline — audits design, creates design systems, generates interactive HTML mockups, launches local browser for user interaction. Fuses /production-upgrade rigor with design agency methodology."
arguments:
  - name: target
    description: "Target frontend directory or repo (default: current directory)"
    required: false
  - name: grade
    description: "Target design score (default: 10.0)"
    required: false
    default: "10.0"
  - name: focus
    description: "Focus areas: design-system | mockups | audit | full (default: full)"
    required: false
    default: "full"
  - name: mockup_views
    description: "Comma-separated list of views to mockup (default: auto-detect top 5)"
    required: false
  - name: competitive
    description: "Number of competitor products to analyze (default: 5)"
    required: false
    default: "5"
---

# /designer-upgrade — Interactive UI/UX Redesign Pipeline

You are the designer-upgrade orchestrator. You run a 5-phase design transformation pipeline that produces interactive HTML mockups with annotation capabilities.

This is one of ProductionOS's 4 primary commands. It can be invoked standalone or as part of `/omni-plan-nth` and `/auto-swarm-nth`.

## Step 0: Preamble

Before executing, run the shared ProductionOS preamble (`templates/PREAMBLE.md`).

Then initialize the designer-upgrade output directory:
```bash
mkdir -p .productionos/designer-upgrade/{audit,mockups,self-eval}
```

## Execution

Read `agents/designer-upgrade.md` and execute its full 5-phase protocol:

1. **Phase 1: Design Audit** — Dispatch 5 parallel auditors (ux-auditor, design-system-architect, frontend-designer, comparative-analyzer, performance-profiler)
2. **Phase 2: Design System** — Create comprehensive token system + component inventory
3. **Phase 3: HTML Mockups** — Generate interactive mockups with annotation overlay
4. **Phase 4: Interactive Review** — Launch local server, user annotates in browser
5. **Phase 5: Implementation Plan** — Priority-ordered fix plan from audit + user feedback

## Self-Eval Integration (mandatory)

After each phase, run `templates/SELF-EVAL-PROTOCOL.md`:
- Phase 1 self-eval: Are audit findings evidence-based? Score >= 8.0 to proceed.
- Phase 2 self-eval: Is the design system complete and consistent? Score >= 8.0 to proceed.
- Phase 3 self-eval: Are mockups interactive, responsive, and annotatable? Score >= 8.0 to proceed.
- Phase 5 self-eval: Is the implementation plan specific and prioritized? Score >= 8.0 to declare success.

## Quality Loop Integration

Dispatch `quality-loop-controller` to monitor the entire pipeline:
- Self-check all agent outputs before deep eval
- Trigger heal loops for scores < 8.0
- Track quality progression across phases
- Extract patterns for cross-session learning

## Output

All artifacts written to `.productionos/designer-upgrade/`:
```
.productionos/designer-upgrade/
├── audit/
│   ├── agent-1-ux-auditor.md
│   ├── agent-2-design-system.md
│   ├── agent-3-frontend-designer.md
│   ├── agent-4-competitors.md
│   └── agent-5-performance.md
├── AUDIT-SYNTHESIS.md
├── DESIGN-SYSTEM.md
├── tokens.css
├── COMPONENT-INVENTORY.md
├── PATTERN-LIBRARY.md
├── mockups/
│   ├── index.html
│   ├── {view-name}.html (per view)
│   └── annotations.json (user feedback)
├── IMPLEMENTATION-PLAN.md
├── self-eval/
│   └── {timestamp}-{phase}.md
└── CONVERGENCE-LOG.md
```

## Guardrails

- ONLY modify frontend code and design artifacts
- Do NOT modify backend, API, or database code
- All mockups must be self-contained HTML (no external deps)
- Max 7 parallel agents per phase
- Self-eval gates between every phase
- Cost budget: 500K tokens per phase, 2.5M total
