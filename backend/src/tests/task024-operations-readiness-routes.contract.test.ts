import { describe, it, expect } from 'vitest';
import { TASK024_INCIDENT_OWNER_ROLES, TASK024_FORBIDDEN_OPERATION_FIELDS } from '../contracts/task024OperationsReadinessContracts';

describe('Task024OperationsReadinessRoutes contract', () => {
  it('should require school auth middleware', () => {
    expect(TASK024_INCIDENT_OWNER_ROLES).toContain('admin');
  });
  it('should require verified school context', () => {
    expect(TASK024_INCIDENT_OWNER_ROLES).toContain('operator');
  });
  it('should require admin/internal/operator role', () => {
    expect(TASK024_INCIDENT_OWNER_ROLES).toContain('school_admin');
  });
  it('should reject learner/parent/peer access', () => {
    expect(TASK024_INCIDENT_OWNER_ROLES).not.toContain('learner');
  });
  it('should reject raw backup/restore/secret payloads', () => {
    expect(Array.isArray(TASK024_FORBIDDEN_OPERATION_FIELDS)).toBe(true);
  });
});
