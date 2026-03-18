# Layer 14: Self-Debugging Prompting

**Research:** Chen et al. 2023 — "Teaching Large Language Models to Self-Debug"
**Impact:** +15.9% pass@1 on code generation through execute-observe-fix loops

## Technique

After writing or modifying code, immediately execute it, observe errors, and fix iteratively. The debugging loop is: GENERATE → EXECUTE → OBSERVE → EXPLAIN → FIX → repeat.

## Application Template

```markdown
After making any code change:

1. GENERATE: Apply the fix to the code

2. EXECUTE: Run the relevant validation
   ```bash
   # TypeScript
   npx tsc --noEmit 2>&1 | head -20
   # Python
   uvx ruff check {file} 2>&1
   # Tests
   pytest {test_file} -x 2>&1 | tail -20
   ```

3. OBSERVE: Read the output carefully
   - Any compilation errors?
   - Any lint violations?
   - Any test failures?

4. EXPLAIN: Before fixing, explain WHY the error occurred
   "This error happened because {explanation}"

   This step is critical — explaining the error before fixing it
   increases fix success rate by 15.9% (Chen et al. 2023).

5. FIX: Apply the minimal targeted fix

6. REPEAT: Go back to step 2 until all checks pass

IMPORTANT:
- Maximum 3 debug cycles per fix (prevent infinite loops)
- If still failing after 3 cycles, flag for human review
- Never suppress errors (no @ts-ignore, no # type: ignore)
- Never change test expectations to match broken code
```

## When to Use
- Execution agents (self-healer, refactoring-agent)
- Any agent that modifies code
- Post-batch validation in the execution phase
- Self-healing gate after every commit
