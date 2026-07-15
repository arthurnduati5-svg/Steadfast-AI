import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryRecoveryOutcomeActionReadinessRepository,
  InMemoryRecoveryOutcomeActionAuditRepository,
  InMemoryRecoveryOutcomeActionIdempotencyRepository,
} from '../repositories/inMemoryRecoveryOutcomeActionRepositories';
import { RecoveryOutcomeActionReadinessService } from '../services/recoveryOutcomeActionReadinessService';
import { RecoveryOutcomeActionSafetyService } from '../services/recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from '../services/recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from '../services/recoveryOutcomeActionIdempotencyService';
import { RecoveryOutcomeActionCommandContext } from '../contracts/recoveryOutcomeActionContracts';

describe('Package 20 - Action Readiness Lifecycle', () => {
  let service: RecoveryOutcomeActionReadinessService;
  let ctx: RecoveryOutcomeActionCommandContext;

  beforeEach(() => {
    const repo = new InMemoryRecoveryOutcomeActionReadinessRepository();
    const safety = new RecoveryOutcomeActionSafetyService();
    const auditRepo = new InMemoryRecoveryOutcomeActionAuditRepository();
    const audit = new RecoveryOutcomeActionAuditBridge(auditRepo);
    const idempotencyRepo = new InMemoryRecoveryOutcomeActionIdempotencyRepository();
    const idempotency = new RecoveryOutcomeActionIdempotencyService(idempotencyRepo);
    service = new RecoveryOutcomeActionReadinessService(repo, safety, audit, idempotency);
    ctx = { schoolId: 'school-1', actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates action readiness in draft status', async () => {
    const result = await service.createActionReadiness(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeDecisionReadinessId: 'decision-readiness-1',
      safeReadinessSummary: 'Ready for action preparation', readinessChecksJson: {},
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    expect(result.success).toBe(true);
    expect(result.data?.readinessStatus).toBe('draft');
  });

  it('blocks creation when missing Package 19 reference', async () => {
    const result = await service.createActionReadiness(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeDecisionReadinessId: '',
      safeReadinessSummary: 'Missing ref', readinessChecksJson: {},
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    expect(result.success).toBe(false);
  });

  it('blocks student role from creating', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createActionReadiness(studentCtx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeDecisionReadinessId: 'dr-1',
      safeReadinessSummary: 'Test', readinessChecksJson: {},
      createdByActorId: 'actor-1', createdByRole: 'student',
    });
    expect(result.success).toBe(false);
  });

  it('blocks when schoolId is missing', async () => {
    const noSchoolCtx = { ...ctx, schoolId: '' };
    const result = await service.createActionReadiness(noSchoolCtx, {
      schoolId: '', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeDecisionReadinessId: 'dr-1',
      safeReadinessSummary: 'Test', readinessChecksJson: {},
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    expect(result.success).toBe(false);
  });

  it('transitions from draft to review_ready to approved_for_future_use', async () => {
    const created = await service.createActionReadiness(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeDecisionReadinessId: 'dr-1',
      safeReadinessSummary: 'Test', readinessChecksJson: {},
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    expect(created.data?.readinessStatus).toBe('draft');

    const reviewReady = await service.markActionReadinessReviewReady(ctx, created.data!.actionReadinessId);
    expect(reviewReady.success).toBe(true);
    expect(reviewReady.data?.readinessStatus).toBe('review_ready');

    const approved = await service.approveActionReadinessForFutureUse(ctx, created.data!.actionReadinessId);
    expect(approved.success).toBe(true);
    expect(approved.data?.readinessStatus).toBe('approved_for_future_use');
  });

  it('can suppress and block readiness', async () => {
    const created = await service.createActionReadiness(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeDecisionReadinessId: 'dr-1',
      safeReadinessSummary: 'Test', readinessChecksJson: {},
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    const suppressed = await service.suppressActionReadiness(ctx, created.data!.actionReadinessId);
    expect(suppressed.data?.readinessStatus).toBe('suppressed');
  });

  it('can void readiness', async () => {
    const created = await service.createActionReadiness(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeDecisionReadinessId: 'dr-1',
      safeReadinessSummary: 'Test', readinessChecksJson: {},
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    const voided = await service.voidActionReadiness(ctx, created.data!.actionReadinessId);
    expect(voided.data?.readinessStatus).toBe('voided');
  });

  it('can list by school, student, plan, and status', async () => {
    await service.createActionReadiness(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeDecisionReadinessId: 'dr-1',
      safeReadinessSummary: 'Test', readinessChecksJson: {},
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    const schoolList = await service.listActionReadinessForSchool('school-1');
    expect(schoolList.data?.length).toBeGreaterThanOrEqual(1);
    const studentList = await service.listActionReadinessForStudent('school-1', 'student-1');
    expect(studentList.data?.length).toBeGreaterThanOrEqual(1);
    const planList = await service.listActionReadinessForPlan('school-1', 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const draftList = await service.listActionReadinessByStatus('school-1', 'draft');
    expect(draftList.data?.length).toBeGreaterThanOrEqual(1);
  });
});
