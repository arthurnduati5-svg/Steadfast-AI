export interface RecoveryExecutionReadinessBoardCommandContext {
  schoolId: string;
  actorId: string;
  actorRole: string;
  correlationId: string;
  idempotencyKey: string;
  sourceRefsJson?: Record<string, any>;
}

export interface RecoveryExecutionReadinessBoardSafeEnvelope<T> {
  success: boolean;
  status: string;
  message?: string;
  data?: T;
  error?: string;
  errorCodes?: string[];
  correlationId?: string;
}

export interface RecoveryExecutionReadinessBoardPolicyDecision {
  allowed: boolean;
  reason: string;
  requiredRole: string;
  blockedReason?: string;
  policyFamily?: string;
}

export type RecoveryExecutionReadinessBoardAuditEvent = any;
export type RecoveryExecutionReadinessBoardIdempotencyEntry = any;
