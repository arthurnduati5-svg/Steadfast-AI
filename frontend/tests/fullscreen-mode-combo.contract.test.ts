import { describe, expect, it } from 'vitest';
import {
  buildWorkspaceContextPayload,
  resolveActiveDestinationForPayload,
  resolveFullscreenStudyMode,
} from '@/lib/fullscreen-workspace-context';
import type { FullscreenModeFlags } from '@/lib/types';

describe('Fullscreen mode combinations payload contract', () => {
  it('resolves study mode from focus/exam permutations', () => {
    expect(resolveFullscreenStudyMode({ focus: false, exam: false })).toBe('standard');
    expect(resolveFullscreenStudyMode({ focus: true, exam: false })).toBe('focus');
    expect(resolveFullscreenStudyMode({ focus: false, exam: true })).toBe('exam');
    expect(resolveFullscreenStudyMode({ focus: true, exam: true })).toBe('exam');
  });

  it('builds workspace payload mode flags for all Focus/Exam/Research combinations', () => {
    const bool = [false, true] as const;
    for (const focus of bool) {
      for (const exam of bool) {
        for (const research of bool) {
          const modeFlags: FullscreenModeFlags = { focus, exam, research };
          const payload = buildWorkspaceContextPayload({
            isFullscreen: true,
            fullscreenDestination: 'new_session',
            activeTab: 'chat',
            studyMode: resolveFullscreenStudyMode(modeFlags),
            modeFlags,
            forceWebSearch: false,
            activePlusAction: null,
            plusDrawerOpen: false,
            sidebarExpanded: true,
            selectedRevisionCollectionId: null,
            selectedRevisionItemId: null,
            selectedMediaItemId: null,
            activeMediaFilter: 'all',
            activeGrowthSection: 'overview',
            chatSessionId: 'sess-1',
            historySearchQuery: '',
            revisionSearchQuery: '',
          });

          expect(payload.modeFlags).toEqual({
            focus,
            exam,
            research,
          });
          expect(payload.surfaceKind).toBe('fullscreen');
          expect(payload.surfaceProfile).toBe('expanded');
          expect(payload.navigationStyle).toBe('progressive_compact');
          expect(payload.researchModeRequested).toBe(research);
        }
      }
    }
  });

  it('keeps research mode true in payload when forceWebSearch is enabled', () => {
    const payload = buildWorkspaceContextPayload({
      isFullscreen: true,
      fullscreenDestination: 'new_session',
      activeTab: 'chat',
      studyMode: 'standard',
      modeFlags: { focus: false, exam: false, research: false },
      forceWebSearch: true,
      activePlusAction: 'web_research',
      plusDrawerOpen: false,
      sidebarExpanded: true,
      selectedRevisionCollectionId: null,
      selectedRevisionItemId: null,
      selectedMediaItemId: null,
      activeMediaFilter: 'all',
      activeGrowthSection: 'overview',
      chatSessionId: 'sess-2',
      historySearchQuery: '',
      revisionSearchQuery: '',
    });

    expect(payload.modeFlags?.research).toBe(true);
    expect(payload.researchModeRequested).toBe(true);
    expect(payload.surfaceKind).toBe('fullscreen');
    expect(payload.surfaceProfile).toBe('expanded');
  });

  it('maps non-fullscreen tabs to stable destination payloads', () => {
    expect(
      resolveActiveDestinationForPayload({
        isFullscreen: false,
        fullscreenDestination: 'media',
        activeTab: 'chat',
      })
    ).toBe('new_session');
    expect(
      resolveActiveDestinationForPayload({
        isFullscreen: false,
        fullscreenDestination: 'media',
        activeTab: 'history',
      })
    ).toBe('search');
    expect(
      resolveActiveDestinationForPayload({
        isFullscreen: false,
        fullscreenDestination: 'growth',
        activeTab: 'revision',
      })
    ).toBe('revision');
  });

  it('preserves advanced workspace destinations when the widget shell sends the shared surface contract', () => {
    const payload = buildWorkspaceContextPayload({
      isFullscreen: false,
      surfaceKind: 'widget',
      surfaceProfile: 'compact',
      navigationStyle: 'progressive_compact',
      fullscreenDestination: 'media',
      activeTab: 'chat',
      studyMode: 'standard',
      modeFlags: { focus: false, exam: false, research: false },
      forceWebSearch: false,
      activePlusAction: null,
      plusDrawerOpen: false,
      sidebarExpanded: false,
      selectedRevisionCollectionId: null,
      selectedRevisionItemId: null,
      selectedMediaItemId: 'media-1',
      activeMediaFilter: 'all',
      activeMediaMode: 'study_stream',
      activeGrowthSection: 'overview',
      chatSessionId: 'sess-widget',
      historySearchQuery: '',
      revisionSearchQuery: '',
    });

    expect(payload.activeDestination).toBe('media');
    expect(payload.surfaceKind).toBe('widget');
    expect(payload.surfaceProfile).toBe('compact');
    expect(payload.navigationStyle).toBe('progressive_compact');
  });
});
