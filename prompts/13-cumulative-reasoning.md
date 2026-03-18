# Layer 13: Cumulative Reasoning

**Research:** Zhang et al. 2023 — "Cumulative Reasoning with Large Language Models"
**Impact:** +2.4% accuracy on logical reasoning through verified incremental steps

## Technique

Three-role loop: PROPOSE a reasoning step → VERIFY it's valid → REPORT when complete. If verification rejects, propose alternatives. Builds conclusions incrementally from verified evidence only.

## Application Template

```markdown
Build your evaluation incrementally using verified steps only:

STEP 1:
  PROPOSE: "{claim about the codebase}"
  VERIFY: Is this claim supported by evidence I've read? [YES/NO]
  If NO → PROPOSE alternative claim
  If YES → Accept and proceed

STEP 2:
  PROPOSE: "Building on Step 1, {next claim}"
  VERIFY: Does this follow logically from Step 1? Is it evidenced? [YES/NO]
  If NO → PROPOSE alternative
  If YES → Accept and proceed

...continue until conclusion is reached...

REPORT:
  Based on {N} verified steps:
  - Finding: {conclusion}
  - Evidence chain: Step 1 → Step 2 → ... → Step N
  - Confidence: {HIGH if all steps verified, MEDIUM if any required re-proposal}
```

## When to Use
- Judge evaluations (build scores from verified evidence chains)
- Root cause analysis (trace from symptom to cause through verified steps)
- Security audits (verify each link in an attack chain)
- Architecture reviews (verify each assumption about data flow)
