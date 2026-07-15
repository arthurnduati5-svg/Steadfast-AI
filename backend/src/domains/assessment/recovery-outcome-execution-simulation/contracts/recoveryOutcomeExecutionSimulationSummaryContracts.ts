import { RecoveryOutcomeExecutionSimulationSafeEnvelope } from './recoveryOutcomeExecutionSimulationContracts';

export interface RecoveryOutcomeExecutionSimulationSummary {
  simulationSummaryId: string;
  schoolId: string;
  studentRef?: string;
  teacherRef?: string;
  resultRecoveryPlanId?: string;
  summaryStatus: string;
  safeSummary: string;
  simulationCountsJson: Record<string, unknown>;
  topFindingsJson: Record<string, unknown>;
  nextStepsJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  refreshedAt?: string;
  staleAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface CreateSimulationSummaryRequest {
  studentRef?: string;
  teacherRef?: string;
  resultRecoveryPlanId?: string;
  safeSummary: string;
  simulationCountsJson?: Record<string, unknown>;
  topFindingsJson?: Record<string, unknown>;
  nextStepsJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, string>;
}

export type SimulationSummaryResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationSummary>;
export type SimulationSummaryListResponse = RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionSimulationSummary[]>;
