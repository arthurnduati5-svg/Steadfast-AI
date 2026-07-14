import { randomUUID } from 'crypto';
import type { ResultMasteryMutationPlan, ResultMasteryMutationEvent, ApplyMasteryMutationRequest } from '../contracts/masteryMutationContracts';
import type { ResultMasteryMutationPlanRepository, ResultMasteryMutationEventRepository } from '../contracts/resultLearningEvidenceRepositoryContracts';
import type { ResultLearningEvidencePolicyRegistry } from '../policies/resultLearningEvidencePolicyDefinitions';

export class MasteryMutationApplicationService {
  constructor(
    private planRepo: ResultMasteryMutationPlanRepository,
    private eventRepo: ResultMasteryMutationEventRepository,
    private policyRegistry: ResultLearningEvidencePolicyRegistry,
  ) {}

  async applyApprovedMasteryMutationPlan(params: ApplyMasteryMutationRequest): Promise<ResultMasteryMutationEvent> {
    if (!params.schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');

    const policyCheck = this.policyRegistry.checkPolicy('RESULT_MASTERY_MUTATION_APPLICATION', params.actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);

    const plan = await this.planRepo.getById(params.resultMasteryMutationPlanId);
    if (!plan) throw new Error('NOT_FOUND: mastery mutation plan not found');
    if (plan.planStatus !== 'approved') throw new Error('VALIDATION_FAILED: plan must be approved before application');

    const event: ResultMasteryMutationEvent = {
      resultMasteryMutationEventId: randomUUID(),
      schoolId: params.schoolId,
      resultMasteryMutationPlanId: params.resultMasteryMutationPlanId,
      resultLearningEvidenceBridgeId: plan.resultLearningEvidenceBridgeId,
      studentRef: plan.studentRef,
      targetSnapshotRef: undefined,
      mutationStatus: 'applied',
      mutationType: 'evidence_only_no_change',
      beforeStateJson: { originalPlanStatus: plan.planStatus },
      afterStateJson: { appliedPlanStatus: 'applied' },
      deltaJson: { mutationType: 'evidence_only_no_change', reason: 'EXISTING_MASTERY_MUTATION_PATH_NOT_FOUND: No safe existing mutation path found; evidence recorded only' },
      safeMutationSummary: params.safeMutationSummary || 'Evidence recorded. Mastery mutation path not available - evidence-only no-change event created.',
      appliedByActorId: params.actorId,
      appliedByRole: params.actorRole,
      createdAt: new Date().toISOString(),
      appliedAt: new Date().toISOString(),
    };

    const created = await this.eventRepo.create(event);
    await this.planRepo.updateStatus(params.resultMasteryMutationPlanId, 'applied');

    return created;
  }

  async previewMasteryMutation(planId: string): Promise<{ planFound: boolean; canApply: boolean; blockingReason: string | null }> {
    const plan = await this.planRepo.getById(planId);
    if (!plan) return { planFound: false, canApply: false, blockingReason: 'Plan not found' };
    if (plan.planStatus !== 'approved') return { planFound: true, canApply: false, blockingReason: `Plan status is ${plan.planStatus}, must be approved` };
    return { planFound: true, canApply: true, blockingReason: null };
  }

  async getMasteryMutationEvent(eventId: string): Promise<ResultMasteryMutationEvent | null> {
    return this.eventRepo.getById(eventId);
  }

  async listMutationEventsForPlan(planId: string): Promise<ResultMasteryMutationEvent[]> {
    return this.eventRepo.listByPlan(planId);
  }

  async listMutationEventsForStudent(schoolId: string, studentRef: string): Promise<ResultMasteryMutationEvent[]> {
    return this.eventRepo.listByStudentRef(schoolId, studentRef);
  }

  async blockMutationApplication(planId: string, actorRole: string): Promise<ResultMasteryMutationPlan | null> {
    const policyCheck = this.policyRegistry.checkPolicy('RESULT_MASTERY_MUTATION_APPLICATION', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);
    return this.planRepo.updateStatus(planId, 'blocked', 'Mutation application blocked');
  }

  async voidMutationEvent(eventId: string, actorRole: string): Promise<ResultMasteryMutationEvent | null> {
    const policyCheck = this.policyRegistry.checkPolicy('RESULT_MASTERY_MUTATION_APPLICATION', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);
    return this.eventRepo.updateStatus(eventId, 'void');
  }
}
