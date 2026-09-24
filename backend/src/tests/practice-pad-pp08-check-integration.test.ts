// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-08 (B/2):
// canonical check integration for non-text work.
//
// Proves: handwriting-only work is never graded without a confirmed
// interpretation; confirmed math reuses PP-04/PP-05; diagrams stay
// truthfully unsupported; mixed work checks independent text; stale
// interpretations never apply; persistence failure never yields
// success; zero model calls. Prisma mocked unavailable; explicit
// doubles only. No DB. No migrations. No OCR.
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
  checkPracticePadStepCanonical,
  _clearPracticePadCheckRecordsForTest,
  type PracticePadVerifiedIdentity,
} from '../services/practicePadRuntime/practicePadCheckRuntime';
import { practiceAttemptService, _clearAttemptStoreForTest, __setPracticeAttemptDurableForTest } from '../services/practiceAttemptService';
import { practicePadWorkVersionStore, __enablePracticePadWorkVersionMemoryForTest } from '../services/practicePadRuntime/practicePadWorkVersionStore';
import { __enablePracticePadCheckMemoryForTest } from '../services/practicePadRuntime/practicePadCheckStore';
import {
  practicePadDocumentStore,
  __enablePracticePadDocumentMemoryForTest,
} from '../services/practicePadRuntime/practicePadDocumentStore';
import { blockContentHash } from '../services/practicePadRuntime/practicePadDocumentContracts';
import { practicePadProblemAuthority } from '../services/practicePadRuntime/practicePadProblemAuthority';
import { practicePadSemanticPort } from '../services/practicePadRuntime/practicePadSemanticPort';
import { practicePadInkInterpreterPort } from '../services/practicePadRuntime/practicePadInkInterpreterPort';
import {
  practicePadCheckStore,
  parseCheckResult,
  __setPracticePadCheckFailWritesForTest,
} from '../services/practicePadRuntime/practicePadCheckStore';
import {
  practicePadInterpretationStore,
  __enablePracticePadInterpretationMemoryForTest,
  __setPracticePadInterpretationFailWritesForTest,
} from '../services/practicePadRuntime/practicePadInterpretationStore';

const SCHOOL = 'school-pp08-check';
const LEARNER = 'learner-pp08-check';
const identity: PracticePadVerifiedIdentity = { schoolId: SCHOOL, studentId: LEARNER, verifiedSchool: true };

function inkBlock(blockId = 'ink1', extraStroke = false) {
  const ink: Array<{ strokeId: string; points: Array<{ x: number; y: number; timestampOffsetMs: number }> }> = [
    { strokeId: 's1', points: [{ x: 10, y: 20, timestampOffsetMs: 0 }, { x: 30, y: 40, timestampOffsetMs: 100 }] },
  ];
  if (extraStroke) ink.push({ strokeId: 's2-new', points: [{ x: 5, y: 5, timestampOffsetMs: 0 }] });
  return { blockId, kind: 'HANDWRITING', order: 0, ink };
}

function registerAlgebraProblem(): void {
  practicePadProblemAuthority.registerProblem({
    problemId: 'pp08-linear',
    prompt: 'Solve for x: 2(x + 3) = 14',
    subject: 'maths',
    topic: 'linear equations',
    allowedResources: [],
    expectedAnswer: 'x = 4',
    evaluationPlan: 'pp08-linear-equivalence',
    evaluationType: 'deterministic_algebraic',
    acceptableAnswerForms: ['2x + 6 = 14'],
    schoolId: SCHOOL,
  });
}

async function createAttempt(): Promise<string> {
  const created = await practiceAttemptService.createPracticeAttempt(
    { schoolId: SCHOOL, studentId: LEARNER },
    {
      kind: 'open_response',
      promptSummary: 'problem pp08-linear',
      subject: 'maths',
      topic: 'pp08',
      sourceQuestionId: 'pp08-linear',
      outcome: 'not_evaluated',
    },
  );
  await practicePadWorkVersionStore.seedVersion(created.attempt.attemptId, 1);
  return created.attempt.attemptId;
}

async function saveInkRevision(attemptId: string, key: string, version: number, extraStroke = false) {
  return practicePadDocumentStore.savePracticeWork({
    identity: { schoolId: SCHOOL, studentId: LEARNER },
    attemptId,
    expectedCurrentVersion: version,
    idempotencyKey: key,
    snapshot: { blocks: [inkBlock('ink1', extraStroke)] },
  });
}

async function proposeAndConfirm(attemptId: string, version: number, hash: string, candidate: { candidateId: string; representationClass: string; normalizedValue: string; confidence: number }) {
  const proposed = await practicePadInterpretationStore.proposeInterpretation({
    identity: { schoolId: SCHOOL, studentId: LEARNER },
    attemptId,
    documentVersion: version,
    sourceBlockId: 'ink1',
    sourceContentHash: hash,
    candidates: [{ ...candidate, provenance: 'backend-test' }],
  });
  if (!proposed.ok) return proposed;
  return practicePadInterpretationStore.confirmPracticeInterpretation({
    identity: { schoolId: SCHOOL, studentId: LEARNER },
    attemptId,
    documentVersion: version,
    interpretationId: proposed.interpretation.interpretationId,
    candidateId: candidate.candidateId,
    sourceBlockId: 'ink1',
    sourceContentHash: hash,
  });
}

describe('Practice Pad PP-08 (B) — canonical check integration', () => {
  beforeEach(async () => {
    __enablePracticePadDocumentMemoryForTest();
    __enablePracticePadCheckMemoryForTest();
    __enablePracticePadWorkVersionMemoryForTest();
    __enablePracticePadInterpretationMemoryForTest();
    __setPracticeAttemptDurableForTest(true);
    _clearAttemptStoreForTest();
    await _clearPracticePadCheckRecordsForTest();
    await practicePadDocumentStore.resetForTest();
    await practicePadWorkVersionStore.resetForTest();
    await practicePadInterpretationStore.resetForTest();
    practicePadProblemAuthority.resetForTest();
    registerAlgebraProblem();
    vi.clearAllMocks();
  });

  it('1. handwriting-only + no confirmed interpretation → interpretation required / clarification', async () => {
    const attemptId = await createAttempt();
    const saved = await saveInkRevision(attemptId, 'pp08-b1', 1);
    expect(saved.ok).toBe(true);
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp08-b1-check', workText: '', selectedStep: 'ink1',
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.status).toBe('NEEDS_CLARIFICATION');
    expect(outcome.result.interpretationRequired).toBe(true);
    expect(outcome.result.interpretation?.sourceBlockId).toBe('ink1');
  });

  it('2. that case creates zero negative evidence', async () => {
    const attemptId = await createAttempt();
    await saveInkRevision(attemptId, 'pp08-b2', 1);
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp08-b2-check', workText: '', selectedStep: 'ink1',
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.status).not.toBe('CONFIRMED_CORRECT');
    expect(outcome.result.status).not.toBe('CONFIRMED_INCORRECT');
    expect(outcome.result.evidenceCandidate).toBeNull();
    expect(outcome.result.misconceptionCandidate).toBeNull();
  });

  it('3. confirmed EQUATION interpretation uses the existing PP-04 math evaluator', async () => {
    const attemptId = await createAttempt();
    const saved = await saveInkRevision(attemptId, 'pp08-b3', 1);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const hash = blockContentHash(saved.revision.snapshot.blocks[0]);
    const confirmed = await proposeAndConfirm(attemptId, 1, hash, {
      candidateId: 'c1', representationClass: 'EQUATION', normalizedValue: 'x = 4', confidence: 0.9,
    });
    expect(confirmed.ok).toBe(true);
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp08-b3-check', workText: '', selectedStep: 'ink1',
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.status).toBe('CONFIRMED_CORRECT');
    expect(outcome.result.deterministicVerdict).toBe('correct');
  });

  it('4. confirmed interpretation still uses PP-05 reasoning where applicable', async () => {
    const attemptId = await createAttempt();
    const saved = await saveInkRevision(attemptId, 'pp08-b4', 1);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const hash = blockContentHash(saved.revision.snapshot.blocks[0]);
    await proposeAndConfirm(attemptId, 1, hash, {
      candidateId: 'c1', representationClass: 'EQUATION', normalizedValue: 'x = 4', confidence: 0.9,
    });
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp08-b4-check', workText: '', selectedStep: 'ink1',
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.status).toBe('CONFIRMED_CORRECT');
    expect(Array.isArray(outcome.result.confirmedCorrectSteps)).toBe(true);
    expect(outcome.result.intervention).toBeDefined();
  });

  it('5. raw handwriting remains unchanged after confirmation and checking', async () => {
    const attemptId = await createAttempt();
    const saved = await saveInkRevision(attemptId, 'pp08-b5', 1);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const before = JSON.stringify(saved.revision.snapshot);
    const hash = blockContentHash(saved.revision.snapshot.blocks[0]);
    await proposeAndConfirm(attemptId, 1, hash, {
      candidateId: 'c1', representationClass: 'EQUATION', normalizedValue: 'x = 4', confidence: 0.9,
    });
    await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp08-b5-check', workText: '', selectedStep: 'ink1',
    });
    const rev = await practicePadDocumentStore.getRevision({ schoolId: SCHOOL, studentId: LEARNER }, attemptId, 1);
    expect(JSON.stringify(rev?.snapshot)).toBe(before);
    expect(rev?.snapshot.blocks[0]?.kind).toBe('HANDWRITING');
  });

  it('6. unsupported diagram is not guessed correct/incorrect', async () => {
    const attemptId = await createAttempt();
    const saved = await saveInkRevision(attemptId, 'pp08-b6', 1);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const hash = blockContentHash(saved.revision.snapshot.blocks[0]);
    const confirmed = await proposeAndConfirm(attemptId, 1, hash, {
      candidateId: 'c1', representationClass: 'DIAGRAM', normalizedValue: 'triangle sketch', confidence: 0.7,
    });
    expect(confirmed.ok).toBe(true);
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp08-b6-check', workText: '', selectedStep: 'ink1',
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.status).toBe('NEEDS_SEMANTIC_ANALYSIS');
    expect(outcome.result.deterministicVerdict).toBe('unknown');
    expect(outcome.result.evidenceCandidate).toBeNull();
    expect(outcome.result.misconceptionCandidate).toBeNull();
  });

  it('7. mixed work can check an independent authoritative text/equation block', async () => {
    const attemptId = await createAttempt();
    const saved = await practicePadDocumentStore.savePracticeWork({
      identity: { schoolId: SCHOOL, studentId: LEARNER },
      attemptId,
      expectedCurrentVersion: 1,
      idempotencyKey: 'pp08-b7',
      snapshot: {
        blocks: [
          { blockId: 't1', kind: 'TEXT', content: 'x = 4', order: 0 },
          { ...inkBlock('ink2'), order: 1 },
        ],
      },
    });
    expect(saved.ok).toBe(true);
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp08-b7-check', workText: '', selectedStep: 't1',
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.status).toBe('CONFIRMED_CORRECT');
  });

  it('8. foreign/stale interpretation cannot be used', async () => {
    const attemptId = await createAttempt();
    const v1 = await saveInkRevision(attemptId, 'pp08-b8-v1', 1);
    expect(v1.ok).toBe(true);
    if (!v1.ok) return;
    const hashV1 = blockContentHash(v1.revision.snapshot.blocks[0]);
    const confirmed = await proposeAndConfirm(attemptId, 1, hashV1, {
      candidateId: 'c1', representationClass: 'EQUATION', normalizedValue: 'x = 4', confidence: 0.9,
    });
    expect(confirmed.ok).toBe(true);
    const v2 = await saveInkRevision(attemptId, 'pp08-b8-v2', 1, true);
    expect(v2.ok).toBe(true);
    if (!v2.ok) return;
    expect(v2.revision.version).toBe(2);
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 2, idempotencyKey: 'pp08-b8-check', workText: '', selectedStep: 'ink1',
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.status).toBe('NEEDS_CLARIFICATION');
    expect(outcome.result.interpretationRequired).toBe(true);
    expect(outcome.result.evidenceCandidate).toBeNull();
  });

  it('9. persistence failure cannot yield check/evidence success', async () => {
    const attemptId = await createAttempt();
    const saved = await saveInkRevision(attemptId, 'pp08-b9', 1);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const hash = blockContentHash(saved.revision.snapshot.blocks[0]);
    __setPracticePadInterpretationFailWritesForTest(true);
    const confirmed = await proposeAndConfirm(attemptId, 1, hash, {
      candidateId: 'c1', representationClass: 'EQUATION', normalizedValue: 'x = 4', confidence: 0.9,
    });
    expect(confirmed.ok).toBe(false);
    __setPracticePadInterpretationFailWritesForTest(false);
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp08-b9-check', workText: '', selectedStep: 'ink1',
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.status).toBe('NEEDS_CLARIFICATION');
    expect(outcome.result.interpretationRequired).toBe(true);
    expect(outcome.result.evidenceCandidate).toBeNull();
    expect(outcome.result.misconceptionCandidate).toBeNull();
  });

  it('10. interpretation port liveModelCalls = 0', async () => {
    const attemptId = await createAttempt();
    await saveInkRevision(attemptId, 'pp08-b10', 1);
    await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp08-b10-check', workText: '', selectedStep: 'ink1',
    });
    expect(practicePadInkInterpreterPort.liveCallCount()).toBe(0);
    expect(practicePadSemanticPort.liveCallCount()).toBe(0);
    const direct = await practicePadInkInterpreterPort.interpretPracticeWork({
      block: { blockId: 'ink1', kind: 'HANDWRITING', content: null, ref: null, ink: [], order: 0 },
    });
    expect(direct.liveModelCalls).toBe(0);
  });

  it('11. interpretation-required result is stored as ONE PracticeCheck; replay deduplicates', async () => {
    const attemptId = await createAttempt();
    await saveInkRevision(attemptId, 'pp08-d11', 1);
    const first = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp08-d11-check', workText: '', selectedStep: 'ink1',
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.result.status).toBe('NEEDS_CLARIFICATION');
    expect(first.result.interpretationRequired).toBe(true);
    expect(first.result.deduplicated).toBe(false);
    expect(first.result.intervention).toBeDefined();
    const history = await practicePadCheckStore.listByAttempt(attemptId);
    expect(history).toHaveLength(1);
    const second = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp08-d11-check', workText: '', selectedStep: 'ink1',
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.result.checkId).toBe(first.result.checkId);
    expect(second.result.deduplicated).toBe(true);
    const historyAfter = await practicePadCheckStore.listByAttempt(attemptId);
    expect(historyAfter).toHaveLength(1);
    const persisted = parseCheckResult(historyAfter[0]);
    expect(persisted.interpretationRequired).toBe(true);
    expect(persisted.intervention?.level).toBe(first.result.intervention?.level);
    expect(persisted.intervention?.feedbackText).toBe(first.result.intervention?.feedbackText);
  });

  it('12. unsupported-diagram result is stored and identical replay deduplicates', async () => {
    const attemptId = await createAttempt();
    const saved = await saveInkRevision(attemptId, 'pp08-d12', 1);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const hash = blockContentHash(saved.revision.snapshot.blocks[0]);
    const confirmed = await proposeAndConfirm(attemptId, 1, hash, {
      candidateId: 'c1', representationClass: 'DIAGRAM', normalizedValue: 'triangle sketch', confidence: 0.7,
    });
    expect(confirmed.ok).toBe(true);
    const first = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp08-d12-check', workText: '', selectedStep: 'ink1',
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.result.status).toBe('NEEDS_SEMANTIC_ANALYSIS');
    expect(first.result.deduplicated).toBe(false);
    expect(first.result.intervention).toBeDefined();
    const history = await practicePadCheckStore.listByAttempt(attemptId);
    expect(history).toHaveLength(1);
    const second = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp08-d12-check', workText: '', selectedStep: 'ink1',
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.result.checkId).toBe(first.result.checkId);
    expect(second.result.deduplicated).toBe(true);
    expect((await practicePadCheckStore.listByAttempt(attemptId))).toHaveLength(1);
    expect(parseCheckResult(history[0]).intervention?.level).toBe(first.result.intervention?.level);
  });

  it('13. same idempotency key + different authoritative scope conflicts', async () => {
    const attemptId = await createAttempt();
    const saved = await saveInkRevision(attemptId, 'pp08-d13', 1);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const first = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp08-d13-check', workText: '', selectedStep: 'ink1',
    });
    expect(first.ok).toBe(true);
    // Authoritative scope changes under the same key: a confirmed
    // interpretation now binds the source, so the fingerprint differs.
    const hash = blockContentHash(saved.revision.snapshot.blocks[0]);
    const confirmed = await proposeAndConfirm(attemptId, 1, hash, {
      candidateId: 'c1', representationClass: 'EQUATION', normalizedValue: 'x = 4', confidence: 0.9,
    });
    expect(confirmed.ok).toBe(true);
    const second = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp08-d13-check', workText: '', selectedStep: 'ink1',
    });
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.status).toBe('CONFLICT');
  });

  it('14. injected check-store failure fails closed, never a successful PP-08 result', async () => {
    const attemptId = await createAttempt();
    await saveInkRevision(attemptId, 'pp08-d14', 1);
    __setPracticePadCheckFailWritesForTest(true);
    try {
      const outcome = await checkPracticePadStepCanonical(identity, {
        attemptId, basedOnVersion: 1, idempotencyKey: 'pp08-d14-check', workText: '', selectedStep: 'ink1',
      });
      expect(outcome.ok).toBe(false);
      if (outcome.ok) return;
      expect(outcome.status).toBe('FAILED_CLOSED');
      expect(outcome.currentFeedbackEligible).toBe(false);
    } finally {
      __setPracticePadCheckFailWritesForTest(false);
    }
    expect(await practicePadCheckStore.listByAttempt(attemptId)).toHaveLength(0);
  });

  it('15. confirmed multi-step interpretation proves PP-05 firstDivergence; raw work untouched', async () => {
    const attemptId = await createAttempt();
    const saved = await saveInkRevision(attemptId, 'pp08-d15', 1);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const before = JSON.stringify(saved.revision.snapshot);
    const hash = blockContentHash(saved.revision.snapshot.blocks[0]);
    const confirmed = await proposeAndConfirm(attemptId, 1, hash, {
      candidateId: 'c1', representationClass: 'EQUATION',
      normalizedValue: '2x + 6 = 14\nx + 3 = 7\nx = 5', confidence: 0.9,
    });
    expect(confirmed.ok).toBe(true);
    const outcome = await checkPracticePadStepCanonical(identity, {
      attemptId, basedOnVersion: 1, idempotencyKey: 'pp08-d15-check', workText: '', selectedStep: 'ink1',
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    // The confirmed interpretation is the evaluation view: PP-05 consumes
    // the interpreted reasoning and localizes the causal break.
    expect(outcome.result.status).toBe('CONFIRMED_INCORRECT');
    expect(outcome.result.firstDivergence).toBeDefined();
    expect(outcome.result.firstDivergence?.stepIndex).toBe(2);
    expect(outcome.result.confirmedCorrectSteps).toHaveLength(2);
    const rev = await practicePadDocumentStore.getRevision({ schoolId: SCHOOL, studentId: LEARNER }, attemptId, 1);
    expect(JSON.stringify(rev?.snapshot)).toBe(before);
    expect(rev?.snapshot.blocks[0]?.kind).toBe('HANDWRITING');
  });
});
