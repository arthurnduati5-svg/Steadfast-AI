import { describe, expect, it } from 'vitest';

import type { MediaStreamResponse } from '../lib/types';

import {
  resolveMediaStreamDeckMeta,
  resolveMediaStreamEmptyState,
  resolveMediaStreamMode,
  resolveMediaStreamNotices,
} from '../lib/media-stream/stream-response-contract';

describe('media stream response contract helpers', () => {
  it('normalizes stream mode, notices, deck metadata, and empty state', () => {
    const response = {
      streamMode: 'creative' as const,
      notices: [
        { id: 'seeded', tone: 'seed', message: 'Creative Stream used your saved recap topics to seed discovery.' },
        'Filtered 6 low-quality candidates before ranking.',
      ],
      deck: {
        modeIdentity: 'External discovery engine',
        supportLabel: 'Creative orbit',
        lineupLabel: 'Idea path',
        replenishes: true,
        refillBatchSize: 3,
        seedTopics: ['Neutralisation', 'Acids and bases', 'Neutralisation'],
        sourceHealth: {
          youtubeFetched: true,
          vimeoFetched: false,
          usedCache: true,
        },
      },
      emptyState: {
        title: 'Creative Stream is regrouping',
        body: 'We filtered weak matches to protect quality.',
        hintChips: ['Neutralisation', 'Acids'],
        primaryActionLabel: 'Open Study Stream',
        primaryActionMode: 'study_stream',
      },
    } satisfies Omit<MediaStreamResponse, 'stream'>;

    expect(resolveMediaStreamMode(response, 'study')).toBe('creative');
    expect(resolveMediaStreamNotices(response)).toEqual([
      { id: 'seeded', tone: 'seed', message: 'Creative Stream used your saved recap topics to seed discovery.' },
      { id: 'notice-1', tone: 'info', message: 'Filtered 6 low-quality candidates before ranking.' },
    ]);
    expect(resolveMediaStreamDeckMeta(response, 'creative')).toEqual({
      modeIdentity: 'External discovery engine',
      supportLabel: 'Creative orbit',
      lineupLabel: 'Idea path',
      replenishes: true,
      refillBatchSize: 3,
      seedTopics: ['Neutralisation', 'Acids and bases'],
      sourceHealth: {
        youtubeFetched: true,
        vimeoFetched: false,
        usedCache: true,
      },
    });
    expect(resolveMediaStreamEmptyState(response, 'creative')).toEqual({
      title: 'Creative Stream is regrouping',
      body: 'We filtered weak matches to protect quality.',
      hintChips: ['Neutralisation', 'Acids'],
      primaryActionLabel: 'Open Study Stream',
      primaryActionMode: 'study_stream',
    });
  });

  it('falls back to safe defaults when response metadata is missing', () => {
    expect(resolveMediaStreamMode(null, 'study')).toBe('study');
    expect(resolveMediaStreamNotices(null)).toEqual([]);
    expect(resolveMediaStreamDeckMeta(null, 'study')).toEqual({
      modeIdentity: 'Focused revision lane',
      supportLabel: 'Learning orbit',
      lineupLabel: 'Next in lane',
      replenishes: false,
      refillBatchSize: 0,
      seedTopics: [],
      sourceHealth: null,
    });
    expect(resolveMediaStreamEmptyState(null, 'study')).toEqual({
      title: 'Study Stream is waiting for your first saved recap',
      body: 'Save or generate one revision recap first. Study Stream will then turn it into a calm, one-card-at-a-time revision lane.',
      hintChips: [],
      primaryActionLabel: 'Open Library',
      primaryActionMode: 'library',
    });
    expect(resolveMediaStreamEmptyState(null, 'creative')).toEqual({
      title: 'Creative Stream is waiting for context',
      body: 'Save a few recap assets first, then Creative Stream will blend trusted discovery clips with your weak-topic needs.',
      hintChips: [],
      primaryActionLabel: 'Open Study Stream',
      primaryActionMode: 'study_stream',
    });
  });
});
