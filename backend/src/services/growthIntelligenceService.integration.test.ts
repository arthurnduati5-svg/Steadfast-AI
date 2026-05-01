import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  progress: {
    findMany: vi.fn(),
  },
  mistake: {
    findMany: vi.fn(),
  },
  $executeRawUnsafe: vi.fn(),
};

const redisGet = vi.fn();
const redisSet = vi.fn();

const fetchUserRevisionItems = vi.fn();
const getRevisionQueue = vi.fn();
const listMediaAssets = vi.fn();
const getStudyGoals = vi.fn();
const getStudyPlans = vi.fn();
const getWeakTopics = vi.fn();
const listLearningEffectEvents = vi.fn();

vi.mock('../utils/prismaClient', () => ({
  default: prismaMock,
}));

vi.mock('../lib/redis', () => ({
  getRedisClient: vi.fn(async () => ({
    get: redisGet,
    set: redisSet,
  })),
}));

vi.mock('./revisionLearningService', () => ({
  fetchUserRevisionItems,
  getRevisionQueue,
}));

vi.mock('./mediaAssetService', () => ({
  listMediaAssets,
}));

vi.mock('./studySupportService', () => ({
  getStudyGoals,
  getStudyPlans,
  getWeakTopics,
}));

vi.mock('./learningEffectivenessService', () => ({
  listLearningEffectEvents,
}));

const makeRevisionItem = (id: string, overrides: Record<string, unknown> = {}) =>
  ({
    id,
    title: `Item ${id}`,
    summary: 'Solve carefully',
    content: 'content',
    contentType: 'note',
    subject: 'Mathematics',
    topic: 'Linear equations',
    subtopic: null,
    reviewStatus: 'needs_attention',
    recentOutcome: 'struggled',
    struggleCount: 2,
    successCount: 0,
    mastery: 'still_learning',
    isMistakeBased: true,
    createdAt: '2026-04-09T10:00:00.000Z',
    updatedAt: '2026-04-09T10:05:00.000Z',
    lastReviewedAt: '2026-04-08T10:05:00.000Z',
    nextReviewAt: '2026-04-10T10:05:00.000Z',
    ...overrides,
  }) as any;

describe('growthIntelligenceService integration', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    redisGet.mockResolvedValue(null);
    redisSet.mockResolvedValue('OK');

    fetchUserRevisionItems.mockResolvedValue([
      makeRevisionItem('rev-1'),
      makeRevisionItem('rev-2', {
        reviewStatus: 'review_due',
        recentOutcome: 'partial',
        struggleCount: 1,
        successCount: 1,
        mastery: 'getting_better',
      }),
    ]);
    getRevisionQueue.mockResolvedValue({
      dueNow: [makeRevisionItem('rev-2', { reviewStatus: 'review_due' })],
      needsAttention: [makeRevisionItem('rev-1')],
      continuePractising: [],
      newItems: [],
      recentlyImproved: [makeRevisionItem('rev-3', { mastery: 'almost_there', recentOutcome: 'completed', reviewStatus: 'practising' })],
    });
    getWeakTopics.mockResolvedValue([
      {
        topic: 'Linear equations',
        subject: 'Mathematics',
        weaknessScore: 82,
        evidenceCount: 3,
        lastSeenAt: '2026-04-09T09:00:00.000Z',
        improving: false,
        reason: 'Repeated sign mistakes.',
        suggestedNextAction: 'Rebuild with one similar question.',
      },
    ]);
    getStudyPlans.mockResolvedValue([
      {
        id: 'plan-1',
        userId: 'student-1',
        title: 'Equation repair plan',
        scope: 'weekly',
        subject: 'Mathematics',
        topic: 'Linear equations',
        subjects: ['Mathematics'],
        dateRangeStart: '2026-04-08T00:00:00.000Z',
        dateRangeEnd: '2026-04-15T00:00:00.000Z',
        summary: 'Repair weak algebra step by step.',
        focusAreas: ['Linear equations'],
        recommendedBlocks: [],
        suggestedCollectionIds: [],
        suggestedItemIds: [],
        metadata: { lifecycle: 'active' },
        createdAt: '2026-04-08T00:00:00.000Z',
        updatedAt: '2026-04-09T00:00:00.000Z',
      },
    ]);
    getStudyGoals.mockResolvedValue([
      {
        id: 'goal-1',
        userId: 'student-1',
        studyPlanId: 'plan-1',
        title: 'Fix sign handling',
        description: null,
        goalType: 'practise_topic',
        targetCount: 1,
        currentCount: 0,
        status: 'not_started',
        subject: 'Mathematics',
        topic: 'Linear equations',
        dueAt: null,
        metadata: null,
        createdAt: '2026-04-08T00:00:00.000Z',
        updatedAt: '2026-04-09T00:00:00.000Z',
      },
    ]);
    listLearningEffectEvents.mockResolvedValue([
      {
        id: 'evt-1',
        userId: 'student-1',
        sessionId: null,
        subject: 'Mathematics',
        topic: 'Linear equations',
        revisionItemId: 'rev-1',
        messageId: null,
        eventType: 'repeated_mistake',
        outcome: 'struggled',
        metadata: null,
        createdAt: '2026-04-09T09:55:00.000Z',
      },
      {
        id: 'evt-2',
        userId: 'student-1',
        sessionId: null,
        subject: 'Mathematics',
        topic: 'Linear equations',
        revisionItemId: 'rev-2',
        messageId: null,
        eventType: 'repeated_mistake_reduction',
        outcome: 'improved',
        metadata: null,
        createdAt: '2026-04-09T10:20:00.000Z',
      },
    ]);
    listMediaAssets.mockResolvedValue([
      {
        id: 'media-1',
        userId: 'student-1',
        assetKind: 'audio_recap',
        title: 'Linear equations recap',
        summary: 'Summary',
        subject: 'Mathematics',
        topic: 'Linear equations',
        subtopic: null,
        tags: [],
        language: 'english',
        sessionId: null,
        revisionItemId: 'rev-1',
        sourceUrl: null,
        videoId: null,
        dataUrl: null,
        assetUrl: null,
        thumbnailUrl: null,
        durationSec: 120,
        recapText: 'Recap',
        keyPoints: [],
        quickChecks: [],
        metadata: {},
        safetyStatus: 'safe',
        sourceTrust: 'internal',
        dedupeKey: 'dedupe',
        isSaved: true,
        isCompleted: false,
        isHelpful: true,
        createdAt: '2026-04-09T08:00:00.000Z',
        updatedAt: '2026-04-09T09:00:00.000Z',
      },
    ]);

    prismaMock.progress.findMany.mockResolvedValue([
      {
        subject: 'Mathematics',
        topic: 'Linear equations',
        mastery: 38,
        updatedAt: new Date('2026-04-09T10:00:00.000Z'),
      },
    ]);
    prismaMock.mistake.findMany.mockResolvedValue([
      {
        topic: 'Linear equations',
        error: 'Sign error',
        attempts: 3,
        lastSeen: new Date('2026-04-09T10:01:00.000Z'),
      },
    ]);
    prismaMock.$executeRawUnsafe.mockResolvedValue(undefined);
  });

  it('computes and persists growth entities through dedicated tables', async () => {
    const { getGrowthOverview, getGrowthMasteryTrends } = await import('./growthIntelligenceService');
    const overview = await getGrowthOverview('student-1');
    const trends = await getGrowthMasteryTrends('student-1');

    expect(overview.recommendedNextMove).not.toBeNull();
    expect(overview.metrics.weakTopicCount).toBeGreaterThan(0);
    expect(trends.topicTrends.length).toBeGreaterThan(0);

    await vi.waitFor(() => {
      const queries = prismaMock.$executeRawUnsafe.mock.calls.map((call) => String(call[0] || ''));
      expect(queries.some((query) => query.includes('CREATE TABLE IF NOT EXISTS "GrowthWeakTopicState"'))).toBe(true);
      expect(queries.some((query) => query.includes('INSERT INTO "GrowthWeakTopicState"'))).toBe(true);
      expect(queries.some((query) => query.includes('INSERT INTO "GrowthMistakePatternState"'))).toBe(true);
      expect(queries.some((query) => query.includes('INSERT INTO "GrowthMasteryTrendState"'))).toBe(true);
    });
  });

  it('uses redis-backed snapshot caching across module instances', async () => {
    const redisStore = new Map<string, string>();
    redisGet.mockImplementation(async (key: string) => redisStore.get(String(key)) ?? null);
    redisSet.mockImplementation(async (key: string, value: string) => {
      redisStore.set(String(key), String(value));
      return 'OK';
    });

    const firstModule = await import('./growthIntelligenceService');
    await firstModule.getGrowthOverview('student-1');

    expect(fetchUserRevisionItems).toHaveBeenCalledTimes(1);
    expect(redisSet).toHaveBeenCalled();

    vi.resetModules();

    const secondModule = await import('./growthIntelligenceService');
    await secondModule.getGrowthOverview('student-1');

    expect(redisGet).toHaveBeenCalled();
    expect(fetchUserRevisionItems).toHaveBeenCalledTimes(1);
  });
});
