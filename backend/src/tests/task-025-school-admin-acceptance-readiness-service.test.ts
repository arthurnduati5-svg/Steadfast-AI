import { describe, it, expect } from 'vitest';
import { checkAdminAcceptance } from '../services/task025SchoolAdminAcceptanceReadinessService';

describe('checkAdminAcceptance', () => {
  const allAssigned = {
    adminOwner: 'Dr. Smith',
    pilotOwnerAssigned: true,
    pilotPurposeDefined: true,
    pilotScopeDefined: true,
    pilotDatesDefined: true,
    escalationOwnerAssigned: true,
    pauseOwnerAssigned: true,
    rollbackOwnerAssigned: true,
    supportOwnerAssigned: true,
    privacyOwnerAssigned: true,
    incidentOwnerAssigned: true,
  };

  it('returns confirmed status when all roles are assigned', async () => {
    const result = await checkAdminAcceptance(allAssigned);

    expect(result.adminAcceptanceStatus).toBe('admin_acceptance_confirmed');
    expect(result.riskLevel).toBe('low');
    expect(result.safeBlockers).toHaveLength(0);
    expect(result.safeSummary).toMatch(/confirmed/i);
  });

  it('adds high blocker when admin owner is missing', async () => {
    const result = await checkAdminAcceptance({ ...allAssigned, adminOwner: '' });

    expect(result.adminAcceptanceStatus).toBe('admin_acceptance_blocked');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].safeDescription).toMatch(/no admin acceptance owner/i);
  });

  it('adds high blocker when admin owner is whitespace only', async () => {
    const result = await checkAdminAcceptance({ ...allAssigned, adminOwner: '   ' });

    expect(result.adminAcceptanceStatus).toBe('admin_acceptance_blocked');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].severity).toBe('high');
  });

  it('adds high blocker when pilot owner is not assigned', async () => {
    const result = await checkAdminAcceptance({ ...allAssigned, pilotOwnerAssigned: false });

    expect(result.adminAcceptanceStatus).toBe('admin_acceptance_blocked');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].safeDescription).toMatch(/no pilot owner assigned/i);
  });

  it('adds high blocker when escalation owner is not assigned', async () => {
    const result = await checkAdminAcceptance({ ...allAssigned, escalationOwnerAssigned: false });

    expect(result.adminAcceptanceStatus).toBe('admin_acceptance_blocked');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].type).toBe('safeguarding_escalation');
  });

  it('adds high blockers when pause and rollback owners are both missing', async () => {
    const result = await checkAdminAcceptance({
      ...allAssigned,
      pauseOwnerAssigned: false,
      rollbackOwnerAssigned: false,
    });

    expect(result.adminAcceptanceStatus).toBe('admin_acceptance_blocked');
    const pauseRollbackBlockers = result.safeBlockers.filter((b) => b.type === 'pause_rollback');
    expect(pauseRollbackBlockers).toHaveLength(2);
    expect(pauseRollbackBlockers[0].safeDescription).toMatch(/no pause owner/i);
    expect(pauseRollbackBlockers[1].safeDescription).toMatch(/no rollback owner/i);
  });

  it('returns blocked when all boolean fields are false', async () => {
    const result = await checkAdminAcceptance({
      adminOwner: '',
      pilotOwnerAssigned: false,
      pilotPurposeDefined: false,
      pilotScopeDefined: false,
      pilotDatesDefined: false,
      escalationOwnerAssigned: false,
      pauseOwnerAssigned: false,
      rollbackOwnerAssigned: false,
      supportOwnerAssigned: false,
      privacyOwnerAssigned: false,
      incidentOwnerAssigned: false,
    });

    expect(result.adminAcceptanceStatus).toBe('admin_acceptance_blocked');
    expect(result.riskLevel).toBe('high');
    expect(result.safeBlockers.length).toBeGreaterThanOrEqual(10);
    expect(result.adminOwner).toBe('');
    expect(result.safeSummary).toContain('blocker');
  });

  it('includes medium blocker when pilot dates are undefined but no high blockers', async () => {
    const result = await checkAdminAcceptance({ ...allAssigned, pilotDatesDefined: false });

    expect(result.adminAcceptanceStatus).toBe('admin_acceptance_confirmed');
    expect(result.riskLevel).toBe('low');
    expect(result.safeBlockers).toHaveLength(1);
    expect(result.safeBlockers[0].severity).toBe('medium');
    expect(result.safeBlockers[0].safeDescription).toMatch(/pilot dates.*not defined/i);
  });
});
