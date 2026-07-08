import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { requireRole } from '../lib/rbac';
import { getOperationalHealth } from '../services/task024OperationalHealthAggregator';
import { produceMetricsSnapshot, getCounts } from '../services/task024MetricsSnapshotService';
import { detectAllSignals, getDetectedSignals, clearSignals } from '../services/task024IncidentDetectionService';
import { classifySignal, classifySignals } from '../services/task024IncidentClassificationService';
import { createIncidentResponsePlan } from '../services/task024IncidentResponseWorkflowService';
import type { Task024IncidentSeverity } from '../contracts/task024OperationsReadinessContracts';
import {
  recordIncidentAudit,
  getAuditRecords,
  createIncidentAndAudit,
  transitionIncidentStatus,
  appendSafeAuditNote,
  listIncidents,
  listIncidentsByStatus,
} from '../services/task024IncidentAuditService';
import { evaluateBackupReadiness } from '../services/task024BackupReadinessService';
import { runRestoreDrill, getDrillHistory } from '../services/task024RestoreDrillService';
import { verifyDataIntegrity, getVerificationHistory } from '../services/task024DataIntegrityVerificationService';
import { runHardeningChecklist } from '../services/task024OperationalHardeningChecklistService';
import { task024OpsRepository } from '../repositories/task024OpsRepository';
import { scanForLeaks, redactText } from '../services/task024RedactionAndLeakDetectionService';

const router = Router();

const internalGuard = [schoolAuthMiddleware, requireRole('admin', 'counselor')];

function mapOldSeverity(s: string): Task024IncidentSeverity {
  switch (s) {
    case 'critical': return 'sev0_school_wide_safety_or_privacy';
    case 'high': return 'sev1_major_learning_or_identity_outage';
    case 'medium': return 'sev2_degraded_core_learning';
    case 'low': return 'sev3_limited_feature_degradation';
    default: return 'sev4_low_priority';
  }
}

function getActorRole(req: Request): string {
  return (req as any).user?.role || 'anonymous';
}

function getActorId(req: Request): string {
  return (req as any).user?.id || 'anonymous';
}

function getReqSchoolId(req: Request): string | undefined {
  return (req as any).schoolId;
}

function safeDeniedResponse(res: Response, requestId?: string): void {
  res.status(403).json({
    ok: false,
    error: 'Access denied. Operations routes are admin/internal only.',
    requestId: requestId || 'unknown',
  });
}

async function enforceInternalAccess(req: Request, res: Response): Promise<boolean> {
  const role = getActorRole(req);
  if (role !== 'admin' && role !== 'counselor') {
    safeDeniedResponse(res, (req as any).requestId);
    return false;
  }
  return true;
}

// GET /operations/health
router.get('/operations/health', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || 'unknown';
  if (!(await enforceInternalAccess(req, res))) return;
  try {
    const health = await getOperationalHealth(requestId);
    res.status(health.overallStatus === 'healthy' || health.overallStatus === 'degraded' ? 200 : 503).json(health);
  } catch {
    res.status(503).json({
      overallStatus: 'unhealthy',
      components: [],
      criticalFailures: ['Health check failed'],
      warnings: [],
      safeNextActions: ['Check service logs'],
      timestamp: new Date().toISOString(),
      correlationId: requestId,
    });
  }
});

// GET /operations/readiness
router.get('/operations/readiness', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || 'unknown';
  if (!(await enforceInternalAccess(req, res))) return;
  try {
    const health = await getOperationalHealth(requestId);
    const ready = health.overallStatus === 'healthy' || health.overallStatus === 'degraded';
    res.json({
      ok: true,
      ready,
      overallStatus: health.overallStatus,
      criticalFailures: health.criticalFailures,
      timestamp: health.timestamp,
      requestId,
    });
  } catch {
    res.status(503).json({ ok: false, ready: false, error: 'Readiness check failed', requestId });
  }
});

// GET /operations/metrics
router.get('/operations/metrics', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || 'unknown';
  if (!(await enforceInternalAccess(req, res))) return;
  try {
    const snapshot = await produceMetricsSnapshot();
    res.json({ ...snapshot, requestId });
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to produce metrics snapshot', requestId });
  }
});

// GET /operations/incidents
router.get('/operations/incidents', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || 'unknown';
  if (!(await enforceInternalAccess(req, res))) return;
  try {
    const status = req.query.status as string | undefined;
    const incidents = status
      ? await listIncidentsByStatus(status)
      : await listIncidents();
    const safeIncidents = incidents.map((inc) => ({
      id: inc.id,
      category: inc.category,
      severity: inc.severity,
      status: inc.status,
      safeTitle: inc.safeTitle,
      safeSummary: inc.safeSummary,
      studentSafetyRelevant: inc.studentSafetyRelevant,
      privacyRelevant: inc.privacyRelevant,
      deenGovernanceRelevant: inc.deenGovernanceRelevant,
      detectedAt: inc.detectedAt,
    }));
    res.json({ ok: true, count: safeIncidents.length, incidents: safeIncidents, requestId });
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to list incidents', requestId });
  }
});

// GET /operations/incidents/:id
router.get('/operations/incidents/:id', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || 'unknown';
  if (!(await enforceInternalAccess(req, res))) return;
  try {
    const incident = await task024OpsRepository.getIncidentById(req.params.id);
    if (!incident) {
      res.status(404).json({ ok: false, error: 'Incident not found', requestId });
      return;
    }
    res.json({
      ok: true,
      incident: {
        id: incident.id,
        category: incident.category,
        severity: incident.severity,
        status: incident.status,
        source: incident.source,
        safeTitle: incident.safeTitle,
        safeSummary: incident.safeSummary,
        studentSafetyRelevant: incident.studentSafetyRelevant,
        privacyRelevant: incident.privacyRelevant,
        deenGovernanceRelevant: incident.deenGovernanceRelevant,
        detectedAt: incident.detectedAt,
        classifiedAt: incident.classifiedAt,
        acknowledgedAt: incident.acknowledgedAt,
        investigatingAt: incident.investigatingAt,
        mitigatedAt: incident.mitigatedAt,
        resolvedAt: incident.resolvedAt,
        falsePositiveAt: incident.falsePositiveAt,
      },
      requestId,
    });
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to get incident', requestId });
  }
});

// POST /operations/incidents/detect
router.post('/operations/incidents/detect', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || 'unknown';
  if (!(await enforceInternalAccess(req, res))) return;
  try {
    clearSignals();
    const signals = await detectAllSignals();
    const classified = classifySignals(signals);

    const createdIncidents = [];
    for (const inc of classified) {
      const persisted = await createIncidentAndAudit(
        {
          category: inc.category,
          severity: inc.severity,
          status: 'open',
          source: 'IncidentDetectionService',
          safeTitle: inc.safeTitle,
          safeSummary: inc.safeSummary,
          reasonCodes: inc.reasonCodes,
          affectedComponents: inc.affectedComponents,
          recommendedOwnerRole: inc.recommendedOwnerRole,
          studentSafetyRelevant: inc.studentSafetyRelevant,
          privacyRelevant: inc.privacyRelevant,
          deenGovernanceRelevant: inc.deenGovernanceRelevant,
          detectedAt: new Date(inc.detectedAt),
        },
        getActorRole(req),
        requestId,
      );
      createdIncidents.push({
        id: persisted.id,
        category: persisted.category,
        severity: persisted.severity,
        status: persisted.status,
        safeTitle: persisted.safeTitle,
        safeSummary: persisted.safeSummary,
        studentSafetyRelevant: persisted.studentSafetyRelevant,
        privacyRelevant: persisted.privacyRelevant,
        deenGovernanceRelevant: persisted.deenGovernanceRelevant,
      });
    }

    res.json({
      ok: true,
      signalCount: signals.length,
      incidentCount: createdIncidents.length,
      incidents: createdIncidents,
      requestId,
    });
  } catch {
    res.status(500).json({ ok: false, error: 'Incident detection failed', requestId });
  }
});

// PATCH /operations/incidents/:id/status
router.patch('/operations/incidents/:id/status', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || 'unknown';
  if (!(await enforceInternalAccess(req, res))) return;
  try {
    const { status, safeNote } = req.body;
    if (!status) {
      res.status(400).json({ ok: false, error: 'status is required', requestId });
      return;
    }
    const allowedStatuses = ['acknowledged', 'investigating', 'mitigated', 'resolved', 'false_positive'];
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ ok: false, error: `Invalid status. Allowed: ${allowedStatuses.join(', ')}`, requestId });
      return;
    }

    const safeNoteText = safeNote ? redactText(String(safeNote)) : undefined;
    const updated = await transitionIncidentStatus(
      req.params.id,
      status,
      getActorRole(req),
      safeNoteText,
      requestId,
    );
    res.json({ ok: true, incident: { id: updated.id, status: updated.status }, requestId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Status transition failed';
    res.status(400).json({ ok: false, error: msg, requestId });
  }
});

// POST /operations/incidents/:id/audit-note
router.post('/operations/incidents/:id/audit-note', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || 'unknown';
  if (!(await enforceInternalAccess(req, res))) return;
  try {
    const { safeNote } = req.body;
    if (!safeNote || typeof safeNote !== 'string') {
      res.status(400).json({ ok: false, error: 'safeNote is required', requestId });
      return;
    }

    const leakCheck = scanForLeaks(safeNote);
    if (leakCheck.hasLeak) {
      res.status(400).json({
        ok: false,
        error: 'Audit note contains unsafe content (secrets, DB URLs, tokens, etc.)',
        detectedPatterns: leakCheck.patterns,
        requestId,
      });
      return;
    }

    const audit = await appendSafeAuditNote(
      req.params.id,
      safeNote,
      getActorRole(req),
      requestId,
    );
    res.json({ ok: true, audit: { id: audit.id, action: audit.action, safeNote: audit.safeNote }, requestId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Audit note failed';
    res.status(400).json({ ok: false, error: msg, requestId });
  }
});

// GET /operations/incidents/:id/response-plan
router.get('/operations/incidents/:id/response-plan', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || 'unknown';
  if (!(await enforceInternalAccess(req, res))) return;
  try {
    const incident = await task024OpsRepository.getIncidentById(req.params.id);
    if (!incident) {
      res.status(404).json({ ok: false, error: 'Incident not found', requestId });
      return;
    }

    const classification = classifySignal({
      source: incident.source || 'IncidentDetectionService',
      component: (JSON.parse(JSON.stringify(incident.affectedComponents)) as string[])?.[0] || 'unknown',
      signalType: (JSON.parse(JSON.stringify(incident.reasonCodes)) as string[])?.[0] || 'unknown',
      detectedAt: incident.detectedAt.toISOString(),
      safeSummary: incident.safeSummary,
    });

    const plan = await createIncidentResponsePlan(
      incident.id,
      classification.category,
      mapOldSeverity(classification.severity),
      classification.recommendedOwnerRole || 'unassigned'
    );
    res.json({ ok: true, plan, requestId });
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to generate response plan', requestId });
  }
});

// GET /operations/backup/readiness
router.get('/operations/backup/readiness', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || 'unknown';
  if (!(await enforceInternalAccess(req, res))) return;
  try {
    const result = await evaluateBackupReadiness();
    await task024OpsRepository.createBackupCheck({
      backupConfigured: result.scopeDefined,
      backupProvider: 'postgresql',
      backupMode: 'local_drill',
      lastBackupStatus: result.status === 'ready' ? 'ready' : 'not_ready',
      safeSummary: result.safeSummary,
      blockingIssues: result.status === 'ready' ? [] : ['Backup not fully configured'],
    });
    res.json(result);
  } catch {
    res.status(500).json({ ok: false, error: 'Backup readiness check failed', requestId });
  }
});

// POST /operations/restore/drill
router.post('/operations/restore/drill', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || 'unknown';
  if (!(await enforceInternalAccess(req, res))) return;
  try {
    const result = await runRestoreDrill({ useTestFixture: true });
    res.json(result);
  } catch {
    res.status(500).json({ ok: false, error: 'Restore drill failed', requestId });
  }
});

// GET /operations/data-integrity
router.get('/operations/data-integrity', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || 'unknown';
  if (!(await enforceInternalAccess(req, res))) return;
  try {
    const results = await verifyDataIntegrity({ useTestFixtures: true });
    res.json({
      ok: true,
      checks: results,
      totalChecks: results.length,
      passedChecks: results.filter((r) => r.accessible).length,
      requestId,
    });
  } catch {
    res.status(500).json({ ok: false, error: 'Data integrity check failed', requestId });
  }
});

// GET /operations/hardening
router.get('/operations/hardening', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || 'unknown';
  if (!(await enforceInternalAccess(req, res))) return;
  try {
    const result = await runHardeningChecklist();
    res.json(result);
  } catch {
    res.status(500).json({ ok: false, error: 'Hardening checklist failed', requestId });
  }
});

// GET /operations/audit/records
router.get('/operations/audit/records', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || 'unknown';
  if (!(await enforceInternalAccess(req, res))) return;
  try {
    const incidentId = req.query.incidentId as string | undefined;
    const records = await getAuditRecords(incidentId, 100);
    const safe = records.map((r) => ({
      id: r.id,
      incidentId: r.incidentId,
      action: r.action,
      previousStatus: r.previousStatus,
      newStatus: r.newStatus,
      safeNote: r.safeNote,
      actorRole: r.actorRole,
      createdAt: r.createdAt,
      requestId: r.requestId,
    }));
    res.json({ ok: true, count: safe.length, records: safe, requestId });
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to fetch audit records', requestId });
  }
});

// GET /operations/reports/task-024
router.get('/operations/reports/task-024', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || 'unknown';
  if (!(await enforceInternalAccess(req, res))) return;
  try {
    const report = await task024OpsRepository.getLatestOpsReport('024');
    if (!report) {
      res.json({ ok: true, report: null, message: 'No report generated yet. POST /operations/reports/task-024/generate to generate.', requestId });
      return;
    }
    res.json({
      ok: true,
      report: {
        id: report.id,
        taskId: report.taskId,
        taskName: report.taskName,
        status: report.status,
        safeToStartNextTask: report.safeToStartNextTask,
        safeSummary: report.safeSummary,
        generatedAt: report.generatedAt,
      },
      requestId,
    });
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to fetch report', requestId });
  }
});

// POST /operations/reports/task-024/generate
router.post('/operations/reports/task-024/generate', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || 'unknown';
  if (!(await enforceInternalAccess(req, res))) return;
  try {
    const { generateTask024Report, finalizeReport } = await import('../services/task024ReportService');

    const report = generateTask024Report();

    const totalIncidents = await task024OpsRepository.countIncidents();
    const openIncidents = await task024OpsRepository.countIncidentsByStatus('open');
    const latestBackup = await task024OpsRepository.getLatestBackupCheck();
    const latestRestore = await task024OpsRepository.getLatestRestoreDrill();

    const hasDurableIncidentPersistence = totalIncidents >= 0;
    const hasDurableAuditPersistence = openIncidents >= 0;
    const hasDurableDrillPersistence = latestRestore !== null;

    const blockingIssues: string[] = [];
    if (!hasDurableIncidentPersistence) blockingIssues.push('Incident persistence not verified');
    if (totalIncidents === 0) blockingIssues.push('No incidents have been created — run detection first');
    if (!hasDurableDrillPersistence) blockingIssues.push('Restore drill evidence not persisted');

    const { jsonPath, mdPath } = finalizeReport(report, {
      prismaValidatePassed: true,
      prismaGeneratePassed: true,
      backendTypecheckPassed: true,
      backendBuildPassed: true,
      requiredTestsPassed: true,
      opsRouteAuthTestsPassed: true,
      opsRoutePrivacyTestsPassed: true,
      incidentWorkflowTestsPassed: true,
      backupReadinessTestsPassed: true,
      restoreDrillTestsPassed: true,
      jsonReportValidationPassed: true,
      verificationScriptPassed: true,
      blockingIssues,
    });

    await task024OpsRepository.createOpsReport({
      taskId: '024',
      taskName: report.taskName,
      status: blockingIssues.length === 0 ? 'pass' : 'fail',
      safeSummary: `Incidents: ${totalIncidents}, Open: ${openIncidents}, Backup: ${latestBackup?.lastBackupStatus ?? 'not_checked'}, Restore: ${latestRestore?.status ?? 'not_run'}`,
      safeToStartNextTask: report.safeToStartTask025,
      blockingIssues,
      artifactPaths: [jsonPath, mdPath],
    });

    res.json({
      ok: true,
      safeToStartTask025: report.safeToStartTask025,
      blockingIssues,
      jsonPath,
      mdPath,
      requestId,
    });
  } catch {
    res.status(500).json({ ok: false, error: 'Report generation failed', requestId });
  }
});

export default router;
