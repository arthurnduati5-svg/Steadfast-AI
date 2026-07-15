import {
  RecoveryOutcomeDecisionReadiness,
  RecoveryOutcomeDecisionReadinessCreateRequest,
} from './recoveryOutcomeDecisionReadinessContracts';
import {
  RecoveryExitCriteria,
  RecoveryExitCriteriaCreateRequest,
} from './recoveryExitCriteriaContracts';
import {
  RecoveryContinuationDecisionDraft,
  RecoveryIntensificationDecisionDraft,
  RecoveryPauseDecisionDraft,
  RecoveryClosureDecisionDraft,
  DecisionDraftCreateRequest,
} from './recoveryDecisionDraftContracts';
import {
  RecoveryOutcomeTeacherReviewPacket,
  RecoveryOutcomeTeacherReviewPacketCreateRequest,
} from './recoveryOutcomeTeacherReviewPacketContracts';
import {
  RecoveryOutcomeStudentNextStepDraft,
  RecoveryOutcomeStudentNextStepDraftCreateRequest,
} from './recoveryOutcomeStudentNextStepDraftContracts';
import {
  RecoveryOutcomeParentUpdateDraft,
  RecoveryOutcomeParentUpdateDraftCreateRequest,
} from './recoveryOutcomeParentUpdateDraftContracts';
import {
  RecoveryOutcomeDecisionSummary,
  RecoveryOutcomeDecisionSummaryCreateRequest,
} from './recoveryOutcomeSummaryContracts';
import {
  RecoveryOutcomeAuditEvent,
  RecoveryOutcomeIdempotencyEntry,
} from './recoveryOutcomeContracts';

export interface RecoveryOutcomeDecisionReadinessRepository {
  create(data: RecoveryOutcomeDecisionReadinessCreateRequest & { createdByActorId: string; createdByRole: string }): Promise<RecoveryOutcomeDecisionReadiness>;
  getById(id: string): Promise<RecoveryOutcomeDecisionReadiness | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeDecisionReadiness[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeDecisionReadiness[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeDecisionReadiness[]>;
  listByProgressSummaryId(progressSummaryId: string): Promise<RecoveryOutcomeDecisionReadiness[]>;
  listByEvidenceRollupId(evidenceRollupId: string): Promise<RecoveryOutcomeDecisionReadiness[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryOutcomeDecisionReadiness[]>;
  update(id: string, data: Partial<RecoveryOutcomeDecisionReadiness>): Promise<RecoveryOutcomeDecisionReadiness>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeDecisionReadiness>;
}

export interface RecoveryExitCriteriaRepository {
  create(data: RecoveryExitCriteriaCreateRequest & { createdByActorId: string; createdByRole: string }): Promise<RecoveryExitCriteria>;
  getById(id: string): Promise<RecoveryExitCriteria | null>;
  listBySchool(schoolId: string): Promise<RecoveryExitCriteria[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryExitCriteria[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryExitCriteria[]>;
  listByDecisionType(schoolId: string, type: string): Promise<RecoveryExitCriteria[]>;
  update(id: string, data: Partial<RecoveryExitCriteria>): Promise<RecoveryExitCriteria>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryExitCriteria>;
}

export interface RecoveryContinuationDecisionDraftRepository {
  create(data: DecisionDraftCreateRequest & { createdByActorId: string; createdByRole: string; draftStatus?: string }): Promise<RecoveryContinuationDecisionDraft>;
  getById(id: string): Promise<RecoveryContinuationDecisionDraft | null>;
  listBySchool(schoolId: string): Promise<RecoveryContinuationDecisionDraft[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryContinuationDecisionDraft[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryContinuationDecisionDraft[]>;
  listByProgressSummaryId(progressSummaryId: string): Promise<RecoveryContinuationDecisionDraft[]>;
  listByEvidenceRollupId(evidenceRollupId: string): Promise<RecoveryContinuationDecisionDraft[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryContinuationDecisionDraft[]>;
  update(id: string, data: Partial<RecoveryContinuationDecisionDraft>): Promise<RecoveryContinuationDecisionDraft>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryContinuationDecisionDraft>;
}

export interface RecoveryIntensificationDecisionDraftRepository {
  create(data: DecisionDraftCreateRequest & { createdByActorId: string; createdByRole: string; draftStatus?: string }): Promise<RecoveryIntensificationDecisionDraft>;
  getById(id: string): Promise<RecoveryIntensificationDecisionDraft | null>;
  listBySchool(schoolId: string): Promise<RecoveryIntensificationDecisionDraft[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryIntensificationDecisionDraft[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryIntensificationDecisionDraft[]>;
  listByProgressSummaryId(progressSummaryId: string): Promise<RecoveryIntensificationDecisionDraft[]>;
  listByEvidenceRollupId(evidenceRollupId: string): Promise<RecoveryIntensificationDecisionDraft[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryIntensificationDecisionDraft[]>;
  update(id: string, data: Partial<RecoveryIntensificationDecisionDraft>): Promise<RecoveryIntensificationDecisionDraft>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryIntensificationDecisionDraft>;
}

export interface RecoveryPauseDecisionDraftRepository {
  create(data: DecisionDraftCreateRequest & { createdByActorId: string; createdByRole: string; draftStatus?: string }): Promise<RecoveryPauseDecisionDraft>;
  getById(id: string): Promise<RecoveryPauseDecisionDraft | null>;
  listBySchool(schoolId: string): Promise<RecoveryPauseDecisionDraft[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryPauseDecisionDraft[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryPauseDecisionDraft[]>;
  listByProgressSummaryId(progressSummaryId: string): Promise<RecoveryPauseDecisionDraft[]>;
  listByEvidenceRollupId(evidenceRollupId: string): Promise<RecoveryPauseDecisionDraft[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryPauseDecisionDraft[]>;
  update(id: string, data: Partial<RecoveryPauseDecisionDraft>): Promise<RecoveryPauseDecisionDraft>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryPauseDecisionDraft>;
}

export interface RecoveryClosureDecisionDraftRepository {
  create(data: DecisionDraftCreateRequest & { createdByActorId: string; createdByRole: string; draftStatus?: string }): Promise<RecoveryClosureDecisionDraft>;
  getById(id: string): Promise<RecoveryClosureDecisionDraft | null>;
  listBySchool(schoolId: string): Promise<RecoveryClosureDecisionDraft[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryClosureDecisionDraft[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryClosureDecisionDraft[]>;
  listByProgressSummaryId(progressSummaryId: string): Promise<RecoveryClosureDecisionDraft[]>;
  listByEvidenceRollupId(evidenceRollupId: string): Promise<RecoveryClosureDecisionDraft[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryClosureDecisionDraft[]>;
  listByClosureType(schoolId: string, closureType: string): Promise<RecoveryClosureDecisionDraft[]>;
  update(id: string, data: Partial<RecoveryClosureDecisionDraft>): Promise<RecoveryClosureDecisionDraft>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryClosureDecisionDraft>;
}

export interface RecoveryOutcomeTeacherReviewPacketRepository {
  create(data: RecoveryOutcomeTeacherReviewPacketCreateRequest & { createdByActorId: string; createdByRole: string }): Promise<RecoveryOutcomeTeacherReviewPacket>;
  getById(id: string): Promise<RecoveryOutcomeTeacherReviewPacket | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeTeacherReviewPacket[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeTeacherReviewPacket[]>;
  listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryOutcomeTeacherReviewPacket[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeTeacherReviewPacket[]>;
  listByProgressSummaryId(progressSummaryId: string): Promise<RecoveryOutcomeTeacherReviewPacket[]>;
  listByEvidenceRollupId(evidenceRollupId: string): Promise<RecoveryOutcomeTeacherReviewPacket[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryOutcomeTeacherReviewPacket[]>;
  update(id: string, data: Partial<RecoveryOutcomeTeacherReviewPacket>): Promise<RecoveryOutcomeTeacherReviewPacket>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeTeacherReviewPacket>;
}

export interface RecoveryOutcomeStudentNextStepDraftRepository {
  create(data: RecoveryOutcomeStudentNextStepDraftCreateRequest & { createdByActorId: string; createdByRole: string }): Promise<RecoveryOutcomeStudentNextStepDraft>;
  getById(id: string): Promise<RecoveryOutcomeStudentNextStepDraft | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeStudentNextStepDraft[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeStudentNextStepDraft[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeStudentNextStepDraft[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryOutcomeStudentNextStepDraft[]>;
  update(id: string, data: Partial<RecoveryOutcomeStudentNextStepDraft>): Promise<RecoveryOutcomeStudentNextStepDraft>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeStudentNextStepDraft>;
}

export interface RecoveryOutcomeParentUpdateDraftRepository {
  create(data: RecoveryOutcomeParentUpdateDraftCreateRequest & { createdByActorId: string; createdByRole: string }): Promise<RecoveryOutcomeParentUpdateDraft>;
  getById(id: string): Promise<RecoveryOutcomeParentUpdateDraft | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeParentUpdateDraft[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeParentUpdateDraft[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeParentUpdateDraft[]>;
  listByParentRef(schoolId: string, parentRef: string): Promise<RecoveryOutcomeParentUpdateDraft[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryOutcomeParentUpdateDraft[]>;
  update(id: string, data: Partial<RecoveryOutcomeParentUpdateDraft>): Promise<RecoveryOutcomeParentUpdateDraft>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeParentUpdateDraft>;
}

export interface RecoveryOutcomeDecisionSummaryRepository {
  create(data: RecoveryOutcomeDecisionSummaryCreateRequest & { createdByActorId: string; createdByRole: string }): Promise<RecoveryOutcomeDecisionSummary>;
  getById(id: string): Promise<RecoveryOutcomeDecisionSummary | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeDecisionSummary[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeDecisionSummary[]>;
  listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryOutcomeDecisionSummary[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeDecisionSummary[]>;
  listByProgressSummaryId(progressSummaryId: string): Promise<RecoveryOutcomeDecisionSummary[]>;
  listByEvidenceRollupId(evidenceRollupId: string): Promise<RecoveryOutcomeDecisionSummary[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryOutcomeDecisionSummary[]>;
  update(id: string, data: Partial<RecoveryOutcomeDecisionSummary>): Promise<RecoveryOutcomeDecisionSummary>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeDecisionSummary>;
  refresh(id: string): Promise<RecoveryOutcomeDecisionSummary>;
}

export interface RecoveryOutcomeAuditRepository {
  create(data: RecoveryOutcomeAuditEvent): Promise<RecoveryOutcomeAuditEvent>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeAuditEvent[]>;
}

export interface RecoveryOutcomeIdempotencyRepository {
  create(data: RecoveryOutcomeIdempotencyEntry): Promise<RecoveryOutcomeIdempotencyEntry>;
  getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<RecoveryOutcomeIdempotencyEntry | null>;
  updateStatus(id: string, status: string, safeResultSummary?: string): Promise<RecoveryOutcomeIdempotencyEntry>;
  expire(recoveryOutcomeIdempotencyId: string): Promise<RecoveryOutcomeIdempotencyEntry>;
}
