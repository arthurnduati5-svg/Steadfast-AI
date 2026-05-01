import type {
  CopilotNavigationStyle,
  CopilotSurfaceKind,
  CopilotSurfaceProfile,
  FullscreenCopilotDestination,
  FullscreenGrowthSection,
  FullscreenMediaFilter,
  MediaWorkspaceMode,
  FullscreenModeFlags,
  FullscreenPlusAction,
  FullscreenStudyMode,
  FullscreenWorkspaceContext,
} from '@/lib/types';

export function resolveFullscreenStudyMode(modeFlags: Pick<FullscreenModeFlags, 'focus' | 'exam'>): FullscreenStudyMode {
  if (modeFlags.focus) {
    return modeFlags.exam ? 'exam' : 'focus';
  }
  if (modeFlags.exam) {
    return 'exam';
  }
  return 'standard';
}

export function resolveActiveDestinationForPayload(args: {
  isFullscreen: boolean;
  surfaceKind?: CopilotSurfaceKind;
  fullscreenDestination: FullscreenCopilotDestination;
  activeTab: string;
}): FullscreenCopilotDestination {
  if (args.isFullscreen || args.surfaceKind === 'widget') return args.fullscreenDestination;
  if (args.activeTab === 'history') return 'search';
  if (args.activeTab === 'revision') return 'revision';
  return 'new_session';
}

export function mapDestinationToLegacyTab(
  destination: FullscreenCopilotDestination,
  currentTab: string
): string {
  if (destination === 'new_session') return 'chat';
  if (destination === 'search') return 'history';
  if (destination === 'revision') return 'revision';
  if (destination === 'exam' || destination === 'focus') return 'chat';
  return currentTab;
}

export function shouldResetFullscreenPlusAction(destination: FullscreenCopilotDestination): boolean {
  return destination !== 'new_session';
}

export interface BuildWorkspaceContextPayloadArgs {
  isFullscreen: boolean;
  fullscreenDestination: FullscreenCopilotDestination;
  activeTab: string;
  surfaceKind?: CopilotSurfaceKind;
  surfaceProfile?: CopilotSurfaceProfile;
  navigationStyle?: CopilotNavigationStyle;
  studyMode: FullscreenStudyMode;
  modeFlags: FullscreenModeFlags;
  forceWebSearch: boolean;
  activePlusAction: FullscreenPlusAction | null;
  plusDrawerOpen: boolean;
  sidebarExpanded: boolean;
  selectedRevisionCollectionId?: string | null;
  selectedRevisionItemId?: string | null;
  selectedMediaItemId?: string | null;
  activeMediaFilter: FullscreenMediaFilter;
  activeMediaMode?: MediaWorkspaceMode;
  activeGrowthSection: FullscreenGrowthSection;
  chatSessionId: string;
  historySearchQuery: string;
  revisionSearchQuery: string;
}

export function buildWorkspaceContextPayload(
  args: BuildWorkspaceContextPayloadArgs
): FullscreenWorkspaceContext {
  const effectiveResearchFlag = args.forceWebSearch || args.modeFlags.research;
  const surfaceKind = args.surfaceKind || (args.isFullscreen ? 'fullscreen' : 'widget');
  const surfaceProfile = args.surfaceProfile || (surfaceKind === 'fullscreen' ? 'expanded' : 'comfortable');
  const navigationStyle = args.navigationStyle || 'progressive_compact';
  const activeDestination = resolveActiveDestinationForPayload({
    isFullscreen: args.isFullscreen,
    surfaceKind,
    fullscreenDestination: args.fullscreenDestination,
    activeTab: args.activeTab,
  });

  return {
    activeDestination,
    studyMode: args.studyMode,
    surfaceKind,
    surfaceProfile,
    navigationStyle,
    modeFlags: {
      focus: args.modeFlags.focus,
      exam: args.modeFlags.exam,
      research: effectiveResearchFlag,
    },
    plusAction: args.activePlusAction,
    plusDrawerOpen: args.plusDrawerOpen,
    sidebarExpanded: args.sidebarExpanded,
    researchModeRequested: effectiveResearchFlag,
    revisionCollectionId: args.selectedRevisionCollectionId || null,
    revisionItemId: args.selectedRevisionItemId || null,
    mediaItemId: args.selectedMediaItemId || null,
    mediaFilter: args.activeMediaFilter,
    ...(args.activeMediaMode ? { mediaMode: args.activeMediaMode } : {}),
    growthSection: args.activeGrowthSection,
    chatSessionId: args.chatSessionId,
    historySearchQuery: args.historySearchQuery,
    revisionSearchQuery: args.revisionSearchQuery,
  };
}
