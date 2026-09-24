// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-09 (A):
// integrity observations / privacy.
//
// Proves: hidden/visible observations persist with bounded metadata;
// surveillance-shaped metadata is rejected and never persisted; client
// time is context only (server receive order authoritative);
// malformed/out-of-order sequences never fabricate duration;
// cross-school and cross-learner access denied; process-local memory is
// never production authority; persistence failure fails closed.
// Prisma mocked unavailable; explicit doubles only. No DB. No models.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/prisma', () => {
  return {
    default: {
      $queryRaw: vi.fn().mockRejectedValue(new Error('Prisma mocked unavailable')),
      $executeRawUnsafe: vi.fn().mockRejectedValue(new Error('Prisma mocked unavailable')),
      $queryRawUnsafe: vi.fn().mockRejectedValue(new Error('Prisma mocked unavailable')),
      practiceAttempt: {
        create: vi.fn().mockRejectedValue(new Error('Prisma mocked unavailable')),
        findMany: vi.fn().mockRejectedValue(new Error('Prisma mocked unavailable')),
        findUnique: vi.fn().mockRejectedValue(new Error('Prisma mocked unavailable')),
      },
    },
  };
});

import {
  recordIntegrityObservation,
  evaluatePracticeIntegrity,
  type PracticePadIntegrityIdentity,
} from '../services/practicePadRuntime/practicePadIntegrityEngine';
import {
  practicePadIntegrityStore,
  _clearPracticePadIntegrityRecordsForTest,
  __enablePracticePadIntegrityMemoryForTest,
  __setPracticePadIntegrityFailWritesForTest,
} from '../services/practicePadRuntime/practicePadIntegrityStore';
import { PracticePadIntegrityPersistenceError } from '../services/practicePadRuntime/practicePadIntegrityContracts';
import { practiceAttemptService, _clearAttemptStoreForTest, __setPracticeAttemptDurableForTest } from '../services/practiceAttemptService';

const SCHOOL = 'school-pp09-obs';
const LEARNER = 'learner-pp09-obs';
const identity: PracticePadIntegrityIdentity = { schoolId: SCHOOL, studentId: LEARNER, verifiedSchool: true };

const BASE = Date.parse('2026-01-01T00:00:00.000Z');
let tick = 0;
const clock = (): string => {
  const iso = new Date(BASE + tick * 1000).toISOString();
  tick += 1;
  return iso;
};

async function createAttempt(): Promise<string> {
  const created = await practiceAttemptService.createPracticeAttempt(
    { schoolId: SCHOOL, studentId: LEARNER },
    {
      kind: 'open_response',
      promptSummary: 'pp09 observation probe',
      subject: 'maths',
      topic: 'pp09',
      outcome: 'not_evaluated',
    },
  );
  return created.attempt.attemptId;
}

describe('Practice Pad PP-09 (A) — integrity observations / privacy', () => {
  beforeEach(async () => {
    __enablePracticePadIntegrityMemoryForTest();
    await _clearPracticePadIntegrityRecordsForTest();
    __setPracticeAttemptDurableForTest(true);
    _clearAttemptStoreForTest();
    tick = 0;
    vi.clearAllMocks();
  });

  it('1. hidden/visible observations persist with bounded metadata', async () => {
    const attemptId = await createAttempt();
    const hide = await recordIntegrityObservation(
      identity,
      { attemptId, eventId: 'pp09-a1-hide', eventType: 'PRACTICE_HIDDEN', metadata: { basedOnVersion: 1 } },
      { clock },
    );
    expect(hide.ok).toBe(true);
    if (!hide.ok || !hide.observation) return;
    expect(hide.observation.serverReceivedAt).toBeTruthy();
    expect(hide.observation.outOfOrder).toBe(false);
    const show = await recordIntegrityObservation(
      identity,
      { attemptId, eventId: 'pp09-a1-show', eventType: 'PRACTICE_VISIBLE', metadata: { basedOnVersion: 1 } },
      { clock },
    );
    expect(show.ok).toBe(true);
    const stored = await practicePadIntegrityStore.findObservation('pp09-a1-hide');
    expect(stored).not.toBeNull();
    expect(stored?.attemptId).toBe(attemptId);
    expect(JSON.parse(stored?.metadataJson || '{}')).toEqual({ basedOnVersion: 1 });
  });

  it('2. destination URL / external tab content is rejected and never persisted', async () => {
    const attemptId = await createAttempt();
    const withUrl = await recordIntegrityObservation(
      identity,
      { attemptId, eventId: 'pp09-a2-url', eventType: 'PRACTICE_HIDDEN', metadata: { destinationUrl: 'https://example.com/answers' } as any },
      { clock },
    );
    expect(withUrl.ok).toBe(false);
    if (withUrl.ok) return;
    expect(withUrl.code).toBe('INVALID_EVENT');
    expect(await practicePadIntegrityStore.findObservation('pp09-a2-url')).toBeNull();

    const withTab = await recordIntegrityObservation(
      identity,
      { attemptId, eventId: 'pp09-a2-tab', eventType: 'FOCUS_LOST', metadata: { tabContent: 'other tab text' } as any },
      { clock },
    );
    expect(withTab.ok).toBe(false);
    if (withTab.ok) return;
    expect(withTab.code).toBe('INVALID_EVENT');
    expect(await practicePadIntegrityStore.findObservation('pp09-a2-tab')).toBeNull();

    const withBlob = await recordIntegrityObservation(
      identity,
      { attemptId, eventId: 'pp09-a2-blob', eventType: 'PRACTICE_HIDDEN', metadata: { anythingGoes: 'free-form blob' } as any },
      { clock },
    );
    expect(withBlob.ok).toBe(false);
    if (withBlob.ok) return;
    expect(withBlob.code).toBe('INVALID_EVENT');
  });

  it('3. client timestamp alone is not authoritative; server order wins', async () => {
    const attemptId = await createAttempt();
    await recordIntegrityObservation(
      identity,
      {
        attemptId,
        eventId: 'pp09-a3-hide',
        eventType: 'PRACTICE_HIDDEN',
        clientObservedAt: new Date(BASE + 3600_000).toISOString(),
      },
      { clock },
    );
    const show = await recordIntegrityObservation(
      identity,
      {
        attemptId,
        eventId: 'pp09-a3-show',
        eventType: 'PRACTICE_VISIBLE',
        clientObservedAt: new Date(BASE - 3600_000).toISOString(),
      },
      { clock },
    );
    expect(show.ok).toBe(true);
    if (!show.ok || !show.observation) return;
    // Client chronology is inverted, but the server received hide first.
    expect(show.observation.outOfOrder).toBe(true);
    const evaluated = await evaluatePracticeIntegrity(identity, { attemptId, idempotencyKey: 'pp09-a3-eval' }, { clock });
    expect(evaluated.ok).toBe(true);
    if (!evaluated.ok || !evaluated.evidence) return;
    // Exactly one factual interval, paired in server order — no invention.
    expect(evaluated.evidence.observationWindow.visibilityIntervals).toHaveLength(1);
    expect(evaluated.evidence.signals).toEqual(['VISIBILITY_INTERRUPTION']);
  });

  it('4. malformed sequences (duplicate hide, missing return) fabricate no duration', async () => {
    const attemptId = await createAttempt();
    await recordIntegrityObservation(identity, { attemptId, eventId: 'pp09-a4-h1', eventType: 'PRACTICE_HIDDEN' }, { clock });
    await recordIntegrityObservation(identity, { attemptId, eventId: 'pp09-a4-h2', eventType: 'PRACTICE_HIDDEN' }, { clock });
    await recordIntegrityObservation(identity, { attemptId, eventId: 'pp09-a4-s1', eventType: 'PRACTICE_VISIBLE' }, { clock });
    const evaluated = await evaluatePracticeIntegrity(identity, { attemptId, idempotencyKey: 'pp09-a4-eval' }, { clock });
    expect(evaluated.ok).toBe(true);
    if (!evaluated.ok || !evaluated.evidence) return;
    // Duplicate hide contributes no second interval and no extra signal.
    expect(evaluated.evidence.observationWindow.visibilityIntervals).toHaveLength(1);
    expect(evaluated.evidence.signals.filter((s) => s === 'VISIBILITY_INTERRUPTION')).toHaveLength(1);

    const attemptId2 = await createAttempt();
    await recordIntegrityObservation(identity, { attemptId: attemptId2, eventId: 'pp09-a4-open', eventType: 'FOCUS_LOST' }, { clock });
    const evaluated2 = await evaluatePracticeIntegrity(identity, { attemptId: attemptId2, idempotencyKey: 'pp09-a4-eval2' }, { clock });
    expect(evaluated2.ok).toBe(true);
    if (!evaluated2.ok || !evaluated2.evidence) return;
    // Missing return: no interval invented, no visibility signal.
    expect(evaluated2.evidence.observationWindow.visibilityIntervals).toHaveLength(0);
    expect(evaluated2.evidence.signals).not.toContain('VISIBILITY_INTERRUPTION');
  });

  it('5. cross-school access is denied', async () => {
    const attemptId = await createAttempt();
    const foreignOwner = {
      getPracticeAttempt: async () => ({ attemptId, schoolId: SCHOOL, studentId: LEARNER }),
    };
    const foreignIdentity: PracticePadIntegrityIdentity = { schoolId: 'other-school', studentId: LEARNER, verifiedSchool: true };
    const outcome = await recordIntegrityObservation(
      foreignIdentity,
      { attemptId, eventId: 'pp09-a5-x', eventType: 'PRACTICE_HIDDEN' },
      { clock, attemptOwner: foreignOwner as any },
    );
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.code).toBe('FORBIDDEN');
    expect(await practicePadIntegrityStore.findObservation('pp09-a5-x')).toBeNull();
  });

  it('6. cross-learner access is denied', async () => {
    const attemptId = await createAttempt();
    const foreignOwner = {
      getPracticeAttempt: async () => ({ attemptId, schoolId: SCHOOL, studentId: LEARNER }),
    };
    const foreignIdentity: PracticePadIntegrityIdentity = { schoolId: SCHOOL, studentId: 'other-learner', verifiedSchool: true };
    const outcome = await recordIntegrityObservation(
      foreignIdentity,
      { attemptId, eventId: 'pp09-a6-x', eventType: 'FOCUS_LOST' },
      { clock, attemptOwner: foreignOwner as any },
    );
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.code).toBe('FORBIDDEN');
    expect(await practicePadIntegrityStore.findObservation('pp09-a6-x')).toBeNull();
  });

  it('7. process-local memory is not production authority: writes still fail closed', async () => {
    // The explicit test double is installed, yet a dead database must
    // throw from the store itself — memory never fabricates success.
    __setPracticePadIntegrityFailWritesForTest(true);
    try {
      await expect(
        practicePadIntegrityStore.insertObservation({
          eventId: 'pp09-a7-direct',
          schoolId: SCHOOL,
          studentId: LEARNER,
          attemptId: 'attempt-pp09-a7',
          eventType: 'PRACTICE_HIDDEN',
          clientObservedAt: null,
          serverReceivedAt: clock(),
          serverSeq: 1,
          outOfOrder: false,
          metadataJson: '{}',
          createdAt: clock(),
        }),
      ).rejects.toBeInstanceOf(PracticePadIntegrityPersistenceError);
    } finally {
      __setPracticePadIntegrityFailWritesForTest(false);
    }
  });

  it('8. persistence failure fails closed with no evidence success', async () => {
    const attemptId = await createAttempt();
    await recordIntegrityObservation(identity, { attemptId, eventId: 'pp09-a8-h', eventType: 'PRACTICE_HIDDEN' }, { clock });
    __setPracticePadIntegrityFailWritesForTest(true);
    try {
      const record = await recordIntegrityObservation(
        identity,
        { attemptId, eventId: 'pp09-a8-s', eventType: 'PRACTICE_VISIBLE' },
        { clock },
      );
      expect(record.ok).toBe(false);
      if (record.ok) return;
      expect(record.code).toBe('PERSISTENCE_FAILED');
      const evaluated = await evaluatePracticeIntegrity(identity, { attemptId, idempotencyKey: 'pp09-a8-eval' }, { clock });
      expect(evaluated.ok).toBe(false);
      if (evaluated.ok) return;
      expect(evaluated.code).toBe('PERSISTENCE_FAILED');
    } finally {
      __setPracticePadIntegrityFailWritesForTest(false);
    }
  });
});
