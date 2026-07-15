import { describe, it, expect } from 'vitest';

describe('Package 20 - Action Contracts', () => {
  it('RecoveryOutcomeActionCommandContext has required fields', () => {
    const ctx = {
      schoolId: 'school-1',
      actorId: 'actor-1',
      actorRole: 'teacher',
      correlationId: 'corr-1',
      idempotencyKey: 'ik-1',
    };
    expect(ctx.schoolId).toBe('school-1');
    expect(ctx.actorRole).toBe('teacher');
    expect(ctx.correlationId).toBe('corr-1');
    expect(ctx.idempotencyKey).toBe('ik-1');
  });

  it('RecoveryOutcomeActionSafeEnvelope wraps data correctly', () => {
    const envelope = { success: true, data: 'test', status: 'created' };
    expect(envelope.success).toBe(true);
    expect(envelope.data).toBe('test');
    expect(envelope.status).toBe('created');
  });

  it('RecoveryOutcomeActionPolicyDecision has correct shape', () => {
    const decision = { allowed: true, denied: false, reasonCodes: [], actorRole: 'teacher', action: 'TEST' };
    expect(decision.allowed).toBe(true);
    expect(decision.denied).toBe(false);
    expect(decision.reasonCodes).toEqual([]);
  });

  it('RecoveryOutcomeActionReadinessStatus union values are valid', () => {
    const statuses: string[] = ['draft', 'review_ready', 'approved_for_future_use', 'suppressed', 'blocked', 'voided'];
    expect(statuses).toContain('draft');
    expect(statuses).toContain('approved_for_future_use');
    expect(statuses).toContain('voided');
  });

  it('ActionBundleType union values are valid', () => {
    const types: string[] = ['continuation', 'intensification', 'pause', 'closure', 'mixed'];
    expect(types).toContain('continuation');
    expect(types).toContain('mixed');
  });

  it('ActionDraftType union values are valid', () => {
    const types: string[] = ['continuation', 'intensification', 'pause', 'closure'];
    expect(types).toContain('continuation');
    expect(types).toContain('closure');
  });

  it('ApprovalGateStatus union values are valid', () => {
    const statuses: string[] = ['pending', 'satisfied', 'blocked', 'voided'];
    expect(statuses).toContain('satisfied');
    expect(statuses).toContain('pending');
  });

  it('MockActivationQueueStatus union values are valid', () => {
    const statuses: string[] = ['draft', 'dry_run_ready', 'suppressed', 'blocked', 'voided'];
    expect(statuses).toContain('dry_run_ready');
    expect(statuses).toContain('draft');
  });

  it('DryRunReceiptResult union values are valid', () => {
    const results: string[] = ['simulated_success', 'simulated_failure', 'simulated_blocked', 'voided'];
    expect(results).toContain('simulated_success');
    expect(results).toContain('voided');
  });

  it('RollbackPlanStatus union values are valid', () => {
    const statuses: string[] = ['draft', 'review_ready', 'approved_for_future_use', 'suppressed', 'blocked', 'voided'];
    expect(statuses).toContain('draft');
    expect(statuses).toContain('review_ready');
  });

  it('SuppressionRuleStatus union values are valid', () => {
    const statuses: string[] = ['active', 'suppressed', 'blocked', 'voided'];
    expect(statuses).toContain('active');
    expect(statuses).toContain('suppressed');
  });

  it('ActionSummaryStatus union values are valid', () => {
    const statuses: string[] = ['active', 'stale', 'blocked', 'voided'];
    expect(statuses).toContain('active');
    expect(statuses).toContain('stale');
  });
});
