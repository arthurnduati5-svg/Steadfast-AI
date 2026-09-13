import type {
  Task031StagingSchoolIdentityFixture,
  Task031StagingActorFixture,
  Task031StagingSmokeRole,
} from '../contracts/task031StagingSmokeContracts';
import { getRolePermissions031, TASK031_SAFE_IDENTIFIERS } from '../contracts/task031StagingSmokeContracts';

export const TASK031_STAGING_ROLES: Task031StagingSmokeRole[] = [
  'admin', 'operator', 'teacher', 'student', 'unknown',
];

export function createTask031StagingSchoolIdentityFixture(): Task031StagingSchoolIdentityFixture {
  return {
    schoolId: 'school_task031_staging_safe',
    tenantId: 'tenant_task031_staging_safe',
    embedId: 'embed_task031_staging_safe',
    handoffId: 'handoff_task031_staging_safe',
    studentActorIdHash: 'student_hash_task031_safe',
    teacherActorIdHash: 'teacher_hash_task031_safe',
    adminActorIdHash: 'admin_hash_task031_safe',
    operatorActorIdHash: 'operator_hash_task031_safe',
    unknownActorIdHash: 'unknown_hash_task031_safe',
    classId: 'class_task031_safe_001',
    subjectId: 'subject_task031_safe_math_001',
    curriculumScope: 'curriculum_scope_task031_safe_001',
    sessionId: 'session_task031_safe_001',
    verifiedSchoolContext: {
      schoolId: 'school_task031_staging_safe',
      tenantId: 'tenant_task031_staging_safe',
      verifiedAt: new Date().toISOString(),
      verificationSource: 'staging_fixture',
    },
    adminAuthContext: {
      actorId: 'admin_hash_task031_safe',
      role: 'admin',
      schoolId: 'school_task031_staging_safe',
      permissions: getRolePermissions031('admin'),
    },
    operatorAuthContext: {
      actorId: 'operator_hash_task031_safe',
      role: 'operator',
      schoolId: 'school_task031_staging_safe',
      permissions: getRolePermissions031('operator'),
    },
    teacherAuthContext: {
      actorId: 'teacher_hash_task031_safe',
      role: 'teacher',
      schoolId: 'school_task031_staging_safe',
      permissions: getRolePermissions031('teacher'),
    },
    studentAuthContext: {
      actorId: 'student_hash_task031_safe',
      role: 'student',
      schoolId: 'school_task031_staging_safe',
      permissions: getRolePermissions031('student'),
    },
    unknownAuthContext: {
      actorId: 'unknown_hash_task031_safe',
      role: 'unknown',
      schoolId: '',
      permissions: getRolePermissions031('unknown'),
    },
    safeEmbedHandoffPayload: {
      schoolId: 'school_task031_staging_safe',
      handoffId: 'handoff_task031_staging_safe',
      displayMode: 'widget',
      safeToStartTutor: false,
      safeMessage: 'Safe staging embed handoff payload. No real student data.',
    },
    safeCopilotBootstrapPayload: {
      schoolId: 'school_task031_staging_safe',
      sessionId: 'session_task031_safe_001',
      learnerContext: { minimal: true, curriculumScope: 'curriculum_scope_task031_safe_001' },
      safeMessage: 'Safe staging copilot bootstrap payload. No raw private data.',
    },
    safeStudentPreflightPayload: {
      schoolId: 'school_task031_staging_safe',
      sessionId: 'session_task031_safe_001',
      classId: 'class_task031_safe_001',
      curriculumScope: 'curriculum_scope_task031_safe_001',
      safeMessage: 'Safe staging student preflight payload. No real student chat.',
    },
    safeObservabilityEventPayload: {
      eventType: 'staging_smoke_check',
      smokeRunId: 'smoke_run_task031_safe',
      safeSummary: 'Safe staging observability event. Aggregate only.',
    },
  };
}

export function getTask031StagingActorFixture(role: Task031StagingSmokeRole): Task031StagingActorFixture {
  const actorIdMap: Record<Task031StagingSmokeRole, string> = {
    admin: 'admin_hash_task031_safe',
    operator: 'operator_hash_task031_safe',
    teacher: 'teacher_hash_task031_safe',
    student: 'student_hash_task031_safe',
    unknown: 'unknown_hash_task031_safe',
  };

  return {
    role,
    actorIdHash: actorIdMap[role],
    permissions: getRolePermissions031(role),
  };
}

export function getAllTask031StagingActorFixtures(): Task031StagingActorFixture[] {
  return TASK031_STAGING_ROLES.map(getTask031StagingActorFixture);
}

export function getTask031SafeIdentifiers(): string[] {
  return [...TASK031_SAFE_IDENTIFIERS];
}

export function validateTask031Fixture(fixture: Task031StagingSchoolIdentityFixture): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const safeIds = TASK031_SAFE_IDENTIFIERS;

  if (!safeIds.includes(fixture.schoolId)) issues.push('schoolId not in safe identifiers');
  if (!safeIds.includes(fixture.tenantId)) issues.push('tenantId not in safe identifiers');
  if (!safeIds.includes(fixture.embedId)) issues.push('embedId not in safe identifiers');
  if (!safeIds.includes(fixture.handoffId)) issues.push('handoffId not in safe identifiers');
  if (!safeIds.includes(fixture.studentActorIdHash)) issues.push('studentActorIdHash not in safe identifiers');
  if (!safeIds.includes(fixture.teacherActorIdHash)) issues.push('teacherActorIdHash not in safe identifiers');
  if (!safeIds.includes(fixture.adminActorIdHash)) issues.push('adminActorIdHash not in safe identifiers');
  if (!safeIds.includes(fixture.operatorActorIdHash)) issues.push('operatorActorIdHash not in safe identifiers');
  if (!safeIds.includes(fixture.unknownActorIdHash)) issues.push('unknownActorIdHash not in safe identifiers');
  if (!safeIds.includes(fixture.classId)) issues.push('classId not in safe identifiers');
  if (!safeIds.includes(fixture.subjectId)) issues.push('subjectId not in safe identifiers');
  if (!safeIds.includes(fixture.curriculumScope)) issues.push('curriculumScope not in safe identifiers');
  if (!safeIds.includes(fixture.sessionId)) issues.push('sessionId not in safe identifiers');

  const raw = JSON.stringify(fixture);
  const realEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(raw);
  const realPhone = /\+\d{1,3}\d{6,14}/.test(raw);
  if (realEmail) issues.push('fixture contains real email pattern');
  if (realPhone) issues.push('fixture contains real phone pattern');

  const hasRealName = fixture.schoolId.includes('@') || fixture.schoolId.includes('+');
  if (hasRealName) issues.push('fixture contains real-name-like pattern');

  return { valid: issues.length === 0, issues };
}
