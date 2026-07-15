import { RecoveryOutcomeSuppressionRuleRepository } from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { RecoveryOutcomeSuppressionRule, CreateSuppressionRuleRequest, SuppressionRuleStatus } from '../contracts/recoveryOutcomeSuppressionRuleContracts';
import { RecoveryOutcomeActionCommandContext, RecoveryOutcomeActionSafeEnvelope } from '../contracts/recoveryOutcomeActionContracts';
import { RecoveryOutcomeActionSafetyService } from './recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from './recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from './recoveryOutcomeActionIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryOutcomeSuppressionRuleService {
  constructor(
    private repo: RecoveryOutcomeSuppressionRuleRepository,
    private safety: RecoveryOutcomeActionSafetyService,
    private audit: RecoveryOutcomeActionAuditBridge,
    private idempotency: RecoveryOutcomeActionIdempotencyService,
  ) {}

  async createSuppressionRule(ctx: RecoveryOutcomeActionCommandContext, req: CreateSuppressionRuleRequest): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeSuppressionRule>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_SUPPRESSION_RULE_CREATION');
      const { isDuplicate } = await this.idempotency.processIdempotency(ctx, 'createSuppressionRule', req as any);
      if (isDuplicate) return { success: false, status: 'DUPLICATE', message: 'Duplicate', idempotencyKey: ctx.idempotencyKey };
      const now = new Date();
      const record: RecoveryOutcomeSuppressionRule = {
        suppressionRuleId: uuid(), schoolId: req.schoolId, studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId, ruleStatus: 'active',
        safeRuleSummary: req.safeRuleSummary, ruleConditionsJson: req.ruleConditionsJson,
        ruleScopeJson: req.ruleScopeJson, blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {}, createdByActorId: req.createdByActorId, createdByRole: req.createdByRole,
        createdAt: now, updatedAt: now,
      };
      const created = await this.repo.create(record);
      await this.audit.record(ctx, 'SUPPRESSION_RULE_CREATED', 'created', `Rule ${created.suppressionRuleId}`, { suppressionRuleId: created.suppressionRuleId });
      await this.idempotency.markCompleted(ctx, 'RecoveryOutcomeSuppressionRule', created.suppressionRuleId);
      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) { return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey }; }
  }

  async getSuppressionRule(id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeSuppressionRule>> {
    try { const d = await this.repo.getById(id); if (!d) return { success: false, status: 'NOT_FOUND' }; return { success: true, data: d, status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listSuppressionRulesForPlan(schoolId: string, planId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeSuppressionRule[]>> {
    try { return { success: true, data: await this.repo.listByPlanId(schoolId, planId), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listSuppressionRulesByStatus(schoolId: string, status: SuppressionRuleStatus): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeSuppressionRule[]>> {
    try { return { success: true, data: await this.repo.listByStatus(schoolId, status as any), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async activateSuppressionRuleForFutureUse(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeSuppressionRule>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_SUPPRESSION_RULE_CREATION');
      const updated = await this.repo.activateForFutureUse(id);
      await this.audit.record(ctx, 'SUPPRESSION_RULE_ACTIVATED', 'updated', `Rule ${id} activated`, { suppressionRuleId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async suppressSuppressionRule(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeSuppressionRule>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_SUPPRESSION_RULE_CREATION');
      const updated = await this.repo.suppress(id);
      await this.audit.record(ctx, 'SUPPRESSION_RULE_SUPPRESSED', 'updated', `Rule ${id} suppressed`, { suppressionRuleId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async blockSuppressionRule(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeSuppressionRule>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_SUPPRESSION_RULE_CREATION');
      const updated = await this.repo.block(id);
      await this.audit.record(ctx, 'SUPPRESSION_RULE_BLOCKED', 'updated', `Rule ${id} blocked`, { suppressionRuleId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async voidSuppressionRule(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeSuppressionRule>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_SUPPRESSION_RULE_CREATION');
      const updated = await this.repo.void(id);
      await this.audit.record(ctx, 'SUPPRESSION_RULE_VOIDED', 'updated', `Rule ${id} voided`, { suppressionRuleId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }
}
