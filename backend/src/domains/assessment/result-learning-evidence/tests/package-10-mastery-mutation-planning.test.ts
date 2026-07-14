import { describe, it, expect, beforeEach } from 'vitest';
import { MasteryMutationPlanService } from '../services/masteryMutationPlanService';
import { ResultLearningEvidencePolicyRegistry } from '../policies/resultLearningEvidencePolicyDefinitions';
import {
  InMemoryResultMasteryMutationPlanRepository,
  InMemoryResultObjectiveMasteryImpactRepository,
} from '../repositories/inMemoryResultLearningEvidenceRepositories';

describe('Package 10 - Mastery Mutation Planning', () => {
  let planRepo: InMemoryResultMasteryMutationPlanRepository;
  let impactRepo: InMemoryResultObjectiveMasteryImpactRepository;
  let policyRegistry: ResultLearningEvidencePolicyRegistry;
  let service: MasteryMutationPlanService;

  beforeEach(() => {
    planRepo = new InMemoryResultMasteryMutationPlanRepository();
    impactRepo = new InMemoryResultObjectiveMasteryImpactRepository();
    policyRegistry = new ResultLearningEvidencePolicyRegistry();
    service = new MasteryMutationPlanService(planRepo, impactRepo, policyRegistry);
  });

  it('should create mastery mutation plan', async () => {
    const plan = await service.createMasteryMutationPlan({
      schoolId: 'school-1',
      resultLearningEvidenceBridgeId: 'bridge-1',
      resultFinalizationDecisionId: 'decision-1',
      markingResultVersionId: 'version-1',
      studentRef: 'student-1',
      safePlanSummary: 'Plan summary',
      actorId: 'actor-1',
      actorRole: 'teacher',
    });
    expect(plan).toBeDefined();
    expect(plan.resultMasteryMutationPlanId).toBeTruthy();
    expect(plan.planStatus).toBe('draft');
    expect(plan.schoolId).toBe('school-1');
  });

  it('should block missing schoolId', async () => {
    await expect(service.createMasteryMutationPlan({
      schoolId: '', resultLearningEvidenceBridgeId: 'bridge-1', resultFinalizationDecisionId: 'decision-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safePlanSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    })).rejects.toThrow('SCHOOL_CONTEXT_REQUIRED');
  });

  it('should block student role for plan creation', async () => {
    await expect(service.createMasteryMutationPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultFinalizationDecisionId: 'decision-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safePlanSummary: 'test', actorId: 'student-1', actorRole: 'student',
    })).rejects.toThrow('POLICY_BLOCKED');
  });

  it('should not create plan without objective impacts when building', async () => {
    const plan = await service.createMasteryMutationPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultFinalizationDecisionId: 'decision-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safePlanSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    await expect(service.buildPlanFromObjectiveImpacts(plan.resultMasteryMutationPlanId, 'teacher')).rejects.toThrow('no objective impacts found');
  });

  it('should move plan to ready_for_approval', async () => {
    const plan = await service.createMasteryMutationPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultFinalizationDecisionId: 'decision-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safePlanSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    const updated = await service.markPlanReadyForApproval(plan.resultMasteryMutationPlanId, 'teacher');
    expect(updated?.planStatus).toBe('ready_for_approval');
  });

  it('should approve plan', async () => {
    const plan = await service.createMasteryMutationPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultFinalizationDecisionId: 'decision-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safePlanSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    const updated = await service.approvePlan(plan.resultMasteryMutationPlanId, 'admin-1', 'admin');
    expect(updated?.planStatus).toBe('approved');
    expect(updated?.approvedByActorId).toBe('admin-1');
  });

  it('should block student from approving plan', async () => {
    const plan = await service.createMasteryMutationPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultFinalizationDecisionId: 'decision-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safePlanSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    await expect(service.approvePlan(plan.resultMasteryMutationPlanId, 'student-1', 'student')).rejects.toThrow('POLICY_BLOCKED');
  });

  it('should block plan', async () => {
    const plan = await service.createMasteryMutationPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultFinalizationDecisionId: 'decision-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safePlanSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    const updated = await service.blockPlan(plan.resultMasteryMutationPlanId, 'teacher');
    expect(updated?.planStatus).toBe('blocked');
  });

  it('should cancel plan', async () => {
    const plan = await service.createMasteryMutationPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultFinalizationDecisionId: 'decision-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safePlanSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    const updated = await service.cancelPlan(plan.resultMasteryMutationPlanId, 'teacher');
    expect(updated?.planStatus).toBe('cancelled');
  });

  it('should list plans for bridge', async () => {
    await service.createMasteryMutationPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultFinalizationDecisionId: 'decision-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safePlanSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    const plans = await service.listPlansForBridge('bridge-1');
    expect(plans.length).toBe(1);
  });
});
