import { describe, it, expect } from 'vitest';
import { isTask031DeniedRealRole, TASK031_DENIED_REAL_ACTOR_ROLES } from '../contracts/task031StagingSmokeCanaryReadinessContracts';

describe('Task 031 - peer role is in denied list', () => {
  it('should contain peer in denied roles', () => {
    expect(TASK031_DENIED_REAL_ACTOR_ROLES).toContain('peer');
  });

  it('should return true for isTask031DeniedRealRole(peer)', () => {
    expect(isTask031DeniedRealRole('peer')).toBe(true);
  });

  it('should return true for case-insensitive PEER', () => {
    expect(isTask031DeniedRealRole('PEER')).toBe(true);
  });

  it('should not be in denied list for admin', () => {
    expect(isTask031DeniedRealRole('admin')).toBe(false);
  });
});
