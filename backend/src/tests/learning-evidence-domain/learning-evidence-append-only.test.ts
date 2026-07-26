import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryLearningEvidenceEventStoreRepository } from '../../domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository';
import { LearningEvidencePrivacyGuard } from '../../domains/learning-evidence/services/learningEvidencePrivacyGuard';
import { LearningEvidenceCommandService } from '../../domains/learning-evidence/services/learningEvidenceCommandService';

describe('Append-Only', () => {
  let repo: InMemoryLearningEvidenceEventStoreRepository;
  let service: LearningEvidenceCommandService;

  beforeEach(() => {
    repo = new InMemoryLearningEvidenceEventStoreRepository();
    service = new LearningEvidenceCommandService(repo, new LearningEvidencePrivacyGuard());
  });

  it('sequence increments with each event', async () => {
    const r1 = await service.execute({
      commandType: 'CreateEvidenceCandidate', commandId: 'cmd-1',
      actor: { schoolId: 'school-1', actorId: 'learner-app-1', actorRole: 'student', learnerId: 'learner-app-1', requestId: 'req-1', correlationId: 'corr-1' },
      learnerId: 'learner-app-1', expectedStreamSequence: 0, idempotencyKey: 'idem-app-1', requestHash: 'hash',
      reasonCodes: ['independent_recall'], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-1',
      sourceLineage: { sourceType: 'tutor_attempt', sourceRecordId: 'r1', sourceVersion: '1.0', schoolId: 'school-1', learnerId: 'learner-app-1', occurredAt: new Date().toISOString(), outcome: 'correct', integrityState: 'clear', finalizationState: 'not_applicable', policyVersion: '1.0' },
      safePayload: { outcome: 'correct', independence: 'independent', evidenceMode: 'recall', confidenceState: 'high', integrityState: 'clear', finalizationState: 'not_applicable', sourceVersion: '1.0', eligibilityReasonCodes: [] },
    });
    expect(r1.success).toBe(true);
    const cid = (r1.data as any).evidenceCandidateId;

    const events = await repo.getEventsForLearner('school-1', 'learner-app-1');
    expect(events.length).toBe(1);
    expect(events[0].streamSequence).toBe(1);

    const r2 = await service.execute({
      commandType: 'StartEvidenceValidation', commandId: 'cmd-v', actor: { schoolId: 'school-1', actorId: 'teacher-1', actorRole: 'teacher', learnerId: 'learner-app-1', requestId: 'req-2', correlationId: 'corr-2' },
      learnerId: 'learner-app-1', evidenceCandidateId: cid, expectedStreamSequence: 1, idempotencyKey: 'idem-app-v1',
      requestHash: 'hash-v', reasonCodes: [], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-2',
    });
    expect(r2.success).toBe(true);

    const events2 = await repo.getEventsForLearner('school-1', 'learner-app-1');
    expect(events2.length).toBe(2);
    expect(events2[1].streamSequence).toBe(2);
  });

  it('existing events never mutate', async () => {
    const r1 = await service.execute({
      commandType: 'CreateEvidenceCandidate', commandId: 'cmd-1',
      actor: { schoolId: 'school-1', actorId: 'learner-app-2', actorRole: 'student', learnerId: 'learner-app-2', requestId: 'req-1', correlationId: 'corr-1' },
      learnerId: 'learner-app-2', expectedStreamSequence: 0, idempotencyKey: 'idem-app-2', requestHash: 'hash',
      reasonCodes: ['independent_recall'], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-1',
      sourceLineage: { sourceType: 'tutor_attempt', sourceRecordId: 'r2', sourceVersion: '1.0', schoolId: 'school-1', learnerId: 'learner-app-2', occurredAt: new Date().toISOString(), outcome: 'correct', integrityState: 'clear', finalizationState: 'not_applicable', policyVersion: '1.0' },
      safePayload: { outcome: 'correct', independence: 'independent', evidenceMode: 'recall', confidenceState: 'high', integrityState: 'clear', finalizationState: 'not_applicable', sourceVersion: '1.0', eligibilityReasonCodes: [] },
    });
    expect(r1.success).toBe(true);
    const cid = (r1.data as any).evidenceCandidateId;

    const events = await repo.getEventsForLearner('school-1', 'learner-app-2');
    const originalEventId = events[0].eventId;

    await service.execute({
      commandType: 'StartEvidenceValidation', commandId: 'cmd-v', actor: { schoolId: 'school-1', actorId: 'teacher-1', actorRole: 'teacher', learnerId: 'learner-app-2', requestId: 'req-2', correlationId: 'corr-2' },
      learnerId: 'learner-app-2', evidenceCandidateId: cid, expectedStreamSequence: 1, idempotencyKey: 'idem-app-v2',
      requestHash: 'hash-v', reasonCodes: [], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-2',
    });

    const events2 = await repo.getEventsForLearner('school-1', 'learner-app-2');
    expect(events2.length).toBe(2);
    expect(events2[0].eventId).toBe(originalEventId);
  });
});
