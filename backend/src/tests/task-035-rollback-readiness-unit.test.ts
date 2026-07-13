import { describe, it, expect } from 'vitest';
import { evaluateFullSchoolRollbackReadiness } from '../services/task035FullSchoolRollbackReadinessService';

describe('task035FullSchoolRollbackReadiness', () => {
  it('should pass when all rollback readiness items are in place', () => {
    const result = evaluateFullSchoolRollbackReadiness();
    expect(result.ok).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('should have rollback plan and owners assigned', () => {
    const result = evaluateFullSchoolRollbackReadiness();
    expect(result.rollbackPlanExists).toBe(true);
    expect(result.rollbackOwnerAssigned).toBe(true);
    expect(result.killSwitchOwnerAssigned).toBe(true);
  });

  it('should have pause, kill switch, and rollback blocking runtime available', () => {
    const result = evaluateFullSchoolRollbackReadiness();
    expect(result.pauseAvailable).toBe(true);
    expect(result.killSwitchAvailable).toBe(true);
    expect(result.rollbackBlocksRuntime).toBe(true);
  });

  it('should preserve audit and avoid destructive learning evidence deletion during rollback', () => {
    const result = evaluateFullSchoolRollbackReadiness();
    expect(result.rollbackPreservesAudit).toBe(true);
    expect(result.rollbackAvoidsDestructiveLearningEvidenceDeletion).toBe(true);
  });

  it('should have student safe unavailable message and teacher admin notification ready', () => {
    const result = evaluateFullSchoolRollbackReadiness();
    expect(result.studentSafeUnavailableMessageReady).toBe(true);
    expect(result.teacherAdminNotificationReady).toBe(true);
  });
});
