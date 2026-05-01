import type {
  FullscreenCopilotDestination,
  FullscreenGrowthSection,
  FullscreenMediaFilter,
  FullscreenModeFlags,
  FullscreenPlusAction,
  MediaWorkspaceMode,
} from '@/lib/types';
import {
  mapDestinationToLegacyTab,
  shouldResetFullscreenPlusAction,
} from '@/lib/fullscreen-workspace-context';

export type WorkspaceRuntimeState = {
  destination: FullscreenCopilotDestination;
  activeLegacyTab: string;
  sidebarExpanded: boolean;
  plusDrawerOpen: boolean;
  activePlusAction: FullscreenPlusAction | null;
  recentFilesModalOpen: boolean;
  modeFlags: FullscreenModeFlags;
  selectedMediaItemId: string | null;
  mediaFilter: FullscreenMediaFilter;
  mediaMode: MediaWorkspaceMode;
  activeGrowthSection: FullscreenGrowthSection;
};

export type WorkspaceMachineEffect =
  | { type: 'open_file_picker'; inputOrigin: 'file_upload'; composerIntent: 'plus_add_files' }
  | { type: 'toggle_recent_files'; open: boolean }
  | { type: 'set_force_web_search'; value: boolean }
  | { type: 'set_research_status'; active: boolean; label: string }
  | { type: 'seed_input_if_empty'; value: string }
  | { type: 'toast'; title: string; description: string };

export type WorkspaceMachineResult = {
  state: WorkspaceRuntimeState;
  effects: WorkspaceMachineEffect[];
};

export const DEFAULT_WORKSPACE_RUNTIME_STATE: WorkspaceRuntimeState = {
  destination: 'new_session',
  activeLegacyTab: 'chat',
  sidebarExpanded: true,
  plusDrawerOpen: false,
  activePlusAction: null,
  recentFilesModalOpen: false,
  modeFlags: {
    focus: false,
    exam: false,
    research: false,
  },
  selectedMediaItemId: null,
  mediaFilter: 'all',
  mediaMode: 'study_stream',
  activeGrowthSection: 'overview',
};

export function resolveWorkspaceDestinationFromLegacyTab(tab: string): FullscreenCopilotDestination {
  if (tab === 'history') return 'search';
  if (tab === 'revision') return 'revision';
  return 'new_session';
}

export function applyWorkspacePlusMenuOpenChange(
  state: WorkspaceRuntimeState,
  isOpen: boolean
): WorkspaceMachineResult {
  return {
    state: {
      ...state,
      plusDrawerOpen: isOpen,
      activePlusAction: isOpen ? null : state.activePlusAction,
    },
    effects: [],
  };
}

export function applyWorkspacePlusAction(
  state: WorkspaceRuntimeState,
  action: FullscreenPlusAction,
  currentInput: string
): WorkspaceMachineResult {
  const nextBase: WorkspaceRuntimeState = {
    ...state,
    activePlusAction: action,
    plusDrawerOpen: false,
  };

  if (action === 'add_files') {
    return {
      state: nextBase,
      effects: [
        {
          type: 'open_file_picker',
          inputOrigin: 'file_upload',
          composerIntent: 'plus_add_files',
        },
      ],
    };
  }

  if (action === 'recent_files') {
    return {
      state: {
        ...nextBase,
        recentFilesModalOpen: true,
      },
      effects: [{ type: 'toggle_recent_files', open: true }],
    };
  }

  if (action === 'focus_mode') {
    return {
      state: {
        ...nextBase,
        destination: 'new_session',
        activeLegacyTab: 'chat',
        recentFilesModalOpen: false,
        modeFlags: {
          ...state.modeFlags,
          focus: true,
          exam: false,
        },
      },
      effects: [
        {
          type: 'toast',
          title: 'Focus mode on',
          description: 'Low-noise support is now active in your current study session.',
        },
      ],
    };
  }

  if (action === 'exam_mode') {
    return {
      state: {
        ...nextBase,
        destination: 'new_session',
        activeLegacyTab: 'chat',
        recentFilesModalOpen: false,
        modeFlags: {
          ...state.modeFlags,
          focus: false,
          exam: true,
        },
      },
      effects: [
        {
          type: 'toast',
          title: 'Exam mode on',
          description: 'Exam-ready strictness is now active in your current study session.',
        },
      ],
    };
  }

  const nextResearchActive = !state.modeFlags.research;
  return {
    state: {
      ...nextBase,
      destination: 'new_session',
      activeLegacyTab: 'chat',
      recentFilesModalOpen: false,
      modeFlags: {
        ...state.modeFlags,
        research: nextResearchActive,
      },
    },
    effects: [
      { type: 'set_force_web_search', value: nextResearchActive },
      { type: 'set_research_status', active: nextResearchActive, label: 'Web research ready' },
      {
        type: 'toast',
        title: nextResearchActive ? 'Web research mode on' : 'Web research mode off',
        description: nextResearchActive
          ? 'Steadfast will use trusted, up-to-date sources on your next answer.'
          : 'Back to local tutoring unless you explicitly request research.',
      },
      ...(nextResearchActive && !String(currentInput || '').trim()
        ? [
            {
              type: 'seed_input_if_empty' as const,
              value: 'Research this topic with trusted up-to-date sources and explain it simply.',
            },
          ]
        : []),
    ],
  };
}

export function applyWorkspaceDestinationChange(
  state: WorkspaceRuntimeState,
  destination: FullscreenCopilotDestination
): WorkspaceMachineResult {
  const modeDestination = destination === 'exam' || destination === 'focus' ? destination : null;
  const resolvedDestination: FullscreenCopilotDestination = modeDestination ? 'new_session' : destination;
  const nextModeFlags = modeDestination
    ? {
        ...state.modeFlags,
        exam: modeDestination === 'exam',
        focus: modeDestination === 'focus',
      }
    : state.modeFlags;

  const nextState: WorkspaceRuntimeState = {
    ...state,
    destination: resolvedDestination,
    activeLegacyTab: mapDestinationToLegacyTab(resolvedDestination, state.activeLegacyTab),
    plusDrawerOpen: false,
    recentFilesModalOpen: false,
    modeFlags: nextModeFlags,
    activePlusAction: modeDestination
      ? modeDestination === 'exam'
        ? 'exam_mode'
        : 'focus_mode'
      : shouldResetFullscreenPlusAction(resolvedDestination)
        ? null
        : state.activePlusAction,
  };

  return {
    state: nextState,
    effects: [],
  };
}

export function resetWorkspaceForNewSession(
  state: WorkspaceRuntimeState
): WorkspaceMachineResult {
  return {
    state: {
      ...state,
      destination: 'new_session',
      activeLegacyTab: 'chat',
      plusDrawerOpen: false,
      activePlusAction: null,
      recentFilesModalOpen: false,
      modeFlags: {
        focus: false,
        exam: false,
        research: false,
      },
      selectedMediaItemId: null,
      mediaFilter: 'all',
      mediaMode: 'study_stream',
      activeGrowthSection: 'overview',
    },
    effects: [
      { type: 'set_force_web_search', value: false },
      { type: 'set_research_status', active: false, label: 'Web research ready' },
    ],
  };
}
