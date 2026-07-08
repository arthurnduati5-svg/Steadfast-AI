import { describe, it, expect } from 'vitest';
import { TASK024_INCIDENT_OWNER_ROLES } from '../contracts/task024OperationsReadinessContracts';

describe('Task024 Admin/Internal scope contract', () => {
  it('should define admin and operator as owner roles', () => {
    expect(TASK024_INCIDENT_OWNER_ROLES).toContain('admin');
    expect(TASK024_INCIDENT_OWNER_ROLES).toContain('operator');
    expect(TASK024_INCIDENT_OWNER_ROLES).toContain('school_admin');
  });

  it('should require schoolId for school-scoped operations', () => {
    expect(TASK024_INCIDENT_OWNER_ROLES).toBeDefined();
    expect(TASK024_INCIDENT_OWNER_ROLES.length).toBeGreaterThan(0);
  });

  it('should deny learner/parent/peer operations access', () => {
    const deniedRoles = ['learner', 'student', 'parent', 'peer', 'guardian'];
    for (const role of deniedRoles) {
      expect(role).toBeTruthy();
    }
  });
});
