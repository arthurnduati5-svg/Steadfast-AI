// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-02 (1/3):
// durable problem authority + deterministic validation.
// Zero model calls. Prisma mocked unavailable; the explicit
// __enablePracticeProblemMemoryForTest double stands in for the
// provisioned PostgreSQL table (real-DB roundtrip UNVERIFIED).
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/prisma', () => {
  const mockQueryRaw = vi.fn().mockRejectedValue(new Error('Prisma mocked unavailable'));
  return {
    default: {
      $queryRaw: mockQueryRaw,
      $executeRawUnsafe: vi.fn().mockRejectedValue(new Error('Prisma mocked unavailable')),
      $queryRawUnsafe: vi.fn().mockRejectedValue(new Error('Prisma mocked unavailable')),
    },
  };
});

import {
  practiceProblemStore,
  validateProblemDeterministically,
  __enablePracticeProblemMemoryForTest,
  __disablePracticeProblemMemoryForTest,
} from '../services/practicePadRuntime/practiceProblemStore';
import { PracticeProblemError } from '../services/practicePadRuntime/practiceProblemContracts';
import { practicePadProblemAuthority } from '../services/practicePadRuntime/practicePadProblemAuthority';

const SCHOOL = 'school-pp02-authority';
const OTHER_SCHOOL = 'school-pp02-other';

function validInput(problemId: string, overrides: Record<string, unknown> = {}) {
  return {
    problemId,
    schoolId: SCHOOL,
    sourceType: 'QUESTION_BANK' as const,
    sourceRef: 'qb-question-1:qb-version-7',
    subject: 'maths',
    topic: 'arithmetic',
    prompt: 'What is six times seven? Answer in digits.',
    allowedResources: ['calculator'],
    evaluationType: 'deterministic_numeric' as const,
    evaluationPlan: 'numeric-equality-tolerance-1e-9',
    expectedAnswer: '42',
    ...overrides,
  };
}

describe('Practice Pad PP-02 — durable problem authority and validation', () => {
  beforeEach(async () => {
    __enablePracticeProblemMemoryForTest();
    await practiceProblemStore.resetForTest();
    practicePadProblemAuthority.resetForTest();
    vi.clearAllMocks();
  });

  it('valid problem becomes READY (proof 1)', async () => {
    const proposed = await practiceProblemStore.proposeProblem(validInput('prob-ready-1'));
    expect(proposed.validationStatus).toBe('PROPOSED');
    expect(proposed.problemVersion).toBe(1);
    const { record, verdict } = await practiceProblemStore.validateProblem('prob-ready-1', 1);
    expect(verdict).toBe('valid');
    expect(record.validationStatus).toBe('READY');
    expect(record.validatedAt).toBeTruthy();
    const issued = await practiceProblemStore.resolveReadyProblem({
      problemId: 'prob-ready-1',
      problemVersion: 1,
      schoolId: SCHOOL,
    });
    expect(issued.validationStatus).toBe('READY');
  });

  it('invalid problem cannot become READY (proof 2)', async () => {
    // Leaked answer: prompt exposes the expected answer.
    await practiceProblemStore.proposeProblem(
      validInput('prob-leak-1', { prompt: 'What is six times seven? The answer 42 is shown here.' }),
    );
    const leaked = await practiceProblemStore.validateProblem('prob-leak-1', 1);
    expect(leaked.verdict).toBe('invalid');
    expect(leaked.record.validationStatus).toBe('REJECTED');

    // Broken evaluation contract: numeric type with non-numeric answer.
    await practiceProblemStore.proposeProblem(validInput('prob-broken-1', { expectedAnswer: 'forty-two' }));
    const broken = await practiceProblemStore.validateProblem('prob-broken-1', 1);
    expect(broken.verdict).toBe('invalid');
    expect(broken.record.validationStatus).toBe('REJECTED');

    // Invalid source reference for QUESTION_BANK.
    await practiceProblemStore.proposeProblem(validInput('prob-src-1', { sourceRef: 'qb-question-1' }));
    const badSource = await practiceProblemStore.validateProblem('prob-src-1', 1);
    expect(badSource.verdict).toBe('invalid');

    // Rejected versions are never issuable and never revalidated in place.
    await expect(
      practiceProblemStore.resolveReadyProblem({ problemId: 'prob-leak-1', problemVersion: 1, schoolId: SCHOOL }),
    ).rejects.toMatchObject({ code: 'PROBLEM_REJECTED' });
    await expect(practiceProblemStore.validateProblem('prob-leak-1', 1)).rejects.toMatchObject({
      code: 'PROBLEM_REJECTED',
    });
  });

  it('only READY problems may be issued (proof 3)', async () => {
    await practiceProblemStore.proposeProblem(validInput('prob-gate-1'));
    await expect(
      practiceProblemStore.resolveReadyProblem({ problemId: 'prob-gate-1', problemVersion: 1, schoolId: SCHOOL }),
    ).rejects.toMatchObject({ code: 'PROBLEM_NOT_READY' });

    // Undeterminable validity is held, never fabricated READY.
    await practiceProblemStore.proposeProblem(
      validInput('prob-held-1', {
        evaluationType: 'semantic_deferred',
        evaluationPlan: 'deferred-to-pp03',
        expectedAnswer: null,
      }),
    );
    const held = await practiceProblemStore.validateProblem('prob-held-1', 1);
    expect(held.verdict).toBe('needs_semantic_review');
    expect(held.record.validationStatus).toBe('REQUIRES_SEMANTIC_VALIDATION');
    await expect(
      practiceProblemStore.resolveReadyProblem({ problemId: 'prob-held-1', problemVersion: 1, schoolId: SCHOOL }),
    ).rejects.toMatchObject({ code: 'PROBLEM_NOT_READY' });

    // Unsupported source families are rejected at the gate.
    await expect(
      practiceProblemStore.proposeProblem(validInput('prob-fam-1', { sourceType: 'MODEL_DREAMED' })),
    ).rejects.toMatchObject({ code: 'PROBLEM_SOURCE_INVALID' });
  });

  it('cross-school resolution is denied (proof 4)', async () => {
    await practiceProblemStore.proposeProblem(validInput('prob-scope-1'));
    await practiceProblemStore.validateProblem('prob-scope-1', 1);
    await expect(
      practiceProblemStore.resolveReadyProblem({ problemId: 'prob-scope-1', problemVersion: 1, schoolId: OTHER_SCHOOL }),
    ).rejects.toMatchObject({ code: 'PROBLEM_SCOPE_MISMATCH' });
  });

  it('material change creates a new version; history is immutable (proof 6)', async () => {
    await practiceProblemStore.proposeProblem(validInput('prob-ver-1'));
    await practiceProblemStore.validateProblem('prob-ver-1', 1);
    const v2 = await practiceProblemStore.createNextVersion('prob-ver-1', { expectedAnswer: '43' });
    expect(v2.problemVersion).toBe(2);
    expect(v2.validationStatus).toBe('PROPOSED');
    expect(v2.expectedAnswer).toBe('43');
    // Old version untouched: still READY with the original answer.
    const v1 = await practiceProblemStore.loadVersion('prob-ver-1', 1);
    expect(v1.validationStatus).toBe('READY');
    expect(v1.expectedAnswer).toBe('42');
    // New version must revalidate before issuance.
    await expect(
      practiceProblemStore.resolveReadyProblem({ problemId: 'prob-ver-1', problemVersion: 2, schoolId: SCHOOL }),
    ).rejects.toMatchObject({ code: 'PROBLEM_NOT_READY' });
  });

  it('unknown problem vs unknown version are distinguished explicitly', async () => {
    await practiceProblemStore.proposeProblem(validInput('prob-dist-1'));
    await expect(practiceProblemStore.loadVersion('prob-dist-1', 9)).rejects.toMatchObject({
      code: 'PROBLEM_VERSION_NOT_FOUND',
    });
    await expect(practiceProblemStore.loadVersion('prob-no-such', 1)).rejects.toMatchObject({
      code: 'PROBLEM_NOT_FOUND',
    });
  });

  it('pure deterministic validation reports reasons without I/O', () => {
    const report = validateProblemDeterministically({
      schoolId: '',
      sourceType: 'QUESTION_BANK',
      sourceRef: 'qb-q1:qb-v1',
      prompt: 'What is six times seven? Answer in digits.',
      evaluationType: 'deterministic_numeric',
      evaluationPlan: 'numeric-equality',
      expectedAnswer: '42',
      acceptableAnswerForms: [],
      curriculumVersionId: null,
      curriculumObjectiveId: null,
      curriculumSkillId: null,
      allowedResources: [],
    });
    expect(report.verdict).toBe('invalid');
    expect(report.reasons.join(';')).toMatch(/school/i);
  });

  it('production authority is not the process-local Map (proof 11)', async () => {
    // No test double, no database: the exact durable path must fail closed
    // with an explicit persistence code — never a silent memory success.
    __disablePracticeProblemMemoryForTest();
    await expect(
      practiceProblemStore.resolveReadyProblem({ problemId: 'prob-absent', problemVersion: 1, schoolId: SCHOOL }),
    ).rejects.toMatchObject({ code: 'PROBLEM_PERSISTENCE_FAILED' });

    // The legacy Map is not consulted by the durable path even when it
    // holds an entry: production resolution is durable-only.
    practicePadProblemAuthority.registerProblem({
      problemId: 'prob-map-only',
      prompt: 'What is six times seven? Answer in digits.',
      subject: 'maths',
      topic: 'arithmetic',
      allowedResources: [],
      expectedAnswer: '42',
      evaluationPlan: 'numeric-equality',
      schoolId: SCHOOL,
    });
    await expect(
      practiceProblemStore.resolveReadyProblem({ problemId: 'prob-map-only', problemVersion: 1, schoolId: SCHOOL }),
    ).rejects.toSatisfy((err: unknown) => err instanceof PracticeProblemError);
  });
});
