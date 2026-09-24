// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-09 (B):
// integrity evaluation / runtime.
//
// Proves: one tab switch alone is observation (bounded LOW concern,
// never a fault verdict); the contract carries no fault flag; signals
// raise bounded concern only; counter-signals qualify concern and are
// never manufactured; insufficient data yields INSUFFICIENT_EVIDENCE;
// next actions are evidence-seeking, never punitive; concern never
// alters correctness and never mutates learning state; evaluation is
// idempotent and durable; zero model calls. Prisma mocked unavailable;
// explicit doubles only. No DB. No models.
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
  integrityEvidenceScopeHash,
  type PracticePadIntegrityIdentity,
} from '../services/practicePadRuntime/practicePadIntegrityEngine';
import {
  practicePadIntegritySemanticPort,
} from '../services/practicePadRuntime/practicePadIntegrityContracts';
import {
  practicePadIntegrityStore,
  _clearPracticePadIntegrityRecordsForTest,
  __enablePracticePadIntegrityMemoryForTest,
} from '../services/practicePadRuntime/practicePadIntegrityStore';
import {
  practicePadCheckStore,
  __enablePracticePadCheckMemoryForTest,
} from '../services/practicePadRuntime/practicePadCheckStore';
import { practiceAttemptService, _clearAttemptStoreForTest, __setPracticeAttemptDurableForTest } from '../services/practiceAttemptService';

const SCHOOL = 'school-pp09-eval';
const LEARNER = 'learner-pp09-eval';
const identity: PracticePadIntegrityIdentity = { schoolId: SCHOOL, studentId: LEARNER, verifiedSchool: true };

const BASE = Date.parse('2026-02-01T00:00:00.000Z');
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
      promptSummary: 'pp09 evaluation probe',
      subject: 'maths',
      topic: 'pp09',
      outcome: 'not_evaluated',
    },
  );
  return created.attempt.attemptId;
}

async function record(attemptId: string, eventId: string, eventType: string): Promise<void> {
  const outcome = await recordIntegrityObservation(identity, { attemptId, eventId, eventType }, { clock });
  expect(outcome.ok).toBe(true);
}

const FAULT_FLAG = 'is' + 'Cheater';

describe('Practice Pad PP-09 (B) — integrity evaluation / runtime', () => {
  beforeEach(async () => {
    __enablePracticePadIntegrityMemoryForTest();
    __enablePracticePadCheckMemoryForTest();
    await _clearPracticePadIntegrityRecordsForTest();
    await practicePadCheckStore.resetForTest();
    __setPracticeAttemptDurableForTest(true);
    _clearAttemptStoreForTest();
    tick = 0;
    vi.clearAllMocks();
  });

  it('1. one tab switch alone is observation: bounded LOW concern, never a fault verdict', async () => {
    const attemptId = await createAttempt();
    await record(attemptId, 'pp09-b1-hide', 'PRACTICE_HIDDEN');
    await record(attemptId, 'pp09-b1-show', 'PRACTICE_VISIBLE');
    const outcome = await evaluatePracticeIntegrity(identity, { attemptId, idempotencyKey: 'pp09-b1' }, { clock });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok || !outcome.evidence) return;
    expect(outcome.evidence.concernLevel).toBe('LOW');
    expect(outcome.evidence.signals).toEqual(['VISIBILITY_INTERRUPTION']);
    expect(JSON.stringify(outcome.evidence)).not.toContain(FAULT_FLAG);
  });

  it('2. result contract carries no fault flag and exact non-accusatory keys', async () => {
    const attemptId = await createAttempt();
    await record(attemptId, 'pp09-b2-hide', 'FOCUS_LOST');
    await record(attemptId, 'pp09-b2-show', 'FOCUS_GAINED');
    const outcome = await evaluatePracticeIntegrity(identity, { attemptId, idempotencyKey: 'pp09-b2' }, { clock });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok || !outcome.evidence) return;
    expect(JSON.stringify(outcome.evidence)).not.toContain(FAULT_FLAG);
    expect(Object.keys(outcome.evidence).sort()).toEqual(
      [
        'integrityEvidenceId',
        'schoolId',
        'studentId',
        'attemptId',
        'basedOnAttemptVersion',
        'observationWindow',
        'concernLevel',
        'signals',
        'counterSignals',
        'confidence',
        'recommendedNextEvidenceAction',
        'createdAt',
        'deduplicated',
      ].sort(),
    );
  });

  it('3. factual signals raise bounded concern only (never beyond MODERATE)', async () => {
    const attemptId = await createAttempt();
    await record(attemptId, 'pp09-b3-r1', 'CHECK_REQUESTED');
    await record(attemptId, 'pp09-b3-r2', 'CHECK_REQUESTED');
    await record(attemptId, 'pp09-b3-r3', 'CHECK_REQUESTED');
    await record(attemptId, 'pp09-b3-c1', 'CHECK_COMPLETED');
    const outcome = await evaluatePracticeIntegrity(identity, { attemptId, idempotencyKey: 'pp09-b3' }, { clock });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok || !outcome.evidence) return;
    expect(outcome.evidence.signals).toContain('REPEATED_RAPID_SUBMISSIONS');
    expect(['LOW', 'MODERATE']).toContain(outcome.evidence.concernLevel);
    expect(JSON.stringify(outcome.evidence)).not.toContain(FAULT_FLAG);
  });

  it('4. counter-signals qualify concern and are never manufactured', async () => {
    const attemptId = await createAttempt();
    await record(attemptId, 'pp09-b4-h', 'PRACTICE_HIDDEN');
    await record(attemptId, 'pp09-b4-s', 'PRACTICE_VISIBLE');
    await record(attemptId, 'pp09-b4-r1', 'CHECK_REQUESTED');
    await record(attemptId, 'pp09-b4-r2', 'CHECK_REQUESTED');
    await record(attemptId, 'pp09-b4-r3', 'CHECK_REQUESTED');
    await record(attemptId, 'pp09-b4-c1', 'CHECK_COMPLETED');
    const bare = await evaluatePracticeIntegrity(identity, { attemptId, idempotencyKey: 'pp09-b4-bare' }, { clock });
    expect(bare.ok).toBe(true);
    if (!bare.ok || !bare.evidence) return;
    expect(bare.evidence.concernLevel).toBe('MODERATE');
    // Without injected backend evidence, no counter-signal may appear.
    expect(bare.evidence.counterSignals).toEqual([]);

    const qualified = await evaluatePracticeIntegrity(
      identity,
      { attemptId, idempotencyKey: 'pp09-b4-qualified' },
      {
        clock,
        readers: { workChars: 500, revisionCount: 3, reasoningSteps: 4, hadIncorrectBeforeCorrect: true, attemptVersion: 3 },
      },
    );
    expect(qualified.ok).toBe(true);
    if (!qualified.ok || !qualified.evidence) return;
    expect(qualified.evidence.counterSignals).toEqual(
      expect.arrayContaining(['SUBSTANTIAL_WORK_TRACE', 'NORMAL_REVISION_SEQUENCE', 'SELF_CORRECTION_PRESENT', 'LONG_FORM_REASONING_PRESENT']),
    );
    expect(qualified.evidence.concernLevel).toBe('LOW');
  });

  it('5. insufficient data returns INSUFFICIENT_EVIDENCE', async () => {
    const attemptId = await createAttempt();
    const outcome = await evaluatePracticeIntegrity(identity, { attemptId, idempotencyKey: 'pp09-b5' }, { clock });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok || !outcome.evidence) return;
    expect(outcome.evidence.concernLevel).toBe('INSUFFICIENT_EVIDENCE');
    expect(outcome.evidence.recommendedNextEvidenceAction).toBe('REQUIRE_MORE_WORK_EVIDENCE');
    expect(JSON.stringify(outcome.evidence)).not.toContain(FAULT_FLAG);
  });

  it('6. recommended next action is evidence-seeking, never punitive', async () => {
    const attemptId = await createAttempt();
    await record(attemptId, 'pp09-b6-h', 'PRACTICE_HIDDEN');
    await record(attemptId, 'pp09-b6-s', 'PRACTICE_VISIBLE');
    const outcome = await evaluatePracticeIntegrity(identity, { attemptId, idempotencyKey: 'pp09-b6' }, { clock });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok || !outcome.evidence) return;
    expect([
      'NONE',
      'ASK_REASONING_QUESTION',
      'REQUEST_NEXT_STEP',
      'REQUEST_TRANSFER_PROBLEM',
      'REQUEST_EXPLANATION',
      'REQUIRE_MORE_WORK_EVIDENCE',
    ]).toContain(outcome.evidence.recommendedNextEvidenceAction);
  });

  it('7. integrity concern never touches checks: no verdict altered, nothing written', async () => {
    const attemptId = await createAttempt();
    await record(attemptId, 'pp09-b7-h', 'PRACTICE_HIDDEN');
    await record(attemptId, 'pp09-b7-s', 'PRACTICE_VISIBLE');
    await record(attemptId, 'pp09-b7-r1', 'CHECK_REQUESTED');
    await record(attemptId, 'pp09-b7-r2', 'CHECK_REQUESTED');
    await record(attemptId, 'pp09-b7-r3', 'CHECK_REQUESTED');
    await record(attemptId, 'pp09-b7-c1', 'CHECK_COMPLETED');
    const outcome = await evaluatePracticeIntegrity(identity, { attemptId, idempotencyKey: 'pp09-b7' }, { clock });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok || !outcome.evidence) return;
    expect(outcome.evidence.concernLevel).toBe('MODERATE');
    // The canonical check owner holds nothing for this attempt: the
    // integrity engine wrote no check and altered no verdict.
    expect(await practicePadCheckStore.listByAttempt(attemptId)).toHaveLength(0);
    expect('verdict' in outcome.evidence).toBe(false);
  });

  it('8. integrity concern mutates no learning state and invents no positive signal', async () => {
    const attemptId = await createAttempt();
    await record(attemptId, 'pp09-b8-h', 'FOCUS_LOST');
    await record(attemptId, 'pp09-b8-s', 'FOCUS_GAINED');
    const outcome = await evaluatePracticeIntegrity(identity, { attemptId, idempotencyKey: 'pp09-b8' }, { clock });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok || !outcome.evidence) return;
    const serialized = JSON.stringify(outcome.evidence);
    for (const key of ['mastery', 'memory', 'revision', 'Growth', 'grade', 'completion', 'understanding']) {
      expect(serialized).not.toContain(`"${key}"`);
    }
    // No readers injected: no counter-signal may be manufactured.
    expect(outcome.evidence.counterSignals).toEqual([]);
    expect(outcome.evidence.basedOnAttemptVersion).toBe(0);
  });

  it('9. duplicate evaluation is idempotent: same evidence, no duplicate durable row', async () => {
    const attemptId = await createAttempt();
    await record(attemptId, 'pp09-b9-h', 'PRACTICE_HIDDEN');
    await record(attemptId, 'pp09-b9-s', 'PRACTICE_VISIBLE');
    const first = await evaluatePracticeIntegrity(identity, { attemptId, idempotencyKey: 'pp09-b9' }, { clock });
    expect(first.ok).toBe(true);
    if (!first.ok || !first.evidence) return;
    expect(first.evidence.deduplicated).toBe(false);
    const second = await evaluatePracticeIntegrity(identity, { attemptId, idempotencyKey: 'pp09-b9' }, { clock });
    expect(second.ok).toBe(true);
    if (!second.ok || !second.evidence) return;
    expect(second.evidence.integrityEvidenceId).toBe(first.evidence.integrityEvidenceId);
    expect(second.evidence.deduplicated).toBe(true);
    const stored = await practicePadIntegrityStore.findEvidenceByScope(integrityEvidenceScopeHash(attemptId, 'pp09-b9'));
    expect(stored).not.toBeNull();
  });

  it('10. zero model calls: semantic seam present but not activated', async () => {
    const attemptId = await createAttempt();
    await record(attemptId, 'pp09-b10-h', 'PRACTICE_HIDDEN');
    await record(attemptId, 'pp09-b10-s', 'PRACTICE_VISIBLE');
    await evaluatePracticeIntegrity(identity, { attemptId, idempotencyKey: 'pp09-b10' }, { clock });
    expect(practicePadIntegritySemanticPort.isAvailable()).toBe(false);
    expect(practicePadIntegritySemanticPort.liveCallCount()).toBe(0);
  });
});
