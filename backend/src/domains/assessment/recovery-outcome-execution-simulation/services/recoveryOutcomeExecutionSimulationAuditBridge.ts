import { ISimulationAuditRepository, RecoveryOutcomeExecutionSimulationAuditRecord } from '../contracts/recoveryOutcomeExecutionSimulationRepositoryContracts';
import { RecoveryOutcomeExecutionSimulationCommandContext } from '../contracts/recoveryOutcomeExecutionSimulationContracts';

export class RecoveryOutcomeExecutionSimulationAuditBridge {
  constructor(private auditRepo: ISimulationAuditRepository) {}

  async recordSimulationEvent(
    ctx: RecoveryOutcomeExecutionSimulationCommandContext,
    eventType: string,
    decision: string,
    safeSummary: string,
    entityRefs?: Record<string, string | undefined>,
    reasonCodes?: string[],
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const event: Partial<RecoveryOutcomeExecutionSimulationAuditRecord> = {
      simulationAuditEventId: '',
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
      createdAt: new Date().toISOString(),
      ...(entityRefs?.simulationReadinessId ? { simulationReadinessId: entityRefs.simulationReadinessId } : {}),
      ...(entityRefs?.simulationPlanId ? { simulationPlanId: entityRefs.simulationPlanId } : {}),
      ...(entityRefs?.simulationRunId ? { simulationRunId: entityRefs.simulationRunId } : {}),
      ...(entityRefs?.eligibilityCheckId ? { eligibilityCheckId: entityRefs.eligibilityCheckId } : {}),
      ...(entityRefs?.blockedActionDiagnosticId ? { blockedActionDiagnosticId: entityRefs.blockedActionDiagnosticId } : {}),
      ...(entityRefs?.failureInjectionId ? { failureInjectionId: entityRefs.failureInjectionId } : {}),
      ...(entityRefs?.simulationResultId ? { simulationResultId: entityRefs.simulationResultId } : {}),
      ...(entityRefs?.teacherSimulationReviewId ? { teacherSimulationReviewId: entityRefs.teacherSimulationReviewId } : {}),
      ...(entityRefs?.studentPreviewDraftId ? { studentPreviewDraftId: entityRefs.studentPreviewDraftId } : {}),
      ...(entityRefs?.parentPreviewDraftId ? { parentPreviewDraftId: entityRefs.parentPreviewDraftId } : {}),
      ...(entityRefs?.readinessVerdictId ? { readinessVerdictId: entityRefs.readinessVerdictId } : {}),
      ...(entityRefs?.simulationSummaryId ? { simulationSummaryId: entityRefs.simulationSummaryId } : {}),
    };
    await this.auditRepo.create(event);
  }
}
