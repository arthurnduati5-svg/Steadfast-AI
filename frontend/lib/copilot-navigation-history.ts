import type { FullscreenCopilotDestination } from '@/lib/types';

export type CopilotNavigationTab = 'chat' | 'history' | 'revision';
export type CopilotNavigationView = 'chat' | 'preferences' | 'practice_pad';

export type CopilotNavigationSnapshot = {
  isOpen: boolean;
  isFullscreen: boolean;
  view: CopilotNavigationView;
  activeTab: CopilotNavigationTab;
  destination: FullscreenCopilotDestination;
  revisionOverlayOpen: boolean;
};

export const COPILOT_NAV_HISTORY_STATE_KEY = '__steadfastCopilotNav';

const VALID_TABS = new Set<CopilotNavigationTab>(['chat', 'history', 'revision']);
const VALID_VIEWS = new Set<CopilotNavigationView>(['chat', 'preferences', 'practice_pad']);
const VALID_DESTINATIONS = new Set<FullscreenCopilotDestination>([
  'new_session',
  'search',
  'revision',
  'media',
  'exam',
  'focus',
  'growth',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeCopilotTab(value: unknown): CopilotNavigationTab {
  return VALID_TABS.has(value as CopilotNavigationTab) ? (value as CopilotNavigationTab) : 'chat';
}

export function normalizeCopilotView(value: unknown): CopilotNavigationView {
  return VALID_VIEWS.has(value as CopilotNavigationView) ? (value as CopilotNavigationView) : 'chat';
}

export function normalizeCopilotDestination(value: unknown): FullscreenCopilotDestination {
  return VALID_DESTINATIONS.has(value as FullscreenCopilotDestination)
    ? (value as FullscreenCopilotDestination)
    : 'new_session';
}

export function buildCopilotNavigationSnapshot(args: {
  isOpen: boolean;
  isFullscreen: boolean;
  view: unknown;
  activeTab: unknown;
  destination: unknown;
  revisionOverlayOpen: boolean;
}): CopilotNavigationSnapshot {
  const activeTab = normalizeCopilotTab(args.activeTab);
  const view = normalizeCopilotView(args.view);
  const destination = normalizeCopilotDestination(args.destination);
  const isFullscreen = Boolean(args.isFullscreen);
  const isOpen = isFullscreen ? true : Boolean(args.isOpen);

  return {
    isOpen,
    isFullscreen,
    view,
    activeTab,
    destination,
    revisionOverlayOpen: activeTab === 'revision' ? Boolean(args.revisionOverlayOpen) : false,
  };
}

export function createCopilotHistoryState(
  baseState: unknown,
  snapshot: CopilotNavigationSnapshot
): Record<string, unknown> {
  const base = isRecord(baseState) ? baseState : {};
  return {
    ...base,
    [COPILOT_NAV_HISTORY_STATE_KEY]: snapshot,
  };
}

export function readCopilotNavigationSnapshotFromHistoryState(
  state: unknown
): CopilotNavigationSnapshot | null {
  if (!isRecord(state)) return null;
  const raw = state[COPILOT_NAV_HISTORY_STATE_KEY];
  if (!isRecord(raw)) return null;
  return buildCopilotNavigationSnapshot({
    isOpen: Boolean(raw.isOpen),
    isFullscreen: Boolean(raw.isFullscreen),
    view: raw.view,
    activeTab: raw.activeTab,
    destination: raw.destination,
    revisionOverlayOpen: Boolean(raw.revisionOverlayOpen),
  });
}

export function serializeCopilotNavigationSnapshot(snapshot: CopilotNavigationSnapshot): string {
  return [
    snapshot.isOpen ? '1' : '0',
    snapshot.isFullscreen ? '1' : '0',
    snapshot.view,
    snapshot.activeTab,
    snapshot.destination,
    snapshot.revisionOverlayOpen ? '1' : '0',
  ].join('|');
}
