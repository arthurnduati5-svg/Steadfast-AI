import type { ResultFinalizationReview } from './finalizationReviewContracts';
import type { ResultFinalizationDecision } from './finalizationDecisionContracts';
import type { ResultReleaseReadiness } from './releaseReadinessContracts';
import type { ResultRegradeRequest, ResultRegradeIntake } from './regradeRequestContracts';

export interface ResultGovernanceAuditEvent {
  resultGovernanceAuditId?: string;
  schoolId: string;
  resultFinalizationReviewId?: string;
  resultFinalizationDecisionId?: string;
  resultReleaseReadinessId?: string;
  resultReleaseBoundaryId?: string;
  resultRegradeRequestId?: string;
  resultRegradeIntakeId?: string;
  actorId: string;
  actorRole: string;
  eventType: string;
  decision: string;
  safeSummary: string;
  reasonCodesJson?: Record<string, unknown>;
  metadataJson?: Record<string, unknown>;
  requestId?: string;
  correlationId?: string;
  createdAt?: string;
}

export interface ResultGovernanceIdempotencyEntry {
  resultGovernanceIdempotencyId?: string;
  schoolId: string;
  operation: string;
  idempotencyKey: string;
  requestHash: string;
  status: string;
  resourceType?: string;
  resourceId?: string;
  safeResultSummary?: string;
  createdAt?: string;
  updatedAt?: string;
  expiresAt?: string;
}

export interface ResultReleaseBoundary {
  resultReleaseBoundaryId: string;
  schoolId: string;
  resultReleaseReadinessId: string;
  resultFinalizationDecisionId?: string;
  audienceType: string;
  boundaryStatus: string;
  allowedFieldsJson?: Record<string, unknown>;
  blockedFieldsJson?: Record<string, unknown>;
  redactionRulesJson?: Record<string, unknown>;
  safeBoundarySummary: string;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt?: string;
}

export interface ResultFinalizationReviewRepository {
  create(review: ResultFinalizationReview): Promise<ResultFinalizationReview>;
  getById(reviewId: string): Promise<ResultFinalizationReview | null>;
  listBySchool(schoolId: string): Promise<ResultFinalizationReview[]>;
  listByMarkingRun(markingRunId: string): Promise<ResultFinalizationReview[]>;
  listByMarkingInvocationRequest(markingInvocationRequestId: string): Promise<ResultFinalizationReview[]>;
  updateStatus(reviewId: string, status: string, safeSummary?: string): Promise<ResultFinalizationReview | null>;
  update(reviewId: string, updates: Partial<ResultFinalizationReview>): Promise<ResultFinalizationReview | null>;
}

export interface ResultFinalizationDecisionRepository {
  create(decision: ResultFinalizationDecision): Promise<ResultFinalizationDecision>;
  getById(decisionId: string): Promise<ResultFinalizationDecision | null>;
  listBySchool(schoolId: string): Promise<ResultFinalizationDecision[]>;
  listByReview(reviewId: string): Promise<ResultFinalizationDecision[]>;
  listByMarkingRun(markingRunId: string): Promise<ResultFinalizationDecision[]>;
  updateStatus(decisionId: string, status: string, safeSummary?: string): Promise<ResultFinalizationDecision | null>;
  voidDecision(decisionId: string, voidedAt: string): Promise<ResultFinalizationDecision | null>;
}

export interface ResultReleaseReadinessRepository {
  create(readiness: ResultReleaseReadiness): Promise<ResultReleaseReadiness>;
  getById(readinessId: string): Promise<ResultReleaseReadiness | null>;
  listBySchool(schoolId: string): Promise<ResultReleaseReadiness[]>;
  listByDecision(decisionId: string): Promise<ResultReleaseReadiness[]>;
  listByReview(reviewId: string): Promise<ResultReleaseReadiness[]>;
  updateStatus(readinessId: string, status: string, safeSummary?: string): Promise<ResultReleaseReadiness | null>;
  expireReadiness(readinessId: string, expiresAt: string): Promise<ResultReleaseReadiness | null>;
}

export interface ResultReleaseBoundaryRepository {
  create(boundary: ResultReleaseBoundary): Promise<ResultReleaseBoundary>;
  getById(boundaryId: string): Promise<ResultReleaseBoundary | null>;
  listByReadiness(readinessId: string): Promise<ResultReleaseBoundary[]>;
  listBySchool(schoolId: string): Promise<ResultReleaseBoundary[]>;
  updateStatus(boundaryId: string, status: string): Promise<ResultReleaseBoundary | null>;
  voidBoundary(boundaryId: string, voidedAt: string): Promise<ResultReleaseBoundary | null>;
}

export interface ResultRegradeRequestRepository {
  create(request: ResultRegradeRequest): Promise<ResultRegradeRequest>;
  getById(requestId: string): Promise<ResultRegradeRequest | null>;
  listBySchool(schoolId: string): Promise<ResultRegradeRequest[]>;
  listByStudent(schoolId: string, studentRef: string): Promise<ResultRegradeRequest[]>;
  listByResultVersion(markingResultVersionId: string): Promise<ResultRegradeRequest[]>;
  updateStatus(requestId: string, status: string, safeSummary?: string): Promise<ResultRegradeRequest | null>;
}

export interface ResultRegradeIntakeRepository {
  create(intake: ResultRegradeIntake): Promise<ResultRegradeIntake>;
  getById(intakeId: string): Promise<ResultRegradeIntake | null>;
  listByRequest(requestId: string): Promise<ResultRegradeIntake[]>;
  listBySchool(schoolId: string): Promise<ResultRegradeIntake[]>;
  updateStatus(intakeId: string, status: string, safeSummary?: string): Promise<ResultRegradeIntake | null>;
  assignReviewer(intakeId: string, reviewerActorId: string, reviewerRole: string): Promise<ResultRegradeIntake | null>;
}

export interface ResultGovernanceAuditRepository {
  create(event: ResultGovernanceAuditEvent): Promise<ResultGovernanceAuditEvent>;
  listBySchool(schoolId: string): Promise<ResultGovernanceAuditEvent[]>;
  listByReview(reviewId: string): Promise<ResultGovernanceAuditEvent[]>;
  listByDecision(decisionId: string): Promise<ResultGovernanceAuditEvent[]>;
}

export interface ResultGovernanceIdempotencyRepository {
  create(entry: ResultGovernanceIdempotencyEntry): Promise<ResultGovernanceIdempotencyEntry>;
  getByIdempotencyKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultGovernanceIdempotencyEntry | null>;
  updateStatus(idempotencyId: string, status: string, resourceType?: string, resourceId?: string, safeResultSummary?: string): Promise<ResultGovernanceIdempotencyEntry | null>;
  cleanupExpired(): Promise<number>;
}
