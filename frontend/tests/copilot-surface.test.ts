import { describe, expect, it } from 'vitest';
import {
  ADVANCED_WIDGET_DESTINATIONS,
  CORE_WIDGET_DESTINATIONS,
  resolveCopilotSurfaceProfile,
  resolveWidgetDestinationVisibility,
} from '@/lib/copilot-surface';

describe('Copilot surface profile resolution', () => {
  it('maps widget widths to the expected surface profiles', () => {
    expect(resolveCopilotSurfaceProfile(320)).toBe('compact');
    expect(resolveCopilotSurfaceProfile(390)).toBe('cozy');
    expect(resolveCopilotSurfaceProfile(540)).toBe('comfortable');
    expect(resolveCopilotSurfaceProfile(820)).toBe('comfortable');
    expect(resolveCopilotSurfaceProfile(1024)).toBe('expanded');
  });

  it('falls back to comfortable when width is missing or invalid', () => {
    expect(resolveCopilotSurfaceProfile(undefined)).toBe('comfortable');
    expect(resolveCopilotSurfaceProfile(null)).toBe('comfortable');
    expect(resolveCopilotSurfaceProfile(Number.NaN)).toBe('comfortable');
  });
});

describe('Widget destination visibility', () => {
  it('keeps compact and cozy profiles on a progressive compact core-nav layout', () => {
    for (const profile of ['compact', 'cozy'] as const) {
      const visibility = resolveWidgetDestinationVisibility(profile);

      expect(visibility.primaryDestinations).toEqual(CORE_WIDGET_DESTINATIONS);
      expect(visibility.overflowDestinations).toEqual(ADVANCED_WIDGET_DESTINATIONS);
      expect(visibility.useRail).toBe(false);
      expect(visibility.showWorkspaceSheet).toBe(true);
    }
  });

  it('shows the full durable workspace set inline for comfortable widgets', () => {
    const visibility = resolveWidgetDestinationVisibility('comfortable');

    expect(visibility.primaryDestinations).toEqual([
      ...CORE_WIDGET_DESTINATIONS,
      ...ADVANCED_WIDGET_DESTINATIONS,
    ]);
    expect(visibility.overflowDestinations).toEqual([]);
    expect(visibility.useRail).toBe(false);
    expect(visibility.showWorkspaceSheet).toBe(false);
  });

  it('shows every workspace destination in the expanded rail layout', () => {
    const visibility = resolveWidgetDestinationVisibility('expanded');

    expect(visibility.primaryDestinations).toEqual([
      ...CORE_WIDGET_DESTINATIONS,
      ...ADVANCED_WIDGET_DESTINATIONS,
    ]);
    expect(visibility.overflowDestinations).toEqual([]);
    expect(visibility.useRail).toBe(true);
    expect(visibility.showWorkspaceSheet).toBe(false);
  });
});
