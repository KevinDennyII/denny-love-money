# Project Cleanup & Maintenance Guide

This document outlines the scripts, processes, and coding standards for cleaning up and maintaining the **Denny Monthly Finances** project.

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

This project follows **Clean Code Principles** and **Modern Component Architecture** (inspired by Josh Comeau). When cleaning up or refactoring code, adhere to the following guidelines:

### 1. Component Architecture

- **Single Responsibility Principle (SRP)**: Avoid monolithic files. Break large pages (like `medical.tsx`) into smaller, focused components located in `client/src/components/<feature>/`.
- **Directory Structure**:
  - `client/src/pages/`: Route-level components only (data fetching, layout orchestration).
  - `client/src/components/`: Reusable and feature-specific components.
- **Colocation**: Keep related styles, types, and sub-components close to where they are used.

### 2. UI & Animations (The Joy of React)

- **Framer Motion**: Use `framer-motion` for meaningful animations.
  - **List Transitions**: Wrap lists in `<AnimatePresence>` and use `layout` props to smooth out additions, deletions, and reordering.
  - **Entrance Animations**: Use simple fade-in/slide-up variants for new content.
- **User Feedback**: Ensure immediate visual feedback for actions (e.g., optimistic updates or smooth transitions).

### 3. CSS & Layout (CSS for JS Devs)

- **Spacing**: Prefer `gap` in Flexbox/Grid containers over individual `margin` on children to avoid margin collapse and maintain consistent rhythm.
- **Responsiveness**: Use standard Tailwind breakpoints (e.g., `md:grid-cols-3`) to handle layout shifts.
- **Modern Layouts**: Utilize CSS Grid for 2D layouts and Flexbox for 1D alignments.

### 4. Reference Implementation

See `client/src/pages/medical.tsx` and `client/src/components/medical/` for a reference implementation of these patterns.

## 📝 Temporary Files

The following files are temporary or generated and can be safely deleted if no longer needed:

- `server/seed_hsa_now.ts` (if it exists - redundant with `server/seed.ts`)
