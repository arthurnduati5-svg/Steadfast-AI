import { randomUUID } from 'crypto';
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

export class InMemoryResultFinalizationReviewRepository implements ResultFinalizationReviewRepository {
  private store = new Map<string, ResultFinalizationReview>();

  async create(review: ResultFinalizationReview): Promise<ResultFinalizationReview> {
    const id = review.resultFinalizationReviewId || randomUUID();
    const now = new Date().toISOString();
    const record: ResultFinalizationReview = { ...review, resultFinalizationReviewId: id, createdAt: now, updatedAt: now };
    this.store.set(id, record);
    return record;
  }

  async getById(reviewId: string): Promise<ResultFinalizationReview | null> {
    return this.store.get(reviewId) || null;
  }

  async listBySchool(schoolId: string): Promise<ResultFinalizationReview[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByMarkingRun(markingRunId: string): Promise<ResultFinalizationReview[]> {
    return Array.from(this.store.values()).filter(r => r.markingRunId === markingRunId);
  }

  async listByMarkingInvocationRequest(markingInvocationRequestId: string): Promise<ResultFinalizationReview[]> {
    return Array.from(this.store.values()).filter(r => r.markingInvocationRequestId === markingInvocationRequestId);
  }

  async updateStatus(reviewId: string, status: string, safeSummary?: string): Promise<ResultFinalizationReview | null> {
    const existing = this.store.get(reviewId);
    if (!existing) return null;
    const updated = { ...existing, reviewStatus: status, updatedAt: new Date().toISOString() };
    if (safeSummary !== undefined) updated.safeReviewSummary = safeSummary;
    if (status === 'completed') updated.completedAt = new Date().toISOString();
    if (status === 'blocked') updated.blockedAt = new Date().toISOString();
    this.store.set(reviewId, updated);
    return updated;
  }

  async update(reviewId: string, updates: Partial<ResultFinalizationReview>): Promise<ResultFinalizationReview | null> {
    const existing = this.store.get(reviewId);
    if (!existing) return null;
    const updated = { ...existing, ...updates, resultFinalizationReviewId: reviewId, updatedAt: new Date().toISOString() };
    this.store.set(reviewId, updated);
    return updated;
  }
}

export class InMemoryResultFinalizationDecisionRepository implements ResultFinalizationDecisionRepository {
  private store = new Map<string, ResultFinalizationDecision>();

  async create(decision: ResultFinalizationDecision): Promise<ResultFinalizationDecision> {
    const id = decision.resultFinalizationDecisionId || randomUUID();
    const now = new Date().toISOString();
    const record: ResultFinalizationDecision = { ...decision, resultFinalizationDecisionId: id, createdAt: now, updatedAt: now };
    this.store.set(id, record);
    return record;
  }

  async getById(decisionId: string): Promise<ResultFinalizationDecision | null> {
    return this.store.get(decisionId) || null;
  }

  async listBySchool(schoolId: string): Promise<ResultFinalizationDecision[]> {
    return Array.from(this.store.values()).filter(d => d.schoolId === schoolId);
  }

  async listByReview(reviewId: string): Promise<ResultFinalizationDecision[]> {
    return Array.from(this.store.values()).filter(d => d.resultFinalizationReviewId === reviewId);
  }

  async listByMarkingRun(markingRunId: string): Promise<ResultFinalizationDecision[]> {
    return Array.from(this.store.values()).filter(d => d.markingRunId === markingRunId);
  }

  async updateStatus(decisionId: string, status: string, safeSummary?: string): Promise<ResultFinalizationDecision | null> {
    const existing = this.store.get(decisionId);
    if (!existing) return null;
    const updated = { ...existing, decisionStatus: status, updatedAt: new Date().toISOString() };
    if (safeSummary !== undefined) updated.safeDecisionSummary = safeSummary;
    this.store.set(decisionId, updated);
    return updated;
  }

  async voidDecision(decisionId: string, voidedAt: string): Promise<ResultFinalizationDecision | null> {
    const existing = this.store.get(decisionId);
    if (!existing) return null;
    const updated = { ...existing, decisionStatus: 'void', voidedAt, updatedAt: new Date().toISOString() };
    this.store.set(decisionId, updated);
    return updated;
  }
}

export class InMemoryResultReleaseReadinessRepository implements ResultReleaseReadinessRepository {
  private store = new Map<string, ResultReleaseReadiness>();

  async create(readiness: ResultReleaseReadiness): Promise<ResultReleaseReadiness> {
    const id = readiness.resultReleaseReadinessId || randomUUID();
    const now = new Date().toISOString();
    const record: ResultReleaseReadiness = { ...readiness, resultReleaseReadinessId: id, createdAt: now, updatedAt: now };
    this.store.set(id, record);
    return record;
  }

  async getById(readinessId: string): Promise<ResultReleaseReadiness | null> {
    return this.store.get(readinessId) || null;
  }

  async listBySchool(schoolId: string): Promise<ResultReleaseReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByDecision(decisionId: string): Promise<ResultReleaseReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.resultFinalizationDecisionId === decisionId);
  }

  async listByReview(reviewId: string): Promise<ResultReleaseReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.resultFinalizationReviewId === reviewId);
  }

  async updateStatus(readinessId: string, status: string, safeSummary?: string): Promise<ResultReleaseReadiness | null> {
    const existing = this.store.get(readinessId);
    if (!existing) return null;
    const updated = { ...existing, releaseReadinessStatus: status, updatedAt: new Date().toISOString() };
    if (safeSummary !== undefined) updated.safeReadinessSummary = safeSummary;
    this.store.set(readinessId, updated);
    return updated;
  }

  async expireReadiness(readinessId: string, expiresAt: string): Promise<ResultReleaseReadiness | null> {
    const existing = this.store.get(readinessId);
    if (!existing) return null;
    const updated = { ...existing, releaseReadinessStatus: 'expired', expiresAt, updatedAt: new Date().toISOString() };
    this.store.set(readinessId, updated);
    return updated;
  }
}

export class InMemoryResultReleaseBoundaryRepository implements ResultReleaseBoundaryRepository {
  private store = new Map<string, ResultReleaseBoundary>();

  async create(boundary: ResultReleaseBoundary): Promise<ResultReleaseBoundary> {
    const id = boundary.resultReleaseBoundaryId || randomUUID();
    const now = new Date().toISOString();
    const record: ResultReleaseBoundary = { ...boundary, resultReleaseBoundaryId: id, createdAt: now, updatedAt: now };
    this.store.set(id, record);
    return record;
  }

  async getById(boundaryId: string): Promise<ResultReleaseBoundary | null> {
    return this.store.get(boundaryId) || null;
  }

  async listByReadiness(readinessId: string): Promise<ResultReleaseBoundary[]> {
    return Array.from(this.store.values()).filter(b => b.resultReleaseReadinessId === readinessId);
  }

  async listBySchool(schoolId: string): Promise<ResultReleaseBoundary[]> {
    return Array.from(this.store.values()).filter(b => b.schoolId === schoolId);
  }

  async updateStatus(boundaryId: string, status: string): Promise<ResultReleaseBoundary | null> {
    const existing = this.store.get(boundaryId);
    if (!existing) return null;
    const updated = { ...existing, boundaryStatus: status, updatedAt: new Date().toISOString() };
    this.store.set(boundaryId, updated);
    return updated;
  }

  async voidBoundary(boundaryId: string, voidedAt: string): Promise<ResultReleaseBoundary | null> {
    const existing = this.store.get(boundaryId);
    if (!existing) return null;
    const updated = { ...existing, boundaryStatus: 'void', voidedAt, updatedAt: new Date().toISOString() };
    this.store.set(boundaryId, updated);
    return updated;
  }
}

export class InMemoryResultRegradeRequestRepository implements ResultRegradeRequestRepository {
  private store = new Map<string, ResultRegradeRequest>();

  async create(request: ResultRegradeRequest): Promise<ResultRegradeRequest> {
    const id = request.resultRegradeRequestId || randomUUID();
    const now = new Date().toISOString();
    const record: ResultRegradeRequest = { ...request, resultRegradeRequestId: id, createdAt: now, updatedAt: now };
    this.store.set(id, record);
    return record;
  }

  async getById(requestId: string): Promise<ResultRegradeRequest | null> {
    return this.store.get(requestId) || null;
  }

  async listBySchool(schoolId: string): Promise<ResultRegradeRequest[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudent(schoolId: string, studentRef: string): Promise<ResultRegradeRequest[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByResultVersion(markingResultVersionId: string): Promise<ResultRegradeRequest[]> {
    return Array.from(this.store.values()).filter(r => r.markingResultVersionId === markingResultVersionId);
  }

  async updateStatus(requestId: string, status: string, safeSummary?: string): Promise<ResultRegradeRequest | null> {
    const existing = this.store.get(requestId);
    if (!existing) return null;
    const updated = { ...existing, requestStatus: status, updatedAt: new Date().toISOString() };
    if (safeSummary !== undefined) updated.safeRequestSummary = safeSummary;
    if (status === 'cancelled') updated.cancelledAt = new Date().toISOString();
    if (status === 'resolved_without_change') updated.resolvedAt = new Date().toISOString();
    this.store.set(requestId, updated);
    return updated;
  }
}

export class InMemoryResultRegradeIntakeRepository implements ResultRegradeIntakeRepository {
  private store = new Map<string, ResultRegradeIntake>();

  async create(intake: ResultRegradeIntake): Promise<ResultRegradeIntake> {
    const id = intake.resultRegradeIntakeId || randomUUID();
    const now = new Date().toISOString();
    const record: ResultRegradeIntake = { ...intake, resultRegradeIntakeId: id, createdAt: now, updatedAt: now };
    this.store.set(id, record);
    return record;
  }

  async getById(intakeId: string): Promise<ResultRegradeIntake | null> {
    return this.store.get(intakeId) || null;
  }

  async listByRequest(requestId: string): Promise<ResultRegradeIntake[]> {
    return Array.from(this.store.values()).filter(i => i.resultRegradeRequestId === requestId);
  }

  async listBySchool(schoolId: string): Promise<ResultRegradeIntake[]> {
    return Array.from(this.store.values()).filter(i => i.schoolId === schoolId);
  }

  async updateStatus(intakeId: string, status: string, safeSummary?: string): Promise<ResultRegradeIntake | null> {
    const existing = this.store.get(intakeId);
    if (!existing) return null;
    const updated = { ...existing, intakeStatus: status, updatedAt: new Date().toISOString() };
    if (safeSummary !== undefined) updated.safeIntakeSummary = safeSummary;
    if (status === 'completed') updated.completedAt = new Date().toISOString();
    if (status === 'blocked') updated.blockedAt = new Date().toISOString();
    this.store.set(intakeId, updated);
    return updated;
  }

  async assignReviewer(intakeId: string, reviewerActorId: string, reviewerRole: string): Promise<ResultRegradeIntake | null> {
    const existing = this.store.get(intakeId);
    if (!existing) return null;
    const updated = { ...existing, assignedReviewerActorId: reviewerActorId, assignedReviewerRole: reviewerRole, intakeStatus: 'assigned', updatedAt: new Date().toISOString() };
    this.store.set(intakeId, updated);
    return updated;
  }
}

export class InMemoryResultGovernanceAuditRepository implements ResultGovernanceAuditRepository {
  private store = new Map<string, ResultGovernanceAuditEvent>();

  async create(event: ResultGovernanceAuditEvent): Promise<ResultGovernanceAuditEvent> {
    const id = event.resultGovernanceAuditId || randomUUID();
    const now = new Date().toISOString();
    const record: ResultGovernanceAuditEvent = { ...event, resultGovernanceAuditId: id, createdAt: now };
    this.store.set(id, record);
    return record;
  }

  async listBySchool(schoolId: string): Promise<ResultGovernanceAuditEvent[]> {
    return Array.from(this.store.values()).filter(e => e.schoolId === schoolId);
  }

  async listByReview(reviewId: string): Promise<ResultGovernanceAuditEvent[]> {
    return Array.from(this.store.values()).filter(e => e.resultFinalizationReviewId === reviewId);
  }

  async listByDecision(decisionId: string): Promise<ResultGovernanceAuditEvent[]> {
    return Array.from(this.store.values()).filter(e => e.resultFinalizationDecisionId === decisionId);
  }
}

export class InMemoryResultGovernanceIdempotencyRepository implements ResultGovernanceIdempotencyRepository {
  private store = new Map<string, ResultGovernanceIdempotencyEntry>();

  async create(entry: ResultGovernanceIdempotencyEntry): Promise<ResultGovernanceIdempotencyEntry> {
    const id = entry.resultGovernanceIdempotencyId || randomUUID();
    const now = new Date().toISOString();
    const record: ResultGovernanceIdempotencyEntry = { ...entry, resultGovernanceIdempotencyId: id, createdAt: now, updatedAt: now };
    this.store.set(id, record);
    return record;
  }

  async getByIdempotencyKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultGovernanceIdempotencyEntry | null> {
    return Array.from(this.store.values()).find(e => e.schoolId === schoolId && e.operation === operation && e.idempotencyKey === idempotencyKey) || null;
  }

  async updateStatus(idempotencyId: string, status: string, resourceType?: string, resourceId?: string, safeResultSummary?: string): Promise<ResultGovernanceIdempotencyEntry | null> {
    const existing = this.store.get(idempotencyId);
    if (!existing) return null;
    const updated = { ...existing, status, updatedAt: new Date().toISOString() };
    if (resourceType !== undefined) updated.resourceType = resourceType;
    if (resourceId !== undefined) updated.resourceId = resourceId;
    if (safeResultSummary !== undefined) updated.safeResultSummary = safeResultSummary;
    this.store.set(idempotencyId, updated);
    return updated;
  }

  async cleanupExpired(): Promise<number> {
    const now = new Date().toISOString();
    let count = 0;
    for (const [id, entry] of this.store) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.store.delete(id);
        count++;
      }
    }
    return count;
  }
}
