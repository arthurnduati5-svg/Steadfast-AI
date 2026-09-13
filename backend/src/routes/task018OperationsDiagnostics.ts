import { Router, Request, Response } from 'express';
import { checkDiagnosticsScope } from '../services/task018AdminDiagnosticsScopePolicyService';
import { checkComponentHealth, checkAllComponents, resolveOverallHealth, getRegisteredComponents } from '../services/task018ComponentHealthMonitorService';
import { getRuntimeReadiness } from '../services/task018RuntimeReadinessGateService';
import { getMetricsSnapshot } from '../services/task018RuntimeMetricsCollector';
import { getRecentIncidents, recordIncident } from '../services/task018SafeIncidentSummaryService';
import { recordObservabilityAudit } from '../services/task018ObservabilityAuditService';
import { createMonitoringContext, executeSafeDiagnosticsQuery } from '../services/task018SafeOperationsMonitoringRuntime';
import { getDiagnosticSnapshot } from '../services/task018TutorRuntimeDiagnosticsService';
import { redactTelemetryPayload } from '../services/task018SafeTelemetryRedactionService';

function getReqActor(req: Request): { id: string; role: string; schoolId?: string } {
  return {
    id: (req as any).user?.id || 'anonymous',
    role: (req as any).user?.role || 'anonymous',
    schoolId: (req as any).schoolId,
  };
}

function safeMeta(req: Request): { requestId: string; traceId: string } {
  return {
    requestId: (req as any).requestId || 'unknown',
    traceId: (req as any).traceId || (req as any).requestId || 'unknown',
  };
}

function successEnvelope(data: unknown, meta: { requestId: string; traceId: string; scope?: string }) {
  return {
    ok: true,
    data,
    meta: {
      requestId: meta.requestId,
      traceId: meta.traceId,
      scope: meta.scope || 'system_admin',
      generatedAt: new Date().toISOString(),
    },
  };
}

function blockedEnvelope(code: string, message: string, safeReasonCode: string, meta: { requestId: string; traceId: string }) {
  return {
    ok: false,
    error: { code, message, safeReasonCode },
    meta: { requestId: meta.requestId, traceId: meta.traceId },
  };
}

function errorEnvelope(meta: { requestId: string; traceId: string }) {
  return {
    ok: false,
    error: { code: 'diagnostics_unavailable', message: 'Diagnostics are temporarily unavailable.' },
    meta: { requestId: meta.requestId, traceId: meta.traceId },
  };
}

// ─────────────────────────────────────────────────────────────
// PUBLIC router — health and readiness (no auth middleware)
// ─────────────────────────────────────────────────────────────
export const publicRouter = Router();

publicRouter.get('/health', async (req: Request, res: Response) => {
  const meta = safeMeta(req);
  try {
    const components = await checkAllComponents();
    const overallHealth = resolveOverallHealth(components);
    res.json({
      status: overallHealth,
      service: 'tutor-runtime',
      version: process.env.npm_package_version || 'unknown',
      timestamp: new Date().toISOString(),
      requestId: meta.requestId,
      components: components.map((c) => ({
        component: c.component,
        status: c.health,
        safeMessage: c.safeMessage,
      })),
    });
  } catch {
    res.status(503).json({
      status: 'unavailable',
      service: 'tutor-runtime',
      timestamp: new Date().toISOString(),
      requestId: meta.requestId,
      components: [],
    });
  }
});

publicRouter.get('/readiness', async (req: Request, res: Response) => {
  const meta = safeMeta(req);
  try {
    const readiness = await getRuntimeReadiness(meta.requestId);
    res.status(readiness.ready ? 200 : 503).json(readiness);
  } catch {
    res.status(503).json({
      ready: false,
      status: 'error',
      checks: [],
      timestamp: new Date().toISOString(),
      requestId: meta.requestId,
    });
  }
});

// ─────────────────────────────────────────────────────────────
// PROTECTED router — all diagnostics routes require auth+scope
// ─────────────────────────────────────────────────────────────
export const diagnosticsRouter = Router();

function requireScope(operation: string) {
  return (req: Request, res: Response, next: Function) => {
    const actor = getReqActor(req);
    const scopeCheck = checkDiagnosticsScope({
      actorRole: actor.role,
      actorId: actor.id,
      schoolId: actor.schoolId,
      operation,
    });
    if (!scopeCheck.allowed) {
      const meta = safeMeta(req);
      recordObservabilityAudit({
        actorId: actor.id,
        actorRole: actor.role,
        schoolId: actor.schoolId,
        operation: operation as any,
        component: 'diagnostics_runtime',
        requestId: meta.requestId,
        status: 'denied',
      });
      res.status(403).json(blockedEnvelope('diagnostics_access_denied', scopeCheck.safeMessage, scopeCheck.reason, meta));
      return;
    }
    next();
  };
}

// GET /api/ops/diagnostics/summary
diagnosticsRouter.get('/summary', requireScope('diagnostics_query'), async (req: Request, res: Response) => {
  const meta = safeMeta(req);
  const actor = getReqActor(req);
  try {
    const snapshot = await getDiagnosticSnapshot({ requestId: meta.requestId, correlationId: meta.requestId });
    recordObservabilityAudit({ actorId: actor.id, actorRole: actor.role, schoolId: actor.schoolId, operation: 'diagnostics_query', component: 'diagnostics_runtime', requestId: meta.requestId, status: 'granted' });
    res.json(successEnvelope(snapshot, { ...meta, scope: actor.role }));
  } catch {
    res.status(500).json(errorEnvelope(meta));
  }
});

// GET /api/ops/diagnostics/components
diagnosticsRouter.get('/components', requireScope('component_check'), async (req: Request, res: Response) => {
  const meta = safeMeta(req);
  const actor = getReqActor(req);
  try {
    const components = await checkAllComponents();
    res.json(successEnvelope({
      components,
      overallHealth: resolveOverallHealth(components),
      timestamp: new Date().toISOString(),
    }, { ...meta, scope: actor.role }));
  } catch {
    res.status(500).json(errorEnvelope(meta));
  }
});

// GET /api/ops/diagnostics/metrics
diagnosticsRouter.get('/metrics', requireScope('metrics_query'), async (req: Request, res: Response) => {
  const meta = safeMeta(req);
  const actor = getReqActor(req);
  try {
    const metrics = getMetricsSnapshot();
    recordObservabilityAudit({ actorId: actor.id, actorRole: actor.role, schoolId: actor.schoolId, operation: 'metrics_query', component: 'diagnostics_runtime', requestId: meta.requestId, status: 'granted' });
    res.json(successEnvelope(metrics, { ...meta, scope: actor.role }));
  } catch {
    res.status(500).json(errorEnvelope(meta));
  }
});

// GET /api/ops/diagnostics/readiness — protected readiness (requires scope)
diagnosticsRouter.get('/readiness', requireScope('readiness_check'), async (req: Request, res: Response) => {
  const meta = safeMeta(req);
  const actor = getReqActor(req);
  try {
    const readiness = await getRuntimeReadiness(meta.requestId);
    res.status(readiness.ready ? 200 : 503).json(successEnvelope(readiness, { ...meta, scope: actor.role }));
  } catch {
    res.status(503).json(errorEnvelope(meta));
  }
});

// GET /api/ops/diagnostics/tutor-runtime
diagnosticsRouter.get('/tutor-runtime', requireScope('diagnostics_query'), async (req: Request, res: Response) => {
  const meta = safeMeta(req);
  const actor = getReqActor(req);
  try {
    const snapshot = await getDiagnosticSnapshot({ requestId: meta.requestId, correlationId: meta.requestId });
    res.json(successEnvelope({
      tutorRuntimeStatus: snapshot.status,
      conversationSuccessCount: snapshot.metricsSummary.conversation.successCount,
      conversationErrorCount: snapshot.metricsSummary.conversation.failureCount,
      noAiBypassBlockedCount: 0,
      noAiBypassAllowedCount: 0,
      guardBlockedCount: snapshot.metricsSummary.conversation.blockedCount,
      sourceTruthGapCount: 0,
      deenReferralBoundaryCount: snapshot.metricsSummary.policyGuards.deenBoundaries,
      safeguardingBoundaryCount: snapshot.metricsSummary.policyGuards.safeguardingBoundaries,
      safeMessages: [`Runtime ${snapshot.status}`],
      safeRecommendations: [],
    }, { ...meta, scope: actor.role }));
  } catch {
    res.status(500).json(errorEnvelope(meta));
  }
});

// GET /api/ops/diagnostics/incidents
diagnosticsRouter.get('/incidents', requireScope('incidents_query'), async (req: Request, res: Response) => {
  const meta = safeMeta(req);
  const actor = getReqActor(req);
  try {
    const incidents = getRecentIncidents(50);
    recordObservabilityAudit({ actorId: actor.id, actorRole: actor.role, schoolId: actor.schoolId, operation: 'incidents_query', component: 'diagnostics_runtime', requestId: meta.requestId, status: 'granted' });
    res.json(successEnvelope({ incidents, count: incidents.length }, { ...meta, scope: actor.role }));
  } catch {
    res.status(500).json(errorEnvelope(meta));
  }
});

// GET /api/ops/diagnostics/incidents/:incidentId
diagnosticsRouter.get('/incidents/:incidentId', requireScope('incidents_query'), async (req: Request, res: Response) => {
  const meta = safeMeta(req);
  const actor = getReqActor(req);
  try {
    const incidents = getRecentIncidents(100);
    const incident = incidents.find((i) => i.incidentId === req.params.incidentId);
    if (!incident) {
      res.status(404).json(blockedEnvelope('incident_not_found', 'Incident not found', 'not_found', meta));
      return;
    }
    res.json(successEnvelope(incident, { ...meta, scope: actor.role }));
  } catch {
    res.status(500).json(errorEnvelope(meta));
  }
});

// POST /api/ops/diagnostics/incidents/:incidentId/ack
diagnosticsRouter.post('/incidents/:incidentId/ack', requireScope('incidents_query'), async (req: Request, res: Response) => {
  const meta = safeMeta(req);
  const actor = getReqActor(req);
  try {
    recordObservabilityAudit({ actorId: actor.id, actorRole: actor.role, schoolId: actor.schoolId, operation: 'incidents_query', component: 'diagnostics_runtime', requestId: meta.requestId, status: 'granted', privacyDecision: 'acknowledged' });
    res.json(successEnvelope({ acknowledged: true, incidentId: req.params.incidentId }, { ...meta, scope: actor.role }));
  } catch {
    res.status(500).json(errorEnvelope(meta));
  }
});

// GET /api/ops/diagnostics/audit
diagnosticsRouter.get('/audit', requireScope('diagnostics_query'), async (req: Request, res: Response) => {
  const meta = safeMeta(req);
  const actor = getReqActor(req);
  try {
    const { getRecentAuditRecords } = await import('../services/task018ObservabilityAuditService');
    const records = getRecentAuditRecords(50);
    res.json(successEnvelope({ auditRecords: records, count: records.length }, { ...meta, scope: actor.role }));
  } catch {
    res.status(500).json(errorEnvelope(meta));
  }
});

// POST /api/ops/diagnostics/telemetry
diagnosticsRouter.post('/telemetry', requireScope('diagnostics_query'), async (req: Request, res: Response) => {
  const meta = safeMeta(req);
  const actor = getReqActor(req);
  try {
    const payload = req.body || {};
    const redacted = redactTelemetryPayload(payload);
    const { publishSafeTelemetryEvent } = await import('../services/task018SafeOperationsMonitoringRuntime');
    publishSafeTelemetryEvent({
      eventType: (payload.eventType as string) || 'telemetry_event',
      component: (payload.component as any) || 'operations_monitoring',
      status: (payload.status as string) || 'recorded',
      durationMs: payload.durationMs as number | undefined,
      safeMetadata: redacted.sanitizedPayload,
    });
    res.json(successEnvelope({
      recorded: true,
      redactionApplied: redacted.redactionApplied,
      redactionReasons: redacted.redactionReasons,
    }, { ...meta, scope: actor.role }));
  } catch {
    res.status(500).json(errorEnvelope(meta));
  }
});

// POST /api/ops/diagnostics/internal/redaction-check (legacy, scope-gated)
diagnosticsRouter.post('/internal/redaction-check', requireScope('redaction_check' as any), async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_REDACTION_CHECK !== 'true') {
    res.status(404).json({ error: 'Not found', requestId: (req as any).requestId });
    return;
  }
  const meta = safeMeta(req);
  const payload = req.body || {};
  const result = redactTelemetryPayload(payload);
  res.json({
    ok: result.safe,
    redactionApplied: result.redactionApplied,
    redactionReasons: result.redactionReasons,
    redactedFieldCount: result.redactionReasons.length,
    privacyMetadata: result.privacyMetadata,
    requestId: meta.requestId,
  });
});

const router = diagnosticsRouter;
export default router;
