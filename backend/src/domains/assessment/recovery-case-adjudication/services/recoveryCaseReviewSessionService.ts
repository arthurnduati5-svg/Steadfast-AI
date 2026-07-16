import type { RecoveryCaseAdjudicationCommandContext, RecoveryCaseAdjudicationSafeEnvelope } from '../contracts/recoveryCaseAdjudicationContracts';
import type { RecoveryCaseReviewSession, CreateReviewSessionInput } from '../contracts/recoveryCaseReviewSessionContracts';
import type { RecoveryCaseReviewSessionRepository, RecoveryCaseAdjudicationAuditRepository } from '../contracts/recoveryCaseAdjudicationRepositoryContracts';
import { isRoleAllowedForMutation } from '../policies/recoveryCaseAdjudicationPolicyDefinitions';

export class RecoveryCaseReviewSessionService {
  constructor(
    private reviewSessionRepo: RecoveryCaseReviewSessionRepository,
    private auditRepo: RecoveryCaseAdjudicationAuditRepository,
  ) {}

  async createReviewSession(
    ctx: RecoveryCaseAdjudicationCommandContext,
    input: CreateReviewSessionInput,
  ): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewSession>> {
    if (!isRoleAllowedForMutation(ctx.actorRole)) {
      return { success: false, status: 'error', message: 'Role not allowed for mutation', errorCode: 'FORBIDDEN_ROLE', correlationId: ctx.correlationId };
    }

    const session = await this.reviewSessionRepo.create({
      ...input,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    });

    await this.auditRepo.create({
      schoolId: ctx.schoolId,
      entityType: 'review_session',
      entityId: session.reviewSessionId,
      action: 'create_review_session',
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      correlationId: ctx.correlationId,
      safeMetadata: { sourceRefs: ctx.sourceRefsJson },
    });

    return { success: true, status: 'ok', data: session, correlationId: ctx.correlationId };
  }

  async getReviewSession(sessionId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewSession>> {
    const session = await this.reviewSessionRepo.getById(sessionId);
    if (!session) {
      return { success: false, status: 'not_found', message: 'Review session not found', errorCode: 'NOT_FOUND' };
    }
    return { success: true, status: 'ok', data: session };
  }

  async listReviewSessionsForSchool(schoolId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewSession[]>> {
    const items = await this.reviewSessionRepo.listBySchool(schoolId);
    return { success: true, status: 'ok', data: items };
  }

  async listReviewSessionsForQueueItem(schoolId: string, queueItemId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewSession[]>> {
    const items = await this.reviewSessionRepo.listByQueueItemId(schoolId, queueItemId);
    return { success: true, status: 'ok', data: items };
  }

  async listReviewSessionsByReviewer(schoolId: string, reviewerActorId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewSession[]>> {
    const items = await this.reviewSessionRepo.listByReviewer(schoolId, reviewerActorId);
    return { success: true, status: 'ok', data: items };
  }

  async listReviewSessionsByStatus(schoolId: string, status: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewSession[]>> {
    const items = await this.reviewSessionRepo.listByStatus(schoolId, status);
    return { success: true, status: 'ok', data: items };
  }

  async startReviewSession(sessionId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewSession>> {
    const session = await this.reviewSessionRepo.updateStatus(sessionId, 'in_progress');
    await this.auditRepo.create({
      schoolId: session.schoolId,
      entityType: 'review_session',
      entityId: sessionId,
      action: 'start_review_session',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: session.sessionStatus },
    });
    return { success: true, status: 'ok', data: session };
  }

  async markReviewSessionReviewReady(sessionId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewSession>> {
    const session = await this.reviewSessionRepo.updateStatus(sessionId, 'review_ready');
    await this.auditRepo.create({
      schoolId: session.schoolId,
      entityType: 'review_session',
      entityId: sessionId,
      action: 'mark_review_session_review_ready',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: session.sessionStatus },
    });
    return { success: true, status: 'ok', data: session };
  }

  async markReviewSessionNeedsSecondReview(sessionId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewSession>> {
    const session = await this.reviewSessionRepo.updateStatus(sessionId, 'needs_second_review');
    await this.auditRepo.create({
      schoolId: session.schoolId,
      entityType: 'review_session',
      entityId: sessionId,
      action: 'mark_review_session_needs_second_review',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: session.sessionStatus },
    });
    return { success: true, status: 'ok', data: session };
  }

  async markReviewSessionNeedsMoreEvidence(sessionId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewSession>> {
    const session = await this.reviewSessionRepo.updateStatus(sessionId, 'needs_more_evidence');
    await this.auditRepo.create({
      schoolId: session.schoolId,
      entityType: 'review_session',
      entityId: sessionId,
      action: 'mark_review_session_needs_more_evidence',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: session.sessionStatus },
    });
    return { success: true, status: 'ok', data: session };
  }

  async blockReviewSession(sessionId: string, reasonCodes: string[]): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewSession>> {
    const session = await this.reviewSessionRepo.updateStatus(sessionId, 'blocked', reasonCodes);
    await this.auditRepo.create({
      schoolId: session.schoolId,
      entityType: 'review_session',
      entityId: sessionId,
      action: 'block_review_session',
      actorId: '',
      actorRole: '',
      safeMetadata: { reasonCodes, previousStatus: session.sessionStatus },
    });
    return { success: true, status: 'ok', data: session };
  }

  async voidReviewSession(sessionId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewSession>> {
    const session = await this.reviewSessionRepo.void(sessionId);
    await this.auditRepo.create({
      schoolId: session.schoolId,
      entityType: 'review_session',
      entityId: sessionId,
      action: 'void_review_session',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: session.sessionStatus },
    });
    return { success: true, status: 'ok', data: session };
  }
}
