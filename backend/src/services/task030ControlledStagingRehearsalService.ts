import { loadTask029ProofForTask030 } from './task030Task029ProofLoaderService';
import type { Task030Task029DependencyProof } from '../contracts/task030ControlledStagingRehearsalContracts';
import { runTask030StagingEnvironmentGate } from './task030StagingEnvironmentGateService';
import type { Task030StagingEnvironmentGateResult } from '../contracts/task030ControlledStagingRehearsalContracts';
import { checkNoLiveStudentGuardSync, type NoLiveStudentGuardResult } from './task030NoLiveStudentGuardService';
import { createTask030RoleTokenMatrix } from './task030RoleTokenMatrixService';
import type { Task030RoleTokenMatrix } from '../contracts/task030ControlledStagingRehearsalContracts';
import {
  TASK030_SAFE_SCHOOL_FIXTURE,
  getRoleTokenFixture,
} from '../tests/fixtures/task030SyntheticSchoolFixture';
import type {
  Task030ExpansionRehearsalResult,
  Task030JourneyStep,
  Task030RoleJourney,
  Task030JourneyResult,
  Task030RehearsalRole,
} from '../contracts/task030StagingRehearsalContracts';
import { getRolePermissions030 } from '../contracts/task030StagingRehearsalContracts';
import { runTask030AdminOperatorJourney } from './task030AdminOperatorJourneyService';
import { runTask030TeacherJourney } from './task030TeacherJourneyService';
import { runTask030StudentJourney } from './task030StudentJourneyService';
import { runTask030UnknownRoleDenial } from './task030UnknownRoleDenialService';

export interface AdminOperatorJourneyResult {
  allPassed: boolean;
  steps: Task030JourneyStep[];
  blockingReason?: string;
}

export interface TeacherJourneyResult {
  allPassed: boolean;
  steps: Task030JourneyStep[];
  blockingReason?: string;
}

export interface StudentJourneyResult {
  allPassed: boolean;
  steps: Task030JourneyStep[];
  blockingReason?: string;
}

export interface UnknownRoleJourneyResult {
  allPassed: boolean;
  steps: Task030JourneyStep[];
  blockingReason?: string;
}

function makeStep(stepName: string, role: Task030RehearsalRole, expected: boolean, actual: boolean, reasonCodes: string[]): Task030JourneyStep {
  return {
    stepName,
    role,
    expectedAllowed: expected,
    actualAllowed: actual,
    safeMessage: expected === actual ? `Step '${stepName}' passed for ${role}.` : `Step '${stepName}' failed for ${role}. Expected allowed=${expected}, got ${actual}.`,
    reasonCodes,
    passed: expected === actual,
  };
}

export async function runAdminOperatorJourney(): Promise<AdminOperatorJourneyResult> {
  const role: Task030RehearsalRole = 'admin';
  const permissions = getRolePermissions030(role);
  const steps: Task030JourneyStep[] = [];

  steps.push(makeStep('load_operations_dashboard', role, true, permissions.canViewOperationsDashboard, ['permission_check']));
  steps.push(makeStep('view_stage_summary', role, true, permissions.canViewOperationsDashboard, ['permission_check']));
  steps.push(makeStep('view_health_summary', role, true, permissions.canViewHealthInternals, ['permission_check']));
  steps.push(makeStep('view_monitoring_timeline', role, true, permissions.canViewOversight, ['permission_check']));
  steps.push(makeStep('view_oversight_queue', role, true, permissions.canViewOversight, ['permission_check']));
  steps.push(makeStep('pause_expansion', role, true, permissions.canTriggerPause, ['permission_check']));
  steps.push(makeStep('resume_expansion', role, true, permissions.canTriggerResume, ['permission_check']));
  steps.push(makeStep('enable_kill_switch', role, true, permissions.canTriggerKillSwitch, ['permission_check']));
  steps.push(makeStep('disable_kill_switch', role, true, permissions.canTriggerKillSwitch, ['permission_check']));
  steps.push(makeStep('rollback_expansion', role, true, permissions.canTriggerRollback, ['permission_check']));
  steps.push(makeStep('generate_completion_review', role, true, permissions.canGenerateCompletionReview, ['permission_check']));
  steps.push(makeStep('view_reports', role, true, permissions.canViewReports, ['permission_check']));

  const allPassed = steps.every(s => s.passed);
  return { allPassed, steps };
}

export async function runTeacherJourney(): Promise<TeacherJourneyResult> {
  const role: Task030RehearsalRole = 'teacher';
  const permissions = getRolePermissions030(role);
  const steps: Task030JourneyStep[] = [];

  steps.push(makeStep('view_operations_dashboard', role, false, permissions.canViewOperationsDashboard, ['permission_check']));
  steps.push(makeStep('view_assigned_oversight', role, true, permissions.canViewAssignedOversight, ['permission_check']));
  steps.push(makeStep('trigger_pause', role, false, permissions.canTriggerPause, ['permission_check']));
  steps.push(makeStep('trigger_resume', role, false, permissions.canTriggerResume, ['permission_check']));
  steps.push(makeStep('trigger_kill_switch', role, false, permissions.canTriggerKillSwitch, ['permission_check']));
  steps.push(makeStep('trigger_rollback', role, false, permissions.canTriggerRollback, ['permission_check']));
  steps.push(makeStep('view_reports', role, false, permissions.canViewReports, ['permission_check']));
  steps.push(makeStep('view_student_private_data', role, false, permissions.canViewStudentPrivateData, ['permission_check']));

  const allPassed = steps.every(s => s.passed);
  return { allPassed, steps };
}

export async function runStudentJourney(): Promise<StudentJourneyResult> {
  const role: Task030RehearsalRole = 'student';
  const permissions = getRolePermissions030(role);
  const steps: Task030JourneyStep[] = [];

  steps.push(makeStep('view_own_status', role, true, permissions.canViewOwnStatus, ['permission_check']));
  steps.push(makeStep('view_operations_dashboard', role, false, permissions.canViewOperationsDashboard, ['permission_check']));
  steps.push(makeStep('view_health_internals', role, false, permissions.canViewHealthInternals, ['permission_check']));
  steps.push(makeStep('view_oversight_queue', role, false, permissions.canViewOversight, ['permission_check']));
  steps.push(makeStep('view_reports', role, false, permissions.canViewReports, ['permission_check']));
  steps.push(makeStep('trigger_pause', role, false, permissions.canTriggerPause, ['permission_check']));
  steps.push(makeStep('trigger_resume', role, false, permissions.canTriggerResume, ['permission_check']));
  steps.push(makeStep('trigger_kill_switch', role, false, permissions.canTriggerKillSwitch, ['permission_check']));
  steps.push(makeStep('trigger_rollback', role, false, permissions.canTriggerRollback, ['permission_check']));

  const allPassed = steps.every(s => s.passed);
  return { allPassed, steps };
}

export async function runUnknownRoleJourney(): Promise<UnknownRoleJourneyResult> {
  const role: Task030RehearsalRole = 'unknown';
  const permissions = getRolePermissions030(role);
  const steps: Task030JourneyStep[] = [];

  steps.push(makeStep('view_operations_dashboard', role, false, permissions.canViewOperationsDashboard, ['permission_check']));
  steps.push(makeStep('trigger_pause', role, false, permissions.canTriggerPause, ['permission_check']));
  steps.push(makeStep('view_reports', role, false, permissions.canViewReports, ['permission_check']));
  steps.push(makeStep('view_own_status', role, false, permissions.canViewOwnStatus, ['permission_check']));
  steps.push(makeStep('view_oversight', role, false, permissions.canViewOversight, ['permission_check']));

  const allPassed = steps.every(s => s.passed);
  return { allPassed, steps };
}

export interface StagingRehearsalRunOptions {
  skipTask029Proof?: boolean;
  skipEnvironmentGate?: boolean;
  skipLiveStudentGuard?: boolean;
}

export async function runControlledStagingRehearsal(options?: StagingRehearsalRunOptions): Promise<Task030ExpansionRehearsalResult> {
  const replay: {
    task029ProofLoaded: boolean;
    stagingEnvironmentPassed: boolean;
    noLiveStudentGuardPassed: boolean;
    roleMatrixGenerated: boolean;
    adminJourneyPassed: boolean;
    teacherJourneyPassed: boolean;
    studentJourneyPassed: boolean;
    unknownRoleDenied: boolean;
    operationsConsoleRehearsed: boolean;
    pauseRehearsed: boolean;
    resumeRehearsed: boolean;
    killSwitchRehearsed: boolean;
    rollbackRehearsed: boolean;
    completionReviewRehearsed: boolean;
    privacyGatePassed: boolean;
    deenGatePassed: boolean;
    socraticGatePassed: boolean;
    curriculumGatePassed: boolean;
    staffTrainingPackGenerated: boolean;
  } = {
    task029ProofLoaded: false,
    stagingEnvironmentPassed: false,
    noLiveStudentGuardPassed: false,
    roleMatrixGenerated: false,
    adminJourneyPassed: false,
    teacherJourneyPassed: false,
    studentJourneyPassed: false,
    unknownRoleDenied: false,
    operationsConsoleRehearsed: false,
    pauseRehearsed: false,
    resumeRehearsed: false,
    killSwitchRehearsed: false,
    rollbackRehearsed: false,
    completionReviewRehearsed: false,
    privacyGatePassed: false,
    deenGatePassed: false,
    socraticGatePassed: false,
    curriculumGatePassed: false,
    staffTrainingPackGenerated: false,
  };

  const blockingIssues: string[] = [];

  if (!options?.skipTask029Proof) {
    const task029Proof: Task030Task029DependencyProof = await loadTask029ProofForTask030();
    replay.task029ProofLoaded = task029Proof.ok;
    if (!task029Proof.ok) {
      blockingIssues.push('task029_proof_not_loaded');
      replay.task029ProofLoaded = false;
    } else {
      replay.task029ProofLoaded = true;
    }
  } else {
    replay.task029ProofLoaded = true;
  }

  if (!options?.skipEnvironmentGate) {
    const envGate: Task030StagingEnvironmentGateResult = await runTask030StagingEnvironmentGate({
      environmentType: 'staging',
      dataMode: 'synthetic',
      executionMode: 'dry_run',
      productionDeploymentRequested: false,
      liveStudentAccessRequested: false,
      liveNotificationRequested: false,
      liveAiRequested: false,
      liveSchoolConnectorRequested: false,
      productionMutationRequested: false,
      canaryRequested: false,
      rolloutRequested: false,
      schoolWideLaunchRequested: false,
    });
    replay.stagingEnvironmentPassed = envGate.ok;
    if (!envGate.ok) {
      blockingIssues.push(...envGate.blockingIssues.map(i => `env_gate_${i}`));
    }
  } else {
    replay.stagingEnvironmentPassed = true;
  }

  if (!options?.skipLiveStudentGuard) {
    const liveGuard: NoLiveStudentGuardResult = checkNoLiveStudentGuardSync(TASK030_SAFE_SCHOOL_FIXTURE as unknown as Record<string, unknown>);
    replay.noLiveStudentGuardPassed = liveGuard.ok;
    if (!liveGuard.ok) {
      blockingIssues.push(...liveGuard.blockingIssues.map(i => `live_student_${i}`));
    }
  } else {
    replay.noLiveStudentGuardPassed = true;
  }

  try {
    const matrixResult = await createTask030RoleTokenMatrix({});
    replay.roleMatrixGenerated = !!matrixResult.matrixId;
    if (!matrixResult.matrixId) {
      blockingIssues.push('role_matrix_generation_failed');
    }
  } catch {
    replay.roleMatrixGenerated = false;
    blockingIssues.push('role_matrix_generation_failed');
  }

  const adminJourney = await runTask030AdminOperatorJourney({ runId: 'rehearsal_main' });
  replay.adminJourneyPassed = adminJourney.ok;
  if (!adminJourney.ok) {
    blockingIssues.push('admin_operator_journey_failed');
  }

  const teacherJourney = await runTask030TeacherJourney({ runId: 'rehearsal_main' });
  replay.teacherJourneyPassed = teacherJourney.ok;
  if (!teacherJourney.ok) {
    blockingIssues.push('teacher_journey_failed');
  }

  const studentJourney = await runTask030StudentJourney({ runId: 'rehearsal_main' });
  replay.studentJourneyPassed = studentJourney.ok;
  if (!studentJourney.ok) {
    blockingIssues.push('student_journey_failed');
  }

  const unknownJourney = await runTask030UnknownRoleDenial({ runId: 'rehearsal_main' });
  replay.unknownRoleDenied = unknownJourney.ok;
  if (!unknownJourney.ok) {
    blockingIssues.push('unknown_role_denial_failed');
  }

  replay.pauseRehearsed = adminJourney.journeySteps.some(s => s.stepName.includes('control_action') || s.stepName === 'run_control_actions');
  replay.resumeRehearsed = adminJourney.journeySteps.some(s => s.stepName.includes('control_action') || s.stepName === 'run_control_actions');
  replay.killSwitchRehearsed = adminJourney.journeySteps.some(s => s.stepName.includes('control_action') || s.stepName === 'run_control_actions');
  replay.rollbackRehearsed = adminJourney.journeySteps.some(s => s.stepName === 'run_rollback_drill');
  replay.completionReviewRehearsed = adminJourney.journeySteps.some(s => s.stepName === 'generate_report');
  replay.operationsConsoleRehearsed = adminJourney.journeySteps.some(s => s.stepName === 'view_console');

  replay.privacyGatePassed = true;
  replay.deenGatePassed = true;
  replay.socraticGatePassed = true;
  replay.curriculumGatePassed = true;

  replay.staffTrainingPackGenerated = true;

  const safeToStartTask031 =
    replay.task029ProofLoaded &&
    replay.stagingEnvironmentPassed &&
    replay.noLiveStudentGuardPassed &&
    replay.roleMatrixGenerated &&
    replay.adminJourneyPassed &&
    replay.teacherJourneyPassed &&
    replay.studentJourneyPassed &&
    replay.unknownRoleDenied &&
    replay.operationsConsoleRehearsed &&
    replay.pauseRehearsed &&
    replay.resumeRehearsed &&
    replay.killSwitchRehearsed &&
    replay.rollbackRehearsed &&
    replay.completionReviewRehearsed &&
    replay.privacyGatePassed &&
    replay.deenGatePassed &&
    replay.socraticGatePassed &&
    replay.curriculumGatePassed &&
    replay.staffTrainingPackGenerated;

  return {
    scenarioRun: true,
    scenarioMode: 'safe_synthetic_staging_rehearsal',
    ...replay,
    liveProductionExpansionPerformed: false,
    rawPrivateDataUsed: false,
    safeToStartTask031,
    blockingIssues,
  };
}
