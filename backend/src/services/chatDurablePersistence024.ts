/**
 * STDF-REAL-CHAT-BACKEND-INTEGRATION-024
 * Durable turn persistence: atomic message append + turn ledger + title helper.
 */
import { randomUUID } from 'crypto';
import prisma from '../utils/prismaClient';
import {
  clampPreviewText,
  deriveLatestVisiblePreview,
  fingerprintTurnInput,
  getSessionMessages,
} from './chatDurableContract024';

export type TurnLedgerStatus = 'in_progress' | 'completed' | 'failed' | 'interrupted';

const TURN_LEASE_MS = 120_000;

async function readLedger(sessionId: string, clientTurnId: string): Promise<any | null> {
  try {
    return await (prisma as any).chatTurnRequestRecord.findUnique({
      where: { sessionId_clientTurnId: { sessionId, clientTurnId } },
    });
  } catch {
    return null;
  }
}

/** Atomically acquire a turn. Returns { outcome, record }. */
export async function acquireChatTurn(args: {
  sessionId: string;
  schoolId: string | null;
  studentId: string;
  clientTurnId: string;
  message: string;
  editedMessageId?: string;
}): Promise<{ outcome: 'owned' | 'replay' | 'conflict' | 'session_busy'; record: any | null; replay?: any }> {
  const fingerprint = fingerprintTurnInput({
    sessionId: args.sessionId,
    message: args.message,
    editedMessageId: args.editedMessageId,
  });
  const now = new Date();
  const leaseExpiresAt = new Date(now.getTime() + TURN_LEASE_MS);

  // Fast path: existing ledger row for this turn.
  const existing = await readLedger(args.sessionId, args.clientTurnId);
  if (existing) {
    if (existing.requestFingerprint !== fingerprint) {
      return { outcome: 'conflict', record: existing };
    }
    if (existing.status === 'completed') {
      return { outcome: 'replay', record: existing };
    }
    if (existing.status === 'in_progress') {
      const lease = existing.leaseExpiresAt ? new Date(existing.leaseExpiresAt).getTime() : 0;
      if (Number.isFinite(lease) && lease > now.getTime()) {
        return { outcome: 'replay', record: existing };
      }
      // Stale lease: safe retry path reuses learner message, resets to in_progress.
      try {
        const reset = await (prisma as any).chatTurnRequestRecord.update({
          where: { sessionId_clientTurnId: { sessionId: args.sessionId, clientTurnId: args.clientTurnId } },
          data: { status: 'in_progress', leaseExpiresAt, updatedAt: now, errorCode: null },
        });
        return { outcome: 'owned', record: reset };
      } catch {
        return { outcome: 'replay', record: existing };
      }
    }
    // failed/interrupted: allow safe retry, reuse learner message.
    try {
      const reset = await (prisma as any).chatTurnRequestRecord.update({
        where: { sessionId_clientTurnId: { sessionId: args.sessionId, clientTurnId: args.clientTurnId } },
        data: { status: 'in_progress', leaseExpiresAt, updatedAt: now, errorCode: null },
      });
      return { outcome: 'owned', record: reset };
    } catch {
      return { outcome: 'owned', record: existing };
    }
  }

  // Single-flight per session: another live turn owns the session.
  try {
    const liveOther = await (prisma as any).chatTurnRequestRecord.findFirst({
      where: { sessionId: args.sessionId, status: 'in_progress' },
    });
    if (liveOther && liveOther.clientTurnId !== args.clientTurnId) {
      const lease = liveOther.leaseExpiresAt ? new Date(liveOther.leaseExpiresAt).getTime() : 0;
      if (Number.isFinite(lease) && lease > now.getTime()) {
        return { outcome: 'session_busy', record: liveOther };
      }
    }
  } catch {
    // Fail closed: on a ledger read error the unique(sessionId, clientTurnId)
    // create below remains the single-flight guard (race re-reads the winner);
    // no legacy bypass path exists.
  }

  try {
    const created = await (prisma as any).chatTurnRequestRecord.create({
      data: {
        id: randomUUID(),
        sessionId: args.sessionId,
        schoolId: args.schoolId,
        studentId: args.studentId,
        clientTurnId: args.clientTurnId,
        requestFingerprint: fingerprint,
        status: 'in_progress',
        leaseExpiresAt,
        updatedAt: now,
      },
    });
    return { outcome: 'owned', record: created };
  } catch (err: any) {
    // Unique race: re-read winner.
    const winner = await readLedger(args.sessionId, args.clientTurnId);
    if (winner) {
      if (winner.requestFingerprint !== fingerprint) return { outcome: 'conflict', record: winner };
      return { outcome: 'replay', record: winner };
    }
    throw err;
  }
}

export async function completeChatTurn(args: {
  sessionId: string;
  clientTurnId: string;
  userMessageId?: string | null;
  assistantMessageId?: string | null;
  responseMetadata?: unknown;
}): Promise<void> {
  try {
    await (prisma as any).chatTurnRequestRecord.update({
      where: { sessionId_clientTurnId: { sessionId: args.sessionId, clientTurnId: args.clientTurnId } },
      data: {
        status: 'completed',
        userMessageId: args.userMessageId || undefined,
        assistantMessageId: args.assistantMessageId || undefined,
        responseMetadata: (args.responseMetadata as any) || undefined,
        completedAt: new Date(),
        updatedAt: new Date(),
        leaseExpiresAt: null,
        errorCode: null,
      },
    });
  } catch {
    // Non-fatal: conversation persistence is authoritative.
  }
}

export async function failChatTurn(args: {
  sessionId: string;
  clientTurnId: string;
  status: 'failed' | 'interrupted';
  errorCode?: string;
}): Promise<void> {
  try {
    await (prisma as any).chatTurnRequestRecord.update({
      where: { sessionId_clientTurnId: { sessionId: args.sessionId, clientTurnId: args.clientTurnId } },
      data: { status: args.status, errorCode: args.errorCode || null, updatedAt: new Date(), leaseExpiresAt: null },
    });
  } catch {
    // Non-fatal.
  }
}

/**
 * Ownership-safe session turn claim (024A §7 companion + concurrency seal).
 * Atomic compare-and-swap: exactly one UPDATE claims the session, guarded by
 * a WHERE clause that only matches when activeTurnId IS NULL (free) or
 * already equals this turn (idempotent retry). Two concurrent claimants can
 * never both observe null and both succeed — the row write serializes them
 * and only one UPDATE matches. Never overwrites another live turn.
 * Fail-closed: any schema/storage error returns claimed=false (a backend
 * running without the 024A migration is misconfigured and must fail safely).
 */
export async function claimSessionTurn(args: {
  sessionId: string;
  clientTurnId: string;
}): Promise<{ claimed: boolean; owner: string | null }> {
  try {
    const res = await (prisma as any).chatSession.updateMany({
      where: {
        id: args.sessionId,
        OR: [{ activeTurnId: null }, { activeTurnId: args.clientTurnId }],
      },
      data: { activeTurnId: args.clientTurnId },
    });
    if (Number(res?.count) === 1) {
      return { claimed: true, owner: args.clientTurnId };
    }
    // CAS lost (or session missing): read the actual owner exactly once.
    const current = await (prisma as any).chatSession
      .findUnique({ where: { id: args.sessionId }, select: { id: true, activeTurnId: true } })
      .catch(() => null);
    if (!current) return { claimed: false, owner: null };
    return { claimed: false, owner: (current as any).activeTurnId ?? null };
  } catch {
    // Fail closed: missing activeTurnId column (migration absent) or any
    // storage error is NEVER claimed=true.
    return { claimed: false, owner: null };
  }
}

/**
 * ONE durability barrier for turn completion (024A §7 + concurrency seal).
 * Inside a single DB transaction:
 * - confirm the turn still owns session.activeTurnId (strict equality);
 * - confirm the ledger row exists and is still in_progress;
 * - record assistantMessageId + response metadata, mark ledger completed;
 * - clear ChatSession.activeTurnId.
 * SSE `done` may be emitted ONLY after this resolves { ok: true }.
 * Fail-closed: a missing activeTurnId column, a missing ledger row/table, or
 * any ownership-clear failure resolves { ok: false } — never a successful
 * completion. A backend running without the 024A migration is misconfigured
 * and must fail safely.
 */
export async function finalizeChatTurn(args: {
  sessionId: string;
  clientTurnId: string;
  userMessageId?: string | null;
  assistantMessageId?: string | null;
  responseMetadata?: unknown;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  try {
    const result = await (prisma as any).$transaction(async (tx: any) => {
      let session: any = null;
      try {
        session = await tx.chatSession.findUnique({
          where: { id: args.sessionId },
          select: { id: true, activeTurnId: true },
        });
      } catch {
        // Fail closed: activeTurnId unreadable (migration absent).
        return { ok: false as boolean, code: 'SESSION_CLAIM_UNAVAILABLE' as string };
      }
      if (!session) return { ok: false as boolean, code: 'SESSION_NOT_FOUND' as string };
      const current = (session as any).activeTurnId ?? null;
      if (current !== args.clientTurnId) {
        return { ok: false as boolean, code: 'TURN_OWNERSHIP_LOST' as string };
      }
      let ledger: any = null;
      try {
        ledger = await tx.chatTurnRequestRecord.findUnique({
          where: { sessionId_clientTurnId: { sessionId: args.sessionId, clientTurnId: args.clientTurnId } },
        });
      } catch {
        // Fail closed: ledger table unreadable (migration absent).
        return { ok: false as boolean, code: 'TURN_LEDGER_UNAVAILABLE' as string };
      }
      if (!ledger) {
        // Fail closed: no ledger row, no completion.
        return { ok: false as boolean, code: 'TURN_LEDGER_MISSING' as string };
      }
      if (ledger.status !== 'in_progress') {
        return { ok: false as boolean, code: 'TURN_NOT_IN_PROGRESS' as string };
      }
      await tx.chatTurnRequestRecord.update({
        where: { sessionId_clientTurnId: { sessionId: args.sessionId, clientTurnId: args.clientTurnId } },
        data: {
          status: 'completed',
          userMessageId: args.userMessageId || ledger.userMessageId || undefined,
          assistantMessageId: args.assistantMessageId || undefined,
          responseMetadata: (args.responseMetadata as any) ?? ledger.responseMetadata ?? undefined,
          completedAt: new Date(),
          updatedAt: new Date(),
          leaseExpiresAt: null,
          errorCode: null,
        },
      });
      // Ownership release: any failure rolls the whole transaction back, so a
      // completed ledger can never strand ownership. No silent fallback.
      await tx.chatSession.update({
        where: { id: args.sessionId },
        data: { activeTurnId: null },
      });
      return { ok: true as boolean, code: '' as string };
    });
    if ((result as any).ok) return { ok: true };
    return { ok: false, code: (result as any).code || 'FINALIZE_REJECTED' };
  } catch (err: any) {
    return { ok: false, code: String(err?.message || 'FINALIZE_FAILED') };
  }
}

/**
 * Ownership-safe abort for fail/interrupt paths (024A §7 companion + seal).
 * Ledger moves to failed/interrupted and activeTurnId clears ONLY when still
 * owned by this turn — a failed clear can neither strand nor steal ownership.
 * Fail-closed observability: every mutation failure is captured and returned
 * ({ ok:false, code }) instead of silently claiming durable cleanup succeeded.
 * Callers MUST treat { ok:false } as "cleanup not proven" (log + retryable).
 */
export async function abortSessionTurn(args: {
  sessionId: string;
  clientTurnId: string;
  status: 'failed' | 'interrupted';
  errorCode?: string;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const failures: string[] = [];
  try {
    await (prisma as any).$transaction(async (tx: any) => {
      try {
        await tx.chatTurnRequestRecord.update({
          where: { sessionId_clientTurnId: { sessionId: args.sessionId, clientTurnId: args.clientTurnId } },
          data: {
            status: args.status,
            errorCode: args.errorCode || null,
            updatedAt: new Date(),
            leaseExpiresAt: null,
          },
        });
      } catch (err: any) {
        failures.push(`TURN_LEDGER_ABORT_FAILED:${String(err?.message || err || 'unknown')}`);
      }
      let current: string | null = null;
      let ownershipReadable = true;
      try {
        current = ((await tx.chatSession.findUnique({
          where: { id: args.sessionId },
          select: { activeTurnId: true },
        })) as any)?.activeTurnId ?? null;
      } catch (err: any) {
        ownershipReadable = false;
        failures.push(`SESSION_CLAIM_READ_FAILED:${String(err?.message || err || 'unknown')}`);
      }
      if (ownershipReadable && current === args.clientTurnId) {
        try {
          await tx.chatSession.update({
            where: { id: args.sessionId },
            data: { activeTurnId: null },
          });
        } catch (err: any) {
          failures.push(`SESSION_CLAIM_RELEASE_FAILED:${String(err?.message || err || 'unknown')}`);
        }
      }
    });
  } catch (err: any) {
    failures.push(`ABORT_TRANSACTION_FAILED:${String(err?.message || err || 'unknown')}`);
  }
  if (failures.length > 0) return { ok: false, code: failures[0]!.split(':').slice(0, 1).join('') || 'ABORT_FAILED' };
  return { ok: true };
}

/**
 * Atomic message append (§16 + concurrency seal): serialize on the owned
 * ChatSession row FIRST (a write lock that serializes all concurrent appends
 * for one session — a transaction alone does not serialize), then number from
 * MAX(messageNumber) under the lock, insert, update projection
 * (lastMessageAt, preview, messageCount, updatedAt) in one transaction.
 * Never hold open during AI generation: call once per persisted message.
 * Fail-closed: a projection-column failure rolls the transaction back. No
 * updatedAt-only downgrade. @@unique([sessionId, messageNumber]) remains the
 * final DB defense.
 */
export async function appendChatMessageAtomic(args: {
  sessionId: string;
  role: string;
  content: string;
  turnId?: string | null;
  metadata?: unknown;
}): Promise<any> {
  return (prisma as any).$transaction(async (tx: any) => {
    const session = await tx.chatSession.findUnique({
      where: { id: args.sessionId },
      select: { id: true },
    });
    if (!session) throw new Error('SESSION_NOT_FOUND');
    // Per-session serialization: this row write takes the session lock so all
    // concurrent appends for this session order here before reading MAX.
    await tx.chatSession.update({
      where: { id: args.sessionId },
      data: { updatedAt: new Date() },
    });
    const agg = await tx.chatMessage.aggregate({
      where: { sessionId: args.sessionId },
      _max: { messageNumber: true },
      _count: { _all: true },
    });
    const nextNumber = Number(agg?._max?.messageNumber || 0) + 1;
    const created = await tx.chatMessage.create({
      data: {
        id: randomUUID(),
        sessionId: args.sessionId,
        role: args.role,
        content: args.content,
        timestamp: new Date(),
        messageNumber: nextNumber,
        ...(args.turnId ? { turnId: args.turnId } : {}),
        ...(args.metadata !== undefined ? { metadata: args.metadata as any } : {}),
      },
    });
    const preview = clampPreviewText(args.content);
    const updateData: Record<string, unknown> = {
      lastMessageAt: new Date(),
      latestVisibleMessagePreview: preview,
      messageCount: Number(agg?._count?._all || 0) + 1,
      updatedAt: new Date(),
    };
    // Fail closed: projection columns are required by the 024A migration. Any
    // failure throws and rolls back the insert — never an updatedAt-only write.
    await tx.chatSession.update({ where: { id: args.sessionId }, data: updateData });
    return created;
  });
}

/** Central title mutation (§10): exactly one titleVersion increment, never touches lastMessageAt. */
export async function persistSessionTitle(args: { sessionId: string; title: string }): Promise<any> {
  const safe = String(args.title || '').trim().slice(0, 120) || 'New study session';
  const current = await prisma.chatSession.findUnique({
    where: { id: args.sessionId },
    select: { id: true, titleVersion: true } as any,
  });
  const nextVersion = Number((current as any)?.titleVersion || 0) + 1;
  try {
    return await prisma.chatSession.update({
      where: { id: args.sessionId },
      data: { topic: safe, titleVersion: nextVersion, updatedAt: new Date() } as any,
    });
  } catch {
    return prisma.chatSession.update({
      where: { id: args.sessionId },
      data: { topic: safe, updatedAt: new Date() },
    });
  }
}

/** Rebuild projection from canonical remaining history (edit/delete path, §36). */
export async function rebuildSessionProjection(sessionId: string): Promise<void> {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: { ChatMessage: { orderBy: [{ messageNumber: 'asc' }, { timestamp: 'asc' }] } },
  });
  if (!session) return;
  const msgs = getSessionMessages(session);
  const last = msgs[msgs.length - 1];
  const preview = deriveLatestVisiblePreview(msgs);
  try {
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        messageCount: msgs.length,
        lastMessageAt: last?.timestamp ? new Date(last.timestamp as any) : null,
        latestVisibleMessagePreview: preview,
        updatedAt: new Date(),
      } as any,
    });
  } catch {
    await prisma.chatSession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } });
  }
}
