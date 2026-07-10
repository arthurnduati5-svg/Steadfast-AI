import type { Task034StaffReadinessInput, Task034StaffReadinessResult } from '../contracts/task034ControlledLimitedRolloutContracts';
import { TASK034_MIN_STAFF_READINESS_SCORE } from '../contracts/task034ControlledLimitedRolloutContracts';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

export function evaluateTask034StaffReadiness(
  input: Task034StaffReadinessInput,
): Task034StaffReadinessResult {
  const blockingIssues: string[] = [];

  const acknowledgements: [string, boolean][] = [
    ['schoolAdminAcknowledged', input.schoolAdminAcknowledged],
    ['internalOperatorAcknowledged', input.internalOperatorAcknowledged],
    ['teacherSupportAcknowledged', input.teacherSupportAcknowledged],
    ['privacyBoundaryAcknowledged', input.privacyBoundaryAcknowledged],
    ['safeguardingEscalationAcknowledged', input.safeguardingEscalationAcknowledged],
    ['deenBoundaryAcknowledged', input.deenBoundaryAcknowledged],
    ['contentGovernanceAcknowledged', input.contentGovernanceAcknowledged],
    ['rollbackPauseKillSwitchAcknowledged', input.rollbackPauseKillSwitchAcknowledged],
    ['learnerSupportPlanAcknowledged', input.learnerSupportPlanAcknowledged],
  ];

  for (const [name, value] of acknowledgements) {
    if (!value) blockingIssues.push(`${name}_not_acknowledged`);
  }

  const readinessScore = input.readinessScore;
  const minReadinessScore = TASK034_MIN_STAFF_READINESS_SCORE;
  const readinessOk = readinessScore >= minReadinessScore;
  if (!readinessOk) blockingIssues.push(`readiness_score_below_minimum: ${readinessScore} < ${minReadinessScore}`);

  const result: Task034StaffReadinessResult = {
    ok: blockingIssues.length === 0,
    schoolAdminAcknowledged: input.schoolAdminAcknowledged,
    internalOperatorAcknowledged: input.internalOperatorAcknowledged,
    teacherSupportAcknowledged: input.teacherSupportAcknowledged,
    privacyBoundaryAcknowledged: input.privacyBoundaryAcknowledged,
    safeguardingEscalationAcknowledged: input.safeguardingEscalationAcknowledged,
    deenBoundaryAcknowledged: input.deenBoundaryAcknowledged,
    contentGovernanceAcknowledged: input.contentGovernanceAcknowledged,
    rollbackPauseKillSwitchAcknowledged: input.rollbackPauseKillSwitchAcknowledged,
    learnerSupportPlanAcknowledged: input.learnerSupportPlanAcknowledged,
    readinessScore,
    minReadinessScore,
    noRealMessagesSent: true,
    blockingIssues,
  };

  task034Repository.saveStaffReadiness(result);
  return result;
}
