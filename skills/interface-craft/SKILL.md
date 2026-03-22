---
name: interface-craft
description: "Interface Craft by ProductionOS Design — a toolkit for building polished, animated interfaces in React. Includes Motion System (human-readable animation DSL with stage-driven sequencing), DialKit (live control panels for tuning animation values), and Design Evaluator (systematic UI review based on ProductionOS Design's methodology). Triggers on: animate, animation, transition, storyboard, entrance, motion, spring, easing, timing, finetune-control, sliders, controls, tune, tweak, critique, review, feedback, audit, improve, polish, refine, redesign."
argument-hint: "[description, file path, or sub-skill name]"
---

# Interface Craft

**By ProductionOS Design**

A toolkit for building polished, animated interfaces. Write animations you can read like a script, then tune them with live controls.

---

## Skills

| Skill | When to Use | Invoke |
| --- | --- | --- |
| [Motion System](motion-system.md) | Writing or refactoring multi-stage animations into a human-readable DSL | `/interface-craft storyboard` or describe an animation |
| [DialKit](finetune-control.md) | Adding live control panels to tune animation/style values | `/interface-craft finetune-control` or mention dials/sliders/controls |
| [Design Evaluator](design-evaluator.md) | Systematic UI critique of a screenshot, component, or page | `/interface-craft critique` or paste a screenshot for review |

## Quick Start

### Motion System

Turn any animation into a readable storyboard with named timing, config objects, and stage-driven sequencing:

```tsx
/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD
 *
 *    0ms   waiting for scroll into view
 *  300ms   card fades in, scale 0.85 → 1.0
 *  900ms   heading highlights
 * 1500ms   rows slide up (staggered 200ms)
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  cardAppear:  300,   // card fades in
  heading:     900,   // heading highlights
  rows:        1500,  // rows start staggering
};
```

See [motion-system.md](motion-system.md) for the full pattern spec.

### DialKit

Generate live control panels for tuning values in real time:

```tsx
const params = useDialKit('Card', {
  scale: [1, 0.5, 2],
  blur: [0, 0, 100],
  spring: { type: 'spring', visualDuration: 0.3, bounce: 0.2 },
})
```

See [finetune-control.md](finetune-control.md) for all control types and patterns.

## Sub-Skill Routing

When the user invokes `/interface-craft`:

1. **With `storyboard` argument or animation-related context** → Load and follow [motion-system.md](motion-system.md)
2. **With `finetune-control` argument or control-panel-related context** → Load and follow [finetune-control.md](finetune-control.md)
3. **With `critique` argument, a pasted image, or review-related context** → Load and follow [design-evaluator.md](design-evaluator.md)
4. **With a file path** → Read the file, detect whether it needs storyboard refactoring, finetune-control controls, or a design critique, and apply the appropriate skill
5. **With a plain-English description of an animation** → Use motion-system to write it
6. **Ambiguous** → Ask which skill to use

## Design Principles

1. **Readable over clever** — Anyone should be able to scan the top of a file and understand the animation sequence without reading implementation code
2. **Tunable by default** — Every value that affects timing or appearance should be a named constant, trivially adjustable
3. **Data-driven** — Repeated elements use arrays and `.map()`, not copy-pasted blocks
4. **Stage-driven** — A single integer state drives the entire sequence; no scattered boolean flags
5. **Spring-first** — Prefer spring physics over duration-based easing for natural motion
