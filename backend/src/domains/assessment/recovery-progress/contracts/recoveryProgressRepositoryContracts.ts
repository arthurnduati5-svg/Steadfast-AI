import {
  RecoveryProgressObservation, RecoveryCheckpointEvaluation, RecoveryOutcomeEvidence,
  RecoveryPlanAdjustmentDraft, RecoveryTeacherReviewDecision,
  RecoveryStudentProgressReflectionDraft, RecoveryParentProgressNoteDraft,
  RecoveryEvidenceRollup, RecoveryProgressSummary, RecoveryProgressAuditEvent,
  RecoveryProgressIdempotencyEntry,
} from './recoveryProgressContracts';

export interface RecoveryProgressObservationRepository {
  create(data: RecoveryProgressObservation): Promise<RecoveryProgressObservation>;
  getById(id: string): Promise<RecoveryProgressObservation | null>;
  listBySchool(schoolId: string): Promise<RecoveryProgressObservation[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryProgressObservation[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryProgressObservation[]>;
  listByCheckpointId(schoolId: string, checkpointId: string): Promise<RecoveryProgressObservation[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryProgressObservation[]>;
  listByType(schoolId: string, type: string): Promise<RecoveryProgressObservation[]>;
  update(id: string, data: Partial<RecoveryProgressObservation>): Promise<RecoveryProgressObservation>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryProgressObservation>;
}

export interface RecoveryCheckpointEvaluationRepository {
  create(data: RecoveryCheckpointEvaluation): Promise<RecoveryCheckpointEvaluation>;
  getById(id: string): Promise<RecoveryCheckpointEvaluation | null>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryCheckpointEvaluation[]>;
  listByCheckpointId(schoolId: string, checkpointId: string): Promise<RecoveryCheckpointEvaluation[]>;
  listByObservationId(observationId: string): Promise<RecoveryCheckpointEvaluation[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryCheckpointEvaluation[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryCheckpointEvaluation[]>;
  listByResult(schoolId: string, result: string): Promise<RecoveryCheckpointEvaluation[]>;
  update(id: string, data: Partial<RecoveryCheckpointEvaluation>): Promise<RecoveryCheckpointEvaluation>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryCheckpointEvaluation>;
}

export interface RecoveryOutcomeEvidenceRepository {
  create(data: RecoveryOutcomeEvidence): Promise<RecoveryOutcomeEvidence>;
  getById(id: string): Promise<RecoveryOutcomeEvidence | null>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeEvidence[]>;
  listByObjectiveId(schoolId: string, objectiveId: string): Promise<RecoveryOutcomeEvidence[]>;
  listByObservationId(observationId: string): Promise<RecoveryOutcomeEvidence[]>;
  listByEvaluationId(evaluationId: string): Promise<RecoveryOutcomeEvidence[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeEvidence[]>;
  update(id: string, data: Partial<RecoveryOutcomeEvidence>): Promise<RecoveryOutcomeEvidence>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeEvidence>;
}

export interface RecoveryPlanAdjustmentDraftRepository {
  create(data: RecoveryPlanAdjustmentDraft): Promise<RecoveryPlanAdjustmentDraft>;
  getById(id: string): Promise<RecoveryPlanAdjustmentDraft | null>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryPlanAdjustmentDraft[]>;
  listByObservationId(observationId: string): Promise<RecoveryPlanAdjustmentDraft[]>;
  listByEvaluationId(evaluationId: string): Promise<RecoveryPlanAdjustmentDraft[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryPlanAdjustmentDraft[]>;
  update(id: string, data: Partial<RecoveryPlanAdjustmentDraft>): Promise<RecoveryPlanAdjustmentDraft>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryPlanAdjustmentDraft>;
}

export interface RecoveryTeacherReviewDecisionRepository {
  create(data: RecoveryTeacherReviewDecision): Promise<RecoveryTeacherReviewDecision>;
  getById(id: string): Promise<RecoveryTeacherReviewDecision | null>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryTeacherReviewDecision[]>;
  listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryTeacherReviewDecision[]>;
  listByAdjustmentDraftId(adjustmentDraftId: string): Promise<RecoveryTeacherReviewDecision[]>;
  listByEvaluationId(evaluationId: string): Promise<RecoveryTeacherReviewDecision[]>;
  update(id: string, data: Partial<RecoveryTeacherReviewDecision>): Promise<RecoveryTeacherReviewDecision>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryTeacherReviewDecision>;
}

export interface RecoveryStudentProgressReflectionDraftRepository {
  create(data: RecoveryStudentProgressReflectionDraft): Promise<RecoveryStudentProgressReflectionDraft>;
  getById(id: string): Promise<RecoveryStudentProgressReflectionDraft | null>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryStudentProgressReflectionDraft[]>;
  listByObservationId(observationId: string): Promise<RecoveryStudentProgressReflectionDraft[]>;
  listByEvaluationId(evaluationId: string): Promise<RecoveryStudentProgressReflectionDraft[]>;
  update(id: string, data: Partial<RecoveryStudentProgressReflectionDraft>): Promise<RecoveryStudentProgressReflectionDraft>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryStudentProgressReflectionDraft>;
}

export interface RecoveryParentProgressNoteDraftRepository {
  create(data: RecoveryParentProgressNoteDraft): Promise<RecoveryParentProgressNoteDraft>;
  getById(id: string): Promise<RecoveryParentProgressNoteDraft | null>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryParentProgressNoteDraft[]>;
  listByObservationId(observationId: string): Promise<RecoveryParentProgressNoteDraft[]>;
  listByEvaluationId(evaluationId: string): Promise<RecoveryParentProgressNoteDraft[]>;
  update(id: string, data: Partial<RecoveryParentProgressNoteDraft>): Promise<RecoveryParentProgressNoteDraft>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryParentProgressNoteDraft>;
}

export interface RecoveryEvidenceRollupRepository {
  create(data: RecoveryEvidenceRollup): Promise<RecoveryEvidenceRollup>;
  getById(id: string): Promise<RecoveryEvidenceRollup | null>;
  listBySchool(schoolId: string): Promise<RecoveryEvidenceRollup[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryEvidenceRollup[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryEvidenceRollup[]>;
  listByScope(schoolId: string, scope: string): Promise<RecoveryEvidenceRollup[]>;
  update(id: string, data: Partial<RecoveryEvidenceRollup>): Promise<RecoveryEvidenceRollup>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryEvidenceRollup>;
}

export interface RecoveryProgressSummaryRepository {
  create(data: RecoveryProgressSummary): Promise<RecoveryProgressSummary>;
  getById(id: string): Promise<RecoveryProgressSummary | null>;
  listBySchool(schoolId: string): Promise<RecoveryProgressSummary[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryProgressSummary[]>;
  listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryProgressSummary[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryProgressSummary[]>;
  listByScope(schoolId: string, scope: string): Promise<RecoveryProgressSummary[]>;
  update(id: string, data: Partial<RecoveryProgressSummary>): Promise<RecoveryProgressSummary>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryProgressSummary>;
}

export interface RecoveryProgressAuditRepository {
  create(data: RecoveryProgressAuditEvent): Promise<RecoveryProgressAuditEvent>;
  listBySchool(schoolId: string): Promise<RecoveryProgressAuditEvent[]>;
}

export interface RecoveryProgressIdempotencyRepository {
  create(data: RecoveryProgressIdempotencyEntry): Promise<RecoveryProgressIdempotencyEntry>;
  getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<RecoveryProgressIdempotencyEntry | null>;
  updateStatus(id: string, status: string, resourceId?: string, resultSummary?: string): Promise<RecoveryProgressIdempotencyEntry>;
  expire(recoveryProgressIdempotencyId: string): Promise<RecoveryProgressIdempotencyEntry>;
}
