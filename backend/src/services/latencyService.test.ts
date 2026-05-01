import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  turnLatencyMetric: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
  },
  latencyThresholdAlert: {
    createMany: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('../utils/prismaClient', () => ({
  default: prismaMock,
}));

describe('latencyService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    prismaMock.turnLatencyMetric.findUnique.mockResolvedValue(null);
    prismaMock.turnLatencyMetric.create.mockImplementation(async ({ data }: any) => ({
      id: 'metric-1',
      studentId: data.studentId,
      turnId: data.turnId,
      sessionId: data.sessionId || null,
      responseMode: data.responseMode,
      route: data.route,
      source: data.source,
      sttMs: data.sttMs ?? null,
      firstTokenMs: data.firstTokenMs ?? null,
      doneMs: data.doneMs ?? null,
      ttsStartMs: data.ttsStartMs ?? null,
      totalMs: data.totalMs ?? null,
      aiMs: data.aiMs ?? null,
      metadata: data.metadata ?? null,
      thresholdBreached: false,
      thresholdLevel: null,
      createdAt: new Date('2026-04-09T10:00:00.000Z'),
      updatedAt: new Date('2026-04-09T10:00:00.000Z'),
    }));
    prismaMock.turnLatencyMetric.update.mockImplementation(async ({ data }: any) => ({
      id: 'metric-1',
      ...data,
    }));
    prismaMock.latencyThresholdAlert.createMany.mockResolvedValue({});
  });

  it('stores extended voice latency metrics in metadata and maps tutor latency to aiMs', async () => {
    const { recordTurnLatency } = await import('./latencyService');
    await recordTurnLatency({
      studentId: 'student-1',
      turnId: 'turn-1',
      sttMs: 900,
      sttFirstTokenMs: 320,
      firstTokenMs: 1500,
      tutorLatencyMs: 1400,
      ttsStartMs: 800,
      ttsFirstByteMs: 620,
      totalMs: 2400,
    });

    expect(prismaMock.turnLatencyMetric.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          studentId: 'student-1',
          turnId: 'turn-1',
          aiMs: 1400,
          metadata: expect.objectContaining({
            sttFirstTokenMs: 320,
            tutorLatencyMs: 1400,
            ttsFirstByteMs: 620,
          }),
        }),
      })
    );
  });

  it('computes dashboard aggregates for metadata-backed metrics', async () => {
    prismaMock.turnLatencyMetric.findMany.mockResolvedValue([
      {
        id: 'm1',
        studentId: 'student-1',
        turnId: 'turn-1',
        responseMode: 'voice_realtime',
        route: 'backend_chat',
        sttMs: 1000,
        firstTokenMs: 1800,
        doneMs: 3200,
        ttsStartMs: 900,
        totalMs: 4200,
        aiMs: 1700,
        thresholdBreached: false,
        thresholdLevel: null,
        metadata: { sttFirstTokenMs: 420, tutorLatencyMs: 1700, ttsFirstByteMs: 610 },
        createdAt: new Date('2026-04-09T10:00:00.000Z'),
      },
      {
        id: 'm2',
        studentId: 'student-1',
        turnId: 'turn-2',
        responseMode: 'voice_realtime',
        route: 'backend_chat',
        sttMs: 1200,
        firstTokenMs: 2200,
        doneMs: 3800,
        ttsStartMs: 1100,
        totalMs: 5000,
        aiMs: 1900,
        thresholdBreached: true,
        thresholdLevel: 'warn',
        metadata: { sttFirstTokenMs: 510, tutorLatencyMs: 1900, ttsFirstByteMs: 740 },
        createdAt: new Date('2026-04-09T10:00:30.000Z'),
      },
    ]);

    const { getLatencyDashboard } = await import('./latencyService');
    const dashboard = await getLatencyDashboard({ hours: 24, limit: 20 });

    expect(dashboard.metrics.sttFirstTokenMs.avg).toBe(465);
    expect(dashboard.metrics.tutorLatencyMs.avg).toBe(1800);
    expect(dashboard.metrics.ttsFirstByteMs.avg).toBe(675);
    expect(dashboard.recent[0]).toEqual(
      expect.objectContaining({
        sttFirstTokenMs: 420,
        tutorLatencyMs: 1700,
        ttsFirstByteMs: 610,
      })
    );
  });
});

