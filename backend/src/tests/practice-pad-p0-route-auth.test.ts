// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad P0 (3/3):
// route authorization and integration.
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

import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import aiAssessmentRoutes from '../routes/ai/ai-assessment.routes';
import { _clearAttemptStoreForTest, __setPracticeAttemptDurableForTest } from '../services/practiceAttemptService';
import { _clearPracticePadCheckRecordsForTest } from '../services/practicePadRuntime/practicePadCheckRuntime';
import { practicePadWorkVersionStore, __enablePracticePadWorkVersionMemoryForTest } from '../services/practicePadRuntime/practicePadWorkVersionStore';
import { __enablePracticePadCheckMemoryForTest } from '../services/practicePadRuntime/practicePadCheckStore';
import { practicePadProblemAuthority } from '../services/practicePadRuntime/practicePadProblemAuthority';
import { commitPracticeLearningEvidence } from '../services/practiceCanonicalLearningService';
import { learningEventService } from '../services/learningEventService';
import { masteryService } from '../services/masteryService';

const JWT_SECRET = String(process.env.JWT_SECRET || 'test-secret');
const SCHOOL = 'school-p0-route';
const OTHER_SCHOOL = 'school-p0-route-other';
const LEARNER = 'learner-p0-route';

function signToken(claims: Record<string, unknown>): string {
  return jwt.sign(claims, JWT_SECRET);
}

function createApp(): express.Express {
  const app = express();
  app.use(express.json());
  // Route module already chains schoolAuthMiddleware +
  // requireVerifiedSchoolContext before the handler (AI-RUNTIME-01 precedent).
  app.use('/api/ai', aiAssessmentRoutes);
  return app;
}

const CHECK_STEP = '/api/ai/practice-pad/check-step';

describe('Practice Pad P0 — route authorization and integration', () => {
  beforeEach(async () => {
    // Explicit test doubles ONLY (production fails closed on DB failure;
    // Prisma is mocked unavailable in this file, so memory is installed
    // explicitly rather than inferred from the failure; the route's
    // create-through-owner durability gate is pinned durable here and
    // proven fail-closed by the real-DB persistence test).
    __enablePracticePadCheckMemoryForTest();
    __enablePracticePadWorkVersionMemoryForTest();
    __setPracticeAttemptDurableForTest(true);
    _clearAttemptStoreForTest();
    await _clearPracticePadCheckRecordsForTest();
    await practicePadWorkVersionStore.resetForTest();
    practicePadProblemAuthority.resetForTest();
    vi.clearAllMocks();
  });

  it('denies unauthenticated check-step requests', async () => {
    const res = await request(createApp()).post(CHECK_STEP).send({ workText: 'x = 4' });
    expect(res.status).toBe(401);
  });

  it('denies authenticated requests without verified school identity', async () => {
    const token = signToken({ userId: LEARNER, role: 'student' });
    const res = await request(createApp())
      .post(CHECK_STEP)
      .set('Authorization', `Bearer ${token}`)
      .send({ workText: 'x = 4' });
    expect([401, 403]).toContain(res.status);
  });

  it('verified same-school learner can create-through-owner and check', async () => {
    const token = signToken({ userId: LEARNER, role: 'student', schoolId: SCHOOL });
    const res = await request(createApp())
      .post(CHECK_STEP)
      .set('Authorization', `Bearer ${token}`)
      .send({
        prompt: 'Solve for x: 2x + 4 = 10',
        workText: 'subtract 4 then divide by 2',
        idempotencyKey: 'k-route-create',
      });
    expect(res.status).toBe(200);
    expect(typeof res.body.checkId).toBe('string');
    expect(res.body.currentFeedbackEligible).toBe(true);
    // Learner-safe projection: no protected answer material leaks.
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toMatch(/expectedAnswer|evaluationPlan|hiddenSolution/i);
  });

  it('cross-school attempt access fails closed at the route', async () => {
    const app = createApp();
    const tokenA = signToken({ userId: LEARNER, role: 'student', schoolId: SCHOOL });
    const created = await request(app)
      .post(CHECK_STEP)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ prompt: 'Solve for x: 2x + 4 = 10', workText: 'x = 3', idempotencyKey: 'k-route-a' });
    expect(created.status).toBe(200);
    const attemptId = created.body.attemptId as string;
    expect(typeof attemptId).toBe('string');

    const tokenB = signToken({ userId: LEARNER, role: 'student', schoolId: OTHER_SCHOOL });
    const cross = await request(app)
      .post(CHECK_STEP)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ attemptId, basedOnVersion: 1, workText: 'x = 3', idempotencyKey: 'k-route-b' });
    expect([403, 404]).toContain(cross.status);
    expect(cross.body.currentFeedbackEligible).toBe(false);
  });

  it('missing attempt binding without creatable prompt is rejected, not guessed', async () => {
    const token = signToken({ userId: LEARNER, role: 'student', schoolId: SCHOOL });
    const res = await request(createApp())
      .post(CHECK_STEP)
      .set('Authorization', `Bearer ${token}`)
      .send({ workText: 'x = 4', idempotencyKey: 'k-route-nobind' });
    // No attemptId and no prompt to create through the canonical owner.
    // workText alone is context, never authority → must not return feedback.
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('attempt_binding_required');
  });

  it('non-durable create-through-owner fails closed with zero downstream learning effects (PP-01 R2)', async () => {
    // FAILED ATTEMPT PERSISTENCE MUST NOT CREATE PROTECTED DOWNSTREAM STATE.
    __setPracticeAttemptDurableForTest(false);
    const commit = vi.mocked(commitPracticeLearningEvidence);
    const learningSpy = vi.spyOn(learningEventService, 'createLearningEvent').mockResolvedValue({} as never);
    const masterySpy = vi.spyOn(masteryService, 'updateMasteryFromAttempt').mockResolvedValue([]);
    try {
      const token = signToken({ userId: LEARNER, role: 'student', schoolId: SCHOOL });
      const res = await request(createApp())
        .post(CHECK_STEP)
        .set('Authorization', `Bearer ${token}`)
        .send({
          prompt: 'Solve for x: 2x + 4 = 10',
          workText: 'x = 3',
          idempotencyKey: 'k-route-nondurable',
        });
      expect(res.status).toBe(503);
      expect(res.body.code).toBe('PERSISTENCE_FAILED');
      expect(res.body.failureCategory).toBe('database_unavailable');
      expect(res.body.currentFeedbackEligible).toBe(false);
      expect(commit).not.toHaveBeenCalled();
      expect(learningSpy).not.toHaveBeenCalled();
      expect(masterySpy).not.toHaveBeenCalled();
    } finally {
      learningSpy.mockRestore();
      masterySpy.mockRestore();
      __setPracticeAttemptDurableForTest(true);
    }
  });
});
