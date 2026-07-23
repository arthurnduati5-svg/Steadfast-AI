import { Task035FinalDecision } from '../contracts/task035SchoolWideReadinessContracts';

export interface LaunchDecisionInput {
  task034ProofOk: boolean;
  productionEnvironmentGateOk: boolean;
  schoolBoundaryGuardOk: boolean;
  fullSchoolSimulationOk: boolean;
  staffReleaseBoardOk: boolean;
  studentSafeNoticeOk: boolean;
  teacherAdminReadinessOk: boolean;
  runtimeGuardSimulationOk: boolean;
  healthCapacityBudgetOk: boolean;
  rollbackReadinessOk: boolean;
  privacyReviewOk: boolean;
  socraticIntegrityReviewOk: boolean;
  deenGovernanceReviewOk: boolean;
  curriculumSourceReviewOk: boolean;
  noPublicRollout: boolean;
  noMultiSchoolRollout: boolean;
  noRawPrivateData: boolean;
  blockingIssuesLength: number;
}

export function computeFinalSchoolLaunchDecision(input: LaunchDecisionInput): {
  safeToStartTask036: boolean;
  finalDecision: Task035FinalDecision;
  blockingIssues: string[];
} {
  const blockingIssues: string[] = [];

  if (!input.task034ProofOk) blockingIssues.push('task034_proof_not_ok');
  if (!input.productionEnvironmentGateOk) blockingIssues.push('production_environment_gate_not_ok');
  if (!input.schoolBoundaryGuardOk) blockingIssues.push('school_boundary_guard_not_ok');
  if (!input.fullSchoolSimulationOk) blockingIssues.push('full_school_simulation_not_ok');
  if (!input.staffReleaseBoardOk) blockingIssues.push('staff_release_board_not_ok');
  if (!input.studentSafeNoticeOk) blockingIssues.push('student_safe_notice_not_ok');
  if (!input.teacherAdminReadinessOk) blockingIssues.push('teacher_admin_readiness_not_ok');
  if (!input.runtimeGuardSimulationOk) blockingIssues.push('runtime_guard_simulation_not_ok');
  if (!input.healthCapacityBudgetOk) blockingIssues.push('health_capacity_budget_not_ok');
  if (!input.rollbackReadinessOk) blockingIssues.push('rollback_readiness_not_ok');
  if (!input.privacyReviewOk) blockingIssues.push('privacy_review_not_ok');
  if (!input.socraticIntegrityReviewOk) blockingIssues.push('socratic_integrity_review_not_ok');
  if (!input.deenGovernanceReviewOk) blockingIssues.push('deen_governance_review_not_ok');
  if (!input.curriculumSourceReviewOk) blockingIssues.push('curriculum_source_review_not_ok');
  if (!input.noPublicRollout) blockingIssues.push('public_rollout_enabled');
  if (!input.noMultiSchoolRollout) blockingIssues.push('multi_school_rollout_enabled');
  if (!input.noRawPrivateData) blockingIssues.push('raw_private_data_exposed');

  const safeToStartTask036 =
    input.task034ProofOk &&
    input.productionEnvironmentGateOk &&
    input.schoolBoundaryGuardOk &&
    input.fullSchoolSimulationOk &&
    input.staffReleaseBoardOk &&
    input.studentSafeNoticeOk &&
    input.teacherAdminReadinessOk &&
    input.runtimeGuardSimulationOk &&
    input.healthCapacityBudgetOk &&
    input.rollbackReadinessOk &&
    input.privacyReviewOk &&
    input.socraticIntegrityReviewOk &&
    input.deenGovernanceReviewOk &&
    input.curriculumSourceReviewOk &&
    input.noPublicRollout &&
    input.noMultiSchoolRollout &&
    input.noRawPrivateData &&
    input.blockingIssuesLength === 0;

  const finalDecision: Task035FinalDecision = safeToStartTask036
    ? 'TASK_035_PASS_SAFE_TO_START_TASK_036'
    : 'TASK_035_FAIL_NOT_SAFE_TO_START_TASK_036';

  console.log(`[Task035 LaunchDecision] safeToStartTask036: ${safeToStartTask036}, finalDecision: ${finalDecision}`);

  return { safeToStartTask036, finalDecision, blockingIssues };
}
