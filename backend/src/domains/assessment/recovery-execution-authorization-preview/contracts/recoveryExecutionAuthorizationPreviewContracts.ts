export interface RecoveryExecutionAuthorizationPreviewCommandContext {
  schoolId: string;
  actorId: string;
  actorRole: string;
  correlationId: string;
  idempotencyKey: string;
  sourceRefsJson?: Record<string, any>;
}

export interface RecoveryExecutionAuthorizationPreviewSafeEnvelope<T> {
  success: boolean;
  status: string;
  message?: string;
  data?: T;
  error?: string;
  errorCodes?: string[];
  correlationId?: string;
}

export interface RecoveryExecutionAuthorizationPreviewPolicyDecision {
  allowed: boolean;
  reason: string;
  requiredRole: string;
  blockedReason?: string;
  policyFamily?: string;
}

export type RecoveryExecutionAuthorizationAuditEvent = any;
export type RecoveryExecutionAuthorizationIdempotencyEntry = any;
