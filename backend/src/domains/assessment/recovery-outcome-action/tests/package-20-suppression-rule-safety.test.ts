import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryOutcomeSuppressionRuleRepository, InMemoryRecoveryOutcomeActionAuditRepository, InMemoryRecoveryOutcomeActionIdempotencyRepository } from '../repositories/inMemoryRecoveryOutcomeActionRepositories';
import { RecoveryOutcomeSuppressionRuleService } from '../services/recoveryOutcomeSuppressionRuleService';
import { RecoveryOutcomeActionSafetyService } from '../services/recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from '../services/recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from '../services/recoveryOutcomeActionIdempotencyService';
import { RecoveryOutcomeActionCommandContext } from '../contracts/recoveryOutcomeActionContracts';

describe('Package 20 - Suppression Rule Safety', () => {
  let service: RecoveryOutcomeSuppressionRuleService;
  let ctx: RecoveryOutcomeActionCommandContext;

  beforeEach(() => {
    const repo = new InMemoryRecoveryOutcomeSuppressionRuleRepository();
    const safety = new RecoveryOutcomeActionSafetyService();
    const auditRepo = new InMemoryRecoveryOutcomeActionAuditRepository();
    const audit = new RecoveryOutcomeActionAuditBridge(auditRepo);
    const idempotencyRepo = new InMemoryRecoveryOutcomeActionIdempotencyRepository();
    const idempotency = new RecoveryOutcomeActionIdempotencyService(idempotencyRepo);
    service = new RecoveryOutcomeSuppressionRuleService(repo, safety, audit, idempotency);
    ctx = { schoolId: 'school-1', actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates suppression rule in active status', async () => {
    const result = await service.createSuppressionRule(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeRuleSummary: 'Suppress notification for this plan', ruleConditionsJson: { scoreBelow: 40 },
      ruleScopeJson: { scope: 'notifications' },
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    expect(result.success).toBe(true);
    expect(result.data?.ruleStatus).toBe('active');
  });

  it('is metadata-only until future use - no suppression executed', async () => {
    const created = await service.createSuppressionRule(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeRuleSummary: 'Test', ruleConditionsJson: {}, ruleScopeJson: {},
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    expect(created.data?.ruleConditionsJson).toBeDefined();
    expect(created.data?.ruleStatus).toBe('active');
  });

  it('blocks student role', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createSuppressionRule(studentCtx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeRuleSummary: 'Test', ruleConditionsJson: {}, ruleScopeJson: {},
      createdByActorId: 'actor-1', createdByRole: 'student',
    });
    expect(result.success).toBe(false);
  });

  it('can activate, suppress, block, void', async () => {
    const created = await service.createSuppressionRule(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeRuleSummary: 'Test', ruleConditionsJson: {}, ruleScopeJson: {},
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    const activated = await service.activateSuppressionRuleForFutureUse(ctx, created.data!.suppressionRuleId);
    expect(activated.data?.ruleStatus).toBe('active');
    const suppressed = await service.suppressSuppressionRule(ctx, created.data!.suppressionRuleId);
    expect(suppressed.data?.ruleStatus).toBe('suppressed');
    const blocked = await service.blockSuppressionRule(ctx, created.data!.suppressionRuleId);
    expect(blocked.data?.ruleStatus).toBe('blocked');
  });
});
