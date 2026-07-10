import type { Task034ControlledRolloutConfig } from '../contracts/task034ControlledRolloutContracts';

export function getControlledRolloutConfig(): Task034ControlledRolloutConfig {
  const blockingIssues: string[] = [];

  const task034ControlledLimitedRollout = process.env.TASK034_CONTROLLED_LIMITED_ROLLOUT === '1';
  const requireTask033Proof = process.env.TASK034_REQUIRE_TASK033_PROOF === '1';
  const noOpenRollout = process.env.TASK034_NO_OPEN_ROLLOUT === '1';
  const noSchoolWideRollout = process.env.TASK034_NO_SCHOOL_WIDE_ROLLOUT === '1';
  const privacySafeEvidence = process.env.TASK034_PRIVACY_SAFE_EVIDENCE === '1';
  const requireStaffReadiness = process.env.TASK034_REQUIRE_STAFF_READINESS === '1';
  const requireRollbackReady = process.env.TASK034_REQUIRE_ROLLBACK_READY === '1';
  const maxRolloutPercentStr = process.env.TASK034_MAX_ROLLOUT_PERCENT || '';
  const maxRolloutStudentsStr = process.env.TASK034_MAX_ROLLOUT_STUDENTS || '';

  const maxRolloutPercent = parseInt(maxRolloutPercentStr, 10);
  const maxRolloutStudents = parseInt(maxRolloutStudentsStr, 10);

  const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
  const liveRolloutEnabled = process.env.LIVE_ROLLOUT_ENABLED === 'true';
  const openRegistrationEnabled = process.env.OPEN_REGISTRATION_ENABLED === 'true';
  const publicSignupEnabled = process.env.PUBLIC_SIGNUP_ENABLED === 'true';
  const enableAllStudents = process.env.ENABLE_ALL_STUDENTS === 'true';
  const schoolWideRolloutEnabled = process.env.SCHOOL_WIDE_ROLLOUT_ENABLED === 'true';

  if (!task034ControlledLimitedRollout) blockingIssues.push('ENV: TASK034_CONTROLLED_LIMITED_ROLLOUT not set');
  if (!requireTask033Proof) blockingIssues.push('ENV: TASK034_REQUIRE_TASK033_PROOF not set');
  if (!noOpenRollout) blockingIssues.push('ENV: TASK034_NO_OPEN_ROLLOUT not set');
  if (!noSchoolWideRollout) blockingIssues.push('ENV: TASK034_NO_SCHOOL_WIDE_ROLLOUT not set');
  if (!privacySafeEvidence) blockingIssues.push('ENV: TASK034_PRIVACY_SAFE_EVIDENCE not set');
  if (!requireStaffReadiness) blockingIssues.push('ENV: TASK034_REQUIRE_STAFF_READINESS not set');
  if (!requireRollbackReady) blockingIssues.push('ENV: TASK034_REQUIRE_ROLLBACK_READY not set');

  if (nodeEnv === 'production' && !task034ControlledLimitedRollout) {
    blockingIssues.push('PRODUCTION without approved limited rollout flag');
  }
  if (liveRolloutEnabled && !task034ControlledLimitedRollout) {
    blockingIssues.push('LIVE_ROLLOUT_ENABLED without controlled limited rollout approval');
  }
  if (openRegistrationEnabled) blockingIssues.push('OPEN_REGISTRATION_ENABLED is true');
  if (publicSignupEnabled) blockingIssues.push('PUBLIC_SIGNUP_ENABLED is true');
  if (enableAllStudents) blockingIssues.push('ENABLE_ALL_STUDENTS is true');
  if (schoolWideRolloutEnabled) blockingIssues.push('SCHOOL_WIDE_ROLLOUT_ENABLED is true');

  let effectiveMaxPercent = 25;
  let effectiveMaxStudents = 100;

  if (maxRolloutPercentStr) {
    if (isNaN(maxRolloutPercent) || maxRolloutPercent <= 0 || maxRolloutPercent > 25) {
      blockingIssues.push(`TASK034_MAX_ROLLOUT_PERCENT invalid: ${maxRolloutPercentStr}`);
    } else {
      effectiveMaxPercent = maxRolloutPercent;
    }
  }

  if (maxRolloutStudentsStr) {
    if (isNaN(maxRolloutStudents) || maxRolloutStudents <= 0 || maxRolloutStudents > 100) {
      blockingIssues.push(`TASK034_MAX_ROLLOUT_STUDENTS invalid: ${maxRolloutStudentsStr}`);
    } else {
      effectiveMaxStudents = maxRolloutStudents;
    }
  }

  const envFlagsValid = task034ControlledLimitedRollout && requireTask033Proof && noOpenRollout &&
    noSchoolWideRollout && privacySafeEvidence && requireStaffReadiness && requireRollbackReady;
  const nodeEnvSafe = nodeEnv !== 'production' || task034ControlledLimitedRollout;

  return {
    rolloutRunId: 'rollout_run_task034_safe',
    rolloutWindowId: 'rollout_window_task034_safe',
    schoolId: 'school_task034_limited_rollout_safe',
    tenantId: 'tenant_task034_limited_rollout_safe',
    cohortId: 'cohort_task034_limited_rollout_safe',
    maxControlledRolloutPercent: effectiveMaxPercent,
    maxControlledRolloutStudents: effectiveMaxStudents,
    observationMode: 'controlled_limited_rollout',
    allowOpenRegistration: false,
    allowPublicSignup: false,
    allowAllStudents: false,
    allowSchoolWideRollout: false,
    allowHundredPercentRollout: false,
    allowRawChatCapture: false,
    allowRawMemoryCapture: false,
    allowProviderPromptCapture: false,
    allowProviderResponseCapture: false,
    requireTask033Proof: true,
    requireStaffReadiness: true,
    requireLearnerNoticeReadiness: true,
    requireAdminApproval: true,
    requireOperatorReadiness: true,
    requireRollbackReady: true,
    envFlagsValid,
    nodeEnvSafe,
    blockingIssues,
  };
}
