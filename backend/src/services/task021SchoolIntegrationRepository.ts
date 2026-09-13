import type {
  Task021ExternalSchoolIdentity,
  Task021InternalTutorIdentity,
  Task021IdentityMapping,
  Task021RosterRecord,
  Task021RosterSyncBatch,
  Task021RosterReconciliationResult,
  Task021TeacherAssignment,
  Task021ParentLearnerLink,
  Task021SchoolContextVerification,
  Task021RoleScopeDecision,
  Task021IntegrationFailure,
  Task021SchoolIntegrationDiagnostic,
  Task021SchoolIntegrationAuditEvent,
  Task021SchoolIntegrationQuery,
  Task021ExternalIdentityProvider,
  Task021RosterRecordStatus,
  Task021IdentityMappingStatus,
} from '../contracts/task021SchoolIntegrationContracts';

interface ExternalIdentityRecord {
  id: string;
  schoolId: string;
  externalUserId: string;
  provider: Task021ExternalIdentityProvider;
  actorRole: string;
  safeData: Record<string, unknown>;
}

const externalIdentities = new Map<string, ExternalIdentityRecord>();
const internalIdentities = new Map<string, Task021InternalTutorIdentity>();
const identityMappings = new Map<string, Task021IdentityMapping>();
const rosterRecords = new Map<string, Task021RosterRecord>();
const rosterSyncBatches = new Map<string, Task021RosterSyncBatch>();
const rosterReconciliationResults = new Map<string, Task021RosterReconciliationResult>();
const teacherAssignments = new Map<string, Task021TeacherAssignment>();
const parentLearnerLinks = new Map<string, Task021ParentLearnerLink>();
const schoolContextVerifications: Task021SchoolContextVerification[] = [];
const roleScopeDecisions: Task021RoleScopeDecision[] = [];
const integrationFailures: Task021IntegrationFailure[] = [];
const diagnostics: Task021SchoolIntegrationDiagnostic[] = [];
const auditEvents: Task021SchoolIntegrationAuditEvent[] = [];

function key(...parts: string[]): string {
  return parts.join('::');
}

export function resetTask021SchoolIntegrationRepositoryForTests(): void {
  externalIdentities.clear();
  internalIdentities.clear();
  identityMappings.clear();
  rosterRecords.clear();
  rosterSyncBatches.clear();
  rosterReconciliationResults.clear();
  teacherAssignments.clear();
  parentLearnerLinks.clear();
  schoolContextVerifications.length = 0;
  roleScopeDecisions.length = 0;
  integrationFailures.length = 0;
  diagnostics.length = 0;
  auditEvents.length = 0;
}

function generateId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

export function upsertExternalIdentity(
  schoolId: string,
  externalUserId: string,
  provider: Task021ExternalIdentityProvider,
  actorRole: string,
  safeData?: Record<string, unknown>,
): ExternalIdentityRecord {
  const k = key(schoolId, externalUserId);
  const existing = externalIdentities.get(k);
  if (existing) {
    existing.provider = provider;
    existing.actorRole = actorRole;
    existing.safeData = safeData || {};
    return existing;
  }
  const record: ExternalIdentityRecord = {
    id: generateId(),
    schoolId,
    externalUserId,
    provider,
    actorRole,
    safeData: safeData || {},
  };
  externalIdentities.set(k, record);
  return record;
}

export function getExternalIdentity(schoolId: string, externalUserId: string): ExternalIdentityRecord | undefined {
  return externalIdentities.get(key(schoolId, externalUserId));
}

export function listExternalIdentitiesForSchool(schoolId: string): ExternalIdentityRecord[] {
  return Array.from(externalIdentities.values()).filter(e => e.schoolId === schoolId);
}

export function upsertInternalTutorIdentity(tutorId: string, identity: Task021InternalTutorIdentity): void {
  internalIdentities.set(tutorId, identity);
}

export function getInternalTutorIdentity(tutorId: string): Task021InternalTutorIdentity | undefined {
  return internalIdentities.get(tutorId);
}

export function upsertIdentityMapping(mapping: Task021IdentityMapping): void {
  const k = key(mapping.schoolId, mapping.externalUserId);
  identityMappings.set(k, mapping);
}

export function getIdentityMapping(schoolId: string, externalUserId: string): Task021IdentityMapping | undefined {
  return identityMappings.get(key(schoolId, externalUserId));
}

export function findIdentityMappingByExternalIdentity(
  schoolId: string,
  externalUserId: string,
): Task021IdentityMapping | undefined {
  return identityMappings.get(key(schoolId, externalUserId));
}

export function listIdentityMappingsForSchool(schoolId: string): Task021IdentityMapping[] {
  return Array.from(identityMappings.values()).filter(m => m.schoolId === schoolId);
}

export function upsertRosterRecord(record: Task021RosterRecord): void {
  const k = key(record.schoolId, record.externalId, record.entityType);
  rosterRecords.set(k, record);
}

export function getRosterRecord(schoolId: string, externalId: string, entityType: string): Task021RosterRecord | undefined {
  return rosterRecords.get(key(schoolId, externalId, entityType));
}

export function listRosterRecordsForSchool(schoolId: string): Task021RosterRecord[] {
  return Array.from(rosterRecords.values()).filter(r => r.schoolId === schoolId);
}

export function listRosterRecordsForClass(schoolId: string, classId: string): Task021RosterRecord[] {
  return Array.from(rosterRecords.values()).filter(r => r.schoolId === schoolId && r.classId === classId);
}

export function listRosterRecordsForStudent(schoolId: string, studentId: string): Task021RosterRecord[] {
  return Array.from(rosterRecords.values()).filter(r => r.schoolId === schoolId && r.externalId === studentId);
}

export function createRosterSyncBatch(batch: Task021RosterSyncBatch): void {
  rosterSyncBatches.set(batch.batchId, batch);
}

export function getRosterSyncBatch(batchId: string): Task021RosterSyncBatch | undefined {
  return rosterSyncBatches.get(batchId);
}

export function listRosterSyncBatchesForSchool(schoolId: string): Task021RosterSyncBatch[] {
  return Array.from(rosterSyncBatches.values()).filter(b => b.schoolId === schoolId);
}

export function recordRosterReconciliationResult(result: Task021RosterReconciliationResult): void {
  rosterReconciliationResults.set(result.batchId, result);
}

export function listRosterReconciliationResultsForBatch(batchId: string): Task021RosterReconciliationResult | undefined {
  return rosterReconciliationResults.get(batchId);
}

export function upsertTeacherAssignment(assignment: Task021TeacherAssignment): void {
  const k = key(assignment.schoolId, assignment.teacherId, assignment.classId);
  teacherAssignments.set(k, assignment);
}

export function getTeacherAssignment(schoolId: string, teacherId: string, classId: string): Task021TeacherAssignment | undefined {
  return teacherAssignments.get(key(schoolId, teacherId, classId));
}

export function listTeacherAssignmentsForTeacher(schoolId: string, teacherId: string): Task021TeacherAssignment[] {
  return Array.from(teacherAssignments.values()).filter(
    a => a.schoolId === schoolId && a.teacherId === teacherId,
  );
}

export function listTeacherAssignmentsForClass(schoolId: string, classId: string): Task021TeacherAssignment[] {
  return Array.from(teacherAssignments.values()).filter(
    a => a.schoolId === schoolId && a.classId === classId,
  );
}

export function upsertParentLearnerLink(link: Task021ParentLearnerLink): void {
  const k = key(link.schoolId, link.parentId, link.learnerId);
  parentLearnerLinks.set(k, link);
}

export function getParentLearnerLink(schoolId: string, parentId: string, learnerId: string): Task021ParentLearnerLink | undefined {
  return parentLearnerLinks.get(key(schoolId, parentId, learnerId));
}

export function listParentLearnerLinksForParent(schoolId: string, parentId: string): Task021ParentLearnerLink[] {
  return Array.from(parentLearnerLinks.values()).filter(
    l => l.schoolId === schoolId && l.parentId === parentId,
  );
}

export function listParentLearnerLinksForLearner(schoolId: string, learnerId: string): Task021ParentLearnerLink[] {
  return Array.from(parentLearnerLinks.values()).filter(
    l => l.schoolId === schoolId && l.learnerId === learnerId,
  );
}

export function recordSchoolContextVerification(verification: Task021SchoolContextVerification): void {
  schoolContextVerifications.push(verification);
}

export function listSchoolContextVerifications(schoolId: string): Task021SchoolContextVerification[] {
  return schoolContextVerifications.filter(v => v.schoolId === schoolId);
}

export function recordRoleScopeDecision(decision: Task021RoleScopeDecision): void {
  roleScopeDecisions.push(decision);
}

export function listRoleScopeDecisions(schoolId: string): Task021RoleScopeDecision[] {
  return roleScopeDecisions.filter(d => d.reasonCodes.includes(`school:${schoolId}`) || d.reasonCodes.length === 0);
}

export function recordIntegrationFailure(failure: Task021IntegrationFailure): void {
  integrationFailures.push(failure);
}

export function listIntegrationFailures(schoolId: string): Task021IntegrationFailure[] {
  return integrationFailures.filter(f => f.schoolId === schoolId);
}

export function recordSchoolIntegrationDiagnostic(diagnostic: Task021SchoolIntegrationDiagnostic): void {
  diagnostics.push(diagnostic);
}

export function listSchoolIntegrationDiagnostics(schoolId: string): Task021SchoolIntegrationDiagnostic[] {
  return diagnostics.filter(d => d.schoolId === schoolId);
}

export function recordSchoolIntegrationAuditEvent(event: Task021SchoolIntegrationAuditEvent): void {
  auditEvents.push(event);
}

export function listSchoolIntegrationAuditEvents(schoolId: string): Task021SchoolIntegrationAuditEvent[] {
  return auditEvents.filter(e => e.schoolId === schoolId);
}

export function getRepositoryCounts(): {
  externalIdentities: number;
  internalIdentities: number;
  identityMappings: number;
  rosterRecords: number;
  rosterSyncBatches: number;
  teacherAssignments: number;
  parentLearnerLinks: number;
  verifications: number;
  roleDecisions: number;
  failures: number;
  diagnostics: number;
  auditEvents: number;
} {
  return {
    externalIdentities: externalIdentities.size,
    internalIdentities: internalIdentities.size,
    identityMappings: identityMappings.size,
    rosterRecords: rosterRecords.size,
    rosterSyncBatches: rosterSyncBatches.size,
    teacherAssignments: teacherAssignments.size,
    parentLearnerLinks: parentLearnerLinks.size,
    verifications: schoolContextVerifications.length,
    roleDecisions: roleScopeDecisions.length,
    failures: integrationFailures.length,
    diagnostics: diagnostics.length,
    auditEvents: auditEvents.length,
  };
}
