import { describe, it, expect } from 'vitest';
import {
  TASK034_ALLOWED_ACTOR_ROLES,
  TASK034_DENIED_ACTOR_ROLES,
  isTask034AdminOperatorRole,
  isTask034DeniedRole,
  resolveTask034ActorRole,
} from '../contracts/task034ControlledLimitedRolloutContracts';

describe('task034 teacher control denied routes', () => {
  it('teacher is not in TASK034_ALLOWED_ACTOR_ROLES', () => {
    expect(TASK034_ALLOWED_ACTOR_ROLES).not.toContain('teacher');
  });

  it('isTask034AdminOperatorRole returns false for teacher', () => {
    expect(isTask034AdminOperatorRole('teacher')).toBe(false);
  });

  it('isTask034DeniedRole returns false for teacher', () => {
    expect(isTask034DeniedRole('teacher')).toBe(false);
  });

  it('teacher is neither allowed nor denied', () => {
    const allowed = TASK034_ALLOWED_ACTOR_ROLES.includes('teacher');
    const denied = isTask034DeniedRole('teacher');
    expect(allowed).toBe(false);
    expect(denied).toBe(false);
  });

  it('teacher resolves to teacher via resolveTask034ActorRole', () => {
    expect(resolveTask034ActorRole('teacher')).toBe('teacher');
  });

  it('TASK034_DENIED_ACTOR_ROLES does not include teacher', () => {
    expect(TASK034_DENIED_ACTOR_ROLES).not.toContain('teacher');
  });
});
