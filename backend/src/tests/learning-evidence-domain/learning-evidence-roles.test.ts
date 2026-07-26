import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryLearningEvidenceEventStoreRepository } from '../../domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository';
import { LearningEvidencePrivacyGuard } from '../../domains/learning-evidence/services/learningEvidencePrivacyGuard';
import { LearningEvidenceCommandService } from '../../domains/learning-evidence/services/learningEvidenceCommandService';
import type { CreateEvidenceCandidateCommand, EvidenceCommand } from '../../domains/learning-evidence/contracts/learningEvidenceCommandContracts';

function makeCreateCandidateCmd(
  overrides: Partial<CreateEvidenceCandidateCommand> = {},
): CreateEvidenceCandidateCommand {
  const actorId = 'learner-roles-1';
  return {
    commandType: 'CreateEvidenceCandidate',
    commandId: `cmd-${Date.now()}`,
    actor: {
      schoolId: 'school-roles',
      actorId: actorId,
      actorRole: 'student',
      learnerId: actorId,
      requestId: 'req-1',
      correlationId: 'corr-1',
    },
    learnerId: actorId,
    expectedStreamSequence: 0,
    idempotencyKey: `idem-roles-${Date.now()}`,
    requestHash: 'hash',
    reasonCodes: ['independent_recall'],
    policyVersion: '1.0',
    occurredAt: new Date().toISOString(),
    correlationId: 'corr-1',
    sourceLineage: {
      sourceType: 'tutor_attempt',
      sourceRecordId: 'r1',
      sourceVersion: '1.0',
      schoolId: 'school-roles',
      learnerId: 'learner-roles-1',
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
    ...overrides,
  };
}

describe('Role Authorization', () => {
  let repo: InMemoryLearningEvidenceEventStoreRepository;
  let service: LearningEvidenceCommandService;

  beforeEach(() => {
    repo = new InMemoryLearningEvidenceEventStoreRepository();
    service = new LearningEvidenceCommandService(repo, new LearningEvidencePrivacyGuard());
  });

  it('student can create evidence candidate for self', async () => {
    const result = await service.execute(makeCreateCandidateCmd());
    expect(result.success).toBe(true);
  });

  it('student cannot create evidence candidate for another learner', async () => {
    const result = await service.execute(makeCreateCandidateCmd({
      actor: {
        schoolId: 'school-roles',
        actorId: 'student-1',
        actorRole: 'student',
        learnerId: 'student-1',
        requestId: 'req-1',
        correlationId: 'corr-1',
      },
      learnerId: 'learner-roles-other',
    }));
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('EVIDENCE_RELATIONSHIP_FORBIDDEN');
  });

  it('student cannot start validation', async () => {
    const r1 = await service.execute(makeCreateCandidateCmd({ idempotencyKey: `idem-role-v-${Date.now()}` }));
    expect(r1.success).toBe(true);
    const cid = (r1.data as any).evidenceCandidateId as string;
    const result = await service.execute({
      commandType: 'StartEvidenceValidation',
      commandId: 'cmd-v',
      actor: { schoolId: 'school-roles', actorId: 'student-1', actorRole: 'student', learnerId: 'learner-roles-1', requestId: 'req-2', correlationId: 'corr-2' },
      learnerId: 'learner-roles-1',
      evidenceCandidateId: cid,
      expectedStreamSequence: 1,
      idempotencyKey: `idem-role-sv-${Date.now()}`,
      requestHash: 'hash-v',
      reasonCodes: [],
      policyVersion: '1.0',
      occurredAt: new Date().toISOString(),
      correlationId: 'corr-2',
    });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('EVIDENCE_ROLE_FORBIDDEN');
  });

  it('teacher can start validation', async () => {
    const r1 = await service.execute(makeCreateCandidateCmd({ idempotencyKey: `idem-role-t-${Date.now()}` }));
    expect(r1.success).toBe(true);
    const cid = (r1.data as any).evidenceCandidateId as string;
    const result = await service.execute({
      commandType: 'StartEvidenceValidation',
      commandId: 'cmd-v',
      actor: { schoolId: 'school-roles', actorId: 'teacher-1', actorRole: 'teacher', learnerId: 'learner-roles-1', requestId: 'req-2', correlationId: 'corr-2' },
      learnerId: 'learner-roles-1',
      evidenceCandidateId: cid,
      expectedStreamSequence: 1,
      idempotencyKey: `idem-role-tv-${Date.now()}`,
      requestHash: 'hash-v',
      reasonCodes: [],
      policyVersion: '1.0',
      occurredAt: new Date().toISOString(),
      correlationId: 'corr-2',
    });
    expect(result.success).toBe(true);
  });

  it('unknown role is denied', async () => {
    const result = await service.execute(makeCreateCandidateCmd({
      actor: {
        schoolId: 'school-roles',
        actorId: 'unknown-1',
        actorRole: 'unknown',
        learnerId: 'learner-roles-1',
        requestId: 'req-1',
        correlationId: 'corr-1',
      },
    }));
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('EVIDENCE_ROLE_FORBIDDEN');
  });

  it('parent is denied from creating candidates', async () => {
    const result = await service.execute(makeCreateCandidateCmd({
      actor: {
        schoolId: 'school-roles',
        actorId: 'parent-1',
        actorRole: 'parent',
        learnerId: 'learner-roles-1',
        requestId: 'req-1',
        correlationId: 'corr-1',
      },
    }));
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('EVIDENCE_ROLE_FORBIDDEN');
  });

  it('school admin can rebuild projections', async () => {
    const r1 = await service.execute(makeCreateCandidateCmd({ idempotencyKey: `idem-role-admin-${Date.now()}` }));
    expect(r1.success).toBe(true);
    const result = await service.execute({
      commandType: 'RebuildEvidenceProjection',
      commandId: 'cmd-rebuild',
      actor: { schoolId: 'school-roles', actorId: 'admin-1', actorRole: 'school_admin', learnerId: 'learner-roles-1', requestId: 'req-3', correlationId: 'corr-3' },
      learnerId: 'learner-roles-1',
      schoolId: 'school-roles',
      expectedStreamSequence: 0,
      idempotencyKey: `idem-role-rebuild-${Date.now()}`,
      requestHash: 'hash-rebuild',
      reasonCodes: [],
      policyVersion: '1.0',
      occurredAt: new Date().toISOString(),
      correlationId: 'corr-3',
    });
    expect(result.success).toBe(true);
  });

  it('student cannot rebuild projections', async () => {
    const result = await service.execute({
      commandType: 'RebuildEvidenceProjection',
      commandId: 'cmd-rebuild',
      actor: { schoolId: 'school-roles', actorId: 'student-1', actorRole: 'student', learnerId: 'learner-roles-1', requestId: 'req-3', correlationId: 'corr-3' },
      learnerId: 'learner-roles-1',
      schoolId: 'school-roles',
      expectedStreamSequence: 0,
      idempotencyKey: `idem-role-rebuild-s-${Date.now()}`,
      requestHash: 'hash-rebuild',
      reasonCodes: [],
      policyVersion: '1.0',
      occurredAt: new Date().toISOString(),
      correlationId: 'corr-3',
    });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('EVIDENCE_ROLE_FORBIDDEN');
  });

  it('student cannot verify stream integrity', async () => {
    const result = await service.execute({
      commandType: 'VerifyEvidenceStreamIntegrity',
      commandId: 'cmd-verify',
      actor: { schoolId: 'school-roles', actorId: 'student-1', actorRole: 'student', learnerId: 'learner-roles-1', requestId: 'req-4', correlationId: 'corr-4' },
      learnerId: 'learner-roles-1',
      schoolId: 'school-roles',
      expectedStreamSequence: 0,
      idempotencyKey: `idem-role-verify-s-${Date.now()}`,
      requestHash: 'hash-verify',
      reasonCodes: [],
      policyVersion: '1.0',
      occurredAt: new Date().toISOString(),
      correlationId: 'corr-4',
    });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('EVIDENCE_ROLE_FORBIDDEN');
  });
});
