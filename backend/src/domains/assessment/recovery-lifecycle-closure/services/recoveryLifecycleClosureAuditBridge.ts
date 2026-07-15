import { InMemoryRecoveryLifecycleClosureRepositories } from '../repositories/inMemoryRecoveryLifecycleClosureRepositories';
import { v4 as uuid } from 'uuid';

export class RecoveryLifecycleClosureAuditBridge {
  constructor(private repos: InMemoryRecoveryLifecycleClosureRepositories) {}

  async recordAuditEvent(params: {
    schoolId: string;
    actorId: string;
    actorRole: string;
    eventType: string;
    decision: string;
    safeSummary: string;
    reasonCodes?: string[];
    metadata?: Record<string, unknown>;
    requestId?: string;
    correlationId?: string;
    closureReadinessId?: string;
    handoffPacketId?: string;
    nextCycleRecommendationId?: string;
    deferredIntegrationTicketId?: string;
    unresolvedRiskRegisterId?: string;
    teacherClosureReviewPacketId?: string;
    adminGovernanceReviewPacketId?: string;
    studentClosureReflectionDraftId?: string;
    parentClosureGuidanceDraftId?: string;
    archiveManifestId?: string;
    finalLifecycleSummaryId?: string;
  }): Promise<void> {
    const now = new Date().toISOString();
    await this.repos.closureAudit.create({
      closureAuditEventId: uuid(),
      schoolId: params.schoolId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: params.eventType,
      decision: params.decision,
      safeSummary: params.safeSummary,
      reasonCodesJson: params.reasonCodes ? { reasons: params.reasonCodes } : {},
      metadataJson: params.metadata ?? {},
      requestId: params.requestId ?? params.correlationId,
      correlationId: params.correlationId,
      closureReadinessId: params.closureReadinessId,
      handoffPacketId: params.handoffPacketId,
      nextCycleRecommendationId: params.nextCycleRecommendationId,
      deferredIntegrationTicketId: params.deferredIntegrationTicketId,
      unresolvedRiskRegisterId: params.unresolvedRiskRegisterId,
      teacherClosureReviewPacketId: params.teacherClosureReviewPacketId,
      adminGovernanceReviewPacketId: params.adminGovernanceReviewPacketId,
      studentClosureReflectionDraftId: params.studentClosureReflectionDraftId,
      parentClosureGuidanceDraftId: params.parentClosureGuidanceDraftId,
      archiveManifestId: params.archiveManifestId,
      finalLifecycleSummaryId: params.finalLifecycleSummaryId,
      createdAt: now,
    });
  }
}
