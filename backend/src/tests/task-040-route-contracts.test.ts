import { describe, it, expect } from 'vitest';
import { TASK040_ALLOWED_ACTOR_ROLES, TASK040_DENIED_ACTOR_ROLES } from '../contracts/task040BackendFreezeContracts';

describe('Task 040 - Route Contracts', () => {
  it('allows admin for all routes', () => {
    expect(TASK040_ALLOWED_ACTOR_ROLES.includes('admin')).toBe(true);
  });

  it('allows internal_operator for all routes', () => {
    expect(TASK040_ALLOWED_ACTOR_ROLES.includes('internal_operator')).toBe(true);
  });

  it('allows privacy_owner for all routes', () => {
    expect(TASK040_ALLOWED_ACTOR_ROLES.includes('privacy_owner')).toBe(true);
  });

  it('denies student for all routes', () => {
    expect(TASK040_DENIED_ACTOR_ROLES.includes('student')).toBe(true);
  });

  it('denies parent for all routes', () => {
    expect(TASK040_DENIED_ACTOR_ROLES.includes('parent')).toBe(true);
  });

  it('denies teacher for all routes', () => {
    expect(TASK040_DENIED_ACTOR_ROLES.includes('teacher')).toBe(true);
  });

  it('denies peer for all routes', () => {
    expect(TASK040_DENIED_ACTOR_ROLES.includes('peer')).toBe(true);
  });

  it('denies learner for all routes', () => {
    expect(TASK040_DENIED_ACTOR_ROLES.includes('learner')).toBe(true);
  });
});
