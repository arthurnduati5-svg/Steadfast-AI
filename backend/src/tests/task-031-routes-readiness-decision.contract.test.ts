import { describe, it, expect } from 'vitest';
import { computeTask031CanaryReadiness } from '../services/task031CanaryReadinessDecisionService';
import { generateTask031RoleMatrix } from '../services/task031StagingRoleMatrixService';
import { captureTask031DefaultObservabilityBaseline } from '../services/task031ObservabilityBaselineService';
import { evaluateTask031LatencyErrorBudget } from '../services/task031LatencyErrorBudgetService';
import { validateTask031EmbedHandoffSmokeSync } from '../services/task031EmbedHandoffSmokeService';
import { validateTask031CopilotBootstrapSmokeSync } from '../services/task031CopilotBootstrapSmokeService';
import { validateTask031StudentPreflightSmokeSync } from '../services/task031StudentPreflightSmokeService';
import { validateTask031TeacherOversightSmokeSync } from '../services/task031TeacherOversightSmokeService';
import { validateTask031AdminOperatorMonitoringSmokeSync } from '../services/task031AdminOperatorMonitoringSmokeService';

function makeMockProof(ok: boolean) {
  return {
    ok, reportFound: ok, taskId: ok ? '030' : '', safeToStartTask031: ok,
    finalDecision: ok ? 'TASK_030_PASS_SAFE_TO_START_TASK_031' : '',
    blockingIssuesEmpty: ok, verificationExitCodeZero: ok,
    stagingRehearsalResultFound: ok, stagingRehearsalSafeToStartTask031: ok,
    handoffConsistent: ok, proofLoaded: ok, blockingIssues: ok ? [] : ['mock_failure'],
  };
}

function makePassingInput() {
  const baseline = captureTask031DefaultObservabilityBaseline('test_readiness');
  return {
    task030Proof: makeMockProof(true),
    stagingEnvironmentGate: {
      ok: true, stagingSmokeEnabled: true, noLiveStudentsEnabled: true,
      syntheticSchoolIdentityEnabled: true, nodeEnvClassification: 'development',
      databaseUrlClassification: 'not_set', redisUrlClassification: 'not_set',
      rawDatabaseUrlExposed: false, rawRedisUrlExposed: false,
      productionLikeBlocked: true, blockingIssues: [],
    },
    noLiveStudentGuard: {
      ok: true, liveStudentEmailDetected: false, liveStudentNameDetected: false,
      livePhoneNumberDetected: false, realRosterDetected: false,
      rawStudentChatUsed: false, privateLearnerMemoryUsed: false,
      productionCohortModified: false, productionDatabaseTouched: false,
      liveProductionRolloutPerformed: false, blockingIssues: [],
    },
    roleMatrix: generateTask031RoleMatrix(),
    embedHandoffSmoke: validateTask031EmbedHandoffSmokeSync(),
    copilotBootstrapSmoke: validateTask031CopilotBootstrapSmokeSync(),
    studentPreflightSmoke: validateTask031StudentPreflightSmokeSync(),
    teacherOversightSmoke: validateTask031TeacherOversightSmokeSync(),
    adminOperatorMonitoringSmoke: validateTask031AdminOperatorMonitoringSmokeSync(),
    observabilityBaseline: baseline,
    latencyErrorBudget: evaluateTask031LatencyErrorBudget({ baseline }),
    allTestsPassed: true,
    verificationScriptExitedZero: true,
    reportValidated: true,
    privacyScanPassed: true,
  };
}

describe('Task 031 - POST /smoke-runs/:runId/canary-readiness-decision contract', () => {
  it('should produce safe decision when all gates pass', () => {
    const result = computeTask031CanaryReadiness(makePassingInput());
    expect(result.safeToStartTask032).toBe(true);
    expect(result.finalDecision).toBe('TASK_031_PASS_SAFE_TO_START_TASK_032');
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('should fail when task030 proof is invalid', () => {
    const input = { ...makePassingInput(), task030Proof: makeMockProof(false) };
    const result = computeTask031CanaryReadiness(input);
    expect(result.safeToStartTask032).toBe(false);
    expect(result.task030ProofValid).toBe(false);
    expect(result.blockingIssues.length).toBeGreaterThan(0);
  });

  it('should fail when staging environment gate fails', () => {
    const input = {
      ...makePassingInput(),
      stagingEnvironmentGate: {
        ok: false, stagingSmokeEnabled: false, noLiveStudentsEnabled: false,
        syntheticSchoolIdentityEnabled: false, nodeEnvClassification: 'production',
        databaseUrlClassification: 'production_like', redisUrlClassification: 'not_set',
        rawDatabaseUrlExposed: false, rawRedisUrlExposed: false,
        productionLikeBlocked: false, blockingIssues: ['node_env_is_production'],
      },
    };
    const result = computeTask031CanaryReadiness(input);
    expect(result.safeToStartTask032).toBe(false);
    expect(result.stagingEnvironmentPassed).toBe(false);
  });

  it('should include known limitations when passing', () => {
    const result = computeTask031CanaryReadiness(makePassingInput());
    expect(result.knownLimitations.length).toBeGreaterThan(0);
    expect(result.knownLimitations[0]).toContain('live production students');
  });

  it('should fail when no-live-student guard fails', () => {
    const input = {
      ...makePassingInput(),
      noLiveStudentGuard: {
        ok: false, liveStudentEmailDetected: true, liveStudentNameDetected: false,
        livePhoneNumberDetected: false, realRosterDetected: false,
        rawStudentChatUsed: false, privateLearnerMemoryUsed: false,
        productionCohortModified: false, productionDatabaseTouched: false,
        liveProductionRolloutPerformed: false, blockingIssues: ['live_data_email'],
      },
    };
    const result = computeTask031CanaryReadiness(input);
    expect(result.safeToStartTask032).toBe(false);
    expect(result.noLiveStudentGuardPassed).toBe(false);
  });
});
