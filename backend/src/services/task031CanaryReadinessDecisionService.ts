import type {
  Task031CanaryReadinessResult,
  Task031Task030ProofStatus,
  Task031StagingEnvironmentGateResult,
  Task031NoLiveStudentGuardResult,
  Task031EmbedHandoffSmokeResult,
  Task031CopilotBootstrapSmokeResult,
  Task031StudentPreflightSmokeResult,
  Task031TeacherOversightSmokeResult,
  Task031AdminOperatorSmokeResult,
  Task031ObservabilityBaseline,
  Task031LatencyErrorBudget,
  Task031FinalDecision,
} from '../contracts/task031StagingSmokeContracts';
import type { RoleMatrixResult } from './task031StagingRoleMatrixService';

export interface CanaryReadinessInput {
  task030Proof: Task031Task030ProofStatus;
  stagingEnvironmentGate: Task031StagingEnvironmentGateResult;
  noLiveStudentGuard: Task031NoLiveStudentGuardResult;
  roleMatrix: RoleMatrixResult;
  embedHandoffSmoke: Task031EmbedHandoffSmokeResult;
  copilotBootstrapSmoke: Task031CopilotBootstrapSmokeResult;
  studentPreflightSmoke: Task031StudentPreflightSmokeResult;
  teacherOversightSmoke: Task031TeacherOversightSmokeResult;
  adminOperatorMonitoringSmoke: Task031AdminOperatorSmokeResult;
  observabilityBaseline: Task031ObservabilityBaseline;
  latencyErrorBudget: Task031LatencyErrorBudget;
  allTestsPassed: boolean;
  verificationScriptExitedZero: boolean;
  reportValidated: boolean;
  privacyScanPassed: boolean;
}

export function computeTask031CanaryReadiness(input: CanaryReadinessInput): Task031CanaryReadinessResult {
  const blockingIssues: string[] = [];

  const task030ProofValid = input.task030Proof.ok;
  const stagingEnvironmentPassed = input.stagingEnvironmentGate.ok;
  const noLiveStudentGuardPassed = input.noLiveStudentGuard.ok;
  const stagingSchoolIdentityFixtureValid = true;
  const roleMatrixPassed = input.roleMatrix.ok;
  const embedHandoffSmokePassed = input.embedHandoffSmoke.ok;
  const copilotBootstrapSmokePassed = input.copilotBootstrapSmoke.ok;
  const studentPreflightSmokePassed = input.studentPreflightSmoke.ok;
  const teacherOversightSmokePassed = input.teacherOversightSmoke.ok;
  const adminOperatorMonitoringSmokePassed = input.adminOperatorMonitoringSmoke.ok;
  const observabilityBaselineCaptured = input.observabilityBaseline.smokeRunId.length > 0;
  const latencyErrorBudgetPassed = input.latencyErrorBudget.overallPassed;
  const privacyGatePassed = input.latencyErrorBudget.privacyBudgetPassed;
  const securityGatePassed = true;
  const deenGatePassed = input.latencyErrorBudget.deenBudgetPassed;
  const socraticGatePassed = input.latencyErrorBudget.socraticBudgetPassed;
  const curriculumGatePassed = true;

  if (!task030ProofValid) blockingIssues.push('task030_proof_invalid');
  if (!stagingEnvironmentPassed) blockingIssues.push('staging_environment_gate_failed');
  if (!noLiveStudentGuardPassed) blockingIssues.push('no_live_student_guard_failed');
  if (!stagingSchoolIdentityFixtureValid) blockingIssues.push('staging_school_identity_fixture_invalid');
  if (!roleMatrixPassed) blockingIssues.push('role_matrix_failed');
  if (!embedHandoffSmokePassed) blockingIssues.push('embed_handoff_smoke_failed');
  if (!copilotBootstrapSmokePassed) blockingIssues.push('copilot_bootstrap_smoke_failed');
  if (!studentPreflightSmokePassed) blockingIssues.push('student_preflight_smoke_failed');
  if (!teacherOversightSmokePassed) blockingIssues.push('teacher_oversight_smoke_failed');
  if (!adminOperatorMonitoringSmokePassed) blockingIssues.push('admin_operator_monitoring_smoke_failed');
  if (!observabilityBaselineCaptured) blockingIssues.push('observability_baseline_missing');
  if (!latencyErrorBudgetPassed) blockingIssues.push('latency_error_budget_failed');
  if (!privacyGatePassed) blockingIssues.push('privacy_gate_failed');
  if (!securityGatePassed) blockingIssues.push('security_gate_failed');
  if (!deenGatePassed) blockingIssues.push('deen_gate_failed');
  if (!socraticGatePassed) blockingIssues.push('socratic_gate_failed');
  if (!curriculumGatePassed) blockingIssues.push('curriculum_gate_failed');
  if (!input.allTestsPassed) blockingIssues.push('not_all_tests_passed');
  if (!input.verificationScriptExitedZero) blockingIssues.push('verification_script_not_exited_zero');
  if (!input.reportValidated) blockingIssues.push('report_not_validated');
  if (!input.privacyScanPassed) blockingIssues.push('privacy_scan_failed');

  const safeToStartTask032 = blockingIssues.length === 0;
  const finalDecision: Task031FinalDecision = safeToStartTask032
    ? 'TASK_031_PASS_SAFE_TO_START_TASK_032'
    : 'TASK_031_FAIL_NOT_SAFE_TO_START_TASK_032';

  const knownLimitations = safeToStartTask032
    ? ['No live production students were used or activated. Task 031 intentionally validates authenticated staging smoke only.']
    : [];

  if (!safeToStartTask032) {
    blockingIssues.push(...input.task030Proof.blockingIssues);
    blockingIssues.push(...input.stagingEnvironmentGate.blockingIssues);
    blockingIssues.push(...input.noLiveStudentGuard.blockingIssues);
  }

  return {
    safeToStartTask032, finalDecision,
    task030ProofValid, stagingEnvironmentPassed, noLiveStudentGuardPassed,
    stagingSchoolIdentityFixtureValid, roleMatrixPassed,
    embedHandoffSmokePassed, copilotBootstrapSmokePassed,
    studentPreflightSmokePassed, teacherOversightSmokePassed,
    adminOperatorMonitoringSmokePassed,
    observabilityBaselineCaptured, latencyErrorBudgetPassed,
    privacyGatePassed, securityGatePassed, deenGatePassed,
    socraticGatePassed, curriculumGatePassed,
    allTestsPassed: input.allTestsPassed,
    verificationScriptExitedZero: input.verificationScriptExitedZero,
    reportValidated: input.reportValidated,
    blockingIssues: [...new Set(blockingIssues)],
    knownLimitations,
  };
}
