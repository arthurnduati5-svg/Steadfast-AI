# Theme System Roadmap

## Current State (v1 Foundation)

- Single active theme: `steadfast-default`
- 7 future theme placeholders exist (CSS files + registry entries + availability gate)
- Token contract defined in `theme-contract.css`
- Theme registry typed in `frontend/lib/theme-registry.ts`
- Theme selector UI: **not built yet**

## v2 Activation

1. Build theme picker UI in preferences
2. Wire theme switch to update `data-copilot-theme` attribute on the copilot shell
3. Enable theme files by setting `isAvailable: true` in the registry
4. Verify token coverage — each theme must define all `--copilot-*` tokens from the contract

## v3 Theme Refinement

- Each of the 7 future themes needs a complete color palette
- Test each theme for readability, contrast, and component compatibility
- Add tone-specific animations and micro-interactions
- Collect user preference data to guide ordering

## Key Considerations

- Themes are scoped to the copilot UI shell only — they do not affect the school's global theme
- The token contract (`theme-contract.css`) is the source of truth; every theme file must be validated against it
- Theme switching is client-side only; no server rendering of theme CSS
