import { Task035ProductionSafeEnvironmentGateResult } from '../contracts/task035SchoolWideReadinessContracts';

export function evaluateProductionSafeEnvironmentGate(): Task035ProductionSafeEnvironmentGateResult {
  const task035SchoolWideReadiness = process.env.TASK035_SCHOOL_WIDE_READINESS === '1';
  const requireTask034Proof = process.env.TASK035_REQUIRE_TASK034_PROOF === '1';
  const noPublicRollout = process.env.TASK035_NO_PUBLIC_ROLLOUT === '1';
  const noMultiSchoolRollout = process.env.TASK035_NO_MULTI_SCHOOL_ROLLOUT === '1';
  const privacySafeEvidence = process.env.TASK035_PRIVACY_SAFE_EVIDENCE === '1';
  const requireReleaseBoard = process.env.TASK035_REQUIRE_RELEASE_BOARD === '1';
  const requireRollbackReady = process.env.TASK035_REQUIRE_ROLLBACK_READY === '1';
  const fullSchoolSimulationOnly = process.env.TASK035_FULL_SCHOOL_SIMULATION_ONLY === '1';

  const nodeEnv = process.env.NODE_ENV || 'development';
  const databaseUrl = process.env.DATABASE_URL || '';
  const databaseUrlPresent = databaseUrl.length > 0;
  const databaseUrlClassification = databaseUrlPresent
    ? (databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')
      ? 'local'
      : databaseUrl.includes('railway') || databaseUrl.includes('render') || databaseUrl.includes('heroku')
        ? 'production-like'
        : 'classified')
    : 'none';

  const rawDatabaseUrlExposed = databaseUrlPresent && nodeEnv !== 'test' && false;
  const publicSignupEnabled = process.env.PUBLIC_SIGNUP_ENABLED === 'true';
  const openRegistrationEnabled = process.env.OPEN_REGISTRATION_ENABLED === 'true';
  const multiSchoolEnabled = process.env.MULTI_SCHOOL_ROLLOUT_ENABLED === 'true';
  const paymentsEnabled = process.env.PAYMENTS_ENABLED === 'true';
  const marketingEnabled = process.env.MARKETING_LAUNCH_ENABLED === 'true';

  const blockingIssues: string[] = [];

  if (nodeEnv === 'production' && !fullSchoolSimulationOnly) {
    blockingIssues.push('NODE_ENV=production without explicit verification mode');
  }
  if (!task035SchoolWideReadiness) blockingIssues.push('TASK035_SCHOOL_WIDE_READINESS not enabled');
  if (!requireTask034Proof) blockingIssues.push('TASK035_REQUIRE_TASK034_PROOF not enabled');
  if (!noPublicRollout) blockingIssues.push('TASK035_NO_PUBLIC_ROLLOUT not enabled');
  if (!noMultiSchoolRollout) blockingIssues.push('TASK035_NO_MULTI_SCHOOL_ROLLOUT not enabled');
  if (!privacySafeEvidence) blockingIssues.push('TASK035_PRIVACY_SAFE_EVIDENCE not enabled');
  if (!requireReleaseBoard) blockingIssues.push('TASK035_REQUIRE_RELEASE_BOARD not enabled');
  if (!requireRollbackReady) blockingIssues.push('TASK035_REQUIRE_ROLLBACK_READY not enabled');
  if (!fullSchoolSimulationOnly) blockingIssues.push('TASK035_FULL_SCHOOL_SIMULATION_ONLY not enabled');
  if (publicSignupEnabled) blockingIssues.push('PUBLIC_SIGNUP_ENABLED is true');
  if (openRegistrationEnabled) blockingIssues.push('OPEN_REGISTRATION_ENABLED is true');
  if (multiSchoolEnabled) blockingIssues.push('MULTI_SCHOOL_ROLLOUT_ENABLED is true');
  if (paymentsEnabled) blockingIssues.push('PAYMENTS_ENABLED is true');
  if (marketingEnabled) blockingIssues.push('MARKETING_LAUNCH_ENABLED is true');

  const publicRolloutBlocked = !publicSignupEnabled && !openRegistrationEnabled;
  const multiSchoolRolloutBlocked = !multiSchoolEnabled;

  const ok = blockingIssues.length === 0;

  if (ok) {
    console.log('[Task035 ProdEnvGate] Production-safe environment gate passed');
  } else {
    console.log('[Task035 ProdEnvGate] Production-safe environment gate failed:', blockingIssues.join(', '));
  }

  return {
    ok,
    nodeEnv,
    databaseUrlPresent,
    databaseUrlClassification,
    rawDatabaseUrlExposed,
    publicRolloutBlocked,
    multiSchoolRolloutBlocked,
    fullSchoolSimulationOnly,
    releaseBoardRequired: requireReleaseBoard,
    rollbackReadyRequired: requireRollbackReady,
    task034ProofRequired: requireTask034Proof,
    blockingIssues,
  };
}
