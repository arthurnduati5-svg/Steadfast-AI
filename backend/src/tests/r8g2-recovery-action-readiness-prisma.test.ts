/**
 * R8-G.2 Action Readiness Prisma durability proof — REAL PostgreSQL.
 *
 * Runs under vitest.r8g2-prisma.config.mts (setupFiles: []) so the global
 * ../lib/prisma mock is NOT installed. Uses a unique school namespace per
 * run and cleans only rows it owns. Never truncates shared tables.
 *
 * Proofs: P1 durable create, P2 restart/reconstruction, P3 deterministic
 * replay, P4 conflicting reuse, P5 concurrent create, P6 atomic rollback,
 * tenant isolation, verified body identity.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(__dirname, '../../.env') });

process.env.NODE_ENV = 'test';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { default: prisma } = await import('../lib/prisma');

const { PrismaRecoveryOutcomeActionReadinessRepository } = await import(
  '../domains/assessment/recovery-outcome-action/repositories/prismaRecoveryOutcomeActionRepositories'
);
const { PrismaRecoveryOutcomeActionAuditRepository: PrismaAuditRepo } = await import(
  '../domains/assessment/recovery-outcome-action/repositories/prismaRecoveryOutcomeActionRepositories'
);
const { PrismaRecoveryOutcomeActionIdempotencyRepository: PrismaIdempotencyRepo } = await import(
  '../domains/assessment/recovery-outcome-action/repositories/prismaRecoveryOutcomeActionRepositories'
);
const { PrismaRecoveryOutcomeActionReadinessAtomicStore } = await import(
  '../domains/assessment/recovery-outcome-action/repositories/prismaRecoveryOutcomeActionReadinessAtomicStore'
);
const { RecoveryOutcomeActionReadinessService } = await import(
  '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeActionReadinessService'
);
const { RecoveryOutcomeActionSafetyService } = await import(
  '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeActionSafetyService'
);
const { RecoveryOutcomeActionAuditBridge } = await import(
  '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeActionAuditBridge'
);
const { RecoveryOutcomeActionIdempotencyService } = await import(
  '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeActionIdempotencyService'
);

const RUN = `r8g2-${Date.now().toString(36)}`;
const SCHOOL_A = `${RUN}-school-a`;
const SCHOOL_B = `${RUN}-school-b`;

function buildService() {
  const readinessRepo = new PrismaRecoveryOutcomeActionReadinessRepository(prisma);
  const auditRepo = new PrismaAuditRepo(prisma);
  const idempotencyRepo = new PrismaIdempotencyRepo(prisma);
  const safety = new RecoveryOutcomeActionSafetyService();
  const audit = new RecoveryOutcomeActionAuditBridge(auditRepo);
  const idempotency = new RecoveryOutcomeActionIdempotencyService(idempotencyRepo);
  const atomicStore = new PrismaRecoveryOutcomeActionReadinessAtomicStore(prisma);
  const service = new RecoveryOutcomeActionReadinessService(readinessRepo, safety, audit, idempotency, atomicStore);
  return { service, readinessRepo, auditRepo, idempotencyRepo, atomicStore };
}

function ctxFor(schoolId: string, key: string, role = 'teacher', actorId = 'r8g2-actor') {
  return { schoolId, actorId, actorRole: role, correlationId: `${RUN}-corr`, idempotencyKey: key };
}

function reqFor(tag: string, summary = 'R8-G.2 durable readiness') {
  return {
    schoolId: '',
    studentRef: `${RUN}-student-${tag}`,
    resultRecoveryPlanId: `${RUN}-plan`,
    recoveryOutcomeDecisionReadinessId: `${RUN}-decision-readiness`,
    safeReadinessSummary: summary,
    readinessChecksJson: { check: tag },
    createdByActorId: '',
    createdByRole: '',
  };
}

async function cleanupOwnedRows() {
  for (const schoolId of [SCHOOL_A, SCHOOL_B]) {
    await prisma.recoveryOutcomeActionIdempotencyRecord.deleteMany({ where: { schoolId } });
    await prisma.recoveryOutcomeActionAuditRecord.deleteMany({ where: { schoolId } });
    await prisma.recoveryOutcomeActionReadinessRecord.deleteMany({ where: { schoolId } });
  }
}

async function countReadiness(schoolId: string, studentRef?: string) {
  return prisma.recoveryOutcomeActionReadinessRecord.count({
    where: studentRef ? { schoolId, studentRef } : { schoolId },
  });
}

async function countCreationAudits(schoolId: string) {
  return prisma.recoveryOutcomeActionAuditRecord.count({
    where: { schoolId, eventType: 'ACTION_READINESS_CREATED' },
  });
}

describe('R8-G.2 Action Readiness Prisma durability (real DB)', () => {
  beforeAll(async () => {
    await cleanupOwnedRows();
  });

  afterAll(async () => {
    await cleanupOwnedRows();
    await prisma.$disconnect();
  });

  it('P1 — durable create persists readiness + audit + completed idempotency', async () => {
    const { service, auditRepo, idempotencyRepo } = buildService();
    const key = `${RUN}-p1`;
    const result = await service.createActionReadiness(ctxFor(SCHOOL_A, key), {
      ...reqFor('p1'),
      schoolId: SCHOOL_A,
      createdByActorId: 'r8g2-actor',
      createdByRole: 'teacher',
    });
    expect(result.success).toBe(true);
    expect(result.data?.actionReadinessId).toBeTruthy();
    expect(result.data?.schoolId).toBe(SCHOOL_A);

    const readiness = await prisma.recoveryOutcomeActionReadinessRecord.findUnique({
      where: { actionReadinessId: result.data!.actionReadinessId },
    });
    expect(readiness).not.toBeNull();
    expect(readiness!.schoolId).toBe(SCHOOL_A);

    const audits = await auditRepo.listByEventType(SCHOOL_A, 'ACTION_READINESS_CREATED');
    expect(audits.length).toBeGreaterThanOrEqual(1);

    const claim = await idempotencyRepo.getByKey(SCHOOL_A, key);
    expect(claim).not.toBeNull();
    expect(claim!.status).toBe('completed');
    expect(claim!.resourceId).toBe(result.data!.actionReadinessId);
  });

  it('P2 — restart/reconstruction returns the same canonical resource', async () => {
    const first = buildService();
    const key = `${RUN}-p2`;
    const created = await first.service.createActionReadiness(ctxFor(SCHOOL_A, key), {
      ...reqFor('p2'),
      schoolId: SCHOOL_A,
      createdByActorId: 'r8g2-actor',
      createdByRole: 'teacher',
    });
    expect(created.success).toBe(true);
    const id = created.data!.actionReadinessId;

    // Reconstruct production dependencies from scratch (simulated restart).
    const second = buildService();
    const fetched = await second.service.getActionReadiness(id, SCHOOL_A);
    expect(fetched.success).toBe(true);
    expect(fetched.data?.actionReadinessId).toBe(id);
    expect(fetched.data?.schoolId).toBe(SCHOOL_A);
  });

  it('P3 — deterministic replay creates no second resource or audit', async () => {
    const { service } = buildService();
    const key = `${RUN}-p3`;
    const req = { ...reqFor('p3'), schoolId: SCHOOL_A, createdByActorId: 'r8g2-actor', createdByRole: 'teacher' };
    const first = await service.createActionReadiness(ctxFor(SCHOOL_A, key), req);
    expect(first.success).toBe(true);

    const before = await countCreationAudits(SCHOOL_A);
    const replay = await service.createActionReadiness(ctxFor(SCHOOL_A, key), req);
    expect(replay.success).toBe(false);
    expect(replay.status).toBe('DUPLICATE');
    expect(replay.data?.actionReadinessId).toBe(first.data!.actionReadinessId);

    expect(await countReadiness(SCHOOL_A, req.studentRef)).toBe(1);
    expect(await countCreationAudits(SCHOOL_A)).toBe(before);
  });

  it('P4 — conflicting reuse of the same key returns conflict with no second mutation', async () => {
    const { service } = buildService();
    const key = `${RUN}-p4`;
    const first = await service.createActionReadiness(ctxFor(SCHOOL_A, key), {
      ...reqFor('p4a', 'original payload'),
      schoolId: SCHOOL_A,
      createdByActorId: 'r8g2-actor',
      createdByRole: 'teacher',
    });
    expect(first.success).toBe(true);

    const conflict = await service.createActionReadiness(ctxFor(SCHOOL_A, key), {
      ...reqFor('p4b', 'conflicting payload'),
      schoolId: SCHOOL_A,
      createdByActorId: 'r8g2-actor',
      createdByRole: 'teacher',
    });
    expect(conflict.success).toBe(false);
    expect(conflict.status).toBe('CONFLICT');

    expect(await countReadiness(SCHOOL_A, `${RUN}-student-p4b`)).toBe(0);
  });

  it('P5 — concurrent same-key creates produce one canonical mutation', async () => {
    const { service } = buildService();
    const key = `${RUN}-p5`;
    const req = { ...reqFor('p5'), schoolId: SCHOOL_A, createdByActorId: 'r8g2-actor', createdByRole: 'teacher' };
    const attempts = await Promise.allSettled([
      service.createActionReadiness(ctxFor(SCHOOL_A, key), req),
      service.createActionReadiness(ctxFor(SCHOOL_A, key), req),
    ]);
    const fulfilled = attempts.filter((a) => a.status === 'fulfilled');
    expect(fulfilled).toHaveLength(2);

    expect(await countReadiness(SCHOOL_A, req.studentRef)).toBe(1);
    expect(await countCreationAudits(SCHOOL_A)).toBeGreaterThanOrEqual(1);

    const readinessRows = await prisma.recoveryOutcomeActionReadinessRecord.findMany({
      where: { schoolId: SCHOOL_A, studentRef: req.studentRef },
    });
    expect(readinessRows).toHaveLength(1);
    const claims = await prisma.recoveryOutcomeActionIdempotencyRecord.findMany({
      where: { schoolId: SCHOOL_A, idempotencyKey: key },
    });
    expect(claims).toHaveLength(1);
    expect(claims[0].status).toBe('completed');
    expect(claims[0].resourceId).toBe(readinessRows[0].actionReadinessId);
  });

  it('P6 — audit failure rolls back resource and idempotency mutation', async () => {
    const { atomicStore, auditRepo, idempotencyRepo } = buildService();
    const key = `${RUN}-p6`;
    const studentRef = `${RUN}-student-p6`;

    // Pre-seed an auditEventId, then force the atomic mutation to reuse it so
    // the audit write hits a deterministic DB unique violation.
    const preseeded = await auditRepo.create({
      auditEventId: `${RUN}-audit-collision`,
      schoolId: SCHOOL_A,
      actorId: 'r8g2-actor',
      actorRole: 'teacher',
      eventType: 'R8G2_PRESEED',
      decision: 'created',
      safeSummary: 'preseed',
      reasonCodesJson: {},
      metadataJson: {},
      createdAt: new Date(),
    });
    expect(preseeded.auditEventId).toBe(`${RUN}-audit-collision`);

    const now = new Date();
    await expect(
      atomicStore.createWithGuards({
        schoolId: SCHOOL_A,
        operation: 'createActionReadiness',
        idempotencyKey: key,
        canonicalInput: { studentRef },
        readiness: {
          actionReadinessId: `${RUN}-readiness-p6`,
          schoolId: SCHOOL_A,
          studentRef,
          resultRecoveryPlanId: `${RUN}-plan`,
          recoveryOutcomeDecisionReadinessId: `${RUN}-decision-readiness`,
          readinessStatus: 'draft',
          safeReadinessSummary: 'p6',
          readinessChecksJson: {},
          blockedReasonCodesJson: [],
          sourceRefsJson: {},
          createdByActorId: 'r8g2-actor',
          createdByRole: 'teacher',
          createdAt: now,
          updatedAt: now,
        },
        audit: {
          auditEventId: `${RUN}-audit-collision`,
          eventType: 'ACTION_READINESS_CREATED',
          decision: 'created',
          safeSummary: 'p6 collision',
          actorId: 'r8g2-actor',
          actorRole: 'teacher',
          correlationId: `${RUN}-corr`,
        },
      }),
    ).rejects.toThrow();

    expect(await countReadiness(SCHOOL_A, studentRef)).toBe(0);
    expect(await idempotencyRepo.getByKey(SCHOOL_A, key)).toBeNull();
  });

  it('tenant isolation — school B cannot read or mutate school A records', async () => {
    const { service, auditRepo } = buildService();
    const created = await service.createActionReadiness(ctxFor(SCHOOL_A, `${RUN}-iso`), {
      ...reqFor('iso'),
      schoolId: SCHOOL_A,
      createdByActorId: 'r8g2-actor',
      createdByRole: 'teacher',
    });
    expect(created.success).toBe(true);
    const id = created.data!.actionReadinessId;

    const crossRead = await service.getActionReadiness(id, SCHOOL_B);
    expect(crossRead.success).toBe(false);
    expect(crossRead.status).toBe('NOT_FOUND');
    expect(crossRead.data).toBeUndefined();

    const crossMutate = await service.markActionReadinessReviewReady(ctxFor(SCHOOL_B, `${RUN}-iso-mutate`), id);
    expect(crossMutate.success).toBe(false);
    expect(crossMutate.status).toBe('NOT_FOUND');

    const own = await service.getActionReadiness(id, SCHOOL_A);
    expect(own.success).toBe(true);
    expect(own.data?.readinessStatus).toBe('draft');

    expect(await auditRepo.listBySchool(SCHOOL_B)).toHaveLength(0);
  });

  it('verified body identity — conflicting school rejected, verified actor wins', async () => {
    const { service } = buildService();

    const mismatch = await service.createActionReadiness(ctxFor(SCHOOL_A, `${RUN}-body1`), {
      ...reqFor('body1'),
      schoolId: SCHOOL_B,
      createdByActorId: 'attacker',
      createdByRole: 'admin',
    });
    expect(mismatch.success).toBe(false);

    const attackerCtx = await service.createActionReadiness(ctxFor(SCHOOL_A, `${RUN}-body2`), {
      ...reqFor('body2'),
      schoolId: SCHOOL_A,
      createdByActorId: 'attacker-controlled-value',
      createdByRole: 'admin',
    });
    expect(attackerCtx.success).toBe(true);
    expect(attackerCtx.data?.schoolId).toBe(SCHOOL_A);
    expect(attackerCtx.data?.createdByActorId).toBe('r8g2-actor');
    expect(attackerCtx.data?.createdByRole).toBe('teacher');
  });

  it('status transitions stay durable and school scoped', async () => {
    const { service } = buildService();
    const created = await service.createActionReadiness(ctxFor(SCHOOL_A, `${RUN}-trans`), {
      ...reqFor('trans'),
      schoolId: SCHOOL_A,
      createdByActorId: 'r8g2-actor',
      createdByRole: 'teacher',
    });
    expect(created.success).toBe(true);
    const id = created.data!.actionReadinessId;

    const reviewReady = await service.markActionReadinessReviewReady(ctxFor(SCHOOL_A, `${RUN}-trans-rr`), id);
    expect(reviewReady.success).toBe(true);
    expect(reviewReady.data?.readinessStatus).toBe('review_ready');

    // Reconstruction still sees the transitioned state.
    const rebuilt = buildService();
    const fetched = await rebuilt.service.getActionReadiness(id, SCHOOL_A);
    expect(fetched.data?.readinessStatus).toBe('review_ready');

    const suppressed = await rebuilt.service.suppressActionReadiness(ctxFor(SCHOOL_A, `${RUN}-trans-sup`), id);
    expect(suppressed.success).toBe(true);
    expect(suppressed.data?.readinessStatus).toBe('suppressed');
  });
});
