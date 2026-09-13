// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 018 Safe Operations Monitoring Runtime
// End-to-end runtime for safe diagnostics and monitoring.
// Flow: verified diagnostic request → scope check → health
// check → metrics → incidents → redaction → audit → response.
// ─────────────────────────────────────────────────────────────

import type {
  SafeDiagnosticSnapshot,
  OperationHealthResponse,
  OperationReadinessResponse,
  RuntimeMetricsSnapshot,
  SafeIncidentSummary,
  ComponentHealthState,
  TelemetryComponent,
  OperationTraceContext,
} from '../contracts/task018Contracts';
import { PRIVACY_CLEAN_METADATA } from '../contracts/task018Contracts';
import { checkDiagnosticsScope } from './task018AdminDiagnosticsScopePolicyService';
import { checkAllComponents, checkComponentHealth, resolveOverallHealth, getRegisteredComponents } from './task018ComponentHealthMonitorService';
import { getRuntimeReadiness } from './task018RuntimeReadinessGateService';
import { getMetricsSnapshot, recordMetricPoint, recordTelemetryEvent, recordRedactionApplied } from './task018RuntimeMetricsCollector';
import { getRecentIncidents, recordIncident } from './task018SafeIncidentSummaryService';
import { recordObservabilityAudit, recordObservabilityAuditDurable } from './task018ObservabilityAuditService';
import { createOperationTraceContext } from './task018OperationTraceContextService';
import { redactTelemetryPayload } from './task018SafeTelemetryRedactionService';
import type { ScopeDecision } from './task018AdminDiagnosticsScopePolicyService';

export interface MonitoringContext {
  requestId: string;
  correlationId: string;
  actorId: string;
  actorRole: string;
  schoolId?: string;
  traceContext: OperationTraceContext;
}

export function createMonitoringContext(input: {
  requestId: string;
  correlationId?: string;
  actorId?: string;
  actorRole?: string;
  schoolId?: string;
  routeName: string;
}): MonitoringContext {
  return {
    requestId: input.requestId,
    correlationId: input.correlationId || input.requestId,
    actorId: input.actorId || 'system',
    actorRole: input.actorRole || 'system',
    schoolId: input.schoolId,
    traceContext: createOperationTraceContext({
      requestId: input.requestId,
      correlationId: input.correlationId,
      routeName: input.routeName,
      component: 'operations_monitoring',
      schoolId: input.schoolId,
    }),
  };
}

export async function executeSafeDiagnosticsQuery(
  ctx: MonitoringContext,
  operation: 'diagnostics_query' | 'metrics_query' | 'incidents_query' | 'component_check',
): Promise<{
  allowed: boolean;
  diagnostics?: SafeDiagnosticSnapshot;
  metrics?: RuntimeMetricsSnapshot;
  incidents?: SafeIncidentSummary[];
  components?: ComponentHealthState[];
  health?: OperationHealthResponse;
  readiness?: OperationReadinessResponse;
  scopeDecision: ScopeDecision;
}> {
  // 1. Scope check
  const scopeDecision = checkDiagnosticsScope({
    actorRole: ctx.actorRole,
    actorId: ctx.actorId,
    schoolId: ctx.schoolId,
    operation,
  });

  if (!scopeDecision.allowed) {
    await recordObservabilityAudit({
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      schoolId: ctx.schoolId,
      operation,
      component: 'diagnostics_runtime',
      requestId: ctx.requestId,
      correlationId: ctx.correlationId,
      status: 'denied',
      privacyDecision: 'blocked',
    });
    return { allowed: false, scopeDecision };
  }

  recordTelemetryEvent();

  try {
    let diagnostics: SafeDiagnosticSnapshot | undefined;
    let metrics: RuntimeMetricsSnapshot | undefined;
    let incidents: SafeIncidentSummary[] | undefined;
    let components: ComponentHealthState[] | undefined;

    switch (operation) {
      case 'diagnostics_query': {
        const { getDiagnosticSnapshot } = await import('./task018TutorRuntimeDiagnosticsService');
        diagnostics = await getDiagnosticSnapshot({
          requestId: ctx.requestId,
          correlationId: ctx.correlationId,
        });
        break;
      }
      case 'metrics_query':
        metrics = getMetricsSnapshot();
        break;
      case 'incidents_query':
        incidents = getRecentIncidents(50);
        break;
      case 'component_check':
        components = await checkAllComponents();
        break;
    }

    await recordObservabilityAudit({
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      schoolId: ctx.schoolId,
      operation,
      component: 'diagnostics_runtime',
      requestId: ctx.requestId,
      correlationId: ctx.correlationId,
      status: 'granted',
      privacyDecision: 'allowed',
      redactionApplied: false,
    });

    return { allowed: true, diagnostics, metrics, incidents, components, scopeDecision };
  } catch (error) {
    const safeMessage = error instanceof Error ? error.message : 'Unknown error';
    recordIncident({
      severity: 'error',
      component: 'diagnostics_runtime',
      errorCode: 'DIAGNOSTICS_QUERY_FAILED',
      safeMessage,
    });

    await recordObservabilityAudit({
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      schoolId: ctx.schoolId,
      operation,
      component: 'diagnostics_runtime',
      requestId: ctx.requestId,
      correlationId: ctx.correlationId,
      status: 'error',
      privacyDecision: 'error',
    });

    return { allowed: true, scopeDecision };
  }
}

export function publishSafeTelemetryEvent(event: {
  eventType: string;
  component: TelemetryComponent;
  status: string;
  durationMs?: number;
  safeMetadata?: Record<string, unknown>;
}): void {
  const redacted = event.safeMetadata
    ? redactTelemetryPayload(event.safeMetadata)
    : null;

  if (redacted?.redactionApplied) {
    recordRedactionApplied();
  }

  recordMetricPoint({
    name: `${event.component}.${event.eventType}`,
    component: event.component,
    value: 1,
  });

  if (event.durationMs !== undefined) {
    recordMetricPoint({
      name: `${event.component}.latency`,
      component: event.component,
      value: event.durationMs,
    });
  }

  recordTelemetryEvent();
}
