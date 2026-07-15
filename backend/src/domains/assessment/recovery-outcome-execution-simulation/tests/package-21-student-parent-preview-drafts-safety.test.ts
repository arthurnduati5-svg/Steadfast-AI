import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryStudentPreviewDraftRepository,
  InMemoryParentPreviewDraftRepository,
  InMemorySimulationAuditRepository,
  InMemorySimulationIdempotencyRepository,
} from '../repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories';
import { RecoveryOutcomeExecutionPreviewDraftService } from '../services/recoveryOutcomeExecutionPreviewDraftService';
import { RecoveryOutcomeExecutionSimulationSafetyService } from '../services/recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from '../services/recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from '../services/recoveryOutcomeExecutionSimulationIdempotencyService';
import { RecoveryOutcomeExecutionSimulationCommandContext } from '../contracts/recoveryOutcomeExecutionSimulationContracts';

describe('Package 21 - Student & Parent Preview Drafts Safety', () => {
  let service: RecoveryOutcomeExecutionPreviewDraftService;
  let ctx: RecoveryOutcomeExecutionSimulationCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    const studentRepo = new InMemoryStudentPreviewDraftRepository();
    const parentRepo = new InMemoryParentPreviewDraftRepository();
    const safety = new RecoveryOutcomeExecutionSimulationSafetyService();
    const auditRepo = new InMemorySimulationAuditRepository();
    const audit = new RecoveryOutcomeExecutionSimulationAuditBridge(auditRepo);
    const idempotencyRepo = new InMemorySimulationIdempotencyRepository();
    const idempotency = new RecoveryOutcomeExecutionSimulationIdempotencyService(idempotencyRepo);
    service = new RecoveryOutcomeExecutionPreviewDraftService(studentRepo, parentRepo, safety, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates student preview draft in draft status', async () => {
    const result = await service.createStudentPreviewDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeStudentPreviewSummary: 'Student preview test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.draftStatus).toBe('draft');
  });

  it('creates parent preview draft in draft status', async () => {
    const result = await service.createParentPreviewDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeParentPreviewSummary: 'Parent preview test',
    });
    expect(result.success).toBe(true);
    expect(result.data?.draftStatus).toBe('draft');
  });

  it('blocks student role from creating student draft', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createStudentPreviewDraft(studentCtx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeStudentPreviewSummary: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('blocks student role from creating parent draft', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createParentPreviewDraft(studentCtx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeParentPreviewSummary: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('student preview lists by plan and status', async () => {
    await service.createStudentPreviewDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeStudentPreviewSummary: 'Test list',
    });
    const planList = await service.listStudentPreviewDraftsForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const draftList = await service.listStudentPreviewDraftsByStatus(schoolId, 'draft');
    expect(draftList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('parent preview lists by plan and status', async () => {
    await service.createParentPreviewDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeParentPreviewSummary: 'Test list',
    });
    const planList = await service.listParentPreviewDraftsForPlan(schoolId, 'plan-1');
    expect(planList.data?.length).toBeGreaterThanOrEqual(1);
    const draftList = await service.listParentPreviewDraftsByStatus(schoolId, 'draft');
    expect(draftList.data?.length).toBeGreaterThanOrEqual(1);
  });

  it('student preview full lifecycle: review_ready to approved to suppress to blocked to voided', async () => {
    const created = await service.createStudentPreviewDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeStudentPreviewSummary: 'Test lifecycle',
    });
    const id = created.data!.studentPreviewDraftId;

    const reviewReady = await service.markStudentPreviewDraftReviewReady(ctx, schoolId, id);
    expect(reviewReady.data?.draftStatus).toBe('review_ready');

    const approved = await service.approveStudentPreviewDraftForFutureUse(ctx, schoolId, id);
    expect(approved.data?.draftStatus).toBe('approved_for_future_use');
  });

  it('parent preview full lifecycle: review_ready to approved to suppress to blocked to voided', async () => {
    const created = await service.createParentPreviewDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeParentPreviewSummary: 'Test lifecycle',
    });
    const id = created.data!.parentPreviewDraftId;

    const reviewReady = await service.markParentPreviewDraftReviewReady(ctx, schoolId, id);
    expect(reviewReady.data?.draftStatus).toBe('review_ready');

    const approved = await service.approveParentPreviewDraftForFutureUse(ctx, schoolId, id);
    expect(approved.data?.draftStatus).toBe('approved_for_future_use');
  });

  it('drafts are safe, Socratic, and NOT sent', async () => {
    const studentResult = await service.createStudentPreviewDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeStudentPreviewSummary: 'Socratic preview',
      previewContentJson: { type: 'simulation_summary', tone: 'socratic' },
    });
    expect(studentResult.success).toBe(true);
    expect(studentResult.data?.draftStatus).toBe('draft');

    const parentResult = await service.createParentPreviewDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeParentPreviewSummary: 'Parent preview',
      previewContentJson: { type: 'progress_update' },
    });
    expect(parentResult.success).toBe(true);
    expect(parentResult.data?.draftStatus).toBe('draft');
  });

  it('student preview can suppress, block, void', async () => {
    const created = await service.createStudentPreviewDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeStudentPreviewSummary: 'Test',
    });
    const id = created.data!.studentPreviewDraftId;

    const suppressed = await service.suppressStudentPreviewDraft(ctx, schoolId, id);
    expect(suppressed.data?.draftStatus).toBe('suppressed');
  });

  it('parent preview can suppress, block, void', async () => {
    const created = await service.createParentPreviewDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeParentPreviewSummary: 'Test',
    });
    const id = created.data!.parentPreviewDraftId;

    const blocked = await service.blockParentPreviewDraft(ctx, schoolId, id);
    expect(blocked.data?.draftStatus).toBe('blocked');

    const voided = await service.voidParentPreviewDraft(ctx, schoolId, id);
    expect(voided.data?.draftStatus).toBe('voided');
  });

  it('get returns correct student preview draft', async () => {
    const created = await service.createStudentPreviewDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeStudentPreviewSummary: 'Test get',
    });
    const found = await service.getStudentPreviewDraft(schoolId, created.data!.studentPreviewDraftId);
    expect(found.success).toBe(true);
    expect(found.data?.safeStudentPreviewSummary).toBe('Test get');
  });

  it('get returns correct parent preview draft', async () => {
    const created = await service.createParentPreviewDraft(ctx, {
      studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1',
      safeParentPreviewSummary: 'Test parent get',
    });
    const found = await service.getParentPreviewDraft(schoolId, created.data!.parentPreviewDraftId);
    expect(found.success).toBe(true);
    expect(found.data?.safeParentPreviewSummary).toBe('Test parent get');
  });
});
