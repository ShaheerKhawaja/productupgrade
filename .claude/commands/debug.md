---
name: debug
description: "Systematic debugging with hypothesis tracking — reproduce, hypothesize, test, narrow, fix. Never guess-and-check."
arguments:
  - name: bug
    description: "Description of the bug or error"
    required: true
  - name: max_hypotheses
    description: "Maximum hypotheses to test before escalating (default: 5)"
    required: false
    default: "5"
---

# /debug — Systematic Debugging

Reproduce. Hypothesize. Test. Narrow. Fix. Never guess-and-check.

## Step 0: Preamble
Run `templates/PREAMBLE.md`.

## Step 1: Reproduce
Make the bug happen consistently:
```bash
# Run the failing test/command
# Capture the exact error output
# Note: environment, branch, recent changes
```
If you cannot reproduce: STOP. You cannot fix what you cannot see.

## Step 2: Gather Evidence
```bash
# Recent changes that might have caused this
git log --oneline -10
# Files most recently modified
git diff --name-only HEAD~5
# Error logs
grep -r "Error\|Exception\|FAIL" logs/ 2>/dev/null | tail -20
```

## Step 3: Generate Hypotheses
Based on evidence, generate up to $ARGUMENTS.max_hypotheses hypotheses:

```markdown
| # | Hypothesis | Evidence For | Evidence Against | Test |
|---|-----------|-------------|-----------------|------|
| 1 | {cause} | {what supports this} | {what contradicts} | {how to verify} |
| 2 | ... | ... | ... | ... |
```

**Rules:**
- Rank by likelihood (most likely first)
- Each hypothesis must be testable
- Each test must be quick (< 2 min)

## Step 4: Test Hypotheses
For each hypothesis, starting with most likely:
1. Design a test that would confirm or eliminate it
2. Run the test
3. Record: CONFIRMED or ELIMINATED
4. If confirmed: proceed to fix
5. If eliminated: move to next hypothesis

## Step 5: Fix
Once root cause identified:
1. Make the MINIMUM change to fix the bug
2. Run the original reproduction to verify fix
3. Write a regression test
4. Check for similar bugs elsewhere (same pattern)

## Agent References
- Dispatch `self-healer` for automated fix attempt
- Dispatch `code-reviewer` to verify fix quality
- Dispatch `test-architect` to design regression test

## Self-Eval
Run `templates/SELF-EVAL-PROTOCOL.md`:
- Is the root cause identified with evidence? (not guessed)
- Does the fix address the root cause? (not a symptom)
- Is there a regression test?
- Were similar bugs checked?
