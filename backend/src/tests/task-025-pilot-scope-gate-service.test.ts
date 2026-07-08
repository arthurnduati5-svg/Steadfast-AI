import { describe, it, expect } from 'vitest';
import { evaluatePilotScope } from '../services/task025PilotScopeGateService';
import type { Task025PilotScopeInput } from '../contracts/task025ControlledPilotReadinessContracts';

function makePassingInput(overrides: Partial<Task025PilotScopeInput> = {}): Task025PilotScopeInput {
  return {
    schoolId: 'school-001',
    pilotPurpose: 'Test pilot for Mathematics',
    cohortSize: 30,
    pilotDurationWeeks: 6,
    teacherCoverageAvailable: true,
    adminOwner: 'admin-1',
    supportOwner: 'support-1',
    monitoringOwner: 'monitor-1',
    pauseOwner: 'pause-1',
    rollbackOwner: 'rollback-1',
    safeguardingEscalationPathDefined: true,
    parentCommunicationMaterialPrepared: true,
    deenSourceReferralPathDefined: true,
    curriculumSourceGovernanceReady: true,
    privacyGovernanceReady: true,
    operationsMonitoringReady: true,
    ...overrides,
  };
}

describe('evaluatePilotScope', () => {
  it('returns scope_approved when all gates pass', async () => {
    const result = await evaluatePilotScope(makePassingInput());

    expect(result.scopeStatus).toBe('scope_approved');
    expect(result.riskLevel).toBe('low');
    expect(result.task026SafeToStart).toBe(true);
    expect(result.safeBlockers).toHaveLength(0);
  });

  it('blocks when teacher coverage is unavailable', async () => {
    const result = await evaluatePilotScope(makePassingInput({ teacherCoverageAvailable: false }));

    expect(result.scopeStatus).toBe('scope_blocked');
    expect(result.task026SafeToStart).toBe(false);
    expect(result.safeBlockers.some((b) => b.type === 'pilot_scope')).toBe(true);
  });

  it('blocks when safeguarding escalation path is not defined', async () => {
    const result = await evaluatePilotScope(makePassingInput({ safeguardingEscalationPathDefined: false }));

    expect(result.scopeStatus).toBe('scope_blocked');
    expect(result.safeBlockers.some((b) => b.type === 'safeguarding_escalation')).toBe(true);
  });

  it('returns scope_pending_review when only medium blockers exist', async () => {
    const result = await evaluatePilotScope(makePassingInput({
      teacherCoverageAvailable: true,
      safeguardingEscalationPathDefined: true,
      curriculumSourceGovernanceReady: true,
      privacyGovernanceReady: true,
      operationsMonitoringReady: true,
      parentCommunicationMaterialPrepared: false,
      deenSourceReferralPathDefined: true,
    }));

    expect(result.scopeStatus).toBe('scope_pending_review');
    expect(result.riskLevel).toBe('medium');
    expect(result.task026SafeToStart).toBe(false);
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].severity).toBe('medium');
  });

  it('adds blocker when cohort size exceeds 50', async () => {
    const result = await evaluatePilotScope(makePassingInput({ cohortSize: 60 }));

    expect(result.scopeStatus).toBe('scope_pending_review');
    expect(result.safeBlockers.some((b) => b.severity === 'medium' && b.type === 'pilot_scope')).toBe(true);
  });

  it('adds blocker when curriculum source governance is not ready', async () => {
    const result = await evaluatePilotScope(makePassingInput({ curriculumSourceGovernanceReady: false }));

    expect(result.scopeStatus).toBe('scope_blocked');
    expect(result.safeBlockers.some((b) => b.type === 'content_governance')).toBe(true);
  });

  it('adds blocker when privacy governance is not ready', async () => {
    const result = await evaluatePilotScope(makePassingInput({ privacyGovernanceReady: false }));

    expect(result.scopeStatus).toBe('scope_blocked');
    expect(result.safeBlockers.some((b) => b.type === 'data_privacy')).toBe(true);
  });

  it('returns safeSummary with pilot purpose when approved', async () => {
    const result = await evaluatePilotScope(makePassingInput({ pilotPurpose: 'Algebra pilot' }));

    expect(result.safeSummary).toContain('Algebra pilot');
    expect(result.safeSummary).toContain('scope is approved');
  });
});
