import { describe, it, expect } from 'vitest';
import { validateApprovedSchoolBoundary } from '../services/task035ApprovedSchoolBoundaryGuardService';

describe('task035 school boundary validation contract', () => {
  it('returns valid school boundary config', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.approvedSchoolId).toBeTruthy();
    expect(result.approvedTenantId).toBeTruthy();
    expect(result.approvedRosterScope).toBeTruthy();
    expect(result.teacherAssignmentScope).toBeTruthy();
    expect(result.studentMembershipScope).toBeTruthy();
  });

  it('blocks cross-school access', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.crossSchoolAccessBlocked).toBe(true);
  });

  it('blocks unknown school access', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.unknownSchoolBlocked).toBe(true);
  });

  it('blocks tenant mismatch', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.tenantMismatchBlocked).toBe(true);
  });

  it('does not expose real roster export', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.realRosterExportExposed).toBe(false);
  });

  it('validates school boundary passes when all checks pass', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.ok).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('uses task035 safe identifiers for school/tenant', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.approvedSchoolId).toMatch(/task035/);
    expect(result.approvedTenantId).toMatch(/task035/);
  });

  it('assignment scope is restricted to assigned school only', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.teacherAssignmentScope).toMatch(/assigned_school/);
  });
});
