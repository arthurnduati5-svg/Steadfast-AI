import { describe, it, expect } from 'vitest';
import {
  isTask034DeniedRole,
  TASK034_DENIED_ACTOR_ROLES,
  TASK034_ALLOWED_ACTOR_ROLES,
  isTask034AdminOperatorRole,
} from '../contracts/task034ControlledLimitedRolloutContracts';

describe('task034 learner denied routes', () => {
  it('returns true for learner', () => {
    expect(isTask034DeniedRole('learner')).toBe(true);
  });

  it('learner is in TASK034_DENIED_ACTOR_ROLES', () => {
    expect(TASK034_DENIED_ACTOR_ROLES).toContain('learner');
  });

  it('isTask034AdminOperatorRole returns false for learner', () => {
    expect(isTask034AdminOperatorRole('learner')).toBe(false);
  });

  it('learner is not in allowed roles', () => {
    expect(TASK034_ALLOWED_ACTOR_ROLES).not.toContain('learner');
  });

  it('denied roles array includes learner', () => {
    expect(TASK034_DENIED_ACTOR_ROLES.includes('learner')).toBe(true);
  });
});
