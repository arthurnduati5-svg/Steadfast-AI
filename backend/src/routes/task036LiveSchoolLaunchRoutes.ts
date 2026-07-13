import { Router, Request, Response } from 'express';
import {
  resolveTask036ActorRole,
  isTask036LaunchOperatorRole,
  isTask036DeniedRole,
  createTask036SafeId,
  createTask036SafeTimestamp,
  Task036LaunchActorRole,
  Task036LaunchEnvironmentGateInput,
  Task036LaunchWindowInput,
  Task036LaunchApprovalInput,
  Task036SingleSchoolScopeInput,
  Task036LaunchEventInput,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { loadTask035Proof } from '../services/task036Task035ProofLoaderService';
import { evaluateEnvironmentGate } from '../services/task036LaunchEnvironmentGateService';
import { validateLaunchWindow } from '../services/task036LaunchWindowService';
import { validateLaunchApproval } from '../services/task036LaunchApprovalService';
import { validateSingleSchoolScope } from '../services/task036SingleSchoolScopeService';
import { initializeSession, transitionState, getCurrentState } from '../services/task036LiveLaunchStateMachineService';
import { executeTask035ProofCheck, executeEnvironmentPreflight, executeLaunchWindowCheck, executeApprovalCheck, executeSingleSchoolScopeCheck } from '../services/task036LiveLaunchCommandService';
import { intakeEvent, getSafeSummary, getEventsBySession } from '../services/task036LaunchEventIntakeService';
import { computeRuntimeMonitoring } from '../services/task036RuntimeMonitoringService';
import { computeHealthBudget } from '../services/task036HealthBudgetService';
import { checkIncidentReadiness } from '../services/task036IncidentReadinessService';
import { pauseLaunch } from '../services/task036PauseControlService';
import { requestRollback } from '../services/task036RollbackControlService';
import { enableKillSwitch } from '../services/task036KillSwitchControlService';
import { checkPrivacyBoundary } from '../services/task036PrivacyBoundaryService';
import { checkContentGovernance } from '../services/task036ContentGovernanceService';
import { checkSocraticIntegrity } from '../services/task036SocraticIntegrityService';
import { checkDeenBoundary } from '../services/task036DeenBoundaryService';
import { checkSchoolIdentity } from '../services/task036SchoolIdentityService';
import { checkCrossSchoolDenial } from '../services/task036CrossSchoolDenialService';
import { buildSafeLaunchReadModel } from '../services/task036SafeLaunchReadModelService';
import { getEvidenceLedger } from '../services/task036EvidenceLedgerService';
import { computeDiagnostics } from '../services/task036DiagnosticsService';
import { computeFinalLaunchDecision } from '../services/task036FinalLaunchDecisionService';
import { generateReport } from '../services/task036LiveSchoolLaunchReportService';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

const router = Router();

function safeJson(res: Response, data: Record<string, unknown>, status = 200): void {
  const unsafeKeys = ['authorization', 'cookie', 'token', 'secret', 'password', 'apiKey', 'rawLearnerData', 'rawChat', 'rawAnswer', 'parentContact', 'teacherPrivateNote', 'providerPayload', 'hiddenReasoning', 'privateDeenText', 'answerKey', 'markingScheme', 'rawSafeguardingNote', 'studentPhone', 'studentEmail', 'parentPhone', 'parentEmail'];
  const safe = { ...data };
  for (const key of unsafeKeys) {
    delete safe[key];
  }
  res.status(status).json(safe);
}

function getRole(req: Request): Task036LaunchActorRole {
  return resolveTask036ActorRole(String((req as any).actorRole || req.headers['x-actor-role'] || 'unknown'));
}

function denyDeniedRole(role: Task036LaunchActorRole, res: Response): boolean {
  if (isTask036DeniedRole(role)) {
    res.status(403).json({ error: 'access_denied_role_not_permitted', role });
    return true;
  }
  return false;
}

function requireOperatorRole(role: Task036LaunchActorRole, res: Response): boolean {
  if (!isTask036LaunchOperatorRole(role)) {
    res.status(403).json({ error: 'access_denied_operator_role_required', role });
    return true;
  }
  return false;
}

router.get('/health', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (isTask036DeniedRole(role)) {
      return safeJson(res, { error: 'access_denied', role }, 403);
    }
    safeJson(res, {
      status: 'live_launch_gate_active',
      role,
      launchId: 'live_launch_task036_safe',
      schoolId: 'school_task036_single_school_safe',
      mode: 'controlled_single_school_live_launch_simulation',
    });
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Health check failed' }, 500);
  }
});

router.post('/dependency/task035/check', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireOperatorRole(role, res)) return;
    const proof = loadTask035Proof();
    safeJson(res, proof as unknown as Record<string, unknown>);
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Task035 dependency check failed' }, 500);
  }
});

router.post('/environment/preflight', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireOperatorRole(role, res)) return;
    const input = req.body as Task036LaunchEnvironmentGateInput;
    const result = await evaluateEnvironmentGate(input);
    safeJson(res, result as unknown as Record<string, unknown>);
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Environment preflight failed' }, 500);
  }
});

router.post('/launch-window/check', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireOperatorRole(role, res)) return;
    const input = req.body as Task036LaunchWindowInput;
    const result = await validateLaunchWindow(input);
    safeJson(res, result as unknown as Record<string, unknown>);
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Launch window check failed' }, 500);
  }
});

router.post('/approval/check', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireOperatorRole(role, res)) return;
    const input = req.body as Task036LaunchApprovalInput;
    const result = await validateLaunchApproval(input);
    safeJson(res, result as unknown as Record<string, unknown>);
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Approval check failed' }, 500);
  }
});

router.post('/single-school-scope/check', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireOperatorRole(role, res)) return;
    const input = req.body as Task036SingleSchoolScopeInput;
    const result = await validateSingleSchoolScope(input);
    safeJson(res, result as unknown as Record<string, unknown>);
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Single school scope check failed' }, 500);
  }
});

router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireOperatorRole(role, res)) return;
    const { schoolId, tenantId } = req.body as { schoolId?: string; tenantId?: string };
    const session = await initializeSession(schoolId || 'school_task036_safe', tenantId || 'tenant_task036_safe', role);
    safeJson(res, {
      sessionId: session.sessionId,
      schoolId: session.schoolId,
      tenantId: session.tenantId,
      status: session.status,
      createdAt: session.createdAt,
    });
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Session creation failed' }, 500);
  }
});

router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (isTask036DeniedRole(role)) {
      return safeJson(res, { error: 'access_denied', role }, 403);
    }
    const session = await getCurrentState(req.params.sessionId);
    if (!session) {
      return safeJson(res, { error: 'session_not_found' }, 404);
    }
    safeJson(res, {
      sessionId: session.sessionId,
      schoolId: session.schoolId,
      tenantId: session.tenantId,
      status: session.status,
      launchWindowId: session.launchWindowId,
      approvalId: session.approvalId,
      operatorId: session.operatorId,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      blockingIssues: session.blockingIssues,
    });
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Failed to get session' }, 500);
  }
});

router.post('/sessions/:sessionId/start-controlled-launch', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireOperatorRole(role, res)) return;
    const session = await getCurrentState(req.params.sessionId);
    if (!session) {
      return safeJson(res, { error: 'session_not_found' }, 404);
    }
    const result = await transitionState(session.sessionId, session.status, 'launch_active_controlled');
    if (!result.ok) {
      return safeJson(res, { error: 'state_transition_failed', blockingIssues: result.blockingIssues }, 400);
    }
    safeJson(res, {
      sessionId: result.session!.sessionId,
      status: result.session!.status,
      updatedAt: result.session!.updatedAt,
    });
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Failed to start controlled launch' }, 500);
  }
});

router.post('/sessions/:sessionId/events', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (isTask036DeniedRole(role)) {
      return safeJson(res, { error: 'access_denied', role }, 403);
    }
    const session = await getCurrentState(req.params.sessionId);
    if (!session) {
      return safeJson(res, { error: 'session_not_found' }, 404);
    }
    const input: Task036LaunchEventInput = req.body || {};
    const event = intakeEvent(session.sessionId, input);
    safeJson(res, {
      eventId: event.eventId,
      sessionId: event.sessionId,
      eventType: event.eventType,
      safeSummary: event.safeSummary,
      timestamp: event.timestamp,
    });
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Failed to intake event' }, 500);
  }
});

router.get('/sessions/:sessionId/events/safe-summary', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (isTask036DeniedRole(role)) {
      return safeJson(res, { error: 'access_denied', role }, 403);
    }
    const session = await getCurrentState(req.params.sessionId);
    if (!session) {
      return safeJson(res, { error: 'session_not_found' }, 404);
    }
    const summary = getSafeSummary(session.sessionId);
    const events = getEventsBySession(session.sessionId);
    safeJson(res, { sessionId: session.sessionId, safeSummary: summary, eventCount: events.length });
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Failed to get safe summary' }, 500);
  }
});

router.post('/sessions/:sessionId/runtime-monitoring', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireOperatorRole(role, res)) return;
    const session = await getCurrentState(req.params.sessionId);
    if (!session) {
      return safeJson(res, { error: 'session_not_found' }, 404);
    }
    const result = await computeRuntimeMonitoring(session.sessionId);
    safeJson(res, result as unknown as Record<string, unknown>);
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Runtime monitoring failed' }, 500);
  }
});

router.post('/sessions/:sessionId/health-budget', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireOperatorRole(role, res)) return;
    const session = await getCurrentState(req.params.sessionId);
    if (!session) {
      return safeJson(res, { error: 'session_not_found' }, 404);
    }
    const result = await computeHealthBudget(session.sessionId);
    safeJson(res, result as unknown as Record<string, unknown>);
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Health budget evaluation failed' }, 500);
  }
});

router.post('/sessions/:sessionId/incident-readiness', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireOperatorRole(role, res)) return;
    const session = await getCurrentState(req.params.sessionId);
    if (!session) {
      return safeJson(res, { error: 'session_not_found' }, 404);
    }
    const result = await checkIncidentReadiness(session.sessionId);
    safeJson(res, result as unknown as Record<string, unknown>);
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Incident readiness evaluation failed' }, 500);
  }
});

router.post('/sessions/:sessionId/pause', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireOperatorRole(role, res)) return;
    const session = await getCurrentState(req.params.sessionId);
    if (!session) {
      return safeJson(res, { error: 'session_not_found' }, 404);
    }
    const pauseReasonCodes: string[] = (req.body as any)?.pauseReasonCodes || ['operator_initiated_pause'];
    const result = await pauseLaunch(session.sessionId, pauseReasonCodes);
    safeJson(res, result as unknown as Record<string, unknown>);
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Pause execution failed' }, 500);
  }
});

router.post('/sessions/:sessionId/rollback', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireOperatorRole(role, res)) return;
    const session = await getCurrentState(req.params.sessionId);
    if (!session) {
      return safeJson(res, { error: 'session_not_found' }, 404);
    }
    const rollbackReasonCodes: string[] = (req.body as any)?.rollbackReasonCodes || ['operator_initiated_rollback'];
    const result = await requestRollback(session.sessionId, rollbackReasonCodes);
    safeJson(res, result as unknown as Record<string, unknown>);
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Rollback execution failed' }, 500);
  }
});

router.post('/sessions/:sessionId/kill-switch', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireOperatorRole(role, res)) return;
    const session = await getCurrentState(req.params.sessionId);
    if (!session) {
      return safeJson(res, { error: 'session_not_found' }, 404);
    }
    const killSwitchReasonCodes: string[] = (req.body as any)?.killSwitchReasonCodes || ['operator_initiated_kill_switch'];
    const result = await enableKillSwitch(session.sessionId, killSwitchReasonCodes);
    safeJson(res, result as unknown as Record<string, unknown>);
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Kill switch execution failed' }, 500);
  }
});

router.post('/sessions/:sessionId/privacy-boundary', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireOperatorRole(role, res)) return;
    const session = await getCurrentState(req.params.sessionId);
    if (!session) {
      return safeJson(res, { error: 'session_not_found' }, 404);
    }
    const result = await checkPrivacyBoundary(session.sessionId);
    safeJson(res, result as unknown as Record<string, unknown>);
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Privacy boundary evaluation failed' }, 500);
  }
});

router.post('/sessions/:sessionId/content-governance', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireOperatorRole(role, res)) return;
    const session = await getCurrentState(req.params.sessionId);
    if (!session) {
      return safeJson(res, { error: 'session_not_found' }, 404);
    }
    const result = await checkContentGovernance(session.sessionId);
    safeJson(res, result as unknown as Record<string, unknown>);
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Content governance evaluation failed' }, 500);
  }
});

router.post('/sessions/:sessionId/socratic-integrity', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireOperatorRole(role, res)) return;
    const session = await getCurrentState(req.params.sessionId);
    if (!session) {
      return safeJson(res, { error: 'session_not_found' }, 404);
    }
    const result = await checkSocraticIntegrity(session.sessionId);
    safeJson(res, result as unknown as Record<string, unknown>);
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Socratic integrity evaluation failed' }, 500);
  }
});

router.post('/sessions/:sessionId/deen-boundary', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireOperatorRole(role, res)) return;
    const session = await getCurrentState(req.params.sessionId);
    if (!session) {
      return safeJson(res, { error: 'session_not_found' }, 404);
    }
    const result = await checkDeenBoundary(session.sessionId);
    safeJson(res, result as unknown as Record<string, unknown>);
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Deen boundary evaluation failed' }, 500);
  }
});

router.post('/sessions/:sessionId/school-identity', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireOperatorRole(role, res)) return;
    const session = await getCurrentState(req.params.sessionId);
    if (!session) {
      return safeJson(res, { error: 'session_not_found' }, 404);
    }
    const result = await checkSchoolIdentity(session.sessionId);
    safeJson(res, result as unknown as Record<string, unknown>);
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'School identity evaluation failed' }, 500);
  }
});

router.post('/sessions/:sessionId/cross-school-denial', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireOperatorRole(role, res)) return;
    const session = await getCurrentState(req.params.sessionId);
    if (!session) {
      return safeJson(res, { error: 'session_not_found' }, 404);
    }
    const result = await checkCrossSchoolDenial(session.sessionId);
    safeJson(res, result as unknown as Record<string, unknown>);
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Cross-school denial evaluation failed' }, 500);
  }
});

router.get('/sessions/:sessionId/safe-view', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (isTask036DeniedRole(role)) {
      return safeJson(res, { error: 'access_denied', role }, 403);
    }
    const session = await getCurrentState(req.params.sessionId);
    if (!session) {
      return safeJson(res, { error: 'session_not_found' }, 404);
    }
    const readModel = await buildSafeLaunchReadModel(session.sessionId);
    safeJson(res, readModel as unknown as Record<string, unknown>);
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Failed to build safe view' }, 500);
  }
});

router.get('/sessions/:sessionId/evidence', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (isTask036DeniedRole(role)) {
      return safeJson(res, { error: 'access_denied', role }, 403);
    }
    const session = await getCurrentState(req.params.sessionId);
    if (!session) {
      return safeJson(res, { error: 'session_not_found' }, 404);
    }
    const ledger = await getEvidenceLedger(session.sessionId);
    safeJson(res, ledger as unknown as Record<string, unknown>);
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Failed to build evidence ledger' }, 500);
  }
});

router.get('/sessions/:sessionId/diagnostics', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (isTask036DeniedRole(role)) {
      return safeJson(res, { error: 'access_denied', role }, 403);
    }
    const session = await getCurrentState(req.params.sessionId);
    if (!session) {
      return safeJson(res, { error: 'session_not_found' }, 404);
    }
    const diagnostics = await computeDiagnostics(session.sessionId);
    safeJson(res, diagnostics as unknown as Record<string, unknown>);
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Failed to build diagnostics' }, 500);
  }
});

router.post('/sessions/:sessionId/final-launch-decision', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireOperatorRole(role, res)) return;
    const session = await getCurrentState(req.params.sessionId);
    if (!session) {
      return safeJson(res, { error: 'session_not_found' }, 404);
    }
    const decision = await computeFinalLaunchDecision(session.sessionId);
    safeJson(res, decision as unknown as Record<string, unknown>);
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Final launch decision failed' }, 500);
  }
});

router.post('/sessions/:sessionId/report', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireOperatorRole(role, res)) return;
    const session = await getCurrentState(req.params.sessionId);
    if (!session) {
      return safeJson(res, { error: 'session_not_found' }, 404);
    }
    const report = await generateReport(session.sessionId);
    safeJson(res, report as unknown as Record<string, unknown>);
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Report generation failed' }, 500);
  }
});

router.get('/reports/latest', async (req: Request, res: Response) => {
  try {
    const role = getRole(req);
    if (denyDeniedRole(role, res)) return;
    if (requireOperatorRole(role, res)) return;
    const report = task036Repository.getLatestReport();
    if (!report) {
      return safeJson(res, { error: 'no_reports_available' }, 404);
    }
    safeJson(res, report as unknown as Record<string, unknown>);
  } catch (err) {
    safeJson(res, { error: 'internal_error', message: 'Failed to get latest report' }, 500);
  }
});

export default router;
