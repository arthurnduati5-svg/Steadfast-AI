import { RecoveryLifecycleClosureSafeEnvelope } from './recoveryLifecycleClosureContracts';

export interface RecoveryDeferredIntegrationTicket {
  deferredIntegrationTicketId: string;
  schoolId: string;
  resultRecoveryPlanId: string;
  ticketType: string;
  ticketStatus: string;
  safeTicketSummary: string;
  ticketDetailsJson: Record<string, unknown>;
  priority?: number;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, string>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  approvedForFutureUseAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface CreateRecoveryDeferredIntegrationTicketRequest {
  resultRecoveryPlanId: string;
  ticketType: string;
  safeTicketSummary: string;
  ticketDetailsJson?: Record<string, unknown>;
  priority?: number;
  blockedReasonCodesJson?: string[];
  sourceRefsJson?: Record<string, string>;
}

export type RecoveryDeferredIntegrationTicketResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryDeferredIntegrationTicket>;
export type RecoveryDeferredIntegrationTicketListResponse = RecoveryLifecycleClosureSafeEnvelope<RecoveryDeferredIntegrationTicket[]>;
