# UI Refinement Notes

Use this as a single pass checklist when polishing screens so the UI is aligned, consistent, and visually strong.

## 1) Alignment and Layout
- Align all major sections to one shared grid (same left/right gutters per breakpoint).
- Keep text baselines consistent inside cards, tables, and form rows.
- Avoid "almost aligned" edges; every component edge should snap to a layout rule.
- Verify icon + text rows are vertically centered in buttons, tabs, and list items.
- Ensure modals, drawers, and popovers align to intentional anchors.

## 2) Spacing Rhythm
- Use a spacing scale (for example: 4, 8, 12, 16, 24, 32) and avoid random values.
- Keep consistent internal padding for same component types.
- Maintain equal gaps between repeated items (cards, fields, menu options).
- Increase whitespace around important content to improve scanability.
- Remove accidental extra margins at section boundaries.

## 3) Typography Quality
- Limit font size variants to a clear type scale.
- Keep heading hierarchy obvious (H1 > H2 > H3) without style overlap.
- Normalize line-height for readability (especially in dense cards and tables).
- Keep paragraph width readable; avoid very long text lines on desktop.
- Ensure button, input, and badge text weights are visually balanced.

## 4) Visual Consistency
- Standardize border radius, border color, and shadow depth across surfaces.
- Use one source of truth for color tokens (text, background, border, accent, states).
- Match icon style and stroke weight across the app.
- Keep component states consistent: default, hover, focus, active, disabled.
- Reduce visual noise by removing unnecessary dividers and competing accents.

## 5) Interaction Polish
- Add subtle transitions (150-250ms) for hover/focus/open states.
- Ensure loading states are calm and informative (skeletons/spinners with stable layout).
- Make empty states helpful and intentional, not blank placeholders.
- Confirm click targets are large enough and easy to reach.
- Prevent layout shift during async updates.

## 6) Responsive and Device Checks
- Validate key breakpoints: mobile, tablet, laptop, wide desktop.
- Check wrapping behavior for long labels, tags, and buttons.
- Ensure sticky headers/footers do not overlap content on small screens.
- Keep action buttons reachable on mobile (thumb-friendly placement).
- Test landscape mode and high zoom levels for layout integrity.

## 7) Accessibility and Legibility
- Verify color contrast for all text and controls.
- Keep keyboard focus rings visible and consistent.
- Confirm full keyboard navigation for forms, menus, dialogs, and tables.
- Add or verify labels/aria text for icon-only actions.
- Respect reduced-motion preferences for animated elements.

## 8) Final QA Pass (Fast Loop)
- Run a visual sweep page by page for misalignment and spacing outliers.
- Compare repeated components side by side for consistency.
- Test with realistic content lengths, not only perfect sample data.
- Capture before/after screenshots for each refined screen.
- Log refinements as small, shippable tasks to keep momentum.

## Quick "Looks Amazing" Rule
If a screen still feels "off," check these first in order:
1. Alignment
2. Spacing
3. Typography
4. Color/contrast
5. Interaction feedback

Most UI quality issues are solved by tightening these five areas consistently.
