import type { PrismaClient, Prisma } from '@prisma/client';
import type {
  ResultFinalizationReview,
  ResultFinalizationDecision,
  ResultReleaseReadiness,
  ResultRegradeRequest,
  ResultRegradeIntake,
  ResultGovernanceAuditEvent,
  ResultGovernanceIdempotencyEntry,
  ResultReleaseBoundary,
} from '../contracts/index';

import type {
  ResultFinalizationReviewRepository,
  ResultFinalizationDecisionRepository,
  ResultReleaseReadinessRepository,
  ResultReleaseBoundaryRepository,
  ResultRegradeRequestRepository,
  ResultRegradeIntakeRepository,
  ResultGovernanceAuditRepository,
  ResultGovernanceIdempotencyRepository,
} from '../contracts/resultGovernanceRepositoryContracts';

function safeDate(date: Date | string | null | undefined): string | undefined {
  if (!date) return undefined;
  return new Date(date).toISOString();
}

function safeJson(json: unknown): Record<string, unknown> | undefined {
  if (!json) return undefined;
  if (typeof json === 'string') {
    try { return JSON.parse(json); } catch { return undefined; }
  }
  if (typeof json === 'object') return json as Record<string, unknown>;
  return undefined;
}

function inputJson(json: unknown): Prisma.InputJsonValue | undefined {
  if (!json) return undefined;
  return json as Prisma.InputJsonValue;
}

export class PrismaResultFinalizationReviewRepository implements ResultFinalizationReviewRepository {
  constructor(private prisma: PrismaClient) {}

  async create(review: ResultFinalizationReview): Promise<ResultFinalizationReview> {
    const record = await this.prisma.resultFinalizationReviewRecord.create({
      data: {
        resultFinalizationReviewId: review.resultFinalizationReviewId,
        schoolId: review.schoolId,
        markingInvocationRequestId: review.markingInvocationRequestId || null,
        markingRunId: review.markingRunId || null,
        deliverySessionId: review.deliverySessionId || null,
        paperId: review.paperId || null,
        paperVersionId: review.paperVersionId || null,
        reviewStatus: review.reviewStatus || 'draft',
        reviewMode: review.reviewMode || 'teacher_reviewed',
        reviewedResultVersionRefsJson: inputJson(review.reviewedResultVersionRefsJson),
        requiredCheckRefsJson: inputJson(review.requiredCheckRefsJson),
        safeReviewSummary: review.safeReviewSummary,
        createdByActorId: review.createdByActorId,
        createdByRole: review.createdByRole,
      },
    });
    return this.mapReview(record);
  }

  async getById(reviewId: string): Promise<ResultFinalizationReview | null> {
    const record = await this.prisma.resultFinalizationReviewRecord.findUnique({ where: { resultFinalizationReviewId: reviewId } });
    return record ? this.mapReview(record) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultFinalizationReview[]> {
    const records = await this.prisma.resultFinalizationReviewRecord.findMany({ where: { schoolId } });
    return records.map(r => this.mapReview(r));
  }

  async listByMarkingRun(markingRunId: string): Promise<ResultFinalizationReview[]> {
    const records = await this.prisma.resultFinalizationReviewRecord.findMany({ where: { markingRunId } });
    return records.map(r => this.mapReview(r));
  }

  async listByMarkingInvocationRequest(markingInvocationRequestId: string): Promise<ResultFinalizationReview[]> {
    const records = await this.prisma.resultFinalizationReviewRecord.findMany({ where: { markingInvocationRequestId } });
    return records.map(r => this.mapReview(r));
  }

  async updateStatus(reviewId: string, status: string, safeSummary?: string): Promise<ResultFinalizationReview | null> {
    const data: any = { reviewStatus: status };
    if (safeSummary !== undefined) data.safeReviewSummary = safeSummary;
    if (status === 'completed') data.completedAt = new Date();
    if (status === 'blocked') data.blockedAt = new Date();
    const record = await this.prisma.resultFinalizationReviewRecord.update({ where: { resultFinalizationReviewId: reviewId }, data }).catch(() => null);
    return record ? this.mapReview(record) : null;
  }

  async update(reviewId: string, updates: Partial<ResultFinalizationReview>): Promise<ResultFinalizationReview | null> {
    const data: any = {};
    if (updates.reviewStatus !== undefined) data.reviewStatus = updates.reviewStatus;
    if (updates.reviewMode !== undefined) data.reviewMode = updates.reviewMode;
    if (updates.safeReviewSummary !== undefined) data.safeReviewSummary = updates.safeReviewSummary;
    if (updates.reviewedResultVersionRefsJson !== undefined) data.reviewedResultVersionRefsJson = updates.reviewedResultVersionRefsJson;
    if (updates.requiredCheckRefsJson !== undefined) data.requiredCheckRefsJson = updates.requiredCheckRefsJson;
    const record = await this.prisma.resultFinalizationReviewRecord.update({ where: { resultFinalizationReviewId: reviewId }, data }).catch(() => null);
    return record ? this.mapReview(record) : null;
  }

  private mapReview(r: any): ResultFinalizationReview {
    return {
      resultFinalizationReviewId: r.resultFinalizationReviewId,
      schoolId: r.schoolId,
      markingInvocationRequestId: r.markingInvocationRequestId || undefined,
      markingRunId: r.markingRunId || undefined,
      deliverySessionId: r.deliverySessionId || undefined,
      paperId: r.paperId || undefined,
      paperVersionId: r.paperVersionId || undefined,
      reviewStatus: r.reviewStatus,
      reviewMode: r.reviewMode,
      reviewedResultVersionRefsJson: safeJson(r.reviewedResultVersionRefsJson),
      requiredCheckRefsJson: safeJson(r.requiredCheckRefsJson),
      safeReviewSummary: r.safeReviewSummary,
      createdByActorId: r.createdByActorId,
      createdByRole: r.createdByRole,
      createdAt: safeDate(r.createdAt) || '',
      updatedAt: safeDate(r.updatedAt) || '',
      completedAt: safeDate(r.completedAt),
      blockedAt: safeDate(r.blockedAt),
    };
  }
}

export class PrismaResultFinalizationDecisionRepository implements ResultFinalizationDecisionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(decision: ResultFinalizationDecision): Promise<ResultFinalizationDecision> {
    const record = await this.prisma.resultFinalizationDecisionRecord.create({
      data: {
        schoolId: decision.schoolId,
        resultFinalizationReviewId: decision.resultFinalizationReviewId,
        markingInvocationRequestId: decision.markingInvocationRequestId || null,
        markingRunId: decision.markingRunId || null,
        decisionStatus: decision.decisionStatus || 'approved_for_finalization',
        decisionType: decision.decisionType || 'teacher_finalization',
        decidedByActorId: decision.decidedByActorId,
        decidedByRole: decision.decidedByRole,
        safeDecisionSummary: decision.safeDecisionSummary,
        reasonCodesJson: inputJson(decision.reasonCodesJson),
        affectedResultVersionRefsJson: inputJson(decision.affectedResultVersionRefsJson),
      },
    });
    return this.mapDecision(record);
  }

  async getById(decisionId: string): Promise<ResultFinalizationDecision | null> {
    const record = await this.prisma.resultFinalizationDecisionRecord.findUnique({ where: { resultFinalizationDecisionId: decisionId } });
    return record ? this.mapDecision(record) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultFinalizationDecision[]> {
    const records = await this.prisma.resultFinalizationDecisionRecord.findMany({ where: { schoolId } });
    return records.map(r => this.mapDecision(r));
  }

  async listByReview(reviewId: string): Promise<ResultFinalizationDecision[]> {
    const records = await this.prisma.resultFinalizationDecisionRecord.findMany({ where: { resultFinalizationReviewId: reviewId } });
    return records.map(r => this.mapDecision(r));
  }

  async listByMarkingRun(markingRunId: string): Promise<ResultFinalizationDecision[]> {
    const records = await this.prisma.resultFinalizationDecisionRecord.findMany({ where: { markingRunId } });
    return records.map(r => this.mapDecision(r));
  }

  async updateStatus(decisionId: string, status: string, safeSummary?: string): Promise<ResultFinalizationDecision | null> {
    const data: any = { decisionStatus: status };
    if (safeSummary !== undefined) data.safeDecisionSummary = safeSummary;
    const record = await this.prisma.resultFinalizationDecisionRecord.update({ where: { resultFinalizationDecisionId: decisionId }, data }).catch(() => null);
    return record ? this.mapDecision(record) : null;
  }

  async voidDecision(decisionId: string, voidedAt: string): Promise<ResultFinalizationDecision | null> {
    const record = await this.prisma.resultFinalizationDecisionRecord.update({
      where: { resultFinalizationDecisionId: decisionId },
      data: { decisionStatus: 'void', voidedAt: new Date(voidedAt) },
    }).catch(() => null);
    return record ? this.mapDecision(record) : null;
  }

  private mapDecision(d: any): ResultFinalizationDecision {
    return {
      resultFinalizationDecisionId: d.resultFinalizationDecisionId,
      schoolId: d.schoolId,
      resultFinalizationReviewId: d.resultFinalizationReviewId,
      markingInvocationRequestId: d.markingInvocationRequestId || undefined,
      markingRunId: d.markingRunId || undefined,
      decisionStatus: d.decisionStatus,
      decisionType: d.decisionType,
      decidedByActorId: d.decidedByActorId,
      decidedByRole: d.decidedByRole,
      safeDecisionSummary: d.safeDecisionSummary,
      reasonCodesJson: safeJson(d.reasonCodesJson),
      affectedResultVersionRefsJson: safeJson(d.affectedResultVersionRefsJson),
      createdAt: safeDate(d.createdAt) || '',
      updatedAt: safeDate(d.updatedAt) || '',
      voidedAt: safeDate(d.voidedAt),
    };
  }
}

export class PrismaResultReleaseReadinessRepository implements ResultReleaseReadinessRepository {
  constructor(private prisma: PrismaClient) {}

  async create(readiness: ResultReleaseReadiness): Promise<ResultReleaseReadiness> {
    const record = await this.prisma.resultReleaseReadinessRecord.create({
      data: {
        schoolId: readiness.schoolId,
        resultFinalizationDecisionId: readiness.resultFinalizationDecisionId,
        resultFinalizationReviewId: readiness.resultFinalizationReviewId || null,
        markingInvocationRequestId: readiness.markingInvocationRequestId || null,
        releaseReadinessStatus: readiness.releaseReadinessStatus || 'not_ready',
        releaseAudienceType: readiness.releaseAudienceType || 'internal_school',
        safeReadinessSummary: readiness.safeReadinessSummary,
        blockingReasonCodesJson: inputJson(readiness.blockingReasonCodesJson),
        allowedChannelRefsJson: inputJson(readiness.allowedChannelRefsJson),
        createdByActorId: readiness.createdByActorId,
        createdByRole: readiness.createdByRole,
        expiresAt: readiness.expiresAt ? new Date(readiness.expiresAt) : null,
      },
    });
    return this.mapReadiness(record);
  }

  async getById(readinessId: string): Promise<ResultReleaseReadiness | null> {
    const record = await this.prisma.resultReleaseReadinessRecord.findUnique({ where: { resultReleaseReadinessId: readinessId } });
    return record ? this.mapReadiness(record) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReleaseReadiness[]> {
    const records = await this.prisma.resultReleaseReadinessRecord.findMany({ where: { schoolId } });
    return records.map(r => this.mapReadiness(r));
  }

  async listByDecision(decisionId: string): Promise<ResultReleaseReadiness[]> {
    const records = await this.prisma.resultReleaseReadinessRecord.findMany({ where: { resultFinalizationDecisionId: decisionId } });
    return records.map(r => this.mapReadiness(r));
  }

  async listByReview(reviewId: string): Promise<ResultReleaseReadiness[]> {
    const records = await this.prisma.resultReleaseReadinessRecord.findMany({ where: { resultFinalizationReviewId: reviewId } });
    return records.map(r => this.mapReadiness(r));
  }

  async updateStatus(readinessId: string, status: string, safeSummary?: string): Promise<ResultReleaseReadiness | null> {
    const data: any = { releaseReadinessStatus: status };
    if (safeSummary !== undefined) data.safeReadinessSummary = safeSummary;
    const record = await this.prisma.resultReleaseReadinessRecord.update({ where: { resultReleaseReadinessId: readinessId }, data }).catch(() => null);
    return record ? this.mapReadiness(record) : null;
  }

  async expireReadiness(readinessId: string, expiresAt: string): Promise<ResultReleaseReadiness | null> {
    const record = await this.prisma.resultReleaseReadinessRecord.update({
      where: { resultReleaseReadinessId: readinessId },
      data: { releaseReadinessStatus: 'expired', expiresAt: new Date(expiresAt) },
    }).catch(() => null);
    return record ? this.mapReadiness(record) : null;
  }

  private mapReadiness(r: any): ResultReleaseReadiness {
    return {
      resultReleaseReadinessId: r.resultReleaseReadinessId,
      schoolId: r.schoolId,
      resultFinalizationDecisionId: r.resultFinalizationDecisionId,
      resultFinalizationReviewId: r.resultFinalizationReviewId || undefined,
      markingInvocationRequestId: r.markingInvocationRequestId || undefined,
      releaseReadinessStatus: r.releaseReadinessStatus,
      releaseAudienceType: r.releaseAudienceType,
      safeReadinessSummary: r.safeReadinessSummary,
      blockingReasonCodesJson: safeJson(r.blockingReasonCodesJson),
      allowedChannelRefsJson: safeJson(r.allowedChannelRefsJson),
      createdByActorId: r.createdByActorId,
      createdByRole: r.createdByRole,
      createdAt: safeDate(r.createdAt) || '',
      updatedAt: safeDate(r.updatedAt) || '',
      expiresAt: safeDate(r.expiresAt),
    };
  }
}

export class PrismaResultReleaseBoundaryRepository implements ResultReleaseBoundaryRepository {
  constructor(private prisma: PrismaClient) {}

  async create(boundary: ResultReleaseBoundary): Promise<ResultReleaseBoundary> {
    const record = await this.prisma.resultReleaseBoundaryRecord.create({
      data: {
        schoolId: boundary.schoolId,
        resultReleaseReadinessId: boundary.resultReleaseReadinessId,
        resultFinalizationDecisionId: boundary.resultFinalizationDecisionId || null,
        audienceType: boundary.audienceType || 'student',
        boundaryStatus: boundary.boundaryStatus || 'draft',
        allowedFieldsJson: inputJson(boundary.allowedFieldsJson),
        blockedFieldsJson: inputJson(boundary.blockedFieldsJson),
        redactionRulesJson: inputJson(boundary.redactionRulesJson),
        safeBoundarySummary: boundary.safeBoundarySummary,
        createdByActorId: boundary.createdByActorId,
        createdByRole: boundary.createdByRole,
      },
    });
    return this.mapBoundary(record);
  }

  async getById(boundaryId: string): Promise<ResultReleaseBoundary | null> {
    const record = await this.prisma.resultReleaseBoundaryRecord.findUnique({ where: { resultReleaseBoundaryId: boundaryId } });
    return record ? this.mapBoundary(record) : null;
  }

  async listByReadiness(readinessId: string): Promise<ResultReleaseBoundary[]> {
    const records = await this.prisma.resultReleaseBoundaryRecord.findMany({ where: { resultReleaseReadinessId: readinessId } });
    return records.map(r => this.mapBoundary(r));
  }

  async listBySchool(schoolId: string): Promise<ResultReleaseBoundary[]> {
    const records = await this.prisma.resultReleaseBoundaryRecord.findMany({ where: { schoolId } });
    return records.map(r => this.mapBoundary(r));
  }

  async updateStatus(boundaryId: string, status: string): Promise<ResultReleaseBoundary | null> {
    const record = await this.prisma.resultReleaseBoundaryRecord.update({
      where: { resultReleaseBoundaryId: boundaryId },
      data: { boundaryStatus: status },
    }).catch(() => null);
    return record ? this.mapBoundary(record) : null;
  }

  async voidBoundary(boundaryId: string, voidedAt: string): Promise<ResultReleaseBoundary | null> {
    const record = await this.prisma.resultReleaseBoundaryRecord.update({
      where: { resultReleaseBoundaryId: boundaryId },
      data: { boundaryStatus: 'void', voidedAt: new Date(voidedAt) },
    }).catch(() => null);
    return record ? this.mapBoundary(record) : null;
  }

  private mapBoundary(b: any): ResultReleaseBoundary {
    return {
      resultReleaseBoundaryId: b.resultReleaseBoundaryId,
      schoolId: b.schoolId,
      resultReleaseReadinessId: b.resultReleaseReadinessId,
      resultFinalizationDecisionId: b.resultFinalizationDecisionId || undefined,
      audienceType: b.audienceType,
      boundaryStatus: b.boundaryStatus,
      allowedFieldsJson: safeJson(b.allowedFieldsJson),
      blockedFieldsJson: safeJson(b.blockedFieldsJson),
      redactionRulesJson: safeJson(b.redactionRulesJson),
      safeBoundarySummary: b.safeBoundarySummary,
      createdByActorId: b.createdByActorId,
      createdByRole: b.createdByRole,
      createdAt: safeDate(b.createdAt) || '',
      updatedAt: safeDate(b.updatedAt) || '',
      voidedAt: safeDate(b.voidedAt),
    };
  }
}

export class PrismaResultRegradeRequestRepository implements ResultRegradeRequestRepository {
  constructor(private prisma: PrismaClient) {}

  async create(request: ResultRegradeRequest): Promise<ResultRegradeRequest> {
    const record = await this.prisma.resultRegradeRequestRecord.create({
      data: {
        schoolId: request.schoolId,
        resultFinalizationDecisionId: request.resultFinalizationDecisionId || null,
        markingResultVersionId: request.markingResultVersionId,
        markingRunId: request.markingRunId || null,
        studentRef: request.studentRef,
        requesterActorId: request.requesterActorId,
        requesterRole: request.requesterRole,
        requestStatus: request.requestStatus || 'submitted',
        requestType: request.requestType || 'student_challenge_escalation',
        safeRequestSummary: request.safeRequestSummary,
        reasonCodesJson: inputJson(request.reasonCodesJson),
      },
    });
    return this.mapRequest(record);
  }

  async getById(requestId: string): Promise<ResultRegradeRequest | null> {
    const record = await this.prisma.resultRegradeRequestRecord.findUnique({ where: { resultRegradeRequestId: requestId } });
    return record ? this.mapRequest(record) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultRegradeRequest[]> {
    const records = await this.prisma.resultRegradeRequestRecord.findMany({ where: { schoolId } });
    return records.map(r => this.mapRequest(r));
  }

  async listByStudent(schoolId: string, studentRef: string): Promise<ResultRegradeRequest[]> {
    const records = await this.prisma.resultRegradeRequestRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.mapRequest(r));
  }

  async listByResultVersion(markingResultVersionId: string): Promise<ResultRegradeRequest[]> {
    const records = await this.prisma.resultRegradeRequestRecord.findMany({ where: { markingResultVersionId } });
    return records.map(r => this.mapRequest(r));
  }

  async updateStatus(requestId: string, status: string, safeSummary?: string): Promise<ResultRegradeRequest | null> {
    const data: any = { requestStatus: status };
    if (safeSummary !== undefined) data.safeRequestSummary = safeSummary;
    if (status === 'cancelled') data.cancelledAt = new Date();
    if (status === 'resolved_without_change') data.resolvedAt = new Date();
    const record = await this.prisma.resultRegradeRequestRecord.update({ where: { resultRegradeRequestId: requestId }, data }).catch(() => null);
    return record ? this.mapRequest(record) : null;
  }

  private mapRequest(r: any): ResultRegradeRequest {
    return {
      resultRegradeRequestId: r.resultRegradeRequestId,
      schoolId: r.schoolId,
      resultFinalizationDecisionId: r.resultFinalizationDecisionId || undefined,
      markingResultVersionId: r.markingResultVersionId,
      markingRunId: r.markingRunId || undefined,
      studentRef: r.studentRef,
      requesterActorId: r.requesterActorId,
      requesterRole: r.requesterRole,
      requestStatus: r.requestStatus,
      requestType: r.requestType,
      safeRequestSummary: r.safeRequestSummary,
      reasonCodesJson: safeJson(r.reasonCodesJson),
      createdAt: safeDate(r.createdAt) || '',
      updatedAt: safeDate(r.updatedAt) || '',
      cancelledAt: safeDate(r.cancelledAt),
      resolvedAt: safeDate(r.resolvedAt),
    };
  }
}

export class PrismaResultRegradeIntakeRepository implements ResultRegradeIntakeRepository {
  constructor(private prisma: PrismaClient) {}

  async create(intake: ResultRegradeIntake): Promise<ResultRegradeIntake> {
    const record = await this.prisma.resultRegradeIntakeRecord.create({
      data: {
        schoolId: intake.schoolId,
        resultRegradeRequestId: intake.resultRegradeRequestId,
        intakeStatus: intake.intakeStatus || 'received',
        assignedReviewerActorId: intake.assignedReviewerActorId || null,
        assignedReviewerRole: intake.assignedReviewerRole || null,
        safeIntakeSummary: intake.safeIntakeSummary,
        triageReasonCodesJson: inputJson(intake.triageReasonCodesJson),
      },
    });
    return this.mapIntake(record);
  }

  async getById(intakeId: string): Promise<ResultRegradeIntake | null> {
    const record = await this.prisma.resultRegradeIntakeRecord.findUnique({ where: { resultRegradeIntakeId: intakeId } });
    return record ? this.mapIntake(record) : null;
  }

  async listByRequest(requestId: string): Promise<ResultRegradeIntake[]> {
    const records = await this.prisma.resultRegradeIntakeRecord.findMany({ where: { resultRegradeRequestId: requestId } });
    return records.map(r => this.mapIntake(r));
  }

  async listBySchool(schoolId: string): Promise<ResultRegradeIntake[]> {
    const records = await this.prisma.resultRegradeIntakeRecord.findMany({ where: { schoolId } });
    return records.map(r => this.mapIntake(r));
  }

  async updateStatus(intakeId: string, status: string, safeSummary?: string): Promise<ResultRegradeIntake | null> {
    const data: any = { intakeStatus: status };
    if (safeSummary !== undefined) data.safeIntakeSummary = safeSummary;
    if (status === 'completed') data.completedAt = new Date();
    if (status === 'blocked') data.blockedAt = new Date();
    const record = await this.prisma.resultRegradeIntakeRecord.update({ where: { resultRegradeIntakeId: intakeId }, data }).catch(() => null);
    return record ? this.mapIntake(record) : null;
  }

  async assignReviewer(intakeId: string, reviewerActorId: string, reviewerRole: string): Promise<ResultRegradeIntake | null> {
    const record = await this.prisma.resultRegradeIntakeRecord.update({
      where: { resultRegradeIntakeId: intakeId },
      data: { assignedReviewerActorId: reviewerActorId, assignedReviewerRole: reviewerRole, intakeStatus: 'assigned' },
    }).catch(() => null);
    return record ? this.mapIntake(record) : null;
  }

  private mapIntake(i: any): ResultRegradeIntake {
    return {
      resultRegradeIntakeId: i.resultRegradeIntakeId,
      schoolId: i.schoolId,
      resultRegradeRequestId: i.resultRegradeRequestId,
      intakeStatus: i.intakeStatus,
      assignedReviewerActorId: i.assignedReviewerActorId || undefined,
      assignedReviewerRole: i.assignedReviewerRole || undefined,
      safeIntakeSummary: i.safeIntakeSummary,
      triageReasonCodesJson: safeJson(i.triageReasonCodesJson),
      createdAt: safeDate(i.createdAt) || '',
      updatedAt: safeDate(i.updatedAt) || '',
      completedAt: safeDate(i.completedAt),
      blockedAt: safeDate(i.blockedAt),
    };
  }
}

export class PrismaResultGovernanceAuditRepository implements ResultGovernanceAuditRepository {
  constructor(private prisma: PrismaClient) {}

  async create(event: ResultGovernanceAuditEvent): Promise<ResultGovernanceAuditEvent> {
    const record = await this.prisma.resultGovernanceAuditRecord.create({
      data: {
        schoolId: event.schoolId,
        resultFinalizationReviewId: event.resultFinalizationReviewId || null,
        resultFinalizationDecisionId: event.resultFinalizationDecisionId || null,
        resultReleaseReadinessId: event.resultReleaseReadinessId || null,
        resultReleaseBoundaryId: event.resultReleaseBoundaryId || null,
        resultRegradeRequestId: event.resultRegradeRequestId || null,
        actorId: event.actorId,
        actorRole: event.actorRole,
        eventType: event.eventType,
        decision: event.decision,
        safeSummary: event.safeSummary,
        reasonCodesJson: inputJson(event.reasonCodesJson),
        metadataJson: inputJson(event.metadataJson),
        requestId: event.requestId || null,
        correlationId: event.correlationId || null,
      },
    });
    return this.mapAudit(record);
  }

  async listBySchool(schoolId: string): Promise<ResultGovernanceAuditEvent[]> {
    const records = await this.prisma.resultGovernanceAuditRecord.findMany({ where: { schoolId } });
    return records.map(r => this.mapAudit(r));
  }

  async listByReview(reviewId: string): Promise<ResultGovernanceAuditEvent[]> {
    const records = await this.prisma.resultGovernanceAuditRecord.findMany({ where: { resultFinalizationReviewId: reviewId } });
    return records.map(r => this.mapAudit(r));
  }

  async listByDecision(decisionId: string): Promise<ResultGovernanceAuditEvent[]> {
    const records = await this.prisma.resultGovernanceAuditRecord.findMany({ where: { resultFinalizationDecisionId: decisionId } });
    return records.map(r => this.mapAudit(r));
  }

  private mapAudit(a: any): ResultGovernanceAuditEvent {
    return {
      resultGovernanceAuditId: a.resultGovernanceAuditId,
      schoolId: a.schoolId,
      resultFinalizationReviewId: a.resultFinalizationReviewId || undefined,
      resultFinalizationDecisionId: a.resultFinalizationDecisionId || undefined,
      resultReleaseReadinessId: a.resultReleaseReadinessId || undefined,
      resultReleaseBoundaryId: a.resultReleaseBoundaryId || undefined,
      resultRegradeRequestId: a.resultRegradeRequestId || undefined,
      actorId: a.actorId,
      actorRole: a.actorRole,
      eventType: a.eventType,
      decision: a.decision,
      safeSummary: a.safeSummary,
      reasonCodesJson: safeJson(a.reasonCodesJson),
      metadataJson: safeJson(a.metadataJson),
      requestId: a.requestId || undefined,
      correlationId: a.correlationId || undefined,
      createdAt: safeDate(a.createdAt) || '',
    };
  }
}

export class PrismaResultGovernanceIdempotencyRepository implements ResultGovernanceIdempotencyRepository {
  constructor(private prisma: PrismaClient) {}

  async create(entry: ResultGovernanceIdempotencyEntry): Promise<ResultGovernanceIdempotencyEntry> {
    const record = await this.prisma.resultGovernanceIdempotencyRecord.create({
      data: {
        schoolId: entry.schoolId,
        operation: entry.operation,
        idempotencyKey: entry.idempotencyKey,
        requestHash: entry.requestHash,
        status: entry.status || 'in_progress',
        resourceType: entry.resourceType || null,
        resourceId: entry.resourceId || null,
        safeResultSummary: entry.safeResultSummary || null,
        expiresAt: entry.expiresAt ? new Date(entry.expiresAt) : null,
      },
    });
    return this.mapIdempotency(record);
  }

  async getByIdempotencyKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultGovernanceIdempotencyEntry | null> {
    const record = await this.prisma.resultGovernanceIdempotencyRecord.findUnique({
      where: { schoolId_operation_idempotencyKey: { schoolId, operation, idempotencyKey } },
    }).catch(() => null);
    return record ? this.mapIdempotency(record) : null;
  }

  async updateStatus(idempotencyId: string, status: string, resourceType?: string, resourceId?: string, safeResultSummary?: string): Promise<ResultGovernanceIdempotencyEntry | null> {
    const data: any = { status };
    if (resourceType !== undefined) data.resourceType = resourceType;
    if (resourceId !== undefined) data.resourceId = resourceId;
    if (safeResultSummary !== undefined) data.safeResultSummary = safeResultSummary;
    const record = await this.prisma.resultGovernanceIdempotencyRecord.update({ where: { resultGovernanceIdempotencyId: idempotencyId }, data }).catch(() => null);
    return record ? this.mapIdempotency(record) : null;
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.prisma.resultGovernanceIdempotencyRecord.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }

  private mapIdempotency(e: any): ResultGovernanceIdempotencyEntry {
    return {
      resultGovernanceIdempotencyId: e.resultGovernanceIdempotencyId,
      schoolId: e.schoolId,
      operation: e.operation,
      idempotencyKey: e.idempotencyKey,
      requestHash: e.requestHash,
      status: e.status,
      resourceType: e.resourceType || undefined,
      resourceId: e.resourceId || undefined,
      safeResultSummary: e.safeResultSummary || undefined,
      createdAt: safeDate(e.createdAt) || '',
      updatedAt: safeDate(e.updatedAt) || '',
      expiresAt: safeDate(e.expiresAt),
    };
  }
}
