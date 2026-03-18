# Composable Prompt Engineering Layers

16 modular prompt technique layers that can be composed and stacked. Each layer is independently applicable and works with any agent in the ProductUpgrade pipeline.

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

## Composition Rules

1. Always apply Layer 01 (Emotion) — universal accuracy boost
2. Apply Layer 02 (Meta) before any analysis task
3. Layer 03 (CoT) is the default reasoning layer for all agents
4. Layer 04 (ToT) for planning agents, Layer 05 (GoT) for synthesis agents
5. Layer 06 (CoD) only on inter-iteration handoffs (iteration > 1)
6. Layer 12 (ReAct) for agents with tool access
7. Layer 14 (Self-Debugging) for execution agents
8. Layer 15 (LATS) only in /omni-plan mode (expensive)
