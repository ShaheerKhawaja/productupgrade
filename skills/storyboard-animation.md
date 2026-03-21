---
name: storyboard-animation
description: "Turn multi-step animations into readable scripts. ASCII storyboard at top, TIMING object for delays, element config objects for scales/positions/springs, single stage integer drives sequence. Motion/Framer Motion pattern."
metadata:
  author: raphael-salaja (forked + refactored for ProductionOS)
  version: "1.0.0"
  filePattern: "**/*.tsx,**/*.jsx,**/components/**,**/animations/**"
  bashPattern: "motion|framer-motion|animate"
  priority: 80
---

# Storyboard Animation Skill

Turns multi-step animations into something you can read like a script. Every timing value, scale, position, and spring config gets extracted to named constants at the top. A single stage integer drives the whole sequence.

## When to Use

- Building any multi-step staged animation
- Implementing entrance/exit sequences
- Creating scroll-triggered animation chains
- When user describes an animation in plain English

## The Pattern (4 parts)

### Part 1: ASCII Storyboard

Every animated component starts with an ASCII storyboard comment. Read top-to-bottom like a shot list.

```tsx
/* ────────────────────────────────────────────────
 * ANIMATION STORYBOARD
 *
 * Read top-to-bottom. Each `at` is ms after trigger.
 *
 *     0ms    idle / waiting
 *   300ms    element A fades in, scale 0.8 → 1.0
 *   800ms    element A slides to final position
 *  1200ms    elements B pop in (staggered 50ms)
 *  2000ms    sequence complete
 * ──────────────────────────────────────────────── */
```

Rules:
- One line per visual change
- Include scale/position transitions with arrows (→)
- Include stagger timing for groups
- Comments mirror the TIMING object below

### Part 2: TIMING Object

Single object holds every delay. This is the ONLY place timing values live.

```tsx
const TIMING = {
  elementAAppear:  300,   // A fades in, springs to scale
  elementASlide:   800,   // A moves to final position
  groupBAppear:   1200,   // B items start popping in
};
```

Rules:
- Comments mirror the storyboard
- All values in milliseconds
- Never hardcode timing elsewhere in the component

### Part 3: Element Config Objects

Each animated element gets its own config. Scales, positions, springs grouped together.

```tsx
const ELEMENT_A = {
  initialScale:  0.8,
  finalScale:    1.0,
  initialTop:    "50%",
  finalTop:      "24px",
  spring: { type: "spring" as const, stiffness: 250, damping: 25 },
};

const GROUP_B = {
  stagger: 0.05,  // seconds between items
  spring: { type: "spring" as const, stiffness: 500, damping: 25 },
  items: [
    { label: "Item 1", className: "left-[10%] top-[20%]" },
    { label: "Item 2", className: "right-[15%] top-[40%]" },
  ],
};
```

Rules:
- Group ALL visual properties for one element together
- Include spring config with the element, not separately
- Stagger values in seconds (Motion convention)
- Use `as const` for type safety on spring type

### Part 4: Stage Pattern

Single `stage` integer drives the sequence. No boolean flags or nested conditionals.

```tsx
const [stage, setStage] = useState(0);

useEffect(() => {
  const timers = [
    setTimeout(() => setStage(1), TIMING.elementAAppear),
    setTimeout(() => setStage(2), TIMING.elementASlide),
    setTimeout(() => setStage(3), TIMING.groupBAppear),
  ];
  return () => timers.forEach(clearTimeout);
}, []);

// In JSX:
<motion.div
  animate={{
    opacity: stage >= 1 ? 1 : 0,
    scale:   stage >= 2 ? ELEMENT_A.finalScale : ELEMENT_A.initialScale,
    top:     stage >= 2 ? ELEMENT_A.finalTop : ELEMENT_A.initialTop,
  }}
  transition={ELEMENT_A.spring}
/>

{GROUP_B.items.map((item, i) => (
  <motion.div
    key={item.label}
    className={item.className}
    animate={{
      opacity: stage >= 3 ? 1 : 0,
      scale:   stage >= 3 ? 1 : 0,
    }}
    transition={{ ...GROUP_B.spring, delay: i * GROUP_B.stagger }}
  />
))}
```

Rules:
- `stage >= N` checks in animate props (not `stage === N`)
- This allows cumulative animations (stage 3 includes stage 1+2 effects)
- useEffect with TIMING constants drives the sequence
- Clean up all timeouts on unmount

## Spring Parameter Guide (from userinterface-wiki)

| Use Case | Stiffness | Damping | Notes |
|----------|-----------|---------|-------|
| UI element entrance | 250-350 | 20-30 | Smooth settle |
| Snappy pop-in (tags, markers) | 400-600 | 20-30 | Quick, decisive |
| Gesture follow (drag, flick) | 150-250 | 15-25 | Preserves velocity |
| Bounce effect | 300-400 | 10-15 | Low damping = more bounce |
| Micro-interaction (hover) | 500-700 | 30-40 | Barely perceptible |

**Critical rules:**
- Stagger: under 50ms per item (avoid excessive stagger)
- Duration: NEVER exceed 300ms for user-initiated animations
- Press/hover: 120-180ms
- Small state changes: 180-260ms

## Combining with DialKit

For live tuning during development:
```
Build [description]. Use the storyboard animation pattern
and add DialKit controls for the spring, timing delays,
and key position values.
```

## Output
Storyboard components go in the component's file with all constants at the top.
