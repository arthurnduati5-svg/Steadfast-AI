import { recordDurableAuditEvent } from './durableAuditEventService';
import type { DurableAuditEventCategory, DurableAuditSeverity, DurableAuditActor } from '../contracts/durableAuditEventContracts';
import crypto from 'crypto';

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

const inProgressStore = new Map<string, { status: string; startedAt: number }>();

function hashRequest(schoolId: string, tutorLearnerId: string, idempotencyKey: string): string {
  return crypto.createHash('sha256').update(`${schoolId}:${tutorLearnerId}:${idempotencyKey}`).digest('hex');
}

function isExpired(entry: { startedAt: number }): boolean {
  return Date.now() - entry.startedAt > IDEMPOTENCY_TTL_MS;
}

export async function tryAcquireIdempotencyLock(
  schoolId: string,
  tutorLearnerId: string,
  idempotencyKey: string,
): Promise<{ acquired: boolean; existingResult?: string; errorCode?: string }> {
  const hash = hashRequest(schoolId, tutorLearnerId, idempotencyKey);

  const existing = inProgressStore.get(hash);
  if (existing) {
    if (isExpired(existing)) {
      inProgressStore.delete(hash);
    } else if (existing.status === 'in_progress') {
      return { acquired: false, errorCode: 'IDEMPOTENCY_CONFLICT' };
    }
  }

  inProgressStore.set(hash, { status: 'in_progress', startedAt: Date.now() });

  await recordDurableAuditEvent({
    category: 'request_lifecycle' as DurableAuditEventCategory,
    eventType: 'conversation.idempotency.acquired',
    severity: 'info' as DurableAuditSeverity,
    actorType: 'student' as DurableAuditActor['actorType'],
    actorId: tutorLearnerId,
    schoolId,
    safeSummary: `Idempotency lock acquired for key ${idempotencyKey.slice(0, 8)}...`,
    safeMetadata: { idempotencyKeyHash: hash.slice(0, 16) },
  }).catch(() => {});

  return { acquired: true };
}

export async function releaseIdempotencyLock(
  schoolId: string,
  tutorLearnerId: string,
  idempotencyKey: string,
  status: 'completed' | 'failed',
  errorCode?: string,
): Promise<void> {
  const hash = hashRequest(schoolId, tutorLearnerId, idempotencyKey);
  inProgressStore.delete(hash);

  await recordDurableAuditEvent({
    category: 'request_lifecycle' as DurableAuditEventCategory,
    eventType: 'conversation.idempotency.released',
    severity: 'info' as DurableAuditSeverity,
    actorType: 'student' as DurableAuditActor['actorType'],
    actorId: tutorLearnerId,
    schoolId,
    safeSummary: `Idempotency lock released for key ${idempotencyKey.slice(0, 8)}...`,
    safeMetadata: { idempotencyKeyHash: hash.slice(0, 16), status, errorCode },
  }).catch(() => {});
}

export async function cleanupExpiredLocks(): Promise<void> {
  for (const [hash, entry] of inProgressStore.entries()) {
    if (isExpired(entry)) {
      inProgressStore.delete(hash);
    }
  }
}
