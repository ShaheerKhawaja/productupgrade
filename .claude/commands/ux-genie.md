---
name: ux-genie
description: "UX improvement pipeline — creates user stories from UI guidelines, maps user journeys, identifies friction, dispatches fix agents. The user-experience equivalent of /production-upgrade."
arguments:
  - name: target
    description: "Target directory or repo (default: current directory)"
    required: false
  - name: personas
    description: "Number of user personas to derive (default: auto, min 3)"
    required: false
    default: "auto"
  - name: focus
    description: "Focus areas: stories | journeys | friction | full (default: full)"
    required: false
    default: "full"
  - name: fix
    description: "Auto-fix friction points: on | off (default: off — analyze only)"
    required: false
    default: "off"
  - name: grade
    description: "Target UX score (default: 10.0)"
    required: false
    default: "10.0"
---

# /ux-genie — User Story & Journey Improvement Pipeline

You are the UX Genie orchestrator. You create user stories, map journeys, identify friction, and optionally dispatch agents to fix UX problems.

This is one of ProductionOS's 4 primary commands. It can be invoked standalone or as part of `/omni-plan-nth` and `/auto-swarm-nth`.

## Step 0: Preamble

Before executing, run the shared ProductionOS preamble (`templates/PREAMBLE.md`).

Then initialize the ux-genie output directory:
```bash
mkdir -p .productionos/ux-genie/self-eval
```

## Execution

Read `agents/ux-genie.md` and execute its full 6-phase protocol:

1. **Phase 1: Guidelines Intake** — Read existing design docs, derive personas from RBAC/routes
2. **Phase 2: User Stories** — Generate 20+ stories across 10 dimensions with testable acceptance criteria
3. **Phase 3: Journey Maps** — Map each persona's journey with emotional state tracking
4. **Phase 4: Friction Analysis** — Identify and categorize friction across 8 types
5. **Phase 5: Agent Dispatch** — (if fix=on) Deploy fix agents in priority waves
6. **Phase 6: Verification** — Validate fixes against story acceptance criteria

## Self-Eval Integration (mandatory)

After each phase, run `templates/SELF-EVAL-PROTOCOL.md`:
- Phase 1 self-eval: Are personas evidence-based? Score >= 8.0 to proceed.
- Phase 2 self-eval: Are stories testable and complete? Minimum 20 stories. Score >= 8.0.
- Phase 3 self-eval: Do journey maps trace to actual code? Score >= 8.0.
- Phase 4 self-eval: Is friction analysis specific with file:line references? Score >= 8.0.
- Phase 5 self-eval: Do fixes address the actual friction points? Score >= 8.0.
- Phase 6 self-eval: Do fixes pass story acceptance criteria? Score >= 8.0.

## Designer-Upgrade Integration

If `.productionos/designer-upgrade/DESIGN-SYSTEM.md` exists:
- Use it as the primary design reference
- Stories should reference design system tokens
- Journey maps should reference mockup views
- Friction analysis should cross-reference audit findings

If not found, run Phase 1 of designer-upgrade inline to create minimal design context.

## Output

All artifacts written to `.productionos/ux-genie/`:
```
.productionos/ux-genie/
├── PERSONAS.md
├── USER-STORIES.md
├── STORY-MAP.md
├── JOURNEY-MAPS.md
├── FRICTION-REPORT.md
├── UX-IMPROVEMENT-PLAN.md
├── VERIFICATION-REPORT.md
├── self-eval/
│   └── {timestamp}-{phase}.md
└── CONVERGENCE-LOG.md
```

## Guardrails

- Stories must be user-centered ("As a user" not "The system shall")
- Every story must have testable acceptance criteria
- Journey maps must trace to actual code paths
- Friction points must have file:line evidence
- Fix agents operate within scope boundaries (max 15 files/batch)
- Self-eval gates between every phase
- Cost budget: 300K tokens per phase, 1.8M total
