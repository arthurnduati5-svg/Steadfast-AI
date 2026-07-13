import { describe, it, expect } from 'vitest';
import { validateApprovedSchoolBoundary } from '../services/task035ApprovedSchoolBoundaryGuardService';

describe('task035 tenant-mismatch denial contract', () => {
  it('blocks tenant mismatch access', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.tenantMismatchBlocked).toBe(true);
  });

  it('generates blocking issue when tenant mismatch is not blocked', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.blockingIssues).not.toContain('tenant_mismatch_not_blocked');
    expect(result.tenantMismatchBlocked).toBe(true);
  });

  it('includes tenantMismatchBlocked in boundary config', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result).toHaveProperty('tenantMismatchBlocked');
    expect(typeof result.tenantMismatchBlocked).toBe('boolean');
  });

  it('all three denial flags are true simultaneously', () => {
    const result = validateApprovedSchoolBoundary();
    expect(result.crossSchoolAccessBlocked).toBe(true);
    expect(result.unknownSchoolBlocked).toBe(true);
    expect(result.tenantMismatchBlocked).toBe(true);
  });

  it('tenant mismatch blocking is required for a passing boundary', () => {
    const result = validateApprovedSchoolBoundary();
    if (!result.tenantMismatchBlocked) {
      expect(result.blockingIssues).toContain('tenant_mismatch_not_blocked');
    } else {
      expect(result.blockingIssues).not.toContain('tenant_mismatch_not_blocked');
    }
  });
});
