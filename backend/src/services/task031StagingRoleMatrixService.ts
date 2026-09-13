import type {
  Task031StagingSmokeRole,
  Task031StagingActorFixture,
} from '../contracts/task031StagingSmokeContracts';
import { getRolePermissions031 } from '../contracts/task031StagingSmokeContracts';
import { getTask031StagingActorFixture } from './task031StagingSchoolIdentityFixtureService';

export interface RoleMatrixResult {
  ok: boolean;
  rolesChecked: string[];
  adminPermissionsCorrect: boolean;
  operatorPermissionsCorrect: boolean;
  teacherRestrictionsCorrect: boolean;
  studentRestrictionsCorrect: boolean;
  unknownRestrictionsCorrect: boolean;
  roleFixturesGenerated: boolean;
  blockingIssues: string[];
}

export function generateTask031RoleMatrix(): RoleMatrixResult {
  const blockingIssues: string[] = [];
  const rolesChecked: string[] = [];

  const adminPerms = getRolePermissions031('admin');
  const operatorPerms = getRolePermissions031('operator');
  const teacherPerms = getRolePermissions031('teacher');
  const studentPerms = getRolePermissions031('student');
  const unknownPerms = getRolePermissions031('unknown');

  const adminFixture = getTask031StagingActorFixture('admin');
  const operatorFixture = getTask031StagingActorFixture('operator');
  const teacherFixture = getTask031StagingActorFixture('teacher');
  const studentFixture = getTask031StagingActorFixture('student');
  const unknownFixture = getTask031StagingActorFixture('unknown');

  const adminCorrect =
    adminPerms.canRunStagingSmoke === true &&
    adminPerms.canViewObservabilityBaseline === true &&
    adminPerms.canViewCanaryReadinessReport === true &&
    adminPerms.canTriggerStagingFailureDrill === true &&
    adminPerms.canViewOwnStudentStatus === false &&
    adminPerms.canViewAssignedOversightSmoke === false;

  const operatorCorrect =
    operatorPerms.canRunStagingSmoke === true &&
    operatorPerms.canViewObservabilityBaseline === true &&
    operatorPerms.canViewCanaryReadinessReport === true &&
    operatorPerms.canTriggerStagingFailureDrill === true &&
    operatorPerms.canViewOwnStudentStatus === false &&
    operatorPerms.canViewAssignedOversightSmoke === false;

  const teacherCorrect =
    teacherPerms.canRunStagingSmoke === false &&
    teacherPerms.canViewObservabilityBaseline === false &&
    teacherPerms.canViewCanaryReadinessReport === false &&
    teacherPerms.canTriggerStagingFailureDrill === false &&
    teacherPerms.canViewOwnStudentStatus === false &&
    teacherPerms.canViewAssignedOversightSmoke === true;

  const studentCorrect =
    studentPerms.canRunStagingSmoke === false &&
    studentPerms.canViewObservabilityBaseline === false &&
    studentPerms.canViewCanaryReadinessReport === false &&
    studentPerms.canTriggerStagingFailureDrill === false &&
    studentPerms.canViewOwnStudentStatus === true &&
    studentPerms.canViewAssignedOversightSmoke === false;

  const unknownCorrect =
    unknownPerms.canRunStagingSmoke === false &&
    unknownPerms.canViewObservabilityBaseline === false &&
    unknownPerms.canViewCanaryReadinessReport === false &&
    unknownPerms.canTriggerStagingFailureDrill === false &&
    unknownPerms.canViewOwnStudentStatus === false &&
    unknownPerms.canViewAssignedOversightSmoke === false;

  rolesChecked.push('admin', 'operator', 'teacher', 'student', 'unknown');

  if (!adminCorrect) blockingIssues.push('admin_permissions_incorrect');
  if (!operatorCorrect) blockingIssues.push('operator_permissions_incorrect');
  if (!teacherCorrect) blockingIssues.push('teacher_restrictions_incorrect');
  if (!studentCorrect) blockingIssues.push('student_restrictions_incorrect');
  if (!unknownCorrect) blockingIssues.push('unknown_restrictions_incorrect');

  const ok = blockingIssues.length === 0;

  return {
    ok, rolesChecked,
    adminPermissionsCorrect: adminCorrect,
    operatorPermissionsCorrect: operatorCorrect,
    teacherRestrictionsCorrect: teacherCorrect,
    studentRestrictionsCorrect: studentCorrect,
    unknownRestrictionsCorrect: unknownCorrect,
    roleFixturesGenerated: true,
    blockingIssues,
  };
}

export function checkTask031RoleAccess(
  role: Task031StagingSmokeRole,
  permissionKey: string,
): boolean {
  const perms = getRolePermissions031(role);
  return perms[permissionKey] === true;
}

export function verifyTask031RoleDenial(
  wrongRole: Task031StagingSmokeRole,
  permissionKey: string,
): boolean {
  const perms = getRolePermissions031(wrongRole);
  return perms[permissionKey] !== true;
}
