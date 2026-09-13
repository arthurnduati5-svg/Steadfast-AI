import type { ApiScopeDecision } from '../contracts/apiScopeContracts';
import { checkBasicScope } from './apiScopeGuardService';

export interface LearningModeAccessInput {
  actorId: string;
  actorSchoolId: string;
  actorRole: string;
  targetSchoolId?: string;
  targetStudentId?: string;
  requiredRole?: string;
}

export function checkLearningModeAccess(
  input: LearningModeAccessInput,
): ApiScopeDecision {
  return checkBasicScope({
    actorId: input.actorId,
    actorSchoolId: input.actorSchoolId,
    actorRole: input.actorRole,
    targetSchoolId: input.targetSchoolId,
    targetStudentId: input.targetStudentId,
    requiredRole: input.requiredRole,
  });
}

export function canStudentAccessOwnSession(
  actorId: string,
  actorSchoolId: string,
  sessionStudentId: string,
  sessionSchoolId: string,
): boolean {
  return actorId === sessionStudentId && actorSchoolId === sessionSchoolId;
}

export function canTeacherViewStudentSummary(
  actorSchoolId: string,
  sessionSchoolId: string,
): boolean {
  return actorSchoolId === sessionSchoolId;
}

export function canAdminViewDiagnostics(
  actorRole: string,
): boolean {
  return actorRole === 'admin';
}
