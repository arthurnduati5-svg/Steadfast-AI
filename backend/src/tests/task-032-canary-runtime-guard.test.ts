import { describe, it, expect } from 'vitest';
import { runTask032CanaryRuntimeGuard } from '../services/task032CanaryRuntimeGuardService';

describe('Task 032 - Canary Runtime Guard', () => {
  it('should pass with valid schoolId and admin role', async () => {
    const result = await runTask032CanaryRuntimeGuard({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
      activationId: 'act_001',
    });
    expect(result.ok).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
    expect(result.actorRoleValid).toBe(true);
  });

  it('should pass with system_admin role', async () => {
    const result = await runTask032CanaryRuntimeGuard({
      schoolId: 'school_task032_safe',
      actorRole: 'system_admin',
      activationId: 'act_001',
    });
    expect(result.ok).toBe(true);
    expect(result.actorRoleValid).toBe(true);
  });

  it('should pass with internal_operator role', async () => {
    const result = await runTask032CanaryRuntimeGuard({
      schoolId: 'school_task032_safe',
      actorRole: 'internal_operator',
      activationId: 'act_001',
    });
    expect(result.ok).toBe(true);
  });

  it('should pass with authorized_canary_operator role', async () => {
    const result = await runTask032CanaryRuntimeGuard({
      schoolId: 'school_task032_safe',
      actorRole: 'authorized_canary_operator',
      activationId: 'act_001',
    });
    expect(result.ok).toBe(true);
  });

  it('should fail with missing schoolId', async () => {
    const result = await runTask032CanaryRuntimeGuard({
      schoolId: '',
      actorRole: 'school_admin',
      activationId: 'act_001',
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('missing_school_id');
    expect(result.verifiedSchoolContextRequired).toBe(false);
  });

  it('should fail with student role', async () => {
    const result = await runTask032CanaryRuntimeGuard({
      schoolId: 'school_task032_safe',
      actorRole: 'student',
      activationId: 'act_001',
    });
    expect(result.ok).toBe(false);
    expect(result.actorRoleValid).toBe(false);
    expect(result.blockingIssues).toContain('invalid_actor_role_not_admin_operator');
  });

  it('should fail with teacher role', async () => {
    const result = await runTask032CanaryRuntimeGuard({
      schoolId: 'school_task032_safe',
      actorRole: 'teacher',
      activationId: 'act_001',
    });
    expect(result.ok).toBe(false);
    expect(result.actorRoleValid).toBe(false);
  });

  it('should fail with parent role', async () => {
    const result = await runTask032CanaryRuntimeGuard({
      schoolId: 'school_task032_safe',
      actorRole: 'parent',
      activationId: 'act_001',
    });
    expect(result.ok).toBe(false);
    expect(result.actorRoleValid).toBe(false);
  });

  it('should fail with unknown role', async () => {
    const result = await runTask032CanaryRuntimeGuard({
      schoolId: 'school_task032_safe',
      actorRole: 'unknown' as any,
      activationId: 'act_001',
    });
    expect(result.ok).toBe(false);
    expect(result.actorRoleValid).toBe(false);
  });

  it('should fail with anonymous role', async () => {
    const result = await runTask032CanaryRuntimeGuard({
      schoolId: 'school_task032_safe',
      actorRole: 'anonymous' as any,
      activationId: 'act_001',
    });
    expect(result.ok).toBe(false);
    expect(result.actorRoleValid).toBe(false);
  });

  it('should fail with learner role', async () => {
    const result = await runTask032CanaryRuntimeGuard({
      schoolId: 'school_task032_safe',
      actorRole: 'learner' as any,
      activationId: 'act_001',
    });
    expect(result.ok).toBe(false);
  });

  it('should set all required flags when passing', async () => {
    const result = await runTask032CanaryRuntimeGuard({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
      activationId: 'act_001',
    });
    expect(result.verifiedSchoolContextRequired).toBe(true);
    expect(result.adminOperatorActorRequired).toBe(true);
    expect(result.task031ProofRequired).toBe(true);
    expect(result.approvedConfigRequired).toBe(true);
    expect(result.cohortEligibilityRequired).toBe(true);
    expect(result.consentAuthorizationReadinessRequired).toBe(true);
    expect(result.privacyBoundaryRequired).toBe(true);
    expect(result.healthBudgetRequired).toBe(true);
    expect(result.rollbackReadinessRequired).toBe(true);
    expect(result.incidentBridgeRequired).toBe(true);
  });

  it('should set noLive flags to true', async () => {
    const result = await runTask032CanaryRuntimeGuard({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
      activationId: 'act_001',
    });
    expect(result.noLiveAi).toBe(true);
    expect(result.noLiveConnector).toBe(true);
    expect(result.noLiveNotification).toBe(true);
    expect(result.noDeployment).toBe(true);
    expect(result.noRollout).toBe(true);
    expect(result.noObservation).toBe(true);
  });
});
