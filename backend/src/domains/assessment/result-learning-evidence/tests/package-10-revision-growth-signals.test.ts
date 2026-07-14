import { describe, it, expect, beforeEach } from 'vitest';
import { RevisionSignalDispatchService } from '../services/revisionSignalDispatchService';
import { GrowthSignalDispatchService } from '../services/growthSignalDispatchService';
import { ResultLearningEvidencePolicyRegistry } from '../policies/resultLearningEvidencePolicyDefinitions';
import {
  InMemoryResultRevisionSignalRepository,
  InMemoryResultGrowthSignalRepository,
} from '../repositories/inMemoryResultLearningEvidenceRepositories';

describe('Package 10 - Revision and Growth Signals', () => {
  let revisionRepo: InMemoryResultRevisionSignalRepository;
  let growthRepo: InMemoryResultGrowthSignalRepository;
  let policyRegistry: ResultLearningEvidencePolicyRegistry;
  let revisionService: RevisionSignalDispatchService;
  let growthService: GrowthSignalDispatchService;

  beforeEach(() => {
    revisionRepo = new InMemoryResultRevisionSignalRepository();
    growthRepo = new InMemoryResultGrowthSignalRepository();
    policyRegistry = new ResultLearningEvidencePolicyRegistry();
    revisionService = new RevisionSignalDispatchService(revisionRepo, policyRegistry);
    growthService = new GrowthSignalDispatchService(growthRepo, policyRegistry);
  });

  it('should create revision signal', async () => {
    const signal = await revisionService.createRevisionSignalsFromPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultMasteryMutationPlanId: 'plan-1',
      studentRef: 'student-1', learningObjectiveId: 'obj-1', safeSignalSummary: 'Needs revision', actorId: 'actor-1', actorRole: 'teacher',
    });
    expect(signal).toBeDefined();
    expect(signal.resultRevisionSignalId).toBeTruthy();
    expect(signal.signalStatus).toBe('draft');
  });

  it('should create growth signal', async () => {
    const signal = await growthService.createGrowthSignalsFromPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultMasteryMutationPlanId: 'plan-1',
      studentRef: 'student-1', learningObjectiveId: 'obj-1', safeGrowthSummary: 'Growth detected', actorId: 'actor-1', actorRole: 'teacher',
    });
    expect(signal).toBeDefined();
    expect(signal.resultGrowthSignalId).toBeTruthy();
    expect(signal.signalStatus).toBe('draft');
  });

  it('should mark revision signal ready', async () => {
    const signal = await revisionService.createRevisionSignalsFromPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultMasteryMutationPlanId: 'plan-1',
      studentRef: 'student-1', learningObjectiveId: 'obj-1', safeSignalSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    const ready = await revisionService.markRevisionSignalReady(signal.resultRevisionSignalId, 'teacher');
    expect(ready?.signalStatus).toBe('ready');
  });

  it('should mark growth signal ready', async () => {
    const signal = await growthService.createGrowthSignalsFromPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultMasteryMutationPlanId: 'plan-1',
      studentRef: 'student-1', learningObjectiveId: 'obj-1', safeGrowthSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    const ready = await growthService.markGrowthSignalReady(signal.resultGrowthSignalId, 'teacher');
    expect(ready?.signalStatus).toBe('ready');
  });

  it('should dispatch revision signal when ready', async () => {
    const signal = await revisionService.createRevisionSignalsFromPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultMasteryMutationPlanId: 'plan-1',
      studentRef: 'student-1', learningObjectiveId: 'obj-1', safeSignalSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    await revisionService.markRevisionSignalReady(signal.resultRevisionSignalId, 'teacher');
    const dispatched = await revisionService.dispatchRevisionSignal(signal.resultRevisionSignalId, 'teacher');
    expect(dispatched?.signalStatus).toBe('dispatched');
  });

  it('should dispatch growth signal when ready', async () => {
    const signal = await growthService.createGrowthSignalsFromPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultMasteryMutationPlanId: 'plan-1',
      studentRef: 'student-1', learningObjectiveId: 'obj-1', safeGrowthSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    await growthService.markGrowthSignalReady(signal.resultGrowthSignalId, 'teacher');
    const dispatched = await growthService.dispatchGrowthSignal(signal.resultGrowthSignalId, 'teacher');
    expect(dispatched?.signalStatus).toBe('dispatched');
  });

  it('should block revision signal dispatch if not ready', async () => {
    const signal = await revisionService.createRevisionSignalsFromPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultMasteryMutationPlanId: 'plan-1',
      studentRef: 'student-1', learningObjectiveId: 'obj-1', safeSignalSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    const result = await revisionService.dispatchRevisionSignal(signal.resultRevisionSignalId, 'teacher');
    expect(result?.signalStatus).toBe('blocked');
  });

  it('should not mutate frontend growth page directly', async () => {
    const signal = await growthService.createGrowthSignalsFromPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultMasteryMutationPlanId: 'plan-1',
      studentRef: 'student-1', learningObjectiveId: 'obj-1', safeGrowthSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    expect(signal).not.toHaveProperty('frontendPayload');
    expect(signal).not.toHaveProperty('parentSummary');
  });

  it('should not create parent summary', async () => {
    const signal = await growthService.createGrowthSignalsFromPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultMasteryMutationPlanId: 'plan-1',
      studentRef: 'student-1', learningObjectiveId: 'obj-1', safeGrowthSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    expect(signal).not.toHaveProperty('parentSummary');
  });

  it('should not send notification', async () => {
    const signal = await revisionService.createRevisionSignalsFromPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultMasteryMutationPlanId: 'plan-1',
      studentRef: 'student-1', learningObjectiveId: 'obj-1', safeSignalSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    expect(signal).not.toHaveProperty('notificationSent');
    expect(signal).not.toHaveProperty('emailSent');
  });

  it('should not create report card', async () => {
    const signal = await growthService.createGrowthSignalsFromPlan({
      schoolId: 'school-1', resultLearningEvidenceBridgeId: 'bridge-1', resultMasteryMutationPlanId: 'plan-1',
      studentRef: 'student-1', learningObjectiveId: 'obj-1', safeGrowthSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    });
    expect(signal).not.toHaveProperty('reportCard');
  });
});
