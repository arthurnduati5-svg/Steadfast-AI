import { describe, it, expect } from 'vitest';
import { validateApprovedSchoolBoundary } from '../services/task035ApprovedSchoolBoundaryGuardService';

describe('task035 school boundary guard unit', () => {
  it('passes with valid config when all fields are properly set', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.ok).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
    expect(result.approvedSchoolId).toBe('school_task035_full_school_safe');
    expect(result.approvedTenantId).toBe('tenant_task035_full_school_safe');
  });

  it('returns crossSchoolAccessBlocked as true', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.crossSchoolAccessBlocked).toBe(true);
  });

  it('returns unknownSchoolBlocked as true', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.unknownSchoolBlocked).toBe(true);
  });

  it('returns tenantMismatchBlocked as true', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.tenantMismatchBlocked).toBe(true);
  });

  it('returns realRosterExportExposed as false', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.realRosterExportExposed).toBe(false);
  });

  it('has correct teacher and student scope values', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.teacherAssignmentScope).toBe('assigned_school_only');
    expect(result.studentMembershipScope).toBe('enrolled_school_students');
  });
});
