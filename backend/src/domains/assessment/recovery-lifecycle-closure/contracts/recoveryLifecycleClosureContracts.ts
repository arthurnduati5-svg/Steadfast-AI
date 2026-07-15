export interface RecoveryLifecycleClosureCommandContext {
  schoolId: string;
  actorId: string;
  actorRole: string;
  correlationId: string;
  idempotencyKey: string;
  sourceRefsJson?: Record<string, string>;
}

export interface RecoveryLifecycleClosureSafeEnvelope<T> {
  success: boolean;
  data?: T;
  status: string;
  message?: string;
  metadata?: Record<string, unknown>;
  blockedReasonCodes?: string[];
  idempotencyKey?: string;
}

export interface RecoveryLifecycleClosurePolicyDecision {
  allowed: boolean;
  denied: boolean;
  reasonCodes: string[];
  actorRole: string;
  action: string;
}
