import { describe, it, expect } from 'vitest';
import {
  isTask034DeniedRole,
  TASK034_DENIED_ACTOR_ROLES,
  TASK034_ALLOWED_ACTOR_ROLES,
  isTask034AdminOperatorRole,
} from '../contracts/task034ControlledLimitedRolloutContracts';

describe('task034 peer denied routes', () => {
  it('returns true for peer', () => {
    expect(isTask034DeniedRole('peer')).toBe(true);
  });

  it('peer is in TASK034_DENIED_ACTOR_ROLES', () => {
    expect(TASK034_DENIED_ACTOR_ROLES).toContain('peer');
  });

  it('isTask034AdminOperatorRole returns false for peer', () => {
    expect(isTask034AdminOperatorRole('peer')).toBe(false);
  });

  it('peer is not in allowed roles', () => {
    expect(TASK034_ALLOWED_ACTOR_ROLES).not.toContain('peer');
  });

  it('denied roles array includes peer', () => {
    expect(TASK034_DENIED_ACTOR_ROLES.includes('peer')).toBe(true);
  });
});
