import { describe, expect, it } from 'vitest';

import {
  buildStudySequenceKey,
  dedupeStudySequenceItems,
  pickUpcomingStudyLineup,
  type StudySequenceEntryLike,
} from '@/lib/media-stream/study-stream-sequencing';

function makeItem(overrides: Partial<StudySequenceEntryLike> & { entry: StudySequenceEntryLike['entry'] }): StudySequenceEntryLike {
  return {
    entry: overrides.entry,
    rankScore: overrides.rankScore ?? 100,
    reason: overrides.reason ?? 'Useful revisit',
    nextMove: overrides.nextMove ?? 'Run one quick check',
    quickCheck: overrides.quickCheck ?? 'What changes the answer here?',
    studyGuide: overrides.studyGuide ?? null,
  };
}

describe('study stream sequencing helpers', () => {
  it('uses revision linkage as the strongest dedupe key', () => {
    const key = buildStudySequenceKey(
      makeItem({
        entry: {
          id: 'asset-1',
          title: 'Linear equations recap',
          revisionItemId: 'rev-1',
          topic: 'Linear equations',
          mediaKind: 'video',
        },
      })
    );

    expect(key).toBe('revision:rev-1');
  });

  it('dedupes repeated study items while preserving order', () => {
    const items = [
      makeItem({
        entry: { id: 'a', title: 'Linear equations recap', topic: 'Linear equations', revisionItemId: 'rev-1', mediaKind: 'video' },
      }),
      makeItem({
        entry: { id: 'b', title: 'Linear equations audio', topic: 'Linear equations', revisionItemId: 'rev-1', mediaKind: 'audio' },
      }),
      makeItem({
        entry: { id: 'c', title: 'Negative signs rescue', topic: 'Negative signs', revisionItemId: 'rev-2', mediaKind: 'video' },
      }),
    ];

    expect(dedupeStudySequenceItems(items).map((item) => item.entry.id)).toEqual(['a', 'c']);
  });

  it('returns a compact deduped lineup after the active card', () => {
    const items = [
      makeItem({
        entry: { id: 'active', title: 'Current recap', topic: 'Linear equations', revisionItemId: 'rev-1', mediaKind: 'video' },
      }),
      makeItem({
        entry: { id: 'dup', title: 'Current recap audio', topic: 'Linear equations', revisionItemId: 'rev-1', mediaKind: 'audio' },
      }),
      makeItem({
        entry: { id: 'next-1', title: 'Sign-check rescue', topic: 'Sign errors', revisionItemId: 'rev-2', mediaKind: 'video' },
      }),
      makeItem({
        entry: { id: 'next-2', title: 'Word-problem recap', topic: 'Word problems', revisionItemId: 'rev-3', mediaKind: 'video' },
      }),
      makeItem({
        entry: { id: 'next-3', title: 'Balance method audio', topic: 'Balance method', revisionItemId: 'rev-4', mediaKind: 'audio' },
      }),
    ];

    expect(pickUpcomingStudyLineup(items, 0, 3).map((item) => item.entry.id)).toEqual(['next-1', 'next-2', 'next-3']);
  });
});
