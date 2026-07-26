import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryLearningEvidenceEventStoreRepository } from '../../domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository';
import { LearningEvidencePrivacyGuard } from '../../domains/learning-evidence/services/learningEvidencePrivacyGuard';
import { LearningEvidenceCommandService } from '../../domains/learning-evidence/services/learningEvidenceCommandService';

describe('Idempotency', () => {
  let repo: InMemoryLearningEvidenceEventStoreRepository;
  let service: LearningEvidenceCommandService;

  beforeEach(() => {
    repo = new InMemoryLearningEvidenceEventStoreRepository();
    service = new LearningEvidenceCommandService(repo, new LearningEvidencePrivacyGuard());
  });

  it('same key + same hash returns original result', async () => {
    const key = `idem-${Date.now()}`;
    const cmd: any = { commandType: 'CreateEvidenceCandidate', commandId: 'cmd-1', actor: { schoolId: 'school-1', actorId: 'learner-idem-1', actorRole: 'student', learnerId: 'learner-idem-1', requestId: 'req-1', correlationId: 'corr-1' }, learnerId: 'learner-idem-1', expectedStreamSequence: 0, idempotencyKey: key, requestHash: 'same-hash', reasonCodes: ['independent_recall'], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-1', sourceLineage: { sourceType: 'tutor_attempt', sourceRecordId: 'r1', sourceVersion: '1.0', schoolId: 'school-1', learnerId: 'learner-idem-1', occurredAt: new Date().toISOString(), outcome: 'correct', integrityState: 'clear', finalizationState: 'not_applicable', policyVersion: '1.0' }, safePayload: { outcome: 'correct', independence: 'independent', evidenceMode: 'recall', confidenceState: 'high', integrityState: 'clear', finalizationState: 'not_applicable', sourceVersion: '1.0', eligibilityReasonCodes: [] } };
    const r1 = await service.execute(cmd);
    expect(r1.success).toBe(true);
    const r2 = await service.execute(cmd);
    expect(r2.success).toBe(true);
    expect(r2.data).toEqual(r1.data);
  });

  it('same key + different hash fails with conflict', async () => {
    const key = `idem-conflict-${Date.now()}`;
    const base: any = { commandType: 'CreateEvidenceCandidate', commandId: 'cmd-1', actor: { schoolId: 'school-1', actorId: 'learner-idem-2', actorRole: 'student', learnerId: 'learner-idem-2', requestId: 'req-1', correlationId: 'corr-1' }, learnerId: 'learner-idem-2', expectedStreamSequence: 0, idempotencyKey: key, reasonCodes: ['independent_recall'], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-1', sourceLineage: { sourceType: 'tutor_attempt', sourceRecordId: 'r2', sourceVersion: '1.0', schoolId: 'school-1', learnerId: 'learner-idem-2', occurredAt: new Date().toISOString(), outcome: 'correct', integrityState: 'clear', finalizationState: 'not_applicable', policyVersion: '1.0' }, safePayload: { outcome: 'correct', independence: 'independent', evidenceMode: 'recall', confidenceState: 'high', integrityState: 'clear', finalizationState: 'not_applicable', sourceVersion: '1.0', eligibilityReasonCodes: [] } };
    const r1 = await service.execute({ ...base, requestHash: 'hash-A' });
    expect(r1.success).toBe(true);
    const r2 = await service.execute({ ...base, requestHash: 'hash-B' });
    expect(r2.success).toBe(false);
    expect(r2.error?.code).toBe('EVIDENCE_IDEMPOTENCY_CONFLICT');
  });
});
