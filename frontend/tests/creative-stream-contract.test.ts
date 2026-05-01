import { describe, expect, it } from 'vitest';

import {
  mapCreativeContractActionToMediaInteraction,
  parseCreativeContractInteraction,
  resolveCreativeContractRole,
  resolveCreativeContractSourceType,
  resolveCreativeContractTrustLabel,
} from '../lib/media-stream/creative-stream-contract';

describe('creative stream contract helpers', () => {
  it('parses backend interaction metadata into a frontend-safe interaction model', () => {
    const interaction = parseCreativeContractInteraction({
      interaction: {
        overline: 'TRY THIS ANGLE',
        overlayText: 'Instead of asking what disappears, ask what gets rearranged.',
        primaryAction: {
          id: 'what_changed',
          label: 'What changed?',
        },
        secondaryActions: [
          { id: 'more_like_this', label: 'More like this' },
          { id: 'save_to_revision', label: 'Save idea' },
          { id: 'open_longer_lesson', label: 'Longer version' },
          { id: 'save_to_revision', label: 'Duplicate should drop' },
          { id: 'invalid_action', label: 'Ignore me' },
        ],
        nextCueTitle: 'Next idea',
        nextCueBody: 'See how the same pattern shows up in salt formation.',
      },
    });

    expect(interaction).toEqual({
      overline: 'TRY THIS ANGLE',
      overlayText: 'Instead of asking what disappears, ask what gets rearranged.',
      primaryAction: {
        id: 'what_changed',
        label: 'What changed?',
      },
      secondaryActions: [
        { id: 'more_like_this', label: 'More like this' },
        { id: 'save_to_revision', label: 'Save idea' },
        { id: 'open_longer_lesson', label: 'Longer version' },
      ],
      nextCueTitle: 'Next idea',
      nextCueBody: 'See how the same pattern shows up in salt formation.',
    });
  });

  it('resolves creative provider, role, and trust labels from normalized metadata', () => {
    const metadata = {
      externalProvider: 'youtube',
      externalRole: 'reframe',
      trustTier: 'high',
    };

    expect(
      resolveCreativeContractSourceType({
        videoProvider: null,
        sourceUrl: 'https://www.youtube.com/watch?v=abc123',
        metadata,
      })
    ).toBe('youtube');
    expect(resolveCreativeContractRole(metadata)).toBe('reframe');
    expect(resolveCreativeContractTrustLabel({ sourceType: 'youtube', metadata })).toBe('YouTube high trust');
  });

  it('maps creative contract actions onto supported media interaction events', () => {
    expect(mapCreativeContractActionToMediaInteraction('save_to_revision')).toBe('save_to_revision');
    expect(mapCreativeContractActionToMediaInteraction('more_like_this')).toBe('show_more_like_this');
    expect(mapCreativeContractActionToMediaInteraction('open_longer_lesson')).toBe('open_long_lesson');
    expect(mapCreativeContractActionToMediaInteraction('what_changed')).toBe('explain_simply');
    expect(mapCreativeContractActionToMediaInteraction('try_new_angle')).toBe('similar_topic');
  });
});
