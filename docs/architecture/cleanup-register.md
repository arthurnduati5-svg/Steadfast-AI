# CSS Cleanup & Migration Register

## What Changed

### Files Created (16 new files)

```
frontend/styles/
  foundations/
    app-tokens.css
    base.css
  themes/
    theme-contract.css
    themes.index.css
    steadfast-default.css
    midnight-scholar.css
    soft-paper.css
    rose-studio.css
    ember-focus.css
    violet-library.css
    ocean-glass.css
    calm-forest.css
  copilot/
    copilot-theme.destinations.css
    copilot-theme.study-modes.css
    copilot-animations.css
    copilot-voice.css
    copilot-markdown.css
    copilot-chat.css
    copilot-sidebar.css
    copilot-revision.css
```

### Files Modified

- `frontend/app/globals.css` — reduced from 11,383 lines to ~10,208 lines (only tailwind + remaining media/creative/collection CSS)
- `frontend/app/layout.tsx` — added 12 new CSS imports
- `frontend/tests/copilot-theme-toggle.contract.test.ts` — updated to check extracted CSS files

### Files Deleted

- None

## CSS Extraction Summary

| Section | Lines (approx) | Target File |
|---------|---------------|-------------|
| shadcn :root/.dark tokens | 5-58 | foundations/app-tokens.css |
| .copilot-theme-scope (light/dark) | 62-247 | themes/steadfast-default.css |
| destination overrides | 250-271 | copilot/copilot-theme.destinations.css |
| study-mode overrides | 274-299 | copilot/copilot-theme.study-modes.css |
| html/body base | 302-315 | foundations/base.css |
| voice ambient | 317-377 | copilot/copilot-voice.css |
| markdown overflow | 379-399 | copilot/copilot-markdown.css |
| chat bubbles + cards | 401-606 | copilot/copilot-chat.css |
| sidebar components | 608-706 | copilot/copilot-sidebar.css |
| revision cards/preview | 708-969 | copilot/copilot-revision.css |
| revision pills/tags | 970-1195 | copilot/copilot-revision.css |
| all @keyframes (44) | scattered | copilot/copilot-animations.css |
| revision type pills | 4068-4617 | copilot/copilot-revision.css |
| revision reader/breadcrumb | 4618-5347+ | copilot/copilot-revision.css |

## What Remains in globals.css

- Media workspace stream layout & toolbar
- Creative workspace
- Media myth workspace, story, queue
- Learning orbit / study stream
- Media collection & library
- Stream viewport & card components
- Reduced-motion overrides
- Various media queries and utility classes

## How to Verify

1. `npm run build:frontend` — Next.js build succeeds
2. `npx tsc --noEmit --incremental false` — TypeScript passes
3. `npm run test:run` — all tests pass
4. Run `scripts/check-theme-foundation.mjs` — health check passes
