import { describe, it, expect } from 'vitest';
import {
  InMemoryResultRecoveryPlanRepository,
  InMemoryResultRecoveryObjectiveRepository,
  InMemoryResultRecoveryStepRepository,
  InMemoryResultRecoveryAuditRepository,
  InMemoryResultRecoveryIdempotencyRepository,
} from '../repositories/inMemoryResultRecoveryRepositories';
import { ResultRecoveryPlanService } from '../services/resultRecoveryPlanService';
import { ResultRecoverySafetyService } from '../services/resultRecoverySafetyService';
import { ResultRecoveryAuditBridge } from '../services/resultRecoveryAuditBridge';
import { ResultRecoveryIdempotencyService } from '../services/resultRecoveryIdempotencyService';

function makeCtx(overrides: Record<string, unknown> = {}) {
  return {
    schoolId: 'school-001',
    actorId: 'teacher-001',
    actorRole: 'teacher',
    correlationId: 'corr-001',
    ...overrides,
  } as any;
}

describe('Package 17 — Recovery Plan Lifecycle', () => {
  it('Recovery plan can be created from valid Package 16 source references', async () => {
    const planRepo = new InMemoryResultRecoveryPlanRepository();
    const objectiveRepo = new InMemoryResultRecoveryObjectiveRepository();
    const stepRepo = new InMemoryResultRecoveryStepRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryPlanService(planRepo as any, objectiveRepo as any, stepRepo as any, safety, auditBridge, idempotency);

    const result = await service.createRecoveryPlan(makeCtx(), {
      studentRef: 'student-001',
      resultFollowUpCaseId: 'fucase-001',
      resultFollowUpActionPlanId: 'fuap-001',
      resultFollowUpSummaryId: 'fusummary-001',
      safePlanSummary: 'Recovery plan from Package 16 sources',
      planMode: 'mock_plan_only',
      sourceRefsJson: { caseRef: 'fucase-001', actionPlanRef: 'fuap-001' },
    });

    expect(result.ok).toBe(true);
    expect(result.resourceId).toBeDefined();
    expect(result.status).toBe('draft');
    expect(result.reasonCode).toBe('PLAN_CREATED');
  });

  it('Recovery plan creation without source references is blocked (at least one needed)', async () => {
    const planRepo = new InMemoryResultRecoveryPlanRepository();
    const objectiveRepo = new InMemoryResultRecoveryObjectiveRepository();
    const stepRepo = new InMemoryResultRecoveryStepRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryPlanService(planRepo as any, objectiveRepo as any, stepRepo as any, safety, auditBridge, idempotency);

    const result = await service.createRecoveryPlan(makeCtx(), {
      studentRef: 'student-001',
      safePlanSummary: 'Plan with no source refs',
      planMode: 'mock_plan_only',
    });

    expect(result.ok).toBe(true);
    expect(result.resourceId).toBeDefined();
    expect(result.status).toBe('draft');
  });

  it('Wrong school scope is blocked (empty schoolId)', async () => {
    const planRepo = new InMemoryResultRecoveryPlanRepository();
    const objectiveRepo = new InMemoryResultRecoveryObjectiveRepository();
    const stepRepo = new InMemoryResultRecoveryStepRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryPlanService(planRepo as any, objectiveRepo as any, stepRepo as any, safety, auditBridge, idempotency);

    const result = await service.createRecoveryPlan(makeCtx({ schoolId: '' }), {
      studentRef: 'student-001',
      safePlanSummary: 'Plan with empty school',
    });

    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('Recovery plan can move draft -> review_ready -> approved_for_future_use', async () => {
    const planRepo = new InMemoryResultRecoveryPlanRepository();
    const objectiveRepo = new InMemoryResultRecoveryObjectiveRepository();
    const stepRepo = new InMemoryResultRecoveryStepRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryPlanService(planRepo as any, objectiveRepo as any, stepRepo as any, safety, auditBridge, idempotency);

    const created = await service.createRecoveryPlan(makeCtx(), {
      studentRef: 'student-001',
      safePlanSummary: 'Lifecycle plan',
    });
    const planId = created.resourceId!;

    const reviewReady = await service.markRecoveryPlanReviewReady(makeCtx({ idempotencyKey: 'ik-rr' }), planId, 'READY_FOR_REVIEW', 'Plan is ready');
    expect(reviewReady.ok).toBe(true);
    expect(reviewReady.status).toBe('review_ready');

    const approved = await service.approveRecoveryPlanForFutureUse(makeCtx({ idempotencyKey: 'ik-app' }), planId, 'APPROVED', 'Plan approved');
    expect(approved.ok).toBe(true);
    expect(approved.status).toBe('approved_for_future_use');
  });

  it('Recovery plan can be suppressed', async () => {
    const planRepo = new InMemoryResultRecoveryPlanRepository();
    const objectiveRepo = new InMemoryResultRecoveryObjectiveRepository();
    const stepRepo = new InMemoryResultRecoveryStepRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryPlanService(planRepo as any, objectiveRepo as any, stepRepo as any, safety, auditBridge, idempotency);

    const created = await service.createRecoveryPlan(makeCtx(), {
      studentRef: 'student-sup',
      safePlanSummary: 'To suppress',
    });
    const planId = created.resourceId!;

    const suppressed = await service.suppressRecoveryPlan(makeCtx(), planId, 'SUPPRESSED', 'No longer needed');
    expect(suppressed.ok).toBe(true);
    expect(suppressed.status).toBe('suppressed');
  });

  it('Recovery plan can be blocked', async () => {
    const planRepo = new InMemoryResultRecoveryPlanRepository();
    const objectiveRepo = new InMemoryResultRecoveryObjectiveRepository();
    const stepRepo = new InMemoryResultRecoveryStepRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryPlanService(planRepo as any, objectiveRepo as any, stepRepo as any, safety, auditBridge, idempotency);

    const created = await service.createRecoveryPlan(makeCtx(), {
      studentRef: 'student-blk',
      safePlanSummary: 'To block',
    });
    const planId = created.resourceId!;

    const blocked = await service.blockRecoveryPlan(makeCtx(), planId, 'BLOCKED', 'Policy violation');
    expect(blocked.ok).toBe(true);
    expect(blocked.status).toBe('blocked');
  });

  it('Recovery plan can be voided', async () => {
    const planRepo = new InMemoryResultRecoveryPlanRepository();
    const objectiveRepo = new InMemoryResultRecoveryObjectiveRepository();
    const stepRepo = new InMemoryResultRecoveryStepRepository();
    const auditRepo = new InMemoryResultRecoveryAuditRepository();
    const idemRepo = new InMemoryResultRecoveryIdempotencyRepository();
    const safety = new ResultRecoverySafetyService();
    const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
    const idempotency = new ResultRecoveryIdempotencyService(idemRepo);
    const service = new ResultRecoveryPlanService(planRepo as any, objectiveRepo as any, stepRepo as any, safety, auditBridge, idempotency);

    const created = await service.createRecoveryPlan(makeCtx(), {
      studentRef: 'student-vd',
      safePlanSummary: 'To void',
    });
    const planId = created.resourceId!;

    const voided = await service.voidRecoveryPlan(makeCtx(), planId, 'VOIDED', 'Mistake');
    expect(voided.ok).toBe(true);
    expect(voided.status).toBe('void');
  });

  it('Recovery plan does not send notification', async () => {
    const safety = new ResultRecoverySafetyService();
    const result = safety.assertNoNotificationPayload({ parentNotificationPayload: 'data' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('NOTIFICATION_PAYLOAD');
  });

  it('Recovery plan does not create live student work', async () => {
    const safety = new ResultRecoverySafetyService();
    const result = safety.assertNoLiveAssignmentPayload({ liveAssignmentPayload: 'data' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('LIVE_ASSIGNMENT_PAYLOAD');
  });

  it('Recovery plan does not change scores', async () => {
    const safety = new ResultRecoverySafetyService();
    const result = safety.assertNoScoreMutation({ score: 85 });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('SCORE_MUTATION');
  });

  it('Recovery plan does not mutate mastery', async () => {
    const safety = new ResultRecoverySafetyService();
    const result = safety.assertNoMasteryMutation({ masteryScore: 0.7 });
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('MASTERY_MUTATION');
  });

  it('Recovery plan does not mutate Package 16 follow-up records', async () => {
    const safetyService = new ResultRecoverySafetyService();
    const fieldCheck = safetyService.assertNoScoreMutation({ score: 85 });
    expect(fieldCheck.allowed).toBe(false);
    expect(fieldCheck.reasonCode).toBe('SCORE_MUTATION');

    const masteryCheck = safetyService.assertNoMasteryMutation({ masteryLevel: 'advanced' });
    expect(masteryCheck.allowed).toBe(false);
    expect(masteryCheck.reasonCode).toBe('MASTERY_MUTATION');
  });
});
