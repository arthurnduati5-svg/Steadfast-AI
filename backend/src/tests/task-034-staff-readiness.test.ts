import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateTask034StaffReadiness } from '../services/task034StaffReadinessService';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

function validStaffInput() {
  return {
    schoolAdminAcknowledged: true,
    internalOperatorAcknowledged: true,
    teacherSupportAcknowledged: true,
    privacyBoundaryAcknowledged: true,
    safeguardingEscalationAcknowledged: true,
    deenBoundaryAcknowledged: true,
    contentGovernanceAcknowledged: true,
    rollbackPauseKillSwitchAcknowledged: true,
    learnerSupportPlanAcknowledged: true,
    readinessScore: 85,
  };
}

describe('Task034 Staff Readiness', () => {
  beforeEach(async () => {
    await task034Repository.clearTask034StoresForTests();
  });

  it('Valid input with all acknowledgements and score >= 50 passes', () => {
    const result = evaluateTask034StaffReadiness(validStaffInput());
    expect(result.ok).toBe(true);
    expect(result.readinessScore).toBe(85);
    expect(result.minReadinessScore).toBe(50);
    expect(result.noRealMessagesSent).toBe(true);
  });

  it('schoolAdminAcknowledged false fails', () => {
    const input = validStaffInput();
    input.schoolAdminAcknowledged = false;
    const result = evaluateTask034StaffReadiness(input);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('schoolAdminAcknowledged_not_acknowledged');
  });

  it('internalOperatorAcknowledged false fails', () => {
    const input = validStaffInput();
    input.internalOperatorAcknowledged = false;
    const result = evaluateTask034StaffReadiness(input);
    expect(result.ok).toBe(false);
  });

  it('teacherSupportAcknowledged false fails', () => {
    const input = validStaffInput();
    input.teacherSupportAcknowledged = false;
    const result = evaluateTask034StaffReadiness(input);
    expect(result.ok).toBe(false);
  });

  it('privacyBoundaryAcknowledged false fails', () => {
    const input = validStaffInput();
    input.privacyBoundaryAcknowledged = false;
    const result = evaluateTask034StaffReadiness(input);
    expect(result.ok).toBe(false);
  });

  it('safeguardingEscalationAcknowledged false fails', () => {
    const input = validStaffInput();
    input.safeguardingEscalationAcknowledged = false;
    const result = evaluateTask034StaffReadiness(input);
    expect(result.ok).toBe(false);
  });

  it('deenBoundaryAcknowledged false fails', () => {
    const input = validStaffInput();
    input.deenBoundaryAcknowledged = false;
    const result = evaluateTask034StaffReadiness(input);
    expect(result.ok).toBe(false);
  });

  it('contentGovernanceAcknowledged false fails', () => {
    const input = validStaffInput();
    input.contentGovernanceAcknowledged = false;
    const result = evaluateTask034StaffReadiness(input);
    expect(result.ok).toBe(false);
  });

  it('rollbackPauseKillSwitchAcknowledged false fails', () => {
    const input = validStaffInput();
    input.rollbackPauseKillSwitchAcknowledged = false;
    const result = evaluateTask034StaffReadiness(input);
    expect(result.ok).toBe(false);
  });

  it('learnerSupportPlanAcknowledged false fails', () => {
    const input = validStaffInput();
    input.learnerSupportPlanAcknowledged = false;
    const result = evaluateTask034StaffReadiness(input);
    expect(result.ok).toBe(false);
  });

  it('readinessScore < 50 fails', () => {
    const input = validStaffInput();
    input.readinessScore = 30;
    const result = evaluateTask034StaffReadiness(input);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues.some(i => i.includes('readiness_score_below_minimum'))).toBe(true);
  });

  it('readinessScore exactly 50 passes', () => {
    const input = validStaffInput();
    input.readinessScore = 50;
    const result = evaluateTask034StaffReadiness(input);
    expect(result.ok).toBe(true);
  });

  it('stores result in repository', async () => {
    evaluateTask034StaffReadiness(validStaffInput());
    const stored = await task034Repository.getStaffReadiness();
    expect(stored).not.toBeNull();
    expect(stored!.schoolAdminAcknowledged).toBe(true);
  });
});
