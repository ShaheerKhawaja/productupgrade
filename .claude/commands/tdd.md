---
name: tdd
description: "Test-driven development — write tests first, then implement minimal code to pass. Enforces red-green-refactor cycle with coverage targets."
arguments:
  - name: target
    description: "Feature or file to TDD"
    required: false
  - name: coverage
    description: "Coverage target percentage (default: 80)"
    required: false
    default: "80"
---

# /tdd — Test-Driven Development

Write tests first. Implement second. Refactor third. Never skip a step.

## Step 0: Preamble
Run `templates/PREAMBLE.md`. Detect test framework (jest, vitest, pytest, bun test).

## The Cycle

### Red: Write Failing Tests
1. Understand the requirement
2. Write the test that verifies the requirement
3. Run the test — it MUST fail (if it passes, the test is wrong or the feature already exists)

```bash
# Run and expect failure
bun test --filter "{test_name}" 2>&1 || true
```

### Green: Implement Minimum Code
1. Write the MINIMUM code to make the test pass
2. No extra features, no optimization, no cleanup
3. Run the test — it MUST pass

```bash
# Run and expect success
bun test --filter "{test_name}" 2>&1
```

### Refactor: Clean Up
1. Improve the code without changing behavior
2. Run ALL tests after refactoring — nothing should break
3. Remove duplication, improve naming, simplify

## Coverage Check
```bash
# Check coverage meets target
bun test --coverage 2>&1 | tail -10
```

If coverage < $ARGUMENTS.coverage: write more tests for uncovered paths.

## Agent References
- Dispatch `test-architect` for test design
- Dispatch `self-healer` if tests fail after refactor

## Self-Eval
Run `templates/SELF-EVAL-PROTOCOL.md`:
- Did I write tests BEFORE code? (not after)
- Do tests cover edge cases? (empty, null, boundary)
- Is the implementation minimal? (no gold-plating)
- Does coverage meet target?
