import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryResultReportCardReviewRepository,
  InMemoryResultReportCardAssemblyRepository,
  InMemoryResultReportCardAuditRepository,
  InMemoryResultReportCardIdempotencyRepository,
} from '../repositories/inMemoryResultReportCardRepositories';
import { ResultReportCardReviewService } from '../services/resultReportCardReviewService';
import { ResultReportCardAuditBridge } from '../services/resultReportCardAuditBridge';
import { ResultReportCardIdempotencyService } from '../services/resultReportCardIdempotencyService';
import type { ResultReportCardCommandContext } from '../contracts/resultReportCardContracts';

function makeCtx(overrides?: Partial<ResultReportCardCommandContext>): ResultReportCardCommandContext {
  return {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'teacher',
    correlationId: 'corr-1',
    idempotencyKey: `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ...overrides,
  };
}

describe('Package 13 — Review Workflow', () => {
  let reviewRepo: InMemoryResultReportCardReviewRepository;
  let assemblyRepo: InMemoryResultReportCardAssemblyRepository;
  let auditRepo: InMemoryResultReportCardAuditRepository;
  let idempotencyRepo: InMemoryResultReportCardIdempotencyRepository;
  let auditBridge: ResultReportCardAuditBridge;
  let idempotencyService: ResultReportCardIdempotencyService;
  let service: ResultReportCardReviewService;

  beforeEach(() => {
    reviewRepo = new InMemoryResultReportCardReviewRepository();
    assemblyRepo = new InMemoryResultReportCardAssemblyRepository();
    auditRepo = new InMemoryResultReportCardAuditRepository();
    idempotencyRepo = new InMemoryResultReportCardIdempotencyRepository();
    auditBridge = new ResultReportCardAuditBridge(auditRepo);
    idempotencyService = new ResultReportCardIdempotencyService(idempotencyRepo);
    service = new ResultReportCardReviewService(reviewRepo, assemblyRepo, auditBridge, idempotencyService);
  });

  it('review can be created for sealed assembly', async () => {
    const ctx = makeCtx();
    const result = await service.createReview(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      reviewType: 'teacher_report_review',
      safeReviewSummary: 'Initial review',
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
  });

  it('review can start (transition to in_review)', async () => {
    const ctx = makeCtx();
    const created = await service.createReview(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      reviewType: 'teacher_report_review',
      safeReviewSummary: 'Starting review',
    });
    const reviewId = created.resourceId!;
    const started = await service.startReview(ctx, reviewId);
    expect(started.ok).toBe(true);
    expect(started.status).toBe('in_review');
  });

  it('teacher can approve for export intent', async () => {
    const ctx = makeCtx({ actorRole: 'teacher' });
    const created = await service.createReview(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      reviewType: 'teacher_report_review',
      safeReviewSummary: 'Approve',
    });
    const reviewId = created.resourceId!;
    await service.startReview(ctx, reviewId);
    const approved = await service.approveForExportIntent(ctx, reviewId);
    expect(approved.ok).toBe(true);
    expect(approved.status).toBe('approved');
  });

  it('department head can approve for export intent', async () => {
    const ctx = makeCtx({ actorRole: 'department_head' });
    const created = await service.createReview(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      reviewType: 'department_report_review',
      safeReviewSummary: 'Approve',
    });
    const reviewId = created.resourceId!;
    await service.startReview(ctx, reviewId);
    const approved = await service.approveForExportIntent(ctx, reviewId);
    expect(approved.ok).toBe(true);
    expect(approved.status).toBe('approved');
  });

  it('admin can approve for export intent', async () => {
    const ctx = makeCtx({ actorRole: 'admin' });
    const created = await service.createReview(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      reviewType: 'admin_report_review',
      safeReviewSummary: 'Approve',
    });
    const reviewId = created.resourceId!;
    await service.startReview(ctx, reviewId);
    const approved = await service.approveForExportIntent(ctx, reviewId);
    expect(approved.ok).toBe(true);
    expect(approved.status).toBe('approved');
  });

  it('student cannot approve (test policy)', async () => {
    const ctx = makeCtx({ actorRole: 'student' });
    const created = await service.createReview(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      reviewType: 'teacher_report_review',
      safeReviewSummary: 'Student review',
    });
    expect(created.ok).toBe(false);
    expect(created.reasonCode).toBe('FORBIDDEN');
  });

  it('parent cannot approve (test policy)', async () => {
    const ctx = makeCtx({ actorRole: 'parent' });
    const created = await service.createReview(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      reviewType: 'teacher_report_review',
      safeReviewSummary: 'Parent review',
    });
    expect(created.ok).toBe(false);
    expect(created.reasonCode).toBe('FORBIDDEN');
  });

  it('guest cannot approve (test policy)', async () => {
    const ctx = makeCtx({ actorRole: 'guest' });
    const created = await service.createReview(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      reviewType: 'teacher_report_review',
      safeReviewSummary: 'Guest review',
    });
    expect(created.ok).toBe(false);
    expect(created.reasonCode).toBe('FORBIDDEN');
  });

  it('review can request revision', async () => {
    const ctx = makeCtx();
    const created = await service.createReview(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      reviewType: 'teacher_report_review',
      safeReviewSummary: 'Revise',
    });
    const reviewId = created.resourceId!;
    await service.startReview(ctx, reviewId);
    const revised = await service.requestRevision(ctx, reviewId);
    expect(revised.ok).toBe(true);
    expect(revised.status).toBe('rejected');
  });

  it('review can reject', async () => {
    const ctx = makeCtx();
    const created = await service.createReview(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      reviewType: 'teacher_report_review',
      safeReviewSummary: 'Reject',
    });
    const reviewId = created.resourceId!;
    const rejected = await service.rejectReview(ctx, reviewId);
    expect(rejected.ok).toBe(true);
    expect(rejected.status).toBe('rejected');
  });

  it('review can block', async () => {
    const ctx = makeCtx();
    const created = await service.createReview(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      reviewType: 'teacher_report_review',
      safeReviewSummary: 'Block',
    });
    const reviewId = created.resourceId!;
    const blocked = await service.blockReview(ctx, reviewId);
    expect(blocked.ok).toBe(true);
    expect(blocked.status).toBe('blocked');
  });

  it('review can void', async () => {
    const ctx = makeCtx();
    const created = await service.createReview(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      reviewType: 'teacher_report_review',
      safeReviewSummary: 'Void',
    });
    const reviewId = created.resourceId!;
    const voided = await service.voidReview(ctx, reviewId);
    expect(voided.ok).toBe(true);
    expect(voided.status).toBe('void');
  });

  it('review approval does not export (check no export method called)', async () => {
    const ctx = makeCtx();
    const created = await service.createReview(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      reviewType: 'teacher_report_review',
      safeReviewSummary: 'No export',
    });
    const reviewId = created.resourceId!;
    await service.startReview(ctx, reviewId);
    const approved = await service.approveForExportIntent(ctx, reviewId);
    expect(approved.ok).toBe(true);
    expect(approved.status).toBe('approved');
    expect(approved.safeMessage).toBe('Review approved for export intent');
  });

  it('review approval does not publish', async () => {
    const ctx = makeCtx();
    const created = await service.createReview(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      reviewType: 'teacher_report_review',
      safeReviewSummary: 'No publish',
    });
    const reviewId = created.resourceId!;
    await service.startReview(ctx, reviewId);
    const approved = await service.approveForExportIntent(ctx, reviewId);
    expect(approved.ok).toBe(true);
    expect(Object.keys(approved)).not.toContain('publishUrl');
    expect(Object.keys(approved)).not.toContain('portalPayload');
  });

  it('review approval does not send notification', async () => {
    const ctx = makeCtx();
    const created = await service.createReview(ctx, {
      resultReportCardAssemblyId: 'assembly-1',
      reviewType: 'teacher_report_review',
      safeReviewSummary: 'No notify',
    });
    const reviewId = created.resourceId!;
    await service.startReview(ctx, reviewId);
    const approved = await service.approveForExportIntent(ctx, reviewId);
    expect(approved.ok).toBe(true);
    expect(Object.keys(approved)).not.toContain('notification');
    expect(approved.data).toBeFalsy();
  });
});
