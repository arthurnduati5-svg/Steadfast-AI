import { Prisma, VoiceSessionMode } from '@prisma/client';
import prisma from '../utils/prismaClient';

type TxClient = Prisma.TransactionClient;

export type BillMode = 'LISTENING_ONLY' | 'LISTENING_PLUS_TTS';

export interface VoiceBalanceSummary {
  studentId: string;
  remainingSeconds: number;
  remainingMinutesRoundedDown: number;
  display: string;
  last10LedgerEntries: Array<{
    id: string;
    createdAt: Date;
    type: string;
    secondsDelta: number;
    relatedSessionId: string | null;
    relatedGrantId: string | null;
    balanceAfterSeconds: number;
    metadata: Prisma.JsonValue | null;
  }>;
}

export interface StartVoiceSessionInput {
  studentId: string;
  chatSessionId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

export interface AuthorizeVoiceSessionInput {
  studentId: string;
  sessionUsageId: string;
}

export interface StopVoiceSessionInput {
  studentId: string;
  sessionUsageId: string;
  stopReason?: string;
  listeningSecondsUsed?: number;
  ttsSecondsUsed?: number;
  metadata?: Prisma.InputJsonValue;
}

export interface StopVoiceSessionResult {
  sessionUsageId: string;
  billedSeconds: number;
  remainingSeconds: number;
  mode: VoiceSessionMode;
  stopReason: string;
  timeExhausted: boolean;
}

export interface AuthorizeVoiceSessionResult {
  allowed: boolean;
  sessionUsageId: string;
  mode?: VoiceSessionMode;
  remainingSeconds: number;
  reason?: 'session_not_found' | 'session_inactive' | 'time_exhausted';
}

const DEFAULT_STOP_REASON = 'user_stop';
const SERVER_BILLING_GRACE_SECONDS = Math.max(0, Number(process.env.VOICE_SERVER_BILLING_GRACE_SECONDS ?? 1) || 0);
const DEV_BOOTSTRAP_SECONDS = (() => {
  if (process.env.NODE_ENV === 'production') return 0;
  const minutes = Number(process.env.VOICE_DEV_BOOTSTRAP_MINUTES ?? 10);
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  return Math.floor(minutes * 60);
})();
const DEV_BOOTSTRAP_STUDENTS = new Set(
  String(process.env.VOICE_DEV_BOOTSTRAP_STUDENTS || 'test-student-1')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);

const toNonNegativeInt = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.ceil(parsed));
};

const normalizeStopReason = (value?: string): string => {
  const allowed = new Set(['user_stop', 'time_exhausted', 'error']);
  const normalized = (value || '').trim().toLowerCase();
  return allowed.has(normalized) ? normalized : DEFAULT_STOP_REASON;
};

const toInputJson = (
  value: Prisma.InputJsonValue | Prisma.JsonValue | null | undefined
): Prisma.InputJsonValue | undefined => {
  if (value === null || value === undefined) return undefined;
  return value as Prisma.InputJsonValue;
};

const buildActiveGrantWhere = (
  studentId: string,
  now: Date = new Date()
): Prisma.VoicePackageGrantWhereInput => ({
  studentId,
  secondsRemaining: { gt: 0 },
  OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]
});

export const resolveBillMode = (): BillMode => {
  const raw = (process.env.VOICE_BILL_MODE || 'LISTENING_PLUS_TTS').toUpperCase();
  return raw === 'LISTENING_ONLY' ? 'LISTENING_ONLY' : 'LISTENING_PLUS_TTS';
};

const billModeToSessionMode = (mode: BillMode): VoiceSessionMode =>
  mode === 'LISTENING_ONLY' ? VoiceSessionMode.listening_only : VoiceSessionMode.listening_plus_tts;

const computeBilledSeconds = (
  mode: VoiceSessionMode,
  listeningSecondsUsed?: number,
  ttsSecondsUsed?: number
): number => {
  const listening = toNonNegativeInt(listeningSecondsUsed);
  const tts = toNonNegativeInt(ttsSecondsUsed);
  return mode === VoiceSessionMode.listening_only ? listening : listening + tts;
};

const formatMmSs = (totalSeconds: number): string => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const ensureStudentRowLocked = async (tx: TxClient, studentId: string) => {
  await tx.studentProfile.upsert({
    where: { userId: studentId },
    update: {},
    create: {
      userId: studentId,
      preferredLanguage: 'English',
      topInterests: [],
      profileCompleted: false,
      preferences: {},
      favoriteShows: []
    }
  });

  await tx.$queryRaw`SELECT "userId" FROM "StudentProfile" WHERE "userId" = ${studentId} FOR UPDATE`;
};

const getCurrentBalanceInTx = async (tx: TxClient, studentId: string): Promise<number> => {
  const aggregated = await tx.voicePackageGrant.aggregate({
    where: buildActiveGrantWhere(studentId),
    _sum: { secondsRemaining: true }
  });
  return Math.max(0, aggregated._sum.secondsRemaining ?? 0);
};

const maybeBootstrapDevBalanceInTx = async (
  tx: TxClient,
  studentId: string,
  currentBalance: number
): Promise<number> => {
  if (currentBalance > 0) return currentBalance;
  if (DEV_BOOTSTRAP_SECONDS <= 0) return currentBalance;
  if (!(DEV_BOOTSTRAP_STUDENTS.has('*') || DEV_BOOTSTRAP_STUDENTS.has(studentId))) return currentBalance;

  const existingLedgerEntries = await tx.voiceLedgerEntry.count({ where: { studentId } });
  if (existingLedgerEntries > 0) return currentBalance;

  const grant = await tx.voicePackageGrant.create({
    data: {
      studentId,
      secondsGranted: DEV_BOOTSTRAP_SECONDS,
      secondsRemaining: DEV_BOOTSTRAP_SECONDS,
      source: 'dev_bootstrap',
      metadata: {
        reason: 'Automatic dev bootstrap for voice testing'
      }
    }
  });

  await tx.voiceLedgerEntry.create({
    data: {
      studentId,
      type: 'GRANT',
      secondsDelta: DEV_BOOTSTRAP_SECONDS,
      relatedGrantId: grant.id,
      balanceAfterSeconds: DEV_BOOTSTRAP_SECONDS,
      metadata: {
        reason: 'Automatic dev bootstrap for voice testing'
      }
    }
  });

  return DEV_BOOTSTRAP_SECONDS;
};

const consumeFromGrants = async (tx: TxClient, studentId: string, secondsToConsume: number) => {
  if (secondsToConsume <= 0) return;

  let remaining = secondsToConsume;
  const grants = await tx.voicePackageGrant.findMany({
    where: buildActiveGrantWhere(studentId),
    orderBy: [{ grantedAt: 'asc' }, { id: 'asc' }]
  });

  for (const grant of grants) {
    if (remaining <= 0) break;
    const deduction = Math.min(grant.secondsRemaining, remaining);
    await tx.voicePackageGrant.update({
      where: { id: grant.id },
      data: { secondsRemaining: grant.secondsRemaining - deduction }
    });
    remaining -= deduction;
  }
};

export const getVoiceBalanceSeconds = async (studentId: string): Promise<number> => {
  return prisma.$transaction(async (tx) => {
    await ensureStudentRowLocked(tx, studentId);
    const currentBalance = await getCurrentBalanceInTx(tx, studentId);
    return maybeBootstrapDevBalanceInTx(tx, studentId, currentBalance);
  });
};

export const getVoiceBalanceSummary = async (studentId: string): Promise<VoiceBalanceSummary> => {
  const [remainingSeconds, last10LedgerEntries] = await Promise.all([
    getVoiceBalanceSeconds(studentId),
    prisma.voiceLedgerEntry.findMany({
      where: { studentId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 10
    })
  ]);

  return {
    studentId,
    remainingSeconds,
    remainingMinutesRoundedDown: Math.floor(remainingSeconds / 60),
    display: formatMmSs(remainingSeconds),
    last10LedgerEntries
  };
};

const grantVoicePackageInTx = async (tx: TxClient, input: {
  studentId: string;
  minutesPurchased: number;
  expiresAt?: Date | null;
  source: string;
  metadata?: Prisma.InputJsonValue;
}) => {
  const minutesPurchased = Math.floor(input.minutesPurchased);
  if (!Number.isFinite(minutesPurchased) || minutesPurchased <= 0) {
    throw new Error('minutesPurchased must be a positive integer.');
  }

  const secondsGranted = minutesPurchased * 60;

  await ensureStudentRowLocked(tx, input.studentId);
  const currentBalance = await getCurrentBalanceInTx(tx, input.studentId);
  const balanceAfterSeconds = currentBalance + secondsGranted;

  const grant = await tx.voicePackageGrant.create({
    data: {
      studentId: input.studentId,
      secondsGranted,
      secondsRemaining: secondsGranted,
      expiresAt: input.expiresAt ?? null,
      source: input.source,
      metadata: toInputJson(input.metadata)
    }
  });

  await tx.voiceLedgerEntry.create({
    data: {
      studentId: input.studentId,
      type: 'GRANT',
      secondsDelta: secondsGranted,
      relatedGrantId: grant.id,
      balanceAfterSeconds,
      metadata: toInputJson(input.metadata)
    }
  });

  return {
    grantId: grant.id,
    secondsGranted,
    remainingSeconds: balanceAfterSeconds,
    remainingMinutesRoundedDown: Math.floor(balanceAfterSeconds / 60),
    display: formatMmSs(balanceAfterSeconds)
  };
};

export const grantVoicePackage = async (input: {
  studentId: string;
  minutesPurchased: number;
  expiresAt?: Date | null;
  source: string;
  metadata?: Prisma.InputJsonValue;
}) => {
  return prisma.$transaction((tx) => grantVoicePackageInTx(tx, input));
};

export const applyVoicePaymentGrant = async (input: {
  studentId: string;
  minutesPurchased: number;
  provider: string;
  paymentReference: string;
  expiresAt?: Date | null;
  metadata?: Prisma.InputJsonValue;
}) => {
  const minutesPurchased = Math.floor(input.minutesPurchased);
  if (!Number.isFinite(minutesPurchased) || minutesPurchased <= 0) {
    throw new Error('minutesPurchased must be a positive integer.');
  }

  const provider = String(input.provider || '').trim().toLowerCase();
  if (!provider) {
    throw new Error('provider is required.');
  }

  const paymentReference = String(input.paymentReference || '').trim();
  if (!paymentReference) {
    throw new Error('paymentReference is required.');
  }

  const paymentKey = `${provider}:${paymentReference}`;

  return prisma.$transaction(async (tx) => {
    await ensureStudentRowLocked(tx, input.studentId);

    const existingGrant = await tx.voicePackageGrant.findFirst({
      where: {
        studentId: input.studentId,
        source: `payment:${provider}`,
        metadata: {
          path: ['paymentKey'],
          equals: paymentKey
        }
      }
    });

    if (existingGrant) {
      const remainingSeconds = await getCurrentBalanceInTx(tx, input.studentId);
      return {
        applied: false,
        alreadyExists: true,
        grantId: existingGrant.id,
        secondsGranted: existingGrant.secondsGranted,
        remainingSeconds,
        remainingMinutesRoundedDown: Math.floor(remainingSeconds / 60),
        display: formatMmSs(remainingSeconds)
      };
    }

    const mergedMetadata: Prisma.InputJsonValue = {
      provider,
      paymentReference,
      paymentKey,
      ...(input.metadata && typeof input.metadata === 'object' ? (input.metadata as Record<string, unknown>) : {})
    };

    const granted = await grantVoicePackageInTx(tx, {
      studentId: input.studentId,
      minutesPurchased,
      expiresAt: input.expiresAt ?? null,
      source: `payment:${provider}`,
      metadata: mergedMetadata
    });

    return {
      applied: true,
      alreadyExists: false,
      ...granted
    };
  });
};

export const startVoiceSession = async (input: StartVoiceSessionInput) => {
  return prisma.$transaction(async (tx) => {
    await ensureStudentRowLocked(tx, input.studentId);
    const currentBalance = await getCurrentBalanceInTx(tx, input.studentId);
    const remainingSeconds = await maybeBootstrapDevBalanceInTx(tx, input.studentId, currentBalance);

    if (remainingSeconds <= 0) {
      return {
        allowed: false as const,
        reason: 'time_exhausted' as const,
        remainingSeconds: 0
      };
    }

    const mode = billModeToSessionMode(resolveBillMode());
    let safeChatSessionId = input.chatSessionId ?? null;
    if (safeChatSessionId) {
      const hasSession = await tx.chatSession.count({
        where: {
          id: safeChatSessionId,
          studentId: input.studentId
        }
      });
      if (!hasSession) safeChatSessionId = null;
    }

    const session = await tx.voiceSessionUsage.create({
      data: {
        studentId: input.studentId,
        chatSessionId: safeChatSessionId,
        mode,
        metadata: toInputJson(input.metadata)
      }
    });

    return {
      allowed: true as const,
      sessionUsageId: session.id,
      mode,
      remainingSeconds
    };
  });
};

export const authorizeVoiceSession = async (
  input: AuthorizeVoiceSessionInput
): Promise<AuthorizeVoiceSessionResult> => {
  return prisma.$transaction(async (tx) => {
    await ensureStudentRowLocked(tx, input.studentId);

    const session = await tx.voiceSessionUsage.findUnique({
      where: { id: input.sessionUsageId }
    });
    const currentBalance = await getCurrentBalanceInTx(tx, input.studentId);

    if (!session || session.studentId !== input.studentId) {
      return {
        allowed: false,
        sessionUsageId: input.sessionUsageId,
        remainingSeconds: currentBalance,
        reason: 'session_not_found'
      };
    }

    if (session.endedAt) {
      return {
        allowed: false,
        sessionUsageId: session.id,
        mode: session.mode,
        remainingSeconds: currentBalance,
        reason: 'session_inactive'
      };
    }

    if (currentBalance <= 0) {
      return {
        allowed: false,
        sessionUsageId: session.id,
        mode: session.mode,
        remainingSeconds: 0,
        reason: 'time_exhausted'
      };
    }

    return {
      allowed: true,
      sessionUsageId: session.id,
      mode: session.mode,
      remainingSeconds: currentBalance
    };
  });
};

export const stopVoiceSession = async (input: StopVoiceSessionInput): Promise<StopVoiceSessionResult> => {
  return prisma.$transaction(async (tx) => {
    await ensureStudentRowLocked(tx, input.studentId);
    await tx.$queryRaw`SELECT "id" FROM "VoiceSessionUsage" WHERE "id" = ${input.sessionUsageId} FOR UPDATE`;

    const session = await tx.voiceSessionUsage.findUnique({
      where: { id: input.sessionUsageId }
    });

    if (!session || session.studentId !== input.studentId) {
      throw new Error('Voice session not found.');
    }

    if (session.endedAt) {
      const remainingSeconds = await getCurrentBalanceInTx(tx, input.studentId);
      return {
        sessionUsageId: session.id,
        billedSeconds: session.billedSeconds,
        remainingSeconds,
        mode: session.mode,
        stopReason: session.stopReason || DEFAULT_STOP_REASON,
        timeExhausted: remainingSeconds <= 0 || (session.stopReason || '') === 'time_exhausted'
      };
    }

    const requestedBilledSeconds = computeBilledSeconds(
      session.mode,
      input.listeningSecondsUsed,
      input.ttsSecondsUsed
    );
    const observedElapsedSeconds = Math.max(
      0,
      Math.ceil((Date.now() - session.startedAt.getTime()) / 1000) - SERVER_BILLING_GRACE_SECONDS
    );
    const guardedRequestedSeconds = Math.max(requestedBilledSeconds, observedElapsedSeconds);

    const currentBalance = await getCurrentBalanceInTx(tx, input.studentId);
    const billedSeconds = Math.min(guardedRequestedSeconds, currentBalance);
    const remainingSeconds = Math.max(0, currentBalance - billedSeconds);
    const timeExhausted = guardedRequestedSeconds > currentBalance || remainingSeconds === 0;
    const stopReason = timeExhausted ? 'time_exhausted' : normalizeStopReason(input.stopReason);

    if (billedSeconds > 0) {
      await consumeFromGrants(tx, input.studentId, billedSeconds);

      await tx.voiceLedgerEntry.create({
        data: {
          studentId: input.studentId,
          type: 'DEBIT',
          secondsDelta: -billedSeconds,
          relatedSessionId: session.id,
          balanceAfterSeconds: remainingSeconds,
          metadata: toInputJson(input.metadata)
        }
      });
    }

    await tx.voiceSessionUsage.update({
      where: { id: session.id },
      data: {
        endedAt: new Date(),
        billedSeconds,
        stopReason,
        metadata: toInputJson(input.metadata ?? session.metadata ?? undefined)
      }
    });

    return {
      sessionUsageId: session.id,
      billedSeconds,
      remainingSeconds,
      mode: session.mode,
      stopReason,
      timeExhausted
    };
  });
};
