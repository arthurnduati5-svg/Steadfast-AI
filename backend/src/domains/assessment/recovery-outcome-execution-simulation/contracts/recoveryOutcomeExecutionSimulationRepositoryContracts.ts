import { RecoveryOutcomeExecutionSimulationReadiness } from './recoveryOutcomeExecutionSimulationReadinessContracts';
import { RecoveryOutcomeExecutionSimulationPlan } from './recoveryOutcomeExecutionSimulationPlanContracts';
import { RecoveryOutcomeExecutionSimulationRun } from './recoveryOutcomeExecutionSimulationRunContracts';
import { RecoveryOutcomeExecutionSimulationStep } from './recoveryOutcomeExecutionSimulationStepContracts';
import { RecoveryOutcomeExecutionEligibilityCheck } from './recoveryOutcomeExecutionEligibilityContracts';
import { RecoveryOutcomeExecutionBlockedActionDiagnostic } from './recoveryOutcomeExecutionBlockedActionDiagnosticContracts';
import { RecoveryOutcomeExecutionFailureInjection } from './recoveryOutcomeExecutionFailureInjectionContracts';
import { RecoveryOutcomeExecutionSimulationResult } from './recoveryOutcomeExecutionSimulationResultContracts';
import { RecoveryOutcomeExecutionTeacherReview } from './recoveryOutcomeExecutionTeacherReviewContracts';
import { RecoveryOutcomeExecutionStudentPreviewDraft, RecoveryOutcomeExecutionParentPreviewDraft } from './recoveryOutcomeExecutionPreviewDraftContracts';
import { RecoveryOutcomeExecutionReadinessVerdict } from './recoveryOutcomeExecutionReadinessVerdictContracts';
import { RecoveryOutcomeExecutionSimulationSummary } from './recoveryOutcomeExecutionSimulationSummaryContracts';
import { RecoveryOutcomeExecutionSimulationSafeEnvelope } from './recoveryOutcomeExecutionSimulationContracts';

export interface ISimulationReadinessRepository {
  create(data: Partial<RecoveryOutcomeExecutionSimulationReadiness>): Promise<RecoveryOutcomeExecutionSimulationReadiness>;
  getById(id: string): Promise<RecoveryOutcomeExecutionSimulationReadiness | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationReadiness[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionSimulationReadiness[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationReadiness[]>;
  listByStatus(schoolId: string, readinessStatus: string): Promise<RecoveryOutcomeExecutionSimulationReadiness[]>;
  update(id: string, data: Partial<RecoveryOutcomeExecutionSimulationReadiness>): Promise<RecoveryOutcomeExecutionSimulationReadiness>;
  updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionSimulationReadiness>;
  markReviewReady(id: string): Promise<RecoveryOutcomeExecutionSimulationReadiness>;
  approveForFutureUse(id: string): Promise<RecoveryOutcomeExecutionSimulationReadiness>;
  suppress(id: string): Promise<RecoveryOutcomeExecutionSimulationReadiness>;
  block(id: string): Promise<RecoveryOutcomeExecutionSimulationReadiness>;
  void(id: string): Promise<RecoveryOutcomeExecutionSimulationReadiness>;
}

export interface ISimulationPlanRepository {
  create(data: Partial<RecoveryOutcomeExecutionSimulationPlan>): Promise<RecoveryOutcomeExecutionSimulationPlan>;
  getById(id: string): Promise<RecoveryOutcomeExecutionSimulationPlan | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationPlan[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionSimulationPlan[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationPlan[]>;
  listByStatus(schoolId: string, planStatus: string): Promise<RecoveryOutcomeExecutionSimulationPlan[]>;
  listByActionBundleId(schoolId: string, bundleId: string): Promise<RecoveryOutcomeExecutionSimulationPlan[]>;
  listBySimulationPlanId(schoolId: string, simulationPlanId: string): Promise<RecoveryOutcomeExecutionSimulationPlan[]>;
  update(id: string, data: Partial<RecoveryOutcomeExecutionSimulationPlan>): Promise<RecoveryOutcomeExecutionSimulationPlan>;
  updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionSimulationPlan>;
  markReviewReady(id: string): Promise<RecoveryOutcomeExecutionSimulationPlan>;
  approveForFutureUse(id: string): Promise<RecoveryOutcomeExecutionSimulationPlan>;
  suppress(id: string): Promise<RecoveryOutcomeExecutionSimulationPlan>;
  block(id: string): Promise<RecoveryOutcomeExecutionSimulationPlan>;
  void(id: string): Promise<RecoveryOutcomeExecutionSimulationPlan>;
}

export interface ISimulationRunRepository {
  create(data: Partial<RecoveryOutcomeExecutionSimulationRun>): Promise<RecoveryOutcomeExecutionSimulationRun>;
  getById(id: string): Promise<RecoveryOutcomeExecutionSimulationRun | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationRun[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionSimulationRun[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationRun[]>;
  listByStatus(schoolId: string, runStatus: string): Promise<RecoveryOutcomeExecutionSimulationRun[]>;
  listByActionBundleId(schoolId: string, bundleId: string): Promise<RecoveryOutcomeExecutionSimulationRun[]>;
  listBySimulationPlanId(schoolId: string, simulationPlanId: string): Promise<RecoveryOutcomeExecutionSimulationRun[]>;
  update(id: string, data: Partial<RecoveryOutcomeExecutionSimulationRun>): Promise<RecoveryOutcomeExecutionSimulationRun>;
  updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionSimulationRun>;
  markReviewReady(id: string): Promise<RecoveryOutcomeExecutionSimulationRun>;
  suppress(id: string): Promise<RecoveryOutcomeExecutionSimulationRun>;
  block(id: string): Promise<RecoveryOutcomeExecutionSimulationRun>;
  void(id: string): Promise<RecoveryOutcomeExecutionSimulationRun>;
}

export interface ISimulationStepRepository {
  create(data: Partial<RecoveryOutcomeExecutionSimulationStep>): Promise<RecoveryOutcomeExecutionSimulationStep>;
  getById(id: string): Promise<RecoveryOutcomeExecutionSimulationStep | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationStep[]>;
  listStepsForSimulationRun(simulationRunId: string): Promise<RecoveryOutcomeExecutionSimulationStep[]>;
  listByStatus(schoolId: string, stepStatus: string): Promise<RecoveryOutcomeExecutionSimulationStep[]>;
  update(id: string, data: Partial<RecoveryOutcomeExecutionSimulationStep>): Promise<RecoveryOutcomeExecutionSimulationStep>;
  updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionSimulationStep>;
  block(id: string): Promise<RecoveryOutcomeExecutionSimulationStep>;
  void(id: string): Promise<RecoveryOutcomeExecutionSimulationStep>;
}

export interface IEligibilityCheckRepository {
  create(data: Partial<RecoveryOutcomeExecutionEligibilityCheck>): Promise<RecoveryOutcomeExecutionEligibilityCheck>;
  getById(id: string): Promise<RecoveryOutcomeExecutionEligibilityCheck | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionEligibilityCheck[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionEligibilityCheck[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionEligibilityCheck[]>;
  listByActionBundleId(schoolId: string, bundleId: string): Promise<RecoveryOutcomeExecutionEligibilityCheck[]>;
  listByResult(schoolId: string, eligibilityStatus: string): Promise<RecoveryOutcomeExecutionEligibilityCheck[]>;
  listByStatus(schoolId: string, eligibilityStatus: string): Promise<RecoveryOutcomeExecutionEligibilityCheck[]>;
  update(id: string, data: Partial<RecoveryOutcomeExecutionEligibilityCheck>): Promise<RecoveryOutcomeExecutionEligibilityCheck>;
  updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionEligibilityCheck>;
  markReviewReady(id: string): Promise<RecoveryOutcomeExecutionEligibilityCheck>;
  void(id: string): Promise<RecoveryOutcomeExecutionEligibilityCheck>;
}

export interface IBlockedActionDiagnosticRepository {
  create(data: Partial<RecoveryOutcomeExecutionBlockedActionDiagnostic>): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic>;
  getById(id: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic[]>;
  listBySimulationRunId(simulationRunId: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic[]>;
  listByReason(schoolId: string, reasonCode: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic[]>;
  listByStatus(schoolId: string, diagnosticStatus: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic[]>;
  update(id: string, data: Partial<RecoveryOutcomeExecutionBlockedActionDiagnostic>): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic>;
  updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic>;
  markReviewReady(id: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic>;
  suppress(id: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic>;
  void(id: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic>;
}

export interface IFailureInjectionRepository {
  create(data: Partial<RecoveryOutcomeExecutionFailureInjection>): Promise<RecoveryOutcomeExecutionFailureInjection>;
  getById(id: string): Promise<RecoveryOutcomeExecutionFailureInjection | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionFailureInjection[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionFailureInjection[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionFailureInjection[]>;
  listByType(schoolId: string, injectionType: string): Promise<RecoveryOutcomeExecutionFailureInjection[]>;
  listByStatus(schoolId: string, injectionStatus: string): Promise<RecoveryOutcomeExecutionFailureInjection[]>;
  update(id: string, data: Partial<RecoveryOutcomeExecutionFailureInjection>): Promise<RecoveryOutcomeExecutionFailureInjection>;
  updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionFailureInjection>;
  markReviewReady(id: string): Promise<RecoveryOutcomeExecutionFailureInjection>;
  approveForFutureUse(id: string): Promise<RecoveryOutcomeExecutionFailureInjection>;
  suppress(id: string): Promise<RecoveryOutcomeExecutionFailureInjection>;
  block(id: string): Promise<RecoveryOutcomeExecutionFailureInjection>;
  void(id: string): Promise<RecoveryOutcomeExecutionFailureInjection>;
}

export interface ISimulationResultRepository {
  create(data: Partial<RecoveryOutcomeExecutionSimulationResult>): Promise<RecoveryOutcomeExecutionSimulationResult>;
  getById(id: string): Promise<RecoveryOutcomeExecutionSimulationResult | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationResult[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionSimulationResult[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationResult[]>;
  listBySimulationRunId(simulationRunId: string): Promise<RecoveryOutcomeExecutionSimulationResult[]>;
  listByOutcome(schoolId: string, outcomeStatus: string): Promise<RecoveryOutcomeExecutionSimulationResult[]>;
  update(id: string, data: Partial<RecoveryOutcomeExecutionSimulationResult>): Promise<RecoveryOutcomeExecutionSimulationResult>;
  updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionSimulationResult>;
  markReviewReady(id: string): Promise<RecoveryOutcomeExecutionSimulationResult>;
  void(id: string): Promise<RecoveryOutcomeExecutionSimulationResult>;
}

export interface ITeacherReviewRepository {
  create(data: Partial<RecoveryOutcomeExecutionTeacherReview>): Promise<RecoveryOutcomeExecutionTeacherReview>;
  getById(id: string): Promise<RecoveryOutcomeExecutionTeacherReview | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionTeacherReview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionTeacherReview[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionTeacherReview[]>;
  listBySimulationRunId(simulationRunId: string): Promise<RecoveryOutcomeExecutionTeacherReview[]>;
  listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryOutcomeExecutionTeacherReview[]>;
  listByStatus(schoolId: string, reviewStatus: string): Promise<RecoveryOutcomeExecutionTeacherReview[]>;
  update(id: string, data: Partial<RecoveryOutcomeExecutionTeacherReview>): Promise<RecoveryOutcomeExecutionTeacherReview>;
  updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionTeacherReview>;
  markReviewReady(id: string): Promise<RecoveryOutcomeExecutionTeacherReview>;
  approveForFutureUse(id: string): Promise<RecoveryOutcomeExecutionTeacherReview>;
  suppress(id: string): Promise<RecoveryOutcomeExecutionTeacherReview>;
  block(id: string): Promise<RecoveryOutcomeExecutionTeacherReview>;
  void(id: string): Promise<RecoveryOutcomeExecutionTeacherReview>;
}

export interface IStudentPreviewDraftRepository {
  create(data: Partial<RecoveryOutcomeExecutionStudentPreviewDraft>): Promise<RecoveryOutcomeExecutionStudentPreviewDraft>;
  getById(id: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft[]>;
  listByStatus(schoolId: string, draftStatus: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft[]>;
  update(id: string, data: Partial<RecoveryOutcomeExecutionStudentPreviewDraft>): Promise<RecoveryOutcomeExecutionStudentPreviewDraft>;
  updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft>;
  markReviewReady(id: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft>;
  approveForFutureUse(id: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft>;
  suppress(id: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft>;
  block(id: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft>;
  void(id: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft>;
}

export interface IParentPreviewDraftRepository {
  create(data: Partial<RecoveryOutcomeExecutionParentPreviewDraft>): Promise<RecoveryOutcomeExecutionParentPreviewDraft>;
  getById(id: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft[]>;
  listByStatus(schoolId: string, draftStatus: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft[]>;
  update(id: string, data: Partial<RecoveryOutcomeExecutionParentPreviewDraft>): Promise<RecoveryOutcomeExecutionParentPreviewDraft>;
  updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft>;
  markReviewReady(id: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft>;
  approveForFutureUse(id: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft>;
  suppress(id: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft>;
  block(id: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft>;
  void(id: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft>;
}

export interface IReadinessVerdictRepository {
  create(data: Partial<RecoveryOutcomeExecutionReadinessVerdict>): Promise<RecoveryOutcomeExecutionReadinessVerdict>;
  getById(id: string): Promise<RecoveryOutcomeExecutionReadinessVerdict | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionReadinessVerdict[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionReadinessVerdict[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionReadinessVerdict[]>;
  listBySimulationRunId(simulationRunId: string): Promise<RecoveryOutcomeExecutionReadinessVerdict[]>;
  listByStatus(schoolId: string, verdictStatus: string): Promise<RecoveryOutcomeExecutionReadinessVerdict[]>;
  update(id: string, data: Partial<RecoveryOutcomeExecutionReadinessVerdict>): Promise<RecoveryOutcomeExecutionReadinessVerdict>;
  updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionReadinessVerdict>;
  markReviewReady(id: string): Promise<RecoveryOutcomeExecutionReadinessVerdict>;
  approveForFutureUse(id: string): Promise<RecoveryOutcomeExecutionReadinessVerdict>;
  suppress(id: string): Promise<RecoveryOutcomeExecutionReadinessVerdict>;
  block(id: string): Promise<RecoveryOutcomeExecutionReadinessVerdict>;
  void(id: string): Promise<RecoveryOutcomeExecutionReadinessVerdict>;
}

export interface ISimulationSummaryRepository {
  create(data: Partial<RecoveryOutcomeExecutionSimulationSummary>): Promise<RecoveryOutcomeExecutionSimulationSummary>;
  getById(id: string): Promise<RecoveryOutcomeExecutionSimulationSummary | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationSummary[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionSimulationSummary[]>;
  listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryOutcomeExecutionSimulationSummary[]>;
  listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationSummary[]>;
  listByStatus(schoolId: string, summaryStatus: string): Promise<RecoveryOutcomeExecutionSimulationSummary[]>;
  update(id: string, data: Partial<RecoveryOutcomeExecutionSimulationSummary>): Promise<RecoveryOutcomeExecutionSimulationSummary>;
  updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionSimulationSummary>;
  refresh(id: string): Promise<RecoveryOutcomeExecutionSimulationSummary>;
  markStale(id: string): Promise<RecoveryOutcomeExecutionSimulationSummary>;
  block(id: string): Promise<RecoveryOutcomeExecutionSimulationSummary>;
  void(id: string): Promise<RecoveryOutcomeExecutionSimulationSummary>;
}

export interface ISimulationAuditRepository {
  create(data: Partial<RecoveryOutcomeExecutionSimulationAuditRecord>): Promise<RecoveryOutcomeExecutionSimulationAuditRecord>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationAuditRecord[]>;
}

export interface ISimulationIdempotencyRepository {
  findByIdempotencyKey(schoolId: string, operation: string, idempotencyKey: string): Promise<RecoveryOutcomeExecutionSimulationIdempotencyRecord | null>;
  create(data: Partial<RecoveryOutcomeExecutionSimulationIdempotencyRecord>): Promise<RecoveryOutcomeExecutionSimulationIdempotencyRecord>;
  markCompleted(id: string, resourceType: string, resourceId: string, safeResultSummary: string): Promise<RecoveryOutcomeExecutionSimulationIdempotencyRecord>;
  markFailed(id: string, safeResultSummary: string): Promise<RecoveryOutcomeExecutionSimulationIdempotencyRecord>;
}

export interface RecoveryOutcomeExecutionSimulationAuditRecord {
  simulationAuditEventId: string;
  schoolId: string;
  simulationReadinessId?: string;
  simulationPlanId?: string;
  simulationRunId?: string;
  eligibilityCheckId?: string;
  blockedActionDiagnosticId?: string;
  failureInjectionId?: string;
  simulationResultId?: string;
  teacherSimulationReviewId?: string;
  studentPreviewDraftId?: string;
  parentPreviewDraftId?: string;
  readinessVerdictId?: string;
  simulationSummaryId?: string;
  actorId: string;
  actorRole: string;
  eventType: string;
  decision: string;
  safeSummary: string;
  reasonCodesJson: Record<string, unknown>;
  metadataJson: Record<string, unknown>;
  requestId?: string;
  correlationId?: string;
  createdAt: string;
}

export interface RecoveryOutcomeExecutionSimulationIdempotencyRecord {
  simulationIdempotencyId: string;
  schoolId: string;
  operation: string;
  idempotencyKey: string;
  requestHash: string;
  status: string;
  resourceType?: string;
  resourceId?: string;
  safeResultSummary?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export type SimulationAuditRecordResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationAuditRecord>;
export type SimulationAuditRecordListResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationAuditRecord[]>;
