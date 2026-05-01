import { describe, expect, it } from 'vitest';
import {
  buildCopilotNavigationSnapshot,
  COPILOT_NAV_HISTORY_STATE_KEY,
  createCopilotHistoryState,
  readCopilotNavigationSnapshotFromHistoryState,
  serializeCopilotNavigationSnapshot,
} from '@/lib/copilot-navigation-history';

describe('Copilot browser navigation snapshot helpers', () => {
  it('normalizes unsupported tab/view/destination values to safe defaults', () => {
    const snapshot = buildCopilotNavigationSnapshot({
      isOpen: false,
      isFullscreen: true,
      view: 'unknown_view',
      activeTab: 'notes',
      destination: 'unknown_destination',
      revisionOverlayOpen: true,
    });

    expect(snapshot).toEqual({
      isOpen: true,
      isFullscreen: true,
      view: 'chat',
      activeTab: 'chat',
      destination: 'new_session',
      revisionOverlayOpen: false,
    });
  });

  it('round-trips snapshot data through browser history state', () => {
    const snapshot = buildCopilotNavigationSnapshot({
      isOpen: true,
      isFullscreen: false,
      view: 'preferences',
      activeTab: 'revision',
      destination: 'revision',
      revisionOverlayOpen: true,
    });

    const state = createCopilotHistoryState({ as: '/', url: '/' }, snapshot);
    expect(state.as).toBe('/');
    expect(state.url).toBe('/');
    expect(state[COPILOT_NAV_HISTORY_STATE_KEY]).toEqual(snapshot);

    const restored = readCopilotNavigationSnapshotFromHistoryState(state);
    expect(restored).toEqual(snapshot);
  });

  it('ignores state entries that do not contain copilot navigation payload', () => {
    expect(readCopilotNavigationSnapshotFromHistoryState({ as: '/', url: '/' })).toBeNull();
    expect(readCopilotNavigationSnapshotFromHistoryState(null)).toBeNull();
  });

  it('produces stable snapshot serialization keys for dedupe checks', () => {
    const first = buildCopilotNavigationSnapshot({
      isOpen: true,
      isFullscreen: false,
      view: 'chat',
      activeTab: 'history',
      destination: 'search',
      revisionOverlayOpen: false,
    });
    const second = buildCopilotNavigationSnapshot({
      ...first,
    });

    expect(serializeCopilotNavigationSnapshot(first)).toBe(
      serializeCopilotNavigationSnapshot(second)
    );
  });
});
