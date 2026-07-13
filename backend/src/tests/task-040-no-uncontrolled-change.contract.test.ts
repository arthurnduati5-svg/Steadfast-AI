import { describe, it, expect } from 'vitest';
import {
  TASK040_DENIED_ACTOR_ROLES,
  TASK040_ALLOWED_ACTOR_ROLES,
} from '../contracts/task040BackendFreezeContracts';

describe('Task 040 no uncontrolled change', () => {
  it('denies student from control', () => {
    expect(TASK040_DENIED_ACTOR_ROLES.includes('student')).toBe(true);
  });

  it('denies parent from control', () => {
    expect(TASK040_DENIED_ACTOR_ROLES.includes('parent')).toBe(true);
  });

  it('denies teacher from control', () => {
    expect(TASK040_DENIED_ACTOR_ROLES.includes('teacher')).toBe(true);
  });

  it('allows admin for control', () => {
    expect(TASK040_ALLOWED_ACTOR_ROLES.includes('admin')).toBe(true);
  });

  it('allows internal_operator for control', () => {
    expect(TASK040_ALLOWED_ACTOR_ROLES.includes('internal_operator')).toBe(true);
  });

  it('allows privacy_owner for control', () => {
    expect(TASK040_ALLOWED_ACTOR_ROLES.includes('privacy_owner')).toBe(true);
  });
});
