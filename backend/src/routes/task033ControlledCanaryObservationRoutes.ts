import { Router, Request, Response, NextFunction } from 'express';
import { loadTask032ProofForTask033 } from '../services/task033Task032ProofLoaderService';
import { checkTask033ObservationEnvironmentGate } from '../services/task033ObservationEnvironmentGateService';
import { startTask033Observation, pauseTask033Observation, enableTask033KillSwitch, requestTask033Rollback } from '../services/task033ObservationSessionCommandService';
import { intakeTask033ObservationEvent } from '../services/task033ObservationEventIntakeService';
import { aggregateTask033ObservationEvents } from '../services/task033SafeAggregationService';
import { observeTask033CanaryHealth } from '../services/task033CanaryHealthObservationService';
import { observeTask033RuntimeGuard } from '../services/task033RuntimeGuardObservationService';
import { observeTask033PrivacyBoundary } from '../services/task033PrivacyBoundaryObservationService';
import { observeTask033ContentGovernance } from '../services/task033ContentGovernanceObservationService';
import { observeTask033SocraticIntegrity } from '../services/task033SocraticIntegrityObservationService';
import { observeTask033DeenBoundary } from '../services/task033DeenBoundaryObservationService';
import { observeTask033SchoolIdentity } from '../services/task033SchoolIdentityObservationService';
import { observeTask033CrossSchoolDenial } from '../services/task033CrossSchoolDenialObservationService';
import { observeTask033IncidentSignals } from '../services/task033IncidentSignalObservationService';
import { observeTask033RollbackReadiness } from '../services/task033RollbackReadinessObservationService';
import { detectTask033CanaryDrift } from '../services/task033CanaryDriftDetectionService';
import { buildTask033SafeReadModel } from '../services/task033ObservationSafeReadModelService';
import { appendTask033Evidence, getTask033EvidenceLedger } from '../services/task033ObservationEvidenceLedgerService';
import { runTask033Diagnostics } from '../services/task033ObservationDiagnosticsService';
import { generateTask033Report, getLatestTask033Report } from '../services/task033ObservationReportService';
import { createTask033Session, transitionTask033SessionStatus, isValidTransition } from '../services/task033ObservationSessionStateMachineService';
import { task033Repository } from '../repositories/task033ControlledCanaryObservationRepository';
import {
  resolveTask033ActorRole,
  isTask033AdminOperatorRole,
  isTask033DeniedRole,
} from '../contracts/task033ControlledCanaryObservationContracts';

const router = Router();

function safeError(res: Response, status: number, message: string, reasonCodes: string[] = []) {
  res.status(status).json({ error: message, reasonCodes, safe: true });
}

function getActorInfo(req: Request): { actorRole: string; schoolId: string } {
  const body = req.body || {};
  const query = req.query || {};
  return {
    actorRole: body.actorRole || (query.actorRole as string) || req.user?.role || 'unknown',
    schoolId: body.schoolId || (query.schoolId as string) || req.schoolId || '',
  };
}

function requireAdminOperator(req: Request, res: Response, next: NextFunction): void {
  const { actorRole } = getActorInfo(req);
  const resolved = resolveTask033ActorRole(actorRole);
  if (!isTask033AdminOperatorRole(resolved)) {
    const blockedReason = `role_'${actorRole}'_cannot_access_this_endpoint`;
    res.status(403).json({ blockingIssues: [blockedReason], reasonCodes: [blockedReason], ok: false, allowed: false, acknowledged: false });
    return;
  }
  next();
}

function denyDeniedRoles(req: Request, res: Response, next: NextFunction): void {
  const { actorRole } = getActorInfo(req);
  const resolved = resolveTask033ActorRole(actorRole);
  if (isTask033DeniedRole(resolved)) {
    const blockedReason = `role_'${resolved}'_cannot_access_this_endpoint`;
    res.status(403).json({ blockingIssues: [blockedReason], reasonCodes: [blockedReason], ok: false, allowed: false, acknowledged: false });
    return;
  }
  next();
}

// 1. Health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, timestamp: new Date().toISOString(), status: 'task033_observation_runtime_active' });
});

// 2. Task 032 dependency check
router.post('/dependency/task032/check', denyDeniedRoles, async (_req: Request, res: Response) => {
  try {
    const result = await loadTask032ProofForTask033();
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Task 032 dependency check failed', ['DEPENDENCY_CHECK_FAILED']);
  }
});

// 3. Environment preflight
router.post('/environment/preflight', denyDeniedRoles, async (req: Request, res: Response) => {
  try {
    const result = await checkTask033ObservationEnvironmentGate(req.body);
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Environment preflight check failed', ['ENVIRONMENT_PREFLIGHT_FAILED']);
  }
});

// 4. Create session
router.post('/sessions', requireAdminOperator, async (req: Request, res: Response) => {
  try {
    const session = await createTask033Session(req.body);
    res.json(session);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to create observation session', ['SESSION_CREATION_FAILED']);
  }
});

// 5. Get session
router.get('/sessions/:sessionId', denyDeniedRoles, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await task033Repository.getSession(sessionId);
    if (!session) {
      return safeError(res, 404, 'Observation session not found', ['SESSION_NOT_FOUND']);
    }
    res.json(session);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to retrieve observation session', ['SESSION_RETRIEVAL_FAILED']);
  }
});

// 6. Start observation
router.post('/sessions/:sessionId/start-observation', requireAdminOperator, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await startTask033Observation(sessionId);
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to start observation', ['START_OBSERVATION_FAILED']);
  }
});

// 7. Intake event
router.post('/sessions/:sessionId/events', denyDeniedRoles, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const input = { ...req.body, sessionId };
    const result = await intakeTask033ObservationEvent(input);
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to intake observation event', ['EVENT_INTAKE_FAILED']);
  }
});

// 8. Safe summary of events
router.get('/sessions/:sessionId/events/safe-summary', denyDeniedRoles, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const events = await task033Repository.listEvents(sessionId);
    res.json({ sessionId, eventCount: events.length, events });
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to retrieve event summary', ['EVENT_SUMMARY_FAILED']);
  }
});

// 9. Aggregate
router.post('/sessions/:sessionId/aggregate', requireAdminOperator, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await aggregateTask033ObservationEvents(sessionId);
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to aggregate observation events', ['AGGREGATION_FAILED']);
  }
});

// 10. Observe health
router.post('/sessions/:sessionId/observe-health', denyDeniedRoles, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const metrics = req.body;
    const result = await observeTask033CanaryHealth(metrics);
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Health observation failed', ['HEALTH_OBSERVATION_FAILED']);
  }
});

// 11. Observe runtime guard
router.post('/sessions/:sessionId/observe-runtime-guard', denyDeniedRoles, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await observeTask033RuntimeGuard(sessionId);
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Runtime guard observation failed', ['RUNTIME_GUARD_OBSERVATION_FAILED']);
  }
});

// 12. Observe privacy boundary
router.post('/sessions/:sessionId/observe-privacy-boundary', denyDeniedRoles, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await observeTask033PrivacyBoundary(sessionId);
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Privacy boundary observation failed', ['PRIVACY_OBSERVATION_FAILED']);
  }
});

// 13. Observe content governance
router.post('/sessions/:sessionId/observe-content-governance', denyDeniedRoles, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await observeTask033ContentGovernance(sessionId);
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Content governance observation failed', ['GOVERNANCE_OBSERVATION_FAILED']);
  }
});

// 14. Observe socratic integrity
router.post('/sessions/:sessionId/observe-socratic-integrity', denyDeniedRoles, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await observeTask033SocraticIntegrity(sessionId);
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Socratic integrity observation failed', ['SOCRATIC_OBSERVATION_FAILED']);
  }
});

// 15. Observe deen boundary
router.post('/sessions/:sessionId/observe-deen-boundary', denyDeniedRoles, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await observeTask033DeenBoundary(sessionId);
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Deen boundary observation failed', ['DEEN_OBSERVATION_FAILED']);
  }
});

// 16. Observe school identity
router.post('/sessions/:sessionId/observe-school-identity', denyDeniedRoles, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await observeTask033SchoolIdentity(sessionId);
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'School identity observation failed', ['IDENTITY_OBSERVATION_FAILED']);
  }
});

// 17. Observe cross-school denial
router.post('/sessions/:sessionId/observe-cross-school-denial', denyDeniedRoles, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await observeTask033CrossSchoolDenial(sessionId);
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Cross-school denial observation failed', ['CROSS_SCHOOL_OBSERVATION_FAILED']);
  }
});

// 18. Observe incident signals
router.post('/sessions/:sessionId/observe-incident-signals', denyDeniedRoles, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await observeTask033IncidentSignals(sessionId);
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Incident signal observation failed', ['INCIDENT_OBSERVATION_FAILED']);
  }
});

// 19. Observe rollback readiness
router.post('/sessions/:sessionId/observe-rollback-readiness', denyDeniedRoles, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await observeTask033RollbackReadiness(sessionId);
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Rollback readiness observation failed', ['ROLLBACK_OBSERVATION_FAILED']);
  }
});

// 20. Detect drift
router.post('/sessions/:sessionId/detect-drift', denyDeniedRoles, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const environmentInput = req.body;
    const result = await detectTask033CanaryDrift(sessionId, environmentInput);
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Drift detection failed', ['DRIFT_DETECTION_FAILED']);
  }
});

// 21. Safe view (read model)
router.get('/sessions/:sessionId/safe-view', denyDeniedRoles, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await buildTask033SafeReadModel(sessionId);
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to build safe read model', ['SAFE_VIEW_FAILED']);
  }
});

// 22. Evidence ledger
router.get('/sessions/:sessionId/evidence', denyDeniedRoles, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const ledger = await getTask033EvidenceLedger(sessionId);
    res.json(ledger);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to retrieve evidence ledger', ['EVIDENCE_LEDGER_FAILED']);
  }
});

// 23. Diagnostics
router.get('/sessions/:sessionId/diagnostics', denyDeniedRoles, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const diagnostics = await runTask033Diagnostics(sessionId);
    res.json(diagnostics);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to run diagnostics', ['DIAGNOSTICS_FAILED']);
  }
});

// 24. Generate report
router.post('/sessions/:sessionId/report', requireAdminOperator, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const report = await generateTask033Report(sessionId);
    res.json(report);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to generate report', ['REPORT_GENERATION_FAILED']);
  }
});

// 25. Latest report
router.get('/reports/latest', denyDeniedRoles, async (_req: Request, res: Response) => {
  try {
    const report = await getLatestTask033Report();
    res.json(report);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to retrieve latest report', ['LATEST_REPORT_FAILED']);
  }
});

// 26. Pause session
router.post('/sessions/:sessionId/pause', requireAdminOperator, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await pauseTask033Observation(sessionId);
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to pause observation session', ['PAUSE_SESSION_FAILED']);
  }
});

// 27. Kill switch
router.post('/sessions/:sessionId/kill-switch', requireAdminOperator, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await enableTask033KillSwitch(sessionId);
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to enable kill switch', ['KILL_SWITCH_FAILED']);
  }
});

// 28. Rollback
router.post('/sessions/:sessionId/rollback', requireAdminOperator, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await requestTask033Rollback(sessionId);
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to request rollback', ['ROLLBACK_REQUEST_FAILED']);
  }
});

export default router;
