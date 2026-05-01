import { describe, expect, it, vi } from 'vitest';
import { createRecapGenerationService } from './recapGenerationService';

const makeAsset = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'asset-1',
    userId: 'student-1',
    assetKind: 'audio_recap',
    title: 'Audio recap',
    summary: 'Summary',
    subject: 'math',
    topic: 'linear equations',
    tags: [],
    language: 'english',
    sessionId: null,
    revisionItemId: null,
    sourceUrl: null,
    videoId: null,
    dataUrl: 'data:audio/mpeg;base64,ZmFrZQ==',
    assetUrl: null,
    thumbnailUrl: null,
    durationSec: 12,
    recapText: 'Recap text',
    keyPoints: [],
    quickChecks: [],
    metadata: {},
    safetyStatus: 'safe',
    sourceTrust: 'internal',
    dedupeKey: 'dedupe-key',
    createdAt: new Date('2026-04-09T10:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-04-09T10:00:00.000Z').toISOString(),
    ...overrides,
  }) as any;

describe('recapGenerationService', () => {
  it('returns an existing deduped asset without invoking synthesis', async () => {
    const synthesizeMp3 = vi.fn();
    const findMediaAssetByDedupeKey = vi.fn().mockResolvedValue(makeAsset({ id: 'existing-asset' }));
    const createMediaAsset = vi.fn();
    const service = createRecapGenerationService({
      now: () => 1_000,
      synthesizeMp3,
      generateRevisionAudioRecap: vi.fn(),
      findMediaAssetByDedupeKey,
      createMediaAsset,
      recordLearningEffectEvent: vi.fn(),
    });

    const result = await service.generateAudioRecapAsset({
      userId: 'student-1',
      sourceType: 'manual',
      recapText: 'Quick recap text',
      title: 'My recap',
    });

    expect(result.asset.id).toBe('existing-asset');
    expect(result.fallbackToText).toBe(false);
    expect(synthesizeMp3).not.toHaveBeenCalled();
    expect(createMediaAsset).not.toHaveBeenCalled();
  });

  it('builds recap text from revision source and persists synthesized audio', async () => {
    const synthesizeMp3 = vi.fn().mockResolvedValue(Buffer.from('fake-mp3'));
    const generateRevisionAudioRecap = vi
      .fn()
      .mockResolvedValue({ recapText: 'Revision generated recap', fallbackToText: true });
    const createMediaAsset = vi.fn().mockResolvedValue(
      makeAsset({
        id: 'new-asset',
        recapText: 'Revision generated recap',
      })
    );
    const recordLearningEffectEvent = vi.fn().mockResolvedValue({});
    const service = createRecapGenerationService({
      now: () => 2_000,
      synthesizeMp3,
      generateRevisionAudioRecap,
      findMediaAssetByDedupeKey: vi.fn().mockResolvedValue(null),
      createMediaAsset,
      recordLearningEffectEvent,
    });

    const result = await service.generateAudioRecapAsset({
      userId: 'student-1',
      sourceType: 'queue',
      collectionId: null,
      itemId: null,
      language: 'english',
    });

    expect(generateRevisionAudioRecap).toHaveBeenCalledWith({
      userId: 'student-1',
      sourceType: 'queue',
      collectionId: undefined,
      itemId: undefined,
    });
    expect(synthesizeMp3).toHaveBeenCalledTimes(1);
    expect(createMediaAsset).toHaveBeenCalledTimes(1);
    expect(result.asset.id).toBe('new-asset');
    expect(result.fallbackToText).toBe(false);
    expect(recordLearningEffectEvent).toHaveBeenCalled();
  });

  it('falls back to text recap when synthesis fails', async () => {
    const synthesizeMp3 = vi.fn().mockRejectedValue(new Error('network down'));
    const createMediaAsset = vi.fn().mockImplementation(async (input: any) =>
      makeAsset({
        id: 'fallback-asset',
        dataUrl: input.dataUrl || null,
        durationSec: input.durationSec || null,
      })
    );
    const service = createRecapGenerationService({
      now: () => 3_000,
      synthesizeMp3,
      generateRevisionAudioRecap: vi.fn(),
      findMediaAssetByDedupeKey: vi.fn().mockResolvedValue(null),
      createMediaAsset,
      recordLearningEffectEvent: vi.fn(),
    });

    const result = await service.generateAudioRecapAsset({
      userId: 'student-1',
      sourceType: 'manual',
      recapText: 'Fallback recap',
      language: 'english',
    });

    expect(result.fallbackToText).toBe(true);
    expect(result.degradedReason).toBe('tts_error');
    expect(result.audioUrl).toBeNull();
    expect(result.audioDurationSec).toBeNull();
    expect(createMediaAsset).toHaveBeenCalledTimes(1);
  });
});

