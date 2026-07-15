import { randomUUID } from 'crypto';

export interface RecoveryAuditEvent {
  resultRecoveryAuditId: string;
  schoolId: string;
  resultRecoveryPlanId: string | null;
  resultRecoveryObjectiveId: string | null;
  resultRecoveryStepId: string | null;
  resultRecoveryPracticeDraftId: string | null;
  resultRecoveryResourceRecommendationId: string | null;
  resultRecoveryTeacherReviewPacketId: string | null;
  resultRecoveryStudentSupportDraftId: string | null;
  resultRecoveryParentSupportNoteDraftId: string | null;
  resultRecoveryCheckpointId: string | null;
  resultRecoverySummaryId: string | null;
  actorId: string;
  actorRole: string;
  eventType: string;
  decision: string;
  safeSummary: string;
  reasonCodesJson: Record<string, unknown> | null;
  metadataJson: Record<string, unknown> | null;
  requestId: string | null;
  correlationId: string | null;
  createdAt: string;
}

export interface RecoveryAuditRepository {
  create(event: RecoveryAuditEvent): Promise<RecoveryAuditEvent>;
  getById(auditId: string): Promise<RecoveryAuditEvent | null>;
  listBySchool(schoolId: string): Promise<RecoveryAuditEvent[]>;
  listByEventType(schoolId: string, eventType: string): Promise<RecoveryAuditEvent[]>;
}

export class ResultRecoveryAuditBridge {
  constructor(private auditRepo: RecoveryAuditRepository) {}

  private async record(
    schoolId: string,
    eventType: string,
    decision: string,
    safeSummary: string,
    refs: Record<string, string | null>,
    actorId: string,
    actorRole: string,
    reasonCodes?: Record<string, unknown>,
    metadata?: Record<string, unknown>,
    requestId?: string,
    correlationId?: string,
  ): Promise<void> {
    const event: RecoveryAuditEvent = {
      resultRecoveryAuditId: randomUUID(),
      schoolId,
      resultRecoveryPlanId: refs.planId || null,
      resultRecoveryObjectiveId: refs.objectiveId || null,
      resultRecoveryStepId: refs.stepId || null,
      resultRecoveryPracticeDraftId: refs.practiceDraftId || null,
      resultRecoveryResourceRecommendationId: refs.resourceId || null,
      resultRecoveryTeacherReviewPacketId: refs.packetId || null,
      resultRecoveryStudentSupportDraftId: refs.studentSupportId || null,
      resultRecoveryParentSupportNoteDraftId: refs.parentSupportId || null,
      resultRecoveryCheckpointId: refs.checkpointId || null,
      resultRecoverySummaryId: refs.summaryId || null,
      actorId,
      actorRole,
      eventType,
      decision,
      safeSummary,
      reasonCodesJson: reasonCodes || null,
      metadataJson: metadata || null,
      requestId: requestId || null,
      correlationId: correlationId || null,
      createdAt: new Date().toISOString(),
    };
    await this.auditRepo.create(event);
  }

  async recordRecoveryPlanCreated(schoolId: string, planId: string, actorId: string, actorRole: string, reasonCodes?: Record<string, unknown>, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, 'RECOVERY_PLAN_CREATED', 'allowed', 'Recovery plan created', { planId }, actorId, actorRole, reasonCodes, undefined, requestId, correlationId);
  }

  async recordRecoveryPlanReviewReady(schoolId: string, planId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'RECOVERY_PLAN_REVIEW_READY', 'allowed', 'Recovery plan review ready', { planId }, actorId, actorRole);
  }

  async recordRecoveryPlanApprovedForFutureUse(schoolId: string, planId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'RECOVERY_PLAN_APPROVED_FOR_FUTURE_USE', 'allowed', 'Recovery plan approved for future use', { planId }, actorId, actorRole);
  }

  async recordRecoveryObjectiveCreated(schoolId: string, planId: string, objectiveId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'RECOVERY_OBJECTIVE_CREATED', 'allowed', 'Recovery objective created', { planId, objectiveId }, actorId, actorRole);
  }

  async recordRecoveryStepCreated(schoolId: string, planId: string, stepId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'RECOVERY_STEP_CREATED', 'allowed', 'Recovery step created', { planId, stepId }, actorId, actorRole);
  }

  async recordPracticeDraftCreated(schoolId: string, planId: string, practiceDraftId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'PRACTICE_DRAFT_CREATED', 'allowed', 'Practice draft created', { planId, practiceDraftId }, actorId, actorRole);
  }

  async recordPracticeDraftApprovedForFutureUse(schoolId: string, planId: string, practiceDraftId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'PRACTICE_DRAFT_APPROVED_FOR_FUTURE_USE', 'allowed', 'Practice draft approved for future use', { planId, practiceDraftId }, actorId, actorRole);
  }

  async recordResourceRecommendationCreated(schoolId: string, planId: string, resourceId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'RESOURCE_RECOMMENDATION_CREATED', 'allowed', 'Resource recommendation created', { planId, resourceId }, actorId, actorRole);
  }

  async recordTeacherReviewPacketCreated(schoolId: string, planId: string, packetId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'TEACHER_REVIEW_PACKET_CREATED', 'allowed', 'Teacher review packet created', { planId, packetId }, actorId, actorRole);
  }

  async recordTeacherReviewPacketAcknowledgedMock(schoolId: string, planId: string, packetId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'TEACHER_REVIEW_PACKET_ACKNOWLEDGED_MOCK', 'allowed', 'Teacher review packet acknowledged mock', { planId, packetId }, actorId, actorRole);
  }

  async recordStudentSupportDraftCreated(schoolId: string, planId: string, studentSupportId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'STUDENT_SUPPORT_DRAFT_CREATED', 'allowed', 'Student support draft created', { planId, studentSupportId }, actorId, actorRole);
  }

  async recordStudentSupportDraftApprovedForFutureUse(schoolId: string, planId: string, studentSupportId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'STUDENT_SUPPORT_DRAFT_APPROVED_FOR_FUTURE_USE', 'allowed', 'Student support draft approved for future use', { planId, studentSupportId }, actorId, actorRole);
  }

  async recordParentSupportNoteDraftCreated(schoolId: string, planId: string, parentSupportId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'PARENT_SUPPORT_NOTE_DRAFT_CREATED', 'allowed', 'Parent support note draft created', { planId, parentSupportId }, actorId, actorRole);
  }

  async recordParentSupportNoteApprovedForFutureUse(schoolId: string, planId: string, parentSupportId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'PARENT_SUPPORT_NOTE_APPROVED_FOR_FUTURE_USE', 'allowed', 'Parent support note draft approved for future use', { planId, parentSupportId }, actorId, actorRole);
  }

  async recordCheckpointCreated(schoolId: string, planId: string, checkpointId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'CHECKPOINT_CREATED', 'allowed', 'Checkpoint created', { planId, checkpointId }, actorId, actorRole);
  }

  async recordCheckpointScheduledMock(schoolId: string, planId: string, checkpointId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'CHECKPOINT_SCHEDULED_MOCK', 'allowed', 'Checkpoint scheduled mock', { planId, checkpointId }, actorId, actorRole);
  }

  async recordSummaryCreated(schoolId: string, summaryId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'SUMMARY_CREATED', 'allowed', 'Recovery summary created', { summaryId }, actorId, actorRole);
  }

  async recordSummaryRefreshed(schoolId: string, summaryId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'SUMMARY_REFRESHED', 'allowed', 'Recovery summary refreshed', { summaryId }, actorId, actorRole);
  }

  async recordPolicyBlocked(schoolId: string, eventType: string, actorId: string, actorRole: string, reasonCodes?: Record<string, unknown>, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, eventType, 'denied', 'Policy blocked recovery operation', {}, actorId, actorRole, reasonCodes, undefined, requestId, correlationId);
  }

  async recordSafeError(schoolId: string, eventType: string, actorId: string, actorRole: string, safeSummary: string, reasonCodes?: Record<string, unknown>, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, eventType, 'error', safeSummary, {}, actorId, actorRole, reasonCodes, undefined, requestId, correlationId);
  }
}
