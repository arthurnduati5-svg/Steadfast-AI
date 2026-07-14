import type { ResultReleasePacket, CreateReleasePacketInput } from './resultReleasePacketContracts';
import type { ResultReleaseApproval, CreateReleaseApprovalInput } from './resultReleaseApprovalContracts';
import type { ResultAudienceProjection, CreateAudienceProjectionInput } from './resultAudienceProjectionContracts';
import type { StudentResultReportSnapshot, CreateReportSnapshotInput, ParentSafeResultSummary, CreateParentSafeSummaryInput, StudentSafeResultSummary, CreateStudentSafeSummaryInput } from './resultReportSnapshotContracts';
import type { ResultReleaseDeliveryIntent, CreateDeliveryIntentInput } from './resultReleaseDeliveryIntentContracts';

export interface ResultReleaseAuditEvent {
  resultReleaseAuditId?: string;
  schoolId: string;
  resultReleasePacketId?: string;
  resultReleaseApprovalId?: string;
  resultAudienceProjectionId?: string;
  studentResultReportSnapshotId?: string;
  parentSafeResultSummaryId?: string;
  studentSafeResultSummaryId?: string;
  resultReleaseDeliveryIntentId?: string;
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

export interface ResultReleaseIdempotencyEntry {
  resultReleaseIdempotencyId?: string;
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

export interface ResultReleasePacketRepository {
  create(packet: CreateReleasePacketInput): Promise<ResultReleasePacket>;
  getById(packetId: string): Promise<ResultReleasePacket | null>;
  listBySchool(schoolId: string): Promise<ResultReleasePacket[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultReleasePacket[]>;
  listByFinalizationDecisionId(decisionId: string): Promise<ResultReleasePacket[]>;
  updateStatus(packetId: string, status: string, safeSummary?: string): Promise<ResultReleasePacket | null>;
  update(packetId: string, updates: Partial<ResultReleasePacket>): Promise<ResultReleasePacket | null>;
  blockPacket(packetId: string, blockedAt: string): Promise<ResultReleasePacket | null>;
  cancelPacket(packetId: string, cancelledAt: string): Promise<ResultReleasePacket | null>;
  voidPacket(packetId: string, voidedAt: string): Promise<ResultReleasePacket | null>;
}

export interface ResultReleaseApprovalRepository {
  create(approval: CreateReleaseApprovalInput): Promise<ResultReleaseApproval>;
  getById(approvalId: string): Promise<ResultReleaseApproval | null>;
  listBySchool(schoolId: string): Promise<ResultReleaseApproval[]>;
  listByReleasePacketId(packetId: string): Promise<ResultReleaseApproval[]>;
  listByStudentRef(studentRef: string): Promise<ResultReleaseApproval[]>;
  updateStatus(approvalId: string, status: string, safeSummary?: string): Promise<ResultReleaseApproval | null>;
  blockApproval(approvalId: string): Promise<ResultReleaseApproval | null>;
  voidApproval(approvalId: string, voidedAt: string): Promise<ResultReleaseApproval | null>;
}

export interface ResultAudienceProjectionRepository {
  create(projection: CreateAudienceProjectionInput, projectionVersion?: number): Promise<ResultAudienceProjection>;
  getById(projectionId: string): Promise<ResultAudienceProjection | null>;
  listBySchool(schoolId: string): Promise<ResultAudienceProjection[]>;
  listByReleasePacketId(packetId: string): Promise<ResultAudienceProjection[]>;
  listByStudentRef(studentRef: string): Promise<ResultAudienceProjection[]>;
  listByAudienceType(audienceType: string): Promise<ResultAudienceProjection[]>;
  updateStatus(projectionId: string, status: string): Promise<ResultAudienceProjection | null>;
  blockProjection(projectionId: string): Promise<ResultAudienceProjection | null>;
  voidProjection(projectionId: string, voidedAt: string): Promise<ResultAudienceProjection | null>;
}

export interface StudentResultReportSnapshotRepository {
  create(snapshot: CreateReportSnapshotInput): Promise<StudentResultReportSnapshot>;
  getById(snapshotId: string): Promise<StudentResultReportSnapshot | null>;
  listBySchool(schoolId: string): Promise<StudentResultReportSnapshot[]>;
  listByReleasePacketId(packetId: string): Promise<StudentResultReportSnapshot[]>;
  listByStudentRef(studentRef: string): Promise<StudentResultReportSnapshot[]>;
  updateStatus(snapshotId: string, status: string): Promise<StudentResultReportSnapshot | null>;
  approveSnapshot(snapshotId: string, approvedAt: string): Promise<StudentResultReportSnapshot | null>;
  blockSnapshot(snapshotId: string): Promise<StudentResultReportSnapshot | null>;
  voidSnapshot(snapshotId: string, voidedAt: string): Promise<StudentResultReportSnapshot | null>;
}

export interface ParentSafeResultSummaryRepository {
  create(summary: CreateParentSafeSummaryInput): Promise<ParentSafeResultSummary>;
  getById(summaryId: string): Promise<ParentSafeResultSummary | null>;
  listBySchool(schoolId: string): Promise<ParentSafeResultSummary[]>;
  listByReleasePacketId(packetId: string): Promise<ParentSafeResultSummary[]>;
  listByStudentRef(studentRef: string): Promise<ParentSafeResultSummary[]>;
  updateStatus(summaryId: string, status: string): Promise<ParentSafeResultSummary | null>;
  approveForFutureDelivery(summaryId: string, approvedAt: string): Promise<ParentSafeResultSummary | null>;
  blockSummary(summaryId: string): Promise<ParentSafeResultSummary | null>;
  voidSummary(summaryId: string, voidedAt: string): Promise<ParentSafeResultSummary | null>;
}

export interface StudentSafeResultSummaryRepository {
  create(summary: CreateStudentSafeSummaryInput): Promise<StudentSafeResultSummary>;
  getById(summaryId: string): Promise<StudentSafeResultSummary | null>;
  listBySchool(schoolId: string): Promise<StudentSafeResultSummary[]>;
  listByReleasePacketId(packetId: string): Promise<StudentSafeResultSummary[]>;
  listByStudentRef(studentRef: string): Promise<StudentSafeResultSummary[]>;
  updateStatus(summaryId: string, status: string): Promise<StudentSafeResultSummary | null>;
  approveForFutureDelivery(summaryId: string, approvedAt: string): Promise<StudentSafeResultSummary | null>;
  blockSummary(summaryId: string): Promise<StudentSafeResultSummary | null>;
  voidSummary(summaryId: string, voidedAt: string): Promise<StudentSafeResultSummary | null>;
}

export interface ResultReleaseDeliveryIntentRepository {
  create(intent: CreateDeliveryIntentInput): Promise<ResultReleaseDeliveryIntent>;
  getById(intentId: string): Promise<ResultReleaseDeliveryIntent | null>;
  listBySchool(schoolId: string): Promise<ResultReleaseDeliveryIntent[]>;
  listByReleasePacketId(packetId: string): Promise<ResultReleaseDeliveryIntent[]>;
  listByStudentRef(studentRef: string): Promise<ResultReleaseDeliveryIntent[]>;
  updateStatus(intentId: string, status: string): Promise<ResultReleaseDeliveryIntent | null>;
  blockIntent(intentId: string): Promise<ResultReleaseDeliveryIntent | null>;
  voidIntent(intentId: string, voidedAt: string): Promise<ResultReleaseDeliveryIntent | null>;
}

export interface ResultReleaseAuditRepository {
  create(event: ResultReleaseAuditEvent): Promise<ResultReleaseAuditEvent>;
  listBySchool(schoolId: string): Promise<ResultReleaseAuditEvent[]>;
  listByPacketId(packetId: string): Promise<ResultReleaseAuditEvent[]>;
}

export interface ResultReleaseIdempotencyRepository {
  create(entry: ResultReleaseIdempotencyEntry): Promise<ResultReleaseIdempotencyEntry>;
  getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultReleaseIdempotencyEntry | null>;
  updateStatus(idempotencyId: string, status: string, resourceId?: string, safeResultSummary?: string): Promise<ResultReleaseIdempotencyEntry | null>;
  expireEntry(idempotencyId: string, expiresAt: string): Promise<ResultReleaseIdempotencyEntry | null>;
}
