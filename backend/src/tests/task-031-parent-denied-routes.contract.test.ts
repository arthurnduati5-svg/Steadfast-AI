import { describe, it, expect } from 'vitest';
import { isTask031DeniedRealRole, TASK031_DENIED_REAL_ACTOR_ROLES } from '../contracts/task031StagingSmokeCanaryReadinessContracts';

describe('Task 031 - parent role is in denied list', () => {
  it('should contain parent in denied roles', () => {
    expect(TASK031_DENIED_REAL_ACTOR_ROLES).toContain('parent');
  });

  it('should return true for isTask031DeniedRealRole(parent)', () => {
    expect(isTask031DeniedRealRole('parent')).toBe(true);
  });

  it('should return true for case-insensitive Parent', () => {
    expect(isTask031DeniedRealRole('Parent')).toBe(true);
  });

  it('should not be in permitted roles like admin', () => {
    expect(TASK031_DENIED_REAL_ACTOR_ROLES).not.toContain('admin');
  });
});
