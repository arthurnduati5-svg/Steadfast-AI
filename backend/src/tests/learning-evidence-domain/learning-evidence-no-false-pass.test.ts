import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryLearningEvidenceEventStoreRepository } from '../../domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository';
import { LearningEvidencePrivacyGuard } from '../../domains/learning-evidence/services/learningEvidencePrivacyGuard';
import { LearningEvidenceCommandService } from '../../domains/learning-evidence/services/learningEvidenceCommandService';

describe('No False Pass', () => {
  let repo: InMemoryLearningEvidenceEventStoreRepository;
  let service: LearningEvidenceCommandService;

  beforeEach(() => {
    repo = new InMemoryLearningEvidenceEventStoreRepository();
    service = new LearningEvidenceCommandService(repo, new LearningEvidencePrivacyGuard());
  });

  it('rejects empty school context', async () => {
    const result = await service.execute({
      commandType: 'CreateEvidenceCandidate', commandId: 'cmd-1',
      actor: { schoolId: '', actorId: 'actor-1', actorRole: 'student', learnerId: 'learner-1', requestId: 'req-1', correlationId: 'corr-1' },
      learnerId: 'learner-1', expectedStreamSequence: 0, idempotencyKey: 'idem-fp-1', requestHash: 'hash',
      reasonCodes: ['independent_recall'], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-1',
    } as any);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('EVIDENCE_SCHOOL_CONTEXT_REQUIRED');
  });

  it('does not create events on validation failure', async () => {
    await service.execute({
      commandType: 'CreateEvidenceCandidate', commandId: 'cmd-1',
      actor: { schoolId: '', actorId: 'actor-1', actorRole: 'student', learnerId: 'learner-2', requestId: 'req-1', correlationId: 'corr-1' },
      learnerId: 'learner-2', expectedStreamSequence: 0, idempotencyKey: 'idem-fp-2', requestHash: 'hash',
      reasonCodes: ['independent_recall'], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-1',
    } as any);
    const events = await repo.getEventsForLearner('', 'learner-2');
    expect(events.length).toBe(0);
  });

  it('rejects non-existent candidate operations', async () => {
    const result = await service.execute({
      commandType: 'StartEvidenceValidation', commandId: 'cmd-none', actor: { schoolId: 'school-1', actorId: 'teacher-1', actorRole: 'teacher', learnerId: 'learner-none', requestId: 'req-1', correlationId: 'corr-1' },
      learnerId: 'learner-none', evidenceCandidateId: 'non-existent', expectedStreamSequence: 0, idempotencyKey: 'idem-none-1',
      requestHash: 'hash', reasonCodes: [], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-1',
    });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('EVIDENCE_NOT_FOUND');
  });

  it('rejects invalid transition: candidate directly to committed', async () => {
    const r1 = await service.execute({
      commandType: 'CreateEvidenceCandidate', commandId: 'cmd-1',
      actor: { schoolId: 'school-1', actorId: 'learner-skip', actorRole: 'student', learnerId: 'learner-skip', requestId: 'req-1', correlationId: 'corr-1' },
      learnerId: 'learner-skip', expectedStreamSequence: 0, idempotencyKey: 'idem-skip-1', requestHash: 'hash',
      reasonCodes: ['independent_recall'], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-1',
      sourceLineage: { sourceType: 'tutor_attempt', sourceRecordId: 'r1', sourceVersion: '1.0', schoolId: 'school-1', learnerId: 'learner-skip', occurredAt: new Date().toISOString(), outcome: 'correct', integrityState: 'clear', finalizationState: 'not_applicable', policyVersion: '1.0' },
      safePayload: { outcome: 'correct', independence: 'independent', evidenceMode: 'recall', confidenceState: 'high', integrityState: 'clear', finalizationState: 'not_applicable', sourceVersion: '1.0', eligibilityReasonCodes: [] },
    });
    expect(r1.success).toBe(true);
    const cid = (r1.data as any).evidenceCandidateId;

    const r2 = await service.execute({
      commandType: 'CommitLearningEvidence', commandId: 'cmd-skip', actor: { schoolId: 'school-1', actorId: 'teacher-1', actorRole: 'teacher', learnerId: 'learner-skip', requestId: 'req-2', correlationId: 'corr-2' },
      learnerId: 'learner-skip', evidenceCandidateId: cid, expectedStreamSequence: 0, idempotencyKey: 'idem-skip-2',
      requestHash: 'hash-skip', reasonCodes: ['mastery_demonstrated'], policyVersion: '1.0',
      occurredAt: new Date().toISOString(), correlationId: 'corr-2',
    });
    expect(r2.success).toBe(false);
    expect(r2.error?.code).toBe('EVIDENCE_INVALID_TRANSITION');
  });
});
