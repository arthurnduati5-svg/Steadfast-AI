import { logger } from '../utils/logger';
import { initializeDurableSchoolIntegration } from './schoolIntegrationDurableBootstrap';
import { initializeIdentityMappingsFromDurable } from './task021SchoolIdentityMappingService';

let seeded = false;

export async function seedInMemoryStoresFromDurable(): Promise<void> {
  if (seeded) return;

  logger.info('[SchoolIntegrationDurableBridge] Seeding in-memory stores from durable persistence...');

  try {
    initializeDurableSchoolIntegration();
    await initializeIdentityMappingsFromDurable();

    seeded = true;
    logger.info('[SchoolIntegrationDurableBridge] In-memory stores seeded from durable persistence');
  } catch (error) {
    logger.error({ error }, '[SchoolIntegrationDurableBridge] Failed to seed in-memory stores');
    throw error;
  }
}

export async function persistIdentityMappingToDurable(
  schoolId: string,
  externalUserId: string,
  role: string,
  externalStudentId?: string,
  externalTeacherId?: string,
  tutorLearnerId?: string,
  status?: string,
): Promise<void> {
  try {
    const identityRepo = await import('../repositories/schoolIdentityMappingRepository');
    const existing = await identityRepo.resolveExternalIdentityRepo(schoolId, externalUserId);
    if (existing) {
      if (status) {
        await identityRepo.updateMappingStatusRepo(schoolId, externalUserId, status);
        logger.debug(
          { schoolId, externalUserId, status },
          '[SchoolIntegrationDurableBridge] Updated identity mapping in DB',
        );
      }
      return;
    }

    if (role === 'student' && externalStudentId) {
      const { default: prisma } = await import('../lib/prisma');
      await prisma.tutorLearnerIdentityMap.create({
        data: {
          id: `${schoolId}_${externalUserId}_${Date.now()}`,
          tutorLearnerId: tutorLearnerId ?? `tl_${Date.now()}`,
          externalUserId: externalUserId,
          externalStudentId: externalStudentId,
          schoolId,
          classId: null,
          grade: null,
          role: role,
          status: status ?? 'active',
          reasonCodes: ['durable_persisted_via_bridge'],
        },
      });
      logger.debug(
        { schoolId, externalUserId, tutorLearnerId },
        '[SchoolIntegrationDurableBridge] Persisted identity mapping to DB',
      );
    }
  } catch (error) {
    logger.error({ error }, '[SchoolIntegrationDurableBridge] Failed to persist identity mapping');
    throw error;
  }
}

export async function persistSyncJobToDurable(
  job: import('../repositories/schoolRosterSyncJobRepository').SyncJobRecord,
): Promise<void> {
  try {
    const syncJobRepo = await import('../repositories/schoolRosterSyncJobRepository');
    await syncJobRepo.createSyncJob(job);
    logger.debug(
      { syncBatchId: job.syncBatchId, schoolId: job.schoolId },
      '[SchoolIntegrationDurableBridge] Persisted sync job to DB',
    );
  } catch (error) {
    logger.error({ error }, '[SchoolIntegrationDurableBridge] Failed to persist sync job');
    throw error;
  }
}

export async function persistConflictToDurable(data: {
  schoolId: string;
  syncBatchId: string;
  conflictType: string;
  externalUserId?: string;
  externalStudentId?: string;
  externalTeacherId?: string;
  tutorLearnerId?: string;
  safeSummary: string;
  reasonCodes: string[];
}): Promise<void> {
  try {
    const conflictRepo = await import('../repositories/schoolRosterSyncConflictRepository');
    await conflictRepo.createConflict(data);
    logger.debug(
      { syncBatchId: data.syncBatchId, schoolId: data.schoolId, conflictType: data.conflictType },
      '[SchoolIntegrationDurableBridge] Persisted conflict to DB',
    );
  } catch (error) {
    logger.error({ error }, '[SchoolIntegrationDurableBridge] Failed to persist conflict');
    throw error;
  }
}

export async function persistIdempotencyToDurable(
  idempotencyKey: string,
  schoolId: string,
  operation: string,
  status: string,
  requestHash: string,
  safeResultSummary?: string,
): Promise<void> {
  try {
    const idempotencyRepo = await import('../repositories/schoolIntegrationIdempotencyRepository');
    await idempotencyRepo.createIdempotencyRecord({
      idempotencyKey,
      schoolId,
      operation,
      requestHash,
      status,
      safeResultSummary,
      reasonCodes: ['durable_persisted'],
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
    logger.debug(
      { idempotencyKey, schoolId, operation },
      '[SchoolIntegrationDurableBridge] Persisted idempotency record to DB',
    );
  } catch (error) {
    logger.error({ error }, '[SchoolIntegrationDurableBridge] Failed to persist idempotency');
    throw error;
  }
}

export async function persistAuditToDurable(data: {
  eventType: string;
  actorRole: string;
  schoolId?: string;
  actorId?: string;
  externalUserId?: string;
  tutorLearnerId?: string;
  route?: string;
  operation?: string;
  decision: string;
  reasonCodes: string[];
  requestId?: string;
  correlationId?: string;
  privacyMetadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const auditRepo = await import('../repositories/schoolIntegrationAuditRepository');
    await auditRepo.createAuditRecord(data);
    logger.debug(
      { eventType: data.eventType, schoolId: data.schoolId },
      '[SchoolIntegrationDurableBridge] Persisted audit record to DB',
    );
  } catch (error) {
    logger.error({ error }, '[SchoolIntegrationDurableBridge] Failed to persist audit record');
    throw error;
  }
}

export async function readMappingFromDurable(
  schoolId: string,
  externalUserId: string,
): Promise<any> {
  const identityRepo = await import('../repositories/schoolIdentityMappingRepository');
  return identityRepo.resolveExternalIdentityRepo(schoolId, externalUserId);
}

export async function getSyncJobsFromDurable(schoolId: string): Promise<import('../repositories/schoolRosterSyncJobRepository').SyncJobRecord[]> {
  const syncJobRepo = await import('../repositories/schoolRosterSyncJobRepository');
  return syncJobRepo.getSyncJobsForSchoolRepo(schoolId);
}

export async function getConflictsFromDurable(schoolId: string): Promise<import('../repositories/schoolRosterSyncConflictRepository').SyncConflictRecord[]> {
  const conflictRepo = await import('../repositories/schoolRosterSyncConflictRepository');
  return conflictRepo.getConflictsForSchoolRepo(schoolId);
}
