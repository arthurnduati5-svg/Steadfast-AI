import { describe, it, expect } from 'vitest';
import {
  isTask034DeniedRole,
  TASK034_DENIED_ACTOR_ROLES,
  TASK034_ALLOWED_ACTOR_ROLES,
  isTask034AdminOperatorRole,
} from '../contracts/task034ControlledLimitedRolloutContracts';

describe('task034 student denied routes', () => {
  it('returns true for student', () => {
    expect(isTask034DeniedRole('student')).toBe(true);
  });

  it('student is in TASK034_DENIED_ACTOR_ROLES', () => {
    expect(TASK034_DENIED_ACTOR_ROLES).toContain('student');
  });

  it('student is not in TASK034_ALLOWED_ACTOR_ROLES', () => {
    expect(TASK034_ALLOWED_ACTOR_ROLES).not.toContain('student');
  });

  it('isTask034AdminOperatorRole returns false for student', () => {
    expect(isTask034AdminOperatorRole('student')).toBe(false);
  });

  it('denied roles array includes student', () => {
    expect(TASK034_DENIED_ACTOR_ROLES.includes('student')).toBe(true);
  });
});
