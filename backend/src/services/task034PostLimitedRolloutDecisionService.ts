import type { Task034PostLimitedRolloutDecision, Task034RolloutGateStatus } from '../contracts/task034ControlledLimitedRolloutContracts';
import { createTask034SafeTimestamp, calculateTask034SafeToStartTask035 } from '../contracts/task034ControlledLimitedRolloutContracts';

export interface PostLimitedRolloutDecisionInput {
  runtimeGuardPassed: boolean;
  healthBudgetPassed: boolean;
  incidentEscalationPassed: boolean;
  rollbackProtectionPassed: boolean;
  privacyReviewPassed: boolean;
  contentGovernanceReviewPassed: boolean;
  socraticIntegrityReviewPassed: boolean;
  deenBoundaryReviewPassed: boolean;
  schoolIdentityReviewPassed: boolean;
  crossSchoolDenialReviewPassed: boolean;
  staffReadinessPassed: boolean;
  learnerNoticeReadinessPassed: boolean;
  diagnosticsPassed: boolean;
}

export function computeTask034PostLimitedRolloutDecision(input: PostLimitedRolloutDecisionInput): Task034PostLimitedRolloutDecision {
  const remainingBlockers: string[] = [];

  if (!input.runtimeGuardPassed) remainingBlockers.push('runtime_guard_not_passed');
  if (!input.healthBudgetPassed) remainingBlockers.push('health_budget_not_passed');
  if (!input.incidentEscalationPassed) remainingBlockers.push('incident_escalation_not_passed');
  if (!input.rollbackProtectionPassed) remainingBlockers.push('rollback_protection_not_passed');
  if (!input.privacyReviewPassed) remainingBlockers.push('privacy_review_not_passed');
  if (!input.contentGovernanceReviewPassed) remainingBlockers.push('content_governance_review_not_passed');
  if (!input.socraticIntegrityReviewPassed) remainingBlockers.push('socratic_integrity_review_not_passed');
  if (!input.deenBoundaryReviewPassed) remainingBlockers.push('deen_boundary_review_not_passed');
  if (!input.schoolIdentityReviewPassed) remainingBlockers.push('school_identity_review_not_passed');
  if (!input.crossSchoolDenialReviewPassed) remainingBlockers.push('cross_school_denial_review_not_passed');
  if (!input.staffReadinessPassed) remainingBlockers.push('staff_readiness_not_passed');
  if (!input.learnerNoticeReadinessPassed) remainingBlockers.push('learner_notice_readiness_not_passed');
  if (!input.diagnosticsPassed) remainingBlockers.push('diagnostics_not_passed');

  const allGatesPassed = remainingBlockers.length === 0;

  const finalDecision: 'TASK_034_PASS_SAFE_TO_START_TASK_035' | 'TASK_034_BLOCKED' =
    allGatesPassed ? 'TASK_034_PASS_SAFE_TO_START_TASK_035' : 'TASK_034_BLOCKED';

  return {
    safeToStartTask035: allGatesPassed,
    safeToStartTask040: false,
    finalDecision,
    remainingBlockers,
    generatedAt: createTask034SafeTimestamp(),
  };
}
