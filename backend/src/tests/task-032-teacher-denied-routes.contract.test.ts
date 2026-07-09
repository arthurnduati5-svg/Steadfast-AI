import { describe, it, expect } from 'vitest';
import {
  isTask032AdminOperatorRole,
  isTask032DeniedRealRole,
  resolveTask032ActorRole,
  TASK032_DENIED_REAL_ACTOR_ROLES
} from '../contracts/task032ControlledCanaryActivationContracts';

describe('Task 032 - Teacher Denied Routes Contract', () => {
  it('should resolve teacher role correctly', () => {
    expect(resolveTask032ActorRole('teacher')).toBe('teacher');
  });

  it('should deny teacher from admin/operator functions', () => {
    expect(isTask032AdminOperatorRole('teacher')).toBe(false);
  });

  it('should identify teacher as denied real role', () => {
    expect(isTask032DeniedRealRole('teacher')).toBe(true);
  });

  it('should list teacher in denied roles', () => {
    expect(TASK032_DENIED_REAL_ACTOR_ROLES).toContain('teacher');
  });

  it('should not list teacher in allowed roles', () => {
    const isAllowed = isTask032AdminOperatorRole('teacher');
    expect(isAllowed).toBe(false);
  });

  it('should deny teacher from environment preflight', () => {
    expect(isTask032AdminOperatorRole('teacher')).toBe(false);
  });

  it('should deny teacher from consent authorization', () => {
    expect(isTask032AdminOperatorRole('teacher')).toBe(false);
  });

  it('should deny teacher from runtime guard', () => {
    expect(isTask032AdminOperatorRole('teacher')).toBe(false);
  });
});
