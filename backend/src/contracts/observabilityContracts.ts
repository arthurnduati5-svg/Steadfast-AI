export type BackendLogLevel = 'debug' | 'info' | 'warn' | 'error';

export type BackendActorType = 'student' | 'teacher' | 'admin' | 'system' | 'anonymous';

export type BackendLogEvent = {
  level: BackendLogLevel;
  eventType: string;
  message: string;
  timestamp: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  actorType?: BackendActorType;
  actorIdHash?: string;
  schoolIdHash?: string;
  errorCode?: string;
  errorCategory?: string;
  safeMeta?: Record<string, unknown>;
};

export type BackendObservabilityConfig = {
  logLevel: BackendLogLevel;
  enableRequestTelemetry: boolean;
  enableAuditEvents: boolean;
  enableLatencyMetrics: boolean;
  maxLatencySamples: number;
  redactAuthorization: boolean;
  redactCookies: boolean;
  redactPrompts: boolean;
  redactAiResponses: boolean;
};
