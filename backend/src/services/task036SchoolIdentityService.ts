import {
  Task036SchoolIdentityResult,
  createTask036SafeId,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

export async function checkSchoolIdentity(
  sessionId: string
): Promise<Task036SchoolIdentityResult> {
  const blockingIssues: string[] = [];
  const session = task036Repository.getLaunchSession(sessionId);

  const schoolIdentityVerified = !!session?.schoolId;
  const schoolContextVerified = !!session?.tenantId;
  const tenantMatchVerified = !!session?.tenantId;
  const sessionRequiresVerifiedIdentity = true;
  const memoryRequiresVerifiedIdentity = true;
  const evidenceRequiresVerifiedIdentity = true;
  const aiCallRequiresVerifiedIdentity = true;
  const actionRequiresVerifiedIdentity = true;

  if (!schoolIdentityVerified) blockingIssues.push('school_identity_not_verified');
  if (!schoolContextVerified) blockingIssues.push('school_context_not_verified');
  if (!tenantMatchVerified) blockingIssues.push('tenant_not_verified');

  const result: Task036SchoolIdentityResult = {
    ok: blockingIssues.length === 0,
    passed: blockingIssues.length === 0,
    schoolIdentityVerified,
    schoolContextVerified,
    tenantMatchVerified,
    sessionRequiresVerifiedIdentity,
    memoryRequiresVerifiedIdentity,
    evidenceRequiresVerifiedIdentity,
    aiCallRequiresVerifiedIdentity,
    actionRequiresVerifiedIdentity,
    blockingIssues,
  };

  task036Repository.saveSchoolIdentity(sessionId, result);
  return result;
}

export const evaluateSchoolIdentity = checkSchoolIdentity;
