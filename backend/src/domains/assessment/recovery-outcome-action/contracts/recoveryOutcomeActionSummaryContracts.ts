import { RecoveryOutcomeActionSafeEnvelope } from './recoveryOutcomeActionContracts';

export type ActionSummaryStatus = 'active' | 'stale' | 'blocked' | 'voided';

export interface RecoveryOutcomeActionSummary {
  actionSummaryId: string;
  schoolId: string;
  studentRef?: string;
  teacherRef?: string;
  resultRecoveryPlanId?: string;
  summaryStatus: ActionSummaryStatus;
  safeSummary: string;
  actionCountsJson: Record<string, number>;
  topActionsJson: Record<string, unknown>;
  nextStepsJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: Date;
  updatedAt: Date;
  refreshedAt?: Date;
  staleAt?: Date;
  blockedAt?: Date;
  voidedAt?: Date;
}

export interface CreateActionSummaryRequest {
  schoolId: string;
  studentRef?: string;
  teacherRef?: string;
  resultRecoveryPlanId?: string;
  safeSummary: string;
  actionCountsJson: Record<string, number>;
  topActionsJson: Record<string, unknown>;
  nextStepsJson: Record<string, unknown>;
  sourceRefsJson?: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
}

export type ActionSummaryResponse = RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary>;
