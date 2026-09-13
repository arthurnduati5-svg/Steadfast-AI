// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 018 Production Observability Contracts
// Safe telemetry, metrics, diagnostics, incidents, health,
// readiness, redaction, audit, and monitoring types.
// ─────────────────────────────────────────────────────────────

// ─── Safe Telemetry Event ────────────────────────────────────

export type SafeTelemetryEventType =
  | 'conversation_request'
  | 'conversation_response'
  | 'conversation_error'
  | 'stream_started'
  | 'stream_event_emitted'
  | 'stream_completed'
  | 'stream_error'
  | 'session_started'
  | 'session_resumed'
  | 'session_transition'
  | 'session_checkpoint'
  | 'evidence_write_attempt'
  | 'evidence_write_success'
  | 'evidence_write_failure'
  | 'ai_gateway_call_started'
  | 'ai_gateway_call_completed'
  | 'ai_gateway_call_failed'
  | 'policy_guard_triggered'
  | 'deen_boundary_applied'
  | 'safeguarding_boundary_applied'
  | 'idempotency_hit'
  | 'idempotency_miss'
  | 'idempotency_conflict'
  | 'health_check'
  | 'readiness_check'
  | 'diagnostic_query';

export const SAFE_TELEMETRY_EVENT_TYPES: readonly SafeTelemetryEventType[] = [
  'conversation_request', 'conversation_response', 'conversation_error',
  'stream_started', 'stream_event_emitted', 'stream_completed', 'stream_error',
  'session_started', 'session_resumed', 'session_transition', 'session_checkpoint',
  'evidence_write_attempt', 'evidence_write_success', 'evidence_write_failure',
  'ai_gateway_call_started', 'ai_gateway_call_completed', 'ai_gateway_call_failed',
  'policy_guard_triggered', 'deen_boundary_applied', 'safeguarding_boundary_applied',
  'idempotency_hit', 'idempotency_miss', 'idempotency_conflict',
  'health_check', 'readiness_check', 'diagnostic_query',
] as const;

export type TelemetryComponent =
  | 'conversation_api'
  | 'streaming_runtime'
  | 'session_runtime'
  | 'learning_loop_runtime'
  | 'evidence_pipeline'
  | 'ai_gateway'
  | 'prisma_client'
  | 'audit_runtime'
  | 'idempotency_runtime'
  | 'policy_guards'
  | 'deen_boundary'
  | 'safeguarding_boundary'
  | 'health_monitor'
  | 'readiness_gate'
  | 'diagnostics_runtime'
  | 'operations_monitoring'
  | 'unknown';

export type TelemetrySeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';

export interface TelemetryPrivacyMetadata {
  redactionApplied: boolean;
  redactionReasons: string[];
  rawChatExcluded: boolean;
  rawPromptExcluded: boolean;
  providerResponseExcluded: boolean;
  privateMemoryExcluded: boolean;
  teacherOnlyNotesExcluded: boolean;
  answerKeyExcluded: boolean;
  secretsExcluded: boolean;
  safeguardingRawExcluded: boolean;
  deenSensitiveRawExcluded: boolean;
}

export const PRIVACY_CLEAN_METADATA: TelemetryPrivacyMetadata = {
  redactionApplied: false,
  redactionReasons: [],
  rawChatExcluded: true,
  rawPromptExcluded: true,
  providerResponseExcluded: true,
  privateMemoryExcluded: true,
  teacherOnlyNotesExcluded: true,
  answerKeyExcluded: true,
  secretsExcluded: true,
  safeguardingRawExcluded: true,
  deenSensitiveRawExcluded: true,
};

export interface SafeTelemetryEvent {
  eventId: string;
  eventType: SafeTelemetryEventType;
  component: TelemetryComponent;
  severity: TelemetrySeverity;
  requestId?: string;
  correlationId?: string;
  schoolId?: string;
  sessionId?: string;
  status: string;
  durationMs?: number;
  safeReasonCodes: string[];
  safeMetadata: Record<string, unknown>;
  privacyMetadata: TelemetryPrivacyMetadata;
  createdAt: string;
}

// ─── Runtime Metrics ─────────────────────────────────────────

export interface RuntimeMetricPoint {
  name: string;
  component: TelemetryComponent;
  value: number;
  unit: 'count' | 'milliseconds' | 'bytes' | 'percentage';
  timestamp: number;
}

export interface RuntimeMetricAggregate {
  metricName: string;
  component: TelemetryComponent;
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p50: number | null;
  p95: number | null;
  p99: number | null;
  windowStartMs: number;
  windowEndMs: number;
}

export interface MetricsCategorySnapshot {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  blockedCount: number;
  latencyMs?: { p50: number | null; p95: number | null; p99: number | null; max: number | null };
}

export interface RuntimeMetricsSnapshot {
  window: { startMs: number; endMs: number };
  conversation: MetricsCategorySnapshot;
  streaming: { startCount: number; completedCount: number; errorCount: number; totalEvents: number };
  sessions: { started: number; resumed: number; completed: number; transitions: number; checkpoints: number };
  evidence: { writeAttempts: number; writeSuccesses: number; writeFailures: number };
  aiGateway: { callsStarted: number; callsCompleted: number; callsFailed: number; fallbackUsed: number };
  policyGuards: { totalTriggers: number; deenBoundaries: number; safeguardingBoundaries: number };
  idempotency: { hits: number; misses: number; conflicts: number };
  errors: { total: number; byCategory: Record<string, number> };
  privacy: { redactionsApplied: number; totalEvents: number };
  generatedAt: string;
}

// ─── Component Health ────────────────────────────────────────

export type ComponentHealthStatus = 'healthy' | 'degraded' | 'unavailable' | 'unknown';
export type ComponentReadinessStatus = 'ready' | 'not_ready' | 'degraded' | 'unknown';

export interface ComponentHealthState {
  component: TelemetryComponent;
  health: ComponentHealthStatus;
  readiness: ComponentReadinessStatus;
  lastCheckedMs: number;
  latencyMs?: number;
  safeMessage: string;
}

// ─── Diagnostic Snapshot ─────────────────────────────────────

export type RuntimeStatusCategory = 'healthy' | 'degraded' | 'unavailable' | 'unknown';

export interface DiagnosticComponentSummary {
  component: TelemetryComponent;
  status: RuntimeStatusCategory;
  health: ComponentHealthStatus;
  readiness: ComponentReadinessStatus;
}

export interface SafeDiagnosticSnapshot {
  requestId: string;
  correlationId: string;
  status: RuntimeStatusCategory;
  summary: string;
  components: DiagnosticComponentSummary[];
  metricsSummary: RuntimeMetricsSnapshot;
  recentIncidents: SafeIncidentSummary[];
  privacyMetadata: TelemetryPrivacyMetadata;
  generatedAt: string;
}

// ─── Incident Summary ────────────────────────────────────────

export type IncidentSeverity = 'critical' | 'error' | 'warning' | 'info';

export interface SafeIncidentSummary {
  incidentId: string;
  severity: IncidentSeverity;
  component: TelemetryComponent;
  errorCode: string;
  safeMessage: string;
  count: number;
  firstSeenAt: string;
  lastSeenAt: string;
  retryable: boolean;
  recommendedOperatorAction: string;
  privacyMetadata: TelemetryPrivacyMetadata;
}

// ─── Health / Readiness ──────────────────────────────────────

export interface OperationHealthResponse {
  status: 'healthy' | 'degraded' | 'unavailable';
  service: string;
  version?: string;
  timestamp: string;
  requestId: string;
  components: ComponentHealthState[];
}

export interface OperationReadinessCheck {
  component: TelemetryComponent;
  status: ComponentReadinessStatus;
  safeMessage: string;
  required: boolean;
  latencyMs?: number;
}

export interface OperationReadinessResponse {
  ready: boolean;
  status: 'ready' | 'degraded' | 'not_ready';
  checks: OperationReadinessCheck[];
  timestamp: string;
  requestId: string;
}

// ─── Redaction ────────────────────────────────────────────────

export interface RedactionDecision {
  field: string;
  redacted: boolean;
  reason: string;
}

export interface TelemetryRedactionResult {
  safe: boolean;
  sanitizedPayload: Record<string, unknown>;
  redactionApplied: boolean;
  redactionReasons: string[];
  blockedReason?: string;
  privacyMetadata: TelemetryPrivacyMetadata;
}

// ─── Trace Context ───────────────────────────────────────────

export interface OperationTraceContext {
  requestId: string;
  correlationId: string;
  operationId: string;
  routeName: string;
  component: TelemetryComponent;
  schoolId?: string;
  tutorLearnerId?: string;
  sessionId?: string;
  startedAt: string;
}

// ─── Observability Audit ─────────────────────────────────────

export type ObservabilityAuditOperation =
  | 'diagnostics_query'
  | 'metrics_query'
  | 'incidents_query'
  | 'health_check'
  | 'readiness_check'
  | 'component_check'
  | 'redaction_check'
  | 'system_health';

export interface ObservabilityAuditRecord {
  auditId: string;
  actorId: string;
  actorRole: string;
  schoolId?: string;
  operation: ObservabilityAuditOperation;
  component: TelemetryComponent;
  requestId: string;
  correlationId?: string;
  status: 'granted' | 'denied' | 'error';
  privacyDecision: string;
  redactionApplied: boolean;
  createdAt: string;
}
