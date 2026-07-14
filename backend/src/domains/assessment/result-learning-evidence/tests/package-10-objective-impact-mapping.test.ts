import { describe, it, expect, beforeEach } from 'vitest';
import { ObjectiveMasteryImpactService } from '../services/objectiveMasteryImpactService';
import { ResultLearningEvidencePolicyRegistry } from '../policies/resultLearningEvidencePolicyDefinitions';
import { InMemoryResultObjectiveMasteryImpactRepository } from '../repositories/inMemoryResultLearningEvidenceRepositories';

describe('Package 10 - Objective Impact Mapping', () => {
  let impactRepo: InMemoryResultObjectiveMasteryImpactRepository;
  let policyRegistry: ResultLearningEvidencePolicyRegistry;
  let service: ObjectiveMasteryImpactService;

  beforeEach(() => {
    impactRepo = new InMemoryResultObjectiveMasteryImpactRepository();
    policyRegistry = new ResultLearningEvidencePolicyRegistry();
    service = new ObjectiveMasteryImpactService(impactRepo, policyRegistry);
  });

  it('should map objective impact from result evidence', async () => {
    const impact = await service.mapObjectiveImpactsFromResult({
      schoolId: 'school-1',
      resultLearningEvidenceBridgeId: 'bridge-1',
      resultMasteryMutationPlanId: 'plan-1',
      studentRef: 'student-1',
      learningObjectiveId: 'obj-1',
      markingResultVersionId: 'version-1',
      impactType: 'correct_evidence',
      evidenceStrength: 'strong',
      masteryDelta: 'improved',
      confidenceLevel: 'high',
      safeImpactSummary: 'Student demonstrated mastery',
      actorId: 'actor-1',
      actorRole: 'teacher',
    });
    expect(impact).toBeDefined();
    expect(impact.resultObjectiveMasteryImpactId).toBeTruthy();
    expect(impact.learningObjectiveId).toBe('obj-1');
    expect(impact.impactStatus).toBe('draft');
  });

  it('should block missing learningObjectiveId', async () => {
    await expect(service.mapObjectiveImpactsFromResult({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultMasteryMutationPlanId: 'plan-1',
      studentRef: 'student-1', learningObjectiveId: '', markingResultVersionId: 'version-1', safeImpactSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    })).rejects.toThrow('VALIDATION_FAILED');
  });

  it('should block missing markingResultVersionId', async () => {
    await expect(service.mapObjectiveImpactsFromResult({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultMasteryMutationPlanId: 'plan-1',
      studentRef: 'student-1', learningObjectiveId: 'obj-1', markingResultVersionId: '', safeImpactSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    })).rejects.toThrow('VALIDATION_FAILED');
  });

  it('should block student role for mapping', async () => {
    await expect(service.mapObjectiveImpactsFromResult({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultMasteryMutationPlanId: 'plan-1',
      studentRef: 'student-1', learningObjectiveId: 'obj-1', markingResultVersionId: 'version-1', safeImpactSummary: 'test', actorId: 'student-1', actorRole: 'student',
    })).rejects.toThrow('POLICY_BLOCKED');
  });

  it('should link studentRef, learningObjectiveId, questionVersionId, markingResultVersionId', async () => {
    const impact = await service.mapObjectiveImpactsFromResult({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultMasteryMutationPlanId: 'plan-1',
      studentRef: 'student-1', learningObjectiveId: 'obj-1', questionVersionId: 'qv-1', markingResultVersionId: 'version-1',
      safeImpactSummary: 'Linked', actorId: 'actor-1', actorRole: 'teacher',
    });
    expect(impact.studentRef).toBe('student-1');
    expect(impact.learningObjectiveId).toBe('obj-1');
    expect(impact.questionVersionId).toBe('qv-1');
    expect(impact.markingResultVersionId).toBe('version-1');
  });

  it('should include evidence strength, confidence level, and safe summary', async () => {
    const impact = await service.mapObjectiveImpactsFromResult({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultMasteryMutationPlanId: 'plan-1',
      studentRef: 'student-1', learningObjectiveId: 'obj-1', markingResultVersionId: 'version-1',
      evidenceStrength: 'weak', confidenceLevel: 'low', safeImpactSummary: 'Partial evidence', actorId: 'actor-1', actorRole: 'teacher',
    });
    expect(impact.evidenceStrength).toBe('weak');
    expect(impact.confidenceLevel).toBe('low');
  });

  it('should not expose answer keys', async () => {
    const impact = await service.mapObjectiveImpactsFromResult({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultMasteryMutationPlanId: 'plan-1',
      studentRef: 'student-1', learningObjectiveId: 'obj-1', markingResultVersionId: 'version-1',
      safeImpactSummary: 'Safe', actorId: 'actor-1', actorRole: 'teacher',
    });
    expect(impact).not.toHaveProperty('answerKeyText');
    expect(impact).not.toHaveProperty('correctAnswerSummary');
  });

  it('should not expose raw rubrics', async () => {
    const impact = await service.mapObjectiveImpactsFromResult({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultMasteryMutationPlanId: 'plan-1',
      studentRef: 'student-1', learningObjectiveId: 'obj-1', markingResultVersionId: 'version-1',
      safeImpactSummary: 'Safe', actorId: 'actor-1', actorRole: 'teacher',
    });
    expect(impact).not.toHaveProperty('rawRubric');
    expect(impact).not.toHaveProperty('rubricInternal');
  });

  it('should list impacts for bridge', async () => {
    await service.mapObjectiveImpactsFromResult({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultMasteryMutationPlanId: 'plan-1',
      studentRef: 'student-1', learningObjectiveId: 'obj-1', markingResultVersionId: 'version-1',
      safeImpactSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    const impacts = await service.listObjectiveImpactsForBridge('bridge-1');
    expect(impacts.length).toBe(1);
  });

  it('should approve, block, and void impacts', async () => {
    const impact = await service.mapObjectiveImpactsFromResult({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultMasteryMutationPlanId: 'plan-1',
      studentRef: 'student-1', learningObjectiveId: 'obj-1', markingResultVersionId: 'version-1',
      safeImpactSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    const approved = await service.approveObjectiveImpact(impact.resultObjectiveMasteryImpactId, 'teacher');
    expect(approved?.impactStatus).toBe('approved');
    const blocked = await service.blockObjectiveImpact(impact.resultObjectiveMasteryImpactId, 'admin');
    expect(blocked?.impactStatus).toBe('blocked');
  });
});
