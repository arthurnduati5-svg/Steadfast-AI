import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryLearningEvidenceEventStoreRepository } from '../../domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository';
import { LearningEvidencePrivacyGuard } from '../../domains/learning-evidence/services/learningEvidencePrivacyGuard';
import { LearningEvidenceCommandService } from '../../domains/learning-evidence/services/learningEvidenceCommandService';
import { LearningEvidenceProjectionService } from '../../domains/learning-evidence/services/learningEvidenceProjectionService';

function makeCandidateCmd(schoolId: string, learnerId: string, outcome: string = 'correct'): any {
  return {
    commandType: 'CreateEvidenceCandidate' as const, commandId: `cmd-${Date.now()}-${Math.random()}`,
    actor: { schoolId, actorId: learnerId, actorRole: 'student', learnerId, requestId: 'req-1', correlationId: 'corr-1' },
    learnerId, expectedStreamSequence: 0, idempotencyKey: `idem-${Date.now()}-${Math.random()}`, requestHash: 'hash',
    reasonCodes: ['independent_recall'], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-1',
    sourceLineage: { sourceType: 'tutor_attempt', sourceRecordId: 'r1', sourceVersion: '1.0', schoolId, learnerId, occurredAt: new Date().toISOString(), outcome: outcome as any, integrityState: 'clear', finalizationState: 'not_applicable', policyVersion: '1.0' },
    safePayload: { outcome: outcome as any, independence: 'independent', evidenceMode: 'recall', confidenceState: 'high', integrityState: 'clear', finalizationState: 'not_applicable', sourceVersion: '1.0', eligibilityReasonCodes: [] },
  };
}

describe('Replay and Projection Rebuild', () => {
  let repo: InMemoryLearningEvidenceEventStoreRepository;
  let service: LearningEvidenceCommandService;
  let projectionService: LearningEvidenceProjectionService;

  beforeEach(() => {
    repo = new InMemoryLearningEvidenceEventStoreRepository();
    service = new LearningEvidenceCommandService(repo, new LearningEvidencePrivacyGuard());
    projectionService = new LearningEvidenceProjectionService(repo);
  });

  it('rebuildProjections returns consistent for empty learner', async () => {
    const report = await projectionService.rebuildProjections('school-1', 'learner-none');
    expect(report.result).toBe('consistent');
    expect(report.eventCount).toBe(0);
  });

  it('rebuildProjections after creating candidate returns consistent', async () => {
    await service.execute(makeCandidateCmd('school-1', 'learner-rp-1'));
    const report = await projectionService.rebuildProjections('school-1', 'learner-rp-1');
    expect(report.result).toBe('consistent');
    expect(report.candidateProjections).toBe(1);
  });

  it('rebuildProjections after full commit path returns consistent', async () => {
    const r1 = await service.execute(makeCandidateCmd('school-1', 'learner-rp-2'));
    expect(r1.success).toBe(true);
    const cid = (r1.data as any).evidenceCandidateId;

    const teacher = { schoolId: 'school-1', actorId: 'teacher-1', actorRole: 'teacher', learnerId: 'learner-rp-2', requestId: 'req-2', correlationId: 'corr-2' };
    await service.execute({ commandType: 'StartEvidenceValidation', commandId: 'cmd-v', actor: teacher, learnerId: 'learner-rp-2', evidenceCandidateId: cid, expectedStreamSequence: 1, idempotencyKey: `idem-rp2-v`, requestHash: 'hv', reasonCodes: [], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-2' });
    await service.execute({ commandType: 'MarkEvidenceUsable', commandId: 'cmd-u', actor: teacher, learnerId: 'learner-rp-2', evidenceCandidateId: cid, expectedStreamSequence: 1, idempotencyKey: `idem-rp2-u`, requestHash: 'hu', reasonCodes: [], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-2' });
    await service.execute({ commandType: 'CommitLearningEvidence', commandId: 'cmd-c', actor: teacher, learnerId: 'learner-rp-2', evidenceCandidateId: cid, expectedStreamSequence: 2, idempotencyKey: `idem-rp2-c`, requestHash: 'hc', reasonCodes: ['mastery_demonstrated'], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-2' });

    const report = await projectionService.rebuildProjections('school-1', 'learner-rp-2');
    expect(report.result).toBe('consistent');
  });

  it('clearing projections then rebuild repairs them', async () => {
    const r1 = await service.execute(makeCandidateCmd('school-1', 'learner-rp-3'));
    expect(r1.success).toBe(true);
    const cid = (r1.data as any).evidenceCandidateId;

    await repo.clearProjectionsOnly();
    const pre = await repo.getCandidateProjection('school-1', cid);
    expect(pre).toBeNull();

    const report = await projectionService.rebuildProjections('school-1', 'learner-rp-3');
    expect(report.result).toBe('repaired');
    const post = await repo.getCandidateProjection('school-1', cid);
    expect(post).not.toBeNull();
  });
});
