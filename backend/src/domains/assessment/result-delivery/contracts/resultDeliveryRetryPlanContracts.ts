import type { ResultDeliveryRetryPlanStatus } from './resultDeliveryContracts';

export interface ResultDeliveryRetryPlan {
  resultDeliveryRetryPlanId: string;
  schoolId: string;
  resultDeliveryJobId: string;
  resultDeliveryAttemptId: string;
  retryStatus: ResultDeliveryRetryPlanStatus;
  retryPolicy: string;
  nextMockRetryAt: string | null;
  maxMockAttempts: number;
  attemptsUsed: number;
  safeRetrySummary: string;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  voidedAt: string | null;
}

export interface CreateRetryPlanInput {
  resultDeliveryJobId: string;
  resultDeliveryAttemptId: string;
  retryPolicy: string;
  maxMockAttempts: number;
  attemptsUsed: number;
  safeRetrySummary: string;
  nextMockRetryAt?: string | null;
  blockedReasonCodesJson?: Record<string, unknown> | null;
}
