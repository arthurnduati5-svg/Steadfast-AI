import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryLearningEvidenceEventStoreRepository } from '../../domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository';
import { LearningEvidencePrivacyGuard } from '../../domains/learning-evidence/services/learningEvidencePrivacyGuard';
import { LearningEvidenceCommandService } from '../../domains/learning-evidence/services/learningEvidenceCommandService';

describe('Atomicity', () => {
  let repo: InMemoryLearningEvidenceEventStoreRepository;
  let service: LearningEvidenceCommandService;

  beforeEach(() => {
    repo = new InMemoryLearningEvidenceEventStoreRepository();
    service = new LearningEvidenceCommandService(repo, new LearningEvidencePrivacyGuard());
  });

  it('candidate creation creates event + stream + projection consistently', async () => {
    const r1 = await service.execute({
      commandType: 'CreateEvidenceCandidate', commandId: 'cmd-1',
      actor: { schoolId: 'school-1', actorId: 'learner-atom-1', actorRole: 'student', learnerId: 'learner-atom-1', requestId: 'req-1', correlationId: 'corr-1' },
      learnerId: 'learner-atom-1', expectedStreamSequence: 0, idempotencyKey: 'idem-atom-1', requestHash: 'hash',
      reasonCodes: ['independent_recall'], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-1',
      sourceLineage: { sourceType: 'tutor_attempt', sourceRecordId: 'r1', sourceVersion: '1.0', schoolId: 'school-1', learnerId: 'learner-atom-1', occurredAt: new Date().toISOString(), outcome: 'correct', integrityState: 'clear', finalizationState: 'not_applicable', policyVersion: '1.0' },
      safePayload: { outcome: 'correct', independence: 'independent', evidenceMode: 'recall', confidenceState: 'high', integrityState: 'clear', finalizationState: 'not_applicable', sourceVersion: '1.0', eligibilityReasonCodes: [] },
    });
    expect(r1.success).toBe(true);
    const cid = (r1.data as any).evidenceCandidateId;

    const stream = await repo.getStream('school-1', 'evidence_school-1_learner-atom-1');
    expect(stream).not.toBeNull();
    expect(stream!.currentSequence).toBe(1);

    const events = await repo.getEventsForLearner('school-1', 'learner-atom-1');
    expect(events.length).toBe(1);

    const projection = await repo.getCandidateProjection('school-1', cid);
    expect(projection).not.toBeNull();
  });

  it('rejected command does not create partial state', async () => {
    const r1 = await service.execute({
      commandType: 'CreateEvidenceCandidate', commandId: 'cmd-1',
      actor: { schoolId: 'school-1', actorId: 'learner-atom-2', actorRole: 'student', learnerId: 'learner-atom-2', requestId: 'req-1', correlationId: 'corr-1' },
      learnerId: 'learner-atom-2', expectedStreamSequence: 0, idempotencyKey: 'idem-atom-2', requestHash: 'hash',
      reasonCodes: ['independent_recall'], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-1',
      sourceLineage: { sourceType: 'tutor_attempt', sourceRecordId: 'r2', sourceVersion: '1.0', schoolId: 'school-1', learnerId: 'learner-atom-2', occurredAt: new Date().toISOString(), outcome: 'correct', integrityState: 'clear', finalizationState: 'not_applicable', policyVersion: '1.0' },
      safePayload: { outcome: 'correct', independence: 'independent', evidenceMode: 'recall', confidenceState: 'high', integrityState: 'clear', finalizationState: 'not_applicable', sourceVersion: '1.0', eligibilityReasonCodes: [] },
    });
    expect(r1.success).toBe(true);
    const cid = (r1.data as any).evidenceCandidateId;

    const r2 = await service.execute({
      commandType: 'MarkEvidenceUsable', commandId: 'cmd-bad', actor: { schoolId: 'school-1', actorId: 'teacher-1', actorRole: 'teacher', learnerId: 'learner-atom-2', requestId: 'req-2', correlationId: 'corr-2' },
      learnerId: 'learner-atom-2', evidenceCandidateId: cid, expectedStreamSequence: 0, idempotencyKey: 'idem-atom-2b',
      requestHash: 'hash-bad', reasonCodes: [], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-2',
    });
    expect(r2.success).toBe(false);

    const events = await repo.getEventsForLearner('school-1', 'learner-atom-2');
    expect(events.length).toBe(1);
  });
});
