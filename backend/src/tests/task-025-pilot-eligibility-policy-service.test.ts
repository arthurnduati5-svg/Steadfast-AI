import { describe, it, expect } from 'vitest';
import { checkPilotEligibility } from '../services/task025PilotEligibilityPolicyService';

function makePassingParams(overrides: Partial<{
  schoolId: string;
  schoolVerified: boolean;
  pilotScopeEvaluated: boolean;
  cohortReadinessEvaluated: boolean;
  teacherWorkflowValidated: boolean;
  adminAcceptanceChecked: boolean;
  parentCommunicationChecked: boolean;
  safeguardingChecked: boolean;
  monitoringGateChecked: boolean;
  pauseRollbackChecked: boolean;
  dataPrivacyChecked: boolean;
  task020ContinuityPassed: boolean;
  task021ContinuityPassed: boolean;
  task022ContinuityPassed: boolean;
  task023ContinuityPassed: boolean;
  task024ContinuityPassed: boolean;
}> = {}): {
  schoolId: string;
  schoolVerified: boolean;
  pilotScopeEvaluated: boolean;
  cohortReadinessEvaluated: boolean;
  teacherWorkflowValidated: boolean;
  adminAcceptanceChecked: boolean;
  parentCommunicationChecked: boolean;
  safeguardingChecked: boolean;
  monitoringGateChecked: boolean;
  pauseRollbackChecked: boolean;
  dataPrivacyChecked: boolean;
  task020ContinuityPassed: boolean;
  task021ContinuityPassed: boolean;
  task022ContinuityPassed: boolean;
  task023ContinuityPassed: boolean;
  task024ContinuityPassed: boolean;
} {
  return {
    schoolId: 'school-001',
    schoolVerified: true,
    pilotScopeEvaluated: true,
    cohortReadinessEvaluated: true,
    teacherWorkflowValidated: true,
    adminAcceptanceChecked: true,
    parentCommunicationChecked: true,
    safeguardingChecked: true,
    monitoringGateChecked: true,
    pauseRollbackChecked: true,
    dataPrivacyChecked: true,
    task020ContinuityPassed: true,
    task021ContinuityPassed: true,
    task022ContinuityPassed: true,
    task023ContinuityPassed: true,
    task024ContinuityPassed: true,
    ...overrides,
  };
}

describe('checkPilotEligibility', () => {
  it('returns eligible when all criteria pass', async () => {
    const result = await checkPilotEligibility(makePassingParams());

    expect(result.eligible).toBe(true);
    expect(result.riskLevel).toBe('low');
    expect(result.safeBlockers).toHaveLength(0);
    expect(result.safeSummary).toContain('meets all pilot eligibility criteria');
  });

  it('blocks when schoolId is empty', async () => {
    const result = await checkPilotEligibility(makePassingParams({ schoolId: '' }));

    expect(result.eligible).toBe(false);
    expect(result.safeBlockers.some((b) => b.type === 'school_identity')).toBe(true);
  });

  it('blocks when school is not verified', async () => {
    const result = await checkPilotEligibility(makePassingParams({ schoolVerified: false }));

    expect(result.eligible).toBe(false);
    expect(result.safeBlockers.some((b) => b.type === 'school_identity')).toBe(true);
  });

  it('blocks when pilot scope has not been evaluated', async () => {
    const result = await checkPilotEligibility(makePassingParams({ pilotScopeEvaluated: false }));

    expect(result.eligible).toBe(false);
    expect(result.safeBlockers.some((b) => b.type === 'pilot_scope')).toBe(true);
  });

  it('blocks when safeguarding has not been checked', async () => {
    const result = await checkPilotEligibility(makePassingParams({ safeguardingChecked: false }));

    expect(result.eligible).toBe(false);
    expect(result.safeBlockers.some((b) => b.type === 'safeguarding_escalation')).toBe(true);
  });

  it('blocks when monitoring gate is not checked', async () => {
    const result = await checkPilotEligibility(makePassingParams({ monitoringGateChecked: false }));

    expect(result.eligible).toBe(false);
    expect(result.safeBlockers.some((b) => b.type === 'monitoring_gate')).toBe(true);
  });

  it('blocks when task continuity checks fail', async () => {
    const result = await checkPilotEligibility(makePassingParams({
      task020ContinuityPassed: false,
      task021ContinuityPassed: false,
      task022ContinuityPassed: false,
      task023ContinuityPassed: false,
      task024ContinuityPassed: false,
    }));

    expect(result.eligible).toBe(false);
    const continuityBlockers = result.safeBlockers.filter((b) => b.type === 'governance_continuity' || b.type === 'school_identity' || b.type === 'content_governance' || b.type === 'deployment_readiness' || b.type === 'operations_readiness');
    expect(continuityBlockers.length).toBe(5);
  });

  it('parent communication blocker is medium severity only', async () => {
    const result = await checkPilotEligibility(makePassingParams({ parentCommunicationChecked: false }));

    expect(result.eligible).toBe(false);
    const pcBlocker = result.safeBlockers.find((b) => b.type === 'parent_communication');
    expect(pcBlocker).toBeDefined();
    expect(pcBlocker!.severity).toBe('medium');
    expect(result.riskLevel).toBe('medium');
  });
});
