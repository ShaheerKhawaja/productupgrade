# Layer 10: Contrastive Chain of Thought

**Research:** Chia et al. 2023 — "Contrastive Chain-of-Thought Prompting"
**Impact:** Reduces common error patterns by showing both correct AND incorrect reasoning

## Technique

Provide both a correct example and an incorrect example for each evaluation. The model learns not just WHAT to do, but WHAT TO AVOID.

## Application Template

```markdown
When evaluating {dimension}:

CORRECT EXAMPLE:
```
// GOOD: Input validation before database query
const userId = parseInt(req.params.id);
if (isNaN(userId) || userId <= 0) {
  return res.status(400).json({ error: 'Invalid user ID' });
}
const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
```
REASONING: Validates input type and range, uses parameterized query, returns descriptive error.

INCORRECT EXAMPLE:
```
// BAD: Direct string interpolation, no validation
const user = await db.query(`SELECT * FROM users WHERE id = ${req.params.id}`);
```
REASONING: SQL injection vulnerability, no input validation, crashes on non-numeric input.

Now analyze the actual code with BOTH patterns in mind:
- Does it follow the CORRECT pattern? If not, which aspects of the INCORRECT pattern are present?
- Score based on proximity to the CORRECT example.
```

## When to Use
- Security reviews (show secure vs. insecure patterns)
- Code quality audits (show clean vs. messy patterns)
- Error handling reviews (show robust vs. fragile patterns)
- Any dimension where common mistakes have well-known patterns
