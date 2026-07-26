import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryLearningEvidenceEventStoreRepository } from '../../domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository';
import { LearningEvidencePrivacyGuard } from '../../domains/learning-evidence/services/learningEvidencePrivacyGuard';
import { LearningEvidenceCommandService } from '../../domains/learning-evidence/services/learningEvidenceCommandService';
import { LearningEvidenceProjectionService } from '../../domains/learning-evidence/services/learningEvidenceProjectionService';
import type { CreateEvidenceCandidateCommand } from '../../domains/learning-evidence/contracts/learningEvidenceCommandContracts';

function makeCreateCmd(schoolId: string, learnerId: string, key: string): CreateEvidenceCandidateCommand {
  return {
    commandType: 'CreateEvidenceCandidate',
    commandId: `cmd-${key}`,
    actor: {
      schoolId,
      actorId: learnerId,
      actorRole: 'student',
      learnerId,
      requestId: 'req-1',
      correlationId: 'corr-1',
    },
    learnerId,
    expectedStreamSequence: 0,
    idempotencyKey: key,
    requestHash: 'hash',
    reasonCodes: ['independent_recall'],
    policyVersion: '1.0',
    occurredAt: new Date().toISOString(),
    correlationId: 'corr-1',
    sourceLineage: {
      sourceType: 'tutor_attempt',
      sourceRecordId: 'r1',
      sourceVersion: '1.0',
      schoolId,
      learnerId,
      occurredAt: new Date().toISOString(),
      outcome: 'correct',
      integrityState: 'clear',
      finalizationState: 'not_applicable',
      policyVersion: '1.0',
    },
    safePayload: {
      outcome: 'correct',
      independence: 'independent',
      evidenceMode: 'recall',
      confidenceState: 'high',
      integrityState: 'clear',
      finalizationState: 'not_applicable',
      sourceVersion: '1.0',
      eligibilityReasonCodes: [],
    },
  };
}

describe('Projection Reconciliation', () => {
  let repo: InMemoryLearningEvidenceEventStoreRepository;
  let service: LearningEvidenceCommandService;
  let projectionService: LearningEvidenceProjectionService;

  beforeEach(() => {
    repo = new InMemoryLearningEvidenceEventStoreRepository();
    service = new LearningEvidenceCommandService(repo, new LearningEvidencePrivacyGuard());
    projectionService = new LearningEvidenceProjectionService(repo);
  });

  it('events exist + projection missing: result = repaired', async () => {
    const r1 = await service.execute(makeCreateCmd('school-rec', 'learner-rec-1', 'idem-rec-1'));
    expect(r1.success).toBe(true);
    const cid = (r1.data as any).evidenceCandidateId as string;

    await repo.clearProjectionsOnly();
    expect(await repo.getCandidateProjection('school-rec', cid)).toBeNull();

    const report = await projectionService.rebuildProjections('school-rec', 'learner-rec-1');
    expect(report.result).toBe('repaired');
  });

  it('events exist + projection differs: divergence_detected before repair', async () => {
    const r1 = await service.execute(makeCreateCmd('school-rec', 'learner-rec-2', 'idem-rec-2'));
    expect(r1.success).toBe(true);

    const compare = await projectionService.compareProjections('school-rec', 'learner-rec-2');
    expect(compare.status).toBe('consistent');

    const cid = (r1.data as any).evidenceCandidateId as string;
    const proj = await repo.getCandidateProjection('school-rec', cid);
    expect(proj).not.toBeNull();
    proj!.currentState = 'validating';
    await repo.saveCandidateProjection(proj!);

    const compare2 = await projectionService.compareProjections('school-rec', 'learner-rec-2');
    expect(compare2.status).toBe('divergence_detected');
  });

  it('authorized repair: result = repaired', async () => {
    const r1 = await service.execute(makeCreateCmd('school-rec', 'learner-rec-3', 'idem-rec-3'));
    expect(r1.success).toBe(true);

    await repo.clearProjectionsOnly();
    const report = await projectionService.rebuildProjections('school-rec', 'learner-rec-3');
    expect(report.result).toBe('repaired');
  });

  it('no events + no projection: result = consistent', async () => {
    const report = await projectionService.rebuildProjections('school-rec', 'learner-empty');
    expect(report.result).toBe('consistent');
  });

  it('event sequence gap detection via integrity check', async () => {
    const r1 = await service.execute(makeCreateCmd('school-rec', 'learner-rec-4', 'idem-rec-4'));
    expect(r1.success).toBe(true);

    const stream = await repo.getStream('school-rec', 'evidence_school-rec_learner-rec-4');
    const events = await repo.getEventsForLearner('school-rec', 'learner-rec-4');

    const integrity = await repo.verifyStreamIntegrity('school-rec', `evidence_school-rec_learner-rec-4`);
    expect(integrity.valid).toBe(true);
  });

  it('rebuild after full commit path returns consistent', async () => {
    const r1 = await service.execute(makeCreateCmd('school-rec', 'learner-rec-5', 'idem-rec-5'));
    expect(r1.success).toBe(true);
    const cid = (r1.data as any).evidenceCandidateId as string;

    const teacher = { schoolId: 'school-rec', actorId: 'teacher-1', actorRole: 'teacher', learnerId: 'learner-rec-5', requestId: 'req-2', correlationId: 'corr-2' };
    await service.execute({ commandType: 'StartEvidenceValidation', commandId: 'cmd-v', actor: teacher, learnerId: 'learner-rec-5', evidenceCandidateId: cid, expectedStreamSequence: 1, idempotencyKey: 'idem-rec-5v', requestHash: 'hv', reasonCodes: [], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-2' });
    await service.execute({ commandType: 'MarkEvidenceUsable', commandId: 'cmd-u', actor: teacher, learnerId: 'learner-rec-5', evidenceCandidateId: cid, expectedStreamSequence: 2, idempotencyKey: 'idem-rec-5u', requestHash: 'hu', reasonCodes: [], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-2' });
    await service.execute({ commandType: 'CommitLearningEvidence', commandId: 'cmd-c', actor: teacher, learnerId: 'learner-rec-5', evidenceCandidateId: cid, expectedStreamSequence: 3, idempotencyKey: 'idem-rec-5c', requestHash: 'hc', reasonCodes: ['mastery_demonstrated'], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-2' });

    const report = await projectionService.rebuildProjections('school-rec', 'learner-rec-5');
    expect(report.result).toBe('consistent');
    expect(report.candidateProjections).toBe(1);
    expect(report.committedProjections).toBeGreaterThanOrEqual(1);
  });
});