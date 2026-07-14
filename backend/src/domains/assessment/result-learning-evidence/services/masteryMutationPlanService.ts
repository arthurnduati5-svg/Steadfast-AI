import { randomUUID } from 'crypto';
import type { ResultMasteryMutationPlan, CreateMasteryMutationPlanRequest } from '../contracts/masteryMutationContracts';
import type { ResultObjectiveMasteryImpact } from '../contracts/objectiveImpactContracts';
import type { ResultMasteryMutationPlanRepository, ResultObjectiveMasteryImpactRepository } from '../contracts/resultLearningEvidenceRepositoryContracts';
import type { ResultLearningEvidencePolicyRegistry } from '../policies/resultLearningEvidencePolicyDefinitions';

export class MasteryMutationPlanService {
  constructor(
    private planRepo: ResultMasteryMutationPlanRepository,
    private impactRepo: ResultObjectiveMasteryImpactRepository,
    private policyRegistry: ResultLearningEvidencePolicyRegistry,
  ) {}

  async createMasteryMutationPlan(params: CreateMasteryMutationPlanRequest): Promise<ResultMasteryMutationPlan> {
    if (!params.schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
    if (!params.resultLearningEvidenceBridgeId) throw new Error('VALIDATION_FAILED: resultLearningEvidenceBridgeId is required');

    const policyCheck = this.policyRegistry.checkPolicy('RESULT_MASTERY_MUTATION_PLANNING', params.actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);

    const plan: ResultMasteryMutationPlan = {
      resultMasteryMutationPlanId: randomUUID(),
      schoolId: params.schoolId,
      resultLearningEvidenceBridgeId: params.resultLearningEvidenceBridgeId,
      resultFinalizationDecisionId: params.resultFinalizationDecisionId,
      markingResultVersionId: params.markingResultVersionId,
      studentRef: params.studentRef,
      planStatus: 'draft',
      planMode: params.planMode || 'objective_level_mastery',
      objectiveImpactRefsJson: params.objectiveImpactRefs,
      targetMasterySnapshotRefsJson: params.targetMasterySnapshotRefs,
      safePlanSummary: params.safePlanSummary,
      approvalRequired: true,
      createdByActorId: params.actorId,
      createdByRole: params.actorRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.planRepo.create(plan);
  }

  async getMasteryMutationPlan(planId: string): Promise<ResultMasteryMutationPlan | null> {
    return this.planRepo.getById(planId);
  }

  async listPlansForBridge(bridgeId: string): Promise<ResultMasteryMutationPlan[]> {
    if (!bridgeId) throw new Error('VALIDATION_FAILED: bridgeId is required');
    return this.planRepo.listByBridge(bridgeId);
  }

  async listPlansForStudent(schoolId: string, studentRef: string): Promise<ResultMasteryMutationPlan[]> {
    if (!schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
    if (!studentRef) throw new Error('VALIDATION_FAILED: studentRef is required');
    return this.planRepo.listByStudentRef(schoolId, studentRef);
  }

  async buildPlanFromObjectiveImpacts(planId: string, actorRole: string): Promise<ResultMasteryMutationPlan | null> {
    const plan = await this.planRepo.getById(planId);
    if (!plan) throw new Error('NOT_FOUND: mastery mutation plan not found');

    const policyCheck = this.policyRegistry.checkPolicy('RESULT_MASTERY_MUTATION_PLANNING', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);

    const impacts = await this.impactRepo.listByPlan(planId);
    if (impacts.length === 0) throw new Error('VALIDATION_FAILED: no objective impacts found for plan');

    return this.planRepo.update(planId, {
      planStatus: 'draft',
      objectiveImpactRefsJson: { impactCount: impacts.length, impactIds: impacts.map(i => i.resultObjectiveMasteryImpactId) },
      safePlanSummary: `Plan built from ${impacts.length} objective impacts`,
    });
  }

  async markPlanReadyForApproval(planId: string, actorRole: string): Promise<ResultMasteryMutationPlan | null> {
    const policyCheck = this.policyRegistry.checkPolicy('RESULT_MASTERY_MUTATION_PLANNING', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);
    return this.planRepo.updateStatus(planId, 'ready_for_approval');
  }

  async approvePlan(planId: string, actorId: string, actorRole: string): Promise<ResultMasteryMutationPlan | null> {
    const policyCheck = this.policyRegistry.checkPolicy('RESULT_MASTERY_MUTATION_APPROVAL', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);

    return this.planRepo.update(planId, {
      planStatus: 'approved',
      approvedByActorId: actorId,
      approvedByRole: actorRole,
      approvedAt: new Date().toISOString(),
    });
  }

  async blockPlan(planId: string, actorRole: string, safeSummary?: string): Promise<ResultMasteryMutationPlan | null> {
    const policyCheck = this.policyRegistry.checkPolicy('RESULT_MASTERY_MUTATION_PLANNING', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);
    return this.planRepo.updateStatus(planId, 'blocked', safeSummary);
  }

  async cancelPlan(planId: string, actorRole: string, safeSummary?: string): Promise<ResultMasteryMutationPlan | null> {
    const policyCheck = this.policyRegistry.checkPolicy('RESULT_MASTERY_MUTATION_PLANNING', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);
    return this.planRepo.updateStatus(planId, 'cancelled', safeSummary);
  }

  async markPlanApplied(planId: string, actorRole: string): Promise<ResultMasteryMutationPlan | null> {
    const policyCheck = this.policyRegistry.checkPolicy('RESULT_MASTERY_MUTATION_APPLICATION', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);
    return this.planRepo.updateStatus(planId, 'applied');
  }
}
