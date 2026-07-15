import { RecoveryOutcomeActionSafeEnvelope } from './recoveryOutcomeActionContracts';

export type DryRunReceiptResult = 'simulated_success' | 'simulated_failure' | 'simulated_blocked' | 'voided';

export interface RecoveryOutcomeDryRunReceipt {
  dryRunReceiptId: string;
  schoolId: string;
  mockActivationQueueItemId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  receiptResult: DryRunReceiptResult;
  safeReceiptSummary: string;
  simulationDetailsJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: Date;
  updatedAt: Date;
  voidedAt?: Date;
}

export interface CreateDryRunReceiptRequest {
  schoolId: string;
  mockActivationQueueItemId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  receiptResult: DryRunReceiptResult;
  safeReceiptSummary: string;
  simulationDetailsJson: Record<string, unknown>;
  sourceRefsJson?: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
}

export type DryRunReceiptResponse = RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeDryRunReceipt>;
