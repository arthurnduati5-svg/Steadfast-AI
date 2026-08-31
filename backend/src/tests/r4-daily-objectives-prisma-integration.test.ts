/**
 * R4 Prisma Integration Test — Real async Prisma code-path proof.
 *
 * Uses vitest.r4-prisma.config.mts (setupFiles: []) so NO global mock runs.
 * Real PrismaClient connects to the actual database.
 *
 * Proofs: P1, P3, P6, P8, P9, F1, F2
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';

// ── ENVIRONMENT MUST BE SET BEFORE ANY MODULE IMPORT ───────────────────
process.env.NODE_ENV = 'test';
process.env.R4_USE_PRISMA = 'true';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { default: prisma } = await import('../lib/prisma');

// Dynamic imports AFTER environment is set
const { Phase3DailyObjectiveCheckSessionService } = await import('../services/phase3DailyObjectiveCheckSessionService');
const { Phase3DailyObjectiveCheckAttemptService } = await import('../services/phase3DailyObjectiveCheckAttemptService');
const { Phase3DailyObjectiveConfidenceService } = await import('../services/phase3DailyObjectiveConfidenceService');
const { Phase3DailyObjectiveCheckCompletionService } = await import('../services/phase3DailyObjectiveCheckCompletionService');
const { Phase3DailyObjectiveCheckRepository } = await import('../services/phase3DailyObjectiveCheckRepository');

function isTestMapsMode(): boolean {
  return process.env.NODE_ENV === 'test' && process.env.R4_USE_PRISMA !== 'true';
}

// ── Constants ──────────────────────────────────────────────────────────
const SCHOOL = 'unknown';
const STUDENT = 'r4-prisma-student';
const CLASS_ID = 'r4-prisma-class';
const CURR_VERSION_ID = 'r4-test-curriculum-version';
const TOPIC_ID = 'r4-test-topic';
const SKILL_ID = 'r4-test-skill';
const OBJECTIVE_ID = 'r4-test-objective';

async function seedKgRecords() {
  await prisma.curriculumVersionRecord.upsert({
    where: { id: CURR_VERSION_ID }, update: {},
    create: { id: CURR_VERSION_ID, curriculumFamily: 'r4-test-family', versionCode: 'v1', title: 'R4 Test Curriculum', status: 'active' },
  });
  await prisma.curriculumTopicRecord.upsert({
    where: { id: TOPIC_ID }, update: {},
    create: { id: TOPIC_ID, curriculumVersionId: CURR_VERSION_ID, subject: 'math', title: 'R4 Test Topic', status: 'active' },
  });
  await prisma.curriculumSkillRecord.upsert({
    where: { id: SKILL_ID }, update: {},
    create: { id: SKILL_ID, curriculumTopicId: TOPIC_ID, title: 'R4 Test Skill', status: 'active' },
  });
  await prisma.learningObjectiveRecord.upsert({
    where: { id: OBJECTIVE_ID }, update: {},
    create: { id: OBJECTIVE_ID, curriculumSkillId: SKILL_ID, title: 'R4 Test Objective', status: 'active' },
  });
}

async function cleanAllTestData() {
  try {
    await prisma.dailyObjectiveCheckCompletionIdempotencyRecord.deleteMany({ where: { schoolId: SCHOOL } });
    await prisma.committedLearningEvidenceProjection.deleteMany({ where: { schoolId: SCHOOL } });
    await prisma.learningEvidenceEvent.deleteMany({ where: { schoolId: SCHOOL } });
    await prisma.learningEvidenceStream.deleteMany({ where: { schoolId: SCHOOL } });
    await prisma.learningEvidenceCandidateProjection.deleteMany({ where: { schoolId: SCHOOL } });
    await prisma.dailyObjectiveCheckSessionRecord.deleteMany({ where: { schoolId: SCHOOL } });
    await prisma.dailyObjectiveCheckAttemptRecord.deleteMany({ where: { schoolId: SCHOOL } });
    await prisma.dailyObjectiveCheckConfidenceRecord.deleteMany({ where: { schoolId: SCHOOL } });
  } catch { /* ignore cleanup errors */ }
}

describe('R4 Daily Objectives Prisma Integration', () => {
  let sessionService: InstanceType<typeof Phase3DailyObjectiveCheckSessionService>;
  let attemptService: InstanceType<typeof Phase3DailyObjectiveCheckAttemptService>;
  let confidenceService: InstanceType<typeof Phase3DailyObjectiveConfidenceService>;
  let completionService: InstanceType<typeof Phase3DailyObjectiveCheckCompletionService>;
  let checkRepo: InstanceType<typeof Phase3DailyObjectiveCheckRepository>;

  beforeAll(async () => {
    expect(isTestMapsMode()).toBe(false);
    await seedKgRecords();
    await cleanAllTestData();
  });

  afterAll(async () => {
    await cleanAllTestData();
    delete process.env.R4_USE_PRISMA;
  });

  beforeEach(async () => {
    await cleanAllTestData();
    sessionService = new Phase3DailyObjectiveCheckSessionService();
    attemptService = new Phase3DailyObjectiveCheckAttemptService();
    confidenceService = new Phase3DailyObjectiveConfidenceService();
    completionService = new Phase3DailyObjectiveCheckCompletionService();
    checkRepo = new Phase3DailyObjectiveCheckRepository();
    await completionService.resetIdempotencyForTests();
  });

  async function startSession(objectiveId: string) {
    return sessionService.startDailyObjectiveCheckSessionAsync({
      schoolId: SCHOOL, studentId: STUDENT, classId: CLASS_ID, subjectId: 'math',
      objectiveId, sourceTruthStatus: 'approved',
    });
  }

  async function fillRequiredSteps(sessionId: string) {
    await confidenceService.recordConfidenceBeforeAsync({
      checkSessionId: sessionId, schoolId: SCHOOL, studentId: STUDENT,
      confidenceLevel: 'partly_know', checkpointType: 'before',
    });
    await attemptService.recordSafeAttemptSignalAsync({
      checkSessionId: sessionId, schoolId: SCHOOL, studentId: STUDENT,
      signalBucket: 'objective_check_passed', hintUsageBucket: 'low',
      explanationQualityBucket: 'strong',
    });
    const session: any = await checkRepo.getCheckSessionByIdAsync(sessionId);
    for (const step of ['teach_back', 'transfer_check', 'delayed_recall', 'confidence_after']) {
      if (session.requiredSteps?.includes(step)) {
        if (step === 'confidence_after') {
          await confidenceService.recordConfidenceAfterAsync({
            checkSessionId: sessionId, schoolId: SCHOOL, studentId: STUDENT,
            confidenceLevel: 'know_this', checkpointType: 'after',
          });
        } else {
          await checkRepo.markRequiredStepCompletedAsync(sessionId, step);
        }
      }
    }
  }

  // ── P1: Real Prisma restart / reconstruction durability ──────────────
  it('P1: restart durability — state survives full service reconstruction', async () => {
    const start = await startSession(OBJECTIVE_ID);
    expect(start.error).toBeUndefined();
    const sessionId = start.session!.checkSessionId;

    await confidenceService.recordConfidenceBeforeAsync({
      checkSessionId: sessionId, schoolId: SCHOOL, studentId: STUDENT,
      confidenceLevel: 'know_this', checkpointType: 'before',
    });

    const prismaSession = await prisma.dailyObjectiveCheckSessionRecord.findUnique({
      where: { checkSessionId: sessionId },
    });
    expect(prismaSession).not.toBeNull();
    expect(prismaSession!.schoolId).toBe(SCHOOL);
    expect(prismaSession!.studentId).toBe(STUDENT);
    expect(prismaSession!.confidenceBefore).toBe('know_this');

    const freshCheckRepo = new Phase3DailyObjectiveCheckRepository();
    const reloaded = await freshCheckRepo.getCheckSessionByIdAsync(sessionId);
    expect(reloaded).not.toBeNull();
    expect(reloaded!.checkSessionId).toBe(sessionId);
    expect(reloaded!.schoolId).toBe(SCHOOL);
    expect(reloaded!.studentId).toBe(STUDENT);
    expect(reloaded!.confidenceBefore).toBe('know_this');
  });

  // ── P3: Exactly one canonical committed Learning Evidence ────────────
  it('P3: exactly one canonical evidence per check session', async () => {
    const start = await startSession(OBJECTIVE_ID);
    const sessionId = start.session!.checkSessionId;
    await fillRequiredSteps(sessionId);

    const comp = await completionService.completeDailyObjectiveCheckSessionAsync({
      checkSessionId: sessionId, schoolId: SCHOOL, studentId: STUDENT,
    });
    expect(comp.error).toBeUndefined();
    expect(comp.result).toBeDefined();

    const evidenceRecords = await prisma.committedLearningEvidenceProjection.findMany({
      where: { schoolId: SCHOOL, learnerId: STUDENT, objectiveId: OBJECTIVE_ID },
    });
    expect(evidenceRecords.length).toBe(1);
    expect(evidenceRecords[0].active).toBe(true);

    const committedEvidenceId = evidenceRecords[0].committedEvidenceId;

    const retry = await completionService.completeDailyObjectiveCheckSessionAsync({
      checkSessionId: sessionId, schoolId: SCHOOL, studentId: STUDENT,
    });
    expect(retry.error).toBeUndefined();

    const retryEvidence = await prisma.committedLearningEvidenceProjection.findMany({
      where: { schoolId: SCHOOL, learnerId: STUDENT, objectiveId: OBJECTIVE_ID },
    });
    expect(retryEvidence.length).toBe(1);
    expect(retryEvidence[0].committedEvidenceId).toBe(committedEvidenceId);

    const idemRecord = await prisma.dailyObjectiveCheckCompletionIdempotencyRecord.findFirst({
      where: { checkSessionId: sessionId },
    });
    expect(idemRecord).not.toBeNull();
    expect(idemRecord!.evidenceId).toBe(committedEvidenceId);
  });

  // ── P6: Evidence success → mastery failure → durable retry ───────────
  it('P6: evidence succeeds, mastery fails, retry reuses same evidence', async () => {
    const { phase3ObjectiveMasteryService } = await import('../services/phase3ObjectiveMasteryService');

    const start = await startSession(OBJECTIVE_ID);
    const sessionId = start.session!.checkSessionId;
    await fillRequiredSteps(sessionId);

    const original = (phase3ObjectiveMasteryService as any).updateObjectiveMasteryFromEvidence;
    let callCount = 0;
    (phase3ObjectiveMasteryService as any).updateObjectiveMasteryFromEvidence = (input: any) => {
      callCount++;
      if (callCount === 1) throw new Error('Simulated mastery failure');
      return original.call(phase3ObjectiveMasteryService, input);
    };

    const first = await completionService.completeDailyObjectiveCheckSessionAsync({
      checkSessionId: sessionId, schoolId: SCHOOL, studentId: STUDENT,
    });
    expect(first.error).toBeDefined();
    expect(first.error).toMatch(/Mastery processing failed/i);

    const checkpoint = await prisma.dailyObjectiveCheckCompletionIdempotencyRecord.findFirst({
      where: { checkSessionId: sessionId },
    });
    expect(checkpoint).not.toBeNull();
    expect(checkpoint!.evidenceId).toBeTruthy();
    expect(checkpoint!.masteryApplied).toBe(false);

    const evidenceCount = await prisma.committedLearningEvidenceProjection.count({
      where: { schoolId: SCHOOL, learnerId: STUDENT, objectiveId: OBJECTIVE_ID },
    });
    expect(evidenceCount).toBe(1);

    const evidenceIdBeforeRetry = checkpoint!.evidenceId;
    (phase3ObjectiveMasteryService as any).updateObjectiveMasteryFromEvidence = original;

    const freshCompletion = new Phase3DailyObjectiveCheckCompletionService();
    const retry = await freshCompletion.completeDailyObjectiveCheckSessionAsync({
      checkSessionId: sessionId, schoolId: SCHOOL, studentId: STUDENT,
    });
    expect(retry.error).toBeUndefined();
    expect(retry.result).toBeDefined();

    const retryCheckpoint = await prisma.dailyObjectiveCheckCompletionIdempotencyRecord.findFirst({
      where: { checkSessionId: sessionId },
    });
    expect(retryCheckpoint!.evidenceId).toBe(evidenceIdBeforeRetry);
    expect(retryCheckpoint!.masteryApplied).toBe(true);

    const finalEvidenceCount = await prisma.committedLearningEvidenceProjection.count({
      where: { schoolId: SCHOOL, learnerId: STUDENT, objectiveId: OBJECTIVE_ID },
    });
    expect(finalEvidenceCount).toBe(1);
  });

  // ── P8: Real database concurrency / CAS ─────────────────────────────
  it('P8: concurrent completion — CAS prevents duplication', async () => {
    const start = await startSession(OBJECTIVE_ID);
    const sessionId = start.session!.checkSessionId;
    await fillRequiredSteps(sessionId);

    const input = { checkSessionId: sessionId, schoolId: SCHOOL, studentId: STUDENT };
    const results = await Promise.allSettled([
      completionService.completeDailyObjectiveCheckSessionAsync(input),
      completionService.completeDailyObjectiveCheckSessionAsync(input),
    ]);

    const fulfilled = results.filter(r => r.status === 'fulfilled' && !(r as any).value.error);
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);

    const evidenceCount = await prisma.committedLearningEvidenceProjection.count({
      where: { schoolId: SCHOOL, learnerId: STUDENT, objectiveId: OBJECTIVE_ID },
    });
    expect(evidenceCount).toBe(1);

    const session = await prisma.dailyObjectiveCheckSessionRecord.findUnique({
      where: { checkSessionId: sessionId },
    });
    expect(session!.status).toMatch(/completed|needs_recheck|needs_rescue|needs_teacher_support/);
  });

  // ── P9: Completed retry / idempotency after reconstruction ───────────
  it('P9: completed retry returns same result after reconstruction', async () => {
    const start = await startSession(OBJECTIVE_ID);
    const sessionId = start.session!.checkSessionId;
    await fillRequiredSteps(sessionId);

    const first = await completionService.completeDailyObjectiveCheckSessionAsync({
      checkSessionId: sessionId, schoolId: SCHOOL, studentId: STUDENT,
    });
    expect(first.error).toBeUndefined();
    const firstEvidenceId = first.result!.evidenceBridgeResultId;

    const freshCompletion = new Phase3DailyObjectiveCheckCompletionService();
    const retry = await freshCompletion.completeDailyObjectiveCheckSessionAsync({
      checkSessionId: sessionId, schoolId: SCHOOL, studentId: STUDENT,
    });
    expect(retry.error).toBeUndefined();
    expect(retry.result!.evidenceBridgeResultId).toBe(firstEvidenceId);
    expect(retry.result!.newMasteryStatus).toBe(first.result!.newMasteryStatus);

    const evidenceCount = await prisma.committedLearningEvidenceProjection.count({
      where: { schoolId: SCHOOL, learnerId: STUDENT, objectiveId: OBJECTIVE_ID },
    });
    expect(evidenceCount).toBe(1);
  });

  // ── F1: Idempotency read failure — persistence error propagates ──────
  it('F1: idempotency read failure — persistence error propagates', async () => {
    const start = await startSession(OBJECTIVE_ID);
    const sessionId = start.session!.checkSessionId;
    await fillRequiredSteps(sessionId);

    // Prisma 6: spy directly on the delegate's findUnique method
    const delegate = (prisma as any).dailyObjectiveCheckCompletionIdempotencyRecord;
    const origFindUnique = delegate.findUnique;
    delegate.findUnique = vi.fn().mockRejectedValue(new Error('Database unavailable'));

    try {
      const result = await completionService.completeDailyObjectiveCheckSessionAsync({
        checkSessionId: sessionId, schoolId: SCHOOL, studentId: STUDENT,
      });
      expect(result.error).toBeDefined();
      expect(result.error).toMatch(/Persistence failure/i);
    } finally {
      delegate.findUnique = origFindUnique;
    }
  });

  // ── F2: Idempotency write failure — no false success ────────────────
  it('F2: idempotency write failure — completion fails, no false success', async () => {
    const start = await startSession(OBJECTIVE_ID);
    const sessionId = start.session!.checkSessionId;
    await fillRequiredSteps(sessionId);

    const delegate = (prisma as any).dailyObjectiveCheckCompletionIdempotencyRecord;
    const origUpsert = delegate.upsert;
    const origUpdate = delegate.update;
    delegate.upsert = vi.fn().mockRejectedValue(new Error('Write failure'));
    delegate.update = vi.fn().mockRejectedValue(new Error('Write failure'));

    try {
      const result = await completionService.completeDailyObjectiveCheckSessionAsync({
        checkSessionId: sessionId, schoolId: SCHOOL, studentId: STUDENT,
      });
      expect(result.error).toBeDefined();
    } finally {
      delegate.upsert = origUpsert;
      delegate.update = origUpdate;
    }
  });
});
