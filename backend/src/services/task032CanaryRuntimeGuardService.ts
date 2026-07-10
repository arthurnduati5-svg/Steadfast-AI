import type { Task032CanaryRuntimeGuardFullInput, Task032CanaryRuntimeGuardResult, Task032CanaryGateCheck } from '../contracts/task032ControlledCanaryActivationContracts';
import { resolveTask032ActorRole, isTask032AdminOperatorRole } from '../contracts/task032ControlledCanaryActivationContracts';

export async function checkTask032CanaryRuntimeGuard(input: Task032CanaryRuntimeGuardFullInput): Promise<Task032CanaryRuntimeGuardResult> {
  const blockingIssues: string[] = [];
  const gateChecks: Task032CanaryGateCheck[] = [];

  const actorRole = resolveTask032ActorRole(input.input?.actorRole ?? '');
  const isStudent = actorRole === 'student' || actorRole === 'learner';
  const isTeacher = actorRole === 'teacher';
  const isUnknown = actorRole === 'unknown' || actorRole === 'anonymous';

  gateChecks.push({ name: 'actor_role_valid', passed: !isUnknown });
  if (isUnknown) {
    blockingIssues.push('unknown_actor_role');
  }

  const studentInCohort = input.isStudentInCohort && isStudent;
  gateChecks.push({ name: 'student_in_cohort', passed: studentInCohort || !isStudent });
  if (!input.isStudentInCohort && isStudent) {
    blockingIssues.push('student_not_in_canary_cohort');
  }

  const canaryActive = input.canaryState === 'active';
  gateChecks.push({ name: 'canary_active', passed: canaryActive });
  if (!canaryActive) {
    blockingIssues.push('canary_not_active');
  }

  gateChecks.push({ name: 'not_paused', passed: !input.isPaused });
  if (input.isPaused) {
    blockingIssues.push('canary_paused');
  }

  gateChecks.push({ name: 'kill_switch_disabled', passed: !input.isKillSwitchActive });
  if (input.isKillSwitchActive) {
    blockingIssues.push('kill_switch_active');
  }

  gateChecks.push({ name: 'rollback_not_active', passed: !input.rollbackActive });
  if (input.rollbackActive) {
    blockingIssues.push('rollback_active');
  }

  gateChecks.push({ name: 'curriculum_scope_present', passed: input.hasCurriculumScope });
  if (!input.hasCurriculumScope) {
    blockingIssues.push('missing_curriculum_scope');
  }

  gateChecks.push({ name: 'source_scope_present', passed: input.hasSourceScope });
  if (!input.hasSourceScope) {
    blockingIssues.push('missing_source_scope');
  }

  gateChecks.push({ name: 'socratic_gate_passed', passed: input.socraticGatePassed });
  if (!input.socraticGatePassed) {
    blockingIssues.push('socratic_gate_failed');
  }

  gateChecks.push({ name: 'deen_gate_passed', passed: input.deenGatePassed });
  if (!input.deenGatePassed) {
    blockingIssues.push('deen_gate_failed');
  }

  gateChecks.push({ name: 'privacy_gate_passed', passed: input.privacyGatePassed });
  if (!input.privacyGatePassed) {
    blockingIssues.push('privacy_gate_failed');
  }

  gateChecks.push({ name: 'approved_school', passed: input.isApprovedSchool });
  if (!input.isApprovedSchool) {
    blockingIssues.push('school_not_approved');
  }

  gateChecks.push({ name: 'approved_cohort', passed: input.isApprovedCohort });
  if (!input.isApprovedCohort) {
    blockingIssues.push('cohort_not_approved');
  }

  gateChecks.push({ name: 'student_active', passed: input.isActive });
  if (!input.isActive) {
    blockingIssues.push('inactive_student');
  }

  gateChecks.push({ name: 'consent_authorized', passed: input.consentAuthorizationOk });
  if (!input.consentAuthorizationOk) {
    blockingIssues.push('consent_not_authorized');
  }

  if (isTeacher) {
    blockingIssues.push('teacher_not_allowed_in_student_runtime');
  }

  const allowed = blockingIssues.length === 0;

  let decision: string;
  if (allowed) {
    decision = 'allow_canary_runtime';
  } else if (!input.isStudentInCohort && isStudent) {
    decision = 'deny_not_in_canary';
  } else if (input.isPaused) {
    decision = 'deny_canary_paused';
  } else if (input.isKillSwitchActive) {
    decision = 'deny_kill_switch_active';
  } else if (input.rollbackActive) {
    decision = 'deny_rollback_active';
  } else if (!input.hasCurriculumScope) {
    decision = 'deny_missing_curriculum_scope';
  } else if (!input.socraticGatePassed) {
    decision = 'deny_socratic_gate_failed';
  } else if (!input.deenGatePassed) {
    decision = 'deny_deen_gate_failed';
  } else if (!input.privacyGatePassed) {
    decision = 'deny_privacy_gate_failed';
  } else if (isUnknown) {
    decision = 'deny_unknown_role';
  } else {
    decision = 'deny_blocked';
  }

  const shouldBlockAi = !allowed || !input.socraticGatePassed || !input.deenGatePassed || !input.privacyGatePassed || !input.hasCurriculumScope;
  const safeToCallAi = !shouldBlockAi && isStudent;
  const safeToAccessMemory = allowed && isStudent;
  const safeToCreateSession = allowed && isStudent;

  const firstBlockingReason = blockingIssues.length > 0 ? blockingIssues[0] : '';
  let safeReasonCode: string;
  switch (firstBlockingReason) {
    case 'student_not_in_canary_cohort':
      safeReasonCode = 'student_not_in_approved_canary';
      break;
    case 'canary_paused':
      safeReasonCode = 'canary_is_paused';
      break;
    case 'kill_switch_active':
      safeReasonCode = 'kill_switch_enabled';
      break;
    case 'rollback_active':
      safeReasonCode = 'rollback_in_progress';
      break;
    case 'missing_curriculum_scope':
      safeReasonCode = 'curriculum_scope_missing';
      break;
    case 'socratic_gate_failed':
      safeReasonCode = 'socratic_integrity_check_failed';
      break;
    case 'deen_gate_failed':
      safeReasonCode = 'deen_boundary_check_failed';
      break;
    case 'privacy_gate_failed':
      safeReasonCode = 'privacy_boundary_check_failed';
      break;
    default:
      safeReasonCode = 'runtime_guard_denied';
  }

  return {
    allowed,
    decision,
    safeToCreateSession,
    safeToAccessMemory,
    safeToCallAi,
    safeReasonCode,
    rawPrivateDataExposed: false,
    gateChecks,
    blockingIssues,
  };
}

export async function runTask032CanaryRuntimeGuard(input: { schoolId: string; actorRole: string; activationId: string }): Promise<Task032CanaryRuntimeGuardResult & {
  ok: boolean;
  actorRoleValid: boolean;
  verifiedSchoolContextRequired: boolean;
  adminOperatorActorRequired: boolean;
  task031ProofRequired: boolean;
  approvedConfigRequired: boolean;
  cohortEligibilityRequired: boolean;
  consentAuthorizationReadinessRequired: boolean;
  privacyBoundaryRequired: boolean;
  healthBudgetRequired: boolean;
  rollbackReadinessRequired: boolean;
  incidentBridgeRequired: boolean;
  noLiveAi: boolean;
  noLiveConnector: boolean;
  noLiveNotification: boolean;
  noDeployment: boolean;
  noRollout: boolean;
  noObservation: boolean;
}> {
  const resolvedRole = resolveTask032ActorRole(input.actorRole);
  const isAdminOperator = isTask032AdminOperatorRole(resolvedRole);
  const blockingIssues: string[] = [];

  if (!input.schoolId) blockingIssues.push('missing_school_id');
  if (!isAdminOperator) blockingIssues.push('invalid_actor_role_not_admin_operator');

  const ok = blockingIssues.length === 0;
  const notificationBlockedByGuardAvailable = true;

  return {
    ok,
    allowed: ok,
    decision: ok ? 'allow_canary_setup' : 'deny_canary_setup',
    actorRoleValid: isAdminOperator,
    verifiedSchoolContextRequired: !!input.schoolId,
    adminOperatorActorRequired: true,
    task031ProofRequired: true,
    approvedConfigRequired: true,
    cohortEligibilityRequired: true,
    consentAuthorizationReadinessRequired: true,
    privacyBoundaryRequired: true,
    healthBudgetRequired: true,
    rollbackReadinessRequired: true,
    incidentBridgeRequired: true,
    noLiveAi: notificationBlockedByGuardAvailable,
    noLiveConnector: notificationBlockedByGuardAvailable,
    noLiveNotification: notificationBlockedByGuardAvailable,
    noDeployment: notificationBlockedByGuardAvailable,
    noRollout: notificationBlockedByGuardAvailable,
    noObservation: notificationBlockedByGuardAvailable,
    safeToCreateSession: false,
    safeToAccessMemory: false,
    safeToCallAi: false,
    safeReasonCode: ok ? '' : blockingIssues[0],
    rawPrivateDataExposed: false,
    gateChecks: [],
    blockingIssues,
  };
}