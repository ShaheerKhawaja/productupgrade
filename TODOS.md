# TODOS

Organized by priority. P0 = critical, P4 = nice-to-have.

## V4.1 — Gaps from Research

### P0 — Critical gaps

#### Discuss-Phase agent (pre-pipeline decision capture)
**What:** Add a `discuss-phase` agent that captures locked user decisions BEFORE the review pipeline runs. Without this, 25 agents can optimize in a direction the user never wanted.
**Source:** GSD `/gsd:discuss-phase`
**Effort:** M

#### Stub Detector agent (wired vs placeholder)
**What:** Add an agent that distinguishes "file exists" from "feature works" by checking for placeholder patterns (React `<div>Placeholder</div>`, API stubs `return { message: "Not implemented" }`).
**Source:** GSD `gsd-verifier` stub detection
**Effort:** M

#### Plan Checker agent (verify plans before execution)
**What:** Add an agent that reads every plan BEFORE execution and verifies it will achieve the goal, has no circular dependencies, fits context budget, and honors user decisions.
**Source:** GSD `gsd-plan-checker`
**Effort:** S

### P1 — High priority

#### Scratchpad / Inner Monologue
**What:** Add `<scratchpad>` tags to all agent templates in ultra mode so agents reason privately before producing findings.
**Source:** Devin, Cursor, Gemini CLI system prompts
**Effort:** S

#### Generated Knowledge Prompting (Layer 16)
**What:** Before evaluating code, agents generate 3-5 established best practices for the domain, then evaluate against those generated standards.
**Source:** Liu et al. 2022
**Effort:** S

#### Distractor-Augmented Prompting (Layer 17)
**What:** Inject plausible wrong answers to force reasoning against alternatives. +460% accuracy improvement.
**Source:** Chhikara 2025 (arXiv 2502.11028)
**Effort:** S

#### ES-CoT for /productupgrade cost mode
**What:** Detect answer convergence during reasoning and stop early. ~41% token reduction.
**Source:** arXiv 2509.14004
**Effort:** M

#### DOWN (confidence-gated debate)
**What:** Only trigger multi-agent debate in the tribunal when initial confidence < threshold. 6x efficiency.
**Source:** Eo et al. 2025 (arXiv 2504.05047)
**Effort:** M

#### Confidence Calibration in judge
**What:** Grades become "7.3 ± 0.4" not "7.3". Add confidence intervals to all judge scores.
**Source:** CoCoA framework (arXiv 2503.15850)
**Effort:** M

#### Cross-session learning via Stop hook
**What:** Convert REFLEXION-LOG.md insights into persistent learned skills at `~/.productupgrade/learned/`.
**Source:** ECC continuous-learning
**Effort:** M

#### Document-release post-pipeline
**What:** After fixes, read all docs (README, CLAUDE.md, ARCHITECTURE.md) and update anything that drifted.
**Source:** gstack `/document-release`
**Effort:** M

### P2 — Medium priority

#### Claim Analysis pass on findings
**What:** Rate each agent finding A-F on evidence quality. Remove D/F rated findings.
**Source:** Fabric `analyze_claims`
**Effort:** M

#### Nyquist behavioral test gap-filler
**What:** Generate tests for requirements that have no automated coverage.
**Source:** GSD `gsd-nyquist-auditor`
**Effort:** L

#### Session pause/resume
**What:** `/productupgrade pause` saves iteration state. `/productupgrade resume` restores.
**Source:** GSD pause/resume
**Effort:** M

#### Model profile flag
**What:** `/productupgrade --profile budget` downgrades all agents proportionally.
**Source:** GSD model profiles
**Effort:** S

#### Agent-as-a-Judge
**What:** Judge the agent's fix process, not just the output files.
**Source:** Zhuge 2024 (arXiv 2410.10934)
**Effort:** L

#### Iterative subagent context retrieval
**What:** Agents that land on complex modules with insufficient context can request more.
**Source:** ECC `iterative-retrieval`
**Effort:** M

#### Per-agent cost tracking
**What:** Track tokens, time, and retries per agent per run. Cost dashboard.
**Source:** ECC `cost-aware-llm-pipeline`
**Effort:** M

### P3 — Low priority

#### 3-tier automated testing
**What:** Static validation (free) + E2E via `claude -p` (~$4) + LLM-judge (~$0.15).
**Source:** gstack testing tiers
**Effort:** L

#### Git worktree isolation per batch
**What:** Each execution batch runs in an isolated worktree for clean rollback.
**Source:** superpowers `using-git-worktrees`
**Effort:** M

#### Template-generated SKILL.md
**What:** Generate SKILL.md from `.tmpl` template with placeholders filled from source.
**Source:** gstack SKILL.md.tmpl system
**Effort:** L

#### TextGrad pipeline self-optimization
**What:** Treat the pipeline as a differentiable graph. Agent prompts improve via textual backpropagation.
**Source:** Yuksekgonul 2024 (arXiv 2406.07496)
**Effort:** XL

#### OPRO rubric self-evolution
**What:** Rubric scoring criteria improve themselves over runs using LLM optimization.
**Source:** Yang 2023 (arXiv 2309.03409)
**Effort:** L

### P4 — Future

#### Domain-Specific Constitutional AI
**What:** Tech-stack-specific guardrails (Django security, React patterns, FastAPI best practices).
**Source:** arXiv 2509.16444
**Effort:** M

#### Harness self-audit (`/productupgrade audit-self`)
**What:** ProductUpgrade audits its own agent definitions and settings.
**Source:** ECC AgentShield `security-scan`
**Effort:** M

#### Retro with per-agent metrics
**What:** Which agents had most rollbacks? Which introduced regressions?
**Source:** gstack `/retro`
**Effort:** M

#### `/productupgrade stats`
**What:** Cross-run metrics dashboard (cumulative grades, agent performance, cost).
**Source:** GSD `/gsd:stats`
**Effort:** M
