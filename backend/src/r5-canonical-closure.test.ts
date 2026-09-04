import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { createHash } from 'crypto';

vi.mock('./lib/prisma', () => {
  const { PrismaClient } = require('@prisma/client');
  const testUrl = process.env.R5_TEST_DATABASE_URL || 'postgresql://postgres:testpass@localhost:5433/steadfast_r5_test?schema=public';
  const client = new PrismaClient({ datasources: { db: { url: testUrl } } });
  return { default: client };
});

const TEST_DB_URL = process.env.R5_TEST_DATABASE_URL || 'postgresql://postgres:testpass@localhost:5433/steadfast_r5_test?schema=public';

let prismaClient: any;
async function getPrisma() {
  if (!prismaClient) {
    const { PrismaClient } = await import('@prisma/client');
    prismaClient = new PrismaClient({ datasources: { db: { url: TEST_DB_URL } } });
    await prismaClient.$connect();
  }
  return prismaClient;
}

async function ensureStudentProfile(prisma: any, userId: string): Promise<void> {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "StudentProfile" ("userId","createdAt","updatedAt") VALUES ($1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT ("userId") DO NOTHING`,
    userId
  );
}

function uid(): string {
  return `r5c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

async function createCurriculumHierarchy(prisma: any, schoolId: string) {
  const versionId = `ver_${uid()}`;
  const topicId = `topic_${uid()}`;
  const skillId = `skill_${uid()}`;
  const objectiveId = `obj_${uid()}`;
  await prisma.$executeRawUnsafe(
    `INSERT INTO "CurriculumVersionRecord" ("id","schoolId","curriculumFamily","versionCode","title","status","createdAt","updatedAt") VALUES ($1,$2,'family','v1','Test Version','active',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
    versionId, schoolId
  );
  await prisma.$executeRawUnsafe(
    `INSERT INTO "CurriculumTopicRecord" ("id","curriculumVersionId","subject","topicCode","title","status","createdAt","updatedAt") VALUES ($1,$2,'math','t1','Algebra','active',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
    topicId, versionId
  );
  await prisma.$executeRawUnsafe(
    `INSERT INTO "CurriculumSkillRecord" ("id","curriculumTopicId","skillCode","title","status","createdAt","updatedAt") VALUES ($1,$2,'s1','Linear equations','active',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
    skillId, topicId
  );
  await prisma.$executeRawUnsafe(
    `INSERT INTO "LearningObjectiveRecord" ("id","curriculumSkillId","objectiveCode","title","status","createdAt","updatedAt") VALUES ($1,$2,'o1','Solve linear equation','active',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
    objectiveId, skillId
  );
  return { versionId, topicId, skillId, objectiveId };
}

async function createTestItemWithCurriculum(prisma: any, userId: string, itemId: string, title: string, refs: { objectiveId: string | null; skillId: string | null; topicId: string | null }) {
  await ensureStudentProfile(prisma, userId);
  await prisma.$executeRawUnsafe(
    `INSERT INTO "RevisionItem" ("id","userId","title","summary","content","contentType","curriculumObjectiveId","curriculumSkillId","curriculumTopicId","createdAt","updatedAt") VALUES ($1,$2,$3,$3,$3,'note',$4,$5,$6,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
    itemId, userId, title, refs.objectiveId, refs.skillId, refs.topicId
  );
}

async function cleanupTestData() {
  const prisma = await getPrisma();
  await prisma.$executeRawUnsafe(`DELETE FROM "RevisionGuidedStepRecord" WHERE "sessionId" IN (SELECT "id" FROM "RevisionGuidedSessionRecord" WHERE "userId" LIKE 'r5c_%')`);
  await prisma.$executeRawUnsafe(`DELETE FROM "RevisionGuidedSessionRecord" WHERE "userId" LIKE 'r5c_%'`);
  await prisma.$executeRawUnsafe(`DELETE FROM "RevisionSourceSignalReceipt" WHERE "userId" LIKE 'r5c_%'`);
  await prisma.$executeRawUnsafe(`DELETE FROM "RevisionItem" WHERE "userId" LIKE 'r5c_%'`);
  await prisma.$executeRawUnsafe(`DELETE FROM "RevisionCollection" WHERE "userId" LIKE 'r5c_%'`);
  // Clean curriculum test data (version/topic/skill/objective with test prefix)
  await prisma.$executeRawUnsafe(`DELETE FROM "LearningObjectiveRecord" WHERE "id" LIKE 'obj_r5c_%'`);
  await prisma.$executeRawUnsafe(`DELETE FROM "CurriculumSkillRecord" WHERE "id" LIKE 'skill_r5c_%'`);
  await prisma.$executeRawUnsafe(`DELETE FROM "CurriculumTopicRecord" WHERE "id" LIKE 'topic_r5c_%'`);
  await prisma.$executeRawUnsafe(`DELETE FROM "CurriculumVersionRecord" WHERE "id" LIKE 'ver_r5c_%'`);
  // Clean learning evidence for test school
  await prisma.$executeRawUnsafe(`DELETE FROM "LearningEvidenceEvent" WHERE "schoolId" LIKE 'r5c_%'`);
  await prisma.$executeRawUnsafe(`DELETE FROM "LearningEvidenceIdempotency" WHERE "schoolId" LIKE 'r5c_%'`);
  await prisma.$executeRawUnsafe(`DELETE FROM "CommittedLearningEvidenceProjection" WHERE "schoolId" LIKE 'r5c_%'`);
  await prisma.$executeRawUnsafe(`DELETE FROM "LearningEvidenceCandidateProjection" WHERE "schoolId" LIKE 'r5c_%'`);
  await prisma.$executeRawUnsafe(`DELETE FROM "LearningEvidenceStream" WHERE "schoolId" LIKE 'r5c_%'`);
  await prisma.$executeRawUnsafe(`DELETE FROM "RevisionReviewEvent" WHERE "userId" LIKE 'r5c_%'`);
}

describe('R5 Canonical Closure — Real PostgreSQL', () => {
  beforeAll(async () => {
    await getPrisma();
    await cleanupTestData();
  });
  afterAll(async () => {
    await cleanupTestData();
    if (prismaClient) await prismaClient.$disconnect();
  });
  beforeEach(async () => {
    // reset mastery repo
    const { __resetMasteryForTests } = await import('./services/revisionCanonicalLearningService');
    __resetMasteryForTests();
  });

  // C1 — REAL CANONICAL LEARNING EVIDENCE
  it('C1: revision attempt creates REAL canonical Learning Evidence with same ID in step', async () => {
    const prisma = await getPrisma();
    const userId = uid();
    const schoolId = `r5c_school_${uid()}`;
    const itemId = uid();
    const refs = await createCurriculumHierarchy(prisma, schoolId);
    await createTestItemWithCurriculum(prisma, userId, itemId, 'Linear equations revision', refs);

    const { startGuidedRevisionSession, continueGuidedRevisionSession } = await import('./services/revisionLearningService');
    const start = await startGuidedRevisionSession({ userId, itemId, sourceType: 'item' });
    expect(start).toBeTruthy();
    const sessionId = start!.sessionId;

    const result = await continueGuidedRevisionSession({
      userId,
      schoolId,
      sessionId,
      itemId,
      stage: 'recall',
      responseText: 'I remember linear equations use variables and isolate x',
    });
    expect(result).toBeTruthy();

    // Query canonical Learning Evidence. The committed projection is the
    // durable evidence record; sourceType belongs to its candidate projection.
    const committedRows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "CommittedLearningEvidenceProjection" WHERE "schoolId" = $1 AND "learnerId" = $2`,
      schoolId, userId
    );
    expect(committedRows.length).toBe(1);
    const committed = committedRows[0];
    const candidateRows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "LearningEvidenceCandidateProjection" WHERE "schoolId" = $1 AND "learnerId" = $2`,
      schoolId, userId
    );
    expect(candidateRows.length).toBe(1);
    expect(candidateRows[0].sourceType).toBe('revision_recall');
    expect(committed.schoolId).toBe(schoolId);
    expect(committed.learnerId).toBe(userId);
    expect(committed.objectiveId).toBe(refs.objectiveId);
    expect(committed.skillId).toBe(refs.skillId);
    expect(committed.topicId).toBe(refs.topicId);
    const committedEvidenceId = committed.committedEvidenceId;
    expect(committedEvidenceId).toBeTruthy();

    const [stepRow] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "RevisionGuidedStepRecord" WHERE "sessionId" = $1 AND "stage" = 'recall' LIMIT 1`,
      sessionId
    );
    expect(stepRow).toBeTruthy();
    expect(stepRow.evidenceId).toBe(committedEvidenceId);
    expect(stepRow.status).toBe('completed');
    expect(stepRow.evidenceId).not.toBeNull();
  });

  // C2 — CANONICAL MASTERY SAME-ID HANDOFF
  it('C2: canonical Mastery receives EXACT SAME committedEvidenceId', async () => {
    const prisma = await getPrisma();
    const userId = uid();
    const schoolId = `r5c_school_${uid()}`;
    const itemId = uid();
    const refs = await createCurriculumHierarchy(prisma, schoolId);
    await createTestItemWithCurriculum(prisma, userId, itemId, 'Mastery handoff', refs);

    const { startGuidedRevisionSession, continueGuidedRevisionSession } = await import('./services/revisionLearningService');
    const { revisionMasteryRepository } = await import('./services/revisionCanonicalLearningService');

    const start = await startGuidedRevisionSession({ userId, itemId });
    const sessionId = start!.sessionId;

    const result = await continueGuidedRevisionSession({
      userId,
      schoolId,
      sessionId,
      itemId,
      stage: 'recall',
      responseText: 'Correct answer for trusted evaluation',
      trustedOutcome: 'correct',
    });
    expect(result).toBeTruthy();

    const committedRows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "CommittedLearningEvidenceProjection" WHERE "schoolId"=$1 AND "learnerId"=$2 ORDER BY "committedAt" DESC LIMIT 1`,
      schoolId, userId
    );
    expect(committedRows.length).toBe(1);
    const committedEvidenceId = committedRows[0].committedEvidenceId;

    const [stepRow] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "RevisionGuidedStepRecord" WHERE "sessionId"=$1 AND "stage"='recall' LIMIT 1`,
      sessionId
    );
    expect(stepRow.evidenceId).toBe(committedEvidenceId);

    // Mastery must have same evidenceId
    expect(revisionMasteryRepository.hasEvidenceBeenApplied(committedEvidenceId)).toBe(true);
    const target = {
      schoolId,
      learnerId: userId,
      targetNodeId: refs.objectiveId,
      targetNodeType: 'learning_objective' as const,
      curriculumVersionId: refs.versionId,
    };
    const state = revisionMasteryRepository.readState(target as any);
    expect(state).toBeTruthy();
    // Ensure no random second ID was used
    const logs = revisionMasteryRepository.listChangeLogs(schoolId, userId, refs.objectiveId);
    expect(logs.length).toBe(1);
    expect(logs[0].contributingEvidenceIds).toContain(committedEvidenceId);
    // No evidenceId starting with ev_ that is not committedEvidenceId
    const allEvidenceIds = logs.flatMap((l: any) => l.contributingEvidenceIds);
    expect(allEvidenceIds).toEqual([committedEvidenceId]);
  });

  // C3 — REAL CONCURRENT CLAIM
  it('C3: two concurrent responses produce exactly ONE claim winner and one evidence', async () => {
    const prisma = await getPrisma();
    const userId = uid();
    const schoolId = `r5c_school_${uid()}`;
    const itemId = uid();
    const refs = await createCurriculumHierarchy(prisma, schoolId);
    await createTestItemWithCurriculum(prisma, userId, itemId, 'Concurrent claim', refs);

    const { startGuidedRevisionSession, continueGuidedRevisionSession } = await import('./services/revisionLearningService');
    const start = await startGuidedRevisionSession({ userId, itemId });
    const sessionId = start!.sessionId;

    const input = {
      userId,
      schoolId,
      sessionId,
      itemId,
      stage: 'recall' as const,
      responseText: 'Concurrent answer attempt',
      trustedOutcome: 'correct' as const,
    };

    const results = await Promise.allSettled([
      continueGuidedRevisionSession(input),
      continueGuidedRevisionSession(input),
    ]);

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');
    // Exactly one should succeed (or one may return persisted after winner completes, but at least one fulfilled)
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);
    // At least one should be rejected as concurrency conflict OR both fulfilled but second returns persisted (still fulfilled)
    // The key is only ONE evidence/mutation path

    const evidenceRows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "CommittedLearningEvidenceProjection" WHERE "schoolId"=$1 AND "learnerId"=$2`,
      schoolId, userId
    );
    expect(evidenceRows.length).toBe(1);

    const stepRows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "RevisionGuidedStepRecord" WHERE "sessionId"=$1`,
      sessionId
    );
    expect(stepRows.length).toBe(1);
    expect(stepRows[0].status).toBe('completed');

    const reviewRows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "RevisionReviewEvent" WHERE "revisionItemId"=$1 AND "sessionId"=$2 AND "eventType" <> 'review_started'`,
      itemId, sessionId
    );
    // The start event is pre-existing; this claim creates exactly one result event.
    expect(reviewRows.length).toBe(1);

    const [sessionRow] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "RevisionGuidedSessionRecord" WHERE "id"=$1`,
      sessionId
    );
    expect(sessionRow.currentStage).toBe('quick_check');
    // Version should have advanced at least once from 1, but not twice for same stage
    expect(Number(sessionRow.version)).toBeGreaterThanOrEqual(2);
    // Ensure no duplicate mastery application
    const { revisionMasteryRepository } = await import('./services/revisionCanonicalLearningService');
    const logs = revisionMasteryRepository.listChangeLogs(schoolId, userId, refs.objectiveId);
    expect(logs.length).toBeLessThanOrEqual(1);
  });

  // C4 — EVIDENCE SUCCESS → MASTERY FAILURE → RESTART → RETRY
  it('C4: evidence persists after mastery failure and retry reuses same evidence', async () => {
    const prisma = await getPrisma();
    const userId = uid();
    const schoolId = `r5c_school_${uid()}`;
    const itemId = uid();
    const refs = await createCurriculumHierarchy(prisma, schoolId);
    await createTestItemWithCurriculum(prisma, userId, itemId, 'Recovery test', refs);

    const { startGuidedRevisionSession, continueGuidedRevisionSession } = await import('./services/revisionLearningService');
    const { __setForceMasteryFailure } = await import('./services/revisionCanonicalLearningService');
    const start = await startGuidedRevisionSession({ userId, itemId });
    const sessionId = start!.sessionId;

    __setForceMasteryFailure(true);
    let firstError: any = null;
    try {
      await continueGuidedRevisionSession({
        userId,
        schoolId,
        sessionId,
        itemId,
        stage: 'recall',
        responseText: 'Will fail mastery',
        trustedOutcome: 'correct',
      });
    } catch (e) {
      firstError = e;
    }
    expect(firstError).toBeTruthy();

    // DB should show evidence_committed but not mastery
    const [stepAfterFail] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "RevisionGuidedStepRecord" WHERE "sessionId"=$1 AND "stage"='recall' LIMIT 1`,
      sessionId
    );
    expect(stepAfterFail).toBeTruthy();
    expect(stepAfterFail.status).toBe('evidence_committed');
    expect(stepAfterFail.evidenceId).toBeTruthy();
    const committedEvidenceId = stepAfterFail.evidenceId;
    expect(stepAfterFail.masteryApplied).toBe(false);

    const [sessionAfterFail] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "RevisionGuidedSessionRecord" WHERE "id"=$1`,
      sessionId
    );
    expect(sessionAfterFail.status).toBe('processing');

    const evidenceRows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "CommittedLearningEvidenceProjection" WHERE "schoolId"=$1 AND "learnerId"=$2`,
      schoolId, userId
    );
    expect(evidenceRows.length).toBe(1);
    expect(evidenceRows[0].committedEvidenceId).toBe(committedEvidenceId);

    // Simulate reconstruction: reset failure and retry same request
    __setForceMasteryFailure(false);
    const retryResult = await continueGuidedRevisionSession({
      userId,
      schoolId,
      sessionId,
      itemId,
      stage: 'recall',
      responseText: 'Will fail mastery',
      trustedOutcome: 'correct',
    });
    expect(retryResult).toBeTruthy();
    expect(retryResult!.stage).toBe('quick_check');

    const [stepAfterRetry] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "RevisionGuidedStepRecord" WHERE "sessionId"=$1 AND "stage"='recall' LIMIT 1`,
      sessionId
    );
    expect(stepAfterRetry.status).toBe('completed');
    expect(stepAfterRetry.evidenceId).toBe(committedEvidenceId);
    expect(stepAfterRetry.masteryApplied).toBe(true);

    const evidenceRows2 = await prisma.$queryRawUnsafe(
      `SELECT * FROM "CommittedLearningEvidenceProjection" WHERE "schoolId"=$1 AND "learnerId"=$2`,
      schoolId, userId
    );
    expect(evidenceRows2.length).toBe(1);

    const reviewRows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "RevisionReviewEvent" WHERE "revisionItemId"=$1 AND "sessionId"=$2 AND "eventType" <> 'review_started'`,
      itemId, sessionId
    );
    expect(reviewRows.length).toBe(1);

    const [sessionAfterRetry] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "RevisionGuidedSessionRecord" WHERE "id"=$1`,
      sessionId
    );
    expect(sessionAfterRetry.currentStage).toBe('quick_check');

    const { revisionMasteryRepository } = await import('./services/revisionCanonicalLearningService');
    const logs = revisionMasteryRepository.listChangeLogs(schoolId, userId, refs.objectiveId);
    expect(logs.length).toBe(1);
    expect(logs[0].contributingEvidenceIds[0]).toBe(committedEvidenceId);
  });

  // C5 — COMPLETED IDENTICAL RETRY
  it('C5: completed identical retry returns persisted result with no duplicate side effects', async () => {
    const prisma = await getPrisma();
    const userId = uid();
    const schoolId = `r5c_school_${uid()}`;
    const itemId = uid();
    const refs = await createCurriculumHierarchy(prisma, schoolId);
    await createTestItemWithCurriculum(prisma, userId, itemId, 'Completed retry', refs);

    const { startGuidedRevisionSession, continueGuidedRevisionSession } = await import('./services/revisionLearningService');
    const start = await startGuidedRevisionSession({ userId, itemId });
    const sessionId = start!.sessionId;

    const first = await continueGuidedRevisionSession({
      userId,
      schoolId,
      sessionId,
      itemId,
      stage: 'recall',
      responseText: 'First completion',
      trustedOutcome: 'correct',
    });
    expect(first).toBeTruthy();

    const [stepBefore] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "RevisionGuidedStepRecord" WHERE "sessionId"=$1 AND "stage"='recall' LIMIT 1`,
      sessionId
    );
    const persisted = typeof stepBefore.result === 'string'
      ? JSON.parse(stepBefore.result)
      : stepBefore.result;
    const [sessionBefore] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "RevisionGuidedSessionRecord" WHERE "id"=$1`,
      sessionId
    );
    const versionBefore = Number(sessionBefore.version);
    const evidenceCountBefore = (await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS cnt FROM "CommittedLearningEvidenceProjection" WHERE "schoolId"=$1 AND "learnerId"=$2`,
      schoolId, userId
    ))[0].cnt;

    const second = await continueGuidedRevisionSession({
      userId,
      schoolId,
      sessionId,
      itemId,
      stage: 'recall',
      responseText: 'First completion',
      trustedOutcome: 'correct',
    });
    expect(second).toBeTruthy();
    expect(JSON.stringify(second)).toBe(JSON.stringify(persisted));

    const evidenceCountAfter = (await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS cnt FROM "CommittedLearningEvidenceProjection" WHERE "schoolId"=$1 AND "learnerId"=$2`,
      schoolId, userId
    ))[0].cnt;
    expect(evidenceCountAfter).toBe(evidenceCountBefore);

    const [sessionAfter] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "RevisionGuidedSessionRecord" WHERE "id"=$1`,
      sessionId
    );
    expect(Number(sessionAfter.version)).toBe(versionBefore);

    const { revisionMasteryRepository } = await import('./services/revisionCanonicalLearningService');
    const logs = revisionMasteryRepository.listChangeLogs(schoolId, userId, refs.objectiveId);
    expect(logs.length).toBe(1);
  });

  // C6 — HEURISTIC NON-POSITIVE SAFETY
  it('C6: verbose heuristic without trusted evaluator does NOT create positive mastery', async () => {
    const prisma = await getPrisma();
    const userId = uid();
    const schoolId = `r5c_school_${uid()}`;
    const itemId = uid();
    const refs = await createCurriculumHierarchy(prisma, schoolId);
    await createTestItemWithCurriculum(prisma, userId, itemId, 'Heuristic safety', refs);

    const beforeRow = await prisma.$queryRawUnsafe(
      `SELECT "successCount","struggleCount" FROM "RevisionItem" WHERE "id"=$1`,
      itemId
    );
    const beforeSuccess = Number(beforeRow[0].successCount || 0);

    const { startGuidedRevisionSession, continueGuidedRevisionSession } = await import('./services/revisionLearningService');
    const { revisionMasteryRepository } = await import('./services/revisionCanonicalLearningService');
    const start = await startGuidedRevisionSession({ userId, itemId });
    const sessionId = start!.sessionId;

    const verbose = `Algebra linear equation variable isolate x balance both sides equation solve step by step variable coefficient constant term solution substitution verification check answer plus all expected keywords for strong heuristic but should still be heuristic only`;

    const result = await continueGuidedRevisionSession({
      userId,
      schoolId,
      sessionId,
      itemId,
      stage: 'recall',
      responseText: verbose,
      // no trustedOutcome
    });
    expect(result).toBeTruthy();

    // Evidence may exist as unscored but not positive
    const evidenceRows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "CommittedLearningEvidenceProjection" WHERE "schoolId"=$1 AND "learnerId"=$2`,
      schoolId, userId
    );
    if (evidenceRows.length === 1) {
      expect(evidenceRows[0].outcome).toBe('unscored');
    }

    // Mastery not positively increased
    const afterLogs = revisionMasteryRepository.listChangeLogs(schoolId, userId, refs.objectiveId);
    expect(afterLogs.length).toBe(0);

    const afterItem = await prisma.$queryRawUnsafe(
      `SELECT "successCount" FROM "RevisionItem" WHERE "id"=$1`,
      itemId
    );
    expect(Number(afterItem[0].successCount || 0)).toBe(beforeSuccess);

    const reviewRows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "RevisionReviewEvent" WHERE "revisionItemId"=$1 AND "sessionId"=$2 ORDER BY "createdAt" DESC LIMIT 1`,
      itemId, sessionId
    );
    expect(reviewRows[0].outcome).toBeNull();
  });

  // C7 — INVALID OBJECTIVE FAIL-CLOSED
  it('C7: invalid LearningObjectiveId fails closed with no side effects', async () => {
    const prisma = await getPrisma();
    const userId = uid();
    const schoolId = `r5c_school_${uid()}`;
    const itemId = uid();
    await ensureStudentProfile(prisma, userId);
    await prisma.$executeRawUnsafe(
      `INSERT INTO "RevisionItem" ("id","userId","title","summary","content","contentType","curriculumObjectiveId","createdAt","updatedAt") VALUES ($1,$2,'Invalid obj','S','C','note','nonexistent_obj_123',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
      itemId, userId
    );
    const { startGuidedRevisionSession, continueGuidedRevisionSession } = await import('./services/revisionLearningService');
    const start = await startGuidedRevisionSession({ userId, itemId });
    expect(start).toBeTruthy();
    const sessionId = start!.sessionId;

    const beforeEvidence = (await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS cnt FROM "CommittedLearningEvidenceProjection" WHERE "schoolId"=$1 AND "learnerId"=$2`,
      schoolId, userId
    ))[0].cnt;

    await expect(
      continueGuidedRevisionSession({
        userId,
        schoolId,
        sessionId,
        itemId,
        stage: 'recall',
        responseText: 'any',
      })
    ).rejects.toThrow(/Invalid curriculum/);

    const afterEvidence = (await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS cnt FROM "CommittedLearningEvidenceProjection" WHERE "schoolId"=$1 AND "learnerId"=$2`,
      schoolId, userId
    ))[0].cnt;
    expect(afterEvidence).toBe(beforeEvidence);

    const [sessionRow] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "RevisionGuidedSessionRecord" WHERE "id"=$1`,
      sessionId
    );
    expect(sessionRow.currentStage).toBe('recall');

    const stepRows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "RevisionGuidedStepRecord" WHERE "sessionId"=$1`,
      sessionId
    );
    expect(stepRows.length).toBe(0);
  });
});
