import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { InMemoryLearningEvidenceEventStoreRepository } from '../../domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository';
import { PrismaLearningEvidenceEventStoreRepository } from '../../domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository';
import { LearningEvidenceConcurrencyError } from '../../domains/learning-evidence/repositories/learningEvidenceRepositoryErrors';
import { LearningEvidencePrivacyGuard } from '../../domains/learning-evidence/services/learningEvidencePrivacyGuard';
import { LearningEvidenceCommandService } from '../../domains/learning-evidence/services/learningEvidenceCommandService';
import { registerRepositoryContract } from './helpers/learningEvidenceRepositoryContract';
import { createPrismaLearningEvidenceHarness } from './helpers/learningEvidencePrismaTestHarness';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

function hash(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

const TEST_DB_URL = process.env.LEARNING_EVIDENCE_TEST_DATABASE_URL;
const USE_PRISMA = !!TEST_DB_URL;

const memoryHarness = {
  name: 'memory',
  async createRepository() { return new InMemoryLearningEvidenceEventStoreRepository(); },
  async reset() { /* fresh instance on each create */ },
  async disconnect() {},
};

// Register memory contract unconditionally
registerRepositoryContract(memoryHarness);

if (USE_PRISMA) {
  let prismaHarness: Awaited<ReturnType<typeof createPrismaLearningEvidenceHarness>> | null = null;

  beforeAll(async () => {
    prismaHarness = await createPrismaLearningEvidenceHarness();
  });

  afterAll(async () => {
    if (prismaHarness) await prismaHarness.disconnect();
  });

  // Register Prisma contract
  describe('Prisma harness', () => {
    beforeEach(async () => {
      if (prismaHarness) await prismaHarness.reset();
    });

    registerRepositoryContract({
      name: prismaHarness?.name ?? 'prisma',
      async createRepository() { return prismaHarness!.createRepository(); },
      async reset() { return prismaHarness!.reset(); },
      async disconnect() { return prismaHarness!.disconnect(); },
      async createFreshRepository() { return prismaHarness!.createFreshRepository(); },
    });

    describe('Database-level concurrency', () => {
      it('two concurrent first commands: only one succeeds', async () => {
        const repo = await prismaHarness!.createRepository();
        const guard = new LearningEvidencePrivacyGuard();
        const service = new LearningEvidenceCommandService(repo, guard);

        const schoolId = `school-con-0-${Date.now()}`;
        const learnerId = `learner-con-0-${Date.now()}`;
        const baseIdem = `idem-con-0-${Date.now()}`;

        const makeCmd = (suffix: string) => ({
          commandType: 'CreateEvidenceCandidate' as const,
          commandId: `cmd-${suffix}`,
          actor: { schoolId, actorId: learnerId, actorRole: 'student' as const, learnerId, requestId: `req-${suffix}`, correlationId: `corr-${suffix}` },
          learnerId,
          expectedStreamSequence: 0,
          idempotencyKey: `${baseIdem}-${suffix}`,
          requestHash: `hash-${suffix}`,
          reasonCodes: ['independent_recall'],
          policyVersion: '1.0',
          occurredAt: new Date().toISOString(),
          correlationId: `corr-${suffix}`,
          sourceLineage: { sourceType: 'tutor_attempt' as const, sourceRecordId: `src-${suffix}`, sourceVersion: '1.0', schoolId, learnerId, occurredAt: new Date().toISOString(), outcome: 'correct' as const, integrityState: 'clear' as const, finalizationState: 'not_applicable' as const, policyVersion: '1.0' },
          safePayload: { outcome: 'correct' as const, independence: 'independent' as const, evidenceMode: 'recall' as const, confidenceState: 'high' as const, integrityState: 'clear' as const, finalizationState: 'not_applicable' as const, sourceVersion: '1.0', eligibilityReasonCodes: [] },
        });

        const results = await Promise.allSettled([
          service.execute(makeCmd('A')),
          service.execute(makeCmd('B')),
        ]);

        const successes = results.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value.success === true);
        const failures = results.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value.success === false);
        const rejected = results.filter(r => r.status === 'rejected');

        expect(successes.length).toBe(1);
        expect(rejected.length + failures.length).toBe(1);

        const stream = await repo.getStream(schoolId, `evidence_${schoolId}_${learnerId}`);
        expect(stream).not.toBeNull();
        expect(stream!.currentSequence).toBe(1);

        const events = await repo.getEventsForLearner(schoolId, learnerId);
        expect(events.length).toBe(1);
        expect(events[0].streamSequence).toBe(1);

        const integrity = await repo.verifyStreamIntegrity(schoolId, `evidence_${schoolId}_${learnerId}`);
        expect(integrity.valid).toBe(true);
      });

      it('two concurrent later commands: only one succeeds at expected seq 1', async () => {
        const repo = await prismaHarness!.createRepository();
        const guard = new LearningEvidencePrivacyGuard();
        const service = new LearningEvidenceCommandService(repo, guard);

        const schoolId = `school-con-1-${Date.now()}`;
        const learnerId = `learner-con-1-${Date.now()}`;

        const r1 = await service.execute({
          commandType: 'CreateEvidenceCandidate', commandId: 'cmd-first',
          actor: { schoolId, actorId: learnerId, actorRole: 'student', learnerId, requestId: 'req-first', correlationId: 'corr-first' },
          learnerId, expectedStreamSequence: 0,
          idempotencyKey: `idem-first-${Date.now()}`, requestHash: 'h-first',
          reasonCodes: ['independent_recall'], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-first',
          sourceLineage: { sourceType: 'tutor_attempt', sourceRecordId: 'src-first', sourceVersion: '1.0', schoolId, learnerId, occurredAt: new Date().toISOString(), outcome: 'correct', integrityState: 'clear', finalizationState: 'not_applicable', policyVersion: '1.0' },
          safePayload: { outcome: 'correct', independence: 'independent', evidenceMode: 'recall', confidenceState: 'high', integrityState: 'clear', finalizationState: 'not_applicable', sourceVersion: '1.0', eligibilityReasonCodes: [] },
        });
        expect(r1.success).toBe(true);
        const cid = (r1.data as any).evidenceCandidateId;

        const baseIdem = `idem-con-1-${Date.now()}`;
        const makeCmd = (suffix: string) => ({
          commandType: 'StartEvidenceValidation' as const,
          commandId: `cmd-${suffix}`,
          actor: { schoolId, actorId: 'teacher-1', actorRole: 'teacher' as const, learnerId, requestId: `req-${suffix}`, correlationId: `corr-${suffix}` },
          learnerId, evidenceCandidateId: cid,
          expectedStreamSequence: 1,
          idempotencyKey: `${baseIdem}-${suffix}`,
          requestHash: `hash-${suffix}`,
          reasonCodes: [], policyVersion: '1.0',
          occurredAt: new Date().toISOString(), correlationId: `corr-${suffix}`,
        });

        const results = await Promise.allSettled([
          service.execute(makeCmd('A')),
          service.execute(makeCmd('B')),
        ]);

        const successes = results.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value.success === true);
        const failures = results.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value.success === false);
        const rejected = results.filter(r => r.status === 'rejected');

        expect(successes.length).toBe(1);
        expect(rejected.length + failures.length).toBe(1);

        const stream = await repo.getStream(schoolId, `evidence_${schoolId}_${learnerId}`);
        expect(stream).not.toBeNull();
        expect(stream!.currentSequence).toBe(2);

        const events = await repo.getEventsForLearner(schoolId, learnerId);
        expect(events.length).toBe(2);

        const integrity = await repo.verifyStreamIntegrity(schoolId, `evidence_${schoolId}_${learnerId}`);
        expect(integrity.valid).toBe(true);
      });
    });

    describe('Transaction rollback', () => {
      it('failed projection write does not leave partial state', async () => {
        const repo = await prismaHarness!.createRepository();
        const guard = new LearningEvidencePrivacyGuard();
        const service = new LearningEvidenceCommandService(repo, guard);

        const schoolId = `school-txn-${Date.now()}`;
        const learnerId = `learner-txn-${Date.now()}`;
        const streamId = `evidence_${schoolId}_${learnerId}`;

        const r1 = await service.execute({
          commandType: 'CreateEvidenceCandidate', commandId: 'cmd-txn-1',
          actor: { schoolId, actorId: learnerId, actorRole: 'student', learnerId, requestId: 'req-txn-1', correlationId: 'corr-txn-1' },
          learnerId, expectedStreamSequence: 0,
          idempotencyKey: `idem-txn-1-${Date.now()}`, requestHash: 'h-txn-1',
          reasonCodes: ['independent_recall'], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-txn-1',
          sourceLineage: { sourceType: 'tutor_attempt', sourceRecordId: 'src-txn-1', sourceVersion: '1.0', schoolId, learnerId, occurredAt: new Date().toISOString(), outcome: 'correct', integrityState: 'clear', finalizationState: 'not_applicable', policyVersion: '1.0' },
          safePayload: { outcome: 'correct', independence: 'independent', evidenceMode: 'recall', confidenceState: 'high', integrityState: 'clear', finalizationState: 'not_applicable', sourceVersion: '1.0', eligibilityReasonCodes: [] },
        });
        expect(r1.success).toBe(true);
        const cid = (r1.data as any).evidenceCandidateId;
        const priorSeq = (r1.data as any).streamSequence;

        // Try to append an event with a duplicate streamSequence to trigger a rollback
        try {
          const eHash = hash('dup');
          const prisma2 = new PrismaClient({ datasources: { db: { url: TEST_DB_URL! } } });
          await prisma2.$connect();
          const dupRepo = new PrismaLearningEvidenceEventStoreRepository(prisma2);
          await dupRepo.appendEventAtomically(
            {
              eventId: `evt-dup-${Date.now()}`, schoolId, learnerId, streamId,
              streamSequence: priorSeq,
              eventType: 'EVIDENCE_VALIDATION_STARTED',
              evidenceCandidateId: cid,
              sourceType: 'tutor_attempt', sourceRecordId: 'src-dup', sourceVersion: '1.0',
              actorId: 'teacher-1', actorRole: 'teacher',
              policyVersion: '1.0', schemaVersion: '1.0',
              reasonCodes: [], safePayloadJson: '{}', safePayloadHash: hash('{}'),
              privacyClass: 'learner_safe',
              occurredAt: new Date().toISOString(), recordedAt: new Date().toISOString(),
              correlationId: 'corr-dup', causationId: undefined,
              idempotencyKey: `ik-dup-${Date.now()}`,
              previousEventHash: '', eventHash: eHash,
            },
            { streamId, schoolId, learnerId, currentSequence: priorSeq, latestEventHash: eHash },
          );
          await prisma2.$disconnect();
        } catch {
          // Expected - the duplicate sequence should fail
        }

        // Verify original state remains intact
        const stream = await repo.getStream(schoolId, streamId);
        expect(stream).not.toBeNull();
        expect(stream!.currentSequence).toBe(priorSeq);

        const events = await repo.getEventsForLearner(schoolId, learnerId);
        expect(events.length).toBe(1);
        expect(events[0].streamSequence).toBe(priorSeq);

        const integrity = await repo.verifyStreamIntegrity(schoolId, streamId);
        expect(integrity.valid).toBe(true);
      });
    });

    describe('Persistence reload', () => {
      it('all data survives Prisma Client teardown and reconstruction', async () => {
        const repo = await prismaHarness!.createRepository();
        const guard = new LearningEvidencePrivacyGuard();
        const service = new LearningEvidenceCommandService(repo, guard);

        const schoolId = `school-reload-${Date.now()}`;
        const learnerId = `learner-reload-${Date.now()}`;
        const streamId = `evidence_${schoolId}_${learnerId}`;

        const r1 = await service.execute({
          commandType: 'CreateEvidenceCandidate', commandId: 'cmd-rl-1',
          actor: { schoolId, actorId: learnerId, actorRole: 'student', learnerId, requestId: 'req-rl-1', correlationId: 'corr-rl-1' },
          learnerId, expectedStreamSequence: 0,
          idempotencyKey: `idem-rl-1-${Date.now()}`, requestHash: 'h-rl-1',
          reasonCodes: ['independent_recall'], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-rl-1',
          sourceLineage: { sourceType: 'tutor_attempt', sourceRecordId: 'src-rl-1', sourceVersion: '1.0', schoolId, learnerId, occurredAt: new Date().toISOString(), outcome: 'correct', integrityState: 'clear', finalizationState: 'not_applicable', policyVersion: '1.0' },
          safePayload: { outcome: 'correct', independence: 'independent', evidenceMode: 'recall', confidenceState: 'high', integrityState: 'clear', finalizationState: 'not_applicable', sourceVersion: '1.0', eligibilityReasonCodes: [] },
        });
        expect(r1.success).toBe(true);
        const cid = (r1.data as any).evidenceCandidateId;
        const eid = (r1.data as any).eventId;

        // Record idempotency
        await repo.recordIdempotencyResult(schoolId, 'ik-reload-test', 'CreateEvidenceCandidate', 'hash-rl', eid);

        // Save checkpoint
        await repo.saveProjectionCheckpoint({
          projectionName: 'reload-test', schoolId, partitionKey: learnerId,
          lastProcessedSequence: 1, lastEventHash: 'hash-rl', status: 'healthy', failureReason: '',
        });

        // Disconnect and reconnect via fresh harness
        await prismaHarness!.disconnect();
        const freshRepo = await prismaHarness!.createFreshRepository();

        // Event survived
        const evt = await freshRepo.getEventById(schoolId, eid);
        expect(evt).not.toBeNull();
        expect(evt!.streamSequence).toBe(1);

        // Stream survived
        const stream = await freshRepo.getStream(schoolId, streamId);
        expect(stream).not.toBeNull();
        expect(stream!.currentSequence).toBe(1);

        // Candidate projection survived
        const cand = await freshRepo.getCandidateProjection(schoolId, cid);
        expect(cand).not.toBeNull();
        expect(cand!.currentState).toBe('candidate');

        // Idempotency survived
        const idem = await freshRepo.getIdempotencyResult(schoolId, 'ik-reload-test', 'CreateEvidenceCandidate');
        expect(idem).not.toBeNull();
        expect(idem!.requestHash).toBe('hash-rl');

        // Checkpoint survived
        const ckpt = await freshRepo.getProjectionCheckpoint('reload-test', schoolId, learnerId);
        expect(ckpt).not.toBeNull();
        expect(ckpt!.status).toBe('healthy');

        // Learner events survived
        const events = await freshRepo.getEventsForLearner(schoolId, learnerId);
        expect(events.length).toBe(1);

        // Integrity still valid
        const integrity = await freshRepo.verifyStreamIntegrity(schoolId, streamId);
        expect(integrity.valid).toBe(true);
      });
    });

    describe('Projection replay from durable events', () => {
      it('reconstructed projections match stored state', async () => {
        const repo = await prismaHarness!.createRepository();
        const guard = new LearningEvidencePrivacyGuard();
        const service = new LearningEvidenceCommandService(repo, guard);
        const { LearningEvidenceProjectionService } = await import('../../domains/learning-evidence/services/learningEvidenceProjectionService');
        const projectionService = new LearningEvidenceProjectionService(repo);

        const schoolId = `school-rp-${Date.now()}`;
        const learnerId = `learner-rp-${Date.now()}`;

        const r1 = await service.execute({
          commandType: 'CreateEvidenceCandidate', commandId: 'cmd-rp-1',
          actor: { schoolId, actorId: learnerId, actorRole: 'student', learnerId, requestId: 'req-rp-1', correlationId: 'corr-rp-1' },
          learnerId, expectedStreamSequence: 0,
          idempotencyKey: `idem-rp-1-${Date.now()}`, requestHash: 'h-rp-1',
          reasonCodes: ['independent_recall'], policyVersion: '1.0', occurredAt: new Date().toISOString(), correlationId: 'corr-rp-1',
          sourceLineage: { sourceType: 'tutor_attempt', sourceRecordId: 'src-rp-1', sourceVersion: '1.0', schoolId, learnerId, occurredAt: new Date().toISOString(), outcome: 'correct', integrityState: 'clear', finalizationState: 'not_applicable', policyVersion: '1.0' },
          safePayload: { outcome: 'correct', independence: 'independent', evidenceMode: 'recall', confidenceState: 'high', integrityState: 'clear', finalizationState: 'not_applicable', sourceVersion: '1.0', eligibilityReasonCodes: [] },
        });
        expect(r1.success).toBe(true);

        const report = await projectionService.rebuildProjections(schoolId, learnerId);
        expect(report.result).toBe('consistent');
        expect(report.eventCount).toBe(1);
        expect(report.candidateProjections).toBe(1);
      });
    });

    describe('Prisma mapping and serialization', () => {
      it('reasonCodes and misconceptionTags survive round trip', async () => {
        const repo = await prismaHarness!.createRepository();
        const cid = `cand-map-${Date.now()}`;
        const eHash = hash('map');
        const evt = {
          eventId: `evt-map-${Date.now()}`, schoolId: `school-map-${Date.now()}`, learnerId: 'learner-map',
          streamId: `stream-map-${Date.now()}`, streamSequence: 1,
          eventType: 'EVIDENCE_CANDIDATE_CREATED', evidenceCandidateId: cid,
          sourceType: 'tutor_attempt', sourceRecordId: 'src-map', sourceVersion: '1.0',
          actorId: 'student-1', actorRole: 'student',
          policyVersion: '1.0', schemaVersion: '1.0',
          reasonCodes: ['independent_recall', 'mastery_demonstrated'],
          safePayloadJson: JSON.stringify({ key: 'value' }), safePayloadHash: hash(JSON.stringify({ key: 'value' })),
          privacyClass: 'learner_safe',
          occurredAt: new Date().toISOString(), recordedAt: new Date().toISOString(),
          correlationId: 'corr-map', causationId: undefined,
          idempotencyKey: 'ik-map', previousEventHash: '', eventHash: eHash,
        } as any;
        const stream = {
          streamId: evt.streamId, schoolId: evt.schoolId, learnerId: 'learner-map',
          currentSequence: 1, latestEventHash: eHash,
        };
        await repo.appendEventAtomically(evt, stream);

        const cand = {
          evidenceCandidateId: cid, schoolId: evt.schoolId, learnerId: 'learner-map',
          currentState: 'candidate' as const, sourceType: 'tutor_attempt',
          sourceRecordId: 'src-map', sourceVersion: '1.0',
          outcome: 'correct', independence: 'independent',
          evidenceMode: 'recall', confidenceState: 'high',
          integrityState: 'clear', finalizationState: 'not_applicable',
          difficultyBand: 'medium', timeOnTaskBand: 'moderate',
          misconceptionTags: ['misconception_a', 'misconception_b'],
          objectiveId: 'obj-1', skillId: 'skill-1', topicId: 'topic-1', conceptId: 'concept-1',
          evidenceWeightSuggestion: 0.85,
          eligibilityReasonCodes: ['eligible_by_policy'],
          latestSequence: 1, version: 1,
        };
        await repo.saveCandidateProjection(cand);

        const stored = await repo.getCandidateProjection(evt.schoolId, cid);
        expect(stored).not.toBeNull();
        expect(stored!.misconceptionTags).toEqual(['misconception_a', 'misconception_b']);
        expect(stored!.objectiveId).toBe('obj-1');
        expect(stored!.evidenceWeightSuggestion).toBe(0.85);
        expect(stored!.eligibilityReasonCodes).toEqual(['eligible_by_policy']);
      });

      it('committed projection with all fields survives round trip', async () => {
        const repo = await prismaHarness!.createRepository();
        const ceid = `comm-map-${Date.now()}`;
        const proj = {
          committedEvidenceId: ceid, evidenceCandidateId: `ec-map-${Date.now()}`,
          schoolId: `school-cmap-${Date.now()}`, learnerId: 'learner-cmap',
          objectiveId: 'obj-c', skillId: 'skill-c', topicId: 'topic-c', conceptId: 'concept-c',
          outcome: 'correct', evidenceMode: 'recall', independence: 'independent',
          confidenceState: 'high', integrityState: 'clear', finalizationState: 'final',
          evidenceWeightSuggestion: 0.9,
          active: true, supersededByEvidenceId: undefined,
          committedAt: new Date().toISOString(), retainedAt: undefined,
          latestSequence: 3, version: 2,
        };
        await repo.saveCommittedProjection(proj);

        const stored = await repo.getCommittedProjection(proj.schoolId, ceid);
        expect(stored).not.toBeNull();
        expect(stored!.outcome).toBe('correct');
        expect(stored!.active).toBe(true);
        expect(stored!.version).toBe(2);
        expect(stored!.latestSequence).toBe(3);
        expect(stored!.committedAt).toBeTruthy();
      });
    });
  });
} else {
  describe('Prisma proof skipped', () => {
    it('LEARNING_EVIDENCE_TEST_DATABASE_REQUIRED', () => {
      throw new Error(
        'LEARNING_EVIDENCE_TEST_DATABASE_REQUIRED: ' +
        'Set LEARNING_EVIDENCE_TEST_DATABASE_URL to run Prisma durability tests. ' +
        'Example: postgresql://postgres@localhost:8000/steadfast_learning_evidence_test',
      );
    });
  });
}
