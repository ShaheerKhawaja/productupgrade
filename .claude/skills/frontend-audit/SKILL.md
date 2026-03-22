---
name: frontend-audit
description: "ProductionOS frontend quality scanner. Auto-activates when editing React/Vue/Svelte components, CSS, or layout files. Checks accessibility, responsive design, performance, and design system consistency."
metadata:
  filePattern:
    - "**/*.tsx"
    - "**/*.jsx"
    - "**/*.vue"
    - "**/*.svelte"
    - "**/components/**"
    - "**/pages/**"
    - "**/app/**"
    - "**/styles/**"
    - "**/*.css"
    - "**/*.scss"
    - "**/tailwind.config*"
  bashPattern:
    - "next dev"
    - "vite"
    - "npm run dev"
    - "bun dev"
    - "lighthouse"
  priority: 80
---

# ProductionOS Frontend Audit

## Auto-Triggered Checklist

When this skill activates on a frontend file:

1. **Component Structure** — Composition over prop drilling, proper state management
2. **Accessibility** — ARIA labels, keyboard navigation, color contrast, semantic HTML
3. **Responsive Design** — Mobile-first breakpoints, touch targets, viewport handling
4. **Performance** — Lazy loading, code splitting, image optimization, bundle size
5. **Error States** — Empty states, loading skeletons, error boundaries, offline handling
6. **Design System** — Token consistency, spacing scale, typography hierarchy
7. **TypeScript** — Strict typing, no `any`, proper interfaces for props

## Quality Dimensions (score 1-10)

| Dimension | What to Check |
|-----------|--------------|
| Visual Design | Color system, typography, spacing, hierarchy, dark mode |
| Component Architecture | Composition, reusability, state management |
| Performance | Bundle size, LCP, FID, CLS, lazy loading |
| Accessibility | WCAG 2.1 AA, keyboard nav, screen readers |
| Responsive | Mobile-first, breakpoints, touch targets |
| Animation | Transitions, micro-interactions, loading states |
| Error States | Empty, error, loading, offline, stale data |
| Code Quality | TypeScript strict, naming, DRY, file structure |

## Red Flags — STOP If You See These

- Components with more than 5 levels of prop drilling
- Missing loading/error/empty states on data-fetching components
- Hardcoded pixel values instead of design tokens
- No keyboard navigation support on interactive elements
- Images without alt text or width/height attributes
- Client-side data fetching without SWR/React Query caching
- Inline styles instead of design system classes
