import { describe, it, expect } from 'vitest';
import { resolveSchoolWideReadinessRole035, getSchoolWideReadinessRolePermissions035 } from '../contracts/task035SchoolWideReadinessContracts';

describe('task035 continuity from task026 (pilot execution)', () => {
  it('task035 role resolution works', () => {
    expect(resolveSchoolWideReadinessRole035('admin')).toBe('admin');
    expect(resolveSchoolWideReadinessRole035('operator')).toBe('operator');
    expect(resolveSchoolWideReadinessRole035('unknown')).toBe('unknown');
  });

  it('admin role has simulate permission', () => {
    const perms = getSchoolWideReadinessRolePermissions035('admin');
    expect(perms.canSimulate).toBe(true);
    expect(perms.canComputeDecision).toBe(true);
  });

  it('student role is denied from simulate', () => {
    const perms = getSchoolWideReadinessRolePermissions035('student');
    expect(perms.canSimulate).toBe(false);
    expect(perms.canComputeDecision).toBe(false);
  });
});
