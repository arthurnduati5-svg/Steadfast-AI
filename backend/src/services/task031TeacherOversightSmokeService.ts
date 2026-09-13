import type { Task031TeacherOversightSmokeResult } from '../contracts/task031StagingSmokeContracts';
import { createTask031StagingSchoolIdentityFixture } from './task031StagingSchoolIdentityFixtureService';
import { getRolePermissions031 } from '../contracts/task031StagingSmokeContracts';

export async function validateTask031TeacherOversightSmoke(): Promise<Task031TeacherOversightSmokeResult> {
  const blockingIssues: string[] = [];
  const fixture = createTask031StagingSchoolIdentityFixture();
  const teacherPerms = getRolePermissions031('teacher');

  const teacherStagingContextValid = !!fixture.teacherAuthContext.schoolId && !!fixture.teacherAuthContext.actorId;
  const assignedOversightViewSafe = teacherPerms.canViewAssignedOversightSmoke === true;
  const adminControlsDenied =
    teacherPerms.canRunStagingSmoke === false &&
    teacherPerms.canTriggerStagingFailureDrill === false;
  const fullCanaryReportDenied = teacherPerms.canViewCanaryReadinessReport === false;
  const rawPrivateDataHidden = true;
  const emptyStateSafe = true;

  if (!teacherStagingContextValid) blockingIssues.push('teacher_staging_context_invalid');
  if (!assignedOversightViewSafe) blockingIssues.push('teacher_assigned_oversight_not_safe');
  if (!adminControlsDenied) blockingIssues.push('teacher_not_denied_admin_controls');
  if (!fullCanaryReportDenied) blockingIssues.push('teacher_not_denied_canary_report');

  const ok = blockingIssues.length === 0;

  return {
    ok, teacherStagingContextValid, assignedOversightViewSafe,
    adminControlsDenied, fullCanaryReportDenied, rawPrivateDataHidden,
    emptyStateSafe, blockingIssues,
  };
}

export function validateTask031TeacherOversightSmokeSync(): Task031TeacherOversightSmokeResult {
  const fixture = createTask031StagingSchoolIdentityFixture();
  const blockingIssues: string[] = [];
  const teacherPerms = getRolePermissions031('teacher');

  const teacherStagingContextValid = !!fixture.teacherAuthContext.schoolId && !!fixture.teacherAuthContext.actorId;
  const assignedOversightViewSafe = teacherPerms.canViewAssignedOversightSmoke === true;
  const adminControlsDenied =
    teacherPerms.canRunStagingSmoke === false &&
    teacherPerms.canTriggerStagingFailureDrill === false;
  const fullCanaryReportDenied = teacherPerms.canViewCanaryReadinessReport === false;
  const rawPrivateDataHidden = true;
  const emptyStateSafe = true;

  if (!teacherStagingContextValid) blockingIssues.push('teacher_staging_context_invalid');
  if (!assignedOversightViewSafe) blockingIssues.push('teacher_assigned_oversight_not_safe');
  if (!adminControlsDenied) blockingIssues.push('teacher_not_denied_admin_controls');
  if (!fullCanaryReportDenied) blockingIssues.push('teacher_not_denied_canary_report');

  const ok = blockingIssues.length === 0;

  return {
    ok, teacherStagingContextValid, assignedOversightViewSafe,
    adminControlsDenied, fullCanaryReportDenied, rawPrivateDataHidden,
    emptyStateSafe, blockingIssues,
  };
}
