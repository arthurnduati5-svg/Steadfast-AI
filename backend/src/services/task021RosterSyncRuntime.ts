import type {
  RosterSyncBatch,
  RosterSyncResult,
  RosterSyncDetail,
  SchoolIntegrationErrorCode,
} from './task021SchoolIntegrationContracts';
import { nowISO } from './task021SchoolIntegrationContracts';
import {
  validateSchoolIntegrationContext,
} from './task021SchoolIntegrationTokenValidationService';
import { computeRosterDiff } from './task021RosterDiffService';
import {
  reconcileRosterDiff,
  applyReconciliationDecision,
} from './task021RosterReconciliationService';
import {
  tryAcquireIdempotencyLock,
  completeIdempotencyRecord,
  getIdempotencyKey,
  computeRequestHash,
} from './task021SchoolIntegrationIdempotencyService';
import {
  recordSchoolIntegrationAudit,
} from './task021SchoolIntegrationAuditService';
import { logger } from '../utils/logger';
import { getR8GBoundsConfig } from '../config/r8gBackendBounds';
import { useDurableSchoolIntegration } from './schoolIntegrationDurableFlag';

export interface SyncJobRecord {
  syncBatchId: string;
  schoolId: string;
  status: 'completed' | 'partial' | 'failed';
  createdMappings: number;
  updatedMappings: number;
  inactivatedMappings: number;
  reactivatedMappings: number;
  conflictCount: number;
  quarantinedCount: number;
  startedAt: string;
  completedAt?: string;
  reasonCodes: string[];
  details: RosterSyncDetail[];
}

const syncJobStore = new Map<string, SyncJobRecord>();

export function clearSyncJobStore(): void {
  syncJobStore.clear();
}

export function getSyncJob(batchId: string): SyncJobRecord | undefined {
  return syncJobStore.get(batchId);
}

export function getSyncJobsForSchool(schoolId: string): SyncJobRecord[] {
  return Array.from(syncJobStore.values()).filter(j => j.schoolId === schoolId);
}

export function getSyncJobCount(): number {
  return syncJobStore.size;
}

export async function processRosterSync(
  batch: RosterSyncBatch,
  requestId?: string,
): Promise<RosterSyncResult> {
  const schoolId = batch.schoolId;
  const syncBatchId = batch.syncBatchId;
  const startedAt = nowISO();

  const details: RosterSyncDetail[] = [];
  let createdCount = 0;
  let updatedCount = 0;
  let inactivatedCount = 0;
  let reactivatedCount = 0;
  let conflictCount = 0;
  let quarantinedCount = 0;

  const fireAudit = (eventType: string, reasonCodes: string[], decision: string): void => {
    // Fire-and-forget: audit persistence failure is non-critical, must not block sync
    recordSchoolIntegrationAudit({
      schoolId,
      eventType: eventType as any,
      actorRole: 'internal_operator',
      operation: 'roster_sync',
      decision,
      reasonCodes,
      requestId,
    }).catch((_err) => {
      // Non-critical audit failure; sync result must never depend on audit success
    });
  };

  // Start audit
  fireAudit('roster_sync_started', ['sync_started'], 'started');

  if (batch.idempotencyKey) {
    const requestHash = computeRequestHash(batch as any);
    const idempotencyResult = await tryAcquireIdempotencyLock(
      batch.idempotencyKey,
      schoolId,
      'roster_sync',
      requestHash,
    );

    if (!idempotencyResult.acquired && idempotencyResult.existingRecord) {
      fireAudit('idempotency_replayed', ['idempotency_replay_skipped'], 'skipped');
      return {
        syncBatchId,
        status: 'completed',
        createdMappings: 0,
        updatedMappings: 0,
        inactivatedMappings: 0,
        reactivatedMappings: 0,
        conflicts: 0,
        quarantined: 0,
        reasonCodes: ['idempotency_replay_skipped'],
        privacyMetadata: { skippedDueToIdempotency: true, originalStatus: idempotencyResult.existingRecord.status },
      };
    }
  }

  const diff = await computeRosterDiff(batch);

  if (diff.conflictsFound > 0) {
    for (const entry of diff.entries) {
      if (entry.category === 'conflict_duplicate_external_id' || entry.category === 'conflict_duplicate_tutor_mapping') {
        details.push({
          recordType: entry.role || 'unknown',
          externalId: entry.externalId,
          action: 'conflict',
          safeSummary: entry.details || 'Roster conflict detected',
          reasonCodes: [entry.category],
        });
        conflictCount++;
        quarantinedCount++;
      }
    }

    fireAudit('roster_record_quarantined', ['conflicts_found'], 'quarantined');

    syncJobStore.set(syncBatchId, {
      syncBatchId,
      schoolId,
      status: 'partial',
      createdMappings: 0,
      updatedMappings: 0,
      inactivatedMappings: 0,
      reactivatedMappings: 0,
      conflictCount,
      quarantinedCount,
      startedAt,
      completedAt: nowISO(),
      reasonCodes: ['conflicts_found_sync_partial'],
      details,
    });

    return {
      syncBatchId,
      status: 'partial',
      createdMappings: 0,
      updatedMappings: 0,
      inactivatedMappings: 0,
      reactivatedMappings: 0,
      conflicts: conflictCount,
      quarantined: quarantinedCount,
      reasonCodes: ['conflicts_found_sync_partial'],
      privacyMetadata: { startedAt, completedAt: nowISO(), partialDueToConflicts: true },
      syncDetails: details,
    };
  }

  // R8-G: over-bound diffs fail closed here — partial application is forbidden.
  if (diff.entries.length > (getR8GBoundsConfig().config.rosterMaxRecords ?? Number.MAX_SAFE_INTEGER)) {
    const limit = getR8GBoundsConfig().config.rosterMaxRecords as number;
    fireAudit('roster_sync_rejected', ['roster_payload_too_large'], 'rejected');
    syncJobStore.set(syncBatchId, {
      syncBatchId,
      schoolId,
      status: 'failed',
      createdMappings: 0,
      updatedMappings: 0,
      inactivatedMappings: 0,
      reactivatedMappings: 0,
      conflictCount: 0,
      quarantinedCount: 0,
      startedAt,
      completedAt: nowISO(),
      reasonCodes: ['roster_payload_too_large', `received:${diff.entries.length}`, `limit:${limit}`],
      details: [],
    });
    return {
      syncBatchId,
      status: 'failed',
      createdMappings: 0,
      updatedMappings: 0,
      inactivatedMappings: 0,
      reactivatedMappings: 0,
      conflicts: 0,
      quarantined: 0,
      reasonCodes: ['roster_payload_too_large', `received:${diff.entries.length}`, `limit:${limit}`],
      privacyMetadata: { startedAt, completedAt: nowISO(), rejectedDueToBound: true },
    };
  }

  const reconciliation = reconcileRosterDiff(diff.entries, schoolId);

  if (reconciliation.rejected) {
    fireAudit('roster_sync_rejected', ['roster_payload_too_large'], 'rejected');
    syncJobStore.set(syncBatchId, {
      syncBatchId,
      schoolId,
      status: 'failed',
      createdMappings: 0,
      updatedMappings: 0,
      inactivatedMappings: 0,
      reactivatedMappings: 0,
      conflictCount: 0,
      quarantinedCount: 0,
      startedAt,
      completedAt: nowISO(),
      reasonCodes: ['roster_payload_too_large', `received:${reconciliation.rejected.received}`, `limit:${reconciliation.rejected.limit}`],
      details: [],
    });
    return {
      syncBatchId,
      status: 'failed',
      createdMappings: 0,
      updatedMappings: 0,
      inactivatedMappings: 0,
      reactivatedMappings: 0,
      conflicts: 0,
      quarantined: 0,
      reasonCodes: ['roster_payload_too_large', `received:${reconciliation.rejected.received}`, `limit:${reconciliation.rejected.limit}`],
      privacyMetadata: { startedAt, completedAt: nowISO(), rejectedDueToBound: true },
    };
  }

  for (const decision of reconciliation.decisions) {
    const applied = await applyReconciliationDecision(decision);
    const action = decision.action;

    let syncAction: RosterSyncDetail['action'] = 'skipped';
    if (action === 'create_mapping') {
      syncAction = 'created';
      createdCount++;
    } else if (action === 'update_mapping') {
      syncAction = 'updated';
      updatedCount++;
    } else if (action === 'inactivate_mapping') {
      syncAction = 'inactivated';
      inactivatedCount++;
    } else if (action === 'reactivate_mapping') {
      syncAction = 'reactivated';
      reactivatedCount++;
    } else if (action === 'quarantine') {
      syncAction = 'quarantined';
      quarantinedCount++;
    }

    details.push({
      recordType: decision.entry.role || 'unknown',
      externalId: decision.entry.externalId,
      action: syncAction,
      safeSummary: decision.safeSummary,
      reasonCodes: decision.reasonCodes,
    });
  }

  const syncStatus: SyncJobRecord['status'] = reconciliation.quarantinedCount > 0 ? 'partial' : 'completed';

  const syncJobRecord: SyncJobRecord = {
    syncBatchId,
    schoolId,
    status: syncStatus,
    createdMappings: createdCount,
    updatedMappings: updatedCount,
    inactivatedMappings: inactivatedCount,
    reactivatedMappings: reactivatedCount,
    conflictCount,
    quarantinedCount,
    startedAt,
    completedAt: nowISO(),
    reasonCodes: ['roster_sync_completed'],
    details,
  };

  syncJobStore.set(syncBatchId, syncJobRecord);

  if (useDurableSchoolIntegration()) {
    const { persistSyncJobToDurable, persistConflictToDurable, persistIdempotencyToDurable } =
      await import('./task021SchoolIntegrationDurableBridge');
    await persistSyncJobToDurable(syncJobRecord);
    for (const d of details) {
      if (d.action === 'conflict' || d.action === 'quarantined') {
        await persistConflictToDurable({
          schoolId,
          syncBatchId,
          conflictType: d.action === 'conflict' ? 'identity_conflict' : 'quarantine',
          externalUserId: d.externalId,
          safeSummary: d.safeSummary,
          reasonCodes: d.reasonCodes,
        });
      }
    }
  }

  if (batch.idempotencyKey) {
    await completeIdempotencyRecord(
      batch.idempotencyKey,
      'completed',
      `Roster sync ${syncBatchId}: ${createdCount} created, ${inactivatedCount} inactivated`,
      ['roster_sync_idempotency_completed'],
    );

    if (useDurableSchoolIntegration()) {
      const { persistIdempotencyToDurable } = await import('./task021SchoolIntegrationDurableBridge');
      const requestHash = computeRequestHash(batch as any);
      await persistIdempotencyToDurable(
        batch.idempotencyKey,
        schoolId,
        'roster_sync',
        'completed',
        requestHash,
        `Roster sync ${syncBatchId}: ${createdCount} created, ${inactivatedCount} inactivated`,
      );
    }
  }

  fireAudit('roster_sync_completed', ['sync_completed'], 'completed');

  logger.info(
    { syncBatchId, schoolId, createdCount, updatedCount, inactivatedCount, conflictCount },
    '[RosterSyncRuntime] Roster sync completed',
  );

  return {
    syncBatchId,
    status: syncStatus,
    createdMappings: createdCount,
    updatedMappings: updatedCount,
    inactivatedMappings: inactivatedCount,
    reactivatedMappings: reactivatedCount,
    conflicts: conflictCount,
    quarantined: quarantinedCount,
    reasonCodes: ['roster_sync_completed'],
    privacyMetadata: { startedAt, completedAt: nowISO() },
    syncDetails: details,
  };
}
