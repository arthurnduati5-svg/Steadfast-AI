// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-02 (2/3):
// version law, learner-safe projection, attempt binding.
// Zero model calls. Prisma mocked unavailable; explicit doubles only.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/prisma', () => {
  const mockQueryRaw = vi.fn().mockRejectedValue(new Error('Prisma mocked unavailable'));
  return {
    default: {
      $queryRaw: mockQueryRaw,
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

vi.mock('../services/practiceCanonicalLearningService', () => ({
  commitPracticeLearningEvidence: vi.fn().mockResolvedValue({
    attemptId: 'att_mocked',
    committedEvidenceId: null,
    evidenceCandidateId: null,
    masteryApplied: false,
    deduplicated: false,
  }),
}));

import {
  practiceProblemStore,
  __enablePracticeProblemMemoryForTest,
} from '../services/practicePadRuntime/practiceProblemStore';
import {
  toPracticeProblemLearnerProjection,
  PRACTICE_PROBLEM_PROTECTED_FIELDS,
} from '../services/practicePadRuntime/practiceProblemContracts';
import { practiceAttemptService, _clearAttemptStoreForTest, __setPracticeAttemptDurableForTest } from '../services/practiceAttemptService';

const SCHOOL = 'school-pp02-version';

function validInput(problemId: string, overrides: Record<string, unknown> = {}) {
  return {
    problemId,
    schoolId: SCHOOL,
    sourceType: 'QUESTION_BANK' as const,
    sourceRef: 'qb-question-9:qb-version-3',
    subject: 'maths',
    topic: 'arithmetic',
    prompt: 'What is six times seven? Answer in digits.',
    allowedResources: [] as string[],
    evaluationType: 'deterministic_numeric' as const,
    evaluationPlan: 'numeric-equality-tolerance-1e-9',
    expectedAnswer: '42',
    ...overrides,
  };
}

describe('Practice Pad PP-02 — version law, projection, attempt binding', () => {
  beforeEach(async () => {
    __enablePracticeProblemMemoryForTest();
    __setPracticeAttemptDurableForTest(true);
    _clearAttemptStoreForTest();
    await practiceProblemStore.resetForTest();
    vi.clearAllMocks();
  });

  it('learner projection cannot leak protected answer data (proof 5)', async () => {
    await practiceProblemStore.proposeProblem(
      validInput('prob-proj-1', {
        acceptableAnswerForms: ['42', 'forty-two'],
      }),
    );
    const { record } = await practiceProblemStore.validateProblem('prob-proj-1', 1);
    const projection = toPracticeProblemLearnerProjection(record);
    expect(projection).toEqual({
      problemId: 'prob-proj-1',
      problemVersion: 1,
      prompt: 'What is six times seven? Answer in digits.',
      subject: 'maths',
      topic: 'arithmetic',
      allowedResources: [],
    });
    const serialized = JSON.stringify(projection);
    for (const field of PRACTICE_PROBLEM_PROTECTED_FIELDS) {
      expect(projection).not.toHaveProperty(field);
      expect(serialized).not.toContain(`"${field}"`);
    }
    // Protected VALUES never appear either.
    expect(serialized).not.toContain('forty-two');
    expect(serialized).not.toContain('numeric-equality');
    expect(serialized).not.toContain('qb-question-9');
    expect(Object.keys(projection).sort()).toEqual(
      ['allowedResources', 'problemId', 'problemVersion', 'prompt', 'subject', 'topic'].sort(),
    );
  });

  it('issued versions are immutable; material change requires a new version (proof 6)', async () => {
    await practiceProblemStore.proposeProblem(validInput('prob-imm-1'));
    await practiceProblemStore.validateProblem('prob-imm-1', 1);
    const before = await practiceProblemStore.loadVersion('prob-imm-1', 1);
    // Mutating a loaded copy must not affect the authority.
    (before as { prompt: string }).prompt = 'HACKED PROMPT';
    (before.allowedResources as string[]).push('answer-key');
    const after = await practiceProblemStore.loadVersion('prob-imm-1', 1);
    expect(after.prompt).toBe('What is six times seven? Answer in digits.');
    expect(after.allowedResources).toEqual([]);

    const v2 = await practiceProblemStore.createNextVersion('prob-imm-1', {
      prompt: 'What is six times seven? Answer in digits. Show no working.',
      curriculumSkillId: 'arithmetic-mult',
    });
    expect(v2.problemVersion).toBe(2);
    expect(v2.validationStatus).toBe('PROPOSED');
    const v1 = await practiceProblemStore.loadVersion('prob-imm-1', 1);
    expect(v1.prompt).toBe('What is six times seven? Answer in digits.');
    expect(v1.validationStatus).toBe('READY');
    expect(v1.curriculumSkillId).toBeNull();
  });

  it('old PracticeAttempt remains on its original version (proof 7)', async () => {
    await practiceProblemStore.proposeProblem(validInput('prob-bind-1'));
    await practiceProblemStore.validateProblem('prob-bind-1', 1);
    const created = await practiceAttemptService.createPracticeAttempt(
      { schoolId: SCHOOL, studentId: 'learner-pp02-bind' },
      {
        kind: 'open_response',
        promptSummary: 'What is six times seven? Answer in digits.',
        subject: 'maths',
        topic: 'arithmetic',
        sourceQuestionId: 'prob-bind-1',
        problemId: 'prob-bind-1',
        problemVersion: 1,
        outcome: 'not_evaluated',
      },
    );
    expect(created.attempt.problemId).toBe('prob-bind-1');
    expect(created.attempt.problemVersion).toBe(1);

    // Material change issues v2 and v2 becomes READY.
    await practiceProblemStore.createNextVersion('prob-bind-1', { expectedAnswer: '43' });
    await practiceProblemStore.validateProblem('prob-bind-1', 2);

    // The old attempt still binds v1 exactly — no silent migration.
    const reread = await practiceAttemptService.getPracticeAttempt(
      { schoolId: SCHOOL, studentId: 'learner-pp02-bind' },
      created.attempt.attemptId,
    );
    expect(reread?.problemId).toBe('prob-bind-1');
    expect(reread?.problemVersion).toBe(1);
    const v1 = await practiceProblemStore.loadVersion('prob-bind-1', 1);
    expect(v1.expectedAnswer).toBe('42');
  });

  it('invalid problem is held/rejected and never issuable: zero learner-negative evidence by construction (proof 9)', async () => {
    await practiceProblemStore.proposeProblem(
      validInput('prob-invalid-1', { prompt: 'What is six times seven? The answer 42 is shown here.' }),
    );
    const { record, verdict } = await practiceProblemStore.validateProblem('prob-invalid-1', 1);
    expect(verdict).toBe('invalid');
    expect(record.validationStatus).toBe('REJECTED');
    // No issuance path exists for rejected problems: the checker can never
    // receive one, so no misconception evidence, mastery decrement, mistake
    // record, or remediation can be derived from it.
    await expect(
      practiceProblemStore.resolveReadyProblem({ problemId: 'prob-invalid-1', problemVersion: 1, schoolId: SCHOOL }),
    ).rejects.toMatchObject({ code: 'PROBLEM_REJECTED' });
    // Even its projection exposes only the safe shape (the broken prompt is
    // never issued, and no protected evaluation material leaves the backend).
    const projection = toPracticeProblemLearnerProjection(record);
    expect(projection).not.toHaveProperty('expectedAnswer');
    expect(projection).not.toHaveProperty('evaluationPlan');
    expect(JSON.stringify(projection)).not.toContain('evaluationPlan');
  });
});
