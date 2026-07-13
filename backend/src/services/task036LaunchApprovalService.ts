import {
  Task036LaunchApprovalInput,
  Task036LaunchApprovalResult,
  isTask036LaunchOperatorRole,
  isTask036DeniedRole,
  resolveTask036ActorRole,
  createTask036SafeId,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

export async function validateLaunchApproval(
  input: Task036LaunchApprovalInput
): Promise<Task036LaunchApprovalResult> {
  const blockingIssues: string[] = [];

  const role = resolveTask036ActorRole(input.role);
  const roleValid = role !== 'unknown';
  const roleHasApprovalAuthority = isTask036LaunchOperatorRole(role) && !isTask036DeniedRole(role);
  const withinSchoolScope = !!input.schoolId && !!input.tenantId;
  const noRawPrivateDataReference = !input.approvalRefersToRawPrivateData;
  const noPublicLaunchRequest = !input.approvalRequestsPublicLaunch;
  const noMultiSchoolLaunchRequest = !input.approvalRequestsMultiSchoolLaunch;
  const noBackendFreezeRequest = !input.approvalRequestsBackendFreeze;

  if (!roleValid) blockingIssues.push('invalid_role');
  if (!roleHasApprovalAuthority) blockingIssues.push('role_lacks_approval_authority');
  if (!withinSchoolScope) blockingIssues.push('outside_school_scope');
  if (!noRawPrivateDataReference) blockingIssues.push('approval_refers_to_raw_private_data');
  if (!noPublicLaunchRequest) blockingIssues.push('approval_requests_public_launch');
  if (!noMultiSchoolLaunchRequest) blockingIssues.push('approval_requests_multi_school_launch');
  if (!noBackendFreezeRequest) blockingIssues.push('approval_requests_backend_freeze');

  const passed = blockingIssues.length === 0;

  const result: Task036LaunchApprovalResult = {
    ok: passed,
    passed,
    approvalId: input.approvalId,
    role: input.role,
    roleValid,
    roleHasApprovalAuthority,
    withinSchoolScope,
    noRawPrivateDataReference,
    noPublicLaunchRequest,
    noMultiSchoolLaunchRequest,
    noBackendFreezeRequest,
    blockingIssues,
  };

  const id = createTask036SafeId();
  task036Repository.saveLaunchApproval(id, result);
  return result;
}

export const evaluateLaunchApproval = validateLaunchApproval;
