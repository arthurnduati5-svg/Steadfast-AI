import { createHash } from 'crypto';
import { nowISO } from './task021SchoolIntegrationContracts';
import { logger } from '../utils/logger';
import { useDurableSchoolIntegration } from './schoolIntegrationDurableFlag';

interface IdempotencyRecord {
  idempotencyKey: string;
  schoolId: string;
  operation: string;
  requestHash: string;
  status: 'completed' | 'in_progress' | 'failed';
  safeResultSummary: string;
  createdAt: string;
  expiresAt: string;
  reasonCodes: string[];
}

const idempotencyCache = new Map<string, IdempotencyRecord>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export function clearIdempotencyStore(): void {
  idempotencyCache.clear();
}

export function computeRequestHash(payload: Record<string, unknown>): string {
  const sorted = JSON.stringify(payload, Object.keys(payload).sort());
  return createHash('sha256').update(sorted).digest('hex').slice(0, 16);
}

export function getIdempotencyKey(options: {
  operation: string;
  schoolId: string;
  externalBatchId?: string;
}): string {
  const parts = [options.operation, options.schoolId];
  if (options.externalBatchId) parts.push(options.externalBatchId);
  return createHash('sha256').update(parts.join('::')).digest('hex').slice(0, 32);
}

export async function tryAcquireIdempotencyLock(
  idempotencyKey: string,
  schoolId: string,
  operation: string,
  requestHash: string,
): Promise<{
  acquired: boolean;
  existingRecord?: IdempotencyRecord;
}> {
  purgeExpiredRecords();

  const existing = idempotencyCache.get(idempotencyKey);
  if (existing) {
    if (existing.status === 'completed') {
      return { acquired: false, existingRecord: existing };
    }
    if (existing.status === 'in_progress') {
      return { acquired: false, existingRecord: existing };
    }
    idempotencyCache.delete(idempotencyKey);
  }

  if (useDurableSchoolIntegration()) {
    try {
      const idempotencyRepo = await import('../repositories/schoolIntegrationIdempotencyRepository');
      const durableExisting = await idempotencyRepo.getIdempotencyRecordRepo(idempotencyKey);
      if (durableExisting) {
        idempotencyCache.set(idempotencyKey, durableExisting);
        if (durableExisting.status === 'completed' || durableExisting.status === 'in_progress') {
          return { acquired: false, existingRecord: durableExisting };
        }
      }
    } catch (err) {
      logger.error({ err, idempotencyKey }, '[IdempotencyService] Failed to check durable idempotency');
    }
  }

  const record: IdempotencyRecord = {
    idempotencyKey,
    schoolId,
    operation,
    requestHash,
    status: 'in_progress',
    safeResultSummary: '',
    createdAt: nowISO(),
    expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS).toISOString(),
    reasonCodes: ['idempotency_lock_acquired'],
  };

  idempotencyCache.set(idempotencyKey, record);

  if (useDurableSchoolIntegration()) {
    try {
      const idempotencyRepo = await import('../repositories/schoolIntegrationIdempotencyRepository');
      await idempotencyRepo.createIdempotencyRecord({
        idempotencyKey,
        schoolId,
        operation,
        requestHash,
        status: 'in_progress',
        reasonCodes: ['idempotency_lock_acquired', 'durable_persisted'],
        expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS).toISOString(),
      });
    } catch (err) {
      logger.error({ err, idempotencyKey }, '[IdempotencyService] Failed to persist idempotency lock durably');
    }
  }

  return { acquired: true };
}

export async function completeIdempotencyRecord(
  idempotencyKey: string,
  status: 'completed' | 'failed',
  safeResultSummary: string,
  reasonCodes: string[],
): Promise<void> {
  const record = idempotencyCache.get(idempotencyKey);
  if (!record) return;

  record.status = status;
  record.safeResultSummary = safeResultSummary;
  record.reasonCodes = [...record.reasonCodes, ...reasonCodes];

  if (useDurableSchoolIntegration()) {
    try {
      const idempotencyRepo = await import('../repositories/schoolIntegrationIdempotencyRepository');
      await idempotencyRepo.updateIdempotencyStatus(
        idempotencyKey,
        status,
        safeResultSummary,
        [...record.reasonCodes, 'durable_persisted'],
      );
    } catch (err) {
      logger.error({ err, idempotencyKey }, '[IdempotencyService] Failed to persist idempotency completion durably');
    }
  }
}

export async function getIdempotencyRecord(idempotencyKey: string): Promise<IdempotencyRecord | undefined> {
  purgeExpiredRecords();
  const cached = idempotencyCache.get(idempotencyKey);
  if (cached) return cached;

  if (useDurableSchoolIntegration()) {
    try {
      const idempotencyRepo = await import('../repositories/schoolIntegrationIdempotencyRepository');
      const durable = await idempotencyRepo.getIdempotencyRecordRepo(idempotencyKey);
      if (durable) {
        idempotencyCache.set(idempotencyKey, durable);
        return durable;
      }
    } catch (err) {
      logger.error({ err, idempotencyKey }, '[IdempotencyService] Failed to read durable idempotency record');
    }
  }
  return undefined;
}

export function getActiveIdempotencyCount(): number {
  purgeExpiredRecords();
  let count = 0;
  for (const record of idempotencyCache.values()) {
    if (record.status === 'in_progress') count++;
  }
  return count;
}

function purgeExpiredRecords(): void {
  const now = Date.now();
  for (const [key, record] of idempotencyCache.entries()) {
    if (new Date(record.expiresAt).getTime() < now) {
      idempotencyCache.delete(key);
    }
  }
}
