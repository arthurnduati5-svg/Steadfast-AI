import { RecoveryOutcomeActionAuditRepository, RecoveryOutcomeActionAuditEvent } from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { RecoveryOutcomeActionCommandContext } from '../contracts/recoveryOutcomeActionContracts';

export class RecoveryOutcomeActionAuditBridge {
  constructor(private auditRepo: RecoveryOutcomeActionAuditRepository) {}

  async record(
    ctx: RecoveryOutcomeActionCommandContext,
    eventType: string,
    decision: string,
    safeSummary: string,
    resourceRefs?: Record<string, string | undefined>,
    reasonCodes?: string[],
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const event: RecoveryOutcomeActionAuditEvent = {
      auditEventId: '',
      schoolId: ctx.schoolId,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType,
      decision,
      safeSummary,
      reasonCodesJson: reasonCodes ? { reasons: reasonCodes } : {},
      metadataJson: metadata ?? {},
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
      createdAt: new Date(),
      ...(resourceRefs?.actionReadinessId ? { actionReadinessId: resourceRefs.actionReadinessId } : {}),
      ...(resourceRefs?.actionBundleId ? { actionBundleId: resourceRefs.actionBundleId } : {}),
      ...(resourceRefs?.continuationActionDraftId ? { continuationActionDraftId: resourceRefs.continuationActionDraftId } : {}),
      ...(resourceRefs?.intensificationActionDraftId ? { intensificationActionDraftId: resourceRefs.intensificationActionDraftId } : {}),
      ...(resourceRefs?.pauseActionDraftId ? { pauseActionDraftId: resourceRefs.pauseActionDraftId } : {}),
      ...(resourceRefs?.closureActionDraftId ? { closureActionDraftId: resourceRefs.closureActionDraftId } : {}),
      ...(resourceRefs?.approvalGateId ? { approvalGateId: resourceRefs.approvalGateId } : {}),
      ...(resourceRefs?.mockActivationQueueItemId ? { mockActivationQueueItemId: resourceRefs.mockActivationQueueItemId } : {}),
      ...(resourceRefs?.dryRunReceiptId ? { dryRunReceiptId: resourceRefs.dryRunReceiptId } : {}),
      ...(resourceRefs?.rollbackPlanId ? { rollbackPlanId: resourceRefs.rollbackPlanId } : {}),
      ...(resourceRefs?.suppressionRuleId ? { suppressionRuleId: resourceRefs.suppressionRuleId } : {}),
      ...(resourceRefs?.actionSummaryId ? { actionSummaryId: resourceRefs.actionSummaryId } : {}),
    };
    await this.auditRepo.create(event);
  }
}
