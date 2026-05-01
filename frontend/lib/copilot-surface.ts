import type {
  CopilotNavigationStyle,
  CopilotSurfaceProfile,
  FullscreenCopilotDestination,
} from '@/lib/types';

export const DEFAULT_WIDGET_NAVIGATION_STYLE: CopilotNavigationStyle = 'progressive_compact';

export const CORE_WIDGET_DESTINATIONS: FullscreenCopilotDestination[] = [
  'new_session',
  'revision',
  'media',
];

export const ADVANCED_WIDGET_DESTINATIONS: FullscreenCopilotDestination[] = [
  'growth',
];

export type WidgetDestinationVisibility = {
  profile: CopilotSurfaceProfile;
  primaryDestinations: FullscreenCopilotDestination[];
  overflowDestinations: FullscreenCopilotDestination[];
  useRail: boolean;
  showWorkspaceSheet: boolean;
};

export function resolveCopilotSurfaceProfile(width: number | null | undefined): CopilotSurfaceProfile {
  if (!Number.isFinite(width)) return 'comfortable';
  if (Number(width) < 360) return 'compact';
  if (Number(width) < 520) return 'cozy';
  if (Number(width) < 840) return 'comfortable';
  return 'expanded';
}

export function resolveWidgetDestinationVisibility(
  profile: CopilotSurfaceProfile
): WidgetDestinationVisibility {
  if (profile === 'expanded') {
    return {
      profile,
      primaryDestinations: [...CORE_WIDGET_DESTINATIONS, ...ADVANCED_WIDGET_DESTINATIONS],
      overflowDestinations: [],
      useRail: true,
      showWorkspaceSheet: false,
    };
  }

  if (profile === 'comfortable') {
    return {
      profile,
      primaryDestinations: [...CORE_WIDGET_DESTINATIONS, ...ADVANCED_WIDGET_DESTINATIONS],
      overflowDestinations: [],
      useRail: false,
      showWorkspaceSheet: false,
    };
  }

  return {
    profile,
    primaryDestinations: [...CORE_WIDGET_DESTINATIONS],
    overflowDestinations: [...ADVANCED_WIDGET_DESTINATIONS],
    useRail: false,
    showWorkspaceSheet: true,
  };
}
