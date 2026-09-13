import type {
  SchoolIntegrationDiagnosticsSnapshot,
  SchoolActorRole,
} from './task021SchoolIntegrationContracts';
import { isAdminInternalRole } from './task021SchoolIntegrationContracts';
import { getMappingSummary, getIdentityMappingCount } from './task021SchoolIdentityMappingService';
import { getSyncJobsForSchool } from './task021RosterSyncRuntime';
import { getTeacherAssignmentCounts } from './task021TeacherAssignmentScopeService';
import { getAuditRecordsForSchool, getAuditSummary } from './task021SchoolIntegrationAuditService';
import { getActiveIdempotencyCount } from './task021SchoolIntegrationIdempotencyService';

export async function getSchoolIntegrationDiagnostics(
  schoolId: string,
  requesterRole: SchoolActorRole,
): Promise<SchoolIntegrationDiagnosticsSnapshot | { error: string; reasonCodes: string[] }> {
  if (!isAdminInternalRole(requesterRole)) {
    return {
      error: 'Forbidden: admin/internal role required for integration diagnostics',
      reasonCodes: ['role_not_authorized_for_diagnostics', 'admin_internal_role_required'],
    };
  }

  const mappingSummary = await getMappingSummary(schoolId);
  const syncJobs = getSyncJobsForSchool(schoolId);
  const assignmentCounts = getTeacherAssignmentCounts(schoolId);
  const auditRecords = getAuditRecordsForSchool(schoolId);
  const auditSummary = getAuditSummary();

  const lastSync = syncJobs.length > 0
    ? syncJobs.reduce((latest, job) =>
        job.completedAt && (!latest.completedAt || job.completedAt > latest.completedAt) ? job : latest,
      )
    : null;

  const conflictsInAudit = auditRecords.filter(
    r => r.eventType === 'identity_mapping_conflict' || r.eventType === 'roster_record_quarantined',
  );

  const quarantineInAudit = auditRecords.filter(
    r => r.eventType === 'roster_record_quarantined',
  );

  return {
    schoolId,
    lastSyncStatus: lastSync?.status || null,
    lastSyncAt: lastSync?.completedAt || null,
    totalMappings: mappingSummary.total,
    activeMappings: mappingSummary.active,
    inactiveMappings: mappingSummary.inactive,
    transferredMappings: mappingSummary.transferred,
    teacherAssignmentsActive: assignmentCounts.active,
    teacherAssignmentsRemoved: assignmentCounts.removed,
    conflictCount: conflictsInAudit.length,
    quarantineCount: quarantineInAudit.length,
    totalSyncJobs: syncJobs.length,
    failedSyncJobs: syncJobs.filter(j => j.status === 'failed').length,
    reasonCodes: ['diagnostics_generated'],
    privacyMetadata: {
      generatedAt: new Date().toISOString(),
      idempotencyActiveCount: getActiveIdempotencyCount(),
      totalAuditEvents: auditSummary.totalEvents,
    },
  };
}

export async function getSchoolIntegrationStatus(schoolId: string): Promise<{
  integrationActive: boolean;
  hasMappings: boolean;
  hasRecentSync: boolean;
  reasonCodes: string[];
}> {
  const mappingSummary = await getMappingSummary(schoolId);
  const syncJobs = getSyncJobsForSchool(schoolId);

  return {
    integrationActive: mappingSummary.total > 0 || syncJobs.length > 0,
    hasMappings: mappingSummary.total > 0,
    hasRecentSync: syncJobs.some(j => j.status === 'completed'),
    reasonCodes: ['integration_status_checked'],
  };
}
