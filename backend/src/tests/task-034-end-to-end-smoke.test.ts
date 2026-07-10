import { describe, it, expect } from 'vitest';
import {
  TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS,
  TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS,
  TASK034_FORBIDDEN_OUTPUT_FIELDS,
  TASK034_FORBIDDEN_SIDE_EFFECT_MODES,
  TASK034_ALLOWED_ENVIRONMENT_TYPES,
  TASK034_ALLOWED_ROLLOUT_MODES,
  TASK034_DENIED_ACTOR_ROLES,
  TASK034_ALLOWED_ACTOR_ROLES,
  TASK034_MAX_ROLLOUT_PERCENT,
  TASK034_MAX_EXPANDED_STUDENT_COUNT,
  isTask034ValidStateTransition,
  calculateTask034RolloutDecision,
  calculateTask034SafeToStartTask035,
  resolveTask034ActorRole,
} from '../contracts/task034ControlledLimitedRolloutContracts';
import { validateTask034DependencyProof } from '../lib/task034ControlledLimitedRolloutValidation';
import { getControlledRolloutConfig } from '../services/task034ControlledRolloutConfigService';

describe('task034 end-to-end smoke', () => {
  it('forbidden side effect patterns include notification, connector, deployment, mutation patterns', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('sendEmail');
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('liveConnector');
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('kubectl apply');
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('prisma.migrate');
  });

  it('forbidden future task patterns block future tasks', () => {
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('task035');
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('task040');
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('school-wide launch');
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('100 percent rollout');
  });

  it('forbidden output fields cover sensitive data', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('studentName');
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('rawLearnerData');
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('answerKey');
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('hiddenReasoning');
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS.length).toBeGreaterThanOrEqual(20);
  });

  it('forbidden side effect modes block live operations', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_MODES).toContain('live_notification');
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_MODES).toContain('live_ai_call');
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_MODES).toContain('production_mutation');
  });

  it('allowed environment types are correct', () => {
    expect(TASK034_ALLOWED_ENVIRONMENT_TYPES).toContain('controlled_limited_rollout');
    expect(TASK034_ALLOWED_ENVIRONMENT_TYPES).toHaveLength(1);
  });

  it('allowed rollout modes are correct', () => {
    expect(TASK034_ALLOWED_ROLLOUT_MODES).toContain('limited_cohort_expansion_only');
    expect(TASK034_ALLOWED_ROLLOUT_MODES).toHaveLength(1);
  });

  it('allowed and denied roles are mutually exclusive', () => {
    for (const role of TASK034_ALLOWED_ACTOR_ROLES) {
      expect(TASK034_DENIED_ACTOR_ROLES).not.toContain(role);
    }
    expect(TASK034_ALLOWED_ACTOR_ROLES.length).toBeGreaterThan(0);
    expect(TASK034_DENIED_ACTOR_ROLES.length).toBeGreaterThan(0);
  });

  it('dependency proof validation works end-to-end', () => {
    const result = validateTask034DependencyProof({
      ok: true, reportFound: true, opsReportFound: true, verdict: 'TASK_033_PASS_SAFE_TO_START_TASK_034',
      safeToStartTask034: true, safeToStartTask035: false, safeToStartTask040: false,
      task033FocusedTestsPassed: true, task033RouteContractsPassed: true,
      task033RoleSecurityTestsPassed: true, task033ContinuityTestsPassed: true,
      task033NoStarSafetyTestsPassed: true, task033VerificationScriptPassed: true,
      task020To032RegressionPassed: true, phase3RegressionPassed: true,
      fullBackendSuitePassed: true, backendTypecheckPassed: true, backendBuildPassed: true,
      prismaValidatePassed: true, prismaGeneratePassed: true,
      privacyScanPassed: true, noProductionMutationScanPassed: true,
      noLiveConnectorAiScanPassed: true, noLiveNotificationScanPassed: true,
      noFrontendUiScanPassed: true, noTask034ToTask040ScanPassed: true,
      noFalsePassScanPassed: true, noTask034ImplementationInTask033: true,
      noFrontendUiInTask033: true, noLiveAiConnectorNotificationInTask033: true,
      remainingBlockers: [], blockingIssues: [],
    });
    expect(result.ok).toBe(true);
  });

  it('state transition validation works', () => {
    expect(isTask034ValidStateTransition('created', 'dependency_checking')).toBe(true);
    expect(isTask034ValidStateTransition('created', 'limited_rollout_complete')).toBe(false);
    expect(isTask034ValidStateTransition('blocked', 'created')).toBe(false);
  });

  it('rollout decision calculation works', () => {
    expect(calculateTask034RolloutDecision(['pass', 'pass', 'pass'])).toBe('pass');
    expect(calculateTask034RolloutDecision(['pass', 'fail', 'pass'])).toBe('fail');
    expect(calculateTask034RolloutDecision([])).toBe('pause');
  });

  it('safeToStartTask035 calculation works', () => {
    expect(calculateTask034SafeToStartTask035(['pass', 'pass', 'pass'])).toBe(true);
    expect(calculateTask034SafeToStartTask035(['pass', 'fail', 'pass'])).toBe(false);
    expect(calculateTask034SafeToStartTask035([])).toBe(false);
  });

  it('resolveTask034ActorRole works for common roles', () => {
    expect(resolveTask034ActorRole('school_admin')).toBe('school_admin');
    expect(resolveTask034ActorRole('student')).toBe('student');
    expect(resolveTask034ActorRole('unknown')).toBe('unknown');
  });

  it('constants have correct max values', () => {
    expect(TASK034_MAX_ROLLOUT_PERCENT).toBe(25);
    expect(TASK034_MAX_EXPANDED_STUDENT_COUNT).toBe(100);
  });

  it('getControlledRolloutConfig returns config with blocking issues', () => {
    const config = getControlledRolloutConfig();
    expect(config).toBeDefined();
    expect(typeof config.maxControlledRolloutPercent).toBe('number');
    expect(Array.isArray(config.blockingIssues)).toBe(true);
  });
});
