import { randomUUID } from 'crypto';
import type { ResultObjectiveMasteryImpact, MapObjectiveImpactRequest } from '../contracts/objectiveImpactContracts';
import type { ResultObjectiveMasteryImpactRepository } from '../contracts/resultLearningEvidenceRepositoryContracts';
import type { ResultLearningEvidencePolicyRegistry } from '../policies/resultLearningEvidencePolicyDefinitions';

export class ObjectiveMasteryImpactService {
  constructor(
    private impactRepo: ResultObjectiveMasteryImpactRepository,
    private policyRegistry: ResultLearningEvidencePolicyRegistry,
  ) {}

  async mapObjectiveImpactsFromResult(params: MapObjectiveImpactRequest): Promise<ResultObjectiveMasteryImpact> {
    if (!params.schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
    if (!params.learningObjectiveId) throw new Error('VALIDATION_FAILED: learningObjectiveId is required');
    if (!params.markingResultVersionId) throw new Error('VALIDATION_FAILED: markingResultVersionId is required');

    const policyCheck = this.policyRegistry.checkPolicy('RESULT_OBJECTIVE_IMPACT_MAPPING', params.actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);

    const impact: ResultObjectiveMasteryImpact = {
      resultObjectiveMasteryImpactId: randomUUID(),
      schoolId: params.schoolId,
      resultLearningEvidenceBridgeId: params.resultLearningEvidenceBridgeId,
      resultMasteryMutationPlanId: params.resultMasteryMutationPlanId,
      studentRef: params.studentRef,
      learningObjectiveId: params.learningObjectiveId,
      questionVersionId: params.questionVersionId,
      markingResultVersionId: params.markingResultVersionId,
      impactStatus: 'draft',
      impactType: params.impactType || 'correct_evidence',
      evidenceStrength: params.evidenceStrength || 'moderate',
      masteryDelta: params.masteryDelta || 'no_change',
      confidenceLevel: params.confidenceLevel || 'moderate',
      safeImpactSummary: params.safeImpactSummary,
      sourceRefsJson: params.sourceRefs,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.impactRepo.create(impact);
  }

  async getObjectiveImpact(impactId: string): Promise<ResultObjectiveMasteryImpact | null> {
    return this.impactRepo.getById(impactId);
  }

  async listObjectiveImpactsForBridge(bridgeId: string): Promise<ResultObjectiveMasteryImpact[]> {
    if (!bridgeId) throw new Error('VALIDATION_FAILED: bridgeId is required');
    return this.impactRepo.listByBridge(bridgeId);
  }

  async listObjectiveImpactsForPlan(planId: string): Promise<ResultObjectiveMasteryImpact[]> {
    if (!planId) throw new Error('VALIDATION_FAILED: planId is required');
    return this.impactRepo.listByPlan(planId);
  }

  async listObjectiveImpactsForStudent(schoolId: string, studentRef: string): Promise<ResultObjectiveMasteryImpact[]> {
    if (!schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
    if (!studentRef) throw new Error('VALIDATION_FAILED: studentRef is required');
    return this.impactRepo.listByStudentRef(schoolId, studentRef);
  }

  async approveObjectiveImpact(impactId: string, actorRole: string): Promise<ResultObjectiveMasteryImpact | null> {
    const policyCheck = this.policyRegistry.checkPolicy('RESULT_OBJECTIVE_IMPACT_MAPPING', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);
    return this.impactRepo.updateStatus(impactId, 'approved');
  }

  async blockObjectiveImpact(impactId: string, actorRole: string): Promise<ResultObjectiveMasteryImpact | null> {
    const policyCheck = this.policyRegistry.checkPolicy('RESULT_OBJECTIVE_IMPACT_MAPPING', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);
    return this.impactRepo.updateStatus(impactId, 'blocked');
  }

  async voidObjectiveImpact(impactId: string, actorRole: string): Promise<ResultObjectiveMasteryImpact | null> {
    const policyCheck = this.policyRegistry.checkPolicy('RESULT_OBJECTIVE_IMPACT_MAPPING', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);
    return this.impactRepo.voidImpact(impactId, new Date().toISOString());
  }
}
