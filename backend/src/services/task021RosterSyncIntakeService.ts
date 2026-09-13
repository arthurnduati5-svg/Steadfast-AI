import type {
  Task021RosterSyncBatch,
  Task021RosterRecord,
  Task021ExternalIdentityProvider,
  Task021RosterSyncStatus,
} from '../contracts/task021SchoolIntegrationContracts';
import { TASK021_FORBIDDEN_FIELDS } from '../contracts/task021SchoolIntegrationContracts';

export interface RosterSyncIntakeResult {
  batchId: string;
  schoolId: string;
  provider: Task021ExternalIdentityProvider;
  status: Task021RosterSyncStatus;
  recordCount: number;
  rejectedFields: string[];
  reasonCodes: string[];
}

export function validateRosterSyncBatchPayload(
  payload: Record<string, unknown>,
): string[] {
  const forbidden = TASK021_FORBIDDEN_FIELDS as readonly string[];
  return forbidden.filter(f => f in payload);
}

export function createRosterSyncBatch(
  schoolId: string,
  provider: Task021ExternalIdentityProvider,
): Task021RosterSyncBatch {
  return {
    batchId: `batch_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
    schoolId,
    provider,
    receivedAt: new Date().toISOString(),
    status: 'received',
    recordCount: 0,
    safeMetadata: {},
  };
}

export function rejectRawRosterPayload(
  payload: Record<string, unknown>,
): { rejected: boolean; rejectedFields: string[] } {
  const rejectedFields = validateRosterSyncBatchPayload(payload);
  return { rejected: rejectedFields.length > 0, rejectedFields };
}

export function ingestRosterRecordMetadata(
  batch: Task021RosterSyncBatch,
  record: Task021RosterRecord,
): Task021RosterSyncBatch {
  return {
    ...batch,
    recordCount: batch.recordCount + 1,
    status: 'validated',
  };
}

export function summarizeRosterSyncBatch(
  batch: Task021RosterSyncBatch,
): Record<string, unknown> {
  return {
    batchId: batch.batchId,
    schoolId: batch.schoolId,
    provider: batch.provider,
    status: batch.status,
    recordCount: batch.recordCount,
    receivedAt: batch.receivedAt,
  };
}
