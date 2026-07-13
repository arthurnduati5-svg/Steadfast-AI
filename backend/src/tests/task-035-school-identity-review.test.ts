import { describe, it, expect } from 'vitest';
import { validateApprovedSchoolBoundary } from '../services/task035ApprovedSchoolBoundaryGuardService';

describe('task035ApprovedSchoolBoundaryGuardService', () => {
  it('returns a config with required fields', () => {
    const config = validateApprovedSchoolBoundary();
    expect(config).toBeDefined();
    expect(typeof config.ok).toBe('boolean');
    expect(Array.isArray(config.blockingIssues)).toBe(true);
  });

  it('has a non-empty approved school ID', () => {
    const config = validateApprovedSchoolBoundary();
    expect(config.approvedSchoolId).toBeTruthy();
    expect(config.approvedSchoolId.length).toBeGreaterThan(0);
  });

  it('has a non-empty approved tenant ID', () => {
    const config = validateApprovedSchoolBoundary();
    expect(config.approvedTenantId).toBeTruthy();
    expect(config.approvedTenantId.length).toBeGreaterThan(0);
  });

  it('has a non-empty approved roster scope', () => {
    const config = validateApprovedSchoolBoundary();
    expect(config.approvedRosterScope).toBeTruthy();
    expect(config.approvedRosterScope.length).toBeGreaterThan(0);
  });

  it('blocks cross-school access', () => {
    const config = validateApprovedSchoolBoundary();
    expect(config.crossSchoolAccessBlocked).toBe(true);
  });

  it('blocks unknown schools', () => {
    const config = validateApprovedSchoolBoundary();
    expect(config.unknownSchoolBlocked).toBe(true);
  });

  it('blocks tenant mismatches', () => {
    const config = validateApprovedSchoolBoundary();
    expect(config.tenantMismatchBlocked).toBe(true);
  });

  it('does not expose real roster exports', () => {
    const config = validateApprovedSchoolBoundary();
    expect(config.realRosterExportExposed).toBe(false);
  });
});
