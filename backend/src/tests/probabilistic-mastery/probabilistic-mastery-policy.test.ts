import { describe, it, expect } from 'vitest';
import { validatePolicy, createFixturePolicy, FIXTURE_POLICY_VERSION, FIXTURE_STRATEGY_ID } from '../../services/probabilisticMasteryPolicy';
import type { MasteryPolicyConfig } from '../../services/probabilisticMasteryContracts';

describe('ProbabilisticMasteryPolicy', () => {
  it('validates valid fixture policy', () => {
    const policy = createFixturePolicy();
    expect(() => validatePolicy(policy)).not.toThrow();
  });

  it('rejects missing policy version', () => {
    expect(() => validatePolicy({} as MasteryPolicyConfig)).toThrow();
  });

  it('rejects missing strategy id', () => {
    expect(() => validatePolicy({ policyVersion: 'v1' } as MasteryPolicyConfig)).toThrow();
  });

  it('rejects NaN source weight', () => {
    const policy = createFixturePolicy();
    policy.sourceWeights.tutor_attempt = NaN;
    expect(() => validatePolicy(policy)).toThrow('not finite');
  });

  it('rejects negative minimum evidence count', () => {
    const policy = createFixturePolicy();
    policy.minimumUsableEvidenceCount = -1;
    expect(() => validatePolicy(policy)).toThrow('non-negative integer');
  });

  it('rejects non-integer minimum evidence count', () => {
    const policy = createFixturePolicy();
    policy.minimumUsableEvidenceCount = 1.5;
    expect(() => validatePolicy(policy)).toThrow('non-negative integer');
  });

  it('rejects non-finite markingConfidenceAdjustment', () => {
    const policy = createFixturePolicy();
    policy.markingConfidenceAdjustment = Infinity;
    expect(() => validatePolicy(policy)).toThrow('must be finite');
  });

  it('rejects non-finite integrityRiskPenalty', () => {
    const policy = createFixturePolicy();
    policy.integrityRiskPenalty = Infinity;
    expect(() => validatePolicy(policy)).toThrow('must be finite');
  });

  it('rejects thresholds not monotonic', () => {
    const policy = createFixturePolicy();
    policy.labelThresholds.introduced = 0.9;
    policy.labelThresholds.attempted = 0.1;
    expect(() => validatePolicy(policy)).toThrow('not monotonic');
  });

  it('rejects mastered threshold below near_mastery', () => {
    const policy = createFixturePolicy();
    policy.labelThresholds.mastered = 0.3;
    policy.labelThresholds.near_mastery = 0.7;
    expect(() => validatePolicy(policy)).toThrow('mastered threshold cannot be below near_mastery');
  });

  it('rejects integrity risk penalty that increases weight', () => {
    const policy = createFixturePolicy();
    policy.integrityRiskPenalty = 0.5;
    expect(() => validatePolicy(policy)).toThrow('must not increase');
  });

  it('rejects hint dependency penalty that increases independence', () => {
    const policy = createFixturePolicy();
    policy.hintDependencyPenalty = 0.5;
    expect(() => validatePolicy(policy)).toThrow('must not increase');
  });

  it('fixture policy has correct version', () => {
    const policy = createFixturePolicy();
    expect(policy.policyVersion).toBe(FIXTURE_POLICY_VERSION);
    expect(policy.strategyId).toBe(FIXTURE_STRATEGY_ID);
  });

  it('fixture policy has monotonic label thresholds', () => {
    const policy = createFixturePolicy();
    const labels = ['not_started', 'introduced', 'attempted', 'developing', 'near_mastery', 'mastered'] as const;
    for (let i = 1; i < labels.length; i++) {
      expect(policy.labelThresholds[labels[i]]).toBeGreaterThanOrEqual(policy.labelThresholds[labels[i - 1]]);
    }
  });

  it('fixture policy has 3 minimum usable evidence count', () => {
    const policy = createFixturePolicy();
    expect(policy.minimumUsableEvidenceCount).toBe(3);
  });

  it('exported constants are correct', () => {
    expect(FIXTURE_POLICY_VERSION).toBe('fixture-policy-v1');
    expect(FIXTURE_STRATEGY_ID).toBe('evidence-weighted-strategy');
  });
});
