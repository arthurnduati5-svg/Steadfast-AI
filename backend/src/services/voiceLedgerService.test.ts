import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
  studentProfile: {
    upsert: vi.fn(),
  },
  voicePackageGrant: {
    aggregate: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
  },
  voiceLedgerEntry: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  voiceSessionUsage: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  chatSession: {
    count: vi.fn(),
  },
};

vi.mock('../utils/prismaClient', () => ({
  default: prismaMock,
}));

describe('voiceLedgerService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.NODE_ENV = 'production';
    delete process.env.VOICE_DEV_BOOTSTRAP_MINUTES;
    delete process.env.VOICE_DEV_BOOTSTRAP_STUDENTS;

    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof prismaMock) => unknown) => {
      return callback(prismaMock);
    });
    prismaMock.studentProfile.upsert.mockResolvedValue({});
    prismaMock.$queryRaw.mockResolvedValue([]);
    prismaMock.voicePackageGrant.aggregate.mockResolvedValue({ _sum: { secondsRemaining: 0 } });
    prismaMock.voicePackageGrant.findMany.mockResolvedValue([]);
    prismaMock.voicePackageGrant.update.mockResolvedValue({});
    prismaMock.voiceLedgerEntry.create.mockResolvedValue({});
    prismaMock.voiceSessionUsage.update.mockResolvedValue({});
    prismaMock.chatSession.count.mockResolvedValue(0);
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.VOICE_DEV_BOOTSTRAP_MINUTES;
    delete process.env.VOICE_DEV_BOOTSTRAP_STUDENTS;
  });

  it('computes balance from unexpired grant seconds only', async () => {
    prismaMock.voicePackageGrant.aggregate.mockResolvedValue({ _sum: { secondsRemaining: 125 } });

    const { getVoiceBalanceSeconds } = await import('./voiceLedgerService');
    const balance = await getVoiceBalanceSeconds('student-1');

    expect(balance).toBe(125);
    expect(prismaMock.voicePackageGrant.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          studentId: 'student-1',
          secondsRemaining: { gt: 0 },
          OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
        }),
      })
    );
  });

  it('consumes only unexpired grants when debiting a finished session', async () => {
    prismaMock.voicePackageGrant.aggregate.mockResolvedValue({ _sum: { secondsRemaining: 30 } });
    prismaMock.voiceSessionUsage.findUnique.mockResolvedValue({
      id: 'session-1',
      studentId: 'student-1',
      startedAt: new Date(),
      mode: 'listening_plus_tts',
      billedSeconds: 0,
      stopReason: null,
      endedAt: null,
      metadata: null,
    });
    prismaMock.voicePackageGrant.findMany.mockResolvedValue([
      { id: 'grant-1', secondsRemaining: 30 },
    ]);

    const { stopVoiceSession } = await import('./voiceLedgerService');
    const result = await stopVoiceSession({
      studentId: 'student-1',
      sessionUsageId: 'session-1',
      listeningSecondsUsed: 10,
      ttsSecondsUsed: 5,
      stopReason: 'user_stop',
    });

    expect(result.billedSeconds).toBe(15);
    expect(prismaMock.voicePackageGrant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          studentId: 'student-1',
          secondsRemaining: { gt: 0 },
          OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
        }),
      })
    );
    expect(prismaMock.voicePackageGrant.update).toHaveBeenCalledWith({
      where: { id: 'grant-1' },
      data: { secondsRemaining: 15 },
    });
  });
});
