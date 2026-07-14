import type {
  ResultReportCardSafeEnvelope,
  ResultReportCardCommandContext,
} from '../contracts';
import type { ResultReportCardReview, CreateReviewInput } from '../contracts/resultReportCardReviewContracts';
import type { ResultReportCardReviewRepository, ResultReportCardAssemblyRepository } from '../contracts/resultReportCardRepositoryContracts';
import type { ResultReportCardAuditBridge } from './resultReportCardAuditBridge';
import type { ResultReportCardIdempotencyService } from './resultReportCardIdempotencyService';
import { evaluateReportCardReviewPolicy } from '../policies/resultReportCardPolicyDefinitions';

const ALLOWED_REVIEW_DECISION_ROLES: string[] = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];

export class ResultReportCardReviewService {
  constructor(
    private reviewRepo: ResultReportCardReviewRepository,
    private assemblyRepo: ResultReportCardAssemblyRepository,
    private auditBridge: ResultReportCardAuditBridge,
    private idempotencyService: ResultReportCardIdempotencyService,
  ) {}

  private envelope(ctx: ResultReportCardCommandContext, overrides: Partial<ResultReportCardSafeEnvelope>): ResultReportCardSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createReview(
    ctx: ResultReportCardCommandContext,
    input: Omit<CreateReviewInput, 'reviewedByActorId' | 'reviewedByRole' | 'schoolId'>,
  ): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policyCheck = evaluateReportCardReviewPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });

    if (!ALLOWED_REVIEW_DECISION_ROLES.includes(ctx.actorRole)) {
      return this.envelope(ctx, { ok: false, safeMessage: 'Only teacher/admin roles can create reviews', reasonCode: 'FORBIDDEN', status: 'blocked' });
    }

    const existingOp = await this.idempotencyService.detectConflict(ctx, 'createReview');
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx, 'createReview');
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency start failed', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    const createInput: CreateReviewInput & { reviewedByActorId: string; reviewedByRole: string; schoolId: string } = {
      ...input,
      schoolId: ctx.schoolId,
      reviewedByActorId: ctx.actorId,
      reviewedByRole: ctx.actorRole,
    };

    try {
      const review = await this.reviewRepo.create(createInput);
      await this.auditBridge.recordReviewCreated(ctx, review);
      await this.idempotencyService.completeOperation(startIdem, review.resultReportCardReviewId, 'Review created');
      return this.envelope(ctx, { resourceId: review.resultReportCardReviewId, status: review.reviewStatus, safeMessage: 'Review created', data: review });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: 'Failed to create review', reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async getReview(ctx: ResultReportCardCommandContext, reviewId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const review = await this.reviewRepo.getById(reviewId);
    if (!review) return this.envelope(ctx, { ok: false, safeMessage: 'Review not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: reviewId, status: review.reviewStatus, safeMessage: 'Review found', data: review });
  }

  async listReviewsForAssembly(ctx: ResultReportCardCommandContext, assemblyId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const reviews = await this.reviewRepo.listByAssemblyId(assemblyId);
    return this.envelope(ctx, { safeMessage: `Found ${reviews.length} reviews for assembly`, data: reviews });
  }

  async startReview(ctx: ResultReportCardCommandContext, reviewId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const review = await this.reviewRepo.getById(reviewId);
    if (!review) return this.envelope(ctx, { ok: false, safeMessage: 'Review not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (review.reviewStatus !== 'draft') return this.envelope(ctx, { ok: false, safeMessage: 'Review must be in draft status to start', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.reviewRepo.updateStatus(reviewId, 'in_review');
    await this.auditBridge.recordReviewDecision(ctx, review, 'in_review');
    return this.envelope(ctx, { resourceId: reviewId, status: 'in_review', safeMessage: 'Review started' });
  }

  async approveForExportIntent(ctx: ResultReportCardCommandContext, reviewId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const review = await this.reviewRepo.getById(reviewId);
    if (!review) return this.envelope(ctx, { ok: false, safeMessage: 'Review not found', reasonCode: 'NOT_FOUND', status: 'not_found' });

    if (!ALLOWED_REVIEW_DECISION_ROLES.includes(ctx.actorRole)) {
      return this.envelope(ctx, { ok: false, safeMessage: 'Actor role not allowed to approve for export intent', reasonCode: 'FORBIDDEN', status: 'blocked' });
    }

    if (review.reviewStatus !== 'in_review') return this.envelope(ctx, { ok: false, safeMessage: 'Review must be in_review to approve', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.reviewRepo.updateStatus(reviewId, 'approved');
    await this.auditBridge.recordReviewDecision(ctx, { ...review, reviewStatus: 'approved' }, 'approve_for_export_intent');
    return this.envelope(ctx, { resourceId: reviewId, status: 'approved', safeMessage: 'Review approved for export intent' });
  }

  async requestRevision(ctx: ResultReportCardCommandContext, reviewId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const review = await this.reviewRepo.getById(reviewId);
    if (!review) return this.envelope(ctx, { ok: false, safeMessage: 'Review not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (review.reviewStatus !== 'in_review') return this.envelope(ctx, { ok: false, safeMessage: 'Review must be in_review to request revision', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.reviewRepo.updateStatus(reviewId, 'rejected');
    await this.auditBridge.recordReviewDecision(ctx, { ...review, reviewStatus: 'rejected' }, 'request_revision');
    return this.envelope(ctx, { resourceId: reviewId, status: 'rejected', safeMessage: 'Revision requested' });
  }

  async rejectReview(ctx: ResultReportCardCommandContext, reviewId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const review = await this.reviewRepo.getById(reviewId);
    if (!review) return this.envelope(ctx, { ok: false, safeMessage: 'Review not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (review.reviewStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot reject voided review', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.reviewRepo.updateStatus(reviewId, 'rejected');
    await this.auditBridge.recordReviewDecision(ctx, { ...review, reviewStatus: 'rejected' }, 'reject');
    return this.envelope(ctx, { resourceId: reviewId, status: 'rejected', safeMessage: 'Review rejected' });
  }

  async blockReview(ctx: ResultReportCardCommandContext, reviewId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const review = await this.reviewRepo.getById(reviewId);
    if (!review) return this.envelope(ctx, { ok: false, safeMessage: 'Review not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (review.reviewStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided review', reasonCode: 'INVALID_STATUS', status: 'error' });
    await this.reviewRepo.updateStatus(reviewId, 'blocked');
    return this.envelope(ctx, { resourceId: reviewId, status: 'blocked', safeMessage: 'Review blocked' });
  }

  async voidReview(ctx: ResultReportCardCommandContext, reviewId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const review = await this.reviewRepo.getById(reviewId);
    if (!review) return this.envelope(ctx, { ok: false, safeMessage: 'Review not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (review.reviewStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    await this.reviewRepo.updateStatus(reviewId, 'void');
    return this.envelope(ctx, { resourceId: reviewId, status: 'void', safeMessage: 'Review voided' });
  }
}
