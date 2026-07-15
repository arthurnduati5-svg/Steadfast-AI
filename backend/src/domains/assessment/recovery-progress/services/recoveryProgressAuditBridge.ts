import { randomUUID } from 'crypto';
import type { RecoveryProgressAuditEvent, RecoveryProgressCommandContext } from '../contracts/recoveryProgressContracts';

export interface ProgressAuditEvent {
  recoveryProgressAuditId: string;
  schoolId: string;
  recoveryProgressObservationId: string | null;
  recoveryCheckpointEvaluationId: string | null;
  recoveryOutcomeEvidenceId: string | null;
  recoveryPlanAdjustmentDraftId: string | null;
  recoveryTeacherReviewDecisionId: string | null;
  recoveryStudentProgressReflectionDraftId: string | null;
  recoveryParentProgressNoteDraftId: string | null;
  recoveryEvidenceRollupId: string | null;
  recoveryProgressSummaryId: string | null;
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

export interface ProgressAuditRepository {
  create(event: ProgressAuditEvent): Promise<ProgressAuditEvent>;
  listBySchool(schoolId: string): Promise<ProgressAuditEvent[]>;
}

export class RecoveryProgressAuditBridge {
  constructor(private auditRepo: ProgressAuditRepository) {}

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
    const event: ProgressAuditEvent = {
      recoveryProgressAuditId: randomUUID(),
      schoolId,
      recoveryProgressObservationId: refs.observationId || null,
      recoveryCheckpointEvaluationId: refs.evaluationId || null,
      recoveryOutcomeEvidenceId: refs.evidenceId || null,
      recoveryPlanAdjustmentDraftId: refs.adjustmentDraftId || null,
      recoveryTeacherReviewDecisionId: refs.teacherReviewDecisionId || null,
      recoveryStudentProgressReflectionDraftId: refs.reflectionDraftId || null,
      recoveryParentProgressNoteDraftId: refs.parentNoteDraftId || null,
      recoveryEvidenceRollupId: refs.rollupId || null,
      recoveryProgressSummaryId: refs.summaryId || null,
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

  async recordObservationCreated(schoolId: string, observationId: string, actorId: string, actorRole: string, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, 'PROGRESS_OBSERVATION_CREATED', 'allowed', 'Progress observation created', { observationId }, actorId, actorRole, undefined, undefined, requestId, correlationId);
  }

  async recordObservationReviewReady(schoolId: string, observationId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'PROGRESS_OBSERVATION_REVIEW_READY', 'allowed', 'Progress observation review ready', { observationId }, actorId, actorRole);
  }

  async recordObservationApprovedForFutureUse(schoolId: string, observationId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'PROGRESS_OBSERVATION_APPROVED_FOR_FUTURE_USE', 'allowed', 'Progress observation approved for future use', { observationId }, actorId, actorRole);
  }

  async recordCheckpointEvaluationCreated(schoolId: string, evaluationId: string, actorId: string, actorRole: string, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, 'CHECKPOINT_EVALUATION_CREATED', 'allowed', 'Checkpoint evaluation created', { evaluationId }, actorId, actorRole, undefined, undefined, requestId, correlationId);
  }

  async recordCheckpointEvaluationReviewReady(schoolId: string, evaluationId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'CHECKPOINT_EVALUATION_REVIEW_READY', 'allowed', 'Checkpoint evaluation review ready', { evaluationId }, actorId, actorRole);
  }

  async recordCheckpointEvaluationApproved(schoolId: string, evaluationId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'CHECKPOINT_EVALUATION_APPROVED', 'allowed', 'Checkpoint evaluation approved', { evaluationId }, actorId, actorRole);
  }

  async recordOutcomeEvidenceCreated(schoolId: string, evidenceId: string, actorId: string, actorRole: string, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, 'OUTCOME_EVIDENCE_CREATED', 'allowed', 'Outcome evidence created', { evidenceId }, actorId, actorRole, undefined, undefined, requestId, correlationId);
  }

  async recordOutcomeEvidenceReviewReady(schoolId: string, evidenceId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'OUTCOME_EVIDENCE_REVIEW_READY', 'allowed', 'Outcome evidence review ready', { evidenceId }, actorId, actorRole);
  }

  async recordOutcomeEvidenceApproved(schoolId: string, evidenceId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'OUTCOME_EVIDENCE_APPROVED', 'allowed', 'Outcome evidence approved', { evidenceId }, actorId, actorRole);
  }

  async recordPlanAdjustmentDraftCreated(schoolId: string, adjustmentDraftId: string, actorId: string, actorRole: string, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, 'PLAN_ADJUSTMENT_DRAFT_CREATED', 'allowed', 'Plan adjustment draft created', { adjustmentDraftId }, actorId, actorRole, undefined, undefined, requestId, correlationId);
  }

  async recordPlanAdjustmentDraftReviewReady(schoolId: string, adjustmentDraftId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'PLAN_ADJUSTMENT_DRAFT_REVIEW_READY', 'allowed', 'Plan adjustment draft review ready', { adjustmentDraftId }, actorId, actorRole);
  }

  async recordTeacherReviewDecisionCreated(schoolId: string, decisionId: string, actorId: string, actorRole: string, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, 'TEACHER_REVIEW_DECISION_CREATED', 'allowed', 'Teacher review decision created', { teacherReviewDecisionId: decisionId }, actorId, actorRole, undefined, undefined, requestId, correlationId);
  }

  async recordReflectionDraftCreated(schoolId: string, reflectionDraftId: string, actorId: string, actorRole: string, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, 'REFLECTION_DRAFT_CREATED', 'allowed', 'Reflection draft created', { reflectionDraftId }, actorId, actorRole, undefined, undefined, requestId, correlationId);
  }

  async recordParentNoteDraftCreated(schoolId: string, parentNoteDraftId: string, actorId: string, actorRole: string, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, 'PARENT_NOTE_DRAFT_CREATED', 'allowed', 'Parent note draft created', { parentNoteDraftId }, actorId, actorRole, undefined, undefined, requestId, correlationId);
  }

  async recordEvidenceRollupCreated(schoolId: string, rollupId: string, actorId: string, actorRole: string, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, 'EVIDENCE_ROLLUP_CREATED', 'allowed', 'Evidence rollup created', { rollupId }, actorId, actorRole, undefined, undefined, requestId, correlationId);
  }

  async recordEvidenceRollupRefreshed(schoolId: string, rollupId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'EVIDENCE_ROLLUP_REFRESHED', 'allowed', 'Evidence rollup refreshed', { rollupId }, actorId, actorRole);
  }

  async recordProgressSummaryCreated(schoolId: string, summaryId: string, actorId: string, actorRole: string, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, 'PROGRESS_SUMMARY_CREATED', 'allowed', 'Progress summary created', { summaryId }, actorId, actorRole, undefined, undefined, requestId, correlationId);
  }

  async recordProgressSummaryRefreshed(schoolId: string, summaryId: string, actorId: string, actorRole: string): Promise<void> {
    await this.record(schoolId, 'PROGRESS_SUMMARY_REFRESHED', 'allowed', 'Progress summary refreshed', { summaryId }, actorId, actorRole);
  }

  async recordPolicyBlocked(schoolId: string, eventType: string, actorId: string, actorRole: string, reasonCodes?: Record<string, unknown>, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, eventType, 'denied', 'Policy blocked progress operation', {}, actorId, actorRole, reasonCodes, undefined, requestId, correlationId);
  }

  async recordSafeError(schoolId: string, eventType: string, actorId: string, actorRole: string, safeSummary: string, reasonCodes?: Record<string, unknown>, requestId?: string, correlationId?: string): Promise<void> {
    await this.record(schoolId, eventType, 'error', safeSummary, {}, actorId, actorRole, reasonCodes, undefined, requestId, correlationId);
  }
}
