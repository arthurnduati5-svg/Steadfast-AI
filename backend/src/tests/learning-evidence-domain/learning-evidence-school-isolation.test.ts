import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryLearningEvidenceEventStoreRepository } from '../../domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository';
import { LearningEvidencePrivacyGuard } from '../../domains/learning-evidence/services/learningEvidencePrivacyGuard';
import { LearningEvidenceCommandService } from '../../domains/learning-evidence/services/learningEvidenceCommandService';

describe('School Isolation', () => {
  let repo: InMemoryLearningEvidenceEventStoreRepository;
  let service: LearningEvidenceCommandService;

  beforeEach(() => {
    repo = new InMemoryLearningEvidenceEventStoreRepository();
    service = new LearningEvidenceCommandService(repo, new LearningEvidencePrivacyGuard());
  });

  function candidateCmd(schoolId: string, learnerId: string, key: string): any {
    return { commandType: 'CreateEvidenceCandidate' as const, commandId: `cmd-${key}`, actor: { schoolId, actorId: learnerId, actorRole: 'student', learnerId, requestId: 'req-1', correlationId: 'corr-1' }, learnerId, expectedStreamSequence: 0, idempotencyKey: key, requestHash: 'hash', reasonCodes: ['independent_recall'], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-1', sourceLineage: { sourceType: 'tutor_attempt', sourceRecordId: 'r1', sourceVersion: '1.0', schoolId, learnerId, occurredAt: new Date().toISOString(), outcome: 'correct', integrityState: 'clear', finalizationState: 'not_applicable', policyVersion: '1.0' }, safePayload: { outcome: 'correct', independence: 'independent', evidenceMode: 'recall', confidenceState: 'high', integrityState: 'clear', finalizationState: 'not_applicable', sourceVersion: '1.0', eligibilityReasonCodes: [] } };
  }

  it('events in school-A not visible in school-B', async () => {
    await service.execute(candidateCmd('school-A', 'learner-iso-1', 'idem-iso-1'));
    const eventsA = await repo.getEventsForLearner('school-A', 'learner-iso-1');
    const eventsB = await repo.getEventsForLearner('school-B', 'learner-iso-1');
    expect(eventsA.length).toBe(1);
    expect(eventsB.length).toBe(0);
  });

  it('cross-school operation on candidate not found', async () => {
    const r1 = await service.execute(candidateCmd('school-A', 'learner-iso-2', 'idem-iso-2'));
    expect(r1.success).toBe(true);
    const cid = (r1.data as any).evidenceCandidateId;

    const r2 = await service.execute({ commandType: 'StartEvidenceValidation', commandId: 'cmd-v', actor: { schoolId: 'school-B', actorId: 'teacher-1', actorRole: 'teacher', learnerId: 'learner-iso-2', requestId: 'req-2', correlationId: 'corr-2' }, learnerId: 'learner-iso-2', evidenceCandidateId: cid, expectedStreamSequence: 0, idempotencyKey: 'idem-iso-2b', requestHash: 'hash-v', reasonCodes: [], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-2' });
    expect(r2.success).toBe(false);
    expect(r2.error?.code).toBe('EVIDENCE_NOT_FOUND');
  });

  it('same learner in different schools have separate streams', async () => {
    const r1 = await service.execute(candidateCmd('school-A', 'learner-iso-3', 'idem-iso-3a'));
    const r2 = await service.execute(candidateCmd('school-B', 'learner-iso-3', 'idem-iso-3b'));
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    const streamA = await repo.getStream('school-A', 'evidence_school-A_learner-iso-3');
    const streamB = await repo.getStream('school-B', 'evidence_school-B_learner-iso-3');
    expect(streamA).not.toBeNull();
    expect(streamB).not.toBeNull();
  });
});
