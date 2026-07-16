import type { RecoveryCaseTriageReadinessStatus } from './recoveryCaseTriageContracts';

export interface RecoveryCaseTriageSummary {
  triageSummaryId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  queueSnapshotId: string | null;
  triageSummaryStatus: RecoveryCaseTriageReadinessStatus | string;
  totalScore: number;
  priorityBand: string;
  riskRank: string;
  readinessSummary: string;
  fairnessSummary: string;
  capacitySummary: string;
  queueSummary: string;
  summaryDetailsJson: Record<string, unknown>;
  sourceRefsJson: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  staleAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface CreateTriageSummaryRequest {
  studentRef: string;
  resultRecoveryPlanId: string;
  queueSnapshotId?: string;
  totalScore: number;
  priorityBand: string;
  riskRank: string;
  readinessSummary?: string;
  fairnessSummary?: string;
  capacitySummary?: string;
  queueSummary?: string;
  summaryDetailsJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, unknown>;
}
