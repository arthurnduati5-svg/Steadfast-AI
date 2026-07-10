import type { Task034LimitedRolloutConfigInput, Task034LimitedRolloutConfigResult } from '../contracts/task034ControlledLimitedRolloutContracts';
import { TASK034_MAX_ROLLOUT_PERCENT } from '../contracts/task034ControlledLimitedRolloutContracts';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

export function validateTask034LimitedRolloutConfig(
  input: Task034LimitedRolloutConfigInput,
): Task034LimitedRolloutConfigResult {
  const blockingIssues: string[] = [];

  const rolloutPercent = input.rolloutPercent;
  const rolloutPercentOk = rolloutPercent > 0 && rolloutPercent <= TASK034_MAX_ROLLOUT_PERCENT;
  if (!rolloutPercentOk) blockingIssues.push(`rollout_percent_invalid: ${rolloutPercent}`);

  if (rolloutPercent === 100) blockingIssues.push('rollout_percent_is_100');

  const requiredFields: [string, string][] = [
    ['expandedCohortId', input.expandedCohortId],
    ['schoolId', input.schoolId],
    ['tenantId', input.tenantId],
    ['activationId', input.activationId],
    ['task033ObservationSessionId', input.task033ObservationSessionId],
    ['rollbackPlanId', input.rollbackPlanId],
    ['pausePlanId', input.pausePlanId],
    ['killSwitchId', input.killSwitchId],
  ];

  for (const [name, value] of requiredFields) {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      blockingIssues.push(`missing_required_field: ${name}`);
    }
  }

  const result: Task034LimitedRolloutConfigResult = {
    ok: blockingIssues.length === 0,
    rolloutPercent,
    maxRolloutPercent: TASK034_MAX_ROLLOUT_PERCENT,
    expandedCohortId: input.expandedCohortId,
    schoolId: input.schoolId,
    tenantId: input.tenantId,
    activationId: input.activationId,
    task033ObservationSessionId: input.task033ObservationSessionId,
    rollbackPlanId: input.rollbackPlanId,
    pausePlanId: input.pausePlanId,
    killSwitchId: input.killSwitchId,
    staffReadinessRequired: input.staffReadinessRequired,
    learnerNoticeRequired: input.learnerNoticeRequired,
    healthBudgetRequired: input.healthBudgetRequired,
    privacyReviewRequired: input.privacyReviewRequired,
    contentGovernanceReviewRequired: input.contentGovernanceReviewRequired,
    socraticIntegrityReviewRequired: input.socraticIntegrityReviewRequired,
    deenBoundaryReviewRequired: input.deenBoundaryReviewRequired,
    blockingIssues,
  };

  task034Repository.saveLimitedRolloutConfig(result);
  return result;
}
