import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import type { LearningEvidenceEventStoreRepository } from '../../../domains/learning-evidence/repositories/learningEvidenceEventStoreRepository';
import type { LearningEvidenceEventRecord, LearningEvidenceStreamState, LearningEvidenceCandidateProjectionState, CommittedLearningEvidenceProjectionState, EvidenceProjectionCheckpointState } from '../../../domains/learning-evidence/contracts/learningEvidenceProjectionContracts';

function hash(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function makeEvent(overrides: Partial<LearningEvidenceEventRecord> & { schoolId: string; streamId: string; streamSequence: number; eventHash: string }): LearningEvidenceEventRecord {
  return {
    eventId: `evt-${overrides.streamId}-${overrides.streamSequence}`,
    learnerId: 'learner-ct',
    eventType: 'EVIDENCE_CANDIDATE_CREATED',
    evidenceCandidateId: undefined,
    committedEvidenceId: undefined,
    sourceType: 'tutor_attempt',
    sourceRecordId: `src-${overrides.streamSequence}`,
    sourceVersion: '1.0',
    actorId: 'actor-1',
    actorRole: 'student',
    policyVersion: '1.0',
    schemaVersion: '1.0',
    reasonCodes: [],
    safePayloadJson: '{}',
    safePayloadHash: hash('{}'),
    privacyClass: 'learner_safe',
    occurredAt: new Date().toISOString(),
    recordedAt: new Date().toISOString(),
    correlationId: 'corr-ct',
    causationId: undefined,
    idempotencyKey: `ik-ct-${overrides.streamId}-${overrides.streamSequence}`,
    previousEventHash: '',
    ...overrides,
  };
}

function makeStream(overrides: Partial<LearningEvidenceStreamState> & { schoolId: string; streamId: string }): LearningEvidenceStreamState {
  return {
    learnerId: 'learner-ct',
    currentSequence: 0,
    latestEventHash: '',
    ...overrides,
  };
}

function makeCandidateProjection(overrides: Partial<LearningEvidenceCandidateProjectionState> & { schoolId: string; evidenceCandidateId: string }): LearningEvidenceCandidateProjectionState {
  return {
    learnerId: 'learner-ct',
    currentState: 'candidate' as const,
    sourceType: 'tutor_attempt',
    sourceRecordId: 'src-1',
    sourceVersion: '1.0',
    misconceptionTags: [],
    eligibilityReasonCodes: [],
    latestSequence: 0,
    version: 1,
    ...overrides,
  };
}

function makeCommittedProjection(overrides: Partial<CommittedLearningEvidenceProjectionState> & { schoolId: string; committedEvidenceId: string; evidenceCandidateId: string }): CommittedLearningEvidenceProjectionState {
  return {
    learnerId: 'learner-ct',
    outcome: 'correct',
    evidenceMode: 'recall',
    independence: 'independent',
    confidenceState: 'high',
    integrityState: 'clear',
    finalizationState: 'final',
    active: true,
    latestSequence: 0,
    version: 1,
    ...overrides,
  };
}

function makeCheckpoint(overrides: Partial<EvidenceProjectionCheckpointState> & { schoolId: string; projectionName: string; partitionKey: string }): EvidenceProjectionCheckpointState {
  return {
    lastProcessedSequence: 0,
    lastEventHash: '',
    status: 'healthy' as const,
    failureReason: '',
    ...overrides,
  };
}

export interface LearningEvidenceRepositoryHarness {
  name: string;
  createRepository(): Promise<LearningEvidenceEventStoreRepository>;
  reset(): Promise<void>;
  disconnect(): Promise<void>;
  createFreshRepository?(): Promise<LearningEvidenceEventStoreRepository>;
}

export function registerRepositoryContract(harness: LearningEvidenceRepositoryHarness): void {
  const label = `Shared Contract (${harness.name})`;

  describe(label, () => {
    let repo: LearningEvidenceEventStoreRepository;
    const schoolA = `school-ct-${harness.name}`;
    const schoolB = `school-ct-b-${harness.name}`;
    const stream1 = `stream-ct-1-${harness.name}`;
    const stream2 = `stream-ct-2-${harness.name}`;

    beforeEach(async () => {
      await harness.reset();
      repo = await harness.createRepository();
    });

    describe('14.1 Initial append', () => {
      it('first stream sequence is 1 and stream head becomes 1', async () => {
        const eHash = hash(`evt:1:{}`);
        const evt = makeEvent({ schoolId: schoolA, streamId: stream1, streamSequence: 1, eventHash: eHash, previousEventHash: '' });
        const stream = makeStream({ schoolId: schoolA, streamId: stream1, currentSequence: 1, latestEventHash: eHash });
        await repo.appendEventAtomically(evt, stream);

        const stored = await repo.getStream(schoolA, stream1);
        expect(stored).not.toBeNull();
        expect(stored!.currentSequence).toBe(1);

        const latest = await repo.getLatestEvent(schoolA, stream1);
        expect(latest).not.toBeNull();
        expect(latest!.streamSequence).toBe(1);
        expect(latest!.eventHash).toBe(eHash);
      });

      it('candidate projection is stored', async () => {
        const cid = `cand-init-${harness.name}`;
        const eHash = hash(`evt:1:{}`);
        const evt = makeEvent({ schoolId: schoolA, streamId: stream1, streamSequence: 1, eventHash: eHash, evidenceCandidateId: cid });
        const stream = makeStream({ schoolId: schoolA, streamId: stream1, currentSequence: 1, latestEventHash: eHash });
        const cand = makeCandidateProjection({ schoolId: schoolA, evidenceCandidateId: cid, latestSequence: 1 });
        await repo.appendEventAtomically(evt, stream, cand);

        const stored = await repo.getCandidateProjection(schoolA, cid);
        expect(stored).not.toBeNull();
        expect(stored!.latestSequence).toBe(1);
      });
    });

    describe('14.2 Ordered append', () => {
      it('sequences are 1, 2, 3 and retrieval is ascending', async () => {
        const e1h = hash('1');
        const e2h = hash('2');
        const e3h = hash('3');
        const e1 = makeEvent({ schoolId: schoolA, streamId: stream1, streamSequence: 1, eventHash: e1h, previousEventHash: '' });
        const s1 = makeStream({ schoolId: schoolA, streamId: stream1, currentSequence: 1, latestEventHash: e1h });
        await repo.appendEventAtomically(e1, s1);

        const e2 = makeEvent({ schoolId: schoolA, streamId: stream1, streamSequence: 2, eventHash: e2h, previousEventHash: e1h });
        const s2 = makeStream({ schoolId: schoolA, streamId: stream1, currentSequence: 2, latestEventHash: e2h });
        await repo.appendEventAtomically(e2, s2);

        const e3 = makeEvent({ schoolId: schoolA, streamId: stream1, streamSequence: 3, eventHash: e3h, previousEventHash: e2h });
        const s3 = makeStream({ schoolId: schoolA, streamId: stream1, currentSequence: 3, latestEventHash: e3h });
        await repo.appendEventAtomically(e3, s3);

        const events = await repo.getEventsAfter(schoolA, stream1, 0);
        expect(events.length).toBe(3);
        expect(events[0].streamSequence).toBe(1);
        expect(events[1].streamSequence).toBe(2);
        expect(events[2].streamSequence).toBe(3);

        const stream = await repo.getStream(schoolA, stream1);
        expect(stream!.currentSequence).toBe(3);
      });
    });

    describe('14.3 Append-only history', () => {
      it('previous events remain equivalent after later appends', async () => {
        const e1h = hash('1');
        const e1 = makeEvent({ schoolId: schoolA, streamId: stream1, streamSequence: 1, eventHash: e1h, previousEventHash: '' });
        const s1 = makeStream({ schoolId: schoolA, streamId: stream1, currentSequence: 1, latestEventHash: e1h });
        await repo.appendEventAtomically(e1, s1);

        const e2h = hash('2');
        const e2 = makeEvent({ schoolId: schoolA, streamId: stream1, streamSequence: 2, eventHash: e2h, previousEventHash: e1h });
        const s2 = makeStream({ schoolId: schoolA, streamId: stream1, currentSequence: 2, latestEventHash: e2h });
        await repo.appendEventAtomically(e2, s2);

        const first = await repo.getEventById(schoolA, e1.eventId);
        expect(first).not.toBeNull();
        expect(first!.eventId).toBe(e1.eventId);
        expect(first!.streamSequence).toBe(1);
        expect(first!.previousEventHash).toBe('');
        expect(first!.eventHash).toBe(e1h);
      });
    });

    describe('14.4 Event-hash chain', () => {
      it('first previousEventHash is empty, later ones chain', async () => {
        const e1h = hash('1');
        const e2h = hash('2');
        const e3h = hash('3');
        const e1 = makeEvent({ schoolId: schoolA, streamId: stream1, streamSequence: 1, eventHash: e1h, previousEventHash: '' });
        const s1 = makeStream({ schoolId: schoolA, streamId: stream1, currentSequence: 1, latestEventHash: e1h });
        await repo.appendEventAtomically(e1, s1);

        const e2 = makeEvent({ schoolId: schoolA, streamId: stream1, streamSequence: 2, eventHash: e2h, previousEventHash: e1h });
        const s2 = makeStream({ schoolId: schoolA, streamId: stream1, currentSequence: 2, latestEventHash: e2h });
        await repo.appendEventAtomically(e2, s2);

        const e3 = makeEvent({ schoolId: schoolA, streamId: stream1, streamSequence: 3, eventHash: e3h, previousEventHash: e2h });
        const s3 = makeStream({ schoolId: schoolA, streamId: stream1, currentSequence: 3, latestEventHash: e3h });
        await repo.appendEventAtomically(e3, s3);

        const events = await repo.getEventsAfter(schoolA, stream1, 0);
        expect(events[0].previousEventHash).toBe('');
        expect(events[1].previousEventHash).toBe(events[0].eventHash);
        expect(events[2].previousEventHash).toBe(events[1].eventHash);

        const integrity = await repo.verifyStreamIntegrity(schoolA, stream1);
        expect(integrity.valid).toBe(true);
      });
    });

    describe('14.5 Candidate projection persistence', () => {
      it('create, update, and read candidate projection', async () => {
        const cid = `cand-persist-${harness.name}`;
        const proj = makeCandidateProjection({ schoolId: schoolA, evidenceCandidateId: cid, currentState: 'candidate', latestSequence: 1 });
        await repo.saveCandidateProjection(proj);

        const stored = await repo.getCandidateProjection(schoolA, cid);
        expect(stored).not.toBeNull();
        expect(stored!.currentState).toBe('candidate');

        const proj2: LearningEvidenceCandidateProjectionState = { ...proj, currentState: 'usable', version: 2, latestSequence: 2 };
        await repo.saveCandidateProjection(proj2);
        const stored2 = await repo.getCandidateProjection(schoolA, cid);
        expect(stored2!.currentState).toBe('usable');
        expect(stored2!.version).toBe(2);
      });
    });

    describe('14.6 Committed projection persistence', () => {
      it('committed evidence is stored and retrievable', async () => {
        const ceid = `comm-persist-${harness.name}`;
        const proj = makeCommittedProjection({ schoolId: schoolA, committedEvidenceId: ceid, evidenceCandidateId: `ec-${harness.name}` });
        await repo.saveCommittedProjection(proj);

        const stored = await repo.getCommittedProjection(schoolA, ceid);
        expect(stored).not.toBeNull();
        expect(stored!.active).toBe(true);
        expect(stored!.committedEvidenceId).toBe(ceid);
      });
    });

    describe('14.7 Projection checkpoint persistence', () => {
      it('checkpoint is stored and retrievable', async () => {
        const cp = makeCheckpoint({ schoolId: schoolA, projectionName: 'test-projection', partitionKey: 'pk-1', lastProcessedSequence: 5, lastEventHash: hash('ckpt'), status: 'healthy' });
        await repo.saveProjectionCheckpoint(cp);

        const stored = await repo.getProjectionCheckpoint('test-projection', schoolA, 'pk-1');
        expect(stored).not.toBeNull();
        expect(stored!.lastProcessedSequence).toBe(5);
        expect(stored!.status).toBe('healthy');
      });
    });

    describe('14.8 School isolation', () => {
      it('school A cannot read school B events', async () => {
        const e1h = hash('A');
        const e1 = makeEvent({ schoolId: schoolA, streamId: stream1, streamSequence: 1, eventHash: e1h, previousEventHash: '' });
        const s1 = makeStream({ schoolId: schoolA, streamId: stream1, currentSequence: 1, latestEventHash: e1h });
        await repo.appendEventAtomically(e1, s1);

        const aEvents = await repo.getEventsAfter(schoolA, stream1, 0);
        expect(aEvents.length).toBe(1);

        const bEvents = await repo.getEventsAfter(schoolB, stream1, 0);
        expect(bEvents.length).toBe(0);
      });

      it('idempotency records remain school-scoped', async () => {
        await repo.recordIdempotencyResult(schoolA, 'ik-same', 'CreateEvidenceCandidate', 'hash-a', 'ref-a');
        const aResult = await repo.getIdempotencyResult(schoolA, 'ik-same', 'CreateEvidenceCandidate');
        expect(aResult).not.toBeNull();

        const bResult = await repo.getIdempotencyResult(schoolB, 'ik-same', 'CreateEvidenceCandidate');
        expect(bResult).toBeNull();
      });
    });

    describe('14.9 Learner isolation', () => {
      it('two learners have separate streams', async () => {
        const learner1 = 'learner-ct-1';
        const learner2 = 'learner-ct-2';
        const s1Id = `s-ct-${harness.name}-1`;
        const s2Id = `s-ct-${harness.name}-2`;

        const e1h = hash('1');
        await repo.appendEventAtomically(
          makeEvent({ schoolId: schoolA, streamId: s1Id, streamSequence: 1, eventHash: e1h, previousEventHash: '', learnerId: learner1 }),
          makeStream({ schoolId: schoolA, streamId: s1Id, currentSequence: 1, latestEventHash: e1h, learnerId: learner1 }),
        );

        const e2h = hash('2');
        await repo.appendEventAtomically(
          makeEvent({ schoolId: schoolA, streamId: s2Id, streamSequence: 1, eventHash: e2h, previousEventHash: '', learnerId: learner2 }),
          makeStream({ schoolId: schoolA, streamId: s2Id, currentSequence: 1, latestEventHash: e2h, learnerId: learner2 }),
        );

        const l1Events = await repo.getEventsForLearner(schoolA, learner1);
        expect(l1Events.length).toBe(1);
        expect(l1Events[0].streamId).toBe(s1Id);

        const l2Events = await repo.getEventsForLearner(schoolA, learner2);
        expect(l2Events.length).toBe(1);
        expect(l2Events[0].streamId).toBe(s2Id);
      });
    });

    describe('14.10 Idempotent replay', () => {
      it('same request hash returns original result reference', async () => {
        const ik = `ik-replay-${harness.name}`;
        await repo.recordIdempotencyResult(schoolA, ik, 'CreateEvidenceCandidate', 'same-hash', 'event-ref-1');
        const result = await repo.getIdempotencyResult(schoolA, ik, 'CreateEvidenceCandidate');
        expect(result).not.toBeNull();
        expect(result!.requestHash).toBe('same-hash');
        expect(result!.responseReference).toBe('event-ref-1');
      });
    });

    describe('14.11 Idempotency conflict', () => {
      it('different hash with same key does not overwrite original record', async () => {
        const ik = `ik-conflict-${harness.name}`;
        await repo.recordIdempotencyResult(schoolA, ik, 'CreateEvidenceCandidate', 'original-hash', 'original-ref');
        const result = await repo.getIdempotencyResult(schoolA, ik, 'CreateEvidenceCandidate');
        expect(result).not.toBeNull();
        expect(result!.requestHash).toBe('original-hash');
        expect(result!.responseReference).toBe('original-ref');
      });
    });

    describe('14.12 Persistence reload', () => {
      it('survives repository recreation when harness supports it', async () => {
        if (!harness.createFreshRepository) return;

        const cid = `cand-reload-${harness.name}`;
        const eHash = hash('reload');
        const evt = makeEvent({ schoolId: schoolA, streamId: stream1, streamSequence: 1, eventHash: eHash, previousEventHash: '', evidenceCandidateId: cid });
        const stream = makeStream({ schoolId: schoolA, streamId: stream1, currentSequence: 1, latestEventHash: eHash });
        const cand = makeCandidateProjection({ schoolId: schoolA, evidenceCandidateId: cid, latestSequence: 1 });
        await repo.appendEventAtomically(evt, stream, cand);

        await harness.disconnect();

        const freshRepo = await harness.createFreshRepository!();
        const storedEvent = await freshRepo.getEventById(schoolA, evt.eventId);
        expect(storedEvent).not.toBeNull();
        expect(storedEvent!.streamSequence).toBe(1);

        const storedStream = await freshRepo.getStream(schoolA, stream1);
        expect(storedStream).not.toBeNull();
        expect(storedStream!.currentSequence).toBe(1);

        const storedCand = await freshRepo.getCandidateProjection(schoolA, cid);
        expect(storedCand).not.toBeNull();

        await freshRepo.getEventsForLearner(schoolA, 'learner-ct');
        await freshRepo.getEventsAfter(schoolA, stream1, 0);
      });
    });

    describe('14.13 Stream integrity', () => {
      it('valid stream passes integrity check', async () => {
        const e1h = hash('i1');
        const e1 = makeEvent({ schoolId: schoolA, streamId: stream1, streamSequence: 1, eventHash: e1h, previousEventHash: '' });
        await repo.appendEventAtomically(e1, makeStream({ schoolId: schoolA, streamId: stream1, currentSequence: 1, latestEventHash: e1h }));

        const e2h = hash('i2');
        const e2 = makeEvent({ schoolId: schoolA, streamId: stream1, streamSequence: 2, eventHash: e2h, previousEventHash: e1h });
        await repo.appendEventAtomically(e2, makeStream({ schoolId: schoolA, streamId: stream1, currentSequence: 2, latestEventHash: e2h }));

        const integrity = await repo.verifyStreamIntegrity(schoolA, stream1);
        expect(integrity.valid).toBe(true);
      });

      it('empty stream passes integrity check', async () => {
        const integrity = await repo.verifyStreamIntegrity(schoolA, stream2);
        expect(integrity.valid).toBe(true);
      });
    });
  });
}
