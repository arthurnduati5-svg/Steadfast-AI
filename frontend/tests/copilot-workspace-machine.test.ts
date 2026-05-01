import { describe, expect, it } from 'vitest';
import {
  applyWorkspaceDestinationChange,
  applyWorkspacePlusAction,
  DEFAULT_WORKSPACE_RUNTIME_STATE,
  resetWorkspaceForNewSession,
} from '@/lib/copilot-workspace-machine';

function buildRuntimeState() {
  return {
    ...DEFAULT_WORKSPACE_RUNTIME_STATE,
    plusDrawerOpen: true,
    activePlusAction: 'recent_files' as const,
    recentFilesModalOpen: false,
    selectedMediaItemId: 'media-1',
    mediaFilter: 'video' as const,
    mediaMode: 'creative_stream' as const,
    activeGrowthSection: 'weak_topics' as const,
  };
}

describe('Workspace machine plus action parity', () => {
  it('opens recent files without redirecting away from the current destination', () => {
    const result = applyWorkspacePlusAction(
      {
        ...buildRuntimeState(),
        destination: 'media',
        activeLegacyTab: 'chat',
      },
      'recent_files',
      ''
    );

    expect(result.state.destination).toBe('media');
    expect(result.state.recentFilesModalOpen).toBe(true);
    expect(result.state.plusDrawerOpen).toBe(false);
    expect(result.state.activePlusAction).toBe('recent_files');
    expect(result.effects).toEqual([{ type: 'toggle_recent_files', open: true }]);
  });

  it('routes add files through the shared file-picker effect', () => {
    const result = applyWorkspacePlusAction(buildRuntimeState(), 'add_files', '');

    expect(result.state.activePlusAction).toBe('add_files');
    expect(result.state.plusDrawerOpen).toBe(false);
    expect(result.effects).toEqual([
      {
        type: 'open_file_picker',
        inputOrigin: 'file_upload',
        composerIntent: 'plus_add_files',
      },
    ]);
  });

  it('activates focus mode on the shared chat destination', () => {
    const result = applyWorkspacePlusAction(buildRuntimeState(), 'focus_mode', '');

    expect(result.state.destination).toBe('new_session');
    expect(result.state.activeLegacyTab).toBe('chat');
    expect(result.state.modeFlags.focus).toBe(true);
    expect(result.state.modeFlags.exam).toBe(false);
    expect(result.state.activePlusAction).toBe('focus_mode');
    expect(result.effects).toContainEqual({
      type: 'toast',
      title: 'Focus mode on',
      description: 'Low-noise support is now active in your current study session.',
    });
  });

  it('activates exam mode on the shared chat destination', () => {
    const result = applyWorkspacePlusAction(buildRuntimeState(), 'exam_mode', '');

    expect(result.state.destination).toBe('new_session');
    expect(result.state.activeLegacyTab).toBe('chat');
    expect(result.state.modeFlags.exam).toBe(true);
    expect(result.state.modeFlags.focus).toBe(false);
    expect(result.state.activePlusAction).toBe('exam_mode');
    expect(result.effects).toContainEqual({
      type: 'toast',
      title: 'Exam mode on',
      description: 'Exam-ready strictness is now active in your current study session.',
    });
  });

  it('toggles web research through shared force-search and status effects', () => {
    const result = applyWorkspacePlusAction(buildRuntimeState(), 'web_research', '');

    expect(result.state.destination).toBe('new_session');
    expect(result.state.activeLegacyTab).toBe('chat');
    expect(result.state.modeFlags.research).toBe(true);
    expect(result.state.activePlusAction).toBe('web_research');
    expect(result.effects).toContainEqual({ type: 'set_force_web_search', value: true });
    expect(result.effects).toContainEqual({
      type: 'set_research_status',
      active: true,
      label: 'Web research ready',
    });
    expect(result.effects).toContainEqual({
      type: 'seed_input_if_empty',
      value: 'Research this topic with trusted up-to-date sources and explain it simply.',
    });
  });

  it('does not reseed input when research toggles on from an already-populated composer', () => {
    const result = applyWorkspacePlusAction(buildRuntimeState(), 'web_research', 'Already typing');

    expect(result.effects.find((effect) => effect.type === 'seed_input_if_empty')).toBeUndefined();
  });
});

describe('Workspace machine destination and reset behavior', () => {
  it('resolves focus and exam destinations back to the shared new session surface', () => {
    const focusResult = applyWorkspaceDestinationChange(buildRuntimeState(), 'focus');
    expect(focusResult.state.destination).toBe('new_session');
    expect(focusResult.state.modeFlags.focus).toBe(true);
    expect(focusResult.state.modeFlags.exam).toBe(false);
    expect(focusResult.state.activePlusAction).toBe('focus_mode');

    const examResult = applyWorkspaceDestinationChange(buildRuntimeState(), 'exam');
    expect(examResult.state.destination).toBe('new_session');
    expect(examResult.state.modeFlags.exam).toBe(true);
    expect(examResult.state.modeFlags.focus).toBe(false);
    expect(examResult.state.activePlusAction).toBe('exam_mode');
  });

  it('resets workspace shell state for a fresh study session', () => {
    const result = resetWorkspaceForNewSession({
      ...buildRuntimeState(),
      destination: 'growth',
      modeFlags: {
        focus: true,
        exam: true,
        research: true,
      },
      recentFilesModalOpen: true,
    });

    expect(result.state).toMatchObject({
      destination: 'new_session',
      activeLegacyTab: 'chat',
      plusDrawerOpen: false,
      activePlusAction: null,
      recentFilesModalOpen: false,
      selectedMediaItemId: null,
      mediaFilter: 'all',
      mediaMode: 'study_stream',
      activeGrowthSection: 'overview',
      modeFlags: {
        focus: false,
        exam: false,
        research: false,
      },
    });
    expect(result.effects).toContainEqual({ type: 'set_force_web_search', value: false });
    expect(result.effects).toContainEqual({
      type: 'set_research_status',
      active: false,
      label: 'Web research ready',
    });
  });
});
