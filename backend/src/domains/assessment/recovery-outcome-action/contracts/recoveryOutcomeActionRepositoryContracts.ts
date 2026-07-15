import {
  RecoveryOutcomeActionReadiness,
  RecoveryOutcomeActionReadinessStatus,
} from './recoveryOutcomeActionReadinessContracts';
import {
  RecoveryOutcomeActionBundle,
  ActionBundleStatus,
  ActionBundleType,
} from './recoveryOutcomeActionBundleContracts';
import {
  RecoveryContinuationActionDraft,
  RecoveryIntensificationActionDraft,
  RecoveryPauseActionDraft,
  RecoveryClosureActionDraft,
  ActionDraftType,
} from './recoveryActionDraftContracts';
import { RecoveryOutcomeApprovalGate, ApprovalGateStatus } from './recoveryOutcomeApprovalGateContracts';
import { RecoveryOutcomeMockActivationQueueItem, MockActivationQueueStatus } from './recoveryOutcomeMockActivationQueueContracts';
import { RecoveryOutcomeDryRunReceipt, DryRunReceiptResult } from './recoveryOutcomeDryRunReceiptContracts';
import { RecoveryOutcomeRollbackPlan, RollbackPlanStatus } from './recoveryOutcomeRollbackPlanContracts';
import { RecoveryOutcomeSuppressionRule, SuppressionRuleStatus } from './recoveryOutcomeSuppressionRuleContracts';
import { RecoveryOutcomeActionSummary, ActionSummaryStatus } from './recoveryOutcomeActionSummaryContracts';

export interface RecoveryOutcomeActionReadinessRepository {
  create(data: RecoveryOutcomeActionReadiness): Promise<RecoveryOutcomeActionReadiness>;
  getById(id: string): Promise<RecoveryOutcomeActionReadiness | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeActionReadiness[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeActionReadiness[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeActionReadiness[]>;
  listByStatus(schoolId: string, status: RecoveryOutcomeActionReadinessStatus): Promise<RecoveryOutcomeActionReadiness[]>;
  update(id: string, data: Partial<RecoveryOutcomeActionReadiness>): Promise<RecoveryOutcomeActionReadiness>;
  markReviewReady(id: string): Promise<RecoveryOutcomeActionReadiness>;
  approveForFutureUse(id: string): Promise<RecoveryOutcomeActionReadiness>;
  suppress(id: string): Promise<RecoveryOutcomeActionReadiness>;
  block(id: string): Promise<RecoveryOutcomeActionReadiness>;
  void(id: string): Promise<RecoveryOutcomeActionReadiness>;
}

export interface RecoveryOutcomeActionBundleRepository {
  create(data: RecoveryOutcomeActionBundle): Promise<RecoveryOutcomeActionBundle>;
  getById(id: string): Promise<RecoveryOutcomeActionBundle | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeActionBundle[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeActionBundle[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeActionBundle[]>;
  listByStatus(schoolId: string, status: ActionBundleStatus): Promise<RecoveryOutcomeActionBundle[]>;
  listByType(schoolId: string, bundleType: ActionBundleType): Promise<RecoveryOutcomeActionBundle[]>;
  update(id: string, data: Partial<RecoveryOutcomeActionBundle>): Promise<RecoveryOutcomeActionBundle>;
  markReviewReady(id: string): Promise<RecoveryOutcomeActionBundle>;
  approveForFutureUse(id: string): Promise<RecoveryOutcomeActionBundle>;
  suppress(id: string): Promise<RecoveryOutcomeActionBundle>;
  block(id: string): Promise<RecoveryOutcomeActionBundle>;
  void(id: string): Promise<RecoveryOutcomeActionBundle>;
}

export interface RecoveryContinuationActionDraftRepository {
  create(data: RecoveryContinuationActionDraft): Promise<RecoveryContinuationActionDraft>;
  getById(id: string): Promise<RecoveryContinuationActionDraft | null>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryContinuationActionDraft[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryContinuationActionDraft[]>;
  listByStatus(schoolId: string, status: ActionDraftType): Promise<RecoveryContinuationActionDraft[]>;
  update(id: string, data: Partial<RecoveryContinuationActionDraft>): Promise<RecoveryContinuationActionDraft>;
  markReviewReady(id: string): Promise<RecoveryContinuationActionDraft>;
  approveForFutureUse(id: string): Promise<RecoveryContinuationActionDraft>;
  suppress(id: string): Promise<RecoveryContinuationActionDraft>;
  block(id: string): Promise<RecoveryContinuationActionDraft>;
  void(id: string): Promise<RecoveryContinuationActionDraft>;
}

export interface RecoveryIntensificationActionDraftRepository {
  create(data: RecoveryIntensificationActionDraft): Promise<RecoveryIntensificationActionDraft>;
  getById(id: string): Promise<RecoveryIntensificationActionDraft | null>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryIntensificationActionDraft[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryIntensificationActionDraft[]>;
  listByStatus(schoolId: string, status: ActionDraftType): Promise<RecoveryIntensificationActionDraft[]>;
  update(id: string, data: Partial<RecoveryIntensificationActionDraft>): Promise<RecoveryIntensificationActionDraft>;
  markReviewReady(id: string): Promise<RecoveryIntensificationActionDraft>;
  approveForFutureUse(id: string): Promise<RecoveryIntensificationActionDraft>;
  suppress(id: string): Promise<RecoveryIntensificationActionDraft>;
  block(id: string): Promise<RecoveryIntensificationActionDraft>;
  void(id: string): Promise<RecoveryIntensificationActionDraft>;
}

export interface RecoveryPauseActionDraftRepository {
  create(data: RecoveryPauseActionDraft): Promise<RecoveryPauseActionDraft>;
  getById(id: string): Promise<RecoveryPauseActionDraft | null>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryPauseActionDraft[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryPauseActionDraft[]>;
  listByStatus(schoolId: string, status: ActionDraftType): Promise<RecoveryPauseActionDraft[]>;
  update(id: string, data: Partial<RecoveryPauseActionDraft>): Promise<RecoveryPauseActionDraft>;
  markReviewReady(id: string): Promise<RecoveryPauseActionDraft>;
  approveForFutureUse(id: string): Promise<RecoveryPauseActionDraft>;
  suppress(id: string): Promise<RecoveryPauseActionDraft>;
  block(id: string): Promise<RecoveryPauseActionDraft>;
  void(id: string): Promise<RecoveryPauseActionDraft>;
}

export interface RecoveryClosureActionDraftRepository {
  create(data: RecoveryClosureActionDraft): Promise<RecoveryClosureActionDraft>;
  getById(id: string): Promise<RecoveryClosureActionDraft | null>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryClosureActionDraft[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryClosureActionDraft[]>;
  listByStatus(schoolId: string, status: ActionDraftType): Promise<RecoveryClosureActionDraft[]>;
  listByClosureType(schoolId: string, closureType: string): Promise<RecoveryClosureActionDraft[]>;
  update(id: string, data: Partial<RecoveryClosureActionDraft>): Promise<RecoveryClosureActionDraft>;
  markReviewReady(id: string): Promise<RecoveryClosureActionDraft>;
  approveForFutureUse(id: string): Promise<RecoveryClosureActionDraft>;
  suppress(id: string): Promise<RecoveryClosureActionDraft>;
  block(id: string): Promise<RecoveryClosureActionDraft>;
  void(id: string): Promise<RecoveryClosureActionDraft>;
}

export interface RecoveryOutcomeApprovalGateRepository {
  create(data: RecoveryOutcomeApprovalGate): Promise<RecoveryOutcomeApprovalGate>;
  getById(id: string): Promise<RecoveryOutcomeApprovalGate | null>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeApprovalGate[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeApprovalGate[]>;
  listByStatus(schoolId: string, status: ApprovalGateStatus): Promise<RecoveryOutcomeApprovalGate[]>;
  update(id: string, data: Partial<RecoveryOutcomeApprovalGate>): Promise<RecoveryOutcomeApprovalGate>;
  markSatisfied(id: string): Promise<RecoveryOutcomeApprovalGate>;
  markBlocked(id: string): Promise<RecoveryOutcomeApprovalGate>;
  void(id: string): Promise<RecoveryOutcomeApprovalGate>;
}

export interface RecoveryOutcomeMockActivationQueueRepository {
  create(data: RecoveryOutcomeMockActivationQueueItem): Promise<RecoveryOutcomeMockActivationQueueItem>;
  getById(id: string): Promise<RecoveryOutcomeMockActivationQueueItem | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeMockActivationQueueItem[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeMockActivationQueueItem[]>;
  listByStatus(schoolId: string, status: MockActivationQueueStatus): Promise<RecoveryOutcomeMockActivationQueueItem[]>;
  update(id: string, data: Partial<RecoveryOutcomeMockActivationQueueItem>): Promise<RecoveryOutcomeMockActivationQueueItem>;
  markDryRunReady(id: string): Promise<RecoveryOutcomeMockActivationQueueItem>;
  suppress(id: string): Promise<RecoveryOutcomeMockActivationQueueItem>;
  block(id: string): Promise<RecoveryOutcomeMockActivationQueueItem>;
  void(id: string): Promise<RecoveryOutcomeMockActivationQueueItem>;
}

export interface RecoveryOutcomeDryRunReceiptRepository {
  create(data: RecoveryOutcomeDryRunReceipt): Promise<RecoveryOutcomeDryRunReceipt>;
  getById(id: string): Promise<RecoveryOutcomeDryRunReceipt | null>;
  listByQueueItemId(queueItemId: string): Promise<RecoveryOutcomeDryRunReceipt[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeDryRunReceipt[]>;
  listByResult(schoolId: string, result: DryRunReceiptResult): Promise<RecoveryOutcomeDryRunReceipt[]>;
  update(id: string, data: Partial<RecoveryOutcomeDryRunReceipt>): Promise<RecoveryOutcomeDryRunReceipt>;
  void(id: string): Promise<RecoveryOutcomeDryRunReceipt>;
}

export interface RecoveryOutcomeRollbackPlanRepository {
  create(data: RecoveryOutcomeRollbackPlan): Promise<RecoveryOutcomeRollbackPlan>;
  getById(id: string): Promise<RecoveryOutcomeRollbackPlan | null>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeRollbackPlan[]>;
  listByStatus(schoolId: string, status: RollbackPlanStatus): Promise<RecoveryOutcomeRollbackPlan[]>;
  update(id: string, data: Partial<RecoveryOutcomeRollbackPlan>): Promise<RecoveryOutcomeRollbackPlan>;
  markReviewReady(id: string): Promise<RecoveryOutcomeRollbackPlan>;
  approveForFutureUse(id: string): Promise<RecoveryOutcomeRollbackPlan>;
  suppress(id: string): Promise<RecoveryOutcomeRollbackPlan>;
  block(id: string): Promise<RecoveryOutcomeRollbackPlan>;
  void(id: string): Promise<RecoveryOutcomeRollbackPlan>;
}

export interface RecoveryOutcomeSuppressionRuleRepository {
  create(data: RecoveryOutcomeSuppressionRule): Promise<RecoveryOutcomeSuppressionRule>;
  getById(id: string): Promise<RecoveryOutcomeSuppressionRule | null>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeSuppressionRule[]>;
  listByStatus(schoolId: string, status: SuppressionRuleStatus): Promise<RecoveryOutcomeSuppressionRule[]>;
  update(id: string, data: Partial<RecoveryOutcomeSuppressionRule>): Promise<RecoveryOutcomeSuppressionRule>;
  activateForFutureUse(id: string): Promise<RecoveryOutcomeSuppressionRule>;
  suppress(id: string): Promise<RecoveryOutcomeSuppressionRule>;
  block(id: string): Promise<RecoveryOutcomeSuppressionRule>;
  void(id: string): Promise<RecoveryOutcomeSuppressionRule>;
}

export interface RecoveryOutcomeActionSummaryRepository {
  create(data: RecoveryOutcomeActionSummary): Promise<RecoveryOutcomeActionSummary>;
  getById(id: string): Promise<RecoveryOutcomeActionSummary | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeActionSummary[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeActionSummary[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeActionSummary[]>;
  listByStatus(schoolId: string, status: ActionSummaryStatus): Promise<RecoveryOutcomeActionSummary[]>;
  update(id: string, data: Partial<RecoveryOutcomeActionSummary>): Promise<RecoveryOutcomeActionSummary>;
  markStale(id: string): Promise<RecoveryOutcomeActionSummary>;
  refresh(id: string, data: Partial<RecoveryOutcomeActionSummary>): Promise<RecoveryOutcomeActionSummary>;
  block(id: string): Promise<RecoveryOutcomeActionSummary>;
  void(id: string): Promise<RecoveryOutcomeActionSummary>;
}

export interface RecoveryOutcomeActionAuditRepository {
  create(data: RecoveryOutcomeActionAuditEvent): Promise<RecoveryOutcomeActionAuditEvent>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeActionAuditEvent[]>;
  listByEventType(schoolId: string, eventType: string): Promise<RecoveryOutcomeActionAuditEvent[]>;
}

export interface RecoveryOutcomeActionAuditEvent {
  auditEventId: string;
  schoolId: string;
  actionReadinessId?: string;
  actionBundleId?: string;
  continuationActionDraftId?: string;
  intensificationActionDraftId?: string;
  pauseActionDraftId?: string;
  closureActionDraftId?: string;
  approvalGateId?: string;
  mockActivationQueueItemId?: string;
  dryRunReceiptId?: string;
  rollbackPlanId?: string;
  suppressionRuleId?: string;
  actionSummaryId?: string;
  actorId: string;
  actorRole: string;
  eventType: string;
  decision: string;
  safeSummary: string;
  reasonCodesJson: Record<string, unknown>;
  metadataJson: Record<string, unknown>;
  requestId?: string;
  correlationId?: string;
  createdAt: Date;
}

export interface RecoveryOutcomeActionIdempotencyEntry {
  idempotencyId: string;
  schoolId: string;
  operation: string;
  idempotencyKey: string;
  requestHash: string;
  status: string;
  resourceType?: string;
  resourceId?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface RecoveryOutcomeActionIdempotencyRepository {
  create(data: RecoveryOutcomeActionIdempotencyEntry): Promise<RecoveryOutcomeActionIdempotencyEntry>;
  getByKey(schoolId: string, idempotencyKey: string): Promise<RecoveryOutcomeActionIdempotencyEntry | null>;
  markCompleted(id: string, resourceType: string, resourceId: string): Promise<RecoveryOutcomeActionIdempotencyEntry>;
}
