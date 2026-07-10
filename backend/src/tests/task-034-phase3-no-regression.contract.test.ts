import { describe, it, expect } from 'vitest';
import {
  TASK034_ALLOWED_ACTOR_ROLES,
  TASK034_DENIED_ACTOR_ROLES,
  TASK034_REQUIRED_DEPENDENCY_COMMITS,
  TASK034_MAX_ROLLOUT_PERCENT,
  TASK034_MAX_EXPANDED_STUDENT_COUNT,
} from '../contracts/task034ControlledLimitedRolloutContracts';
import { validateTask034DependencyProof } from '../lib/task034ControlledLimitedRolloutValidation';

describe('task034 phase3 no regression', () => {
  it('allowed roles remain unchanged', () => {
    expect(TASK034_ALLOWED_ACTOR_ROLES).toEqual([
      'school_admin',
      'system_admin',
      'internal_operator',
      'authorized_rollout_operator',
      'operations_reviewer',
    ]);
  });

  it('denied roles remain unchanged', () => {
    expect(TASK034_DENIED_ACTOR_ROLES).toContain('student');
    expect(TASK034_DENIED_ACTOR_ROLES).toContain('learner');
    expect(TASK034_DENIED_ACTOR_ROLES).toContain('parent');
    expect(TASK034_DENIED_ACTOR_ROLES).toContain('peer');
  });

  it('max rollout percent is 25', () => {
    expect(TASK034_MAX_ROLLOUT_PERCENT).toBe(25);
  });

  it('max expanded student count is 100', () => {
    expect(TASK034_MAX_EXPANDED_STUDENT_COUNT).toBe(100);
  });

  it('dependency proof validation rejects null', () => {
    const result = validateTask034DependencyProof(null);
    expect(result.ok).toBe(false);
  });

  it('dependency proof validation requires ok true', () => {
    const result = validateTask034DependencyProof({
      ok: false,
      reportFound: true,
      opsReportFound: true,
      verdict: 'test',
      safeToStartTask034: true,
      safeToStartTask035: false,
      safeToStartTask040: false,
      task033FocusedTestsPassed: true,
      task033RouteContractsPassed: true,
      task033RoleSecurityTestsPassed: true,
      task033ContinuityTestsPassed: true,
      task033NoStarSafetyTestsPassed: true,
      task033VerificationScriptPassed: true,
      task020To032RegressionPassed: true,
      phase3RegressionPassed: true,
      fullBackendSuitePassed: true,
      backendTypecheckPassed: true,
      backendBuildPassed: true,
      prismaValidatePassed: true,
      prismaGeneratePassed: true,
      privacyScanPassed: true,
      noProductionMutationScanPassed: true,
      noLiveConnectorAiScanPassed: true,
      noLiveNotificationScanPassed: true,
      noFrontendUiScanPassed: true,
      noTask034ToTask040ScanPassed: true,
      noFalsePassScanPassed: true,
      noTask034ImplementationInTask033: true,
      noFrontendUiInTask033: true,
      noLiveAiConnectorNotificationInTask033: true,
      remainingBlockers: [],
      blockingIssues: [],
    });
    expect(result.ok).toBe(false);
  });
});
