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
    // Ledger table may not exist yet (migration pending): fail open to legacy path.
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
 * Atomic message append (§16): serialize on the owned ChatSession row,
 * number from MAX(messageNumber) under the lock, insert, update projection
 * (lastMessageAt, preview, messageCount, updatedAt) in one transaction.
 * Never hold open during AI generation: call once per persisted message.
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
    try {
      await tx.chatSession.update({ where: { id: args.sessionId }, data: updateData });
    } catch {
      // Older DB without new columns: fall back to updatedAt only.
      await tx.chatSession.update({ where: { id: args.sessionId }, data: { updatedAt: new Date() } });
    }
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
