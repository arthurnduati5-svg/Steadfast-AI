import { describe, it, expect } from 'vitest';
import {
  TASK034_ALLOWED_ACTOR_ROLES,
  isTask034AdminOperatorRole,
  isTask034DeniedRole,
} from '../contracts/task034ControlledLimitedRolloutContracts';

describe('task034 admin only routes', () => {
  it('allows school_admin', () => {
    expect(isTask034AdminOperatorRole('school_admin')).toBe(true);
  });

  it('allows system_admin', () => {
    expect(isTask034AdminOperatorRole('system_admin')).toBe(true);
  });

  it('allows internal_operator', () => {
    expect(isTask034AdminOperatorRole('internal_operator')).toBe(true);
  });

  it('allows authorized_rollout_operator', () => {
    expect(isTask034AdminOperatorRole('authorized_rollout_operator')).toBe(true);
  });

  it('allows operations_reviewer', () => {
    expect(isTask034AdminOperatorRole('operations_reviewer')).toBe(true);
  });

  it('denies teacher via isTask034AdminOperatorRole', () => {
    expect(isTask034AdminOperatorRole('teacher')).toBe(false);
  });

  it('denies student via isTask034AdminOperatorRole', () => {
    expect(isTask034AdminOperatorRole('student')).toBe(false);
  });

  it('denies unknown via isTask034AdminOperatorRole', () => {
    expect(isTask034AdminOperatorRole('unknown')).toBe(false);
  });

  it('contains exactly 5 allowed roles', () => {
    expect(TASK034_ALLOWED_ACTOR_ROLES).toHaveLength(5);
  });

  it('includes school_admin in allowed roles', () => {
    expect(TASK034_ALLOWED_ACTOR_ROLES).toContain('school_admin');
  });

  it('does not include teacher in allowed roles', () => {
    expect(TASK034_ALLOWED_ACTOR_ROLES).not.toContain('teacher');
  });

  it('does not include student in allowed roles', () => {
    expect(TASK034_ALLOWED_ACTOR_ROLES).not.toContain('student');
  });
});
