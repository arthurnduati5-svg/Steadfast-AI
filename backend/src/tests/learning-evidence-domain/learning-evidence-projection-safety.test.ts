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

describe('Projection Safety', () => {
  let repo: InMemoryLearningEvidenceEventStoreRepository;
  let service: LearningEvidenceCommandService;
  let projectionService: LearningEvidenceProjectionService;

  beforeEach(() => {
    repo = new InMemoryLearningEvidenceEventStoreRepository();
    service = new LearningEvidenceCommandService(repo, new LearningEvidencePrivacyGuard());
    projectionService = new LearningEvidenceProjectionService(repo);
  });

  it('rebuild with events and missing projection repairs', async () => {
    const r1 = await service.execute(makeCreateCmd('school-ps', 'learner-ps-1', 'idem-ps-1'));
    expect(r1.success).toBe(true);
    const cid = (r1.data as any).evidenceCandidateId as string;

    await repo.clearProjectionsOnly();
    expect(await repo.getCandidateProjection('school-ps', cid)).toBeNull();

    const report = await projectionService.rebuildProjections('school-ps', 'learner-ps-1');
    expect(report.result).toBe('repaired');
  });

  it('rebuild with events and correct projection returns consistent', async () => {
    const r1 = await service.execute(makeCreateCmd('school-ps', 'learner-ps-2', 'idem-ps-2'));
    expect(r1.success).toBe(true);

    const report = await projectionService.rebuildProjections('school-ps', 'learner-ps-2');
    expect(report.result).toBe('consistent');
  });

  it('rebuild with no events returns consistent', async () => {
    const report = await projectionService.rebuildProjections('school-ps', 'learner-none');
    expect(report.result).toBe('consistent');
    expect(report.eventCount).toBe(0);
  });

  it('divergence detection works when projection differs', async () => {
    const r1 = await service.execute(makeCreateCmd('school-ps', 'learner-ps-3', 'idem-ps-3'));
    expect(r1.success).toBe(true);
    const cid = (r1.data as any).evidenceCandidateId as string;

    const proj = await repo.getCandidateProjection('school-ps', cid);
    expect(proj).not.toBeNull();
    proj!.currentState = 'validating';
    await repo.saveCandidateProjection(proj!);

    const compare = await projectionService.compareProjections('school-ps', 'learner-ps-3');
    expect(compare.status).toBe('divergence_detected');
  });

  it('rebuild preserves event history', async () => {
    const r1 = await service.execute(makeCreateCmd('school-ps', 'learner-ps-4', 'idem-ps-4'));
    expect(r1.success).toBe(true);

    const eventsBefore = await repo.getEventsForLearner('school-ps', 'learner-ps-4');
    await repo.clearProjectionsOnly();
    await projectionService.rebuildProjections('school-ps', 'learner-ps-4');
    const eventsAfter = await repo.getEventsForLearner('school-ps', 'learner-ps-4');

    expect(eventsAfter.length).toBe(eventsBefore.length);
    expect(eventsAfter[0].eventId).toBe(eventsBefore[0].eventId);
    expect(eventsAfter[0].streamSequence).toBe(eventsBefore[0].streamSequence);
  });

  it('student-safe projection read returns only safe fields', async () => {
    const r1 = await service.execute(makeCreateCmd('school-ps', 'learner-ps-5', 'idem-ps-5'));
    expect(r1.success).toBe(true);
    const cid = (r1.data as any).evidenceCandidateId as string;

    const proj = await repo.getCandidateProjection('school-ps', cid);
    expect(proj).not.toBeNull();
    expect(proj!.evidenceCandidateId).toBe(cid);
    expect(proj!.schoolId).toBe('school-ps');
    expect(proj!.learnerId).toBe('learner-ps-5');
    expect(proj!.currentState).toBe('candidate');
  });
});
