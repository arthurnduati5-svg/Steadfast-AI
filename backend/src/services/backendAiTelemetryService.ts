import { buildBackendLogEvent, logBackendEvent } from './backendStructuredLoggerService';
import { buildAuditEvent, recordAuditEvent } from './backendAuditEventService';
import { recordLatencySample } from './backendOperationalMetricsService';

export interface AiCallTelemetryInput {
  requestId?: string;
  traceId?: string;
  route?: string;
  aiServiceName: string;
  startTime: number;
  success: boolean;
  errorCode?: string;
  errorCategory?: string;
}

export function recordAiCallTelemetry(input: AiCallTelemetryInput): void {
  const durationMs = Date.now() - input.startTime;
  const eventType = input.success ? 'ai_call_completed' : 'ai_call_failed';

  const logEvent = buildBackendLogEvent({
    level: input.success ? 'info' : 'error',
    eventType,
    message: `AI call to ${input.aiServiceName} ${input.success ? 'completed' : 'failed'} in ${durationMs}ms`,
    requestId: input.requestId,
    traceId: input.traceId,
    route: input.route,
    errorCode: input.errorCode,
    errorCategory: input.errorCategory,
    durationMs,
    safeMeta: {
      aiServiceName: input.aiServiceName,
    },
  });
  logBackendEvent(logEvent);

  recordLatencySample({
    name: `ai.${input.aiServiceName}`,
    durationMs,
    route: input.route,
    requestId: input.requestId,
    traceId: input.traceId,
  });

  recordAuditEvent(buildAuditEvent({
    eventType: input.success ? 'ai_call_completed' : 'ai_call_failed',
    requestId: input.requestId,
    traceId: input.traceId,
    route: input.route,
    outcome: input.success ? 'success' : 'failure',
    safeSummary: `AI call ${input.aiServiceName} ${input.success ? 'completed' : 'failed'}`,
    minimumNecessary: true,
  }));
}
