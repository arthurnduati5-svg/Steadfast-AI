import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryTeacherReviewRepository,
  InMemorySimulationAuditRepository,
  InMemorySimulationIdempotencyRepository,
} from '../repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories';
import { RecoveryOutcomeExecutionTeacherReviewService } from '../services/recoveryOutcomeExecutionTeacherReviewService';
import { RecoveryOutcomeExecutionSimulationSafetyService } from '../services/recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from '../services/recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from '../services/recoveryOutcomeExecutionSimulationIdempotencyService';
import { RecoveryOutcomeExecutionSimulationCommandContext } from '../contracts/recoveryOutcomeExecutionSimulationContracts';

describe('Package 21 - Teacher Simulation Review Safety', () => {
  let service: RecoveryOutcomeExecutionTeacherReviewService;
  let ctx: RecoveryOutcomeExecutionSimulationCommandContext;
  const schoolId = 'school-1';
  const runId = 'run-1';

  beforeEach(() => {
    const repo = new InMemoryTeacherReviewRepository();
    const safety = new RecoveryOutcomeExecutionSimulationSafetyService();
    const auditRepo = new InMemorySimulationAuditRepository();
    const audit = new RecoveryOutcomeExecutionSimulationAuditBridge(auditRepo);
    const idempotencyRepo = new InMemorySimulationIdempotencyRepository();
    const idempotency = new RecoveryOutcomeExecutionSimulationIdempotencyService(idempotencyRepo);
    service = new RecoveryOutcomeExecutionTeacherReviewService(repo, safety, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates teacher simulation review in draft status', async () => {
    const result = await service.createTeacherSimulationReview(ctx, {
      teacherRef: 'teacher-1',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeTeacherReviewSummary: 'Teacher review test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.reviewStatus).toBe('draft');
    expect(result.data?.teacherRef).toBe('teacher-1');
  });

  it('blocks student role from creating', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createTeacherSimulationReview(studentCtx, {
      teacherRef: 'teacher-1',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeTeacherReviewSummary: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('lists by plan, simulationRunId, and teacher', async () => {
    await service.createTeacherSimulationReview(ctx, {
      teacherRef: 'teacher-1',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      simulationRunId: runId,
      safeTeacherReviewSummary: 'Test list',
    });
    const planList = await service.listTeacherSimulationReviewsForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const runList = await service.listTeacherSimulationReviewsForSimulationRun(runId);
    expect(runList.data?.length).toBeGreaterThanOrEqual(1);
    const teacherList = await service.listTeacherSimulationReviewsByTeacher(schoolId, 'teacher-1');
    expect(teacherList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('transitions to review_ready to approved_for_future_use', async () => {
    const created = await service.createTeacherSimulationReview(ctx, {
      teacherRef: 'teacher-1',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeTeacherReviewSummary: 'Test lifecycle',
    });
    const reviewReady = await service.markTeacherSimulationReviewReady(ctx, schoolId, created.data!.teacherSimulationReviewId);
    expect(reviewReady.data?.reviewStatus).toBe('review_ready');

    const approved = await service.approveTeacherSimulationReviewForFutureUse(ctx, schoolId, created.data!.teacherSimulationReviewId);
    expect(approved.data?.reviewStatus).toBe('approved_for_future_use');
  });

  it('can suppress, block, and void', async () => {
    const created = await service.createTeacherSimulationReview(ctx, {
      teacherRef: 'teacher-1',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeTeacherReviewSummary: 'Test transitions',
    });
    const id = created.data!.teacherSimulationReviewId;

    const suppressed = await service.suppressTeacherSimulationReview(ctx, schoolId, id);
    expect(suppressed.data?.reviewStatus).toBe('suppressed');
  });

  it('can block teacher review', async () => {
    const created = await service.createTeacherSimulationReview(ctx, {
      teacherRef: 'teacher-1',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeTeacherReviewSummary: 'Test block',
    });
    const blocked = await service.blockTeacherSimulationReview(ctx, schoolId, created.data!.teacherSimulationReviewId);
    expect(blocked.data?.reviewStatus).toBe('blocked');
  });

  it('can void teacher review', async () => {
    const created = await service.createTeacherSimulationReview(ctx, {
      teacherRef: 'teacher-1',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeTeacherReviewSummary: 'Test void',
    });
    const voided = await service.voidTeacherSimulationReview(ctx, schoolId, created.data!.teacherSimulationReviewId);
    expect(voided.data?.reviewStatus).toBe('voided');
  });

  it('review does NOT execute any action - safe metadata only', async () => {
    const result = await service.createTeacherSimulationReview(ctx, {
      teacherRef: 'teacher-2',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeTeacherReviewSummary: 'Safe review',
      teacherReviewNotesJson: { feedback: 'Looks good' },
    });
    expect(result.success).toBe(true);
    expect(result.data?.teacherReviewNotesJson).toBeDefined();
    expect(result.data?.reviewStatus).toBe('draft');
  });

  it('get returns the correct review', async () => {
    const created = await service.createTeacherSimulationReview(ctx, {
      teacherRef: 'teacher-1',
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeTeacherReviewSummary: 'Test get',
    });
    const found = await service.getTeacherSimulationReview(schoolId, created.data!.teacherSimulationReviewId);
    expect(found.success).toBe(true);
    expect(found.data?.safeTeacherReviewSummary).toBe('Test get');
  });
});
