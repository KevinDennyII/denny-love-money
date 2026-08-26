# Project Cleanup & Maintenance Guide

This document outlines the scripts, processes, and coding standards for cleaning up and maintaining the **Denny Monthly Finances** project.

**CSS source of truth (Josh Comeau — CSS for JS Devs):**  
[CSS for JS Devs on Docmost](https://docs.thatdeveloper.dev/share/dgnghfh526/p/css-for-js-devs-mMY456mIPs)  
(Local Docker Desktop Docmost: `docs.thatdeveloper.dev`)

## 🧹 Database Cleanup

### Reset Database

To completely wipe all data from the database (truncate all tables):

```bash
npm run db:reset
```

### Seed Database

To repopulate the database with initial data (including HSA paybacks from Excel):

```bash
npm run db:seed
```

> **Note:** The seed script (`server/seed.ts`) attempts to read from `attached_assets/Estimated_Denny_Monthly_Finances_1770003508732.xlsx`. If the file is missing, it falls back to sample data.

## 🛠️ Project Maintenance

### Run cleanup check

```bash
npm run cleanup
```

This prints a short checklist and flags common layout anti-patterns (sibling margins where `gap` should win, missing `min-w-0` in flex/grid children that truncate text, etc.).

### Clean Install

If you encounter dependency issues:

```bash
rm -rf node_modules
npm install
```

### Build Cleanup

To remove build artifacts:

```bash
rm -rf dist
```

## 🧼 Code Cleanup & Refactoring Standards

This project follows **Clean Code Principles** and **Modern Component Architecture** (Josh Comeau — CSS for JS Devs + The Joy of React). When cleaning up or refactoring code, adhere to the following guidelines:

### 1. Component Architecture

- **Single Responsibility Principle (SRP)**: Avoid monolithic files. Break large pages into smaller, focused components in `client/src/components/<feature>/`.
- **Directory Structure**:
  - `client/src/pages/`: Route-level components only (data fetching, layout orchestration).
  - `client/src/components/`: Reusable and feature-specific components.
- **Colocation**: Keep related styles, types, and sub-components close to where they are used.
- **Composition over variants soup**: Prefer a clear base + composed variants (same idea as Comeau’s styled-component “Base → PrimaryButton” pattern), not one mega-component with a dozen boolean props.
- **Escape hatches sparingly**: Keep defaults constrained; only break out when needed (and document why).

### 2. UI & Animations (The Joy of React)

- **Framer Motion**: Use `framer-motion` for meaningful animations.
  - **List Transitions**: Wrap lists in `<AnimatePresence>` and use `layout` props to smooth out additions, deletions, and reordering.
  - **Entrance Animations**: Use simple fade-in/slide-up variants for new content.
- **User Feedback**: Ensure immediate visual feedback for actions (e.g., optimistic updates or smooth transitions).
- **Reduced motion**: Prefer transforms/opacity; respect `prefers-reduced-motion` when adding non-essential motion (Comeau responsive/behavioral CSS).

### 3. CSS & Layout (CSS for JS Devs — updated from Docmost)

Principles below are distilled from the family Docmost notes for [CSS for JS Devs](https://docs.thatdeveloper.dev/share/dgnghfh526/p/css-for-js-devs-mMY456mIPs) (Josh Comeau).

#### Box model & global defaults

- Always use `box-sizing: border-box` on `*`, `*::before`, `*::after` (already in global styles).
- Prefer **padding** for space inside a component; prefer **margin** for space between siblings.
- Never remove focus outlines without an equally visible `:focus` / `:focus-visible` replacement (a11y).

#### Spacing — prefer `gap`, avoid margin collapse traps

- Prefer **`gap`** in Flexbox/Grid containers over stacking `margin-top` / `margin-bottom` on children.
- Vertical margins **collapse** in flow layout (siblings 24px + 24px → 24px, not 48px). Horizontal margins do **not** collapse.
- Margins are for sibling “personal space,” not for pushing a child away from its parent’s edge — that’s padding.
- In Flex/Grid, sibling margins don’t collapse the same way; still prefer `gap` for rhythm.

#### Flexbox vs Grid

- **Flexbox**: one primary axis (rows of chips, card header + amount, toolbars).
- **CSS Grid**: two-dimensional layouts (Accounts summary tiles, Net Worth Assets | Liabilities).
- On flex/grid children that truncate text: set **`min-w-0`** (or `min-width: 0`) so `truncate` / `overflow` can work; keep money/actions in a **`shrink-0`** column.
- Don’t let long notes sit under a large tabular amount in the same shrink-wrapped column — that caused the Net Worth “Live from BankSync…” overlap. Put metadata under the title; keep the amount alone on the right.

#### Fluid & responsive (constraints > endless breakpoints)

- Prefer **fluid constraints** (`clamp`, `%`, `fr`, `minmax`, container-driven layouts) before piling on viewport breakpoints.
- World-famous fluid card grid (when needed):

  ```css
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  ```

  - `auto-fill` keeps empty tracks; `auto-fit` collapses empty tracks and stretches items.
  - In `minmax()`, the flexible unit (`1fr`) must be the **maximum**, not the minimum.
- Use Tailwind breakpoints (`sm:`, `md:`, `lg:`) for genuine layout *mode* changes (stack → side-by-side), not for every size tweak.
- Design for: screen size, input type, dark/light, zoom / default font size, and reduced motion — not just “desktop vs phone.”

#### Typography & sizing

- Body text stays ~**`1rem`** (browsers already balance perceived size). Don’t scale the whole UI with `html { font-size: … }` hacks.
- Form controls (`input`, `select`, `textarea`) stay **≥ 1rem** so mobile Safari doesn’t auto-zoom on focus.
- Headings use **fluid `clamp(...)`** so large desktop titles don’t dominate narrow phones (see `client/src/index.css`).
- Prefer **`rem`** for typography (respects user default font size). Pixels are fine for many box-model values; use `em` only when something must scale tightly with a local font size.
- Viewport meta: `width=device-width, initial-scale=1` — **do not lock pinch-zoom**.

#### Overflow & columns

- Grid columns that hold cards with long text need **`min-w-0`** on the column wrapper so neighboring columns (e.g. Net Worth liabilities) don’t get visually crushed/overlapped.
- Prefer `tabular-nums` for currency alignment.

### 4. Reference Implementation

See `client/src/pages/medical.tsx` and `client/src/components/medical/` for a reference implementation of component architecture patterns.  
See `client/src/components/networth/asset-card.tsx` for Live badge + amount layout that follows the flex/`min-w-0` rules above.  
See `client/src/index.css` for Comeau-inspired responsive typography.

## 📝 Temporary Files

The following files are temporary or generated and can be safely deleted if no longer needed:

- `server/seed_hsa_now.ts` (if it exists - redundant with `server/seed.ts`)
