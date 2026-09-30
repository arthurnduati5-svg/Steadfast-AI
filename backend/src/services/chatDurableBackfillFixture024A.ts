/**
 * STDF-REAL-CHAT-BACKEND-CONTRACT-024A
 * Idempotent legacy projection backfill + bounded long-history development fixture.
 *
 * BACKEND ONLY. Never imported by production startup paths. No AI calls.
 * Fixture execution is guarded: it refuses to run unless
 * STEADFAST_024A_FIXTURE_ENABLED === 'true' AND an explicit test scope is given.
 */
import { randomUUID } from 'crypto';
import prisma from '../utils/prismaClient';
import {
  clampPreviewText,
  deriveLatestVisiblePreview,
  getSessionMessages,
} from './chatDurableContract024';

export type BackfillReport = {
  sessionsScanned: number;
  sessionsUpdated: number;
  unresolvedNullSchool: number;
  unresolvedSessionIds: string[];
};

function assertFixtureAllowed(): void {
  if (process.env.STEADFAST_024A_FIXTURE_ENABLED !== 'true') {
    throw new Error('FIXTURE_GUARD: set STEADFAST_024A_FIXTURE_ENABLED=true to run the 024A fixture.');
  }
}

/**
 * Idempotent backfill (§11): recompute derived projection columns from canonical
 * ChatMessage rows. Safe to run repeatedly. Never guesses schoolId: rows whose
 * school cannot be derived unambiguously are left null and counted.
 */
export async function backfillChatHistoryProjections(args?: {
  schoolId?: string;
  studentId?: string;
  batchSize?: number;
}): Promise<BackfillReport> {
  const where: Record<string, unknown> = {};
  if (args?.schoolId) where.schoolId = args.schoolId;
  if (args?.studentId) where.studentId = args.studentId;
  const batchSize = Math.min(Math.max(args?.batchSize || 100, 1), 500);

  const report: BackfillReport = {
    sessionsScanned: 0,
    sessionsUpdated: 0,
    unresolvedNullSchool: 0,
    unresolvedSessionIds: [],
  };

  for (;;) {
    const sessions = await prisma.chatSession.findMany({
      where,
      take: batchSize,
      skip: report.sessionsScanned,
      orderBy: { id: 'asc' },
      include: { ChatMessage: { orderBy: [{ messageNumber: 'asc' }] } },
    });
    if (sessions.length === 0) break;
    for (const session of sessions) {
      report.sessionsScanned += 1;
      const msgs = getSessionMessages(session);
      const last = msgs[msgs.length - 1];
      const preview = deriveLatestVisiblePreview(msgs);
      const data: Record<string, unknown> = {
        messageCount: msgs.length,
        lastMessageAt: last?.timestamp ? new Date(last.timestamp as never) : null,
        latestVisibleMessagePreview: preview ?? clampPreviewText(null),
        updatedAt: new Date(),
      };
      const currentVersion = Number((session as never as { titleVersion?: unknown }).titleVersion);
      if (!Number.isFinite(currentVersion)) data.titleVersion = 0;
      // schoolId: derive only when unambiguous. No student→school registry is
      // consulted here, so ambiguous rows stay null and are counted (§6/§11).
      if ((session as never as { schoolId?: unknown }).schoolId == null) {
        report.unresolvedNullSchool += 1;
        if (report.unresolvedSessionIds.length < 50) report.unresolvedSessionIds.push(session.id);
      }
      await prisma.chatSession.update({ where: { id: session.id }, data: data as never });
      report.sessionsUpdated += 1;
    }
    if (sessions.length < batchSize) break;
  }
  return report;
}

export type LongHistoryFixtureScope = {
  schoolId: string;
  studentId: string;
  runTag: string;
};

export type LongHistoryFixtureResult = {
  schoolId: string;
  studentId: string;
  runTag: string;
  sessionIds: string[];
  thousandMessageSessionId: string;
  thousandMessageCount: number;
};

function fixtureSessionId(runTag: string, index: number): string {
  return `stdf-024a-fixture-${runTag}-s${String(index).padStart(3, '0')}`;
}

/**
 * Bounded development/test-only fixture (§47): ~100 sessions + one session with
 * ~1,000 small messages for one known test learner/school. Guarded, deterministic,
 * no AI calls. Returns IDs only; never prints message content.
 */
export async function createLongHistoryFixture(scope: LongHistoryFixtureScope): Promise<LongHistoryFixtureResult> {
  assertFixtureAllowed();
  if (!scope.schoolId.trim() || !scope.studentId.trim() || !scope.runTag.trim()) {
    throw new Error('FIXTURE_SCOPE_REQUIRED');
  }
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(scope.runTag)) throw new Error('FIXTURE_RUN_TAG_INVALID');

  const now = new Date();
  const sessionIds: string[] = [];
  for (let i = 0; i < 100; i += 1) {
    const id = fixtureSessionId(scope.runTag, i);
    sessionIds.push(id);
    const lastAt = new Date(now.getTime() - i * 3_600_000);
    await prisma.chatSession.upsert({
      where: { id },
      create: {
        id,
        studentId: scope.studentId,
        schoolId: scope.schoolId,
        topic: `Fixture session ${i}`,
        isActive: false,
        updatedAt: now,
        lastMessageAt: lastAt,
        latestVisibleMessagePreview: `fixture preview ${i}`,
        messageCount: 2,
        titleVersion: 0,
      } as never,
      update: {
        studentId: scope.studentId,
        schoolId: scope.schoolId,
        lastMessageAt: lastAt,
        messageCount: 2,
        latestVisibleMessagePreview: `fixture preview ${i}`,
        updatedAt: now,
      } as never,
    });
    for (let m = 1; m <= 2; m += 1) {
      await prisma.chatMessage.upsert({
        where: { sessionId_messageNumber: { sessionId: id, messageNumber: m } },
        create: {
          id: randomUUID(),
          sessionId: id,
          role: m % 2 === 1 ? 'user' : 'model',
          content: `fixture ${i} message ${m}`,
          timestamp: new Date(lastAt.getTime() - (2 - m) * 60_000),
          messageNumber: m,
        },
        update: {},
      });
    }
  }

  const bigId = fixtureSessionId(scope.runTag, 999);
  await prisma.chatSession.upsert({
    where: { id: bigId },
    create: {
      id: bigId,
      studentId: scope.studentId,
      schoolId: scope.schoolId,
      topic: 'Fixture thousand-message session',
      isActive: false,
      updatedAt: now,
      messageCount: 1000,
      titleVersion: 0,
    } as never,
    update: { studentId: scope.studentId, schoolId: scope.schoolId, updatedAt: now } as never,
  });
  const MESSAGE_BATCH = 100;
  for (let start = 1; start <= 1000; start += MESSAGE_BATCH) {
    const batch: Array<{ id: string; sessionId: string; role: string; content: string; timestamp: Date; messageNumber: number }> = [];
    for (let m = start; m < start + MESSAGE_BATCH; m += 1) {
      batch.push({
        id: randomUUID(),
        sessionId: bigId,
        role: m % 2 === 1 ? 'user' : 'model',
        content: `f ${m}`,
        timestamp: new Date(now.getTime() - (1000 - m) * 1000),
        messageNumber: m,
      });
    }
    await prisma.chatMessage.createMany({ data: batch, skipDuplicates: true });
  }
  const bigMsgs = await prisma.chatMessage.findMany({
    where: { sessionId: bigId },
    orderBy: [{ messageNumber: 'desc' }],
    take: 1,
  });
  const bigLast = bigMsgs[0];
  await prisma.chatSession.update({
    where: { id: bigId },
    data: {
      messageCount: 1000,
      lastMessageAt: bigLast ? bigLast.timestamp : now,
      latestVisibleMessagePreview: bigLast ? clampPreviewText(bigLast.content) : null,
      updatedAt: now,
    } as never,
  });

  return {
    schoolId: scope.schoolId,
    studentId: scope.studentId,
    runTag: scope.runTag,
    sessionIds,
    thousandMessageSessionId: bigId,
    thousandMessageCount: 1000,
  };
}

/** Cleanup by exact generated fixture scope only. No broad deletes. */
export async function cleanupLongHistoryFixture(scope: LongHistoryFixtureScope): Promise<{ deletedSessions: number }> {
  assertFixtureAllowed();
  const prefix = `stdf-024a-fixture-${scope.runTag}-`;
  const rows = await prisma.chatSession.findMany({
    where: { studentId: scope.studentId, schoolId: scope.schoolId },
    select: { id: true },
  });
  const ids = rows.map((r) => r.id).filter((id) => id.startsWith(prefix));
  let deleted = 0;
  for (const id of ids) {
    await prisma.chatSession.delete({ where: { id } }).catch(() => undefined);
    deleted += 1;
  }
  return { deletedSessions: deleted };
}
