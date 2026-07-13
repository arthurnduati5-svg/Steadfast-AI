import { describe, it, expect } from 'vitest';
import { buildChangeControlPolicy } from '../services/task040ChangeControlPolicyService';

describe('Task 040 - Change Control Policy', () => {
  it('builds policy with correct name', () => {
    const policy = buildChangeControlPolicy();
    expect(policy.policyName).toBe('Task 040 Backend Change Control Policy');
  });

  it('sets backendFrozen to true', () => {
    const policy = buildChangeControlPolicy();
    expect(policy.backendFrozen).toBe(true);
  });

  it('has at least 10 rules', () => {
    const policy = buildChangeControlPolicy();
    expect(policy.rules.length).toBeGreaterThanOrEqual(10);
  });

  it('has required rules', () => {
    const policy = buildChangeControlPolicy();
    const ruleNames = policy.rules.map(r => r.ruleName);
    expect(ruleNames).toContain('no_unapproved_backend_change');
    expect(ruleNames).toContain('no_silent_drift');
    expect(ruleNames).toContain('no_production_deployment_by_freeze');
    expect(ruleNames).toContain('no_live_expansion_by_freeze');
  });

  it('all rules are required', () => {
    const policy = buildChangeControlPolicy();
    for (const rule of policy.rules) {
      expect(rule.required).toBe(true);
    }
  });

  it('has a non-empty statement', () => {
    const policy = buildChangeControlPolicy();
    expect(policy.statement.length).toBeGreaterThan(50);
  });

  it('has a valid createdAt timestamp', () => {
    const policy = buildChangeControlPolicy();
    expect(() => new Date(policy.createdAt)).not.toThrow();
  });
});
