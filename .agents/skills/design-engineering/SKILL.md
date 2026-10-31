---
name: design-engineering
description: "Interface craft, micro-interactions, animation performance, and design engineering principles for Stylora."
---

# Design Engineering & UI Motion for Stylora

This skill encodes Emil Kowalski's design engineering philosophy and interface craft standards, combined with modern curated UI catalogs.

---

## 1. Core Principles

### 1.1 Unseen details compound
Great software feels right because a hundred invisible details are tuned in harmony:
- Tactile feedback on button clicks.
- Smooth, natural exit and entrance curves.
- Zero layout jank or frame drops.
- Numbers that don't jitter when updating (`tabular-nums`).

### 1.2 Performance & GPU budget
- **Animate only composite properties:** `transform` and `opacity`.
- **Never animate layout properties:** Do NOT animate `width`, `height`, `top`, `left`, `margin`, or `padding` directly.
- Avoid `transition: all`. Explicitly specify animated properties:
  ```css
  /* Good */
  transition-[transform,opacity,colors] duration-150 ease-out
  /* Bad */
  transition-all duration-500
  ```
- Keep transitions snappy: **150ms to 250ms**. Slow animations (>400ms) make apps feel laggy.

### 1.3 Curve selection
- **Enters & Expands:** `ease-out` (starts quick, lands gently).
- **Exits & Dismissals:** `ease-in` (leaves quickly).
- **Interactive elements (hover/active):** `ease-out` with low duration (100ms–150ms).

---

## 2. UI Cheatsheet (Quick Reference)

| Problem | Solution |
| :--- | :--- |
| **Button feels unresponsive** | Add `active:scale-[0.98]` with `transition-transform duration-100 ease-out`. |
| **Numbers jitter when changing** | Use `tabular-nums` / `font-variant-numeric: tabular-nums`. |
| **Headings look loose** | Add tighter tracking: `tracking-tight` (`-0.02em`). |
| **Line length hard to read** | Cap body text width with `max-w-[65ch]`. |
| **Dropdown feels sluggish** | Use `ease-out` under 250ms, never `ease-in`. |
| **Card hover feels jarring** | Transition border and subtle shadow: `transition-[border-color,box-shadow] duration-200 ease-out`. |

---

## 3. Curated UI Component Libraries & Catalog

Refer to these modern libraries when designing or selecting interactive patterns:

| Library | Link | Purpose |
| :--- | :--- | :--- |
| **HeroUI** | [heroui.com](https://heroui.com) | Accessible, beautiful React & Tailwind CSS component library |
| **TailGrids** | [tailgrids.com](https://tailgrids.com) | Ready-to-use Tailwind UI blocks for rapid development |
| **Bencho** | [bencho.dev](https://bencho.dev) | Interactive React animations for polished interfaces |
| **UI Arc** | [uiarc.dev](https://uiarc.dev) | AI-ready UI components built for modern web apps |
| **OpenSource UI** | [opensourceui.in](https://opensourceui.in) | Free, polished React & Next.js components |
| **Transitions.dev** | [transitions.dev](https://transitions.dev) | Physics-based fluid web transitions |
| **Board UI** | [boardui.com](https://boardui.com) | Clean, beautiful components for dashboards |
| **Reverse UI** | [reverseui.com](https://reverseui.com) | Premium animated components for standout web apps |

---

## 4. Curated Design Inspiration & Tool Directories

- **DezignHunt**: [dezignhunt.com](https://dezignhunt.com) — Curated collection of design tools and products.
- **Design Index**: [designindex.xyz](https://designindex.xyz) — Directory of high-quality designs.
- **DesignEng Tools**: [designeng.tools](https://designeng.tools) — Design engineering resources and utilities.
- **Designeer Tools**: [designeer.xyz/tools](https://designeer.xyz/tools) — Curated toolset for modern product designers.
- **Toolfolio**: [toolfolio.com](https://toolfolio.com) — Portfolio and design tools.
- **Design Bookmark**: [designbookmark.com](https://designbookmark.com) — Bookmark directory for UI/UX inspiration.
- **UseTools Design**: [usetools.design](https://usetools.design) — Handpicked tools for designers and builders.
- **DesignZig Collections**: [collections.designzig.com](https://collections.designzig.com) — Curated UI patterns.
- **Designeer Org**: [designeer.org](https://designeer.org) — Design resources, guides, and inspiration.

