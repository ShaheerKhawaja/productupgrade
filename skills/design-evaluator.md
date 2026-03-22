---
name: design-evaluator
description: "Structured interface review methodology. 4 lenses: visual design, interface design, interaction consistency, user context. Works with screenshots, component files, or URLs. Produces specific observations with impact and alternative."
metadata:
  author: raphael-salaja (forked + refactored for ProductionOS)
  version: "1.0.0"
  filePattern: "**/*.tsx,**/*.vue,**/*.jsx,**/*.svelte,**/*.css,**/components/**"
  priority: 85
---

# Design Evaluator Skill

Structured methodology for reviewing interfaces. Instead of vague feedback, produce specific, tangible observations organized into 4 lenses.

## When to Use

- Reviewing any UI component, page, or screen
- After generating mockups in /designer-upgrade
- Before shipping frontend changes
- When user says "review", "critique", "check design", "what would you improve"

## Input Formats

Works with (in order of preference):
1. **Screenshots** (best) — paste or provide path
2. **Component files** — .tsx, .vue, .jsx, .svelte
3. **Live URLs** — fetch and analyze

## Critique Structure

Always follow this sequence:

### 1. Context
What is this? What problem does it solve? Who uses it?

### 2. First Impressions
What do you notice in the first 3 seconds? What draws your eye? What feels off?

### 3. Visual Design Lens
Evaluate: color, typography, spacing, shadows, borders, visual weight, hierarchy.

Format each finding as:
```
**{Issue name}** — {Specific observation about what's wrong}.
{Impact on the user or aesthetic}. {What it could be instead}.
```

Example:
```
**Muddy shadows** — The card shadows use a large blur radius with low
opacity, creating a hazy look rather than crisp depth. Tighter, more
directional shadows would give the layout a cleaner sense of elevation.
```

Key checks (from userinterface-wiki):
- `visual-concentric-radius` — Inner radius = outer - padding for nested elements
- `visual-layered-shadows` — Layer 2-3 shadows for realistic depth
- `visual-no-pure-black-shadow` — Use neutral colors, never pure black
- `visual-shadow-direction` — All shadows share same offset direction
- `visual-border-alpha-colors` — Semi-transparent borders adapt to any bg
- `visual-consistent-spacing-scale` — No arbitrary spacing values

### 4. Interface Design Lens
Evaluate: layout, component composition, information density, focus mechanism, data hierarchy.

Key checks:
- **Focusing mechanism** — Does one element clearly lead? Or do all compete equally?
- **Vertical rule count** — How many implicit alignment lines? Reduce to 2-3 max.
- **Toolbar complexity** — Is the toolbar adding weight without functional gain?
- **Primary action placement** — Right side, emphasized (iOS pattern)
- **Progressive disclosure** — Show what matters now, reveal complexity later

### 5. Interaction Consistency Lens
Evaluate: hover states, active states, transitions, animation timing, icon consistency.

Key checks:
- **Icon style consistency** — All outline OR all filled, never mixed
- **Divider consistency** — If one list has dividers, all similar lists should
- **Border treatment consistency** — One visual language for containers
- **Active state presence** — All interactive elements need :active scale (0.95-1.05)
- **Timing consistency** — Similar animations use identical timing

### 6. User Context Lens
Evaluate: cognitive load, Fitts's law compliance, Hick's law compliance, accessibility.

Key checks:
- `ux-fitts-target-size` — Min 32px targets (48px mobile)
- `ux-hicks-minimize-choices` — Fewer options = faster decisions
- `ux-millers-chunking` — Groups of 5-9
- `ux-doherty-under-400ms` — Respond within 400ms
- `ux-jakobs-familiar-patterns` — Use patterns users know

### 7. Top Opportunities
End with 3-5 prioritized improvements. Each must be:
- Specific (not "improve spacing" but "reduce card padding from 24px to 16px")
- Impactful (addresses the #1 user friction)
- Achievable (not a full redesign, but a targeted fix)

## Refinement Methodology (from Raphael Salaja's "Refining Today")

When refining an interface that's already good (7/10+), apply these micro-refinement patterns:

1. **Icon style alignment** — Audit all icons, pick ONE style (outline or filled), apply everywhere
2. **Vertical rule reduction** — Count implicit alignment lines, reduce to 2-3
3. **Toolbar simplification** — Remove visual containers on toolbars, use floating buttons
4. **Primary action emphasis** — Move to right side, add visual weight
5. **Divider standardization** — Pick one treatment (dividers or no dividers), apply everywhere
6. **Category tokenization** — Style category/tag labels as tokens to differentiate from user text
7. **Stroke width alignment** — All icon/line strokes at same width
8. **Color variance reduction** — Reduce to 2-3 semantic colors, eliminate one-off colors
9. **Optical padding balance** — Tighten padding so content feels balanced, not just mathematically centered
10. **Weight reduction** — Each refinement should REDUCE visual weight of the interface

## Output Location
Write critique to: `.productionos/designer-upgrade/audit/design-evaluator.md`
