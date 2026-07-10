import { describe, it, expect } from 'vitest';
import {
  isTask034DeniedRole,
  TASK034_DENIED_ACTOR_ROLES,
  TASK034_ALLOWED_ACTOR_ROLES,
  isTask034AdminOperatorRole,
} from '../contracts/task034ControlledLimitedRolloutContracts';

describe('task034 parent denied routes', () => {
  it('returns true for parent', () => {
    expect(isTask034DeniedRole('parent')).toBe(true);
  });

  it('parent is in TASK034_DENIED_ACTOR_ROLES', () => {
    expect(TASK034_DENIED_ACTOR_ROLES).toContain('parent');
  });

  it('isTask034AdminOperatorRole returns false for parent', () => {
    expect(isTask034AdminOperatorRole('parent')).toBe(false);
  });

  it('parent is not in allowed roles', () => {
    expect(TASK034_ALLOWED_ACTOR_ROLES).not.toContain('parent');
  });

  it('denied roles array includes parent', () => {
    expect(TASK034_DENIED_ACTOR_ROLES.includes('parent')).toBe(true);
  });
});
