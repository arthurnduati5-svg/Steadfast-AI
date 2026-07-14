import { describe, it, expect, beforeEach } from 'vitest';
import { ResultEvidenceBridgeService } from '../services/resultEvidenceBridgeService';
import { ResultLearningEvidencePolicyRegistry } from '../policies/resultLearningEvidencePolicyDefinitions';
import { InMemoryResultLearningEvidenceBridgeRepository } from '../repositories/inMemoryResultLearningEvidenceRepositories';

describe('Package 10 - Finalized Result Intake', () => {
  let bridgeRepo: InMemoryResultLearningEvidenceBridgeRepository;
  let policyRegistry: ResultLearningEvidencePolicyRegistry;
  let service: ResultEvidenceBridgeService;

  beforeEach(() => {
    bridgeRepo = new InMemoryResultLearningEvidenceBridgeRepository();
    policyRegistry = new ResultLearningEvidencePolicyRegistry();
    service = new ResultEvidenceBridgeService(bridgeRepo, policyRegistry);
  });

  it('should create evidence bridge from finalized result', async () => {
    const bridge = await service.createEvidenceBridgeFromFinalizedResult({
      schoolId: 'school-1',
      resultFinalizationDecisionId: 'decision-1',
      resultReleaseReadinessId: 'readiness-1',
      markingResultVersionId: 'version-1',
      studentRef: 'student-1',
      safeEvidenceSummary: 'Evidence summary',
      actorId: 'actor-1',
      actorRole: 'teacher',
    }, 'corr-1');
    expect(bridge).toBeDefined();
    expect(bridge.resultLearningEvidenceBridgeId).toBeTruthy();
    expect(bridge.schoolId).toBe('school-1');
    expect(bridge.bridgeStatus).toBe('draft');
    expect(bridge.resultFinalizationDecisionId).toBe('decision-1');
    expect(bridge.markingResultVersionId).toBe('version-1');
    expect(bridge.studentRef).toBe('student-1');
  });

  it('should block missing schoolId', async () => {
    await expect(service.createEvidenceBridgeFromFinalizedResult({
      schoolId: '',
      resultFinalizationDecisionId: 'decision-1',
      resultReleaseReadinessId: 'readiness-1',
      markingResultVersionId: 'version-1',
      studentRef: 'student-1',
      safeEvidenceSummary: 'test',
      actorId: 'actor-1',
      actorRole: 'teacher',
    }, 'corr-1')).rejects.toThrow('SCHOOL_CONTEXT_REQUIRED');
  });

  it('should block missing resultFinalizationDecisionId', async () => {
    await expect(service.createEvidenceBridgeFromFinalizedResult({
      schoolId: 'school-1',
      resultFinalizationDecisionId: '',
      resultReleaseReadinessId: 'readiness-1',
      markingResultVersionId: 'version-1',
      studentRef: 'student-1',
      safeEvidenceSummary: 'test',
      actorId: 'actor-1',
      actorRole: 'teacher',
    }, 'corr-1')).rejects.toThrow('VALIDATION_FAILED');
  });

  it('should block missing markingResultVersionId', async () => {
    await expect(service.createEvidenceBridgeFromFinalizedResult({
      schoolId: 'school-1',
      resultFinalizationDecisionId: 'decision-1',
      resultReleaseReadinessId: 'readiness-1',
      markingResultVersionId: '',
      studentRef: 'student-1',
      safeEvidenceSummary: 'test',
      actorId: 'actor-1',
      actorRole: 'teacher',
    }, 'corr-1')).rejects.toThrow('VALIDATION_FAILED');
  });

  it('should block student role for intake', async () => {
    await expect(service.createEvidenceBridgeFromFinalizedResult({
      schoolId: 'school-1',
      resultFinalizationDecisionId: 'decision-1',
      resultReleaseReadinessId: 'readiness-1',
      markingResultVersionId: 'version-1',
      studentRef: 'student-1',
      safeEvidenceSummary: 'test',
      actorId: 'student-1',
      actorRole: 'student',
    }, 'corr-1')).rejects.toThrow('POLICY_BLOCKED');
  });

  it('should run source integrity checks', async () => {
    const bridge = await service.createEvidenceBridgeFromFinalizedResult({
      schoolId: 'school-1', resultFinalizationDecisionId: 'decision-1', resultReleaseReadinessId: 'readiness-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safeEvidenceSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    }, 'corr-1');
    const result = await service.runSourceIntegrityChecks(bridge.resultLearningEvidenceBridgeId, 'teacher');
    expect(result.allChecksPassed).toBe(true);
  });

  it('should mark bridge ready for mapping', async () => {
    const bridge = await service.createEvidenceBridgeFromFinalizedResult({
      schoolId: 'school-1', resultFinalizationDecisionId: 'decision-1', resultReleaseReadinessId: 'readiness-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safeEvidenceSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    }, 'corr-1');
    const updated = await service.markBridgeReadyForMapping(bridge.resultLearningEvidenceBridgeId, 'teacher');
    expect(updated?.bridgeStatus).toBe('ready_for_mapping');
  });

  it('should block bridge', async () => {
    const bridge = await service.createEvidenceBridgeFromFinalizedResult({
      schoolId: 'school-1', resultFinalizationDecisionId: 'decision-1', resultReleaseReadinessId: 'readiness-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safeEvidenceSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    }, 'corr-1');
    const updated = await service.blockEvidenceBridge(bridge.resultLearningEvidenceBridgeId, 'teacher');
    expect(updated?.bridgeStatus).toBe('blocked');
  });

  it('should cancel bridge', async () => {
    const bridge = await service.createEvidenceBridgeFromFinalizedResult({
      schoolId: 'school-1', resultFinalizationDecisionId: 'decision-1', resultReleaseReadinessId: 'readiness-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safeEvidenceSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    }, 'corr-1');
    const updated = await service.cancelEvidenceBridge(bridge.resultLearningEvidenceBridgeId, 'teacher');
    expect(updated?.bridgeStatus).toBe('cancelled');
  });

  it('should complete bridge', async () => {
    const bridge = await service.createEvidenceBridgeFromFinalizedResult({
      schoolId: 'school-1', resultFinalizationDecisionId: 'decision-1', resultReleaseReadinessId: 'readiness-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safeEvidenceSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    }, 'corr-1');
    const updated = await service.completeEvidenceBridge(bridge.resultLearningEvidenceBridgeId, 'teacher');
    expect(updated?.bridgeStatus).toBe('completed');
  });

  it('should list bridges for school', async () => {
    await service.createEvidenceBridgeFromFinalizedResult({
      schoolId: 'school-1', resultFinalizationDecisionId: 'decision-1', resultReleaseReadinessId: 'readiness-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safeEvidenceSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    }, 'corr-1');
    const bridges = await service.listEvidenceBridgesForSchool('school-1');
    expect(bridges.length).toBe(1);
  });

  it('should not change scores or release results', async () => {
    const bridge = await service.createEvidenceBridgeFromFinalizedResult({
      schoolId: 'school-1', resultFinalizationDecisionId: 'decision-1', resultReleaseReadinessId: 'readiness-1',
      markingResultVersionId: 'version-1', studentRef: 'student-1', safeEvidenceSummary: 'test', actorId: 'actor-1', actorRole: 'teacher',
    }, 'corr-1');
    expect(bridge).not.toHaveProperty('score');
    expect(bridge).not.toHaveProperty('parentDeliveryPayload');
    expect(bridge).not.toHaveProperty('reportCardPayload');
  });
});
