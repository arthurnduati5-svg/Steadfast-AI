import { randomUUID } from 'crypto';
import type { ResultReleaseReadinessRepository, ResultFinalizationDecisionRepository } from '../contracts/resultGovernanceRepositoryContracts';
import type { ResultReleaseReadiness } from '../contracts/index';
import { ResultGovernancePolicyRegistry, isAllowedMutationRole } from '../policies/resultGovernancePolicyDefinitions';

export class ResultReleaseReadinessService {
  constructor(
    private readinessRepo: ResultReleaseReadinessRepository,
    private decisionRepo: ResultFinalizationDecisionRepository,
    private policyRegistry: ResultGovernancePolicyRegistry,
  ) {}

  async createReleaseReadiness(params: {
    schoolId: string;
    resultFinalizationDecisionId: string;
    resultFinalizationReviewId?: string;
    markingInvocationRequestId?: string;
    releaseAudienceType: string;
    safeReadinessSummary: string;
    actorId: string;
    actorRole: string;
  }): Promise<ResultReleaseReadiness> {
    if (!params.schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
    if (!isAllowedMutationRole(params.actorRole)) throw new Error(`FORBIDDEN: role ${params.actorRole} cannot create release readiness`);
    const policy = this.policyRegistry.checkPolicy('RESULT_RELEASE_READINESS', params.actorRole);
    if (!policy.allowed) throw new Error(`POLICY_BLOCKED: ${policy.safeMessage}`);

    const decision = await this.decisionRepo.getById(params.resultFinalizationDecisionId);
    if (!decision) throw new Error('NOT_FOUND: finalization decision not found');
    if (decision.decisionStatus !== 'approved_for_finalization') throw new Error(`VALIDATION_FAILED: decision status must be approved_for_finalization, got ${decision.decisionStatus}`);

    const readiness: ResultReleaseReadiness = {
      resultReleaseReadinessId: randomUUID(),
      schoolId: params.schoolId,
      resultFinalizationDecisionId: params.resultFinalizationDecisionId,
      resultFinalizationReviewId: params.resultFinalizationReviewId || decision.resultFinalizationReviewId,
      markingInvocationRequestId: params.markingInvocationRequestId || decision.markingInvocationRequestId,
      releaseReadinessStatus: 'not_ready',
      releaseAudienceType: params.releaseAudienceType || 'internal_school',
      safeReadinessSummary: params.safeReadinessSummary,
      createdByActorId: params.actorId,
      createdByRole: params.actorRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return this.readinessRepo.create(readiness);
  }

  async evaluateInternalReleaseReadiness(readinessId: string, actorRole: string): Promise<ResultReleaseReadiness | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot evaluate readiness`);
    return this.readinessRepo.updateStatus(readinessId, 'ready_for_internal_release', 'Evaluated: ready for internal school release');
  }

  async evaluateStudentReleaseReadiness(readinessId: string, actorRole: string): Promise<ResultReleaseReadiness | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot evaluate student readiness`);
    return this.readinessRepo.updateStatus(readinessId, 'ready_for_student_release', 'Evaluated: ready for student release');
  }

  async evaluateParentBoundaryReadiness(readinessId: string, actorRole: string): Promise<ResultReleaseReadiness | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot evaluate parent boundary readiness`);
    return this.readinessRepo.updateStatus(readinessId, 'ready_for_parent_release_boundary_only', 'Evaluated: ready for parent boundary only');
  }

  async blockReleaseReadiness(readinessId: string, actorRole: string, safeSummary?: string): Promise<ResultReleaseReadiness | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot block readiness`);
    return this.readinessRepo.updateStatus(readinessId, 'blocked', safeSummary || 'Release readiness blocked');
  }

  async expireReleaseReadiness(readinessId: string, actorRole: string): Promise<ResultReleaseReadiness | null> {
    if (!isAllowedMutationRole(actorRole)) throw new Error(`FORBIDDEN: role ${actorRole} cannot expire readiness`);
    const expiresAt = new Date().toISOString();
    return this.readinessRepo.expireReadiness(readinessId, expiresAt);
  }

  async getReleaseReadiness(readinessId: string): Promise<ResultReleaseReadiness | null> {
    return this.readinessRepo.getById(readinessId);
  }

  async listReadinessForDecision(decisionId: string): Promise<ResultReleaseReadiness[]> {
    return this.readinessRepo.listByDecision(decisionId);
  }
}
