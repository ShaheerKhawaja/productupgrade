# Composable Prompt Engineering Layers

22 modular prompt technique layers that can be composed and stacked. Each layer is independently applicable and works with any agent in the ProductionOS pipeline. Layers 00-15 are single-pass techniques. Layers 16-21 are recursive patterns that use self-reference, depth-bounded recursion, and convergence criteria.

## Layer Index

| # | Layer | Category | Research | Impact |
|---|-------|----------|----------|--------|
| 00 | Decision Tree | Control Plane | — | Routes to appropriate layers |
| 01 | Emotion Prompting | Motivation | Li et al. 2023 | +8-15% accuracy |
| 02 | Meta-Prompting | Reflection | Suzgun & Kalai 2024 | Prevents premature conclusions |
| 03 | Chain of Thought | Reasoning | Wei et al. 2022 | +20-30% on complex tasks |
| 04 | Tree of Thought | Exploration | Yao et al. 2023 | +70% on planning tasks |
| 05 | Graph of Thought | Synthesis | Besta et al. 2024 | +51% on complex problems |
| 06 | Chain of Density | Compression | Adams et al. 2023 | 3x context efficiency |
| 07 | Self-Consistency | Validation | Wang et al. 2022 | Eliminates flukes |
| 08 | Reflexion | Learning | Shinn et al. 2023 | +11% pass@1 on code |
| 09 | Step-Back | Abstraction | Zheng et al. 2023 | +15% on domain problems |
| 10 | Contrastive CoT | Error Prevention | Chia et al. 2023 | Learns from wrong examples |
| 11 | Constitutional AI | Safety | Bai et al. 2022 | Enforces principles |
| 12 | ReAct | Agent Loops | Yao et al. 2022 | Interleaved reasoning+action |
| 13 | Cumulative Reasoning | Verification | Zhang et al. 2023 | +2.4% on logic |
| 14 | Self-Debugging | Code Repair | Chen et al. 2023 | +15.9% on code gen |
| 15 | LATS | Deep Search | Koh et al. 2024 | +14% on HumanEval |
| | | | | |
| **Recursive Layers** | | | | |
| 16 | Recursive Decomposition | Divide & Conquer | MIT RLM 2025 | 100x context handling |
| 17 | Self-Referential Improvement | Self-Refinement | Madaan et al. 2023 | +20% human preference |
| 18 | Recursive Summarization | Hierarchical Compression | Adams et al. 2023 (extended) | 3-5x density vs single-pass |
| 19 | Recursive Verification Stack | Multi-Level Verification | Dhuliawala et al. 2023 | ~60% hallucination reduction |
| 20 | PEER (Plan-Execute-Evaluate-Replan) | Adaptive Execution | Wang et al. 2025 | Self-correcting plans |
| 21 | Prompt Evolution | Meta-Recursion | Fernando et al. 2023 | Self-improving prompts |

Full design: [RECURSIVE-PATTERNS.md](./RECURSIVE-PATTERNS.md)

## Composition Rules

1. Always apply Layer 01 (Emotion) — universal accuracy boost
2. Apply Layer 02 (Meta) before any analysis task
3. Layer 03 (CoT) is the default reasoning layer for all agents
4. Layer 04 (ToT) for planning agents, Layer 05 (GoT) for synthesis agents
5. Layer 06 (CoD) only on inter-iteration handoffs (iteration > 1)
6. Layer 12 (ReAct) for agents with tool access
7. Layer 14 (Self-Debugging) for execution agents
8. Layer 15 (LATS) only in /omni-plan mode (expensive)
9. Layer 16 (RecDecomp) for non-atomic tasks in deep/ultra mode — apply BEFORE Layer 04 (CoT)
10. Layer 17 (SelfRefine) for human-facing outputs only (docs, reports, plans) — never code
11. Layer 18 (RecSumm) replaces Layer 06 (CoD) when source count > 3
12. Layer 19 (RecVerify) extends verification-gate: P3=L1, P2=L1+L2, P1/P0=L1+L2+L3
13. Layer 20 (PEER) replaces linear planning for execution agents (dynamic-planner, refactoring-agent)
14. Layer 21 (PromptEvo) runs ONLY between convergence loops — never during execution
