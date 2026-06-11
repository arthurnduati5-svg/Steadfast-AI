# Frontend-Backend Architecture Map

## Overview

Steadfast AI is a Next.js App Router application with a tRPC-based backend API layer and Prisma ORM for PostgreSQL.

## Directory Layout

```
frontend/
  app/             — Next.js App Router pages & layouts
  components/      — React components (copilot/, revision/, media/, growth/, etc.)
  lib/             — Shared utilities, types, theme registry, copilot theme
  styles/          — CSS architecture (see frontend-style-system.md)
  tests/           — Vitest test files
  public/          — Static assets

src/
  backend/         — tRPC routers and procedures
  ai/              — AI model orchestration
  assessment/      — Exam/focus assessment logic
  growth/          — Growth workspace and daily feed
  media/           — Media workspace, stream, collections
  revision/        — Revision items, collections, spaced repetition
  tutor/           — Tutor engine, policy, metacognition
  utils/           — Shared utilities
  lib/             — Prisma client and shared libraries
```

## Key Data Flow

```
Client Component
  → tRPC client (frontend/lib/api.ts)
  → Backend tRPC router (src/backend/...)
  → Prisma → PostgreSQL
```

## Theme System Flow

```
layout.tsx
  → imports globals.css + style foundation files
  → AppClientShell reads localStorage('copilot:theme')
  → sets data attribute (data-copilot-theme, data-copilot-destination, data-study-mode)
  → copilot-*.css selectors activate based on data attributes
```

See `docs/architecture/theme-system-roadmap.md` for the multi-theme future.
