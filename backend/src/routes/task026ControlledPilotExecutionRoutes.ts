import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import {
  rejectTask026ForbiddenFields,
  isTask026ControlRole,
  isTask026MonitoringRole,
  validateTask026ControlledPilotRunInput,
  validateTask026CohortExecutionScopeInput,
  validateTask026LearnerAccessGateInput,
  validateTask026TeacherMonitoringInput,
  validateTask026PilotEvidenceEventInput,
  validateTask026SafeguardingSignalInput,
  validateTask026IncidentWatchInput,
  validateTask026PauseControlInput,
  validateTask026ResumeControlInput,
  validateTask026RollbackControlInput,
  validateTask026DailyPilotSummaryInput,
} from '../lib/task026ControlledPilotExecutionValidation';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { checkTask025ReadinessDependency } from '../services/task026Task025ReadinessDependencyService';
import { checkTask024OperationsDependency } from '../services/task026Task024OperationsDependencyService';
import { checkGovernanceContinuity } from '../services/task026GovernanceDependencyService';
import { transitionState } from '../services/task026PilotExecutionStateMachineService';
import {
  createPilotRun,
  activatePilotRun,
  pausePilotRun,
  resumePilotRun,
  rollbackPilotRun,
  cancelPilotRun,
} from '../services/task026ControlledPilotRunService';
import { evaluateGate } from '../services/task026PilotExecutionGateService';
import { evaluateCohortScope } from '../services/task026CohortExecutionScopeService';
import { evaluateLearnerAccess } from '../services/task026LearnerAccessGateService';
import { getTeacherMonitoringSnapshot } from '../services/task026TeacherMonitoringBridgeService';
import { recordEvidenceEvent } from '../services/task026PilotEvidenceLedgerService';
import { recordSafeguardingSignal } from '../services/task026SafeguardingEscalationRuntimeService';
import { recordIncident } from '../services/task026IncidentWatchService';

import { generateDailySummary } from '../services/task026DailyPilotSummaryService';
import { getSupportQueueMetadata } from '../services/task026SupportQueueMetadataService';
import { getDiagnostics } from '../services/task026ExecutionDiagnosticsService';
import { listAuditEvents } from '../services/task026ExecutionAuditService';
import { generateReport } from '../services/task026ExecutionReportService';

const router = Router();

const schoolAuth = [schoolAuthMiddleware];

function getActorRole(req: Request): string {
  return (req as any).user?.role || 'anonymous';
}

function getActorId(req: Request): string {
  return (req as any).user?.id || 'anonymous';
}

function getSchoolId(req: Request): string | undefined {
  return (req as any).schoolId || (req as any).verifiedSchoolIdentity?.schoolId;
}

function getRequestId(req: Request): string {
  return (req as any).requestId || 'unknown';
}

function safeErrorEnvelope(res: Response, status: number, code: string, safeMessage: string, reasonCodes: string[], requestId: string): void {
  res.status(status).json({ ok: false, error: { code, safeMessage, reasonCodes }, requestId });
}

function safeDeniedResponse(res: Response, requestId: string): void {
  res.status(403).json({
    ok: false,
    error: { code: 'CONTROLLED_EXECUTION_ACCESS_DENIED', safeMessage: 'You do not have permission to perform this action.', reasonCodes: ['access_denied'] },
    requestId,
  });
}

function roleGuard(roleChecker: (role: string) => boolean) {
  return (req: Request, res: Response, next: () => void): void => {
    if (!roleChecker(getActorRole(req))) {
      safeDeniedResponse(res, getRequestId(req));
      return;
    }
    next();
  };
}

const controlGuard = [...schoolAuth, roleGuard(isTask026ControlRole)];
const monitoringGuard = [...schoolAuth, roleGuard(isTask026MonitoringRole)];

// ── Health ──

router.get('/health', ...schoolAuth, (_req: Request, res: Response) => {
  const requestId = getRequestId(_req);
  res.json({ ok: true, status: 'controlled_pilot_execution_routes_healthy', requestId });
});

// ── Preflight ──

router.post('/preflight', ...schoolAuth, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const forbidden = rejectTask026ForbiddenFields(req.body);
    if (forbidden) {
      safeErrorEnvelope(res, 400, forbidden.code, forbidden.safeMessage, forbidden.reasonCodes, requestId);
      return;
    }

    const readiness = await checkTask025ReadinessDependency({ schoolId, actorId: getActorId(req), actorRole: getActorRole(req) });
    const ops = await checkTask024OperationsDependency({ schoolId, actorId: getActorId(req), actorRole: getActorRole(req) });
    const governance = await checkGovernanceContinuity({ schoolId, actorId: getActorId(req), actorRole: getActorRole(req) });
    const gate = await evaluateGate({ runId: req.body.runId || '', schoolId, actorRole: getActorRole(req), action: 'preflight' });

    res.json({
      ok: true,
      preflight: {
        task025Readiness: readiness,
        task024Operations: ops,
        governance,
        gate,
      },
      requestId,
    });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'PREFLIGHT_FAILED', 'Preflight check failed.', ['internal_error'], requestId);
  }
});

// ── Runs CRUD (control) ──

router.post('/runs', ...controlGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const forbidden = rejectTask026ForbiddenFields(req.body);
    if (forbidden) {
      safeErrorEnvelope(res, 400, forbidden.code, forbidden.safeMessage, forbidden.reasonCodes, requestId);
      return;
    }

    const validated = validateTask026ControlledPilotRunInput({ ...req.body, schoolId, actorRole: getActorRole(req), actorId: getActorId(req) });
    if (!validated.valid) {
      safeErrorEnvelope(res, 400, validated.code, validated.safeMessage, validated.reasonCodes, requestId);
      return;
    }

    const result = await createPilotRun(validated.data);
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'RUN_CREATE_FAILED', result.safeMessage, result.reasonCodes || ['create_failed'], requestId);
      return;
    }

    res.status(201).json({ ok: true, run: result.run, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'RUN_CREATE_FAILED', 'Failed to create pilot run.', ['internal_error'], requestId);
  }
});

router.get('/runs', ...controlGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }
    const runs = await task026PilotExecutionRepository.listPilotRunsForSchool(schoolId);
    res.json({ ok: true, count: runs.length, runs, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'RUNS_LIST_FAILED', 'Failed to list pilot runs.', ['internal_error'], requestId);
  }
});

router.get('/runs/:runId', ...controlGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { runId } = req.params;
    if (!runId) {
      safeErrorEnvelope(res, 400, 'MISSING_RUN_ID', 'Run ID is required.', ['missing_run_id'], requestId);
      return;
    }
    const run = await task026PilotExecutionRepository.getPilotRun(runId);
    if (!run) {
      safeErrorEnvelope(res, 404, 'RUN_NOT_FOUND', 'Pilot run not found.', ['not_found'], requestId);
      return;
    }
    res.json({ ok: true, run, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'RUN_GET_FAILED', 'Failed to get pilot run.', ['internal_error'], requestId);
  }
});

// ── State transitions (control) ──

router.post('/runs/:runId/activate', ...controlGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { runId } = req.params;
    if (!runId) {
      safeErrorEnvelope(res, 400, 'MISSING_RUN_ID', 'Run ID is required.', ['missing_run_id'], requestId);
      return;
    }
    const result = await activatePilotRun(runId, getActorRole(req), getActorId(req));
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'ACTIVATE_FAILED', result.safeMessage, result.reasonCodes || ['transition_failed'], requestId);
      return;
    }
    res.json({ ok: true, status: 'active_controlled', requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'ACTIVATE_FAILED', 'Failed to activate pilot run.', ['internal_error'], requestId);
  }
});

router.post('/runs/:runId/pause', ...controlGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { runId } = req.params;
    if (!runId) {
      safeErrorEnvelope(res, 400, 'MISSING_RUN_ID', 'Run ID is required.', ['missing_run_id'], requestId);
      return;
    }

    const forbidden = rejectTask026ForbiddenFields(req.body);
    if (forbidden) {
      safeErrorEnvelope(res, 400, forbidden.code, forbidden.safeMessage, forbidden.reasonCodes, requestId);
      return;
    }

    const validated = validateTask026PauseControlInput({ runId, ...req.body, actorRole: getActorRole(req), actorId: getActorId(req) });
    if (!validated.valid) {
      safeErrorEnvelope(res, 400, validated.code, validated.safeMessage, validated.reasonCodes, requestId);
      return;
    }

    const result = await pausePilotRun(runId, getActorRole(req), getActorId(req), validated.data.reason, validated.data.details);
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'PAUSE_FAILED', result.safeMessage, result.reasonCodes || ['pause_failed'], requestId);
      return;
    }
    res.json({ ok: true, paused: result.ok, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'PAUSE_FAILED', 'Failed to pause pilot run.', ['internal_error'], requestId);
  }
});

router.post('/runs/:runId/resume', ...controlGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { runId } = req.params;
    if (!runId) {
      safeErrorEnvelope(res, 400, 'MISSING_RUN_ID', 'Run ID is required.', ['missing_run_id'], requestId);
      return;
    }

    const result = await resumePilotRun(runId, getActorRole(req), getActorId(req));
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'RESUME_FAILED', result.safeMessage, result.reasonCodes || ['resume_failed'], requestId);
      return;
    }
    res.json({ ok: true, resumed: result.ok, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'RESUME_FAILED', 'Failed to resume pilot run.', ['internal_error'], requestId);
  }
});

router.post('/runs/:runId/rollback', ...controlGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { runId } = req.params;
    if (!runId) {
      safeErrorEnvelope(res, 400, 'MISSING_RUN_ID', 'Run ID is required.', ['missing_run_id'], requestId);
      return;
    }

    const forbidden = rejectTask026ForbiddenFields(req.body);
    if (forbidden) {
      safeErrorEnvelope(res, 400, forbidden.code, forbidden.safeMessage, forbidden.reasonCodes, requestId);
      return;
    }

    const validated = validateTask026RollbackControlInput({ runId, ...req.body, actorRole: getActorRole(req), actorId: getActorId(req) });
    if (!validated.valid) {
      safeErrorEnvelope(res, 400, validated.code, validated.safeMessage, validated.reasonCodes, requestId);
      return;
    }

    const result = await rollbackPilotRun(runId, getActorRole(req), getActorId(req), validated.data.reason, validated.data.details);
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'ROLLBACK_FAILED', result.safeMessage, result.reasonCodes || ['rollback_failed'], requestId);
      return;
    }
    res.json({ ok: true, rolledBack: result.ok, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'ROLLBACK_FAILED', 'Failed to rollback pilot run.', ['internal_error'], requestId);
  }
});

router.post('/runs/:runId/cancel', ...controlGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { runId } = req.params;
    if (!runId) {
      safeErrorEnvelope(res, 400, 'MISSING_RUN_ID', 'Run ID is required.', ['missing_run_id'], requestId);
      return;
    }
    const result = await cancelPilotRun(runId, getActorRole(req), getActorId(req));
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'CANCEL_FAILED', result.safeMessage, result.reasonCodes || ['cancel_failed'], requestId);
      return;
    }
    res.json({ ok: true, cancelled: result.ok, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'CANCEL_FAILED', 'Failed to cancel pilot run.', ['internal_error'], requestId);
  }
});

// ── Cohort Scope (control) ──

router.post('/cohort-scope/evaluate', ...controlGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const forbidden = rejectTask026ForbiddenFields(req.body);
    if (forbidden) {
      safeErrorEnvelope(res, 400, forbidden.code, forbidden.safeMessage, forbidden.reasonCodes, requestId);
      return;
    }

    const validated = validateTask026CohortExecutionScopeInput({ ...req.body, schoolId });
    if (!validated.valid) {
      safeErrorEnvelope(res, 400, validated.code, validated.safeMessage, validated.reasonCodes, requestId);
      return;
    }

    const result = await evaluateCohortScope(validated.data);
    res.json({ ok: true, scope: result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'COHORT_SCOPE_FAILED', 'Failed to evaluate cohort scope.', ['internal_error'], requestId);
  }
});

// ── Learner Access (school-authenticated, gated at service layer) ──

router.post('/learner-access/evaluate', ...schoolAuth, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const forbidden = rejectTask026ForbiddenFields(req.body);
    if (forbidden) {
      safeErrorEnvelope(res, 400, forbidden.code, forbidden.safeMessage, forbidden.reasonCodes, requestId);
      return;
    }

    const validated = validateTask026LearnerAccessGateInput({ ...req.body, schoolId });
    if (!validated.valid) {
      safeErrorEnvelope(res, 400, validated.code, validated.safeMessage, validated.reasonCodes, requestId);
      return;
    }

    const result = await evaluateLearnerAccess(validated.data);
    if (!result.allowed) {
      safeErrorEnvelope(res, 403, 'LEARNER_ACCESS_DENIED', result.safeMessage || 'Learner access denied.', result.reasonCodes || ['access_denied'], requestId);
      return;
    }
    res.json({ ok: true, access: result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'LEARNER_ACCESS_FAILED', 'Failed to evaluate learner access.', ['internal_error'], requestId);
  }
});

// ── Teacher Monitoring (monitoring role) ──

router.post('/teacher-monitoring/snapshot', ...monitoringGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const forbidden = rejectTask026ForbiddenFields(req.body);
    if (forbidden) {
      safeErrorEnvelope(res, 400, forbidden.code, forbidden.safeMessage, forbidden.reasonCodes, requestId);
      return;
    }

    const validated = validateTask026TeacherMonitoringInput({ ...req.body, schoolId });
    if (!validated.valid) {
      safeErrorEnvelope(res, 400, validated.code, validated.safeMessage, validated.reasonCodes, requestId);
      return;
    }

    const result = await getTeacherMonitoringSnapshot(validated.data);
    res.json({ ok: true, snapshot: result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'TEACHER_SNAPSHOT_FAILED', 'Failed to take teacher monitoring snapshot.', ['internal_error'], requestId);
  }
});

// ── Evidence Ledger (school-authenticated) ──

router.post('/evidence/record', ...schoolAuth, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const forbidden = rejectTask026ForbiddenFields(req.body);
    if (forbidden) {
      safeErrorEnvelope(res, 400, forbidden.code, forbidden.safeMessage, forbidden.reasonCodes, requestId);
      return;
    }

    const validated = validateTask026PilotEvidenceEventInput({ ...req.body, schoolId, actorRole: getActorRole(req) });
    if (!validated.valid) {
      safeErrorEnvelope(res, 400, validated.code, validated.safeMessage, validated.reasonCodes, requestId);
      return;
    }

    const result = await recordEvidenceEvent(validated.data);
    if (!result) {
      safeErrorEnvelope(res, 400, 'EVIDENCE_RECORD_FAILED', 'Failed to record evidence.', ['record_failed'], requestId);
      return;
    }
    res.status(201).json({ ok: true, evidenceId: (result as any).id, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'EVIDENCE_RECORD_FAILED', 'Failed to record evidence.', ['internal_error'], requestId);
  }
});

// ── Safeguarding Signal (school-authenticated) ──

router.post('/safeguarding/signal', ...schoolAuth, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const forbidden = rejectTask026ForbiddenFields(req.body);
    if (forbidden) {
      safeErrorEnvelope(res, 400, forbidden.code, forbidden.safeMessage, forbidden.reasonCodes, requestId);
      return;
    }

    const validated = validateTask026SafeguardingSignalInput({ ...req.body, schoolId });
    if (!validated.valid) {
      safeErrorEnvelope(res, 400, validated.code, validated.safeMessage, validated.reasonCodes, requestId);
      return;
    }

    const result = await recordSafeguardingSignal(validated.data);
    if (!result) {
      safeErrorEnvelope(res, 400, 'SAFEGUARDING_SIGNAL_FAILED', 'Failed to process safeguarding signal.', ['signal_failed'], requestId);
      return;
    }
    res.status(201).json({ ok: true, signalId: (result as any).id, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'SAFEGUARDING_SIGNAL_FAILED', 'Failed to process safeguarding signal.', ['internal_error'], requestId);
  }
});

// ── Incident Watch (school-authenticated) ──

router.post('/incident/watch', ...schoolAuth, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const forbidden = rejectTask026ForbiddenFields(req.body);
    if (forbidden) {
      safeErrorEnvelope(res, 400, forbidden.code, forbidden.safeMessage, forbidden.reasonCodes, requestId);
      return;
    }

    const validated = validateTask026IncidentWatchInput({ ...req.body, schoolId });
    if (!validated.valid) {
      safeErrorEnvelope(res, 400, validated.code, validated.safeMessage, validated.reasonCodes, requestId);
      return;
    }

    const result = await recordIncident(validated.data);
    if (!result) {
      safeErrorEnvelope(res, 400, 'INCIDENT_WATCH_FAILED', 'Failed to register incident watch.', ['watch_failed'], requestId);
      return;
    }
    res.status(201).json({ ok: true, watchId: (result as any).id, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'INCIDENT_WATCH_FAILED', 'Failed to register incident watch.', ['internal_error'], requestId);
  }
});

// ── Daily Summary (control) ──

router.post('/daily-summary/generate', ...controlGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const forbidden = rejectTask026ForbiddenFields(req.body);
    if (forbidden) {
      safeErrorEnvelope(res, 400, forbidden.code, forbidden.safeMessage, forbidden.reasonCodes, requestId);
      return;
    }

    const validated = validateTask026DailyPilotSummaryInput({ ...req.body, schoolId });
    if (!validated.valid) {
      safeErrorEnvelope(res, 400, validated.code, validated.safeMessage, validated.reasonCodes, requestId);
      return;
    }

    const result = await generateDailySummary(validated.data);
    res.json({ ok: true, summary: result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'DAILY_SUMMARY_FAILED', 'Failed to generate daily summary.', ['internal_error'], requestId);
  }
});

// ── Diagnostics (control) ──

router.get('/diagnostics', ...controlGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }
    const runId = req.query.runId as string;
    if (!runId) {
      safeErrorEnvelope(res, 400, 'MISSING_RUN_ID', 'runId query parameter is required.', ['missing_run_id'], requestId);
      return;
    }
    const result = await getDiagnostics(runId, schoolId);
    res.json({ ok: true, diagnostics: result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'DIAGNOSTICS_FAILED', 'Failed to retrieve diagnostics.', ['internal_error'], requestId);
  }
});

// ── Audit (control) ──

router.get('/audit', ...controlGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }
    const runId = req.query.runId as string | undefined;
    const result = await listAuditEvents(runId);
    res.json({ ok: true, count: result.events.length, auditLog: result.events, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'AUDIT_FAILED', 'Failed to retrieve audit log.', ['internal_error'], requestId);
  }
});

// ── Report (control) ──

router.get('/report', ...controlGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }
    const runId = req.query.runId as string;
    if (!runId) {
      safeErrorEnvelope(res, 400, 'MISSING_RUN_ID', 'runId query parameter is required.', ['missing_run_id'], requestId);
      return;
    }
    const result = await generateReport(runId, { schoolId, actorId: getActorId(req), actorRole: getActorRole(req) });
    res.json({ ok: true, report: result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'REPORT_FAILED', 'Failed to retrieve execution report.', ['internal_error'], requestId);
  }
});

export default router;
