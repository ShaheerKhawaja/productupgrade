# Changelog

## [3.0.0] - 2026-03-18

### Added
- 135K-character prompt architecture across 8 composable skill files
- Dynamic Decision Tree control plane for adaptive routing
- 7 prompt layer skills: Emotion, Meta, CoT, ToT, GoT, CoD, Context Retrieval
- Dimension filter argument (`--focus security,performance`)
- Dry-run mode (discovery + evaluation only)
- Progress reporting after each phase
- Strategic review gates in auto-swarm Wave 4
- hooks/hooks.json with session start banner
- Canonical plugin structure (matches superpowers/gstack patterns)
- LICENSE (MIT)
- Multi-platform support (.cursor-plugin)

### Changed
- Restructured from 102 files to 41 (removed all duplicates)
- Moved commands from .claude/commands/ to commands/
- Moved skills from .claude/skills/ to skills/
- Moved design spec from .productupgrade/ to docs/
- Removed skills-bundle/ (third-party skills not bundled)
- Plugin version bumped to 3.0.0

## [2.1.0] - 2026-03-17

### Added
- 9 new V2 agents (adversarial-reviewer, thought-graph-builder, etc.)
- /auto-swarm command for distributed agent orchestration
- 3 execution modes: auto, standard, deep
- 7-layer prompt composition (CoT+ToT+GoT+CoD+Emotion+Meta+Context)
- Convergence engine with LLM-as-Judge v2.0
- DEGRADED tolerance (0.5) with rollback
- Adaptive toolchain detection

## [1.0.0] - 2026-03-17

### Added
- Initial 54-agent recursive pipeline
- 10-dimension evaluation rubric
- LLM-as-Judge convergence control
- 11 specialized agents
