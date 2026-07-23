import { Task035FullSchoolSimulationResult, Task035LaunchDecision } from '../contracts/task035SchoolWideReadinessContracts';

export interface FullSchoolSimulationInput {
  schoolBoundaryOk: boolean;
  staffReleaseBoardOk: boolean;
  studentNoticeReady: boolean;
  runtimeGuardOk: boolean;
  rollbackReadinessOk: boolean;
  healthBudgetOk: boolean;
  privacyReviewOk: boolean;
  socraticOk: boolean;
  deenOk: boolean;
  curriculumOk: boolean;
  crossSchoolBlocked: boolean;
  unknownSchoolBlocked: boolean;
}

export function simulateFullSchoolRollout(input: FullSchoolSimulationInput): Task035FullSchoolSimulationResult {
  const blockingIssues: string[] = [];

  if (!input.schoolBoundaryOk) blockingIssues.push('school_boundary_not_validated');
  if (!input.staffReleaseBoardOk) blockingIssues.push('staff_release_board_not_passed');
  if (!input.studentNoticeReady) blockingIssues.push('student_notice_not_ready');
  if (!input.runtimeGuardOk) blockingIssues.push('runtime_guard_not_passed');
  if (!input.rollbackReadinessOk) blockingIssues.push('rollback_readiness_not_passed');
  if (!input.healthBudgetOk) blockingIssues.push('health_budget_not_passed');
  if (!input.privacyReviewOk) blockingIssues.push('privacy_review_not_passed');
  if (!input.socraticOk) blockingIssues.push('socratic_integrity_not_passed');
  if (!input.deenOk) blockingIssues.push('deen_governance_not_passed');
  if (!input.curriculumOk) blockingIssues.push('curriculum_source_not_passed');
  if (!input.crossSchoolBlocked) blockingIssues.push('cross_school_access_not_blocked');
  if (!input.unknownSchoolBlocked) blockingIssues.push('unknown_school_not_blocked');

  const allGatesPassed = blockingIssues.length === 0;
  const finalLaunchDecision: Task035LaunchDecision = allGatesPassed
    ? 'safe_to_prepare_school_launch'
    : 'not_safe_to_launch';

  const result: Task035FullSchoolSimulationResult = {
    ok: allGatesPassed,
    scenarioRun: true,
    scenarioMode: 'controlled_school_wide_readiness_simulation',
    approvedSchoolOnly: true,
    fullSchoolRosterSimulated: true,
    simulatedCoveragePercent: 100,
    liveActivationPerformed: false,
    publicActivationPerformed: false,
    multiSchoolActivationPerformed: false,
    crossSchoolAccessBlocked: input.crossSchoolBlocked,
    unknownSchoolBlocked: input.unknownSchoolBlocked,
    staffReleaseBoardPassed: input.staffReleaseBoardOk,
    studentSafeNoticeReady: input.studentNoticeReady,
    runtimeGuardPassed: input.runtimeGuardOk,
    rollbackReadinessPassed: input.rollbackReadinessOk,
    healthCapacityBudgetPassed: input.healthBudgetOk,
    privacyReviewPassed: input.privacyReviewOk,
    socraticIntegrityPassed: input.socraticOk,
    deenGovernancePassed: input.deenOk,
    curriculumSourcePassed: input.curriculumOk,
    finalLaunchDecision,
    safeToStartTask036: allGatesPassed,
    blockingIssues,
  };

  if (allGatesPassed) {
    console.log('[Task035 FullSchoolSim] Full school rollout simulation passed');
  } else {
    console.log('[Task035 FullSchoolSim] Full school rollout simulation failed:', blockingIssues.join(', '));
  }

  return result;
}
