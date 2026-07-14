import { randomUUID } from 'crypto';
import type { ResultLearningEvidenceBridge, CreateEvidenceBridgeRequest } from '../contracts/resultEvidenceBridgeContracts';
import type { ResultLearningEvidenceBridgeRepository } from '../contracts/resultLearningEvidenceRepositoryContracts';
import type { ResultLearningEvidencePolicyRegistry } from '../policies/resultLearningEvidencePolicyDefinitions';

export class ResultEvidenceBridgeService {
  constructor(
    private bridgeRepo: ResultLearningEvidenceBridgeRepository,
    private policyRegistry: ResultLearningEvidencePolicyRegistry,
  ) {}

  async createEvidenceBridgeFromFinalizedResult(params: CreateEvidenceBridgeRequest, correlationId: string): Promise<ResultLearningEvidenceBridge> {
    if (!params.schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
    if (!params.resultFinalizationDecisionId) throw new Error('VALIDATION_FAILED: resultFinalizationDecisionId is required');
    if (!params.markingResultVersionId) throw new Error('VALIDATION_FAILED: markingResultVersionId is required');
    if (!params.studentRef) throw new Error('VALIDATION_FAILED: studentRef is required');
    if (!params.actorId) throw new Error('VALIDATION_FAILED: actorId is required');

    const policyCheck = this.policyRegistry.checkPolicy('RESULT_LEARNING_EVIDENCE_INTAKE', params.actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);

    const bridge: ResultLearningEvidenceBridge = {
      resultLearningEvidenceBridgeId: randomUUID(),
      schoolId: params.schoolId,
      resultFinalizationDecisionId: params.resultFinalizationDecisionId,
      resultReleaseReadinessId: params.resultReleaseReadinessId,
      markingRunId: params.markingRunId,
      markingResultVersionId: params.markingResultVersionId,
      studentRef: params.studentRef,
      paperId: params.paperId,
      paperVersionId: params.paperVersionId,
      deliverySessionId: params.deliverySessionId,
      bridgeStatus: 'draft',
      bridgeMode: params.bridgeMode || 'teacher_approved_result',
      sourceRefsJson: params.sourceRefs,
      safeEvidenceSummary: params.safeEvidenceSummary,
      createdByActorId: params.actorId,
      createdByRole: params.actorRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.bridgeRepo.create(bridge);
  }

  async getEvidenceBridge(bridgeId: string): Promise<ResultLearningEvidenceBridge | null> {
    return this.bridgeRepo.getById(bridgeId);
  }

  async listEvidenceBridgesForSchool(schoolId: string): Promise<ResultLearningEvidenceBridge[]> {
    if (!schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
    return this.bridgeRepo.listBySchool(schoolId);
  }

  async listEvidenceBridgesForStudent(schoolId: string, studentRef: string): Promise<ResultLearningEvidenceBridge[]> {
    if (!schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
    if (!studentRef) throw new Error('VALIDATION_FAILED: studentRef is required');
    return this.bridgeRepo.listByStudentRef(schoolId, studentRef);
  }

  async listEvidenceBridgesForFinalizationDecision(resultFinalizationDecisionId: string): Promise<ResultLearningEvidenceBridge[]> {
    if (!resultFinalizationDecisionId) throw new Error('VALIDATION_FAILED: resultFinalizationDecisionId is required');
    return this.bridgeRepo.listByFinalizationDecisionId(resultFinalizationDecisionId);
  }

  async runSourceIntegrityChecks(bridgeId: string, actorRole: string): Promise<{ allChecksPassed: boolean; safeSummary: string; blockingReasonCodes: string[] }> {
    const bridge = await this.bridgeRepo.getById(bridgeId);
    if (!bridge) throw new Error('NOT_FOUND: evidence bridge not found');
    const policyCheck = this.policyRegistry.checkPolicy('RESULT_LEARNING_EVIDENCE_INTAKE', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);

    const blockingReasonCodes: string[] = [];
    if (!bridge.resultFinalizationDecisionId) blockingReasonCodes.push('MISSING_FINALIZATION_DECISION');
    if (!bridge.markingResultVersionId) blockingReasonCodes.push('MISSING_MARKING_RESULT_VERSION');
    if (!bridge.studentRef) blockingReasonCodes.push('MISSING_STUDENT_REF');

    const allChecksPassed = blockingReasonCodes.length === 0;
    await this.bridgeRepo.updateStatus(bridgeId, allChecksPassed ? 'source_check_pending' : 'blocked');

    return {
      allChecksPassed,
      safeSummary: allChecksPassed ? 'Source integrity checks passed' : 'Source integrity checks failed',
      blockingReasonCodes,
    };
  }

  async markBridgeReadyForMapping(bridgeId: string, actorRole: string): Promise<ResultLearningEvidenceBridge | null> {
    const policyCheck = this.policyRegistry.checkPolicy('RESULT_LEARNING_EVIDENCE_INTAKE', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);
    return this.bridgeRepo.updateStatus(bridgeId, 'ready_for_mapping');
  }

  async blockEvidenceBridge(bridgeId: string, actorRole: string, safeSummary?: string): Promise<ResultLearningEvidenceBridge | null> {
    const policyCheck = this.policyRegistry.checkPolicy('RESULT_LEARNING_EVIDENCE_INTAKE', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);
    return this.bridgeRepo.updateStatus(bridgeId, 'blocked', safeSummary);
  }

  async cancelEvidenceBridge(bridgeId: string, actorRole: string, safeSummary?: string): Promise<ResultLearningEvidenceBridge | null> {
    const policyCheck = this.policyRegistry.checkPolicy('RESULT_LEARNING_EVIDENCE_INTAKE', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);
    return this.bridgeRepo.updateStatus(bridgeId, 'cancelled', safeSummary);
  }

  async completeEvidenceBridge(bridgeId: string, actorRole: string, safeSummary?: string): Promise<ResultLearningEvidenceBridge | null> {
    const policyCheck = this.policyRegistry.checkPolicy('RESULT_LEARNING_EVIDENCE_INTAKE', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);
    return this.bridgeRepo.updateStatus(bridgeId, 'completed', safeSummary);
  }
}
