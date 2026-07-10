import { describe, it, expect } from 'vitest';
import { evaluateTask034EnvironmentGate } from '../services/task034RolloutEnvironmentGateService';
import { evaluateTask034RolloutCap } from '../services/task034RolloutCapGateService';
import {
  TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS,
  TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS,
  TASK034_FORBIDDEN_OUTPUT_FIELDS,
  TASK034_MAX_ROLLOUT_PERCENT,
  TASK034_MAX_EXPANDED_STUDENT_COUNT,
} from '../contracts/task034ControlledLimitedRolloutContracts';

describe('task034 controlled limited rollout runner', () => {
  it('environment gate passes with valid input', () => {
    const result = evaluateTask034EnvironmentGate({
      environmentType: 'controlled_limited_rollout',
      rolloutMode: 'limited_cohort_expansion_only',
      dataMode: 'safe_metadata_and_aggregate_only',
      sideEffectMode: 'internal_rollout_store_only',
      task033Accepted: true,
      task034Started: false,
      task035Started: false,
      task040Started: false,
      rolloutPercent: 20,
      schoolWideLaunchRequested: false,
      hundredPercentRolloutRequested: false,
      backendFreezeRequested: false,
      frontendUiRequested: false,
      liveAiRequested: false,
      liveConnectorRequested: false,
      liveNotificationRequested: false,
      productionDeploymentRequested: false,
      productionMutationRequested: false,
    });
    expect(result.ok).toBe(true);
    expect(result.passed).toBe(true);
    expect(result.blockingIssues).toEqual([]);
  });

  it('environment gate blocks school-wide launch', () => {
    const result = evaluateTask034EnvironmentGate({
      environmentType: 'controlled_limited_rollout',
      rolloutMode: 'limited_cohort_expansion_only',
      dataMode: 'safe_metadata_and_aggregate_only',
      sideEffectMode: 'internal_rollout_store_only',
      task033Accepted: true,
      task034Started: false,
      task035Started: false,
      task040Started: false,
      rolloutPercent: 20,
      schoolWideLaunchRequested: true,
      hundredPercentRolloutRequested: false,
      backendFreezeRequested: false,
      frontendUiRequested: false,
      liveAiRequested: false,
      liveConnectorRequested: false,
      liveNotificationRequested: false,
      productionDeploymentRequested: false,
      productionMutationRequested: false,
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('school_wide_launch_requested');
  });

  it('environment gate blocks 100 percent rollout', () => {
    const result = evaluateTask034EnvironmentGate({
      environmentType: 'controlled_limited_rollout',
      rolloutMode: 'limited_cohort_expansion_only',
      dataMode: 'safe_metadata_and_aggregate_only',
      sideEffectMode: 'internal_rollout_store_only',
      task033Accepted: true,
      task034Started: false,
      task035Started: false,
      task040Started: false,
      rolloutPercent: 20,
      schoolWideLaunchRequested: false,
      hundredPercentRolloutRequested: true,
      backendFreezeRequested: false,
      frontendUiRequested: false,
      liveAiRequested: false,
      liveConnectorRequested: false,
      liveNotificationRequested: false,
      productionDeploymentRequested: false,
      productionMutationRequested: false,
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('hundred_percent_rollout_requested');
  });

  it('rollout cap gate passes with valid input', () => {
    const result = evaluateTask034RolloutCap({
      rolloutPercent: 20,
      expandedStudentCount: 50,
      maxRolloutPercent: TASK034_MAX_ROLLOUT_PERCENT,
      maxExpandedStudentCount: TASK034_MAX_EXPANDED_STUDENT_COUNT,
      schoolWideRequested: false,
      hundredPercentRequested: false,
      openCohortRequested: false,
      unknownCohortRequested: false,
      crossSchoolCohortRequested: false,
    });
    expect(result.ok).toBe(true);
    expect(result.percentCapPassed).toBe(true);
    expect(result.studentCapPassed).toBe(true);
  });

  it('rollout cap gate blocks school-wide', () => {
    const result = evaluateTask034RolloutCap({
      rolloutPercent: 20,
      expandedStudentCount: 50,
      maxRolloutPercent: TASK034_MAX_ROLLOUT_PERCENT,
      maxExpandedStudentCount: TASK034_MAX_EXPANDED_STUDENT_COUNT,
      schoolWideRequested: true,
      hundredPercentRequested: false,
      openCohortRequested: false,
      unknownCohortRequested: false,
      crossSchoolCohortRequested: false,
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('school_wide_requested');
  });

  it('rollout cap gate blocks 100 percent', () => {
    const result = evaluateTask034RolloutCap({
      rolloutPercent: 20,
      expandedStudentCount: 50,
      maxRolloutPercent: TASK034_MAX_ROLLOUT_PERCENT,
      maxExpandedStudentCount: TASK034_MAX_EXPANDED_STUDENT_COUNT,
      schoolWideRequested: false,
      hundredPercentRequested: true,
      openCohortRequested: false,
      unknownCohortRequested: false,
      crossSchoolCohortRequested: false,
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('hundred_percent_requested');
  });

  it('rollout cap gate blocks open cohort', () => {
    const result = evaluateTask034RolloutCap({
      rolloutPercent: 20,
      expandedStudentCount: 50,
      maxRolloutPercent: TASK034_MAX_ROLLOUT_PERCENT,
      maxExpandedStudentCount: TASK034_MAX_EXPANDED_STUDENT_COUNT,
      schoolWideRequested: false,
      hundredPercentRequested: false,
      openCohortRequested: true,
      unknownCohortRequested: false,
      crossSchoolCohortRequested: false,
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('open_cohort_requested');
  });

  it('forbidden patterns cover notification, connector, deployment, mutation', () => {
    const notificationPatterns = ['sendEmail', 'sendSms', 'sendWhatsapp', 'twilio'];
    const connectorPatterns = ['liveConnector', 'sisClient'];
    const deploymentPatterns = ['kubectl apply', 'vercel deploy', 'railway up'];
    const mutationPatterns = ['prisma.migrate', 'prisma.db.push', 'DROP TABLE'];
    for (const p of [...notificationPatterns, ...connectorPatterns, ...deploymentPatterns, ...mutationPatterns]) {
      expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain(p);
    }
  });

  it('forbidden future task patterns block task035, task040, school-wide, 100 percent', () => {
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('task035');
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('task040');
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('school-wide launch');
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('backend freeze');
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('100 percent rollout');
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('hundred percent rollout');
  });

  it('forbidden output fields cover sensitive data', () => {
    const sensitiveFields = ['studentName', 'studentEmail', 'rawLearnerData', 'answerKey', 'hiddenReasoning'];
    for (const f of sensitiveFields) {
      expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain(f);
    }
  });

  it('constants have correct max values', () => {
    expect(TASK034_MAX_ROLLOUT_PERCENT).toBe(25);
    expect(TASK034_MAX_EXPANDED_STUDENT_COUNT).toBe(100);
  });
});
