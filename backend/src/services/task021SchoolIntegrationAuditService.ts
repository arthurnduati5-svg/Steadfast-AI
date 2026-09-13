import type {
  SchoolIntegrationAuditRecord,
  SchoolIntegrationAuditEvent,
  SchoolIntegrationAuditEventType,
  SchoolActorRole,
} from './task021SchoolIntegrationContracts';
import { nowISO } from './task021SchoolIntegrationContracts';
import { logger } from '../utils/logger';
import { useDurableSchoolIntegration } from './schoolIntegrationDurableFlag';

const auditStore: SchoolIntegrationAuditRecord[] = [];
const MAX_AUDIT_RECORDS = 10000;

export function clearAuditStore(): void {
  auditStore.length = 0;
}

export function getAuditStoreSize(): number {
  return auditStore.length;
}

export async function recordSchoolIntegrationAudit(event: SchoolIntegrationAuditEvent): Promise<SchoolIntegrationAuditRecord> {
  const record: SchoolIntegrationAuditRecord = {
    eventType: event.eventType,
    actorId: event.actorId,
    actorRole: event.actorRole,
    schoolId: event.schoolId,
    externalUserId: event.externalUserId,
    tutorLearnerId: event.tutorLearnerId,
    route: event.route,
    operation: event.operation,
    decision: event.decision,
    reasonCodes: event.reasonCodes,
    requestId: event.requestId,
    correlationId: event.correlationId,
    privacyMetadata: event.privacyMetadata || {},
    createdAt: nowISO(),
  };

  auditStore.push(record);
  if (auditStore.length > MAX_AUDIT_RECORDS) {
    auditStore.shift();
  }

  logger.debug(
    { eventType: event.eventType, schoolId: event.schoolId, decision: event.decision },
    '[SchoolIntegrationAudit] Recorded audit event',
  );

  if (useDurableSchoolIntegration()) {
    try {
      const auditRepo = await import('../repositories/schoolIntegrationAuditRepository');
      await auditRepo.createAuditRecord({
        eventType: record.eventType,
        actorId: record.actorId,
        actorRole: record.actorRole,
        schoolId: record.schoolId,
        externalUserId: record.externalUserId,
        tutorLearnerId: record.tutorLearnerId,
        route: record.route,
        operation: record.operation,
        decision: record.decision,
        reasonCodes: record.reasonCodes,
        requestId: record.requestId,
        correlationId: record.correlationId,
        privacyMetadata: record.privacyMetadata,
      });
    } catch (err) {
      logger.error(
        { err, eventType: record.eventType },
        '[SchoolIntegrationAudit] Failed to persist audit record durably - non-critical audit persistence error; in-memory record preserved',
      );
    }
  }

  return record;
}

export function getAuditRecordsForSchool(schoolId: string): SchoolIntegrationAuditRecord[] {
  return auditStore.filter(r => r.schoolId === schoolId);
}

export function getAuditRecordsByType(eventType: SchoolIntegrationAuditEventType): SchoolIntegrationAuditRecord[] {
  return auditStore.filter(r => r.eventType === eventType);
}

export function getAuditSummary(): {
  totalEvents: number;
  eventTypeCounts: Record<string, number>;
  schoolCounts: Record<string, number>;
} {
  const eventTypeCounts: Record<string, number> = {};
  const schoolCounts: Record<string, number> = {};

  for (const record of auditStore) {
    eventTypeCounts[record.eventType] = (eventTypeCounts[record.eventType] || 0) + 1;
    const school = record.schoolId || 'unknown';
    schoolCounts[school] = (schoolCounts[school] || 0) + 1;
  }

  return {
    totalEvents: auditStore.length,
    eventTypeCounts,
    schoolCounts,
  };
}

export function queryAuditRecords(options: {
  schoolId?: string;
  eventType?: SchoolIntegrationAuditEventType;
  actorRole?: SchoolActorRole;
  limit?: number;
}): SchoolIntegrationAuditRecord[] {
  let results = auditStore;

  if (options.schoolId) {
    results = results.filter(r => r.schoolId === options.schoolId);
  }
  if (options.eventType) {
    results = results.filter(r => r.eventType === options.eventType);
  }
  if (options.actorRole) {
    results = results.filter(r => r.actorRole === options.actorRole);
  }

  const limit = options.limit || 100;
  return results.slice(-limit);
}
