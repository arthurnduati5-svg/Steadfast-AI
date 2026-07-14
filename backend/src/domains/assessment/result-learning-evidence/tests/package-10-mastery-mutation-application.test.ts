import { describe, it, expect, beforeEach } from 'vitest';
import { MasteryMutationPlanService } from '../services/masteryMutationPlanService';
import { MasteryMutationApplicationService } from '../services/masteryMutationApplicationService';
import { ResultLearningEvidencePolicyRegistry } from '../policies/resultLearningEvidencePolicyDefinitions';
import {
  InMemoryResultMasteryMutationPlanRepository,
  InMemoryResultMasteryMutationEventRepository,
  InMemoryResultObjectiveMasteryImpactRepository,
} from '../repositories/inMemoryResultLearningEvidenceRepositories';

describe('Package 10 - Mastery Mutation Application', () => {
  let planRepo: InMemoryResultMasteryMutationPlanRepository;
  let eventRepo: InMemoryResultMasteryMutationEventRepository;
  let impactRepo: InMemoryResultObjectiveMasteryImpactRepository;
  let policyRegistry: ResultLearningEvidencePolicyRegistry;
  let planService: MasteryMutationPlanService;
  let mutationService: MasteryMutationApplicationService;

  beforeEach(() => {
    planRepo = new InMemoryResultMasteryMutationPlanRepository();
    eventRepo = new InMemoryResultMasteryMutationEventRepository();
    impactRepo = new InMemoryResultObjectiveMasteryImpactRepository();
    policyRegistry = new ResultLearningEvidencePolicyRegistry();
    planService = new MasteryMutationPlanService(planRepo, impactRepo, policyRegistry);
    mutationService = new MasteryMutationApplicationService(planRepo, eventRepo, policyRegistry);
  });

  it('should apply approved mastery plan', async () => {
    const plan = await planService.createMasteryMutationPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultFinalizationDecisionId: 'decision-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safePlanSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    await planService.approvePlan(plan.resultMasteryMutationPlanId, 'admin-1', 'admin');
    const event = await mutationService.applyApprovedMasteryMutationPlan({
      schoolId: 'school-1', resultMasteryMutationPlanId: plan.resultMasteryMutationPlanId, actorId: 'actor-1', actorRole: 'admin', safeMutationSummary: 'Applied',
    });
    expect(event).toBeDefined();
    expect(event.resultMasteryMutationEventId).toBeTruthy();
    expect(event.mutationStatus).toBe('applied');
    expect(event.mutationType).toBe('evidence_only_no_change');
  });

  it('should block unapproved plan application', async () => {
    const plan = await planService.createMasteryMutationPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultFinalizationDecisionId: 'decision-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safePlanSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    await expect(mutationService.applyApprovedMasteryMutationPlan({
      schoolId: 'school-1', resultMasteryMutationPlanId: plan.resultMasteryMutationPlanId, actorId: 'actor-1', actorRole: 'admin', safeMutationSummary: 'Applied',
    })).rejects.toThrow('plan must be approved');
  });

  it('should create ResultMasteryMutationEventRecord on application', async () => {
    const plan = await planService.createMasteryMutationPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultFinalizationDecisionId: 'decision-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safePlanSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    await planService.approvePlan(plan.resultMasteryMutationPlanId, 'admin-1', 'admin');
    const event = await mutationService.applyApprovedMasteryMutationPlan({
      schoolId: 'school-1', resultMasteryMutationPlanId: plan.resultMasteryMutationPlanId, actorId: 'actor-1', actorRole: 'admin', safeMutationSummary: 'Applied',
    });
    const found = await mutationService.getMasteryMutationEvent(event.resultMasteryMutationEventId);
    expect(found).toBeDefined();
    expect(found?.resultMasteryMutationPlanId).toBe(plan.resultMasteryMutationPlanId);
  });

  it('should use evidence_only_no_change when existing mastery path is not found', async () => {
    const plan = await planService.createMasteryMutationPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultFinalizationDecisionId: 'decision-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safePlanSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    await planService.approvePlan(plan.resultMasteryMutationPlanId, 'admin-1', 'admin');
    const event = await mutationService.applyApprovedMasteryMutationPlan({
      schoolId: 'school-1', resultMasteryMutationPlanId: plan.resultMasteryMutationPlanId, actorId: 'actor-1', actorRole: 'admin', safeMutationSummary: 'Applied',
    });
    expect(event.mutationType).toBe('evidence_only_no_change');
    expect(event.deltaJson).toBeDefined();
  });

  it('should not change MarkingResultVersionRecord', async () => {
    const plan = await planService.createMasteryMutationPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultFinalizationDecisionId: 'decision-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safePlanSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    await planService.approvePlan(plan.resultMasteryMutationPlanId, 'admin-1', 'admin');
    const event = await mutationService.applyApprovedMasteryMutationPlan({
      schoolId: 'school-1', resultMasteryMutationPlanId: plan.resultMasteryMutationPlanId, actorId: 'actor-1', actorRole: 'admin', safeMutationSummary: 'Applied',
    });
    expect(event).not.toHaveProperty('score');
    expect(event.safeMutationSummary).toBeTruthy();
  });

  it('should not change scores', async () => {
    const plan = await planService.createMasteryMutationPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultFinalizationDecisionId: 'decision-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safePlanSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    await planService.approvePlan(plan.resultMasteryMutationPlanId, 'admin-1', 'admin');
    const event = await mutationService.applyApprovedMasteryMutationPlan({
      schoolId: 'school-1', resultMasteryMutationPlanId: plan.resultMasteryMutationPlanId, actorId: 'actor-1', actorRole: 'admin', safeMutationSummary: 'Applied',
    });
    expect(event).not.toHaveProperty('score');
    expect(event.mutationType).toBe('evidence_only_no_change');
  });

  it('should block student from applying mutation', async () => {
    const plan = await planService.createMasteryMutationPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultFinalizationDecisionId: 'decision-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safePlanSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    await planService.approvePlan(plan.resultMasteryMutationPlanId, 'admin-1', 'admin');
    await expect(mutationService.applyApprovedMasteryMutationPlan({
      schoolId: 'school-1', resultMasteryMutationPlanId: plan.resultMasteryMutationPlanId, actorId: 'student-1', actorRole: 'student', safeMutationSummary: 'Applied',
    })).rejects.toThrow('POLICY_BLOCKED');
  });

  it('should void mutation event', async () => {
    const plan = await planService.createMasteryMutationPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultFinalizationDecisionId: 'decision-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safePlanSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    await planService.approvePlan(plan.resultMasteryMutationPlanId, 'admin-1', 'admin');
    const event = await mutationService.applyApprovedMasteryMutationPlan({
      schoolId: 'school-1', resultMasteryMutationPlanId: plan.resultMasteryMutationPlanId, actorId: 'actor-1', actorRole: 'admin', safeMutationSummary: 'Applied',
    });
    const voided = await mutationService.voidMutationEvent(event.resultMasteryMutationEventId, 'admin');
    expect(voided?.mutationStatus).toBe('void');
  });

  it('should preview mutation', async () => {
    const plan = await planService.createMasteryMutationPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultFinalizationDecisionId: 'decision-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safePlanSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    const previewBeforeApproval = await mutationService.previewMasteryMutation(plan.resultMasteryMutationPlanId);
    expect(previewBeforeApproval.canApply).toBe(false);
    await planService.approvePlan(plan.resultMasteryMutationPlanId, 'admin-1', 'admin');
    const previewAfterApproval = await mutationService.previewMasteryMutation(plan.resultMasteryMutationPlanId);
    expect(previewAfterApproval.canApply).toBe(true);
  });
});
