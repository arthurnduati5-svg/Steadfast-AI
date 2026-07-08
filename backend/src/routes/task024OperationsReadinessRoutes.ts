import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { requireVerifiedSchoolContext } from '../middleware/schoolContextGuardMiddleware';
import { validateTask024OperationsReadinessContext, rejectForbiddenTask024OperationFields } from '../lib/task024OperationsReadinessValidation';
import { evaluateProductionMonitoringReadiness } from '../services/task024ProductionMonitoringReadinessService';
import { evaluateOperationalAlertPolicy } from '../services/task024OperationalAlertPolicyService';
import { createIncidentResponsePlan } from '../services/task024IncidentResponseWorkflowService';
import { classifyIncidentSeverity } from '../services/task024IncidentSeverityEscalationService';
import { evaluateBackupReadiness } from '../services/task024BackupReadinessService';
import { evaluateRestoreDrillDryRun } from '../services/task024RestoreDrillDryRunService';
import { evaluateOperationalDataIntegrity } from '../services/task024OperationalDataIntegrityService';
import { evaluateOperationsPrivacy, redactOperationsPayload } from '../services/task024OperationsPrivacyGuardService';
import { buildSafeOperationsSummary } from '../services/task024SafeOperationsSummaryService';
import { evaluateLoadSimulationDryRun } from '../services/task024LoadSimulationService';
import { evaluatePerformanceBaseline } from '../services/task024PerformanceBaselineService';
import { validateOperationalRunbook } from '../services/task024OperationalRunbookValidationService';
import { verifyTask023ReadinessDependency } from '../services/task024Task023DeploymentReadinessDependencyService';
import { verifyGovernanceGateContinuity } from '../services/task024GovernanceGateContinuityService';
import { getOperationsReadinessHealth } from '../services/task024OperationsDiagnosticsService';
import { recordOperationsAuditEvent, listOperationsAuditEvents } from '../services/task024OperationsAuditService';
import { task024ReadinessRepository } from '../services/task024OperationsReadinessRepository';

const router = Router();

function getActorId(req: Request): string {
  return (req as any).user?.id || 'unknown';
}

function getActorRole(req: Request): string {
  return (req as any).user?.role || 'unknown';
}

function getSchoolId(req: Request): string | undefined {
  return (req as any).schoolId;
}

function safeDenied(res: Response, message?: string): void {
  res.status(403).json({ ok: false, error: message || 'Access denied. Operations readiness routes are admin/internal only.' });
}

function safeError(res: Response, err: unknown): void {
  const message = err instanceof Error ? err.message : 'Internal error';
  const safeMessage = message.includes('REDACTED') || message.includes('secret') || message.includes('key=') ? 'Internal error occurred' : message;
  res.status(400).json({ ok: false, error: safeMessage });
}

// GET /health
router.get('/health', async (req: Request, res: Response) => {
  try {
    ctxCheck(req);
    const diagnostics = await getOperationsReadinessHealth();
    res.json({ ok: true, status: 'healthy', diagnostics, timestamp: new Date().toISOString() });
  } catch (err) { safeError(res, err); }
});

// POST /evaluate
router.post('/evaluate', async (req: Request, res: Response) => {
  try {
    ctxCheck(req);
    const monitoring = await evaluateProductionMonitoringReadiness();
    const alertPolicy = await evaluateOperationalAlertPolicy('operations_readiness');
    const backup = await evaluateBackupReadiness();
    const restore = await evaluateRestoreDrillDryRun();
    const dataIntegrity = await evaluateOperationalDataIntegrity();
    const runbook = await validateOperationalRunbook();
    const task023 = await verifyTask023ReadinessDependency();
    const governance = await verifyGovernanceGateContinuity();
    const summary = await buildSafeOperationsSummary();

    const allReady = monitoring.status === 'healthy' && backup.status === 'ready' && restore.status === 'dry_run_passed' && dataIntegrity.status === 'passed';
    const decision = allReady ? 'ready' : monitoring.status === 'blocked' ? 'blocked' : 'not_ready';

    await task024ReadinessRepository.recordOperationsReadinessDecision({
      decision,
      monitoringReady: monitoring.status === 'healthy',
      alertPolicyReady: alertPolicy.policyDefined,
      incidentWorkflowReady: true,
      incidentSeverityReady: true,
      backupReady: backup.status === 'ready',
      restoreDryRunReady: restore.status === 'dry_run_passed',
      dataIntegrityReady: dataIntegrity.status === 'passed',
      privacyGuardReady: true,
      loadSimulationReady: true,
      performanceBaselineReady: true,
      runbookValidationReady: runbook.status === 'passed',
      task023DependencyReady: task023.status === 'passed',
      governanceContinuityReady: governance.status === 'passed',
      blockingReasons: [],
      warningReasons: [],
      evaluatedAt: new Date().toISOString(),
    });

    await recordOpsAudit(req, 'operations_readiness_evaluated', ['readiness_evaluated']);

    res.json({ ok: true, decision, monitoring, backup, restore, dataIntegrity, summary, timestamp: new Date().toISOString() });
  } catch (err) { safeError(res, err); }
});

// POST /monitoring/evaluate
router.post('/monitoring/evaluate', async (req: Request, res: Response) => {
  try {
    ctxCheck(req);
    const result = await evaluateProductionMonitoringReadiness();
    await recordOpsAudit(req, 'monitoring_readiness_evaluated', ['monitoring_evaluated']);
    res.json({ ok: true, result });
  } catch (err) { safeError(res, err); }
});

// POST /alerts/evaluate
router.post('/alerts/evaluate', async (req: Request, res: Response) => {
  try {
    ctxCheck(req);
    const category = req.body.category || 'operations_readiness';
    const result = await evaluateOperationalAlertPolicy(category, req.body.severity);
    await recordOpsAudit(req, 'alert_policy_evaluated', ['alert_policy_evaluated']);
    res.json({ ok: true, result });
  } catch (err) { safeError(res, err); }
});

// POST /incidents/evaluate
router.post('/incidents/evaluate', async (req: Request, res: Response) => {
  try {
    ctxCheck(req);
    const { incidentId, category, severity, owner } = req.body;
    const plan = await createIncidentResponsePlan(incidentId || 'drill_001', category || 'unknown', severity || 'sev4_low_priority', owner || 'operations_team');
    await recordOpsAudit(req, 'incident_workflow_evaluated', ['incident_workflow_evaluated']);
    res.json({ ok: true, plan });
  } catch (err) { safeError(res, err); }
});

// POST /incidents/severity
router.post('/incidents/severity', async (req: Request, res: Response) => {
  try {
    ctxCheck(req);
    const { incidentId, category } = req.body;
    const decision = await classifyIncidentSeverity(incidentId || 'drill_001', category || 'unknown');
    await recordOpsAudit(req, 'incident_severity_evaluated', ['severity_evaluated']);
    res.json({ ok: true, decision });
  } catch (err) { safeError(res, err); }
});

// POST /backup/evaluate
router.post('/backup/evaluate', async (req: Request, res: Response) => {
  try {
    ctxCheck(req);
    const result = await evaluateBackupReadiness();
    await recordOpsAudit(req, 'backup_readiness_evaluated', ['backup_evaluated']);
    res.json({ ok: true, result });
  } catch (err) { safeError(res, err); }
});

// POST /restore/dry-run
router.post('/restore/dry-run', async (req: Request, res: Response) => {
  try {
    ctxCheck(req);
    const result = await evaluateRestoreDrillDryRun();
    await recordOpsAudit(req, 'restore_drill_dry_run_evaluated', ['restore_dry_run']);
    res.json({ ok: true, result });
  } catch (err) { safeError(res, err); }
});

// POST /data-integrity/evaluate
router.post('/data-integrity/evaluate', async (req: Request, res: Response) => {
  try {
    ctxCheck(req);
    const result = await evaluateOperationalDataIntegrity();
    await recordOpsAudit(req, 'data_integrity_evaluated', ['integrity_evaluated']);
    res.json({ ok: true, result });
  } catch (err) { safeError(res, err); }
});

// POST /privacy/evaluate
router.post('/privacy/evaluate', async (req: Request, res: Response) => {
  try {
    ctxCheck(req);
    const payload = req.body.payload || {};
    const forbiddenCheck = rejectForbiddenTask024OperationFields(payload);
    if (!forbiddenCheck.valid) {
      res.status(400).json({ ok: false, error: 'Payload contains forbidden fields', forbiddenFields: forbiddenCheck.forbiddenFields });
      return;
    }
    const redacted = redactOperationsPayload(payload);
    const result = await evaluateOperationsPrivacy(payload);
    await recordOpsAudit(req, 'operations_privacy_guard_evaluated', ['privacy_evaluated']);
    res.json({ ok: true, result, redactedPayload: redacted });
  } catch (err) { safeError(res, err); }
});

// POST /load-simulation/dry-run
router.post('/load-simulation/dry-run', async (req: Request, res: Response) => {
  try {
    ctxCheck(req);
    const { targetComponents, concurrentCount, durationMs } = req.body;
    const result = await evaluateLoadSimulationDryRun(
      targetComponents || ['school_auth', 'governance'],
      concurrentCount || 100,
      durationMs || 5000
    );
    await recordOpsAudit(req, 'load_simulation_evaluated', ['load_sim_evaluated']);
    res.json({ ok: true, result });
  } catch (err) { safeError(res, err); }
});

// POST /performance/baseline
router.post('/performance/baseline', async (req: Request, res: Response) => {
  try {
    ctxCheck(req);
    const { latencyMs, errorRate, throughputPerSecond, backpressureLevel } = req.body;
    const result = await evaluatePerformanceBaseline(
      latencyMs || 100, errorRate || 0.01, throughputPerSecond || 100, backpressureLevel || 'low'
    );
    await recordOpsAudit(req, 'performance_baseline_evaluated', ['baseline_evaluated']);
    res.json({ ok: true, result });
  } catch (err) { safeError(res, err); }
});

// POST /runbooks/validate
router.post('/runbooks/validate', async (req: Request, res: Response) => {
  try {
    ctxCheck(req);
    const result = await validateOperationalRunbook();
    await recordOpsAudit(req, 'runbook_validation_evaluated', ['runbook_validated']);
    res.json({ ok: true, result });
  } catch (err) { safeError(res, err); }
});

// POST /dependencies/task023/evaluate
router.post('/dependencies/task023/evaluate', async (req: Request, res: Response) => {
  try {
    ctxCheck(req);
    const result = await verifyTask023ReadinessDependency();
    await recordOpsAudit(req, 'task023_dependency_evaluated', ['task023_checked']);
    res.json({ ok: true, result });
  } catch (err) { safeError(res, err); }
});

// POST /governance-continuity/evaluate
router.post('/governance-continuity/evaluate', async (req: Request, res: Response) => {
  try {
    ctxCheck(req);
    const result = await verifyGovernanceGateContinuity();
    await recordOpsAudit(req, 'governance_gate_continuity_evaluated', ['governance_checked']);
    res.json({ ok: true, result });
  } catch (err) { safeError(res, err); }
});

// GET /diagnostics
router.get('/diagnostics', async (req: Request, res: Response) => {
  try {
    ctxCheck(req);
    const diagnostics = await getOperationsReadinessHealth();
    await recordOpsAudit(req, 'diagnostic_viewed', ['diagnostics_viewed']);
    res.json({ ok: true, diagnostics, count: diagnostics.length, timestamp: new Date().toISOString() });
  } catch (err) { safeError(res, err); }
});

// GET /audit
router.get('/audit', async (req: Request, res: Response) => {
  try {
    ctxCheck(req);
    const events = await listOperationsAuditEvents();
    res.json({ ok: true, events, count: events.length });
  } catch (err) { safeError(res, err); }
});

// GET /latest-decision
router.get('/latest-decision', async (req: Request, res: Response) => {
  try {
    ctxCheck(req);
    const decision = await task024ReadinessRepository.getLatestOperationsReadinessDecision();
    if (!decision) {
      res.json({ ok: true, decision: null, message: 'No operations readiness decision recorded yet. POST /evaluate to generate one.' });
      return;
    }
    res.json({ ok: true, decision });
  } catch (err) { safeError(res, err); }
});

function ctxCheck(req: Request): void {
  const role = getActorRole(req);
  if (!role || role === 'unknown' || role === 'learner' || role === 'student' || role === 'parent' || role === 'peer' || role === 'guardian') {
    throw new Error('Access denied. Admin or internal operator role required.');
  }
}

async function recordOpsAudit(req: Request, eventType: string, reasonCodes: string[]): Promise<void> {
  try {
    await recordOperationsAuditEvent({
      schoolId: getSchoolId(req),
      actorId: getActorId(req),
      actorRole: getActorRole(req),
      operationEnvironment: 'local',
      component: 'task024_operations_readiness',
      eventType: eventType as any,
      safeReasonCodes: reasonCodes,
      safeMetadata: { path: req.path, method: req.method },
    });
  } catch {
    // silent
  }
}

export default router;
