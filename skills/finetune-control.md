---
name: finetune-control-live-tuning
description: "Live parameter tuning for UI development. DialKit provides floating control panel with sliders, toggles, spring configs, and action buttons wired to component values. Parametric visualization philosophy."
metadata:
  author: raphael-salaja (forked + refactored for ProductionOS)
  version: "1.0.0"
  filePattern: "**/*.tsx,**/*.jsx,**/components/**"
  bashPattern: "finetune-control|useDialKit"
  priority: 75
---

# DialKit Live Tuning Skill

Expose key parameters so you can adjust them in real time and feel the difference instantly. DialKit gives you a floating control panel wired directly to the values driving your UI.

## Core Philosophy: Live Tuning (Parametric Visualization)

> "Duration, easing, spacing, shadows, blurs, position, scale — whatever you're trying to dial in, make it adjustable on the fly."

Traditional workflow: change value → save → look → change again → save → refresh.
Live tuning: drag slider → see result INSTANTLY. Feel the difference. Build intuition.

**This changes everything.** You find combinations you never would have landed on by guessing.

## When to Use

- Tuning animation springs (visualDuration + bounce)
- Finding the right spacing/padding/gap values
- Dialing in shadow blur, opacity, border radius
- Exploring color variations
- Any time you'd normally hard-code a number and iterate

## Installation

```bash
npm install finetune-control motion
```

Layout setup (add as SIBLING, not wrapper):
```tsx
import { DialRoot } from "finetune-control";
import "finetune-control/styles.css";

export default function Layout({ children }) {
  return (
    <>
      {children}
      <DialRoot />
    </>
  );
}
```

## The useDialKit Hook

```tsx
const values = useDialKit("Component Name", {
  // Sliders: [default, min, max]
  blur: [4, 0, 20],
  scale: [0.95, 0.5, 1.5],
  opacity: [0.8, 0, 1],
  padding: [16, 4, 48],
  borderRadius: [8, 0, 32],
  gap: [12, 0, 32],

  // Toggles (boolean)
  showShadow: true,
  darkMode: false,

  // Spring configs (auto-generates visualDuration + bounce sliders)
  spring: {
    type: "spring",
    visualDuration: 0.4,
    bounce: 0.2,
  },

  // Actions (trigger buttons)
  reset: () => handleReset(),
  replay: () => replayAnimation(),

  // Folders (organize related controls)
  card: {
    elevation: [2, 0, 5],
    hoverScale: [1.02, 1.0, 1.1],
  },
});
```

### Parameter Types

| Type | Syntax | Control |
|------|--------|---------|
| **Slider** | `[default, min, max]` | Draggable number |
| **Toggle** | `true` / `false` | Boolean switch |
| **Spring** | `{ type: "spring", visualDuration, bounce }` | Auto dual-slider |
| **Action** | `() => fn()` | Click button |
| **Folder** | `{ nested: ... }` | Collapsible group |

### Spring Config Detail

The spring type is the most powerful. Pass `visualDuration` (how long the spring feels) and `bounce` (overshoot amount). DialKit auto-generates sliders for both. The returned value is a full transition object — pass directly to Motion's `transition` prop.

```tsx
const values = useDialKit("Modal", {
  entrance: {
    type: "spring",
    visualDuration: 0.35,
    bounce: 0.15,
  },
});

<motion.div transition={values.entrance} />
```

## Practical Prompts

### Add to existing animation:
```
I have a card component with a hover animation. Add DialKit controls
so I can tune the spring physics (visualDuration and bounce), scale
on hover, and shadow blur in real time.
```

### Build with DialKit from scratch:
```
Create a spring-animated modal using Motion. Add DialKit controls for:
entrance spring, overlay opacity, border radius, and a "replay" button.
```

### Explore visual variations:
```
Give me a toggle for iterations of the current graphic. Let me slide
how many I want and how many columns they are displayed in. For every
iteration, use a random set of parameters so I can see possibilities.
```

### Tune layout:
```
Add DialKit to this grid layout. Sliders for gap, padding, column
count (1-6), and card border radius. Group card controls in a folder.
```

## Integration with Motion System

Combine both patterns for maximum design velocity:
```
Build a notification toast that slides in from the top-right, holds
for 3 seconds, then slides out. Use the storyboard animation pattern
and add DialKit controls for the spring, hold duration, and vertical offset.
```

This gives you:
1. Readable storyboard comment
2. TIMING/config constants at the top
3. Stage-driven animation
4. Live sliders to tune every value in real time

## Output
DialKit setup goes in the component file. `<DialRoot />` in the layout.
Remove DialKit before production deployment (dev-only tool).
