import type { ResultGovernanceAuditRepository } from '../contracts/resultGovernanceRepositoryContracts';
import type { ResultGovernanceAuditEvent } from '../contracts/resultGovernanceRepositoryContracts';

export class ResultGovernanceAuditBridge {
  constructor(private auditRepo: ResultGovernanceAuditRepository) {}

  async recordFinalizationReviewCreated(params: {
    schoolId: string;
    resultFinalizationReviewId: string;
    actorId: string;
    actorRole: string;
    correlationId?: string;
    requestId?: string;
  }): Promise<void> {
    await this.auditRepo.create({
      schoolId: params.schoolId,
      resultFinalizationReviewId: params.resultFinalizationReviewId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: 'finalization_review_created',
      decision: 'created',
      safeSummary: 'Finalization review created',
      requestId: params.requestId,
      correlationId: params.correlationId,
    });
  }

  async recordFinalizationReadinessChecked(params: {
    schoolId: string;
    resultFinalizationReviewId: string;
    actorId: string;
    actorRole: string;
    allPassed: boolean;
    blockingReasonCodes: string[];
  }): Promise<void> {
    await this.auditRepo.create({
      schoolId: params.schoolId,
      resultFinalizationReviewId: params.resultFinalizationReviewId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: 'finalization_readiness_checked',
      decision: params.allPassed ? 'passed' : 'blocked',
      safeSummary: params.allPassed ? 'Readiness checks passed' : `Readiness checks blocked: ${params.blockingReasonCodes.join(', ')}`,
      reasonCodesJson: { blockingReasonCodes: params.blockingReasonCodes },
    });
  }

  async recordFinalizationDecisionCreated(params: {
    schoolId: string;
    resultFinalizationDecisionId: string;
    resultFinalizationReviewId: string;
    actorId: string;
    actorRole: string;
    decisionStatus: string;
  }): Promise<void> {
    await this.auditRepo.create({
      schoolId: params.schoolId,
      resultFinalizationDecisionId: params.resultFinalizationDecisionId,
      resultFinalizationReviewId: params.resultFinalizationReviewId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: 'finalization_decision_created',
      decision: params.decisionStatus,
      safeSummary: `Finalization decision created with status: ${params.decisionStatus}`,
    });
  }

  async recordFinalizationBlocked(params: {
    schoolId: string;
    resultFinalizationReviewId: string;
    actorId: string;
    actorRole: string;
    reasonCode: string;
  }): Promise<void> {
    await this.auditRepo.create({
      schoolId: params.schoolId,
      resultFinalizationReviewId: params.resultFinalizationReviewId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: 'finalization_blocked',
      decision: 'blocked',
      safeSummary: `Finalization blocked: ${params.reasonCode}`,
      reasonCodesJson: { reasonCode: params.reasonCode },
    });
  }

  async recordReleaseReadinessCreated(params: {
    schoolId: string;
    resultReleaseReadinessId: string;
    resultFinalizationDecisionId: string;
    actorId: string;
    actorRole: string;
  }): Promise<void> {
    await this.auditRepo.create({
      schoolId: params.schoolId,
      resultReleaseReadinessId: params.resultReleaseReadinessId,
      resultFinalizationDecisionId: params.resultFinalizationDecisionId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: 'release_readiness_created',
      decision: 'created',
      safeSummary: 'Release readiness record created',
    });
  }

  async recordReleaseBoundaryCreated(params: {
    schoolId: string;
    resultReleaseBoundaryId: string;
    resultReleaseReadinessId: string;
    actorId: string;
    actorRole: string;
  }): Promise<void> {
    await this.auditRepo.create({
      schoolId: params.schoolId,
      resultReleaseBoundaryId: params.resultReleaseBoundaryId,
      resultReleaseReadinessId: params.resultReleaseReadinessId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: 'release_boundary_created',
      decision: 'created',
      safeSummary: 'Release boundary created',
    });
  }

  async recordRegradeRequestCreated(params: {
    schoolId: string;
    resultRegradeRequestId: string;
    resultFinalizationDecisionId?: string;
    actorId: string;
    actorRole: string;
  }): Promise<void> {
    await this.auditRepo.create({
      schoolId: params.schoolId,
      resultRegradeRequestId: params.resultRegradeRequestId,
      resultFinalizationDecisionId: params.resultFinalizationDecisionId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: 'regrade_request_created',
      decision: 'submitted',
      safeSummary: 'Regrade request created',
    });
  }

  async recordRegradeIntakeCreated(params: {
    schoolId: string;
    resultRegradeIntakeId: string;
    resultRegradeRequestId: string;
    actorId: string;
    actorRole: string;
  }): Promise<void> {
    await this.auditRepo.create({
      schoolId: params.schoolId,
      resultRegradeIntakeId: params.resultRegradeIntakeId,
      resultRegradeRequestId: params.resultRegradeRequestId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: 'regrade_intake_created',
      decision: 'received',
      safeSummary: 'Regrade intake created',
    });
  }

  async recordPolicyBlocked(params: {
    schoolId: string;
    actorId: string;
    actorRole: string;
    policyFamily: string;
    reasonCode: string;
  }): Promise<void> {
    await this.auditRepo.create({
      schoolId: params.schoolId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: 'policy_blocked',
      decision: 'blocked',
      safeSummary: `Policy blocked: ${params.policyFamily} - ${params.reasonCode}`,
      reasonCodesJson: { policyFamily: params.policyFamily, reasonCode: params.reasonCode },
    });
  }

  async recordSafeError(params: {
    schoolId: string;
    actorId: string;
    actorRole: string;
    eventType: string;
    safeSummary: string;
  }): Promise<void> {
    await this.auditRepo.create({
      schoolId: params.schoolId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: params.eventType || 'safe_error',
      decision: 'error',
      safeSummary: params.safeSummary,
    });
  }
}
