import { describe, it, expect } from 'vitest';
import {
  isTask032AdminOperatorRole,
  TASK032_ALLOWED_REAL_ACTOR_ROLES,
  TASK032_DENIED_REAL_ACTOR_ROLES
} from '../contracts/task032ControlledCanaryActivationContracts';

describe('Task 032 - Admin Only Routes Contract', () => {
  it('should identify school_admin as admin/operator', () => {
    expect(isTask032AdminOperatorRole('school_admin')).toBe(true);
  });

  it('should identify system_admin as admin/operator', () => {
    expect(isTask032AdminOperatorRole('system_admin')).toBe(true);
  });

  it('should identify internal_operator as admin/operator', () => {
    expect(isTask032AdminOperatorRole('internal_operator')).toBe(true);
  });

  it('should identify authorized_canary_operator as admin/operator', () => {
    expect(isTask032AdminOperatorRole('authorized_canary_operator')).toBe(true);
  });

  it('should identify operations_reviewer as admin/operator', () => {
    expect(isTask032AdminOperatorRole('operations_reviewer')).toBe(true);
  });

  it('should deny student as admin/operator', () => {
    expect(isTask032AdminOperatorRole('student')).toBe(false);
  });

  it('should deny teacher as admin/operator', () => {
    expect(isTask032AdminOperatorRole('teacher')).toBe(false);
  });

  it('should deny parent as admin/operator', () => {
    expect(isTask032AdminOperatorRole('parent')).toBe(false);
  });

  it('should deny peer as admin/operator', () => {
    expect(isTask032AdminOperatorRole('peer')).toBe(false);
  });

  it('should deny anonymous as admin/operator', () => {
    expect(isTask032AdminOperatorRole('anonymous')).toBe(false);
  });

  it('should deny unknown as admin/operator', () => {
    expect(isTask032AdminOperatorRole('unknown')).toBe(false);
  });

  it('should have allowed roles exactly as configured', () => {
    expect(TASK032_ALLOWED_REAL_ACTOR_ROLES).toEqual([
      'school_admin', 'system_admin', 'internal_operator',
      'authorized_canary_operator', 'operations_reviewer'
    ]);
  });

  it('should have denied roles exactly as configured', () => {
    expect(TASK032_DENIED_REAL_ACTOR_ROLES).toEqual([
      'student', 'learner', 'teacher', 'parent', 'peer', 'unknown', 'anonymous'
    ]);
  });

  it('should not include student in allowed roles', () => {
    expect(TASK032_ALLOWED_REAL_ACTOR_ROLES).not.toContain('student');
  });

  it('should not include teacher in allowed roles', () => {
    expect(TASK032_ALLOWED_REAL_ACTOR_ROLES).not.toContain('teacher');
  });
});
