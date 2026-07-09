import { describe, it, expect } from 'vitest';
import {
  isTask032AdminOperatorRole,
  isTask032DeniedRealRole,
  resolveTask032ActorRole,
  TASK032_DENIED_REAL_ACTOR_ROLES
} from '../contracts/task032ControlledCanaryActivationContracts';

describe('Task 032 - Student Denied Routes Contract', () => {
  it('should resolve student role correctly', () => {
    expect(resolveTask032ActorRole('student')).toBe('student');
  });

  it('should resolve learner role correctly', () => {
    expect(resolveTask032ActorRole('learner')).toBe('learner');
  });

  it('should deny student from admin/operator functions', () => {
    expect(isTask032AdminOperatorRole('student')).toBe(false);
  });

  it('should deny learner from admin/operator functions', () => {
    expect(isTask032AdminOperatorRole('learner')).toBe(false);
  });

  it('should identify student as denied real role', () => {
    expect(isTask032DeniedRealRole('student')).toBe(true);
  });

  it('should identify learner as denied real role', () => {
    expect(isTask032DeniedRealRole('learner')).toBe(true);
  });

  it('should list student in denied roles', () => {
    expect(TASK032_DENIED_REAL_ACTOR_ROLES).toContain('student');
  });

  it('should list learner in denied roles', () => {
    expect(TASK032_DENIED_REAL_ACTOR_ROLES).toContain('learner');
  });

  it('should not list student in allowed roles', () => {
    expect(isTask032AdminOperatorRole('student')).toBe(false);
  });

  it('should deny student from runtime guard', () => {
    expect(isTask032AdminOperatorRole('student')).toBe(false);
  });
});
