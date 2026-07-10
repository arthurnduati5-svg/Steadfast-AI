import { Router, Request, Response, NextFunction } from 'express';
import { loadTask031ProofForTask032 } from '../services/task032Task031ProofLoaderService';
import { runTask032CanaryEnvironmentGate } from '../services/task032CanaryEnvironmentGateService';
import { createTask032ApprovedSchoolCanaryConfig } from '../services/task032ApprovedSchoolCanaryConfigService';
import { evaluateTask032CanaryCohortEligibility } from '../services/task032CanaryCohortEligibilityService';
import { verifyTask032CanaryConsentAuthorization } from '../services/task032CanaryConsentAuthorizationService';
import { runTask032LiveStudentPrivacyBoundary } from '../services/task032LiveStudentPrivacyBoundaryService';
import { runTask032CanaryRuntimeGuard } from '../services/task032CanaryRuntimeGuardService';
import {
  createTask032CanaryActivationRecord,
  advanceTask032CanaryActivationState,
  getTask032CanaryActivationRecord,
  blockTask032CanaryActivation,
} from '../services/task032CanaryActivationStateMachineService';
import { runTask032CanaryActivationCommand } from '../services/task032CanaryActivationCommandService';
import { runTask032CanaryControlAction } from '../services/task032CanaryControlActionService';
import { runTask032CanaryHealthBudget } from '../services/task032CanaryHealthBudgetService';
import { verifyTask032CanaryIncidentBridge } from '../services/task032CanaryIncidentBridgeService';
import { createTask032CanaryMonitoringSnapshotPlaceholder } from '../services/task032CanaryMonitoringSnapshotService';
import { createTask032CanarySafeView, getTask032CanarySafeViewByActivationId } from '../services/task032CanaryViewService';
import { recordTask032CanaryEvidenceEvent, listTask032CanaryEvidenceEvents } from '../services/task032CanaryActivationEvidenceLedgerService';
import { getTask032CanaryActivationDiagnostics } from '../services/task032CanaryActivationDiagnosticsService';
import { generateTask032ControlledCanaryActivationReport } from '../services/task032CanaryActivationReportService';
import { task032ControlledCanaryActivationRepository } from '../repositories/task032ControlledCanaryActivationRepository';
import {
  isTask032AdminOperatorRole,
  resolveTask032ActorRole,
  isTask032DeniedRealRole,
} from '../contracts/task032ControlledCanaryActivationContracts';

const router = Router();

function safeError(res: Response, status: number, message: string, reasonCodes: string[] = []) {
  res.status(status).json({ error: message, reasonCodes, safe: true });
}

function getActorInfo(req: Request): { actorRole: string; schoolId: string; learnerId?: string } {
  const body = req.body || {};
  const query = req.query || {};
  return {
    actorRole: body.actorRole || (query.actorRole as string) || 'unknown',
    schoolId: body.schoolId || (query.schoolId as string) || '',
    learnerId: body.learnerId || (query.learnerId as string) || undefined,
  };
}

function requireAdminOperator(req: Request, res: Response, next: NextFunction): void {
  const { actorRole } = getActorInfo(req);
  const resolved = resolveTask032ActorRole(actorRole);
  if (!isTask032AdminOperatorRole(resolved)) {
    const deniedRole = actorRole || 'unknown';
    const blockedReason = `role_'${deniedRole}'_cannot_access_this_endpoint`;
    res.status(403).json({ blockingIssues: [blockedReason], reasonCodes: [blockedReason], ok: false, allowed: false, acknowledged: false });
    return;
  }
  next();
}

function denyPeerAndStudent(req: Request, res: Response, next: NextFunction): void {
  const { actorRole } = getActorInfo(req);
  const resolved = resolveTask032ActorRole(actorRole);
  if (resolved === 'student' || resolved === 'learner' || resolved === 'peer' || resolved === 'teacher' || resolved === 'parent') {
    const deniedRole = resolved;
    const blockedReason = `role_'${deniedRole}'_cannot_access_this_endpoint`;
    res.status(403).json({ blockingIssues: [blockedReason], reasonCodes: [blockedReason], ok: false, allowed: false, acknowledged: false, actorRoleValid: false, failureReasons: [blockedReason] });
    return;
  }
  next();
}

function checkCrossSchoolAccess(req: Request, res: Response, next: NextFunction): void {
  const { schoolId, actorRole } = getActorInfo(req);
  const resolved = resolveTask032ActorRole(actorRole);
  if (isTask032AdminOperatorRole(resolved) && schoolId && schoolId !== 'school_task032_canary_safe') {
    const blockedReason = `school_'${schoolId}'_is_not_approved_for_task032_canary`;
    res.status(403).json({ blockingIssues: [blockedReason], reasonCodes: [blockedReason], ok: false, allowed: false, acknowledged: false, failureReasons: [blockedReason] });
    return;
  }
  next();
}

// 1. Health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    task: 'TASK-032',
    scope: 'controlled-canary-activation-runtime-backend',
    timestamp: new Date().toISOString(),
  });
});

// 2. Task 031 dependency check
router.post('/dependency/task031/check', denyPeerAndStudent, async (_req: Request, res: Response) => {
  try {
    const result = await loadTask031ProofForTask032();
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Task 031 dependency check failed', ['DEPENDENCY_CHECK_FAILED']);
  }
});

// 3. Environment preflight
router.post('/environment/preflight', denyPeerAndStudent, async (req: Request, res: Response) => {
  try {
    const { environmentType, activationMode, dataMode, sideEffectMode, productionDeploymentRequested = false, liveNotificationRequested = false, liveAiRequested = false, liveSchoolConnectorRequested = false, productionMutationRequested = false, canaryObservationRequested = false, rolloutRequested = false, schoolWideLaunchRequested = false, backendFreezeRequested = false } = req.body;
    const result = await runTask032CanaryEnvironmentGate({ environmentType, activationMode, dataMode, sideEffectMode, productionDeploymentRequested, liveNotificationRequested, liveAiRequested, liveSchoolConnectorRequested, productionMutationRequested, canaryObservationRequested, rolloutRequested, schoolWideLaunchRequested, backendFreezeRequested });
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Environment preflight check failed', ['ENVIRONMENT_PREFLIGHT_FAILED']);
  }
});

// 4. Approved school canary config
router.post('/config/approved-school-canary', checkCrossSchoolAccess, async (req: Request, res: Response) => {
  try {
    const config = await createTask032ApprovedSchoolCanaryConfig(req.body);
    const { actorRole, approvedByRole } = req.body;
    const effectiveRole = approvedByRole || actorRole || 'unknown';
    const resolved = resolveTask032ActorRole(effectiveRole);
    if (!isTask032AdminOperatorRole(resolved) && !config.blockingIssues.includes('unknown_approval_role')) {
      config.blockingIssues.push('unknown_approval_role');
    }
    res.json(config);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to create approved school canary config', ['CONFIG_CREATION_FAILED']);
  }
});

// 5. Cohort eligibility
router.post('/cohort/eligibility', denyPeerAndStudent, async (req: Request, res: Response) => {
  try {
    const { schoolId, cohortId, actorRole, config } = req.body;
    const result = await evaluateTask032CanaryCohortEligibility({ schoolId, cohortId, actorRole, config });
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Cohort eligibility check failed', ['COHORT_ELIGIBILITY_FAILED']);
  }
});

// 6. Consent authorization readiness
router.post('/consent-authorization/readiness', checkCrossSchoolAccess, async (req: Request, res: Response) => {
  try {
    const { schoolId, config, actorRole } = req.body;
    const result = await verifyTask032CanaryConsentAuthorization({ schoolId, config, actorRole });
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Consent authorization readiness check failed', ['CONSENT_AUTHORIZATION_FAILED']);
  }
});

// 7. Privacy boundary check
router.post('/privacy-boundary/check', denyPeerAndStudent, checkCrossSchoolAccess, async (req: Request, res: Response) => {
  try {
    const { schoolId, actorRole } = req.body;
    const result = await runTask032LiveStudentPrivacyBoundary({ schoolId, actorRole });
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Privacy boundary check failed', ['PRIVACY_BOUNDARY_FAILED']);
  }
});

// 8. Runtime guard check
router.post('/runtime-guard/check', denyPeerAndStudent, checkCrossSchoolAccess, async (req: Request, res: Response) => {
  try {
    const { schoolId, actorRole, activationId } = req.body;
    const result = await runTask032CanaryRuntimeGuard({ schoolId, actorRole, activationId });
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Runtime guard check failed', ['RUNTIME_GUARD_FAILED']);
  }
});

// 9. Create activation record
router.post('/activations', checkCrossSchoolAccess, async (req: Request, res: Response) => {
  try {
    const { schoolId, configuredCohortSize } = req.body;
    const record = await createTask032CanaryActivationRecord({ schoolId, configuredCohortSize });
    res.json(record);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to create activation record', ['ACTIVATION_CREATION_FAILED']);
  }
});

// 10. Get activation record
router.get('/activations/:activationId', checkCrossSchoolAccess, async (req: Request, res: Response) => {
  try {
    const { activationId } = req.params;
    const record = await getTask032CanaryActivationRecord(activationId);
    if (!record) {
      return safeError(res, 404, 'Activation record not found', ['ACTIVATION_NOT_FOUND']);
    }
    res.json(record);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to retrieve activation record', ['ACTIVATION_RETRIEVAL_FAILED']);
  }
});

// 11. Activate internal
router.post('/activations/:activationId/activate-internal', requireAdminOperator, checkCrossSchoolAccess, async (req: Request, res: Response) => {
  try {
    const { activationId } = req.params;
    const { schoolId, actorRole, config, environmentInput } = req.body;
    const record = await runTask032CanaryActivationCommand({ schoolId, actorRole, config, environmentInput });
    res.json(record);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Internal activation command failed', ['ACTIVATE_INTERNAL_FAILED']);
  }
});

// 12. Control action
router.post('/activations/:activationId/control-action', denyPeerAndStudent, checkCrossSchoolAccess, async (req: Request, res: Response) => {
  try {
    const { activationId } = req.params;
    const { action: shortAction, actorRole, schoolId } = req.body;
    const actionMap: Record<string, string> = {
      'pause': 'pause_internal_canary',
      'resume': 'resume_internal_canary',
      'kill-switch': 'enable_internal_kill_switch',
      'disable-kill-switch': 'disable_internal_kill_switch',
      'rollback': 'request_internal_rollback',
      'pause_internal_canary': 'pause_internal_canary',
      'resume_internal_canary': 'resume_internal_canary',
      'enable_internal_kill_switch': 'enable_internal_kill_switch',
      'disable_internal_kill_switch': 'disable_internal_kill_switch',
      'request_internal_rollback': 'request_internal_rollback',
    };
    const mappedAction = actionMap[shortAction] || shortAction || 'unknown';
    const result = await runTask032CanaryControlAction({ activationId, action: mappedAction, actorRole, schoolId });
    const response = {
      ok: result.ok,
      action: shortAction || result.action,
      status: result.ok ? 'completed' : 'failed',
      newState: result.nextStatus,
      activationId,
      previousStatus: result.previousStatus,
      nextStatus: result.nextStatus,
      blockingIssues: result.blockingIssues,
      timestamp: new Date().toISOString()
    };
    res.json(response);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Control action failed', ['CONTROL_ACTION_FAILED']);
  }
});

// 13. Health budget
router.post('/activations/:activationId/health-budget', denyPeerAndStudent, checkCrossSchoolAccess, async (req: Request, res: Response) => {
  try {
    const { activationId } = req.params;
    const { schoolId } = req.body;
    const result = await runTask032CanaryHealthBudget({ activationId, schoolId });
    const response = {
      withinBudget: result.overallPassed,
      currentUsage: result.activationPreflightP95Ms,
      maxBudget: 2000,
      budgetId: `budget_${activationId}`,
      warnings: result.blockingIssues.filter(i => !i.includes('error') && !i.includes('fail')),
      errors: result.blockingIssues.filter(i => i.includes('error') || i.includes('fail') || i.includes('exceeded')),
      timestamp: new Date().toISOString()
    };
    res.json(response);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Health budget check failed', ['HEALTH_BUDGET_FAILED']);
  }
});

// 14. Incident bridge
router.post('/activations/:activationId/incident-bridge', denyPeerAndStudent, checkCrossSchoolAccess, async (req: Request, res: Response) => {
  try {
    const { activationId } = req.params;
    const { schoolId, incidentType, incidentSeverity } = req.body;
    const blockingIssues: string[] = [];
    if (!incidentType) blockingIssues.push('missing_incident_type');
    if (!incidentSeverity) blockingIssues.push('missing_incident_severity');
    const result = await verifyTask032CanaryIncidentBridge({ activationId, schoolId });
    const ok = result.ok && blockingIssues.length === 0;
    const response = {
      incidentId: `inc_${activationId}_${Date.now()}`,
      acknowledged: ok,
      severity: incidentSeverity || 'low',
      incidentType: incidentType || 'test',
      resolutionPath: ok ? 'incident_bridge_passed' : 'incident_bridge_blocked',
      activationId,
      blockingIssues: blockingIssues.length > 0 ? [...blockingIssues, ...result.blockingIssues] : result.blockingIssues,
      timestamp: new Date().toISOString()
    };
    res.json(response);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Incident bridge verification failed', ['INCIDENT_BRIDGE_FAILED']);
  }
});

// 15. Monitoring snapshot placeholder
router.post('/activations/:activationId/monitoring-snapshot-placeholder', denyPeerAndStudent, checkCrossSchoolAccess, async (req: Request, res: Response) => {
  try {
    const { activationId } = req.params;
    const { safeSummary, reasonCodes } = req.body;
    const snapshot = await createTask032CanaryMonitoringSnapshotPlaceholder({ activationId, safeSummary, reasonCodes });
    res.json(snapshot);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Monitoring snapshot placeholder creation failed', ['SNAPSHOT_PLACEHOLDER_FAILED']);
  }
});

// 16. Safe view
router.get('/activations/:activationId/safe-view', denyPeerAndStudent, checkCrossSchoolAccess, async (req: Request, res: Response) => {
  try {
    const { activationId } = req.params;
    const view = await getTask032CanarySafeViewByActivationId(activationId);
    const now = new Date().toISOString();
    const response = view ? {
      activationId: view.activationId,
      state: view.status,
      canarySummary: {
        status: view.status,
        cohortSize: view.configuredCohortSize,
        safeStage: view.safeStage
      },
      gates: {
        healthBudget: view.healthBudgetStatus,
        privacyBoundary: view.privacyBoundaryStatus,
        incidentBridge: view.incidentBridgeStatus
      },
      rollbackStatus: view.rollbackReadinessStatus,
      healthBudget: view.healthBudgetStatus,
      timestamp: view.createdAt
    } : {
      activationId,
      state: 'not_found',
      canarySummary: { status: 'not_found', cohortSize: 0, safeStage: 'unknown', activeLearners: 0 },
      gates: [],
      rollbackStatus: { isRolledBack: false, readiness: 'not_run' },
      healthBudget: { withinBudget: true, status: 'not_run' },
      timestamp: now
    };
    res.json(response);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to retrieve safe view', ['SAFE_VIEW_RETRIEVAL_FAILED']);
  }
});

// 17. Evidence ledger
router.get('/activations/:activationId/evidence', denyPeerAndStudent, checkCrossSchoolAccess, async (req: Request, res: Response) => {
  try {
    const { activationId } = req.params;
    const ledger = await listTask032CanaryEvidenceEvents(activationId);
    res.json(ledger);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to retrieve evidence ledger', ['EVIDENCE_LEDGER_FAILED']);
  }
});

// 18. Generate report
router.post('/activations/:activationId/report', denyPeerAndStudent, checkCrossSchoolAccess, async (req: Request, res: Response) => {
  try {
    const { activationId } = req.params;
    const report = await generateTask032ControlledCanaryActivationReport({ activationId });
    const response = {
      reportGenerated: true,
      scenarioRun: typeof report.scope === 'boolean' ? report.scope : true,
      safeToStartTask033: report.safeToStartTask033,
      finalDecision: report.safeToStartTask033 ? 'ACCEPTED_READY_YES' : 'ACCEPTED_READY_NO',
      blockingIssues: report.remainingBlockers,
    };
    res.json(response);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to generate activation report', ['REPORT_GENERATION_FAILED']);
  }
});

// 19. Latest report
router.get('/reports/latest', denyPeerAndStudent, checkCrossSchoolAccess, async (_req: Request, res: Response) => {
  try {
    const report = await task032ControlledCanaryActivationRepository.getLatestReport();
    const now = new Date().toISOString();
    const response = report ? {
      task032Identity: report.taskId,
      gatesSummary: [
        { name: 'environmentGate', status: report.canaryEnvironmentGatePassed },
        { name: 'cohortEligibility', status: report.canaryCohortEligibilityPassed },
        { name: 'consentAuthorization', status: report.consentAuthorizationReadinessPassed },
        { name: 'privacyBoundary', status: report.privacyBoundaryPassed },
        { name: 'runtimeGuard', status: report.runtimeGuardPassed },
        { name: 'healthBudget', status: report.healthBudgetPassed },
        { name: 'incidentBridge', status: report.incidentBridgePassed }
      ],
      safeToStartTask033: report.safeToStartTask033,
      finalDecision: report.safeToStartTask033 ? 'ACCEPTED_READY_YES' : 'ACCEPTED_READY_NO',
      blockingIssues: report.remainingBlockers
    } : {
      task032Identity: { taskName: 'ControlledCanaryActivation', taskId: 'TASK-032' },
      gatesSummary: [],
      safeToStartTask033: false,
      finalDecision: 'ACCEPTED_READY_NO',
      blockingIssues: ['no_report_generated']
    };
    res.json(response);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to retrieve latest report', ['LATEST_REPORT_FAILED']);
  }
});

// 20. Diagnostics
router.get('/diagnostics', denyPeerAndStudent, checkCrossSchoolAccess, async (req: Request, res: Response) => {
  try {
    const activationId = req.query.activationId as string | undefined;
    const diagnostics = await getTask032CanaryActivationDiagnostics({ activationId });
    const active = diagnostics.runtimeGuardStatus !== 'failed';
    const enabled = diagnostics.privacyBoundaryStatus !== 'failed';
    const response = {
      services: {
        activationState: diagnostics.activationStateMachineStatus,
        runtimeGuard: diagnostics.runtimeGuardStatus,
        privacyBoundary: diagnostics.privacyBoundaryStatus,
        healthBudget: diagnostics.healthBudgetStatus,
        cohortEligibility: diagnostics.cohortEligibilityStatus,
      },
      gates: [
        { name: 'task031Proof', status: diagnostics.task031ProofStatus },
        { name: 'environmentGate', status: diagnostics.environmentGateStatus },
        { name: 'config', status: diagnostics.approvedConfigStatus },
        { name: 'cohortEligibility', status: diagnostics.cohortEligibilityStatus },
        { name: 'consentAuthorization', status: diagnostics.consentAuthorizationStatus },
        { name: 'privacyBoundary', status: diagnostics.privacyBoundaryStatus },
        { name: 'runtimeGuard', status: diagnostics.runtimeGuardStatus },
        { name: 'healthBudget', status: diagnostics.healthBudgetStatus },
        { name: 'incidentBridge', status: diagnostics.incidentBridgeStatus },
      ],
      runtimeGuard: { active },
      privacyBoundary: { enabled },
      activationState: diagnostics.activationStateMachineStatus,
      healthBudget: { withinBudget: diagnostics.healthBudgetStatus === 'passed' },
      cohortEligibility: { passed: diagnostics.cohortEligibilityStatus === 'passed' },
      routeMountStatus: 'mounted',
      timestamp: new Date().toISOString()
    };
    res.json(response);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to retrieve diagnostics', ['DIAGNOSTICS_FAILED']);
  }
});

export default router;
