import { randomUUID } from 'crypto';
import type { RecoveryOutcomeAuditEvent, RecoveryOutcomeCommandContext } from '../contracts/recoveryOutcomeContracts';

export interface OutcomeAuditRepository {
  create(event: RecoveryOutcomeAuditEvent): Promise<RecoveryOutcomeAuditEvent>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeAuditEvent[]>;
}

export class RecoveryOutcomeAuditBridge {
  constructor(private auditRepo: OutcomeAuditRepository) {}

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
    const event: RecoveryOutcomeAuditEvent = {
      recoveryOutcomeAuditId: randomUUID(),
      schoolId,
      recoveryOutcomeDecisionReadinessId: refs.readinessId || undefined,
      recoveryExitCriteriaId: refs.exitCriteriaId || undefined,
      recoveryContinuationDecisionDraftId: refs.continuationDraftId || undefined,
      recoveryIntensificationDecisionDraftId: refs.intensificationDraftId || undefined,
      recoveryPauseDecisionDraftId: refs.pauseDraftId || undefined,
      recoveryClosureDecisionDraftId: refs.closureDraftId || undefined,
      recoveryOutcomeTeacherReviewPacketId: refs.teacherReviewPacketId || undefined,
      recoveryOutcomeStudentNextStepDraftId: refs.studentNextStepDraftId || undefined,
      recoveryOutcomeParentUpdateDraftId: refs.parentUpdateDraftId || undefined,
      recoveryOutcomeDecisionSummaryId: refs.decisionSummaryId || undefined,
      actorId,
      actorRole,
      eventType,
      decision,
      safeSummary,
      reasonCodesJson: reasonCodes || {},
      metadataJson: metadata || {},
      requestId: requestId || undefined,
      correlationId: correlationId || undefined,
      createdAt: new Date().toISOString(),
    };
    await this.auditRepo.create(event);
  }

  async recordDecisionReadinessCreated(schoolId: string, readinessId: string, actorId: string, actorRole: string, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, 'OUTCOME_DECISION_READINESS_CREATED', 'allowed', 'Outcome decision readiness created', { readinessId }, actorId, actorRole, undefined, undefined, requestId, correlationId);
  }

  async recordDecisionReadinessReviewReady(schoolId: string, readinessId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'OUTCOME_DECISION_READINESS_REVIEW_READY', 'allowed', 'Outcome decision readiness review ready', { readinessId }, actorId, actorRole);
  }

  async recordDecisionReadinessApprovedForFutureUse(schoolId: string, readinessId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'OUTCOME_DECISION_READINESS_APPROVED', 'allowed', 'Outcome decision readiness approved for future use', { readinessId }, actorId, actorRole);
  }

  async recordExitCriteriaCreated(schoolId: string, exitCriteriaId: string, actorId: string, actorRole: string, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, 'EXIT_CRITERIA_CREATED', 'allowed', 'Exit criteria created', { exitCriteriaId }, actorId, actorRole, undefined, undefined, requestId, correlationId);
  }

  async recordExitCriteriaReviewReady(schoolId: string, exitCriteriaId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'EXIT_CRITERIA_REVIEW_READY', 'allowed', 'Exit criteria review ready', { exitCriteriaId }, actorId, actorRole);
  }

  async recordExitCriteriaApprovedForFutureUse(schoolId: string, exitCriteriaId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'EXIT_CRITERIA_APPROVED', 'allowed', 'Exit criteria approved for future use', { exitCriteriaId }, actorId, actorRole);
  }

  async recordExitCriteriaEvaluationCreated(schoolId: string, evaluationId: string, actorId: string, actorRole: string, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, 'EXIT_CRITERIA_EVALUATION_CREATED', 'allowed', 'Exit criteria evaluation created', { exitCriteriaId: evaluationId }, actorId, actorRole, undefined, undefined, requestId, correlationId);
  }

  async recordExitCriteriaEvaluationReviewReady(schoolId: string, evaluationId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'EXIT_CRITERIA_EVALUATION_REVIEW_READY', 'allowed', 'Exit criteria evaluation review ready', { exitCriteriaId: evaluationId }, actorId, actorRole);
  }

  async recordExitCriteriaEvaluationApprovedForFutureUse(schoolId: string, evaluationId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'EXIT_CRITERIA_EVALUATION_APPROVED', 'allowed', 'Exit criteria evaluation approved for future use', { exitCriteriaId: evaluationId }, actorId, actorRole);
  }

  async recordContinuationDecisionDraftCreated(schoolId: string, continuationDraftId: string, actorId: string, actorRole: string, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, 'CONTINUATION_DECISION_DRAFT_CREATED', 'allowed', 'Continuation decision draft created', { continuationDraftId }, actorId, actorRole, undefined, undefined, requestId, correlationId);
  }

  async recordContinuationDecisionDraftReviewReady(schoolId: string, continuationDraftId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'CONTINUATION_DECISION_DRAFT_REVIEW_READY', 'allowed', 'Continuation decision draft review ready', { continuationDraftId }, actorId, actorRole);
  }

  async recordContinuationDecisionDraftApprovedForFutureUse(schoolId: string, continuationDraftId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'CONTINUATION_DECISION_DRAFT_APPROVED', 'allowed', 'Continuation decision draft approved for future use', { continuationDraftId }, actorId, actorRole);
  }

  async recordIntensificationDecisionDraftCreated(schoolId: string, intensificationDraftId: string, actorId: string, actorRole: string, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, 'INTENSIFICATION_DECISION_DRAFT_CREATED', 'allowed', 'Intensification decision draft created', { intensificationDraftId }, actorId, actorRole, undefined, undefined, requestId, correlationId);
  }

  async recordIntensificationDecisionDraftReviewReady(schoolId: string, intensificationDraftId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'INTENSIFICATION_DECISION_DRAFT_REVIEW_READY', 'allowed', 'Intensification decision draft review ready', { intensificationDraftId }, actorId, actorRole);
  }

  async recordIntensificationDecisionDraftApprovedForFutureUse(schoolId: string, intensificationDraftId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'INTENSIFICATION_DECISION_DRAFT_APPROVED', 'allowed', 'Intensification decision draft approved for future use', { intensificationDraftId }, actorId, actorRole);
  }

  async recordPauseDecisionDraftCreated(schoolId: string, pauseDraftId: string, actorId: string, actorRole: string, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, 'PAUSE_DECISION_DRAFT_CREATED', 'allowed', 'Pause decision draft created', { pauseDraftId }, actorId, actorRole, undefined, undefined, requestId, correlationId);
  }

  async recordPauseDecisionDraftReviewReady(schoolId: string, pauseDraftId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'PAUSE_DECISION_DRAFT_REVIEW_READY', 'allowed', 'Pause decision draft review ready', { pauseDraftId }, actorId, actorRole);
  }

  async recordPauseDecisionDraftApprovedForFutureUse(schoolId: string, pauseDraftId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'PAUSE_DECISION_DRAFT_APPROVED', 'allowed', 'Pause decision draft approved for future use', { pauseDraftId }, actorId, actorRole);
  }

  async recordClosureDecisionDraftCreated(schoolId: string, closureDraftId: string, actorId: string, actorRole: string, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, 'CLOSURE_DECISION_DRAFT_CREATED', 'allowed', 'Closure decision draft created', { closureDraftId }, actorId, actorRole, undefined, undefined, requestId, correlationId);
  }

  async recordClosureDecisionDraftReviewReady(schoolId: string, closureDraftId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'CLOSURE_DECISION_DRAFT_REVIEW_READY', 'allowed', 'Closure decision draft review ready', { closureDraftId }, actorId, actorRole);
  }

  async recordClosureDecisionDraftApprovedForFutureUse(schoolId: string, closureDraftId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'CLOSURE_DECISION_DRAFT_APPROVED', 'allowed', 'Closure decision draft approved for future use', { closureDraftId }, actorId, actorRole);
  }

  async recordTeacherReviewPacketCreated(schoolId: string, teacherReviewPacketId: string, actorId: string, actorRole: string, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, 'TEACHER_REVIEW_PACKET_CREATED', 'allowed', 'Teacher review packet created', { teacherReviewPacketId }, actorId, actorRole, undefined, undefined, requestId, correlationId);
  }

  async recordTeacherReviewPacketReviewReady(schoolId: string, teacherReviewPacketId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'TEACHER_REVIEW_PACKET_REVIEW_READY', 'allowed', 'Teacher review packet review ready', { teacherReviewPacketId }, actorId, actorRole);
  }

  async recordTeacherReviewPacketApprovedForFutureUse(schoolId: string, teacherReviewPacketId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'TEACHER_REVIEW_PACKET_APPROVED', 'allowed', 'Teacher review packet approved for future use', { teacherReviewPacketId }, actorId, actorRole);
  }

  async recordStudentNextStepDraftCreated(schoolId: string, studentNextStepDraftId: string, actorId: string, actorRole: string, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, 'STUDENT_NEXT_STEP_DRAFT_CREATED', 'allowed', 'Student next-step draft created', { studentNextStepDraftId }, actorId, actorRole, undefined, undefined, requestId, correlationId);
  }

  async recordStudentNextStepDraftReviewReady(schoolId: string, studentNextStepDraftId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'STUDENT_NEXT_STEP_DRAFT_REVIEW_READY', 'allowed', 'Student next-step draft review ready', { studentNextStepDraftId }, actorId, actorRole);
  }

  async recordStudentNextStepDraftApprovedForFutureUse(schoolId: string, studentNextStepDraftId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'STUDENT_NEXT_STEP_DRAFT_APPROVED', 'allowed', 'Student next-step draft approved for future use', { studentNextStepDraftId }, actorId, actorRole);
  }

  async recordParentUpdateDraftCreated(schoolId: string, parentUpdateDraftId: string, actorId: string, actorRole: string, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, 'PARENT_UPDATE_DRAFT_CREATED', 'allowed', 'Parent update draft created', { parentUpdateDraftId }, actorId, actorRole, undefined, undefined, requestId, correlationId);
  }

  async recordParentUpdateDraftReviewReady(schoolId: string, parentUpdateDraftId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'PARENT_UPDATE_DRAFT_REVIEW_READY', 'allowed', 'Parent update draft review ready', { parentUpdateDraftId }, actorId, actorRole);
  }

  async recordParentUpdateDraftApprovedForFutureUse(schoolId: string, parentUpdateDraftId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'PARENT_UPDATE_DRAFT_APPROVED', 'allowed', 'Parent update draft approved for future use', { parentUpdateDraftId }, actorId, actorRole);
  }

  async recordOutcomeDecisionSummaryCreated(schoolId: string, decisionSummaryId: string, actorId: string, actorRole: string, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, 'OUTCOME_DECISION_SUMMARY_CREATED', 'allowed', 'Outcome decision summary created', { decisionSummaryId }, actorId, actorRole, undefined, undefined, requestId, correlationId);
  }

  async recordOutcomeDecisionSummaryRefreshed(schoolId: string, decisionSummaryId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'OUTCOME_DECISION_SUMMARY_REFRESHED', 'allowed', 'Outcome decision summary refreshed', { decisionSummaryId }, actorId, actorRole);
  }

  async recordOutcomeDecisionSummaryStale(schoolId: string, decisionSummaryId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'OUTCOME_DECISION_SUMMARY_STALE', 'allowed', 'Outcome decision summary marked stale', { decisionSummaryId }, actorId, actorRole);
  }

  async recordPolicyBlocked(schoolId: string, eventType: string, actorId: string, actorRole: string, reasonCodes?: Record<string, unknown>, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, eventType, 'denied', 'Policy blocked outcome operation', {}, actorId, actorRole, reasonCodes, undefined, requestId, correlationId);
  }

  async recordSafeError(schoolId: string, eventType: string, actorId: string, actorRole: string, safeSummary: string, reasonCodes?: Record<string, unknown>, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, eventType, 'error', safeSummary, {}, actorId, actorRole, reasonCodes, undefined, requestId, correlationId);
  }
}
