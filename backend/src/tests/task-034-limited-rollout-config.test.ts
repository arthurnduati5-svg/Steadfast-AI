import { describe, it, expect, beforeEach } from 'vitest';
import { validateTask034LimitedRolloutConfig } from '../services/task034LimitedRolloutConfigService';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

function validConfig() {
  return {
    rolloutPercent: 20,
    expandedCohortId: 'cohort_limited_001',
    schoolId: 'school_limited_001',
    tenantId: 'tenant_limited_001',
    activationId: 'activation_limited_001',
    task033ObservationSessionId: 'obs_session_001',
    rollbackPlanId: 'rollback_plan_001',
    pausePlanId: 'pause_plan_001',
    killSwitchId: 'kill_switch_001',
    staffReadinessRequired: true,
    learnerNoticeRequired: true,
    healthBudgetRequired: true,
    privacyReviewRequired: true,
    contentGovernanceReviewRequired: true,
    socraticIntegrityReviewRequired: true,
    deenBoundaryReviewRequired: true,
  };
}

describe('Task034 Limited Rollout Config', () => {
  beforeEach(async () => {
    await task034Repository.clearTask034StoresForTests();
  });

  it('Valid config passes with correct rolloutPercent and all required fields', () => {
    const result = validateTask034LimitedRolloutConfig(validConfig());
    expect(result.ok).toBe(true);
    expect(result.rolloutPercent).toBe(20);
    expect(result.maxRolloutPercent).toBe(25);
  });

  it('rolloutPercent > 25 blocks', () => {
    const input = validConfig();
    input.rolloutPercent = 50;
    const result = validateTask034LimitedRolloutConfig(input);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues.some(i => i.includes('rollout_percent_invalid'))).toBe(true);
  });

  it('rolloutPercent === 100 blocks specifically', () => {
    const input = validConfig();
    input.rolloutPercent = 100;
    const result = validateTask034LimitedRolloutConfig(input);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('rollout_percent_is_100');
  });

  it('missing expandedCohortId blocks', () => {
    const input = validConfig();
    input.expandedCohortId = '';
    const result = validateTask034LimitedRolloutConfig(input);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues.some(i => i.includes('expandedCohortId'))).toBe(true);
  });

  it('missing schoolId blocks', () => {
    const input = validConfig();
    input.schoolId = '';
    const result = validateTask034LimitedRolloutConfig(input);
    expect(result.ok).toBe(false);
  });

  it('missing tenantId blocks', () => {
    const input = validConfig();
    input.tenantId = '';
    const result = validateTask034LimitedRolloutConfig(input);
    expect(result.ok).toBe(false);
  });

  it('missing activationId blocks', () => {
    const input = validConfig();
    input.activationId = '';
    const result = validateTask034LimitedRolloutConfig(input);
    expect(result.ok).toBe(false);
  });

  it('missing rollbackPlanId blocks', () => {
    const input = validConfig();
    input.rollbackPlanId = '';
    const result = validateTask034LimitedRolloutConfig(input);
    expect(result.ok).toBe(false);
  });

  it('missing pausePlanId blocks', () => {
    const input = validConfig();
    input.pausePlanId = '';
    const result = validateTask034LimitedRolloutConfig(input);
    expect(result.ok).toBe(false);
  });

  it('missing killSwitchId blocks', () => {
    const input = validConfig();
    input.killSwitchId = '';
    const result = validateTask034LimitedRolloutConfig(input);
    expect(result.ok).toBe(false);
  });

  it('staffReadinessRequired false blocks', () => {
    const input = validConfig();
    input.staffReadinessRequired = false;
    const result = validateTask034LimitedRolloutConfig(input);
    expect(result.staffReadinessRequired).toBe(false);
  });

  it('stores result in repository', async () => {
    validateTask034LimitedRolloutConfig(validConfig());
    const stored = await task034Repository.getLimitedRolloutConfig();
    expect(stored).not.toBeNull();
    expect(stored!.rolloutPercent).toBe(20);
  });

  it('rolloutPercent of 0 blocks', () => {
    const input = validConfig();
    input.rolloutPercent = 0;
    const result = validateTask034LimitedRolloutConfig(input);
    expect(result.ok).toBe(false);
  });

  it('returns maxRolloutPercent as 25', () => {
    const result = validateTask034LimitedRolloutConfig(validConfig());
    expect(result.maxRolloutPercent).toBe(25);
  });
});
