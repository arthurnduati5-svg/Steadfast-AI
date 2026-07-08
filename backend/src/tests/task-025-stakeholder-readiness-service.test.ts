import { describe, it, expect } from 'vitest';
import { evaluateStakeholderReadiness } from '../services/task025StakeholderReadinessService';
import type { Task025StakeholderReadinessInput } from '../contracts/task025ControlledPilotReadinessContracts';

function makeInput(overrides: Partial<Task025StakeholderReadinessInput> = {}): Task025StakeholderReadinessInput {
  return {
    schoolId: 'school-001',
    teacherIds: ['teacher-1', 'teacher-2'],
    adminIds: ['admin-1'],
    supportStaffIds: ['support-1'],
    safeguardingOwnerId: 'safeguarding-1',
    ...overrides,
  };
}

describe('evaluateStakeholderReadiness', () => {
  it('returns stakeholder_ready when all roles are assigned', async () => {
    const result = await evaluateStakeholderReadiness(makeInput());

    expect(result.stakeholderStatus).toBe('stakeholder_ready');
    expect(result.riskLevel).toBe('low');
    expect(result.safeBlockers).toHaveLength(0);
    expect(result.safeguardingOwnerAssigned).toBe(true);
  });

  it('returns stakeholder_blocked when no teachers are identified', async () => {
    const result = await evaluateStakeholderReadiness(makeInput({ teacherIds: [] }));

    expect(result.stakeholderStatus).toBe('stakeholder_blocked');
    expect(result.riskLevel).toBe('high');
    expect(result.safeBlockers.some((b) => b.type === 'teacher_workflow')).toBe(true);
  });

  it('returns stakeholder_blocked when no admins are identified', async () => {
    const result = await evaluateStakeholderReadiness(makeInput({ adminIds: [] }));

    expect(result.stakeholderStatus).toBe('stakeholder_blocked');
    expect(result.safeBlockers.some((b) => b.type === 'admin_acceptance')).toBe(true);
  });

  it('returns stakeholder_blocked when no safeguarding owner is assigned', async () => {
    const result = await evaluateStakeholderReadiness(makeInput({ safeguardingOwnerId: '' }));

    expect(result.stakeholderStatus).toBe('stakeholder_blocked');
    expect(result.safeguardingOwnerAssigned).toBe(false);
    expect(result.safeBlockers.some((b) => b.type === 'safeguarding_escalation')).toBe(true);
  });

  it('reports correct stakeholder counts', async () => {
    const result = await evaluateStakeholderReadiness(makeInput());

    expect(result.teacherCount).toBe(2);
    expect(result.adminCount).toBe(1);
    expect(result.supportStaffCount).toBe(1);
  });

  it('handles missing supportStaffIds gracefully', async () => {
    const result = await evaluateStakeholderReadiness(makeInput({ supportStaffIds: [] }));

    expect(result.supportStaffCount).toBe(0);
    expect(result.stakeholderStatus).toBe('stakeholder_ready');
  });
});
