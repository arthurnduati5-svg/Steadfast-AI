import type { ResultLearningEvidenceAuditRepository } from '../contracts/resultLearningEvidenceRepositoryContracts';
import { randomUUID } from 'crypto';

export class ResultLearningEvidenceAuditBridge {
  constructor(private auditRepo: ResultLearningEvidenceAuditRepository) {}

  async recordEvidenceBridgeCreated(params: {
    schoolId: string; resultLearningEvidenceBridgeId: string; actorId: string; actorRole: string; correlationId?: string; requestId?: string;
  }): Promise<void> {
    await this.auditRepo.create({
      resultLearningEvidenceAuditId: randomUUID(),
      schoolId: params.schoolId,
      resultLearningEvidenceBridgeId: params.resultLearningEvidenceBridgeId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: 'EVIDENCE_BRIDGE_CREATED',
      decision: 'created',
      safeSummary: 'Evidence bridge created from finalized result',
      correlationId: params.correlationId,
      requestId: params.requestId,
    });
  }

  async recordSourceIntegrityChecked(params: {
    schoolId: string; resultLearningEvidenceBridgeId: string; actorId: string; actorRole: string; allPassed: boolean; blockingReasonCodes?: string[];
  }): Promise<void> {
    await this.auditRepo.create({
      resultLearningEvidenceAuditId: randomUUID(),
      schoolId: params.schoolId,
      resultLearningEvidenceBridgeId: params.resultLearningEvidenceBridgeId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: 'SOURCE_INTEGRITY_CHECKED',
      decision: params.allPassed ? 'passed' : 'blocked',
      safeSummary: params.allPassed ? 'Source integrity checks passed' : 'Source integrity checks failed',
      reasonCodesJson: params.blockingReasonCodes ? { blockingReasonCodes: params.blockingReasonCodes } : undefined,
    });
  }

  async recordObjectiveImpactsMapped(params: {
    schoolId: string; resultLearningEvidenceBridgeId: string; resultMasteryMutationPlanId: string; impactCount: number; actorId: string; actorRole: string;
  }): Promise<void> {
    await this.auditRepo.create({
      resultLearningEvidenceAuditId: randomUUID(),
      schoolId: params.schoolId,
      resultLearningEvidenceBridgeId: params.resultLearningEvidenceBridgeId,
      resultMasteryMutationPlanId: params.resultMasteryMutationPlanId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: 'OBJECTIVE_IMPACTS_MAPPED',
      decision: 'mapped',
      safeSummary: `${params.impactCount} objective impacts mapped`,
      metadataJson: { impactCount: params.impactCount },
    });
  }

  async recordMasteryPlanCreated(params: {
    schoolId: string; resultMasteryMutationPlanId: string; resultLearningEvidenceBridgeId: string; actorId: string; actorRole: string;
  }): Promise<void> {
    await this.auditRepo.create({
      resultLearningEvidenceAuditId: randomUUID(),
      schoolId: params.schoolId,
      resultMasteryMutationPlanId: params.resultMasteryMutationPlanId,
      resultLearningEvidenceBridgeId: params.resultLearningEvidenceBridgeId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: 'MASTERY_PLAN_CREATED',
      decision: 'created',
      safeSummary: 'Mastery mutation plan created',
    });
  }

  async recordMasteryPlanApproved(params: {
    schoolId: string; resultMasteryMutationPlanId: string; resultLearningEvidenceBridgeId: string; actorId: string; actorRole: string;
  }): Promise<void> {
    await this.auditRepo.create({
      resultLearningEvidenceAuditId: randomUUID(),
      schoolId: params.schoolId,
      resultMasteryMutationPlanId: params.resultMasteryMutationPlanId,
      resultLearningEvidenceBridgeId: params.resultLearningEvidenceBridgeId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: 'MASTERY_PLAN_APPROVED',
      decision: 'approved',
      safeSummary: 'Mastery mutation plan approved',
    });
  }

  async recordMasteryMutationApplied(params: {
    schoolId: string; resultMasteryMutationEventId: string; resultMasteryMutationPlanId: string; resultLearningEvidenceBridgeId: string; actorId: string; actorRole: string;
  }): Promise<void> {
    await this.auditRepo.create({
      resultLearningEvidenceAuditId: randomUUID(),
      schoolId: params.schoolId,
      resultMasteryMutationEventId: params.resultMasteryMutationEventId,
      resultMasteryMutationPlanId: params.resultMasteryMutationPlanId,
      resultLearningEvidenceBridgeId: params.resultLearningEvidenceBridgeId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: 'MASTERY_MUTATION_APPLIED',
      decision: 'applied',
      safeSummary: 'Mastery mutation applied',
    });
  }

  async recordRevisionSignalCreated(params: {
    schoolId: string; resultRevisionSignalId: string; resultMasteryMutationPlanId: string; actorId: string; actorRole: string;
  }): Promise<void> {
    await this.auditRepo.create({
      resultLearningEvidenceAuditId: randomUUID(),
      schoolId: params.schoolId,
      resultRevisionSignalId: params.resultRevisionSignalId,
      resultMasteryMutationPlanId: params.resultMasteryMutationPlanId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: 'REVISION_SIGNAL_CREATED',
      decision: 'created',
      safeSummary: 'Revision signal created',
    });
  }

  async recordRevisionSignalDispatched(params: {
    schoolId: string; resultRevisionSignalId: string; resultMasteryMutationPlanId: string; actorId: string; actorRole: string;
  }): Promise<void> {
    await this.auditRepo.create({
      resultLearningEvidenceAuditId: randomUUID(),
      schoolId: params.schoolId,
      resultRevisionSignalId: params.resultRevisionSignalId,
      resultMasteryMutationPlanId: params.resultMasteryMutationPlanId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: 'REVISION_SIGNAL_DISPATCHED',
      decision: 'dispatched',
      safeSummary: 'Revision signal dispatched',
    });
  }

  async recordGrowthSignalCreated(params: {
    schoolId: string; resultGrowthSignalId: string; resultMasteryMutationPlanId: string; actorId: string; actorRole: string;
  }): Promise<void> {
    await this.auditRepo.create({
      resultLearningEvidenceAuditId: randomUUID(),
      schoolId: params.schoolId,
      resultGrowthSignalId: params.resultGrowthSignalId,
      resultMasteryMutationPlanId: params.resultMasteryMutationPlanId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: 'GROWTH_SIGNAL_CREATED',
      decision: 'created',
      safeSummary: 'Growth signal created',
    });
  }

  async recordGrowthSignalDispatched(params: {
    schoolId: string; resultGrowthSignalId: string; resultMasteryMutationPlanId: string; actorId: string; actorRole: string;
  }): Promise<void> {
    await this.auditRepo.create({
      resultLearningEvidenceAuditId: randomUUID(),
      schoolId: params.schoolId,
      resultGrowthSignalId: params.resultGrowthSignalId,
      resultMasteryMutationPlanId: params.resultMasteryMutationPlanId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: 'GROWTH_SIGNAL_DISPATCHED',
      decision: 'dispatched',
      safeSummary: 'Growth signal dispatched',
    });
  }

  async recordPolicyBlocked(params: {
    schoolId: string; eventType: string; safeSummary: string; actorId: string; actorRole: string; reasonCodesJson?: Record<string, unknown>;
  }): Promise<void> {
    await this.auditRepo.create({
      resultLearningEvidenceAuditId: randomUUID(),
      schoolId: params.schoolId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: params.eventType || 'POLICY_BLOCKED',
      decision: 'blocked',
      safeSummary: params.safeSummary,
      reasonCodesJson: params.reasonCodesJson,
    });
  }

  async recordSafeError(params: {
    schoolId: string; eventType: string; safeSummary: string; actorId: string; actorRole: string; errorCode?: string;
  }): Promise<void> {
    await this.auditRepo.create({
      resultLearningEvidenceAuditId: randomUUID(),
      schoolId: params.schoolId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      eventType: params.eventType || 'SAFE_ERROR',
      decision: 'error',
      safeSummary: params.safeSummary,
      reasonCodesJson: params.errorCode ? { errorCode: params.errorCode } : undefined,
    });
  }
}
