import type {
  MediaStreamDeckMeta,
  MediaStreamEmptyState,
  MediaStreamNotice,
  MediaStreamResponse,
  MediaWorkspaceMode,
} from '@/lib/types';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function compactText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  return normalized.length > maxLength ? `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...` : normalized;
}

function compactTopics(value: unknown, limit = 4): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => compactText(entry, 48))
    .filter((entry): entry is string => Boolean(entry))
    .filter((entry, index, all) => all.findIndex((candidate) => candidate.toLowerCase() === entry.toLowerCase()) === index)
    .slice(0, limit);
}

export function resolveMediaStreamMode(
  response: Pick<MediaStreamResponse, 'streamMode'> | null | undefined,
  fallbackMode: 'study' | 'creative'
): 'study' | 'creative' {
  return response?.streamMode === 'creative' ? 'creative' : fallbackMode;
}

export function resolveMediaStreamNotices(
  response: Pick<MediaStreamResponse, 'notices'> | null | undefined
): MediaStreamNotice[] {
  const notices = Array.isArray(response?.notices) ? response.notices : [];
  return notices.reduce<MediaStreamNotice[]>((resolved, notice, index) => {
    let parsed: MediaStreamNotice | null = null;
    if (typeof notice === 'string') {
      const message = compactText(notice, 220);
      parsed = message
        ? {
            id: `notice-${index}`,
            tone: 'info',
            message,
          }
        : null;
    } else {
      const record = asRecord(notice);
      if (!record) return resolved;
      const message = compactText(record.message, 220);
      if (!message) return resolved;
      const tone = compactText(record.tone, 16);
      parsed = {
        id: compactText(record.id, 48) || `notice-${index}`,
        tone: tone === 'quality' || tone === 'seed' || tone === 'refresh' ? tone : 'info',
        message,
      };
    }
    if (parsed) {
      resolved.push(parsed);
    }
    return resolved;
  }, []);
}

export function resolveMediaStreamDeckMeta(
  response: Pick<MediaStreamResponse, 'deck'> | null | undefined,
  fallbackMode: 'study' | 'creative'
): MediaStreamDeckMeta {
  const deck = asRecord(response?.deck);
  if (!deck) {
    return {
      modeIdentity: fallbackMode === 'creative' ? 'External discovery engine' : 'Focused revision lane',
      supportLabel: fallbackMode === 'creative' ? 'Creative orbit' : 'Learning orbit',
      lineupLabel: fallbackMode === 'creative' ? 'Idea path' : 'Next in lane',
      replenishes: fallbackMode === 'creative',
      refillBatchSize: fallbackMode === 'creative' ? 3 : 0,
      seedTopics: [],
      sourceHealth: null,
    };
  }

  const sourceHealthRecord = asRecord(deck.sourceHealth);
  return {
    modeIdentity:
      compactText(deck.modeIdentity, 120) ||
      (fallbackMode === 'creative' ? 'External discovery engine' : 'Focused revision lane'),
    supportLabel:
      compactText(deck.supportLabel, 40) ||
      (fallbackMode === 'creative' ? 'Creative orbit' : 'Learning orbit'),
    lineupLabel:
      compactText(deck.lineupLabel, 40) ||
      (fallbackMode === 'creative' ? 'Idea path' : 'Next in lane'),
    replenishes: deck.replenishes === true || (deck.replenishes !== false && fallbackMode === 'creative'),
    refillBatchSize:
      typeof deck.refillBatchSize === 'number' && Number.isFinite(deck.refillBatchSize)
        ? Math.max(0, Math.round(deck.refillBatchSize))
        : fallbackMode === 'creative'
          ? 3
          : 0,
    seedTopics: compactTopics(deck.seedTopics),
    sourceHealth: sourceHealthRecord
      ? {
          youtubeFetched: sourceHealthRecord.youtubeFetched === true,
          vimeoFetched: sourceHealthRecord.vimeoFetched === true,
          usedCache: sourceHealthRecord.usedCache === true,
        }
      : null,
  };
}

export function resolveMediaStreamEmptyState(
  response: Pick<MediaStreamResponse, 'emptyState'> | null | undefined,
  fallbackMode: 'study' | 'creative'
): MediaStreamEmptyState {
  const emptyState = asRecord(response?.emptyState);
  if (!emptyState) {
    return fallbackMode === 'creative'
      ? {
          title: 'Creative Stream is waiting for context',
          body: 'Save a few recap assets first, then Creative Stream will blend trusted discovery clips with your weak-topic needs.',
          hintChips: [],
          primaryActionLabel: 'Open Study Stream',
          primaryActionMode: 'study_stream',
        }
      : {
          title: 'Study Stream is waiting for your first saved recap',
          body: 'Save or generate one revision recap first. Study Stream will then turn it into a calm, one-card-at-a-time revision lane.',
          hintChips: [],
          primaryActionLabel: 'Open Library',
          primaryActionMode: 'library',
        };
  }

  const primaryActionMode = compactText(emptyState.primaryActionMode, 32) as MediaWorkspaceMode | null;
  return {
    title:
      compactText(emptyState.title, 80) ||
      (fallbackMode === 'creative' ? 'Creative Stream is waiting for context' : 'Study Stream is waiting for your first saved recap'),
    body:
      compactText(emptyState.body, 220) ||
      (fallbackMode === 'creative'
        ? 'Save a few recap assets first, then Creative Stream will blend trusted discovery clips with your weak-topic needs.'
        : 'Save or generate one revision recap first. Study Stream will then turn it into a calm, one-card-at-a-time revision lane.'),
    hintChips: compactTopics(emptyState.hintChips),
    primaryActionLabel: compactText(emptyState.primaryActionLabel, 36),
    primaryActionMode:
      primaryActionMode === 'study_stream' || primaryActionMode === 'creative_stream' || primaryActionMode === 'library'
        ? primaryActionMode
        : null,
  };
}
