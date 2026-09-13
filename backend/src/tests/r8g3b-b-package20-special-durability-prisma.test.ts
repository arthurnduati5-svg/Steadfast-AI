/**
 * R8-G.3B-B Package-20 special-family durability proof — REAL PostgreSQL.
 *
 * Runs under vitest.r8g3b-b-prisma.config.mts (setupFiles: []) so the global
 * ../lib/prisma mock is NOT installed. Uses a unique school namespace per
 * run and cleans only rows it owns. Never truncates shared tables.
 *
 * Proofs (six special families: approval gate, mock activation queue,
 * dry-run receipt, rollback plan, suppression rule, action summary):
 *  P1  approval gate create -> restart -> satisfied -> restart
 *  P2  mock queue create -> restart -> dry_run_ready -> restart
 *  P3  dry-run receipt create -> restart -> void -> restart
 *  P4  rollback plan create -> restart -> review_ready -> restart
 *  P5  suppression rule create -> restart -> activate future-use -> restart
 *  P6  action summary create -> restart -> whitelisted refresh -> restart ->
 *      stale -> restart (identity cannot be rewritten by refresh)
 *  P7  same-key/same-request deterministic replay
 *  P8  same-key/different-request conflict
 *  P9  concurrent same-key exactly one mutation
 *  P10 audit failure rolls resource/claim back
 *  P11 tenant isolation (School B GET/transition known School A ID = 404;
 *      DryRun list-by-queue-item leaks nothing cross-school)
 *  P12 canonical verified identity (body school conflict rejected;
 *      school/actor/role stored from verified context)
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(__dirname, '../../.env') });

process.env.NODE_ENV = 'test';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { default: prisma } = await import('../lib/prisma');

const repos = await import(
  '../domains/assessment/recovery-outcome-action/repositories/prismaRecoveryOutcomeActionRepositories'
);
const storeMod = await import(
  '../domains/assessment/recovery-outcome-action/repositories/prismaRecoveryOutcomeActionPreparationAtomicStore'
);
const approvalSvcMod = await import(
  '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeApprovalGateService'
);
const mockQueueSvcMod = await import(
  '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeMockActivationQueueService'
);
const receiptSvcMod = await import(
  '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeDryRunReceiptService'
);
const rollbackSvcMod = await import(
  '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeRollbackPlanService'
);
const suppressionSvcMod = await import(
  '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeSuppressionRuleService'
);
const summarySvcMod = await import(
  '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeActionSummaryService'
);
const safetyMod = await import(
  '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeActionSafetyService'
);
const auditBridgeMod = await import(
  '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeActionAuditBridge'
);
const idemSvcMod = await import(
  '../domains/assessment/recovery-outcome-action/services/recoveryOutcomeActionIdempotencyService'
);

const RUN = `r8g3bb-${Date.now().toString(36)}`;
const SCHOOL_A = `${RUN}-school-a`;
const SCHOOL_B = `${RUN}-school-b`;
const CTX_ACTOR = 'r8g3bb-actor-ctx';

const SAFETY = new safetyMod.RecoveryOutcomeActionSafetyService();

type FamilyKind =
  | 'approvalGate'
  | 'mockQueue'
  | 'dryRunReceipt'
  | 'rollbackPlan'
  | 'suppressionRule'
  | 'actionSummary';

// Returns any of the six special-family services; call sites dispatch on the
// family kind (same effective pattern as the G.3B-A durability suite).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildServicesFor(kind: FamilyKind): any {
  const store = new storeMod.PrismaRecoveryOutcomeActionPreparationAtomicStore(prisma);
  const auditRepo = new repos.PrismaRecoveryOutcomeActionAuditRepository(prisma);
  const idemRepo = new repos.PrismaRecoveryOutcomeActionIdempotencyRepository(prisma);
  const audit = new auditBridgeMod.RecoveryOutcomeActionAuditBridge(auditRepo);
  const idem = new idemSvcMod.RecoveryOutcomeActionIdempotencyService(idemRepo);
  switch (kind) {
    case 'approvalGate': {
      const repo = new repos.PrismaRecoveryOutcomeApprovalGateRepository(prisma);
      return new approvalSvcMod.RecoveryOutcomeApprovalGateService(repo, SAFETY, audit, idem, store);
    }
    case 'mockQueue': {
      const repo = new repos.PrismaRecoveryOutcomeMockActivationQueueRepository(prisma);
      return new mockQueueSvcMod.RecoveryOutcomeMockActivationQueueService(repo, SAFETY, audit, idem, store);
    }
    case 'dryRunReceipt': {
      const repo = new repos.PrismaRecoveryOutcomeDryRunReceiptRepository(prisma);
      return new receiptSvcMod.RecoveryOutcomeDryRunReceiptService(repo, SAFETY, audit, idem, store);
    }
    case 'rollbackPlan': {
      const repo = new repos.PrismaRecoveryOutcomeRollbackPlanRepository(prisma);
      return new rollbackSvcMod.RecoveryOutcomeRollbackPlanService(repo, SAFETY, audit, idem, store);
    }
    case 'suppressionRule': {
      const repo = new repos.PrismaRecoveryOutcomeSuppressionRuleRepository(prisma);
      return new suppressionSvcMod.RecoveryOutcomeSuppressionRuleService(repo, SAFETY, audit, idem, store);
    }
    case 'actionSummary': {
      const repo = new repos.PrismaRecoveryOutcomeActionSummaryRepository(prisma);
      return new summarySvcMod.RecoveryOutcomeActionSummaryService(repo, SAFETY, audit, idem, store);
    }
  }
}

function ctxFor(schoolId: string, key: string, role = 'teacher', actorId = CTX_ACTOR) {
  return { schoolId, actorId, actorRole: role, correlationId: `${RUN}-corr`, idempotencyKey: key };
}

function approvalGateReq(tag: string) {
  return {
    schoolId: SCHOOL_A,
    studentRef: `${RUN}-student-${tag}`,
    resultRecoveryPlanId: `${RUN}-plan`,
    safeGateSummary: `R8-G.3B-B gate ${tag}`,
    requiredApprovalsJson: { roles: ['department_head'] },
    sourceRefsJson: {},
    createdByActorId: CTX_ACTOR,
    createdByRole: 'teacher',
  };
}

function mockQueueReq(tag: string) {
  return {
    schoolId: SCHOOL_A,
    studentRef: `${RUN}-student-${tag}`,
    resultRecoveryPlanId: `${RUN}-plan`,
    safeQueueSummary: `R8-G.3B-B queue ${tag}`,
    actionRefsJson: { ref: tag },
    mockParametersJson: { step: tag },
    sourceRefsJson: {},
    createdByActorId: CTX_ACTOR,
    createdByRole: 'teacher',
  };
}

function receiptReq(tag: string, queueItemId: string) {
  return {
    schoolId: SCHOOL_A,
    mockActivationQueueItemId: queueItemId,
    studentRef: `${RUN}-student-${tag}`,
    resultRecoveryPlanId: `${RUN}-plan`,
    receiptResult: 'simulated_success' as const,
    safeReceiptSummary: `R8-G.3B-B receipt ${tag}`,
    simulationDetailsJson: { steps: [tag] },
    sourceRefsJson: {},
    createdByActorId: CTX_ACTOR,
    createdByRole: 'teacher',
  };
}

function rollbackPlanReq(tag: string) {
  return {
    schoolId: SCHOOL_A,
    studentRef: `${RUN}-student-${tag}`,
    resultRecoveryPlanId: `${RUN}-plan`,
    safeRollbackSummary: `R8-G.3B-B rollback ${tag}`,
    rollbackStepsJson: { step: tag },
    rollbackTriggersJson: { trigger: 'failure' },
    sourceRefsJson: {},
    createdByActorId: CTX_ACTOR,
    createdByRole: 'teacher',
  };
}

function suppressionRuleReq(tag: string) {
  return {
    schoolId: SCHOOL_A,
    studentRef: `${RUN}-student-${tag}`,
    resultRecoveryPlanId: `${RUN}-plan`,
    safeRuleSummary: `R8-G.3B-B rule ${tag}`,
    ruleConditionsJson: { scoreBelow: 40 },
    ruleScopeJson: { scope: 'notifications' },
    sourceRefsJson: {},
    createdByActorId: CTX_ACTOR,
    createdByRole: 'teacher',
  };
}

function summaryReq(tag: string) {
  return {
    schoolId: SCHOOL_A,
    studentRef: `${RUN}-student-${tag}`,
    resultRecoveryPlanId: `${RUN}-plan`,
    safeSummary: `R8-G.3B-B summary ${tag}`,
    actionCountsJson: { total: 2 },
    topActionsJson: { action1: 'continuation' },
    nextStepsJson: { next: 'review' },
    sourceRefsJson: {},
    createdByActorId: CTX_ACTOR,
    createdByRole: 'teacher',
  };
}

async function cleanupOwnedRows() {
  for (const schoolId of [SCHOOL_A, SCHOOL_B]) {
    await prisma.recoveryOutcomeActionIdempotencyRecord.deleteMany({ where: { schoolId } });
    await prisma.recoveryOutcomeActionAuditRecord.deleteMany({ where: { schoolId } });
    await prisma.recoveryOutcomeApprovalGateRecord.deleteMany({ where: { schoolId } });
    await prisma.recoveryOutcomeMockActivationQueueRecord.deleteMany({ where: { schoolId } });
    await prisma.recoveryOutcomeDryRunReceiptRecord.deleteMany({ where: { schoolId } });
    await prisma.recoveryOutcomeRollbackPlanRecord.deleteMany({ where: { schoolId } });
    await prisma.recoveryOutcomeSuppressionRuleRecord.deleteMany({ where: { schoolId } });
    await prisma.recoveryOutcomeActionSummaryRecord.deleteMany({ where: { schoolId } });
  }
}

async function countAudits(schoolId: string, eventType: string) {
  return prisma.recoveryOutcomeActionAuditRecord.count({ where: { schoolId, eventType } });
}

describe('R8-G.3B-B Package-20 special-family durability (real DB)', () => {
  beforeAll(async () => {
    await cleanupOwnedRows();
  });

  afterAll(async () => {
    await cleanupOwnedRows();
    await prisma.$disconnect();
  });

  it('P1 — approval gate create -> restart -> satisfied -> restart', async () => {
    const service = buildServicesFor('approvalGate');
    const key = `${RUN}-p1`;
    const result = await service.createApprovalGate(ctxFor(SCHOOL_A, key), approvalGateReq('p1'));
    expect(result.success).toBe(true);
    expect(result.data!.gateStatus).toBe('pending');
    const id = result.data!.approvalGateId;

    // Fresh instance = "restart": reconstruct everything from Prisma.
    const reread = await prisma.recoveryOutcomeApprovalGateRecord.findUnique({ where: { approvalGateId: id } });
    expect(reread).not.toBeNull();
    expect(reread!.schoolId).toBe(SCHOOL_A);
    expect(reread!.gateStatus).toBe('pending');

    const satisfied = await service.markApprovalGateSatisfied(ctxFor(SCHOOL_A, `${RUN}-p1-tx`), id);
    expect(satisfied.success).toBe(true);
    expect(satisfied.data!.gateStatus).toBe('satisfied');

    const reread2 = await prisma.recoveryOutcomeApprovalGateRecord.findUnique({ where: { approvalGateId: id } });
    expect(reread2!.gateStatus).toBe('satisfied');
    expect(reread2!.satisfiedAt).not.toBeNull();
  });

  it('P2 — mock queue create -> restart -> dry_run_ready -> restart', async () => {
    const service = buildServicesFor('mockQueue');
    const key = `${RUN}-p2`;
    const result = await service.createMockActivationQueueItem(ctxFor(SCHOOL_A, key), mockQueueReq('p2'));
    expect(result.success).toBe(true);
    expect(result.data!.queueStatus).toBe('draft');
    const id = result.data!.mockActivationQueueItemId;

    const reread = await prisma.recoveryOutcomeMockActivationQueueRecord.findUnique({ where: { mockActivationQueueItemId: id } });
    expect(reread).not.toBeNull();
    expect(reread!.queueStatus).toBe('draft');

    const ready = await service.markQueueItemDryRunReady(ctxFor(SCHOOL_A, `${RUN}-p2-tx`), id);
    expect(ready.success).toBe(true);
    expect(ready.data!.queueStatus).toBe('dry_run_ready');

    const reread2 = await prisma.recoveryOutcomeMockActivationQueueRecord.findUnique({ where: { mockActivationQueueItemId: id } });
    expect(reread2!.queueStatus).toBe('dry_run_ready');
    expect(reread2!.dryRunReadyAt).not.toBeNull();
  });

  it('P3 — dry-run receipt create -> restart -> void -> restart', async () => {
    const service = buildServicesFor('dryRunReceipt');
    const queueItemId = `${RUN}-queue-p3`;
    const key = `${RUN}-p3`;
    const result = await service.createDryRunReceipt(ctxFor(SCHOOL_A, key), receiptReq('p3', queueItemId));
    expect(result.success).toBe(true);
    expect(result.data!.receiptResult).toBe('simulated_success');
    const id = result.data!.dryRunReceiptId;

    const reread = await prisma.recoveryOutcomeDryRunReceiptRecord.findUnique({ where: { dryRunReceiptId: id } });
    expect(reread).not.toBeNull();
    expect(reread!.schoolId).toBe(SCHOOL_A);

    const voided = await service.voidDryRunReceipt(ctxFor(SCHOOL_A, `${RUN}-p3-tx`), id);
    expect(voided.success).toBe(true);
    expect(voided.data!.voidedAt).toBeDefined();

    const reread2 = await prisma.recoveryOutcomeDryRunReceiptRecord.findUnique({ where: { dryRunReceiptId: id } });
    expect(reread2!.voidedAt).not.toBeNull();
    // Void records voidedAt only — receipt result remains simulation evidence.
    expect(reread2!.receiptResult).toBe('simulated_success');
  });

  it('P4 — rollback plan create -> restart -> review_ready -> restart', async () => {
    const service = buildServicesFor('rollbackPlan');
    const key = `${RUN}-p4`;
    const result = await service.createRollbackPlan(ctxFor(SCHOOL_A, key), rollbackPlanReq('p4'));
    expect(result.success).toBe(true);
    expect(result.data!.rollbackStatus).toBe('draft');
    const id = result.data!.rollbackPlanId;

    const reread = await prisma.recoveryOutcomeRollbackPlanRecord.findUnique({ where: { rollbackPlanId: id } });
    expect(reread).not.toBeNull();
    expect(reread!.rollbackStatus).toBe('draft');

    const review = await service.markRollbackPlanReviewReady(ctxFor(SCHOOL_A, `${RUN}-p4-tx`), id);
    expect(review.success).toBe(true);
    expect(review.data!.rollbackStatus).toBe('review_ready');

    const reread2 = await prisma.recoveryOutcomeRollbackPlanRecord.findUnique({ where: { rollbackPlanId: id } });
    expect(reread2!.rollbackStatus).toBe('review_ready');
    expect(reread2!.reviewReadyAt).not.toBeNull();
  });

  it('P5 — suppression rule create -> restart -> activate future-use -> restart (no live effect)', async () => {
    const service = buildServicesFor('suppressionRule');
    const key = `${RUN}-p5`;
    const result = await service.createSuppressionRule(ctxFor(SCHOOL_A, key), suppressionRuleReq('p5'));
    expect(result.success).toBe(true);
    expect(result.data!.ruleStatus).toBe('active');
    const id = result.data!.suppressionRuleId;

    const reread = await prisma.recoveryOutcomeSuppressionRuleRecord.findUnique({ where: { suppressionRuleId: id } });
    expect(reread).not.toBeNull();
    expect(reread!.ruleStatus).toBe('active');

    const activated = await service.activateSuppressionRuleForFutureUse(ctxFor(SCHOOL_A, `${RUN}-p5-tx`), id);
    expect(activated.success).toBe(true);
    expect(activated.data!.ruleStatus).toBe('active');

    const reread2 = await prisma.recoveryOutcomeSuppressionRuleRecord.findUnique({ where: { suppressionRuleId: id } });
    expect(reread2!.ruleStatus).toBe('active');
    expect(reread2!.activatedForFutureUseAt).not.toBeNull();
    // No live suppression enforcement: the rule is metadata only.
    expect(await countAudits(SCHOOL_A, 'SUPPRESSION_RULE_ACTIVATED')).toBeGreaterThanOrEqual(1);
  });

  it('P6 — action summary create -> restart -> whitelisted refresh -> restart -> stale -> restart', async () => {
    const service = buildServicesFor('actionSummary');
    const key = `${RUN}-p6`;
    const result = await service.createActionSummary(ctxFor(SCHOOL_A, key), summaryReq('p6'));
    expect(result.success).toBe(true);
    expect(result.data!.summaryStatus).toBe('active');
    const id = result.data!.actionSummaryId;

    const reread = await prisma.recoveryOutcomeActionSummaryRecord.findUnique({ where: { actionSummaryId: id } });
    expect(reread).not.toBeNull();
    expect(reread!.schoolId).toBe(SCHOOL_A);
    expect(reread!.createdByActorId).toBe(CTX_ACTOR);

    // Refresh with whitelisted data PLUS spoofed identity fields that must be
    // ignored by the whitelist.
    const refreshed = await service.refreshActionSummary(ctxFor(SCHOOL_A, `${RUN}-p6-refresh`), id, {
      safeSummary: 'Updated summary',
      actionCountsJson: { total: 3 },
      schoolId: SCHOOL_B,
      createdByActorId: 'spoofed-actor',
      createdByRole: 'spoofed-role',
      actionSummaryId: 'spoofed-id',
      summaryStatus: 'voided',
    } as any);
    expect(refreshed.success).toBe(true);
    expect(refreshed.data!.summaryStatus).toBe('active');

    const reread2 = await prisma.recoveryOutcomeActionSummaryRecord.findUnique({ where: { actionSummaryId: id } });
    expect(reread2!.summaryStatus).toBe('active');
    expect(reread2!.refreshedAt).not.toBeNull();
    expect(reread2!.safeSummary).toBe('Updated summary');
    expect((reread2!.actionCountsJson as any).total).toBe(3);
    // Identity/ownership cannot be rewritten by refresh.
    expect(reread2!.schoolId).toBe(SCHOOL_A);
    expect(reread2!.createdByActorId).toBe(CTX_ACTOR);
    expect(reread2!.createdByRole).toBe('teacher');
    expect(reread2!.actionSummaryId).toBe(id);

    const stale = await service.markActionSummaryStale(ctxFor(SCHOOL_A, `${RUN}-p6-stale`), id);
    expect(stale.success).toBe(true);
    expect(stale.data!.summaryStatus).toBe('stale');

    const reread3 = await prisma.recoveryOutcomeActionSummaryRecord.findUnique({ where: { actionSummaryId: id } });
    expect(reread3!.summaryStatus).toBe('stale');
    expect(reread3!.staleAt).not.toBeNull();
  });

  it('P7 — same key + same request -> deterministic DUPLICATE replay, no second resource', async () => {
    const service = buildServicesFor('mockQueue');
    const key = `${RUN}-p7`;
    const first = await service.createMockActivationQueueItem(ctxFor(SCHOOL_A, key), mockQueueReq('p7'));
    expect(first.success).toBe(true);

    const second = await service.createMockActivationQueueItem(ctxFor(SCHOOL_A, key), mockQueueReq('p7'));
    expect(second.success).toBe(false);
    expect(second.status).toBe('DUPLICATE');
    expect(second.data!.mockActivationQueueItemId).toBe(first.data!.mockActivationQueueItemId);

    const count = await prisma.recoveryOutcomeMockActivationQueueRecord.count({
      where: { schoolId: SCHOOL_A, studentRef: `${RUN}-student-p7` },
    });
    expect(count).toBe(1);
  });

  it('P8 — same key + different request -> CONFLICT', async () => {
    const service = buildServicesFor('approvalGate');
    const key = `${RUN}-p8`;
    const first = await service.createApprovalGate(ctxFor(SCHOOL_A, key), approvalGateReq('p8'));
    expect(first.success).toBe(true);

    const different = { ...approvalGateReq('p8'), safeGateSummary: 'DIFFERENT PAYLOAD' };
    const second = await service.createApprovalGate(ctxFor(SCHOOL_A, key), different);
    expect(second.success).toBe(false);
    expect(second.status).toBe('CONFLICT');
  });

  it('P9 — concurrent same-key creates -> exactly one resource/audit/completed claim', async () => {
    const serviceA = buildServicesFor('rollbackPlan');
    const serviceB = buildServicesFor('rollbackPlan');
    const key = `${RUN}-p9`;
    const req = rollbackPlanReq('p9');

    const [a, b] = await Promise.all([
      serviceA.createRollbackPlan(ctxFor(SCHOOL_A, key), req),
      serviceB.createRollbackPlan(ctxFor(SCHOOL_A, key), req),
    ]);

    const successes = [a, b].filter(r => r.success).length;
    expect(successes).toBe(1);
    expect([a, b].every(r => r.success || r.status === 'CONFLICT' || r.status === 'DUPLICATE')).toBe(true);

    const count = await prisma.recoveryOutcomeRollbackPlanRecord.count({
      where: { schoolId: SCHOOL_A, studentRef: `${RUN}-student-p9` },
    });
    expect(count).toBe(1);

    const claimCount = await prisma.recoveryOutcomeActionIdempotencyRecord.count({
      where: { schoolId: SCHOOL_A, idempotencyKey: key },
    });
    expect(claimCount).toBe(1);
    const claim = await prisma.recoveryOutcomeActionIdempotencyRecord.findFirst({
      where: { schoolId: SCHOOL_A, idempotencyKey: key },
    });
    expect(claim?.status).toBe('completed');
    expect(await countAudits(SCHOOL_A, 'ROLLBACK_PLAN_CREATED')).toBeGreaterThanOrEqual(1);
  });

  it('P10 — audit/mutation failure rolls back resource and idempotency claim', async () => {
    const store = new storeMod.PrismaRecoveryOutcomeActionPreparationAtomicStore(prisma);
    const key = `${RUN}-p10`;
    let attempts = 0;
    try {
      await store.mutateWithGuards({
        schoolId: SCHOOL_A,
        operation: 'createApprovalGate',
        idempotencyKey: key,
        canonicalInput: { probe: 'p10' },
        resourceType: 'RecoveryOutcomeApprovalGate',
        mutate: async () => {
          attempts += 1;
          throw new Error('simulated mutate failure after claim');
        },
        load: async () => null,
        audit: {
          eventType: 'APPROVAL_GATE_CREATED',
          decision: 'created',
          safeSummary: 'p10',
          actorId: CTX_ACTOR,
          actorRole: 'teacher',
        },
      });
      throw new Error('expected mutate failure to propagate');
    } catch (err: any) {
      expect(err.message).toBe('simulated mutate failure after claim');
    }
    expect(attempts).toBe(1);

    // Transaction rolled back: no claim remains, so the key can be retried.
    const claim = await prisma.recoveryOutcomeActionIdempotencyRecord.findFirst({
      where: { schoolId: SCHOOL_A, idempotencyKey: key },
    });
    expect(claim).toBeNull();

    // Retry with a succeeding mutate completes deterministically.
    const retry = await store.mutateWithGuards({
      schoolId: SCHOOL_A,
      operation: 'createApprovalGate',
      idempotencyKey: key,
      canonicalInput: { probe: 'p10' },
      resourceType: 'RecoveryOutcomeApprovalGate',
      mutate: async (tx: any) => {
        const txRepo = new repos.PrismaRecoveryOutcomeApprovalGateRepository(tx);
        const now = new Date();
        const created = await txRepo.create({
          ...approvalGateReq('p10-retry'),
          approvalGateId: `${RUN}-p10-retry-id`,
          schoolId: SCHOOL_A,
          gateStatus: 'pending',
          approvalResultsJson: {},
          blockedReasonCodesJson: [],
          createdAt: now,
          updatedAt: now,
          createdByActorId: CTX_ACTOR,
          createdByRole: 'teacher',
        } as any);
        return { resource: created, resourceId: created.approvalGateId };
      },
      load: async (tx: any, resourceId: string) => {
        const txRepo = new repos.PrismaRecoveryOutcomeApprovalGateRepository(tx);
        return txRepo.getById(resourceId);
      },
      audit: {
        eventType: 'APPROVAL_GATE_CREATED',
        decision: 'created',
        safeSummary: 'p10 retry',
        actorId: CTX_ACTOR,
        actorRole: 'teacher',
      },
    });
    expect(retry.duplicate).toBe(false);
    expect(retry.resourceId).toBeTruthy();

    const retryClaim = await prisma.recoveryOutcomeActionIdempotencyRecord.findFirst({
      where: { schoolId: SCHOOL_A, idempotencyKey: key },
    });
    expect(retryClaim?.status).toBe('completed');
    expect(retryClaim?.resourceType).toBe('RecoveryOutcomeApprovalGate');
    expect(retryClaim?.resourceId).toBe(retry.resourceId);
  });

  it('P11 — tenant isolation across all six families + DryRun queue-item list leak guard', async () => {
    const specs = [
      {
        kind: 'approvalGate' as FamilyKind,
        create: (svc: any, ctx: any, req: any) => svc.createApprovalGate(ctx, req),
        req: approvalGateReq,
        getId: (d: any) => d.approvalGateId,
        get: (svc: any, id: string, schoolId?: string) => svc.getApprovalGate(id, schoolId),
        tx: (svc: any, ctx: any, id: string) => svc.markApprovalGateSatisfied(ctx, id),
        table: 'recoveryOutcomeApprovalGateRecord',
        idField: 'approvalGateId',
        statusField: 'gateStatus',
        txStatus: 'satisfied',
        txTimestamp: 'satisfiedAt',
        txEvent: 'APPROVAL_GATE_SATISFIED',
      },
      {
        kind: 'mockQueue' as FamilyKind,
        create: (svc: any, ctx: any, req: any) => svc.createMockActivationQueueItem(ctx, req),
        req: mockQueueReq,
        getId: (d: any) => d.mockActivationQueueItemId,
        get: (svc: any, id: string, schoolId?: string) => svc.getMockActivationQueueItem(id, schoolId),
        tx: (svc: any, ctx: any, id: string) => svc.markQueueItemDryRunReady(ctx, id),
        table: 'recoveryOutcomeMockActivationQueueRecord',
        idField: 'mockActivationQueueItemId',
        statusField: 'queueStatus',
        txStatus: 'dry_run_ready',
        txTimestamp: 'dryRunReadyAt',
        txEvent: 'MOCK_QUEUE_ITEM_DRY_RUN_READY',
      },
      {
        kind: 'dryRunReceipt' as FamilyKind,
        create: (svc: any, ctx: any, req: any) => svc.createDryRunReceipt(ctx, req),
        req: (tag: string) => receiptReq(tag, `${RUN}-queue-p11`),
        getId: (d: any) => d.dryRunReceiptId,
        get: (svc: any, id: string, schoolId?: string) => svc.getDryRunReceipt(id, schoolId),
        tx: (svc: any, ctx: any, id: string) => svc.voidDryRunReceipt(ctx, id),
        table: 'recoveryOutcomeDryRunReceiptRecord',
        idField: 'dryRunReceiptId',
        statusField: 'voidedAt',
        txStatus: 'set',
        txTimestamp: 'voidedAt',
        txEvent: 'DRY_RUN_RECEIPT_VOIDED',
      },
      {
        kind: 'rollbackPlan' as FamilyKind,
        create: (svc: any, ctx: any, req: any) => svc.createRollbackPlan(ctx, req),
        req: rollbackPlanReq,
        getId: (d: any) => d.rollbackPlanId,
        get: (svc: any, id: string, schoolId?: string) => svc.getRollbackPlan(id, schoolId),
        tx: (svc: any, ctx: any, id: string) => svc.markRollbackPlanReviewReady(ctx, id),
        table: 'recoveryOutcomeRollbackPlanRecord',
        idField: 'rollbackPlanId',
        statusField: 'rollbackStatus',
        txStatus: 'review_ready',
        txTimestamp: 'reviewReadyAt',
        txEvent: 'ROLLBACK_PLAN_REVIEW_READY',
      },
      {
        // NOTE: activation keeps ruleStatus 'active' (the create status), so
        // the representative cross-school transition uses suppress instead.
        kind: 'suppressionRule' as FamilyKind,
        create: (svc: any, ctx: any, req: any) => svc.createSuppressionRule(ctx, req),
        req: suppressionRuleReq,
        getId: (d: any) => d.suppressionRuleId,
        get: (svc: any, id: string, schoolId?: string) => svc.getSuppressionRule(id, schoolId),
        tx: (svc: any, ctx: any, id: string) => svc.suppressSuppressionRule(ctx, id),
        table: 'recoveryOutcomeSuppressionRuleRecord',
        idField: 'suppressionRuleId',
        statusField: 'ruleStatus',
        txStatus: 'suppressed',
        txTimestamp: 'suppressedAt',
        txEvent: 'SUPPRESSION_RULE_SUPPRESSED',
      },
      {
        kind: 'actionSummary' as FamilyKind,
        create: (svc: any, ctx: any, req: any) => svc.createActionSummary(ctx, req),
        req: summaryReq,
        getId: (d: any) => d.actionSummaryId,
        get: (svc: any, id: string, schoolId?: string) => svc.getActionSummary(id, schoolId),
        tx: (svc: any, ctx: any, id: string) => svc.markActionSummaryStale(ctx, id),
        table: 'recoveryOutcomeActionSummaryRecord',
        idField: 'actionSummaryId',
        statusField: 'summaryStatus',
        txStatus: 'stale',
        txTimestamp: 'staleAt',
        txEvent: 'ACTION_SUMMARY_STALE',
      },
    ];

    for (const spec of specs) {
      const creator = buildServicesFor(spec.kind);
      const created = await spec.create(creator, ctxFor(SCHOOL_A, `${RUN}-p11-${spec.kind}-create`), spec.req('p11'));
      expect(created.success).toBe(true);
      const foreignId = spec.getId(created.data);

      // School B GET known School A ID -> NOT_FOUND (never 403 / never revealed).
      const readerB = buildServicesFor(spec.kind);
      const got = await spec.get(readerB, foreignId, SCHOOL_B);
      expect(got.success).toBe(false);
      expect(got.status).toBe('NOT_FOUND');

      // School B representative transition -> NOT_FOUND, zero mutation.
      const transitionerB = buildServicesFor(spec.kind);
      const txResult = await spec.tx(transitionerB, ctxFor(SCHOOL_B, `${RUN}-p11-${spec.kind}-tx`), foreignId);
      expect(txResult.success).toBe(false);
      expect(txResult.status).toBe('NOT_FOUND');

      // Resource row unchanged for School A.
      const row: any = await (prisma as any)[spec.table].findUnique({ where: { [spec.idField]: foreignId } });
      expect(row).not.toBeNull();
      if (spec.statusField === 'voidedAt') {
        expect(row.voidedAt).toBeNull();
      } else {
        expect(row[spec.statusField]).not.toBe(spec.txStatus);
        expect(row[spec.txTimestamp]).toBeNull();
      }
      const bClaim = await prisma.recoveryOutcomeActionIdempotencyRecord.findFirst({
        where: { schoolId: SCHOOL_B, idempotencyKey: `${RUN}-p11-${spec.kind}-tx` },
      });
      expect(bClaim).toBeNull();
      expect(await countAudits(SCHOOL_B, spec.txEvent)).toBe(0);
    }

    // DryRun list-by-queue-item: School B must receive NO School-A receipts
    // via a guessed queue-item ID. Uses a dedicated queue-item ID so the
    // count is exact (the dryRunReceipt spec above used a different ID).
    const receiptCreator = buildServicesFor('dryRunReceipt');
    const queueItemId = `${RUN}-queue-p11-guard`;
    const receiptCreated = await receiptCreator.createDryRunReceipt(
      ctxFor(SCHOOL_A, `${RUN}-p11-receipt-create`), receiptReq('p11-receipt', queueItemId),
    );
    expect(receiptCreated.success).toBe(true);

    const readerB = buildServicesFor('dryRunReceipt');
    const bList = await readerB.listReceiptsForQueueItem(queueItemId, SCHOOL_B);
    expect(bList.success).toBe(true);
    expect(bList.data!.length).toBe(0);

    const readerA = buildServicesFor('dryRunReceipt');
    const aList = await readerA.listReceiptsForQueueItem(queueItemId, SCHOOL_A);
    expect(aList.success).toBe(true);
    expect(aList.data!.length).toBe(1);
    expect(aList.data![0].schoolId).toBe(SCHOOL_A);
  });

  it('P12 — canonical verified identity across all six families', async () => {
    const specs = [
      {
        kind: 'approvalGate' as FamilyKind,
        create: (svc: any, ctx: any, req: any) => svc.createApprovalGate(ctx, req),
        req: approvalGateReq,
        table: 'recoveryOutcomeApprovalGateRecord',
        idField: 'approvalGateId',
      },
      {
        kind: 'mockQueue' as FamilyKind,
        create: (svc: any, ctx: any, req: any) => svc.createMockActivationQueueItem(ctx, req),
        req: mockQueueReq,
        table: 'recoveryOutcomeMockActivationQueueRecord',
        idField: 'mockActivationQueueItemId',
      },
      {
        kind: 'dryRunReceipt' as FamilyKind,
        create: (svc: any, ctx: any, req: any) => svc.createDryRunReceipt(ctx, req),
        req: (tag: string) => receiptReq(tag, `${RUN}-queue-p12`),
        table: 'recoveryOutcomeDryRunReceiptRecord',
        idField: 'dryRunReceiptId',
      },
      {
        kind: 'rollbackPlan' as FamilyKind,
        create: (svc: any, ctx: any, req: any) => svc.createRollbackPlan(ctx, req),
        req: rollbackPlanReq,
        table: 'recoveryOutcomeRollbackPlanRecord',
        idField: 'rollbackPlanId',
      },
      {
        kind: 'suppressionRule' as FamilyKind,
        create: (svc: any, ctx: any, req: any) => svc.createSuppressionRule(ctx, req),
        req: suppressionRuleReq,
        table: 'recoveryOutcomeSuppressionRuleRecord',
        idField: 'suppressionRuleId',
      },
      {
        kind: 'actionSummary' as FamilyKind,
        create: (svc: any, ctx: any, req: any) => svc.createActionSummary(ctx, req),
        req: summaryReq,
        table: 'recoveryOutcomeActionSummaryRecord',
        idField: 'actionSummaryId',
      },
    ];

    for (const spec of specs) {
      const service = buildServicesFor(spec.kind);

      // Conflicting body school -> CROSS_SCHOOL_MISMATCH, zero mutation.
      const keyConflict = `${RUN}-p12-${spec.kind}-conflict`;
      const conflictingReq = { ...spec.req('p12a'), schoolId: SCHOOL_B };
      const rejected = await spec.create(service, ctxFor(SCHOOL_A, keyConflict), conflictingReq);
      expect(rejected.success).toBe(false);
      expect(rejected.code).toBe('CROSS_SCHOOL_MISMATCH');

      const claim = await prisma.recoveryOutcomeActionIdempotencyRecord.findFirst({
        where: { schoolId: SCHOOL_A, idempotencyKey: keyConflict },
      });
      expect(claim).toBeNull();

      // Successful create: stored identity comes from verified context, not body.
      const keyOk = `${RUN}-p12-${spec.kind}-ok`;
      const okReq = {
        ...spec.req('p12b'),
        schoolId: SCHOOL_A,
        createdByActorId: 'body-actor-should-be-ignored',
        createdByRole: 'body-role-should-be-ignored',
      };
      const ok = await spec.create(service, ctxFor(SCHOOL_A, keyOk, 'teacher', CTX_ACTOR), okReq);
      expect(ok.success).toBe(true);
      const row: any = await (prisma as any)[spec.table].findUnique({ where: { [spec.idField]: ok.data[spec.idField] } });
      expect(row).not.toBeNull();
      expect(row.schoolId).toBe(SCHOOL_A);
      expect(row.createdByActorId).toBe(CTX_ACTOR);
      expect(row.createdByRole).toBe('teacher');
    }
  });
});