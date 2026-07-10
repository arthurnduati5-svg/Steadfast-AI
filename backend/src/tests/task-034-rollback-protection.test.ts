import { describe, it, expect } from 'vitest';
import { evaluateTask034RollbackProtection } from '../services/task034RollbackProtectionService';

describe('Task034 Rollback Protection', () => {
  it('All protections available by default', () => {
    const result = evaluateTask034RollbackProtection();
    expect(result.ok).toBe(true);
    expect(result.rollbackAvailable).toBe(true);
    expect(result.pauseAvailable).toBe(true);
    expect(result.killSwitchAvailable).toBe(true);
    expect(result.rollbackOwnerAssigned).toBe(true);
    expect(result.rollbackPlanValid).toBe(true);
    expect(result.pausePlanValid).toBe(true);
    expect(result.killSwitchPlanValid).toBe(true);
    expect(result.safeAuditPreservedOnRollback).toBe(true);
    expect(result.limitedRolloutCanStopWithoutSchoolWideSideEffect).toBe(true);
  });

  it('rollbackAvailable false blocks', () => {
    const result = evaluateTask034RollbackProtection({ rollbackAvailable: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('rollback_not_available');
  });

  it('pauseAvailable false blocks', () => {
    const result = evaluateTask034RollbackProtection({ pauseAvailable: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('pause_not_available');
  });

  it('killSwitchAvailable false blocks', () => {
    const result = evaluateTask034RollbackProtection({ killSwitchAvailable: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('kill_switch_not_available');
  });

  it('rollbackOwnerAssigned false blocks', () => {
    const result = evaluateTask034RollbackProtection({ rollbackOwnerAssigned: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('rollback_owner_not_assigned');
  });

  it('rollbackPlanValid false blocks', () => {
    const result = evaluateTask034RollbackProtection({ rollbackPlanValid: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('rollback_plan_not_valid');
  });

  it('pausePlanValid false blocks', () => {
    const result = evaluateTask034RollbackProtection({ pausePlanValid: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('pause_plan_not_valid');
  });

  it('killSwitchPlanValid false blocks', () => {
    const result = evaluateTask034RollbackProtection({ killSwitchPlanValid: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('kill_switch_plan_not_valid');
  });

  it('safeAuditPreservedOnRollback false blocks', () => {
    const result = evaluateTask034RollbackProtection({ safeAuditPreservedOnRollback: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('safe_audit_not_preserved_on_rollback');
  });

  it('limitedRolloutCanStopWithoutSchoolWideSideEffect false blocks', () => {
    const result = evaluateTask034RollbackProtection({ limitedRolloutCanStopWithoutSchoolWideSideEffect: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('limited_rollout_cannot_stop_without_school_wide_side_effect');
  });

  it('Combined overrides aggregate blocking issues', () => {
    const result = evaluateTask034RollbackProtection({ rollbackAvailable: false, pauseAvailable: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('rollback_not_available');
    expect(result.blockingIssues).toContain('pause_not_available');
  });

  it('Partial override preserves other defaults', () => {
    const result = evaluateTask034RollbackProtection({ rollbackAvailable: false });
    expect(result.pauseAvailable).toBe(true);
    expect(result.killSwitchAvailable).toBe(true);
  });

  it('All false has 9 blocking issues', () => {
    const result = evaluateTask034RollbackProtection({
      rollbackAvailable: false, pauseAvailable: false, killSwitchAvailable: false,
      rollbackOwnerAssigned: false, rollbackPlanValid: false, pausePlanValid: false,
      killSwitchPlanValid: false, safeAuditPreservedOnRollback: false,
      limitedRolloutCanStopWithoutSchoolWideSideEffect: false,
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues.length).toBeGreaterThanOrEqual(9);
  });
});
