# Frontend Style System Architecture

## Overview

The style system is organized into responsibility-based CSS files under `frontend/styles/`, loaded via ES imports in `layout.tsx`. This replaces the previous single-file globals.css approach.

## Directory Structure

```
styles/
  foundations/
    app-tokens.css   — :root and .dark shadcn HSL tokens
    base.css         — html/body base rules

  themes/
    theme-contract.css        — documented required --copilot-* tokens
    themes.index.css          — barrel import of all theme files
    steadfast-default.css     — default theme (light + dark copilot scope)
    midnight-scholar.css      — placeholder (not yet available)
    soft-paper.css            — placeholder (not yet available)
    rose-studio.css           — placeholder (not yet available)
    ember-focus.css           — placeholder (not yet available)
    violet-library.css        — placeholder (not yet available)
    ocean-glass.css           — placeholder (not yet available)
    calm-forest.css           — placeholder (not yet available)

  copilot/
    copilot-theme.destinations.css   — data-copilot-destination overrides
    copilot-theme.study-modes.css    — data-study-mode overrides
    copilot-animations.css           — all @keyframes
    copilot-voice.css                — voice mode ambient styles
    copilot-markdown.css             — assistant markdown prose styles
    copilot-chat.css                 — chat bubbles, teaching cards, actions
    copilot-sidebar.css              — sidebar search, cards, tabs, rail
    copilot-revision.css             — revision cards, workspace, pills, reader, flashcards
```

## Import Order (layout.tsx)

CSS cascade priority is managed by import order — later imports win over earlier ones:

1. `globals.css` — tailwind directives + remaining media/creative/collection CSS
2. `foundations/app-tokens.css` — shadcn HSL tokens
3. `foundations/base.css` — html/body base
4. `themes/theme-contract.css` — token contract docs
5. `themes/themes.index.css` — all theme imports
6. `copilot/` component files (destinations → study-modes → animations → voice → markdown → chat → sidebar → revision)

## Token Architecture

- **shadcn HSL tokens**: `app-tokens.css` — `:root` (light) and `.dark` classes
- **Copilot semantic tokens**: `steadfast-default.css` — `--copilot-*` tokens inside `.copilot-theme-scope`
- **Component tokens**: each copilot CSS file uses `--copilot-*` vars, never raw hex/rgb

## Future Themes

Each future theme lives in `themes/<name>.css` and defines its own `.copilot-theme-scope` variables. Themes are gated by `theme-registry.ts` (`isAvailable: false`). When activated, the CSS file's selectors override the default via cascade order.
