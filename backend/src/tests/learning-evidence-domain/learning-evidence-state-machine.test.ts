import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryLearningEvidenceEventStoreRepository } from '../../domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository';
import { LearningEvidencePrivacyGuard } from '../../domains/learning-evidence/services/learningEvidencePrivacyGuard';
import { LearningEvidenceCommandService } from '../../domains/learning-evidence/services/learningEvidenceCommandService';
import type { EvidenceCommand } from '../../domains/learning-evidence/contracts/learningEvidenceCommandContracts';

function makeCreateCandidate(learnerId: string, schoolId: string): any {
  return {
    commandType: 'CreateEvidenceCandidate',
    commandId: `cmd-${Date.now()}-${Math.random()}`,
    actor: { schoolId, actorId: learnerId, actorRole: 'student', learnerId, requestId: 'req-1', correlationId: 'corr-1' },
    learnerId,
    expectedStreamSequence: 0,
    idempotencyKey: `idem-${Date.now()}-${Math.random()}`,
    requestHash: 'hash',
    reasonCodes: ['independent_recall'],
    policyVersion: '1.0',
    occurredAt: new Date().toISOString(),
    correlationId: 'corr-1',
    sourceLineage: {
      sourceType: 'tutor_attempt', sourceRecordId: 'rec-1', sourceVersion: '1.0', schoolId, learnerId,
      occurredAt: new Date().toISOString(), outcome: 'correct', integrityState: 'clear', finalizationState: 'not_applicable', policyVersion: '1.0',
    },
    safePayload: {
      outcome: 'correct', independence: 'independent', evidenceMode: 'recall',
      confidenceState: 'high', integrityState: 'clear', finalizationState: 'not_applicable',
      sourceVersion: '1.0', eligibilityReasonCodes: [],
    },
  };
}

describe('Learning Evidence State Machine', () => {
  let repo: InMemoryLearningEvidenceEventStoreRepository;
  let service: LearningEvidenceCommandService;

  beforeEach(() => {
    repo = new InMemoryLearningEvidenceEventStoreRepository();
    service = new LearningEvidenceCommandService(repo, new LearningEvidencePrivacyGuard());
  });

  it('full happy path: candidate → validating → usable → committed', async () => {
    const r1 = await service.execute(makeCreateCandidate('learner-sm-1', 'school-1'));
    expect(r1.success).toBe(true);
    const cid = (r1.data as any).evidenceCandidateId;

    const r2 = await service.execute({
      commandType: 'StartEvidenceValidation',
      commandId: 'cmd-v', actor: { schoolId: 'school-1', actorId: 'teacher-1', actorRole: 'teacher', learnerId: 'learner-sm-1', requestId: 'req-2', correlationId: 'corr-2' },
      learnerId: 'learner-sm-1', evidenceCandidateId: cid, expectedStreamSequence: 1, idempotencyKey: `idem-v-${Date.now()}`,
      requestHash: 'hash-v', reasonCodes: [], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-2',
    });
    expect(r2.success).toBe(true);

    const r3 = await service.execute({
      commandType: 'MarkEvidenceUsable', commandId: 'cmd-u', actor: { schoolId: 'school-1', actorId: 'teacher-1', actorRole: 'teacher', learnerId: 'learner-sm-1', requestId: 'req-3', correlationId: 'corr-3' },
      learnerId: 'learner-sm-1', evidenceCandidateId: cid, expectedStreamSequence: 2, idempotencyKey: `idem-u-${Date.now()}`,
      requestHash: 'hash-u', reasonCodes: [], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-3',
    });
    expect(r3.success).toBe(true);

    const r4 = await service.execute({
      commandType: 'CommitLearningEvidence', commandId: 'cmd-c', actor: { schoolId: 'school-1', actorId: 'teacher-1', actorRole: 'teacher', learnerId: 'learner-sm-1', requestId: 'req-4', correlationId: 'corr-4' },
      learnerId: 'learner-sm-1', evidenceCandidateId: cid, expectedStreamSequence: 3, idempotencyKey: `idem-c-${Date.now()}`,
      requestHash: 'hash-c', reasonCodes: ['mastery_demonstrated'], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-4',
    });
    expect(r4.success).toBe(true);
  });

  it('candidate → validating → ineligible', async () => {
    const r1 = await service.execute(makeCreateCandidate('learner-sm-2', 'school-1'));
    expect(r1.success).toBe(true);
    const cid = (r1.data as any).evidenceCandidateId;

    await service.execute({ commandType: 'StartEvidenceValidation', commandId: 'cmd-v', actor: { schoolId: 'school-1', actorId: 'teacher-1', actorRole: 'teacher', learnerId: 'learner-sm-2', requestId: 'req-1', correlationId: 'corr-1' }, learnerId: 'learner-sm-2', evidenceCandidateId: cid, expectedStreamSequence: 1, idempotencyKey: `idem-v2-${Date.now()}`, requestHash: 'hash-v', reasonCodes: [], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-1' });
    const r3 = await service.execute({ commandType: 'MarkEvidenceIneligible', commandId: 'cmd-i', actor: { schoolId: 'school-1', actorId: 'teacher-1', actorRole: 'teacher', learnerId: 'learner-sm-2', requestId: 'req-2', correlationId: 'corr-2' }, learnerId: 'learner-sm-2', evidenceCandidateId: cid, expectedStreamSequence: 2, idempotencyKey: `idem-i-${Date.now()}`, requestHash: 'hash-i', reasonCodes: ['insufficient_evidence'], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-2' });
    expect(r3.success).toBe(true);
  });

  it('rejects invalid transition from candidate to committed', async () => {
    const r1 = await service.execute(makeCreateCandidate('learner-sm-3', 'school-1'));
    expect(r1.success).toBe(true);
    const cid = (r1.data as any).evidenceCandidateId;

    const r2 = await service.execute({ commandType: 'CommitLearningEvidence', commandId: 'cmd-bad', actor: { schoolId: 'school-1', actorId: 'teacher-1', actorRole: 'teacher', learnerId: 'learner-sm-3', requestId: 'req-1', correlationId: 'corr-1' }, learnerId: 'learner-sm-3', evidenceCandidateId: cid, expectedStreamSequence: 0, idempotencyKey: `idem-bad-${Date.now()}`, requestHash: 'hash-bad', reasonCodes: [], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-1' });
    expect(r2.success).toBe(false);
    expect(r2.error?.code).toBe('EVIDENCE_INVALID_TRANSITION');
  });
});
