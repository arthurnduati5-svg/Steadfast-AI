import {
  Task036SingleSchoolScopeInput,
  Task036SingleSchoolScopeResult,
  createTask036SafeId,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

export async function validateSingleSchoolScope(
  input: Task036SingleSchoolScopeInput
): Promise<Task036SingleSchoolScopeResult> {
  const blockingIssues: string[] = [];

  if (!input.singleSchoolScope) blockingIssues.push('single_school_scope_not_set');
  if (input.multiSchoolScope) blockingIssues.push('multi_school_scope_set');
  if (!input.crossSchoolAccessDenied) blockingIssues.push('cross_school_access_not_denied');
  if (!input.publicSignupDisabled) blockingIssues.push('public_signup_not_disabled');
  if (!input.openRegistrationDisabled) blockingIssues.push('open_registration_not_disabled');
  if (!input.paymentFlowDisabled) blockingIssues.push('payment_flow_not_disabled');
  if (!input.marketingLaunchDisabled) blockingIssues.push('marketing_launch_not_disabled');
  if (!input.approvedSchoolConfigExists) blockingIssues.push('approved_school_config_missing');
  if (!input.approvedRosterSnapshotExists) blockingIssues.push('approved_roster_snapshot_missing');
  if (!input.schoolId) blockingIssues.push('missing_school_id');
  if (!input.tenantId) blockingIssues.push('missing_tenant_id');

  const passed = blockingIssues.length === 0;

  const result: Task036SingleSchoolScopeResult = {
    ok: passed,
    passed,
    schoolId: input.schoolId,
    tenantId: input.tenantId,
    approvedSchoolConfigExists: input.approvedSchoolConfigExists,
    approvedRosterSnapshotExists: input.approvedRosterSnapshotExists,
    singleSchoolScope: input.singleSchoolScope,
    multiSchoolScope: input.multiSchoolScope,
    crossSchoolAccessDenied: input.crossSchoolAccessDenied,
    publicSignupDisabled: input.publicSignupDisabled,
    openRegistrationDisabled: input.openRegistrationDisabled,
    paymentFlowDisabled: input.paymentFlowDisabled,
    marketingLaunchDisabled: input.marketingLaunchDisabled,
    blockingIssues,
  };

  const id = createTask036SafeId();
  task036Repository.saveSingleSchoolScope(id, result);
  return result;
}

export const evaluateSingleSchoolScope = validateSingleSchoolScope;
