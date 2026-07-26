import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryLearningEvidenceEventStoreRepository } from '../../domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository';
import { LearningEvidencePrivacyGuard } from '../../domains/learning-evidence/services/learningEvidencePrivacyGuard';
import { LearningEvidenceCommandService } from '../../domains/learning-evidence/services/learningEvidenceCommandService';

describe('Optimistic Concurrency', () => {
  let repo: InMemoryLearningEvidenceEventStoreRepository;
  let service: LearningEvidenceCommandService;

  beforeEach(() => {
    repo = new InMemoryLearningEvidenceEventStoreRepository();
    service = new LearningEvidenceCommandService(repo, new LearningEvidencePrivacyGuard());
  });

  it('succeeds with expectedStreamSequence=0 for new stream', async () => {
    const cmd: any = { commandType: 'CreateEvidenceCandidate', commandId: 'cmd-1', actor: { schoolId: 'school-1', actorId: 'learner-con-1', actorRole: 'student', learnerId: 'learner-con-1', requestId: 'req-1', correlationId: 'corr-1' }, learnerId: 'learner-con-1', expectedStreamSequence: 0, idempotencyKey: `idem-con-${Date.now()}`, requestHash: 'hash', reasonCodes: ['independent_recall'], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-1', sourceLineage: { sourceType: 'tutor_attempt', sourceRecordId: 'r1', sourceVersion: '1.0', schoolId: 'school-1', learnerId: 'learner-con-1', occurredAt: new Date().toISOString(), outcome: 'correct', integrityState: 'clear', finalizationState: 'not_applicable', policyVersion: '1.0' }, safePayload: { outcome: 'correct', independence: 'independent', evidenceMode: 'recall', confidenceState: 'high', integrityState: 'clear', finalizationState: 'not_applicable', sourceVersion: '1.0', eligibilityReasonCodes: [] } };
    const r = await service.execute(cmd);
    expect(r.success).toBe(true);
  });

  it('fails with wrong expectedStreamSequence for validation after create', async () => {
    const r1 = await service.execute({ ...({ commandType: 'CreateEvidenceCandidate', commandId: 'cmd-1', actor: { schoolId: 'school-1', actorId: 'learner-con-2', actorRole: 'student', learnerId: 'learner-con-2', requestId: 'req-1', correlationId: 'corr-1' }, learnerId: 'learner-con-2', expectedStreamSequence: 0, idempotencyKey: `idem-con2-a-${Date.now()}`, requestHash: 'hash', reasonCodes: ['independent_recall'], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-1', sourceLineage: { sourceType: 'tutor_attempt', sourceRecordId: 'r2', sourceVersion: '1.0', schoolId: 'school-1', learnerId: 'learner-con-2', occurredAt: new Date().toISOString(), outcome: 'correct', integrityState: 'clear', finalizationState: 'not_applicable', policyVersion: '1.0' }, safePayload: { outcome: 'correct', independence: 'independent', evidenceMode: 'recall', confidenceState: 'high', integrityState: 'clear', finalizationState: 'not_applicable', sourceVersion: '1.0', eligibilityReasonCodes: [] } } as any) });
    expect(r1.success).toBe(true);
    const cid = (r1.data as any).evidenceCandidateId;

    const r2 = await service.execute({ commandType: 'StartEvidenceValidation', commandId: 'cmd-v', actor: { schoolId: 'school-1', actorId: 'teacher-1', actorRole: 'teacher', learnerId: 'learner-con-2', requestId: 'req-2', correlationId: 'corr-2' }, learnerId: 'learner-con-2', evidenceCandidateId: cid, expectedStreamSequence: 5, idempotencyKey: `idem-con2-b-${Date.now()}`, requestHash: 'hash-v', reasonCodes: [], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-2' });
    expect(r2.success).toBe(false);
    expect(r2.error?.code).toBe('EVIDENCE_STREAM_CONCURRENCY_CONFLICT');
  });
});
