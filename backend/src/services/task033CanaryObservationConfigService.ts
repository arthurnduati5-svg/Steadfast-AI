import type { Task033CanaryObservationConfig } from '../contracts/task033CanaryObservationContracts';

export function getTask033CanaryObservationConfig(): Task033CanaryObservationConfig {
  const blockingIssues: string[] = [];

  const observationRunId = process.env.TASK033_OBSERVATION_RUN_ID || 'observation_run_task033_safe';
  const observationWindowId = process.env.TASK033_OBSERVATION_WINDOW_ID || 'observation_window_task033_safe';
  const canaryRunId = process.env.TASK033_CANARY_RUN_ID || 'canary_run_task032_safe';
  const schoolId = process.env.TASK033_SCHOOL_ID || 'school_task032_canary_safe';
  const tenantId = process.env.TASK033_TENANT_ID || 'tenant_task032_canary_safe';
  const cohortId = process.env.TASK033_COHORT_ID || 'canary_cohort_task032_safe';
  const maxCanaryPercent = parseInt(process.env.TASK033_MAX_CANARY_PERCENT || '5', 10);
  const maxCanaryStudents = parseInt(process.env.TASK033_MAX_CANARY_STUDENTS || '25', 10);

  const task033Observation = process.env.TASK033_CANARY_OBSERVATION === '1';
  const requireTask032Proof = process.env.TASK033_REQUIRE_TASK032_PROOF === '1';
  const noOpenRollout = process.env.TASK033_NO_OPEN_ROLLOUT === '1';
  const privacySafeEvidence = process.env.TASK033_PRIVACY_SAFE_EVIDENCE === '1';
  const requireRollbackReady = process.env.TASK033_REQUIRE_ROLLBACK_READY === '1';

  if (!task033Observation) blockingIssues.push('TASK033_CANARY_OBSERVATION not enabled');
  if (!requireTask032Proof) blockingIssues.push('TASK033_REQUIRE_TASK032_PROOF not enabled');
  if (!noOpenRollout) blockingIssues.push('TASK033_NO_OPEN_ROLLOUT not enabled');
  if (!privacySafeEvidence) blockingIssues.push('TASK033_PRIVACY_SAFE_EVIDENCE not enabled');
  if (!requireRollbackReady) blockingIssues.push('TASK033_REQUIRE_ROLLBACK_READY not enabled');

  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const liveRolloutEnabled = process.env.LIVE_ROLLOUT_ENABLED === 'true';
  const openRegistrationEnabled = process.env.OPEN_REGISTRATION_ENABLED === 'true';
  const enableAllStudents = process.env.ENABLE_ALL_STUDENTS === 'true';

  let nodeEnvSafe = true;
  if (isProduction && !task033Observation) {
    nodeEnvSafe = false;
    blockingIssues.push('NODE_ENV=production and no TASK033_CANARY_OBSERVATION flag');
  }
  if (liveRolloutEnabled) {
    blockingIssues.push('LIVE_ROLLOUT_ENABLED must not be true during observation');
  }
  if (openRegistrationEnabled) {
    blockingIssues.push('OPEN_REGISTRATION_ENABLED must not be true during observation');
  }
  if (enableAllStudents) {
    blockingIssues.push('ENABLE_ALL_STUDENTS must not be true during observation');
  }

  return {
    observationRunId,
    observationWindowId,
    canaryRunId,
    schoolId,
    tenantId,
    cohortId,
    maxCanaryPercent,
    maxCanaryStudents,
    observationMode: 'controlled_canary_observation',
    allowOpenRollout: false,
    allowSchoolWideRollout: false,
    allowRawChatCapture: false,
    allowRawMemoryCapture: false,
    allowProviderPromptCapture: false,
    allowProviderResponseCapture: false,
    requireTeacherReview: true,
    requireAdminReview: true,
    requireRollbackReady: true,
    envFlagsValid: blockingIssues.length === 0,
    nodeEnvSafe,
    blockingIssues,
  };
}

export function validateObservationFlag(flag: string, expected: string): boolean {
  return process.env[flag] === expected;
}
