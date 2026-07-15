export interface RecoveryOutcomeExecutionSimulationCommandContext {
  schoolId: string;
  actorId: string;
  actorRole: string;
  correlationId: string;
  idempotencyKey: string;
  sourceRefsJson?: Record<string, string>;
}

export interface RecoveryOutcomeExecutionSimulationSafeEnvelope<T> {
  success: boolean;
  data?: T;
  status: string;
  message?: string;
  metadata?: Record<string, unknown>;
  blockedReasonCodes?: string[];
  idempotencyKey?: string;
}

export interface RecoveryOutcomeExecutionSimulationPolicyDecision {
  allowed: boolean;
  denied: boolean;
  reasonCodes: string[];
  actorRole: string;
  action: string;
}
