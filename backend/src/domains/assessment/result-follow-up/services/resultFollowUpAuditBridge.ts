import type { FollowUpAuditRepository, FollowUpAuditEvent } from '../contracts/resultFollowUpRepositoryContracts';
import { v4 as uuidv4 } from 'uuid';

export class ResultFollowUpAuditBridge {
  constructor(private auditRepo: FollowUpAuditRepository) {}

  private async record(schoolId: string, eventType: string, decision: string, safeSummary: string, refs: Record<string, string | null>, actorId: string, actorRole: string, reasonCodes?: Record<string, unknown>, metadata?: Record<string, unknown>, requestId?: string, correlationId?: string): Promise<void> {
    const event: FollowUpAuditEvent = {
      followUpAuditId: uuidv4(),
      schoolId,
      resultFollowUpCaseId: refs.caseId || null,
      resultFollowUpSignalId: refs.signalId || null,
      resultFollowUpActionPlanId: refs.planId || null,
      teacherFollowUpQueueItemId: refs.queueId || null,
      parentGuidanceDraftId: refs.parentGuidanceId || null,
      studentReflectionTaskDraftId: refs.studentReflectionId || null,
      followUpReviewWindowId: refs.windowId || null,
      followUpEscalationPlanId: refs.escalationId || null,
      followUpSummaryId: refs.summaryId || null,
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

  async recordFollowUpCaseCreated(schoolId: string, caseId: string, actorId: string, actorRole: string, reasonCodes?: Record<string, unknown>, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, 'FOLLOW_UP_CASE_CREATED', 'allowed', 'Follow-up case created', { caseId }, actorId, actorRole, reasonCodes, undefined, requestId, correlationId);
  }

  async recordFollowUpCaseOpened(schoolId: string, caseId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'FOLLOW_UP_CASE_OPENED', 'allowed', 'Follow-up case opened', { caseId }, actorId, actorRole);
  }

  async recordFollowUpCaseTriaged(schoolId: string, caseId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'FOLLOW_UP_CASE_TRIAGED', 'allowed', 'Follow-up case triaged', { caseId }, actorId, actorRole);
  }

  async recordFollowUpCasePlanned(schoolId: string, caseId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'FOLLOW_UP_CASE_PLANNED', 'allowed', 'Follow-up case marked planned', { caseId }, actorId, actorRole);
  }

  async recordFollowUpCaseClosed(schoolId: string, caseId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'FOLLOW_UP_CASE_CLOSED', 'allowed', 'Follow-up case closed', { caseId }, actorId, actorRole);
  }

  async recordFollowUpSignalCreated(schoolId: string, caseId: string, signalId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'FOLLOW_UP_SIGNAL_CREATED', 'allowed', 'Follow-up signal created', { caseId, signalId }, actorId, actorRole);
  }

  async recordActionPlanCreated(schoolId: string, caseId: string, planId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'ACTION_PLAN_CREATED', 'allowed', 'Action plan created', { caseId, planId }, actorId, actorRole);
  }

  async recordActionPlanApprovedForFutureUse(schoolId: string, caseId: string, planId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'ACTION_PLAN_APPROVED_FOR_FUTURE_USE', 'allowed', 'Action plan approved for future use', { caseId, planId }, actorId, actorRole);
  }

  async recordTeacherQueueItemCreated(schoolId: string, caseId: string, queueId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'TEACHER_QUEUE_ITEM_CREATED', 'allowed', 'Teacher queue item created', { caseId, queueId }, actorId, actorRole);
  }

  async recordTeacherQueueItemAcknowledgedMock(schoolId: string, caseId: string, queueId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'TEACHER_QUEUE_ITEM_ACKNOWLEDGED_MOCK', 'allowed', 'Teacher queue item acknowledged mock', { caseId, queueId }, actorId, actorRole);
  }

  async recordParentGuidanceDraftCreated(schoolId: string, caseId: string, parentGuidanceId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'PARENT_GUIDANCE_DRAFT_CREATED', 'allowed', 'Parent guidance draft created', { caseId, parentGuidanceId }, actorId, actorRole);
  }

  async recordParentGuidanceApprovedForFutureUse(schoolId: string, caseId: string, parentGuidanceId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'PARENT_GUIDANCE_APPROVED_FOR_FUTURE_USE', 'allowed', 'Parent guidance draft approved for future use', { caseId, parentGuidanceId }, actorId, actorRole);
  }

  async recordStudentReflectionDraftCreated(schoolId: string, caseId: string, studentReflectionId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'STUDENT_REFLECTION_DRAFT_CREATED', 'allowed', 'Student reflection draft created', { caseId, studentReflectionId }, actorId, actorRole);
  }

  async recordStudentReflectionApprovedForFutureUse(schoolId: string, caseId: string, studentReflectionId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'STUDENT_REFLECTION_APPROVED_FOR_FUTURE_USE', 'allowed', 'Student reflection draft approved for future use', { caseId, studentReflectionId }, actorId, actorRole);
  }

  async recordReviewWindowCreated(schoolId: string, caseId: string, windowId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'REVIEW_WINDOW_CREATED', 'allowed', 'Review window created', { caseId, windowId }, actorId, actorRole);
  }

  async recordReviewWindowScheduledMock(schoolId: string, caseId: string, windowId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'REVIEW_WINDOW_SCHEDULED_MOCK', 'allowed', 'Review window scheduled mock', { caseId, windowId }, actorId, actorRole);
  }

  async recordEscalationPlanCreated(schoolId: string, caseId: string, escalationId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'ESCALATION_PLAN_CREATED', 'allowed', 'Escalation plan created', { caseId, escalationId }, actorId, actorRole);
  }

  async recordEscalationApprovedForFutureUse(schoolId: string, caseId: string, escalationId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'ESCALATION_APPROVED_FOR_FUTURE_USE', 'allowed', 'Escalation plan approved for future use', { caseId, escalationId }, actorId, actorRole);
  }

  async recordSummaryCreated(schoolId: string, summaryId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'SUMMARY_CREATED', 'allowed', 'Follow-up summary created', { summaryId }, actorId, actorRole);
  }

  async recordSummaryRefreshed(schoolId: string, summaryId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'SUMMARY_REFRESHED', 'allowed', 'Follow-up summary refreshed', { summaryId }, actorId, actorRole);
  }

  async recordPolicyBlocked(schoolId: string, eventType: string, actorId: string, actorRole: string, reasonCodes?: Record<string, unknown>, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, eventType, 'denied', 'Policy blocked follow-up operation', {}, actorId, actorRole, reasonCodes, undefined, requestId, correlationId);
  }

  async recordSafeError(schoolId: string, eventType: string, actorId: string, actorRole: string, safeSummary: string, reasonCodes?: Record<string, unknown>, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, eventType, 'error', safeSummary, {}, actorId, actorRole, reasonCodes, undefined, requestId, correlationId);
  }
}
